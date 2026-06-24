/**
 * Zerodha DDPI sell-authorization gate — single source of truth (mobile).
 *
 * Mirrors the web util `prod-alphaquark-github/src/utils/zerodhaDdpiGate.js`.
 * The sell-auth rule was previously inlined as `['physical','ddpi','consent']
 * .includes(ddpi_status)` at 8 sites across StockAdvices / RebalanceModal /
 * UserStrategySubscribeModal / MPReviewTradeModal — which drifts (one site was
 * missing 'consent', forcing consent users into TPIN). Every gate now imports
 * this so the rule lives in ONE place.
 *
 * Keep `SELL_AUTHORIZED_DDPI_STATUSES` in sync with:
 *   - web: prod-alphaquark-github/src/utils/zerodhaDdpiGate.js
 *   - backend: ccxt-india common/db_manager.py CcxtDbManager.SELL_AUTHORIZED_DDPI_STATUSES
 * See prod-alphaquark-github/docs/DDPI_EDIS_SELL_AUTH_ARCHITECTURE.md.
 */

// Standing Zerodha sell-authorization statuses (Kite profile.meta.demat_consent).
// "consent" = digital CDSL standing consent; authorizes selling without a
// per-trade TPIN exactly like "physical"/"ddpi".
export const SELL_AUTHORIZED_DDPI_STATUSES = ['physical', 'ddpi', 'consent'];

/**
 * Is this Zerodha user authorized to SELL without the EDIS/TPIN flow?
 * @param {object} userDetails - user doc (ddpi_status, is_authorized_for_sell)
 * @returns {boolean} true → authorized (skip the DDPI/TPIN prompt)
 */
export function isZerodhaSellAuthorized(userDetails) {
  if (!userDetails) return false;
  if (userDetails.is_authorized_for_sell) return true;
  return SELL_AUTHORIZED_DDPI_STATUSES.includes(userDetails.ddpi_status);
}

export default isZerodhaSellAuthorized;
