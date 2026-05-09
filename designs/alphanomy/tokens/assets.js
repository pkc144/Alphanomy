/**
 * ============================================================================
 * designs/alphanomy/tokens/assets — ALPHANOMY VARIANT ASSET TOKENS
 * ============================================================================
 *
 * Variant override of the default `assets` token slot. Same shape as
 * `src/theme/assets.js` — ships a `DEFAULT_ASSETS` const + a `buildAssets()`
 * builder. The `DesignProvider` resolves the variant's tokens at mount time
 * and `useTokens().assets.<key>` returns the variant-local image refs
 * exported here instead of the upstream defaults.
 *
 * Why these files live under `designs/alphanomy/assets/` rather than
 * `src/assets/*`: the Alphanomy fork previously overwrote shared
 * `src/assets/AppLogo/logo.png`, `src/assets/logo.png`, and
 * `src/assets/fadedlogo.png` with the alphanomy brand assets. That pattern
 * was reverted on 2026-05-09 (whitelabel sync) — the shared paths now
 * carry the canonical AlphaQuark logos again, and the variant ships its
 * own brand under this folder. See `docs/WHITELABEL_RECIPE.md` upstream
 * for the full contract.
 *
 * To add another variant-overridable image (e.g. splash, app-icon-preview,
 * empty-state illustrations) once that slot exists in upstream's
 * `src/theme/assets.js`: ship the file under `designs/alphanomy/assets/`
 * and add a key here pointing at it.
 * ============================================================================
 */

const merge = (base, override) => {
    if (!override || typeof override !== 'object') return base;
    const out = { ...base };
    for (const key of Object.keys(override)) {
        const value = override[key];
        if (value === undefined || value === null) continue;
        out[key] = value;
    }
    return out;
};

export const DEFAULT_ASSETS = {
    // Alphanomy brand mark, full color.
    logoPng: require('../assets/logo.png'),
    // Alphanomy faded watermark, used as a card-background ornament in
    // RebalanceCard, BasketCard, and the auth screens.
    logoFadedPng: require('../assets/fadedlogo.png'),
};

export const buildAssets = (config) => merge(DEFAULT_ASSETS, config?.assetTokens);

export default buildAssets;
