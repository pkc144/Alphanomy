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
 * Each live source renders only when populated — no hardcoded placeholder
 * copy. Empty/null sources hide their section entirely:
 *   - empty/warming `tickers` → ticker strip omitted
 *   - null `heroPlan`         → Model Portfolios section omitted
 *   - null `bespokePlan`      → Top Bespoke Plans section omitted
 * The P&L hero always renders — a connected broker with no positions and
 * a missing broker both legitimately read ₹0.00, so suppressing it would
 * conflate two real states.
 *
 * The "View All" links navigate to the `Plans` tab (`goToPlans`) with a
 * `{ kind: 'mp' | 'bespoke' }` route param so `ModelPortfolioScreen` lands
 * on the matching variant tab. Subscribe buttons add `subscribe: true` and
 * the plan name; the MP container's `useRoute()` effect auto-opens the
 * payment modal for that plan on arrival.
 *
 * Receives the same `home` prop bag as designs/default/screens/HomeScreen.js
 * — additional fields (tickers / pnlSummary / heroPlan / bespokePlan) are
 * additive; default presentation ignores them.
 */

import React from 'react';
import { useNavigation } from '@react-navigation/native';
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
import { ArrowUpRight } from 'lucide-react-native';
import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
    DEFAULT_SHADOWS as SHADOWS,
} from '../tokens';
import AppHeader from './_AppHeader';

// All sections render strictly from the `home` prop bag supplied by the
// container (`src/screens/Home/HomeScreen.js`). When a live data source is
// empty/null the corresponding section is omitted entirely — no hardcoded
// placeholder copy. Empty states the user might encounter:
//   - tickers: WebSocket warmup or no MarketDataContext provider → strip hidden
//   - heroPlan: catalog endpoint returned no model portfolios → MP card hidden
//   - bespokePlan: catalog returned no bespoke plans → bespoke card hidden
//   - pnlSummary: no broker connected → P&L hero shows ₹0.00 (legitimate state,
//                 not a fallback — a connected broker with zero positions
//                 looks the same)

// Hardcoded section subtitles used when the backend has no
// `appadvisors.taglines.home` override for this tenant. Same per-field
// fallback contract as `FALLBACK_TAGLINES` on Login/Signup — a tenant can
// set just one field (e.g. only `modelPortfoliosSubtitle`) and the others
// stay on these defaults. See `docs/TENANT_TAGLINES.md § home` for the
// backend schema.
const FALLBACK_HOME_TAGLINES = {
    recommendationsSubtitle: 'Bespoke Active Recommendations',
    modelPortfoliosSubtitle: 'Ranked by user feedback',
    bespokePlansSubtitle: 'Ranked by user feedback',
};

const HomeScreenPresentation = ({ home }) => {
    const {
        userEmail = '',
        config,
        isRefreshing = false,
        onRefresh = () => {},
        tickers,
        pnlSummary,
        heroPlan,
        bespokePlan,
        userName,
        rebalanceList,
        recommendationList,
        taglines,
    } = home || {};

    // Per-field merge with FALLBACK_HOME_TAGLINES so a partial backend
    // override doesn't blank the un-set fields.
    const homeCopy = {
        recommendationsSubtitle:
            taglines?.recommendationsSubtitle ||
            FALLBACK_HOME_TAGLINES.recommendationsSubtitle,
        modelPortfoliosSubtitle:
            taglines?.modelPortfoliosSubtitle ||
            FALLBACK_HOME_TAGLINES.modelPortfoliosSubtitle,
        bespokePlansSubtitle:
            taglines?.bespokePlansSubtitle ||
            FALLBACK_HOME_TAGLINES.bespokePlansSubtitle,
    };

    // Header (greeting + ticker strip) is delegated to the shared `<AppHeader>`
    // helper so all alphanomy screens — Home / Order / ModelPortfolio /
    // Portfolio — render an identical top bar. Greeting/initials derivation
    // and ticker rendering live in `_AppHeader.js`; this screen just supplies
    // the live data via props.

    // Plan-card actions (View More + Subscribe on both cards) navigate to the
    // `Plans` tab — that's where `ModelPortfolioScreen` lives, which already
    // owns the full subscription / `MPInvestNowModal` / Razorpay flow. We
    // pass `{ openPlan, kind }` route params so a future MP-screen update can
    // auto-open the payment modal when arriving from Home (today the user
    // taps Subscribe again on the plan card; safe MVP).
    const navigation = useNavigation();
    const goToPlans = (params) => {
        if (!navigation || typeof navigation.navigate !== 'function') return;
        navigation.navigate('Plans', params || undefined);
    };

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

            {/* Shared alphanomy top bar — same component used by OrderScreen,
                ModelPortfolioScreen, PortfolioScreen. */}
            <AppHeader
                userEmail={userEmail}
                userName={userName}
                config={config}
                tickers={tickers}
            />

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

                {/* Portfolio Recommendations (MP rebalances) intentionally
                    omitted on Home for now per product. The data is still
                    surfaced via `home.rebalanceList` and rendered by the
                    Plans tab — un-comment the prior block to restore. */}

                {/* Active bespoke recommendations — same data the legacy
                    <StockAdvices type="home"> reads. Tap → Plans tab (bespoke). */}
                {Array.isArray(recommendationList) && recommendationList.length > 0 ? (
                    <View>
                        <View style={styles.secHd}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.secTitle}>Recommendations</Text>
                                <Text style={styles.secSub}>
                                    {homeCopy.recommendationsSubtitle}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => goToPlans({ kind: 'bespoke' })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.secLink}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ gap: SPACING.sm }}>
                            {recommendationList.slice(0, 3).map((reco, i) => {
                                const symbol =
                                    reco?.Symbol || reco?.symbol || reco?.tradingSymbol || 'Symbol';
                                const rawAction =
                                    reco?.Type || reco?.action || reco?.transactionType || '';
                                const action = String(rawAction).toUpperCase() || 'BUY';
                                const isBuy = action.startsWith('B');
                                const qty = Number(reco?.Quantity || reco?.quantity || 0);
                                const price = Number(reco?.Price || reco?.price || 0);
                                const date = reco?.recoDate || reco?.date || reco?.created_at;
                                const dateStr = date
                                    ? new Date(date).toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                      })
                                    : null;
                                const qtyPriceStr = qty
                                    ? `Qty ${qty}${price ? ` @ ₹${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : ''}`
                                    : null;
                                return (
                                    <TouchableOpacity
                                        key={reco?._id || `${symbol}-${i}`}
                                        activeOpacity={0.85}
                                        onPress={() => goToPlans({ kind: 'bespoke' })}
                                        style={styles.activityCard}
                                    >
                                        <View style={styles.activityRow}>
                                            <Text style={styles.activityName} numberOfLines={1}>
                                                {symbol}
                                            </Text>
                                            <View
                                                style={
                                                    isBuy
                                                        ? styles.actionBadgeBuy
                                                        : styles.actionBadgeSell
                                                }
                                            >
                                                <Text
                                                    style={
                                                        isBuy
                                                            ? styles.actionBadgeBuyText
                                                            : styles.actionBadgeSellText
                                                    }
                                                >
                                                    {isBuy ? 'BUY' : 'SELL'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.activityMeta} numberOfLines={1}>
                                            {[qtyPriceStr, dateStr].filter(Boolean).join(' · ')}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* Model Portfolios section — rendered only when the catalog
                    endpoint has returned at least one MP plan. */}
                {heroPlan ? (
                    <View>
                        <View style={styles.secHd}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.secTitle}>Model Portfolios</Text>
                                <Text style={styles.secSub}>{homeCopy.modelPortfoliosSubtitle}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => goToPlans({ kind: 'mp' })}
                                activeOpacity={0.7}
                            >
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
                                    <Text style={styles.badgeTopText}>{heroPlan.badgeTop}</Text>
                                    <Text style={styles.badgeTopText}>{heroPlan.badgeBot}</Text>
                                </View>
                                <Text style={styles.planNameW}>{heroPlan.name}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={styles.planPriceW}>{heroPlan.price}</Text>
                                <Text style={styles.planPriceSuffix}> {heroPlan.priceSuffix}</Text>
                            </View>
                            <View style={styles.freqBadgeW}>
                                <Text style={styles.freqBadgeWText}>{heroPlan.freq}</Text>
                            </View>
                            <View style={styles.planMeta}>
                                <View style={styles.planMetaItem}>
                                    <Text style={styles.planMetaLbl}>Min. Invest</Text>
                                    <Text style={styles.planMetaVal}>{heroPlan.minInvest}</Text>
                                </View>
                                <View style={styles.planMetaItem}>
                                    <Text style={styles.planMetaLbl}>Volatility</Text>
                                    <Text style={styles.planMetaVal}>{heroPlan.volatility}</Text>
                                </View>
                                <View style={styles.planMetaItem}>
                                    <Text style={styles.planMetaLbl}>CAGR</Text>
                                    <Text style={[styles.planMetaVal, { color: '#CAC7F9' }]}>
                                        {heroPlan.cagr}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.planBtnRow}>
                                <TouchableOpacity
                                    style={styles.btnViewW}
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        goToPlans({
                                            kind: 'mp',
                                            viewMore: true,
                                            planName: heroPlan.name,
                                        })
                                    }
                                >
                                    <Text style={styles.btnViewWText}>View More</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.btnSubOutline}
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        goToPlans({ kind: 'mp', subscribe: true, planName: heroPlan.name })
                                    }
                                >
                                    <Text style={styles.btnSubOutlineText}>Subscribe</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                ) : null}

                {/* Top Bespoke Plans section — rendered only when the catalog
                    endpoint has returned at least one bespoke plan. */}
                {bespokePlan ? (
                    <View>
                        <View style={styles.secHd}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.secTitle}>Top Bespoke Plans</Text>
                                <Text style={styles.secSub}>{homeCopy.bespokePlansSubtitle}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => goToPlans({ kind: 'bespoke' })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.secLink}>View All</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.planCard}>
                            {bespokePlan.saveBadge ? (
                                <View style={styles.planSaveBadge}>
                                    <Text style={styles.planSaveBadgeText}>{bespokePlan.saveBadge}</Text>
                                </View>
                            ) : null}
                            <View style={styles.planTopAccent} />
                            <View style={styles.planTopRow}>
                                <Text style={styles.planName}>{bespokePlan.name}</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    {bespokePlan.priceOrig ? (
                                        <Text style={styles.planPriceOrig}>{bespokePlan.priceOrig}</Text>
                                    ) : null}
                                    <Text style={styles.planPriceNow}>{bespokePlan.priceNow}</Text>
                                    <Text style={styles.planValidity}>{bespokePlan.validity}</Text>
                                </View>
                            </View>
                            <View style={styles.freqBadge}>
                                <Text style={styles.freqBadgeText}>{bespokePlan.freq}</Text>
                            </View>
                            <View style={styles.planBtnRow}>
                                <TouchableOpacity
                                    style={styles.btnView}
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        goToPlans({
                                            kind: 'bespoke',
                                            viewMore: true,
                                            planName: bespokePlan.name,
                                        })
                                    }
                                >
                                    <Text style={styles.btnViewText}>View More</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={styles.btnSubWrap}
                                    onPress={() =>
                                        goToPlans({
                                            kind: 'bespoke',
                                            subscribe: true,
                                            planName: bespokePlan.name,
                                        })
                                    }
                                >
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
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.surface.base },
    flex: { flex: 1 },
    body: { padding: SPACING.lg - 2, gap: SPACING.lg - 2, paddingBottom: SPACING.huge },

    // Header styles live in `_AppHeader.js` — this screen only owns body content.

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

    // ── ACTIVITY CARDS (rebalances + recommendations) ──
    activityCard: {
        backgroundColor: COLORS.surface.card,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: RADII.lg,
        paddingHorizontal: SPACING.md + 2,
        paddingVertical: SPACING.sm + 2,
        ...SHADOWS.card,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    activityName: {
        ...TYPOGRAPHY.bodyEmphasis,
        fontSize: 13,
        color: COLORS.text.primary,
        flex: 1,
    },
    activityMeta: {
        fontSize: 11,
        color: COLORS.text.muted,
        marginTop: 3,
    },
    statusBadgePending: {
        backgroundColor: 'rgba(18,70,240,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(18,70,240,0.20)',
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    statusBadgePendingText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.brand.primary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    statusBadgeDone: {
        backgroundColor: 'rgba(34,197,94,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.22)',
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    statusBadgeDoneText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.status.success,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    statusBadgeFailed: {
        backgroundColor: 'rgba(239,68,68,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.22)',
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    statusBadgeFailedText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.status.danger,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    actionBadgeBuy: {
        backgroundColor: 'rgba(34,197,94,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.24)',
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    actionBadgeBuyText: {
        fontSize: 9,
        fontWeight: '800',
        color: COLORS.status.success,
        letterSpacing: 0.4,
    },
    actionBadgeSell: {
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.24)',
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    actionBadgeSellText: {
        fontSize: 9,
        fontWeight: '800',
        color: COLORS.status.danger,
        letterSpacing: 0.4,
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
