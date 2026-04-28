# Maestro E2E Tests — AlphaQuark B2B Mobile App

Automated UI tests that run on an Android emulator, equivalent to the web app's Cypress E2E suite.

## Prerequisites

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version

# Start Android emulator
emulator -avd Pixel_6_API_34 &

# Build and install app
cd android && ./gradlew app:installDebug
```

## Running Tests

```bash
# Run ALL tests
maestro test .maestro/

# Run specific category
maestro test .maestro/auth/
maestro test .maestro/home/
maestro test .maestro/orders/
maestro test .maestro/portfolio/
maestro test .maestro/model-portfolio/
maestro test .maestro/broker-connection/
maestro test .maestro/navigation/
maestro test .maestro/settings/
maestro test .maestro/payment/
maestro test .maestro/edge-cases/

# Run single test
maestro test .maestro/auth/001_app_launch.yaml

# Run smoke tests only
maestro test --include-tags=smoke .maestro/

# Run with screenshots output
maestro test .maestro/ --output=test-results/
```

## Test Structure

```
.maestro/
├── config.yaml                          # Global config (appId, env vars)
├── helpers/
│   ├── login.yaml                       # Reusable login flow
│   ├── logout.yaml                      # Reusable logout flow
│   └── navigate_to_tab.yaml            # Reusable tab navigation
│
├── auth/                                # 6 tests — Authentication flows
│   ├── 001_app_launch.yaml             # App launches, login screen visible
│   ├── 002_login_with_email.yaml       # Email/password login
│   ├── 003_login_validation.yaml       # Empty/invalid form validation
│   ├── 004_forgot_password.yaml        # Password reset flow
│   ├── 005_signup_flow.yaml            # Signup form renders
│   └── 006_logout.yaml                 # Logout returns to login
│
├── home/                                # 5 tests — Home & trading
│   ├── 001_home_screen_loads.yaml      # Home screen content visible
│   ├── 002_stock_recommendations.yaml  # Trade recommendations display
│   ├── 003_home_tabs_switch.yaml       # Sub-tab switching
│   ├── 004_pull_to_refresh.yaml        # Pull-to-refresh works
│   └── 005_recommendation_card.yaml    # Review trade modal opens
│
├── orders/                              # 2 tests — Order management
│   ├── 001_order_screen_loads.yaml     # Order book screen
│   └── 002_order_tabs_switch.yaml      # Placed/Rejected tab switching
│
├── portfolio/                           # 3 tests — Portfolio holdings
│   ├── 001_portfolio_screen_loads.yaml # Holdings display
│   ├── 002_portfolio_holdings.yaml     # Holdings list details
│   └── 003_portfolio_broker_filter.yaml# Multi-broker filter
│
├── model-portfolio/                     # 3 tests — Model Portfolio
│   ├── 001_model_portfolio_list.yaml   # Strategy list screen
│   ├── 002_strategy_detail.yaml        # Strategy composition
│   └── 003_rebalance_review.yaml       # Rebalance review modal
│
├── broker-connection/                   # 3 tests — Broker auth
│   ├── 001_broker_list_display.yaml    # Broker list with all 14 brokers
│   ├── 002_broker_connect_modal.yaml   # OAuth/credential modal opens
│   └── 003_broker_status_display.yaml  # Connected/expired status
│
├── navigation/                          # 3 tests — Navigation
│   ├── 001_bottom_tab_navigation.yaml  # All 5 bottom tabs
│   ├── 002_drawer_navigation.yaml      # Right drawer menu
│   └── 003_back_navigation.yaml        # Android back button
│
├── settings/                            # 2 tests — Settings & legal
│   ├── 001_settings_screen.yaml        # Settings menu sections
│   └── 002_legal_pages.yaml            # Privacy policy, T&C
│
├── payment/                             # 2 tests — Payment flows
│   ├── 001_subscription_screen.yaml    # Plans/pricing display
│   └── 002_payment_gateway_flow.yaml   # Gateway opens (no purchase)
│
└── edge-cases/                          # 5 tests — Stability
    ├── 001_no_network.yaml             # Airplane mode graceful
    ├── 002_empty_states.yaml           # Empty data displays
    ├── 003_app_backgrounding.yaml      # Background/foreground state
    ├── 004_rapid_tab_switching.yaml    # Rapid navigation stress
    └── 005_screen_rotation.yaml        # Orientation change
```

## Test Coverage Map (Mobile ↔ Web Cypress)

| Web Cypress Suite | Mobile Maestro Equivalent |
|-------------------|--------------------------|
| auth/login.cy.js (24 tests) | auth/ (6 flows) |
| trading/recommendations.cy.js (20 tests) | home/ (5 flows) |
| portfolio/dashboard.cy.js (17 tests) | portfolio/ (3 flows) + navigation/ (3 flows) |
| portfolio/model-portfolio.cy.js (14 tests) | model-portfolio/ (3 flows) |
| payment/subscription.cy.js (15 tests) | payment/ (2 flows) |
| payment/validation.cy.js (7 tests) | payment/ (included above) |
| ui/dark-mode.cy.js (9 tests) | N/A (no dark mode in mobile yet) |
| ui/responsive.cy.js (5 tests) | edge-cases/005_screen_rotation.yaml |
| billing/invoices.cy.js (8 tests) | settings/ (included in more tab) |
| content/knowledge-hub.cy.js (12 tests) | home/003_home_tabs_switch.yaml |
| landing/landing-page.cy.js (6 tests) | auth/001_app_launch.yaml |
| admin/* (48 tests) | N/A (no admin in mobile app) |

## Tags

- `smoke` — Critical path tests (run before every release)
- `regression` — Full regression suite
- `auth` — Authentication tests
- `trading` — Trade execution tests
- `broker` — Broker connection tests
- `edge-case` — Stability/stress tests

## Environment Variables

Set in `config.yaml` or override via CLI:
```bash
maestro test .maestro/ \
  -e TEST_EMAIL=myuser@test.com \
  -e TEST_PASSWORD=MyPass123
```
