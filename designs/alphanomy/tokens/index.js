/**
 * ============================================================================
 * designs/alphanomy/tokens — ALPHANOMY VARIANT TOKEN BUNDLE
 * ============================================================================
 *
 * Source design: alphanomy-improved.html (2026 redesign).
 * Palette: blue (#1246F0) → purple (#7C3AED) gradient on soft lavender-tinted
 * surfaces. Ink #0B1628 / muted #8B96B0 text. Profit #00B37E / loss #E53935.
 *
 * Shape contract: matches `designs/default/tokens/index.js` — exports
 * `DEFAULT_COLORS / buildColors`, `DEFAULT_TYPOGRAPHY / buildTypography`,
 * `DEFAULT_SPACING / buildSpacing`, `DEFAULT_RADII / buildRadii`,
 * `DEFAULT_SHADOWS / buildShadows`, plus `isValidColor`. Canonical key
 * coverage from `src/theme/*` is preserved (every default key exists here);
 * variant-specific extras (e.g. SHADOWS.cta, TYPOGRAPHY.display) are
 * additive — they do not break the default contract.
 *
 * Typography intent is DM Sans + DM Mono. The repo currently ships Poppins
 * (full weight set at android/app/src/main/assets/fonts/) so Poppins is the
 * binding. To switch to literal DM Sans, drop the .ttf files into
 * android/app/src/main/assets/fonts/ + ios/<App>/Info.plist's UIAppFonts and
 * change the `family` map below.
 *
 * v1 useTokens() gap: src/theme/useTokens.js does NOT yet read variant
 * tokens — it imports default builders directly. Until that hook becomes
 * variant-aware (a separate, architecture-doc-update commit), variant-owned
 * screens that need this palette import from `'../tokens'` directly. See
 * docs/DESIGN_MIGRATION_PROGRESS.md § 2026-05-04 "Next" for the follow-up.
 * ============================================================================
 */

import { isValidColor } from '../../default/tokens';

// ──────────────────────────────────────────────────────────────
// Generic deep-merge — mirrors src/theme/colors.js's behaviour
// (skip empty/null override values, recurse into nested objects).
// ──────────────────────────────────────────────────────────────
const deepMerge = (base, override) => {
    if (!override || typeof override !== 'object') {return base;}
    const out = { ...base };
    for (const key of Object.keys(override)) {
        const value = override[key];
        if (value === undefined || value === null || value === '') {continue;}
        if (
            typeof value === 'object' &&
            !Array.isArray(value) &&
            typeof base[key] === 'object' &&
            !Array.isArray(base[key])
        ) {
            out[key] = deepMerge(base[key], value);
        } else {
            out[key] = value;
        }
    }
    return out;
};

const shallowMerge = (base, override) => {
    if (!override || typeof override !== 'object') {return base;}
    const out = { ...base };
    for (const key of Object.keys(override)) {
        const value = override[key];
        if (value === undefined || value === null) {continue;}
        out[key] = value;
    }
    return out;
};

const mergeStyleMap = (base, override) => {
    if (!override || typeof override !== 'object') {return base;}
    const out = { ...base };
    for (const key of Object.keys(override)) {
        const value = override[key];
        if (!value || typeof value !== 'object') {continue;}
        out[key] = { ...(base[key] || {}), ...value };
    }
    return out;
};

// ──────────────────────────────────────────────────────────────
// COLORS — same key tree as src/theme/colors.js DEFAULT_TOKENS.
// Variant-specific values lifted from alphanomy-improved.html.
// ──────────────────────────────────────────────────────────────
export const DEFAULT_COLORS = {
    brand: {
        primary: '#1246F0',
        secondary: '#7C3AED',
        accent: '#1246F0',
        gradientStart: '#1246F0',
        gradientEnd: '#7C3AED',
        onBrand: '#FFFFFF',
        placeholder: '#8B96B0',
        // Variant-extra (not on default's brand contract) — soft purple
        // tint matching `secondary` at 0.09 alpha. Used by AccountSettings
        // icon tiles and any future purple-tinted surface.
        secondaryBg: 'rgba(124,58,237,0.09)',
    },
    text: {
        primary: '#0B1628',
        secondary: '#3D4F72',
        muted: '#8B96B0',
        disabled: '#C2C9D9',
        inverse: '#FFFFFF',
        link: '#1246F0',
        onBrand: '#FFFFFF',
    },
    surface: {
        base: '#F4F6FD',
        card: '#FFFFFF',
        elevated: '#FFFFFF',
        subtle: '#EEF1FB',
        muted: '#E6EAFC',
        strong: '#DDE2F5',
        inverse: '#0B1628',
    },
    border: {
        default: 'rgba(18,70,240,0.08)',
        subtle: 'rgba(18,70,240,0.05)',
        strong: 'rgba(18,70,240,0.13)',
        focus: '#1246F0',
    },
    status: {
        success: '#00B37E',
        successBg: 'rgba(0,179,126,0.09)',
        danger: '#E53935',
        dangerBg: 'rgba(229,57,53,0.08)',
        warning: '#F59E0B',
        warningBg: 'rgba(245,158,11,0.09)',
        info: '#1246F0',
        infoBg: 'rgba(18,70,240,0.08)',
    },
    pnl: {
        profit: '#00B37E',
        profitBg: 'rgba(0,179,126,0.09)',
        loss: '#E53935',
        lossBg: 'rgba(229,57,53,0.08)',
        neutral: '#8B96B0',
    },
    nav: {
        tabBg: 'rgba(255,255,255,0.97)',
        tabBorder: 'rgba(18,70,240,0.07)',
        tabIcon: '#8B96B0',
        tabIconActive: '#1246F0',
    },
    basket: {
        start: '#1246F0',
        end: '#7C3AED',
        card: '#1246F0',
        symbolBg: 'rgba(18,70,240,0.09)',
    },
    chart: {
        // Same length as default's series so chart components don't index off the end.
        series: [
            '#1246F0', '#7C3AED', '#00B37E', '#F59E0B', '#E53935',
            '#2E5EF5', '#9D4DFF', '#00D49A', '#FCB041', '#FF6B66',
            '#5B7FF6', '#B375FF', '#3DFFA0', '#FFD580', '#FF9994',
            '#8FA9F8', '#CFA1FF', '#85F2C2', '#FFE4B0', '#FFC2BD',
        ],
    },
    emptyState: {
        // Tinted to match the lavender surface palette (vs default's terracotta).
        backgroundColor: '#1246F0',
        darkerColor: '#0E37BD',
        mediumColor: '#2E5EF5',
        brighterColor: '#5B7FF6',
        mutedColor: '#3D4F72',
        lightColor: '#EEF1FB',
        mediumLightShade: '#E6EAFC',
        lightWarmColor: '#F4F6FD',
    },
    overlay: {
        scrim: 'rgba(11,22,40,0.45)',
        modal: 'rgba(11,22,40,0.55)',
        light: 'rgba(11,22,40,0.10)',
    },
    shadow: {
        color: '#0B1628',
        subtle: 'rgba(11,22,40,0.06)',
        medium: 'rgba(11,22,40,0.16)',
    },
};

// Legacy advisor-config branding fields → semantic tokens (mirrors
// src/theme/colors.js's `applyLegacyBranding`). Keeps backend overrides
// (`appadvisors.mainColor`, `gradient1`, etc.) working for this variant.
const applyLegacyBranding = (tokens, config) => {
    if (!config) {return tokens;}
    const pick = (v, fallback) => (v && v !== '' ? v : fallback);
    return {
        ...tokens,
        brand: {
            ...tokens.brand,
            primary: pick(config.mainColor, tokens.brand.primary),
            secondary: pick(config.secondaryColor, tokens.brand.secondary),
            accent: pick(config.themeColor, tokens.brand.accent),
            gradientStart: pick(config.gradient1, tokens.brand.gradientStart),
            gradientEnd: pick(config.gradient2, tokens.brand.gradientEnd),
            placeholder: pick(config.placeholderText, tokens.brand.placeholder),
        },
        nav: {
            ...tokens.nav,
            tabBg: pick(config.bottomTabbg, tokens.nav.tabBg),
            tabIcon: pick(config.tabIconColor, tokens.nav.tabIcon),
            tabIconActive: pick(config.selectedTabcolor, tokens.nav.tabIconActive),
        },
        basket: {
            ...tokens.basket,
            start: pick(config.basket1, tokens.basket.start),
            end: pick(config.basket2, tokens.basket.end),
            card: pick(config.basketcolor, tokens.basket.card),
            symbolBg: pick(config.basketsymbolbg, tokens.basket.symbolBg),
        },
        emptyState: {
            ...tokens.emptyState,
            ...(config.EmptyStateUi || {}),
        },
    };
};

export const buildColors = (config) => {
    const withBranding = applyLegacyBranding(DEFAULT_COLORS, config);
    return deepMerge(withBranding, config?.colorTokens);
};

// Variant-specific gradient pairs (additive — not in default's contract).
export const GRADIENTS = {
    brand: ['#1246F0', '#7C3AED'],
    brandReverse: ['#7C3AED', '#1246F0'],
    success: ['#00B37E', '#00D49A'],
};

// ──────────────────────────────────────────────────────────────
// TYPOGRAPHY — matches src/theme/typography.js DEFAULT_TYPOGRAPHY
// keys (heading/title/subtitle/body/bodyEmphasis/caption/muted/button)
// plus variant extras (display, overline, mono).
// ──────────────────────────────────────────────────────────────
const family = {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semibold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    extrabold: 'Poppins-ExtraBold',
    black: 'Poppins-Black',
    mono: 'Poppins-SemiBold',
};

export const DEFAULT_TYPOGRAPHY = {
    // Default contract floor (8 roles)
    heading: {
        fontFamily: family.extrabold,
        fontSize: 24,
        lineHeight: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    title: {
        fontFamily: family.bold,
        fontSize: 18,
        lineHeight: 22,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontFamily: family.semibold,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    body: {
        fontFamily: family.regular,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '400',
    },
    bodyEmphasis: {
        fontFamily: family.semibold,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '600',
    },
    caption: {
        fontFamily: family.regular,
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '400',
    },
    muted: {
        fontFamily: family.regular,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '400',
    },
    button: {
        fontFamily: family.bold,
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    // Variant extras (additive — not on default's contract)
    display: {
        fontFamily: family.extrabold,
        fontSize: 38,
        lineHeight: 44,
        fontWeight: '800',
        letterSpacing: -1.2,
    },
    overline: {
        fontFamily: family.bold,
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '700',
        letterSpacing: 0.9,
        textTransform: 'uppercase',
    },
    mono: {
        fontFamily: family.mono,
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '600',
    },
};

export const buildTypography = (config) =>
    mergeStyleMap(DEFAULT_TYPOGRAPHY, config?.typographyTokens);

// ──────────────────────────────────────────────────────────────
// SPACING — covers src/theme/spacing.js's 8 keys + variant extras.
// ──────────────────────────────────────────────────────────────
export const DEFAULT_SPACING = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    // Variant extras
    xxs: 2,
    huge: 64,
};

export const buildSpacing = (config) =>
    shallowMerge(DEFAULT_SPACING, config?.spacingTokens);

// ──────────────────────────────────────────────────────────────
// RADII — covers src/theme/radii.js's 6 keys + variant extras.
// ──────────────────────────────────────────────────────────────
export const DEFAULT_RADII = {
    none: 0,
    sm: 8,
    md: 12,
    lg: 14,         // inputs / inline buttons
    xl: 18,         // cards
    pill: 999,
    // Variant extras
    xxl: 22,        // hero cards
    sheet: 28,      // bottom-sheet / overlapping auth card
};

export const buildRadii = (config) =>
    shallowMerge(DEFAULT_RADII, config?.radiiTokens);

// ──────────────────────────────────────────────────────────────
// SHADOWS — covers src/theme/shadows.js's 5 keys + variant extras.
// ──────────────────────────────────────────────────────────────
export const DEFAULT_SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    card: {
        shadowColor: '#0B1628',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 4,
    },
    elevated: {
        shadowColor: '#0B1628',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    modal: {
        shadowColor: '#0B1628',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.18,
        shadowRadius: 36,
        elevation: 16,
    },
    floating: {
        shadowColor: '#1246F0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.20,
        shadowRadius: 20,
        elevation: 6,
    },
    // Variant extras
    xs: {
        shadowColor: '#0B1628',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },
    cta: {
        shadowColor: '#1246F0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.38,
        shadowRadius: 20,
        elevation: 8,
    },
};

export const buildShadows = (config) =>
    mergeStyleMap(DEFAULT_SHADOWS, config?.shadowTokens);

// Variant assets — alphanomy-branded logos. Shape mirrors upstream's
// src/theme/assets.js so useTokens() resolves these the same way it
// resolves the default-variant assets.
export { DEFAULT_ASSETS, buildAssets } from './assets';

export { isValidColor };
