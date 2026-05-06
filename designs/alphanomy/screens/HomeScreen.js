/**
 * HomeScreen — alphanomy variant presentation (2026-05-04, live-data wired
 * 2026-05-05)
 *
 * Source design: alphanomy-improved.html § "04 · Home". Renders the
 * alphanomy visual hierarchy: header with greeting + ticker strip, P&L
 * hero, Model Portfolios section with one hero-style plan card, Top
 * Bespoke Plans section with one standard plan card.
 *
 * Live data sources (all surfaced via the `home` prop bag built by
 * src/screens/Home/HomeScreen.js):
 *   - `tickers`        — `useHomeMarketSummary` (NIFTY/SENSEX/BANKNIFTY LTPs +
 *                        previous-close fetch for change indicators)
 *   - `pnlSummary`     — `useHomeMarketSummary` (sum of MultiBrokerContext's
 *                        aggregated holdings)
 *   - `heroPlan`       — `useHomePlanSummary` (top model portfolio from the
 *                        catalog endpoint)
 *   - `bespokePlan`    — `useHomePlanSummary` (top bespoke plan from the
 *                        catalog endpoint)
 *
 * Each live source falls back to FALLBACK_* constants below when the
 * data isn't ready yet (boot, no auth, no provider mounted, empty
 * catalog). The two "View All" links wire to the container's existing
 * overlay flags (`setSeeAllMPplan` / `setSeeAllBespokeplan`).
 *
 * Receives the same `home` prop bag as designs/default/screens/HomeScreen.js
 * — additional fields (tickers / pnlSummary / heroPlan / bespokePlan) are
 * additive; default presentation ignores them.
 */

import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Bell, ArrowUpRight } from 'lucide-react-native';
import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
    DEFAULT_SHADOWS as SHADOWS,
} from '../tokens';

// Fallback ticker rows used when the container hasn't supplied live data
// yet (e.g. WebSocket warmup, no broker connected). Same shape the
// container's `useHomeMarketSummary` hook produces.
const FALLBACK_TICKERS = [
    { name: 'Nifty 50', value: '23,995.7', change: '▼ 97.00 (0.40%)', dir: 'down' },
    { name: 'Sensex', value: '76,886.9', change: '▼ 416.72 (0.54%)', dir: 'down' },
    { name: 'BankNifty', value: '55,400', change: '▼ 0.8%', dir: 'down' },
];

// Fallback plan rows used when the container hasn't supplied live catalog
// data yet (boot, no advisor config yet, or empty catalog response). Same
// shape `useHomePlanSummary` produces.
const FALLBACK_HERO = {
    badgeTop: 'TOP',
    badgeBot: '100',
    name: 'Alpha Growth Plan',
    price: '₹ 20.00',
    priceSuffix: '/mo',
    freq: 'Monthly',
    minInvest: '₹50,000',
    volatility: 'Medium',
    cagr: '18.4%',
};

const FALLBACK_BESPOKE = {
    name: 'Momentum Weekly',
    priceOrig: '₹ 3,487',
    priceNow: '₹ 2,999',
    validity: 'Monthly validity',
    freq: 'Monthly',
    saveBadge: 'Save 14%',
};

const todayLabel = () => {
    try {
        const d = new Date();
        return d.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '';
    }
};

const initialsFromEmail = (email = '') => {
    const local = (email || '').split('@')[0] || 'You';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {return (parts[0][0] + parts[1][0]).toUpperCase();}
    return (local[0] || 'Y').toUpperCase() + (local[1] || '').toUpperCase();
};

const greetingFromEmail = (email = '') => {
    const local = (email || '').split('@')[0] || 'there';
    const first = local.split(/[._-]+/)[0] || local;
    return first.charAt(0).toUpperCase() + first.slice(1);
};

const HomeScreenPresentation = ({ home }) => {
    const {
        userEmail = '',
        config,
        isRefreshing = false,
        onRefresh = () => {},
        setSeeAllMPplan = () => {},
        setSeeAllBespokeplan = () => {},
        tickers,
        pnlSummary,
        heroPlan,
        bespokePlan,
    } = home || {};

    // Live plan rows when present; fallback to design-preview entries.
    const hero = heroPlan || FALLBACK_HERO;
    const bespoke = bespokePlan || FALLBACK_BESPOKE;

    const greeting = greetingFromEmail(userEmail || config?.advisorRaCode || '');
    const initials = initialsFromEmail(userEmail || config?.advisorRaCode || '');

    // Live tickers when present + populated; fallback to the design-preview
    // values during WebSocket warmup so the strip never looks empty.
    const hasLiveTickers =
        Array.isArray(tickers) &&
        tickers.length > 0 &&
        tickers.some((t) => t?.value && t.value !== '—');
    const tickerRows = hasLiveTickers ? tickers : FALLBACK_TICKERS;

    // Portfolio summary — when the user has no broker / no holdings the
    // hook returns all zeros, which is the right state to show
    // ("Connect a broker to start tracking" — implicit via ₹0.00).
    const pnl = pnlSummary || { currentPnl: 0, invested: 0, returnsPct: 0 };
    const pnlPositive = pnl.currentPnl >= 0;
    const pnlAbs = Math.abs(pnl.currentPnl);
    const pnlAmountStr = `₹${pnlAbs.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    })}`;
    const investedStr = pnl.invested.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    });
    const returnsArrow = pnlPositive ? '▲' : '▼';
    const returnsStr = `${returnsArrow} ${Math.abs(pnl.returnsPct).toFixed(2)}%`;
    const pnlBadgeColor = pnlPositive ? '#3DFFA0' : '#FF8B86';

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface.card} />

            {/* ── HEADER (sticky-ish; lives above the scrollview) ── */}
            <View style={styles.header}>
                <View style={styles.headRow1}>
                    <View style={styles.logoWrap}>
                        <LinearGradient
                            colors={GRADIENTS.brand}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.headMark}
                        >
                            <View style={styles.headBolt} />
                        </LinearGradient>
                        <View>
                            <Text style={styles.greeting}>Hello, {greeting} 👋</Text>
                            <Text style={styles.subDate}>{todayLabel()}</Text>
                        </View>
                    </View>
                    <View style={styles.headActions}>
                        <View style={styles.iconCircle}>
                            <Bell size={14} color={COLORS.text.secondary} strokeWidth={1.8} />
                            <View style={styles.notifDot} />
                        </View>
                        <LinearGradient
                            colors={GRADIENTS.brand}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarCircle}
                        >
                            <Text style={styles.avatarText}>{initials}</Text>
                        </LinearGradient>
                    </View>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tickerStrip}
                    contentContainerStyle={{ gap: 7, paddingRight: SPACING.lg }}
                >
                    {tickerRows.map((t) => (
                        <View key={t.name} style={styles.tickerChip}>
                            <Text style={styles.tickerName}>{t.name}</Text>
                            <Text style={styles.tickerVal}>{t.value}</Text>
                            <Text
                                style={[
                                    styles.tickerChg,
                                    {
                                        color:
                                            t.dir === 'up'
                                                ? COLORS.status.success
                                                : t.dir === 'down'
                                                ? COLORS.status.danger
                                                : COLORS.text.muted,
                                    },
                                ]}
                            >
                                {t.change}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* ── BODY ── */}
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={!!isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.brand.primary}
                    />
                }
            >
                {/* P&L Hero */}
                <LinearGradient
                    colors={GRADIENTS.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.plHero}
                >
                    <View style={styles.plHeroOrbLg} />
                    <View style={styles.plHeroOrbSm} />
                    <Text style={styles.plLabel}>Current P&amp;L</Text>
                    <Text style={styles.plAmount}>
                        {pnlPositive ? '' : '−'}
                        {pnlAmountStr}
                    </Text>
                    <Text style={styles.plInvested}>Invested · ₹ {investedStr}</Text>
                    <View style={styles.plBadge}>
                        <Text style={styles.plBadgeLbl}>Returns</Text>
                        <Text style={[styles.plBadgeVal, { color: pnlBadgeColor }]}>
                            {returnsStr}
                        </Text>
                    </View>
                </LinearGradient>

                {/* Model Portfolios section */}
                <View>
                    <View style={styles.secHd}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.secTitle}>Model Portfolios</Text>
                            <Text style={styles.secSub}>Ranked by user feedback</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSeeAllMPplan(true)} activeOpacity={0.7}>
                            <Text style={styles.secLink}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <LinearGradient
                        colors={GRADIENTS.brand}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.planHero}
                    >
                        <View style={styles.planHeroOrb} />
                        <View style={styles.planHeroTopRow}>
                            <View style={styles.badgeTop}>
                                <Text style={styles.badgeTopText}>{hero.badgeTop}</Text>
                                <Text style={styles.badgeTopText}>{hero.badgeBot}</Text>
                            </View>
                            <Text style={styles.planNameW}>{hero.name}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.planPriceW}>{hero.price}</Text>
                            <Text style={styles.planPriceSuffix}> {hero.priceSuffix}</Text>
                        </View>
                        <View style={styles.freqBadgeW}>
                            <Text style={styles.freqBadgeWText}>{hero.freq}</Text>
                        </View>
                        <View style={styles.planMeta}>
                            <View style={styles.planMetaItem}>
                                <Text style={styles.planMetaLbl}>Min. Invest</Text>
                                <Text style={styles.planMetaVal}>{hero.minInvest}</Text>
                            </View>
                            <View style={styles.planMetaItem}>
                                <Text style={styles.planMetaLbl}>Volatility</Text>
                                <Text style={styles.planMetaVal}>{hero.volatility}</Text>
                            </View>
                            <View style={styles.planMetaItem}>
                                <Text style={styles.planMetaLbl}>CAGR</Text>
                                <Text style={[styles.planMetaVal, { color: '#CAC7F9' }]}>
                                    {hero.cagr}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.planBtnRow}>
                            <TouchableOpacity style={styles.btnViewW} activeOpacity={0.85}>
                                <Text style={styles.btnViewWText}>View More</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSubOutline} activeOpacity={0.85}>
                                <Text style={styles.btnSubOutlineText}>Subscribe</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Top Bespoke Plans section */}
                <View>
                    <View style={styles.secHd}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.secTitle}>Top Bespoke Plans</Text>
                            <Text style={styles.secSub}>Ranked by user feedback</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSeeAllBespokeplan(true)} activeOpacity={0.7}>
                            <Text style={styles.secLink}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.planCard}>
                        {bespoke.saveBadge ? (
                            <View style={styles.planSaveBadge}>
                                <Text style={styles.planSaveBadgeText}>{bespoke.saveBadge}</Text>
                            </View>
                        ) : null}
                        <View style={styles.planTopAccent} />
                        <View style={styles.planTopRow}>
                            <Text style={styles.planName}>{bespoke.name}</Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                {bespoke.priceOrig ? (
                                    <Text style={styles.planPriceOrig}>{bespoke.priceOrig}</Text>
                                ) : null}
                                <Text style={styles.planPriceNow}>{bespoke.priceNow}</Text>
                                <Text style={styles.planValidity}>{bespoke.validity}</Text>
                            </View>
                        </View>
                        <View style={styles.freqBadge}>
                            <Text style={styles.freqBadgeText}>{bespoke.freq}</Text>
                        </View>
                        <View style={styles.planBtnRow}>
                            <TouchableOpacity style={styles.btnView} activeOpacity={0.85}>
                                <Text style={styles.btnViewText}>View More</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.9} style={styles.btnSubWrap}>
                                <LinearGradient
                                    colors={GRADIENTS.brand}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.btnSub}
                                >
                                    <Text style={styles.btnSubText}>Subscribe Now</Text>
                                    <ArrowUpRight size={14} color={COLORS.text.inverse} strokeWidth={2.2} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.surface.base },
    flex: { flex: 1 },
    body: { padding: SPACING.lg - 2, gap: SPACING.lg - 2, paddingBottom: SPACING.huge },

    // ── HEADER ──
    header: {
        backgroundColor: COLORS.surface.card,
        paddingHorizontal: SPACING.lg + 2,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(18,70,240,0.06)',
    },
    headRow1: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.sm + 2,
    },
    logoWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2 },
    headMark: {
        width: 36,
        height: 36,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.cta,
        shadowOpacity: 0.30,
    },
    headBolt: {
        width: 11,
        height: 16,
        backgroundColor: '#FFFFFF',
        transform: [{ skewY: '-12deg' }],
        borderRadius: 2,
    },
    greeting: { ...TYPOGRAPHY.bodyEmphasis, fontSize: 15, color: COLORS.text.primary },
    subDate: { ...TYPOGRAPHY.caption, fontSize: 10, color: COLORS.text.muted, marginTop: 1 },

    headActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    iconCircle: {
        width: 35,
        height: 35,
        borderRadius: 18,
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 7,
        right: 7,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.status.danger,
        borderWidth: 1.5,
        borderColor: COLORS.surface.card,
    },
    avatarCircle: {
        width: 35,
        height: 35,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...TYPOGRAPHY.bodyEmphasis,
        fontSize: 11.5,
        color: COLORS.text.inverse,
        letterSpacing: 0.5,
        fontWeight: '800',
    },

    tickerStrip: { paddingBottom: 2 },
    tickerChip: {
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: 11,
        paddingHorizontal: SPACING.md,
        paddingVertical: 7,
    },
    tickerName: {
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.text.secondary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    tickerVal: {
        fontSize: 12.5,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginVertical: 2,
        letterSpacing: -0.2,
    },
    tickerChg: { fontSize: 9, fontWeight: '700' },

    // ── P&L HERO ──
    plHero: {
        borderRadius: RADII.xxl,
        padding: SPACING.lg + 4,
        paddingBottom: SPACING.lg + 2,
        overflow: 'hidden',
        position: 'relative',
    },
    plHeroOrbLg: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.07)',
        right: -60,
        top: -60,
    },
    plHeroOrbSm: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.04)',
        left: 20,
        bottom: -50,
    },
    plLabel: {
        fontSize: 9.5,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.58)',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    plAmount: {
        ...TYPOGRAPHY.display,
        fontSize: 34,
        color: COLORS.text.inverse,
        marginTop: 4,
        marginBottom: 2,
    },
    plInvested: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
    plBadge: {
        position: 'absolute',
        right: 16,
        top: 16,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        borderRadius: RADII.lg,
        paddingHorizontal: 13,
        paddingVertical: 9,
        alignItems: 'center',
    },
    plBadgeLbl: {
        fontSize: 8,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.60)',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    plBadgeVal: {
        fontSize: 14,
        fontWeight: '800',
        color: '#3DFFA0',
        marginTop: 3,
        letterSpacing: -0.3,
    },

    // ── SECTION HEADER ──
    secHd: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 11,
    },
    secTitle: {
        ...TYPOGRAPHY.title,
        fontSize: 15,
        color: COLORS.text.primary,
        letterSpacing: -0.3,
    },
    secSub: { fontSize: 10, color: COLORS.text.muted, marginTop: 2 },
    secLink: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.brand.primary,
        backgroundColor: 'rgba(18,70,240,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(18,70,240,0.13)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        overflow: 'hidden',
    },

    // ── HERO PLAN CARD (Model Portfolios) ──
    planHero: {
        borderRadius: RADII.xl + 2,
        padding: SPACING.lg,
        overflow: 'hidden',
        position: 'relative',
    },
    planHeroOrb: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.08)',
        right: -40,
        bottom: -40,
    },
    planHeroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm + 2,
        marginBottom: SPACING.sm,
    },
    badgeTop: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeTopText: {
        fontSize: 7,
        fontWeight: '900',
        color: COLORS.text.inverse,
        textAlign: 'center',
        lineHeight: 9,
    },
    planNameW: { ...TYPOGRAPHY.title, color: COLORS.text.inverse, fontSize: 16, letterSpacing: -0.3 },
    planPriceW: {
        ...TYPOGRAPHY.display,
        fontSize: 22,
        color: COLORS.text.inverse,
        letterSpacing: -0.6,
    },
    planPriceSuffix: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
    freqBadgeW: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        borderRadius: RADII.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginTop: 7,
        marginBottom: 10,
    },
    freqBadgeWText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.text.inverse,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    planMeta: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: SPACING.md,
    },
    planMetaItem: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 7,
    },
    planMetaLbl: {
        fontSize: 8,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    planMetaVal: { fontSize: 12, fontWeight: '700', color: COLORS.text.inverse, marginTop: 3 },

    planBtnRow: { flexDirection: 'row', gap: SPACING.sm },
    btnViewW: {
        flex: 1,
        paddingVertical: SPACING.md - 2,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.24)',
        borderRadius: RADII.lg - 2,
        alignItems: 'center',
    },
    btnViewWText: { fontSize: 11.5, fontWeight: '600', color: COLORS.text.inverse },
    btnSubOutline: {
        flex: 1,
        paddingVertical: SPACING.md - 2,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.45)',
        borderRadius: RADII.lg - 2,
        alignItems: 'center',
    },
    btnSubOutlineText: { fontSize: 11.5, fontWeight: '700', color: COLORS.text.inverse },

    // ── BESPOKE PLAN CARD (white) ──
    planCard: {
        backgroundColor: COLORS.surface.card,
        borderRadius: RADII.xl + 2,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        padding: SPACING.lg,
        paddingTop: SPACING.lg + 2,
        position: 'relative',
        overflow: 'hidden',
        ...SHADOWS.card,
    },
    planTopAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: COLORS.brand.primary,
        opacity: 0.4,
    },
    planSaveBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.status.success,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
        zIndex: 2,
    },
    planSaveBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: COLORS.text.inverse,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    planTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    planName: {
        ...TYPOGRAPHY.title,
        fontSize: 15,
        color: COLORS.text.primary,
        letterSpacing: -0.3,
        flex: 1,
        marginRight: SPACING.md,
    },
    planPriceOrig: {
        fontSize: 11,
        color: COLORS.text.muted,
        textDecorationLine: 'line-through',
    },
    planPriceNow: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.brand.primary,
        marginTop: 2,
    },
    planValidity: { fontSize: 10, color: COLORS.text.secondary, marginTop: 2 },
    freqBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(18,70,240,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(18,70,240,0.14)',
        borderRadius: RADII.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: SPACING.md,
    },
    freqBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.brand.primary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    btnView: {
        flex: 1,
        paddingVertical: SPACING.md - 2,
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1.5,
        borderColor: COLORS.border.strong,
        borderRadius: RADII.lg - 2,
        alignItems: 'center',
    },
    btnViewText: { fontSize: 11.5, fontWeight: '600', color: COLORS.text.secondary },
    btnSubWrap: {
        flex: 1,
        borderRadius: RADII.lg - 2,
        overflow: 'hidden',
        ...SHADOWS.cta,
        shadowOpacity: 0.28,
    },
    btnSub: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: SPACING.md - 2,
    },
    btnSubText: { fontSize: 11.5, fontWeight: '700', color: COLORS.text.inverse },
});

export default HomeScreenPresentation;
