# Model Portfolio Architecture

> **Last updated:** 2026-05-07  
> **Branch:** feature/sdk-plus-config-ui  
> **Covers:** Mobile app (Alphab2bapp), Web frontend (prod-alphaquark-github), Backend (aq_backend_github), and ccxt-india

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Map](#2-component-map)
3. [MongoDB Schemas](#3-mongodb-schemas)
4. [Subscribe / Unsubscribe Flow](#4-subscribe--unsubscribe-flow)
5. [Rebalance Flow (Calculate → Execute)](#5-rebalance-flow-calculate--execute)
6. [Failure Handling & Repair](#6-failure-handling--repair)
7. [Manual Override](#7-manual-override)
8. [DB Update Chain (Post-Execution)](#8-db-update-chain-post-execution)
9. [Refresh & Status Polling](#9-refresh--status-polling)
10. [Broker Migration Flow](#10-broker-migration-flow)
11. [Performance & P&L](#11-performance--pl)
12. [SDK Integration (Phase C/D)](#12-sdk-integration-phase-cd)
13. [API Endpoint Reference](#13-api-endpoint-reference)
14. [Web vs Mobile Differences](#14-web-vs-mobile-differences)
15. [State Management](#15-state-management)
16. [Security & Encryption](#16-security--encryption)
17. [Known Limitations](#17-known-limitations)

---

## 1. System Overview

Model Portfolio (MP) is a strategy-subscription product where an advisor curates a basket of stocks (a "model portfolio"), users subscribe and pay, and then periodically execute rebalancing trades to align their actual holdings with the target allocation.

**Three tiers of data:**
- **Model tier**: advisor-owned target allocation, stored in `model_portfolio` collection via `aq_backend_github`
- **Subscription tier**: user's payment record and subscription status, stored in `subscriptions` collection
- **Execution tier**: user's actual executed trades per broker, stored in `model_portfolio_user` collection via ccxt-india

**Four server boundaries:**
| Server | Role | Auth |
|--------|------|------|
| `server.alphaquark.in` (aq_backend_github) | Business logic, subscriptions, MP metadata | JWT / session |
| `ccxtprod.alphaquark.in` (ccxt-india) | Broker order execution, rebalance calculation, status queue | `aq-encrypted-key` header |
| `ccxtprod.alphaquark.in` WebSocket | Live market prices | Socket.IO |
| Broker APIs | Actual order placement | Per-broker OAuth/API key |

---

## 2. Component Map

### Mobile App (`src/`)

```
components/ModelPortfolioComponents/
├── MPCard.js                     # Subscription list card (subscription status logic)
├── MPInvestNowModal.js           # Payment gateway modal (Razorpay/Cashfree/PayU/IAP/Play)
├── MPReviewTradeModal.js         # Trade execution modal (main rebalance executor)
├── UserStrategySubscribeModal.js # Subscribe + initial investment calculation
├── RecommendationSuccessModal.js # Post-execution results + manual override
├── HoldingsMigrationModal.js     # Broker migration UI
└── (shared with Rebalance lane):
    RebalanceAdvices.js           # Entry point for rebalance flow
    RebalanceModal.js             # Alternate execution modal (Zerodha publisher support)

screens/Drawer/
└── MPPerformanceScreen.js        # Performance charts + initiate rebalance

services/
└── ModelPortfolioService.js      # All MP API wrappers (248 lines)

screens/
└── TradeContext.js               # Core context — holds modelPortfolioStrategyfinal, basket state
```

### Web App (`src/`)

```
Home/ModelPortfolioSection/
├── ModalPFList.js                # List container (calls subscribed-strategies)
├── ModalPFCard.js                # Individual strategy card (calls strategy details + subscription-raw-amount)
├── RebalanceCard.js              # Rebalance calculation orchestration
├── UpdateRebalanceModal.js       # Trade execution modal
├── MPStatusModal.js              # Post-execution status display
├── DummyBrokerHoldingConfirmation.js  # Manual execution confirmation
└── HoldingsMigrationModal.js     # Broker migration

Home/Strategy/
├── useStrategyDetailsWithPortfolioData.js  # Strategy hook (all data fetching)
├── UserStrategySubscribeModal.js # Subscribe modal
└── TerminateStrategyModal.js     # Unsubscribe flow

services/
└── ModelPFServices.js            # API service layer
```

### Backend (`aq_backend_github`)

```
Routes/
├── modelPortfolio.js             # Mount: /api/model-portfolio
├── modalPortfolioOrderPlace.js   # Mount: /api/model-portfolio-db-update
├── sdk/v1/rebalance.js           # Mount: /sdk/v1/rebalance
├── sdk/v1/portfolios.js          # Mount: /sdk/v1/portfolios
└── sdk/v1/orders/index.js        # Mount: /sdk/v1/orders

Models/
├── modelPortfolioModel.js        # model_portfolio collection
├── modelPortfolioUser.js         # model_portfolio_user collection (strict:false)
├── ModelPortfolioLivePerformance.js  # performance_live_portfolio
└── ModelPortfolioEODPnl.js       # performance_eod_pnl
```

---

## 3. MongoDB Schemas

### 3a. `model_portfolio` Collection

Owned by advisors. Contains strategy definition, target allocation, rebalance history.

```javascript
{
  advisor: String,
  model_name: String,            // "Growth Leaders" — fuzzy-matched on read
  minInvestment: Number,
  maxNetWorth: Number,
  frequency: String,             // "Monthly", "Quarterly"
  nextRebalanceDate: Date,
  subscribed_by: [String],       // Array of user emails (addToSet / pull for atomicity)
  image: String,                 // S3 URL

  model: {
    modelName: String,
    rebalanceHistory: [{
      model_Id: String,          // Unique rebalance event identifier
      rebalanceDate: Date,
      rr_link_mpf: String,       // Research report PDF link
      totalInvestmentvalue: Number,
      adviceEntries: [{
        symbol: String,
        exchange: String,
        value: Number,           // Target weight (%)
        price: Number,
        date: Date,
        status: "pending" | "toExecute" | "executed" | "partial" | "failed",
        manually_placed_at: Date,   // Set when user manually overrides
        actual_quantity: Number,
        actual_price: Number
      }],
      subscriberExecutions: [{
        user_email: String,
        user_broker: String,
        status: "pending" | "toExecute" | "executed" | "partial" | "failed",
        executionDate: Date
      }]
    }]
  },

  graph_history: [{
    stock_list: [{ stock_name, allocated_percentage, price }],
    graph_url: String,
    created_at: Date
  }]
}
```

**Key write operations:**
- `$addToSet: { subscribed_by: email }` — subscribe (atomic, no dupes)
- `$pull: { subscribed_by: email }` — unsubscribe
- `findByIdAndUpdate` on `model.rebalanceHistory[].adviceEntries[].status` — after execution

### 3b. `model_portfolio_user` Collection

Per-user, per-model, **per-broker** execution records. One document = (user × model × broker).

```javascript
{
  email: String,
  model_name: String,
  advisor: String,
  user_broker: String,           // "Zerodha", "Angel One", etc.

  // strict: false — allows ad-hoc fields
  advice_detail: [Mixed],        // Initial recommendations
  advice_executed: [Mixed],      // Full execution history

  user_net_pf_model: [{          // Source of truth for current holdings
    execDate: Date,
    subscription_amount: Number,
    order_results: [{
      symbol: String,
      quantity: Number,
      averagePrice: Number,
      orderStatus: "complete" | "rejected" | "pending",
      exchange: String,
      user_broker: String
    }]
  }],

  user_net_pf_updated: [Mixed],  // Stale reconciliation data (rarely used)

  subscription_amount_raw: [{    // Investment amount history
    amount: Number,
    dateTime: Date
  }],

  ltp_snapshot: {                // Last-seen prices (saves bandwidth, avoids real-time fetch on every load)
    prices: { "RELIANCE": 2500.00, ... },
    timestamp: Date
  }
}
```

**Multi-broker note:** A user who switches brokers gets a NEW document for the new broker. Portfolio-summary queries select the "best" document (prefer connected broker, then latest execution date).

### 3c. `performance_live_portfolio` Collection

Advisor-maintained live portfolio (not per-user). Updated by ccxt-india on every rebalance.

```javascript
{
  _id: String,                   // modelName or advisor+modelName
  advisor: String,
  model_name: String,
  balance_cash: Number,
  securities: [{
    stock: String,
    exchange: String,
    weightage: Number,
    qty: Number,
    avg_entry_price: Number,
    ltp: Number,
    realized_pnl: Number,
    unrealized_pnl: Number,
    corporate_actions: { splits, dividends, symbol_changes }
  }]
}
```

### 3d. `performance_eod_pnl` Collection

End-of-day performance snapshots for charting.

```javascript
{
  date: Date,
  model_name: String,
  advisor: String,
  equity_portfolio_value: Number,
  net_portfolio_value: Number,
  nifty_50: Number,              // Benchmark
  equity_realized_pnl: Number,
  equity_unrealized_pnl: Number,
  cash_balance: Number
}
```

---

## 4. Subscribe / Unsubscribe Flow

### 4a. Subscribe

**Mobile entry point:** `MPCard.js` subscribe button → `MPInvestNowModal.js`  
**Web entry point:** Strategy list → `UserStrategySubscribeModal.js`

```
STEP 1 — Payment
  MPInvestNowModal.js
  ├─ POST /comms/validate-coupon            (optional coupon check)
  ├─ Create payment order (Razorpay/Cashfree/PayU/Google Play/Apple IAP)
  ├─ Digio e-signature (if required)
  └─ POST /comms/validate-payment          (webhook verification)

STEP 2 — Strategy activation
  ├─ PUT /api/model-portfolio/subscribe-strategy/{strategyId}
  │   Body: { email, action: "subscribe" }
  │   MongoDB: $addToSet on model_portfolio.subscribed_by
  │
  └─ POST /rebalance/insert-user-doc       (ccxt-india)
      Body: { userEmail, model, advisor, model_id, userBroker, subscriptionAmountRaw[] }
      Creates model_portfolio_user document

STEP 3 — CRM upsert
  └─ POST /api/add-subscriptions/check-client  (record in CRM)

STEP 4 — Refresh
  └─ TradeContext.getModelPortfolioStrategyDetails()
      GET /api/model-portfolio/subscribed-strategies/{userEmail}
```

**Subscription status computation** (`MPCard.js:getSubscriptionStatus()`):
```
1. Check element.subscription.status
   - 'deleted' → 'none'
   - null expiry → 'active' (lifetime plan)
2. Fallback: match subscriptionData.subscriptions[] by normalized plan name
   - No match || status='deleted' → 'none'
   - daysLeft < 0               → 'expired'
   - 0 < daysLeft ≤ 7           → 'renew'
   - daysLeft > 7               → 'active'
```

### 4b. Unsubscribe

**Mobile:** `TerminateStrategyModal` (if it exists) or via Settings  
**Web:** `TerminateStrategyModal.js` (`Routes/Strategy/TerminateStrategyModal.js`)

```
STEP 1
  PUT /api/model-portfolio/subscribe-strategy/{strategyId}
  Body: { email, action: "unsubscribe" }
  MongoDB: $pull from model_portfolio.subscribed_by

STEP 2 — Optional notifications
  POST /comms/whatsapp/send-template
  POST /comms/telegram/send-template
```

**Important:** Unsubscribing does NOT delete the `model_portfolio_user` document — the user's holdings history is preserved for P&L and audit purposes.

---

## 5. Rebalance Flow (Calculate → Execute)

Rebalancing has three distinct sub-flows on mobile; all converge on the same ccxt-india endpoints.

### 5a. Triggered from MP Performance Screen

```
MPPerformanceScreen.js → calculateRebalance()
  POST /rebalance/calculate (ccxt-india)
  Timeout: 120s
  Payload:
    { userEmail, userBroker, modelName, advisor, model_id,
      userFund, flag:1, useExactAmount:true }
  Response:
    { buy: {symbol: qty}, sell: {symbol: qty},
      uniqueId: string,          ← critical: ties execution to this calculation
      user_net_pf_model: [...],
      availableFunds, requiredFunds }
  ↓
  Opens MPReviewTradeModal
```

### 5b. Triggered from Rebalance Advices Screen

```
RebalanceAdvices.js

  STEP 1: Fetch current holdings
  ─────────────────────────────
  GET /rebalance/user-portfolio/latest/{userEmail}/{modelName}
  Response: { adviceEntries, status: 'toExecute'|'executed', ... }
  ↓
  Show MPStatusModal (holdings review)

  STEP 2: User accepts → calculate
  ─────────────────────────────────
  RebalanceAdvices.handleAcceptRebalance()
  POST /rebalance/calculate  (same as 5a)
  ↓
  Opens RebalanceModal or MPReviewTradeModal
```

### 5c. Order Execution in MPReviewTradeModal

```
MPReviewTradeModal.placeOrder()

  PRE-FLIGHT CHECKS
  ─────────────────
  1. validateBrokerSession(broker, jwtToken)       — token freshness
  2. Check funds object (status 1/2 = expired)
  3. EDIS pre-check for SELL orders:
     Zerodha:   ddpi_status ∈ {'physical','ddpi'} OR is_authorized_for_sell
     Angel One: ddpi_enabled OR is_authorized_for_sell
     Dhan/Fyers: optimistic (rejection triggers TPIN modal)
     Portal:    is_authorized_for_sell

  SURVEILLANCE CHECK (Angel One only)
  ─────────────────────────────────────
  POST /angelone/equity/surveillance
  Payload: [{ symbol, exchange }]
  If any symbol flagged → show warning overlay

  EXECUTE
  ───────
  [REACT_APP_USE_SDK_EXECUTE_ADVICE = true]
    sdkClient.executeAdvice({
      kind: 'mpRebalance',
      clientAdviceId: '{timestamp}-{random}',
      brokerName, modelId, modelName, uniqueId, trades: []
    })
    → SDK POST /sdk/v1/orders/place-rebalance
    → Fallback to legacy /rebalance/process-trade on SDK failure

  [REACT_APP_USE_SDK_EXECUTE_ADVICE = false]
    POST /rebalance/process-trade (ccxt-india)
    Payload:
      { modelName, advisor, model_id, unique_id, user_broker, user_email,
        trades: [{ symbol, qty, exchange, orderType, variant }] }
    Timeout: 120s
    Response:
      { results: [{ orderStatus, tradingSymbol, orderPlacement, quantity,
                    transactionType, exchange, message_aq, sessionExpired? }] }
```

**Trade variant** (`REGULAR` vs `AFTER_HOURS`) is computed at submission time (`tradeVariant.js`) and attached to each trade. The response from process-trade does NOT echo variant back — `RecommendationSuccessModal` resolves it from `originalStockDetails` (passed as prop from the review modal).

---

## 6. Failure Handling & Repair

### 6a. Error Classification

| Error | Detection | Response |
|-------|-----------|----------|
| Network timeout | `error.code === 'ERR_NETWORK' \|\| 'ECONNABORTED'` | Reconnect toast, user retries |
| Auth expired (401/403) | HTTP status | Opens broker re-auth modal |
| All orders rejected | All results have `REJECTED/FAILED` status | Show failure modal |
| Transient service window | `detectTransientOrderWindowError()` — checks `error_code` in response | Soft toast: "markets closed / try later" |
| EDIS/TPIN required | Empty response OR all SELL rejected | Opens per-broker TPIN modal |
| Per-order errors | `error.response.data.orderErrors[]` | Build per-row status from errors |
| Partial fills (IOC) | Mixed SUCCESS/PENDING in results | Show "X of Y filled", retry option |

### 6b. Per-Broker TPIN/EDIS Modals

| Broker | Modal | Trigger |
|--------|-------|---------|
| Zerodha | `DdpiModal` | All SELL rejected |
| Angel One | `AngleOneTpinModal` | All SELL rejected |
| Dhan | `DhanTpinModel` | Pre-flight OR rejection |
| Fyers | `FyersTpinModal` | All SELL rejected |
| Portal brokers (8+) | `OtherBrokerModel` | All SELL rejected |

### 6c. Repair Flow

After a partial execution, the user can request repair trades:

```
POST /rebalance/get-repair (ccxt-india)
Payload: { modelName[], advisor, userEmail, userBroker }
Response: repair trades (delta between executed and target)
```

**⚠️ Current limitation:** The `get-repair` endpoint exists in `ModelPortfolioService.js` but the mobile UI for surfacing these repairs is not yet fully implemented. Web is at parity.

---

## 7. Manual Override

When an order is rejected or fails, the user can manually place it in their broker app and then mark it as executed.

### Mobile: `RecommendationSuccessModal.js:82-95`

```
User taps "Mark as Placed" on a FAILURE row
  → Inline editor: qty, price
  → PUT /api/model-portfolio-db-update/manual-placement
      Body: { userEmail, modelId, uniqueId, symbol, exchange,
              transactionType, actualQty, actualPrice }
  Response:
    { message, symbol, actualQty, actualPrice,
      executionStatus: "executed"|"partial", idempotent: false }
```

**Idempotency:** Re-calling for an already-executed entry returns `idempotent: true` with no DB change. The execution status is recomputed from all `adviceEntries[]` — if all are "executed" → status = "executed", otherwise "partial".

**DB operations:**
1. Find `model_portfolio.model.rebalanceHistory[]` by `model_Id`
2. Flip matching `adviceEntry.status` → "executed"
3. Stamp `manually_placed_at`, `actual_quantity`, `actual_price`
4. Recompute `subscriberExecutions[]` status for this user

---

## 8. DB Update Chain (Post-Execution)

This chain runs after every successful or partial order placement. The mobile SDK route (`/sdk/v1/orders/place-rebalance`) orchestrates all three steps with retry logic.

```
STEP 1 — Record execution in backend
  POST /api/model-portfolio-db-update
  Body: { modelId, orderResults[], modelName, userEmail, user_broker }
  Operations:
    - Finds rebalanceHistory entry by modelId
    - Updates adviceEntries[].status = "executed" for each SUCCESS
    - Creates/updates subscriberExecutions[] for this user+broker
    - Writes to model_portfolio collection

STEP 2 — Update ccxt-india MP dashboard status
  PUT /rebalance/update/subscriber-execution (ccxt-india)
  Body: { model_id, user_email, user_broker, status, executedTrades[] }
  Updates ccxt's internal MP tracking

STEP 3 — Enroll in async status polling
  POST /rebalance/add-user/status-check-queue (ccxt-india)
  Enrolls the user for background order reconciliation
  ccxt-india polls broker order books and reconciles PENDING → COMPLETE/FAILED
```

On SDK path (`/sdk/v1/orders/place-rebalance`):
- All three steps run sequentially inside the route
- Failures in steps 2 or 3 are logged in `_postChain` in the response but do not fail the overall call
- Frontend receives both `results[]` and `_postChain` status

---

## 9. Refresh & Status Polling

### 9a. Initial Load Sequence (mobile `TradeContext.js`)

```
1. loadStoredData()             — read config (3 retries, 1s delay)
2. getUserDetails()             — GET /api/user/getUser/{email}
3. getAllTrades()                — GET /api/user/trade-reco-for-user?user_email={email}
4. getModelPortfolioStrategyDetails() — GET /api/model-portfolio/subscribed-strategies/{email}
5. getAllFunds()                 — broker cash balance
6. getAllBrokerSpecificHoldings() — holdings per broker
```

### 9b. Broker Order Book Refresh

```
TradeContext.fetchBrokerOrderBook(forceRefresh)
  Cache: 10s freshness check
  GET /{broker}/order-book
  Returns: { orders[], pending[], error }

Auto-refresh:
  startAutoRefresh() — 30s polling for pending orders
  stopAutoRefresh()  — called on modal close / unmount
```

### 9c. Post-Rebalance Refresh

After execution, `RecommendationSuccessModal` emits:
```javascript
portfolioEvents.emit(PORTFOLIO_EVENTS.REBALANCE_EXECUTED)
```

Listeners in `ModalPFCard` / `RebalanceAdvices` catch this and re-fetch holdings.

### 9d. LTP Snapshot

LTP is NOT fetched live on every load. Instead:
1. `MPReviewTradeModal` fetches live prices via WebSocket during the review phase
2. After execution, prices are saved via: `PUT /api/model-portfolio/ltp-snapshot`  
   Body: `{ email, modelName, ltpMap: { symbol: price } }`
3. Future loads use the stored snapshot for P&L display

---

## 10. Broker Migration Flow

When a user switches their connected broker, their existing MP holdings (stored under the old broker) need to be linked to the new broker.

```
STEP 1 — Detect migration requirement
  GET /api/model-portfolio-db-update/broker-migration-summary/{userEmail}?newBroker={broker}
  Response: { modelsWithHoldings[], requiresMigration: boolean }
  Shows HoldingsMigrationModal if requiresMigration=true

STEP 2 — User selects strategy per model: migrate / empty / skip
  POST /api/model-portfolio-db-update/handle-broker-migration
  Body: { userEmail, newBroker, migrations: [{ modelName, action, sourceDocumentId }] }
  Operations per model:
    "migrate": copy holdings to new broker document
    "empty":   create empty new-broker document
    "skip":    no action

STEP 3 — Update primary broker in ccxt
  POST /rebalance/change_broker_model_pf (ccxt-india)
  Body: { user_email, user_broker }
  Updates ccxt's internal broker assignment
```

**Multi-broker records:** After migration, the `model_portfolio_user` collection has documents for BOTH the old and new broker. `portfolio-summary` queries prefer the currently-connected broker.

---

## 11. Performance & P&L

### Portfolio Summary

```
GET /api/model-portfolio/portfolio-summary/{email}?broker=Zerodha
Response:
  { totalInvested, totalCurrent, totalReturns, returnsPercentage, portfolioCount,
    portfolios: [{ modelName, broker, invested, current, returns, returnsPercentage }] }

Calculation:
  invested  = qty × averagePrice      (from user_net_pf_model[].order_results)
  current   = qty × ltpPrice          (from ltp_snapshot, or fallback to averagePrice)
  returns   = current − invested
```

### Trade P&L

```
GET /api/model-portfolio/trade-pnl/{email}?broker=Zerodha
Returns per-symbol P&L across all subscribed MPs
Includes: entryPrice, currentPrice, holdingDays, pnl, pnlPercentage, isLtpLive
```

### EOD Performance Charts

`performance_eod_pnl` is populated by ccxt-india's background job. The web frontend renders this as a chart comparing model returns vs Nifty 50.

---

## 12. SDK Integration (Phase C/D)

### Phase C — Execute Advice via SDK

Controlled by: `REACT_APP_USE_SDK_EXECUTE_ADVICE=true`

```javascript
sdkClient.executeAdvice({
  kind: 'mpRebalance',
  clientAdviceId: `${Date.now()}-${Math.random()}`,
  brokerName,
  modelId,
  modelName,
  uniqueId,
  trades: []    // SDK fetches from pre-calculated payload
})
```

SDK route: `POST /sdk/v1/orders/place-rebalance`  
The SDK route runs the full post-execution chain (steps 1–3 from §8) internally.  
Fallback: if SDK call fails, mobile falls back to legacy `/rebalance/process-trade`.

### SDK Portfolio Routes

```
GET  /sdk/v1/portfolios                    — List available strategies
GET  /sdk/v1/portfolios/subscriptions      — User's subscribed strategies
GET  /sdk/v1/portfolios/:modelName/pnl     — P&L for a specific model
POST /sdk/v1/portfolios/subscribe          — Subscribe (SDK payment proof)
```

### SDK Rebalance Routes

```
POST /sdk/v1/rebalance/calculate           — Compute trades
POST /sdk/v1/rebalance/execute             — Place orders
POST /sdk/v1/rebalance/switch-broker       — Change broker
POST /sdk/v1/rebalance/modify-investment   — Update investment amount
POST /sdk/v1/rebalance/performance         — Portfolio performance
```

---

## 13. API Endpoint Reference

### aq_backend_github (server.alphaquark.in)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/model-portfolio/portfolios/:advisor` | All strategies for advisor |
| GET | `/api/model-portfolio/portfolios/strategy/:modelName` | Strategy details |
| GET | `/api/model-portfolio/subscribed-strategies/:email` | User's active subscriptions |
| PUT | `/api/model-portfolio/subscribe-strategy/:id` | Subscribe / unsubscribe |
| PUT | `/api/model-portfolio/ltp-snapshot` | Save LTP for holdings display |
| GET | `/api/model-portfolio/portfolio-summary/:email` | Aggregate P&L |
| GET | `/api/model-portfolio/trade-pnl/:email` | Per-trade P&L |
| POST | `/api/model-portfolio/add-graph-history/:modelName` | Add allocation chart |
| POST | `/api/model-portfolio-db-update` | Record executed orders |
| PUT | `/api/model-portfolio-db-update/manual-placement` | Mark order as manually placed |
| GET | `/api/model-portfolio-db-update/subscription-raw-amount` | Subscription + holdings data |
| GET | `/api/model-portfolio-db-update/available-brokers` | Brokers with holdings for user |
| GET | `/api/model-portfolio-db-update/subscription-by-id/:documentId` | Holdings by document |
| GET | `/api/model-portfolio-db-update/user-broker-records` | All broker records for user |
| GET | `/api/model-portfolio-db-update/broker-migration-summary/:email` | Migration summary |
| POST | `/api/model-portfolio-db-update/handle-broker-migration` | Execute broker migration |
| POST | `/api/model-portfolio-db-update/migrate-broker-records` | Migrate records |
| POST | `/api/model-portfolio-db-update/cleanup-duplicate-broker-records` | Dedup broker records |
| GET | `/api/model-portfolio-db-update/user-portfolio/all/:email/:modelName` | Full history |

### ccxt-india (ccxtprod.alphaquark.in)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/rebalance/calculate` | Calculate rebalance diff |
| POST | `/rebalance/process-trade` | Execute orders (legacy path) |
| GET | `/rebalance/user-portfolio/latest/:email/:modelName` | Current MP holdings |
| PUT | `/rebalance/update/subscriber-execution` | Update execution status |
| PUT | `/rebalance/update/user-portfolio/latest` | Update holdings after exec |
| POST | `/rebalance/record-publisher-results` | Advisor publisher results |
| POST | `/rebalance/add-user/status-check-queue` | Enroll async reconciliation |
| POST | `/rebalance/get-repair` | Get repair trades |
| POST | `/rebalance/insert-user-doc` | Create/update subscription record |
| POST | `/rebalance/change_broker_model_pf` | Change primary broker |
| POST | `/angelone/equity/surveillance` | Angel One surveillance check |
| POST | `/angelone/market-data` | Live LTP fetch |

### SDK Routes (aq_backend_github, /sdk/v1)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/sdk/v1/portfolios` | List strategies |
| GET | `/sdk/v1/portfolios/subscriptions` | User subscriptions |
| GET | `/sdk/v1/portfolios/:id` | Strategy detail |
| GET | `/sdk/v1/portfolios/:modelName/pnl` | P&L |
| POST | `/sdk/v1/portfolios/subscribe` | Subscribe |
| POST | `/sdk/v1/rebalance/calculate` | Calculate |
| POST | `/sdk/v1/rebalance/execute` | Execute |
| POST | `/sdk/v1/rebalance/switch-broker` | Switch broker |
| POST | `/sdk/v1/rebalance/modify-investment` | Modify amount |
| POST | `/sdk/v1/orders/place` | Place trades |
| POST | `/sdk/v1/orders/place-rebalance` | Place + post-chain |
| GET | `/sdk/v1/orders/book` | Order book |
| POST | `/sdk/v1/orders/:orderId/status` | Order status |
| POST | `/sdk/v1/orders/:orderId/cancel` | Cancel order |

---

## 14. Web vs Mobile Differences

| Feature | Mobile (Alphab2bapp) | Web (prod-alphaquark-github) |
|---------|---------------------|------------------------------|
| Broker publisher | Not used directly (broker SDK via native) | Zerodha Kite Publisher SDK + FYERS API Connect loaded dynamically |
| DummyBroker flow | Supported | Explicit "Continue without broker" + DummyBrokerHoldingConfirmation modal |
| Symbol conversion | Not needed (broker SDKs handle format) | Angel One → Zerodha format via `/zerodha/convert-symbol` (with in-memory cache) |
| Order book fallback | startAutoRefresh() 30s polling | Polls order book for 90s if Publisher callback silently fails |
| BrokerPublisher remount | N/A | `key` increment forces remount on each modal open (prevents stale state) |
| Config source | `ConfigContext.js` + `.env` | `AppConfigContext.js` + environment |
| State management | TradeContext (React Context, 1565 lines) | Component hooks + custom event emitter |
| Redux usage | None | Minimal (`auth` slice only); MP state is local/context |
| Broker migration UI | `HoldingsMigrationModal.js` (same file name) | `HoldingsMigrationModal.js` (web version) |
| Payment gateways | Razorpay, Cashfree, PayU, Google Play IAP, Apple IAP | Razorpay, Cashfree, PayU |
| Margin estimate | Not directly in MP flow | `/margin/basket-estimate` called from basket modal |
| WebSocket LTP | `useWebSocketCurrentPrice` hook + context | Direct Socket.IO in `MPReviewTradeModal` / `UpdateRebalanceModal` |
| EDIS pre-flight | Per-broker logic in `MPReviewTradeModal.js` | Per-broker logic in `UpdateRebalanceModal.js` |
| Surveillance check | `MPReviewTradeModal` (Angel One only) | Same |
| Repair trades UI | Not yet implemented | Partial implementation in web |
| LTP snapshot | `PUT /api/model-portfolio/ltp-snapshot` | Same |
| SDK execute | `REACT_APP_USE_SDK_EXECUTE_ADVICE` flag | Same flag (web uses `REACT_APP_USE_SDK_EXECUTE_ADVICE`) |

**Shared (identical on both):**
- All ccxt-india rebalance endpoints
- All aq_backend_github MP endpoints
- subscriberExecutions[] state shape
- user_net_pf_model[] as source of truth for holdings
- Transient error detection (`detectTransientOrderWindowError`)
- Event-driven portfolio refresh (`portfolioEvents`)

---

## 15. State Management

### Mobile — `TradeContext.js`

MP-specific state exported from `TradeContext`:

```javascript
// Strategy list
modelPortfolioStrategyfinal    // Array of subscribed strategies (from subscribed-strategies API)
isDatafetchinMP                // Loading flag

// Order book (for reconciliation)
brokerOrders                   // Latest order book
pendingOrders                  // Orders in PENDING state
isOrderBookLoading
lastOrderBookRefresh           // Timestamp (10s cache)
orderBookError

// Market prices
marketPrices                   // { symbol: ltp }

// Functions
getModelPortfolioStrategyDetails()
fetchBrokerOrderBook(forceRefresh)
getPendingOrdersForSymbol(symbol, type)
startAutoRefresh()
stopAutoRefresh()
fetchMarketPrices(symbols)
```

### Web — Local Hooks + Events

- `useStrategyDetailsWithPortfolioData.js` — all strategy data fetching
- `RebalanceCard.js` — local state for calculation results
- `UpdateRebalanceModal.js` — local state for trade execution
- `portfolioEvents` emitter — cross-component refresh signals:
  - `PORTFOLIO_EVENTS.HOLDINGS_REFRESH`
  - `PORTFOLIO_EVENTS.REBALANCE_EXECUTED`
  - `PORTFOLIO_EVENTS.DISTRIBUTION_REFRESH`

---

## 16. Security & Encryption

All API requests to ccxt-india require:
- `aq-encrypted-key` header — `SecurityTokenManager.generateToken()` (JWT, 15s expiry)
- `X-Advisor-Subdomain` header — isolates MP data per advisor/tenant

Broker credentials stored in `User.connected_brokers[]` (encrypted via `checkValidApiAnSecret`). The SDK routes decrypt credentials server-side before forwarding to ccxt.

---

## 17. Known Limitations

1. **Repair trades UI (mobile):** `GET /rebalance/get-repair` is wired in `ModelPortfolioService.js` but no modal surfaces repair trades on mobile. Web has partial implementation.

2. **Trade variant missing in response:** `/rebalance/process-trade` does not echo the `variant` field. `RecommendationSuccessModal` resolves it from `originalStockDetails` prop — this is a workaround, not a design.

3. **LTP staleness:** The LTP snapshot is saved post-execution and used for all subsequent P&L display until the next rebalance. Users can see stale P&L without real-time prices.

4. **Multi-broker UI:** The backend and data model fully support multi-broker MP subscriptions (multiple `model_portfolio_user` documents), but the mobile and web UIs currently show single-broker selection only.

5. **After-hours orders:** Controlled by `allowAfterHoursOrders` config flag. Not all brokers support AMO (After Market Orders) — the variant field tracks this but no broker-level guardrail exists at the UI layer.

6. **EDIS pre-checks (portal brokers):** Portal-side brokers (8+) use optimistic EDIS check — the rejection triggers the `OtherBrokerModel` modal. This is by design (no live-check API), but means one round-trip to the broker before the user sees the TPIN prompt.
