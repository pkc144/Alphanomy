/**
 * useHomeMarketSummary — derives the alphanomy variant's HomeScreen header data.
 *
 * Returns:
 *   {
 *     tickers: [{ name, value, change, dir }, ...],   // 3 indices, alphanomy-shaped
 *     pnlSummary: { currentPnl, invested, currentValue, returnsPct },
 *   }
 *
 * Tickers source:
 *   - Static config of 3 indices (NIFTY 50 / SENSEX / BANKNIFTY) — same set the
 *     legacy `<MarketIndices>` uses.
 *   - Live LTPs from `MarketDataContext` (subscribes once, reads from cache).
 *   - Previous-close prices via a one-shot POST to
 *     `${ccxtServer}misc/indices-previous-close`. Failures are silent — the
 *     ticker just shows the LTP without a change indicator.
 *
 * P&L source:
 *   - `MultiBrokerContext.aggregatedHoldings` — already normalized + summed
 *     across brokers (`useMultiBrokerHoldings.js` is the producer). Sums
 *     `totalInvested` and `totalCurrentValue` to derive the portfolio summary.
 *   - When no broker is connected the result is all zeros (matches the HTML
 *     mockup's pre-onboarding state).
 *
 * Wired into the home container (`src/screens/Home/HomeScreen.js`) and
 * surfaced via the `home` prop bag for the alphanomy `HomeScreen` and
 * `_AppHeader` presentations. Default presentation ignores these fields
 * — they're additive, no contract break.
 */

import { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MarketDataContext from '../../../context/MarketDataContext';
import MultiBrokerContext from '../../../context/MultiBrokerContext';
import server from '../../../utils/serverConfig';
import Config from '../../../utils/safeConfig';
import { generateToken } from '../../../utils/SecurityTokenManager';
import { getAdvisorSubdomain } from '../../../utils/variantHelper';

// Mirror of `indicesConfig` in MarketIndices.js — kept here to avoid pulling
// in that ~600-line component when all we need is the config + live data.
const INDICES = [
    {
        key: 'nifty50',
        symbol: 'NIFTY',
        exchange: 'NSE',
        displayName: 'Nifty 50',
        alts: ['NIFTY 50', 'Nifty 50', 'NIFTY_50'],
    },
    {
        key: 'sensex',
        symbol: 'SENSEX',
        exchange: 'BSE',
        displayName: 'Sensex',
        alts: ['Sensex', 'BSE SENSEX', 'SENSEX 30'],
    },
    {
        key: 'bankNifty',
        symbol: 'BANKNIFTY',
        exchange: 'NSE',
        displayName: 'BankNifty',
        alts: ['NIFTY BANK', 'NIFTYBANK', 'Nifty Bank', 'BANK NIFTY'],
    },
];

const formatNumber = (n) => {
    if (!Number.isFinite(n) || n === 0) return '—';
    if (n >= 10000) {
        return n.toLocaleString('en-IN', {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
        });
    }
    return n.toFixed(2);
};

const formatChange = (change, prevClose) => {
    if (!Number.isFinite(change) || !Number.isFinite(prevClose) || prevClose === 0) {
        return '';
    }
    const arrow = change >= 0 ? '▲' : '▼';
    const pct = Math.abs((change / prevClose) * 100).toFixed(2);
    return `${arrow} ${Math.abs(change).toFixed(2)} (${pct}%)`;
};

export default function useHomeMarketSummary() {
    // Read raw Contexts directly — both default to null when no provider is
    // mounted (test environments / isolated previews), so the hook silently
    // degrades instead of throwing.
    const market = useContext(MarketDataContext);
    const broker = useContext(MultiBrokerContext);
    const [previousClose, setPreviousClose] = useState({}); // { NIFTY: number, ... }

    // Subscribe to the 3 indices once on mount.
    const symbols = useMemo(() => INDICES.map((i) => i.symbol), []);
    useEffect(() => {
        if (!market?.subscribe) return;
        market.subscribe(symbols);
    }, [market, symbols]);

    // One-shot fetch of previous-close prices. Skipped when MarketDataContext
    // is not mounted (no consumer for the change indicators anyway).
    useEffect(() => {
        if (!market) return undefined;
        let cancelled = false;
        const fetchPrev = async () => {
            try {
                const url = `${server.ccxtServer.baseUrl}misc/indices-previous-close`;
                const payload = {
                    symbols: INDICES.map((i) => ({ symbol: i.symbol, exchange: i.exchange })),
                };
                const headers = {
                    'Content-Type': 'application/json',
                    'X-Advisor-Subdomain': getAdvisorSubdomain(),
                    'aq-encrypted-key': generateToken(
                        Config?.REACT_APP_AQ_KEYS,
                        Config?.REACT_APP_AQ_SECRET,
                    ),
                };
                const res = await axios.post(url, payload, { headers, timeout: 8000 });
                if (cancelled) return;
                const data = res?.data?.data;
                if (!data || typeof data !== 'object') return;
                const next = {};
                INDICES.forEach((cfg) => {
                    let price = data[cfg.symbol];
                    if (!price) {
                        for (const alt of cfg.alts) {
                            if (data[alt] != null) {
                                price = data[alt];
                                break;
                            }
                        }
                    }
                    const num = Number(price);
                    if (Number.isFinite(num)) next[cfg.symbol] = num;
                });
                setPreviousClose(next);
            } catch {
                // Silent — tickers fall back to LTP-only display.
            }
        };
        fetchPrev();
        return () => {
            cancelled = true;
        };
    }, [market]);

    // Build the alphanomy ticker rows.
    const tickers = useMemo(() => {
        if (!market?.getLTPForSymbol) return [];
        return INDICES.map((cfg) => {
            // Try primary symbol, then alts — same fallback as legacy MarketIndices.
            let ltp = market.getLTPForSymbol(cfg.symbol);
            if (!ltp) {
                for (const alt of cfg.alts) {
                    const v = market.getLTPForSymbol(alt);
                    if (v) {
                        ltp = v;
                        break;
                    }
                }
            }
            const prev = previousClose[cfg.symbol] || 0;
            const change = ltp && prev ? ltp - prev : 0;
            return {
                name: cfg.displayName,
                value: ltp ? formatNumber(ltp) : '—',
                change: formatChange(change, prev),
                dir: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
            };
        });
    }, [market, previousClose]);

    // Sum aggregatedHoldings into a portfolio summary.
    const pnlSummary = useMemo(() => {
        const list = broker?.aggregatedHoldings;
        if (!Array.isArray(list) || list.length === 0) {
            return { currentPnl: 0, invested: 0, currentValue: 0, returnsPct: 0 };
        }
        let invested = 0;
        let currentValue = 0;
        list.forEach((h) => {
            if (!h) return;
            invested += Number(h.totalInvested) || 0;
            currentValue += Number(h.totalCurrentValue) || 0;
        });
        const currentPnl = currentValue - invested;
        const returnsPct = invested > 0 ? (currentPnl / invested) * 100 : 0;
        return { currentPnl, invested, currentValue, returnsPct };
    }, [broker?.aggregatedHoldings]);

    return { tickers, pnlSummary };
}
