/**
 * MPPerformanceScreen — alphanomy variant presentation.
 *
 * Override of `screens.MPPerformanceScreen`. Container at
 * `src/screens/Drawer/MPPerformanceScreen.js` resolves this presentation
 * after navigation from the alphanomy ModelPortfolioScreen "View More"
 * button. Container owns all data, modals, EDIS gating, payment flow.
 *
 * Pass 1 scope (header + tabs + locked state) — recasts the legacy dark-
 * blue gradient hero to the alphanomy indigo→purple brand gradient, ports
 * the pricing pills + stats grid + rebalance row to the variant's spacing
 * + typography tokens, swaps the legacy CustomTabBar for the variant's
 * pill-tabs composite (resolved via slots), and replaces the lock-state
 * empty view (also via composite). The tab body slots themselves
 * (PortfolioTabSlot, OverviewTabSlot, ResearchTabSlot) still render
 * through legacy chrome — pass 2 will theme those distribution / chart /
 * methodology blocks against the alphanomy palette.
 *
 * Contract identical to default's screen — viewModel + actions + slots
 * shape unchanged so the container doesn't need to know which variant is
 * active.
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    SafeAreaView,
    Modal,
} from 'react-native';
import WebView from 'react-native-webview';
import { TabView, SceneMap } from 'react-native-tab-view';
import { ChevronLeft, TrendingUp, Gauge, X, ArrowUpRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
    DEFAULT_SHADOWS as SHADOWS,
} from '../tokens';

const screenWidth = Dimensions.get('window').width;

const MPPerformanceScreen = ({ viewModel, actions, slots }) => {
    const {
        modelName = '',
        imageUri = null,
        fallbackImage,
        currentPrice = 0,
        originalPrice = 0,
        discount = 0,
        gstLabel = '',
        pricingOptions = [],
        selectedPricing = null,
        minInvestment = null,
        volatility = null,
        cagrDisplay = 'View',
        cagrClickable = true,
        globalConsent = false,
        frequency = null,
        nextRebalanceDate = '',
        isSubscribed = false,
        investButtonLabel = 'Invest now',
        tabIndex = 0,
        routes = [],
        isActive = false,
        researchWebViewUrl = null,
    } = viewModel || {};

    const {
        onGoBack = () => {},
        onSelectPricing = () => {},
        onConsentOpen = () => {},
        onTabIndexChange = () => {},
        onInvestNow = () => {},
        onCloseResearchWebView = () => {},
    } = actions || {};

    const {
        ConsentPopupSlot = null,
        PortfolioTabSlot,
        OverviewTabSlot,
        ResearchTabSlot,
        TabBarSlot,
        InvestNowModalSlot = null,
        PaymentSuccessSlot = null,
        ReviewTradeModalSlot = null,
        RecommendationSuccessSlot = null,
        SubscribeModalSlot = null,
        DdpiModalSlot = null,
        AngelOneTpinSlot = null,
        DhanTpinSlot = null,
        FyersTpinSlot = null,
        OtherBrokerSlot = null,
    } = slots || {};

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.flex}>
                {/* Hero header — gradient indigo→purple card with back button,
                    plan title, price + pricing pills, stat grid, rebalance row.
                    Mirrors the legacy hero structure but recoloured + retyped
                    against alphanomy tokens. */}
                <LinearGradient
                    colors={GRADIENTS.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroTopRow}>
                        <TouchableOpacity
                            onPress={onGoBack}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.backBtn}
                            activeOpacity={0.8}
                        >
                            <ChevronLeft size={20} color={COLORS.text.inverse} strokeWidth={2.2} />
                        </TouchableOpacity>
                        <Text style={styles.heroBreadcrumb}>Model Portfolio</Text>
                    </View>

                    <View style={styles.heroIdRow}>
                        <View style={styles.heroLogoWrap}>
                            <Image
                                source={imageUri ? { uri: imageUri } : fallbackImage}
                                style={styles.heroLogo}
                            />
                        </View>
                        <Text style={styles.heroTitle} numberOfLines={2}>
                            {modelName}
                        </Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceCurrent}>
                            ₹ {currentPrice ? Number(currentPrice).toFixed(2) : '0.00'}
                            <Text style={styles.priceGst}>{gstLabel}</Text>
                        </Text>
                        {discount > 0 ? (
                            <>
                                <Text style={styles.priceOriginal}>
                                    ₹ {Number(originalPrice).toFixed(2)}
                                </Text>
                                <View style={styles.savePill}>
                                    <Text style={styles.savePillText}>SAVE {discount}%</Text>
                                </View>
                            </>
                        ) : null}
                    </View>

                    {pricingOptions.length > 0 ? (
                        <View style={styles.pricingPills}>
                            {pricingOptions.map((option) => {
                                const isSelected = option.period === selectedPricing;
                                return (
                                    <TouchableOpacity
                                        key={option.period}
                                        onPress={() => onSelectPricing(option.period)}
                                        style={[
                                            styles.pricingPill,
                                            isSelected && styles.pricingPillActive,
                                        ]}
                                        activeOpacity={0.85}
                                    >
                                        <Text
                                            style={[
                                                styles.pricingPillText,
                                                isSelected && styles.pricingPillTextActive,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : null}

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Min. Investment</Text>
                            <Text style={styles.statValue}>
                                {minInvestment != null ? `₹ ${Number(minInvestment).toFixed(2)}` : '—'}
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={styles.statLabelRow}>
                                <Text style={styles.statLabel}>Volatility</Text>
                                <Gauge size={11} color="rgba(255,255,255,0.85)" />
                            </View>
                            <Text
                                style={[
                                    styles.statValue,
                                    !globalConsent && styles.statValueBlur,
                                ]}
                            >
                                {volatility ?? '—'}
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={styles.statLabelRow}>
                                <Text style={styles.statLabel}>CAGR</Text>
                                <TrendingUp size={11} color="rgba(255,255,255,0.85)" />
                            </View>
                            <TouchableOpacity
                                onPress={onConsentOpen}
                                disabled={!cagrClickable}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.statValue}>{cagrDisplay}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.rebalanceRow}>
                        <View style={styles.rebalanceCell}>
                            <Text style={styles.rebalanceLabel}>Rebalance</Text>
                            <Text style={styles.rebalanceValue}>{frequency ?? '—'}</Text>
                        </View>
                        <View style={styles.rebalanceCell}>
                            <Text style={styles.rebalanceLabel}>Next Rebalance</Text>
                            <Text style={styles.rebalanceValue}>
                                {nextRebalanceDate || '—'}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {ConsentPopupSlot}

                {/* Tab body — slot resolves to the alphanomy CustomTabbar
                    composite (gradient pill tabs) and the unchanged tab
                    content scenes. The locked Portfolio scene resolves to
                    the alphanomy EmptyStateMP composite via the container's
                    presentation registry. */}
                <View style={styles.tabHost}>
                    <TabView
                        navigationState={{ index: tabIndex, routes }}
                        renderScene={SceneMap({
                            portfolio: PortfolioTabSlot || (() => null),
                            overview: OverviewTabSlot || (() => null),
                            research: ResearchTabSlot || (() => null),
                        })}
                        onIndexChange={onTabIndexChange}
                        initialLayout={{ width: screenWidth }}
                        renderTabBar={
                            TabBarSlot ? (props) => TabBarSlot(props) : undefined
                        }
                    />
                </View>
            </View>

            {/* Sticky bottom CTA — gradient Subscribe Now / Subscribed pill. */}
            <View style={styles.bottomBar}>
                {isSubscribed ? (
                    <View style={styles.subscribedPill}>
                        <Text style={styles.subscribedText}>Subscribed</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={onInvestNow}
                        activeOpacity={0.9}
                        style={styles.ctaWrap}
                    >
                        <LinearGradient
                            colors={GRADIENTS.brand}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ctaFill}
                        >
                            <Text style={styles.ctaText}>{investButtonLabel}</Text>
                            <ArrowUpRight
                                size={15}
                                color={COLORS.text.inverse}
                                strokeWidth={2.2}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>

            {InvestNowModalSlot}
            {PaymentSuccessSlot}
            {ReviewTradeModalSlot}
            {RecommendationSuccessSlot}
            {DdpiModalSlot}
            {AngelOneTpinSlot}
            {DhanTpinSlot}
            {FyersTpinSlot}
            {OtherBrokerSlot}
            {SubscribeModalSlot}

            {/* Research Report WebView — kept identical to default; only
                background + spinner re-coloured against alphanomy tokens. */}
            <Modal
                visible={!!researchWebViewUrl}
                animationType="slide"
                onRequestClose={onCloseResearchWebView}
            >
                <SafeAreaView style={styles.webViewSafe}>
                    <View style={styles.webViewHeader}>
                        <TouchableOpacity onPress={onCloseResearchWebView} style={styles.webViewClose}>
                            <X size={20} color={COLORS.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.webViewTitle} numberOfLines={1}>
                            Research Report
                        </Text>
                    </View>
                    <WebView
                        source={{ uri: researchWebViewUrl || '' }}
                        style={styles.webView}
                        startInLoadingState
                        renderLoading={() => (
                            <View style={styles.webViewLoading}>
                                <ActivityIndicator
                                    size="large"
                                    color={COLORS.brand.primary}
                                />
                            </View>
                        )}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.surface.base },
    flex: { flex: 1 },

    // ── Hero ───────────────────────────────────────────────────────
    hero: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.lg,
        borderBottomLeftRadius: RADII.xl,
        borderBottomRightRadius: RADII.xl,
        // Clip the icon and decorative shapes to the rounded bottom edge.
        overflow: 'hidden',
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    heroBreadcrumb: {
        ...TYPOGRAPHY.bodyEmphasis,
        fontSize: 13,
        color: COLORS.text.inverse,
        letterSpacing: 0.2,
    },
    heroIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm + 2,
    },
    heroLogoWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
        overflow: 'hidden',
    },
    heroLogo: { width: 32, height: 32, resizeMode: 'contain' },
    heroTitle: {
        ...TYPOGRAPHY.title,
        fontSize: 17,
        color: COLORS.text.inverse,
        flex: 1,
    },

    // ── Price ──────────────────────────────────────────────────────
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: SPACING.sm + 2,
        marginBottom: SPACING.sm,
    },
    priceCurrent: {
        ...TYPOGRAPHY.title,
        fontSize: 16,
        color: COLORS.text.inverse,
        fontWeight: '800',
    },
    priceGst: {
        fontSize: 10,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.85)',
    },
    priceOriginal: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.65)',
        textDecorationLine: 'line-through',
    },
    savePill: {
        backgroundColor: COLORS.status.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADII.pill,
    },
    savePillText: {
        fontSize: 9,
        fontWeight: '800',
        color: COLORS.text.inverse,
        letterSpacing: 0.4,
    },

    // ── Pricing pills ──────────────────────────────────────────────
    pricingPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs + 2,
        marginBottom: SPACING.md,
    },
    pricingPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: RADII.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'transparent',
    },
    pricingPillActive: {
        backgroundColor: 'rgba(255,255,255,0.28)',
        borderColor: 'transparent',
    },
    pricingPillText: {
        fontSize: 10.5,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    pricingPillTextActive: { color: COLORS.text.inverse, fontWeight: '700' },

    // ── Stats grid ─────────────────────────────────────────────────
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: RADII.md,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm + 2,
        marginBottom: SPACING.sm + 2,
    },
    statItem: { flex: 1, alignItems: 'flex-start' },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 9.5,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text.inverse,
        marginTop: 2,
    },
    statValueBlur: { opacity: 0.5 },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.18)',
        marginHorizontal: SPACING.sm,
    },

    // ── Rebalance ──────────────────────────────────────────────────
    rebalanceRow: {
        flexDirection: 'row',
        gap: SPACING.sm + 2,
    },
    rebalanceCell: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: RADII.md,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md - 2,
    },
    rebalanceLabel: {
        fontSize: 9.5,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    rebalanceValue: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text.inverse,
        marginTop: 3,
    },

    // ── Tab host ───────────────────────────────────────────────────
    tabHost: {
        flex: 1,
        backgroundColor: COLORS.surface.card,
        marginTop: SPACING.sm,
    },

    // ── Bottom CTA ─────────────────────────────────────────────────
    bottomBar: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.surface.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.default,
    },
    ctaWrap: {
        borderRadius: RADII.lg,
        overflow: 'hidden',
        ...SHADOWS.cta,
        shadowOpacity: 0.28,
    },
    ctaFill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs + 2,
        paddingVertical: SPACING.md,
    },
    ctaText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text.inverse,
        letterSpacing: 0.2,
    },
    subscribedPill: {
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.text.primary,
        borderRadius: RADII.lg,
        alignItems: 'center',
    },
    subscribedText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text.inverse,
        letterSpacing: 0.2,
    },

    // ── Research WebView ───────────────────────────────────────────
    webViewSafe: { flex: 1, backgroundColor: COLORS.surface.card },
    webViewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.default,
    },
    webViewClose: { padding: 4 },
    webViewTitle: {
        ...TYPOGRAPHY.bodyEmphasis,
        fontSize: 14,
        color: COLORS.text.primary,
        marginLeft: SPACING.md,
        flex: 1,
    },
    webView: { flex: 1 },
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MPPerformanceScreen;
