/**
 * BespokePerformanceScreen — alphanomy variant presentation.
 *
 * Override of `screens.BespokePerformanceScreen`. Container at
 * `src/screens/Drawer/BespokePerformanceScreen.js` resolves this presentation
 * after navigation from the alphanomy HomeScreen "View More" button for
 * Bespoke Plans. Container owns all data, pricing options, calculation logic.
 *
 * Alphanomy aesthetics: brand gradient hero, pill tabs, premium spacing.
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
    ScrollView,
} from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { ChevronLeft, ArrowUpRight, CheckCircle, Info } from 'lucide-react-native';
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

const BespokePerformanceScreen = ({ viewModel, actions }) => {
    const {
        modelName = '',
        currentPrice = 0,
        originalPrice = 0,
        discount = 0,
        pricingOptions = [],
        selectedPricing = null,
        index = 0,
        routes = [],
        isActive = false,
        subscriptionStatus = '',
        specificPlanDetails,
        singleStrategyDetails,
        strategyDetails,
        chartData = [],
        colorMap = {},
        calculatedPortfolioData = [],
        calculatedLoading = false,
        paymentModal = false,
    } = viewModel || {};

    const {
        onGoBack = () => {},
        onSelectedPricingChange = () => {},
        onTabIndexChange = () => {},
        onInvestNow = () => {},
        onHandleTabLayout = () => {},
        onCalculateRebalance = () => {},
    } = actions || {};

    // Render scenes for the TabView
    const renderScene = SceneMap({
        keyfeatures: () => (
            <ScrollView style={styles.tabScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.tabContent}>
                    <Text style={styles.tabTitle}>Key Features</Text>
                    {specificPlanDetails?.features?.map((feature, idx) => (
                        <View key={idx} style={styles.featureItem}>
                            <CheckCircle size={16} color={COLORS.brand.primary} />
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    )) || (
                        <View style={styles.emptyTab}>
                            <Info size={24} color={COLORS.text.tertiary} />
                            <Text style={styles.emptyTabText}>Details coming soon</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        ),
        overview: () => (
            <ScrollView style={styles.tabScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.tabContent}>
                    <Text style={styles.tabTitle}>Strategy Overview</Text>
                    <Text style={styles.overviewText}>
                        {strategyDetails?.description || 'No description available for this plan.'}
                    </Text>
                </View>
            </ScrollView>
        ),
    });

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.flex}>
                <LinearGradient
                    colors={GRADIENTS.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroTopRow}>
                        <TouchableOpacity
                            onPress={onGoBack}
                            style={styles.backBtn}
                            activeOpacity={0.8}
                        >
                            <ChevronLeft size={20} color={COLORS.text.inverse} strokeWidth={2.2} />
                        </TouchableOpacity>
                        <Text style={styles.heroBreadcrumb}>Bespoke Plan</Text>
                    </View>

                    <Text style={styles.heroTitle} numberOfLines={2}>
                        {modelName}
                    </Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceCurrent}>
                            ₹ {currentPrice ? Number(currentPrice).toFixed(2) : '0.00'}
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
                                        onPress={() => onSelectedPricingChange(option.period)}
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
                </LinearGradient>

                <View style={styles.tabHost}>
                    <TabView
                        navigationState={{ index, routes }}
                        renderScene={renderScene}
                        onIndexChange={onTabIndexChange}
                        initialLayout={{ width: screenWidth }}
                        renderTabBar={(props) => (
                            <View style={styles.tabBar}>
                                {props.navigationState.routes.map((route, i) => {
                                    const isFocused = index === i;
                                    return (
                                        <TouchableOpacity
                                            key={route.key}
                                            onPress={() => onTabIndexChange(i)}
                                            style={[
                                                styles.tabItem,
                                                isFocused && styles.tabItemActive,
                                            ]}
                                        >
                                            <Text style={[
                                                styles.tabItemText,
                                                isFocused && styles.tabItemTextActive
                                            ]}>
                                                {route.title}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    />
                </View>
            </View>

            <View style={styles.bottomBar}>
                {isActive ? (
                    <View style={styles.subscribedPill}>
                        <Text style={styles.subscribedText}>Active Subscription</Text>
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
                            <Text style={styles.ctaText}>Subscribe Now</Text>
                            <ArrowUpRight size={15} color={COLORS.text.inverse} strokeWidth={2.2} />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.surface.base },
    flex: { flex: 1 },
    hero: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.lg,
        borderBottomLeftRadius: RADII.xl,
        borderBottomRightRadius: RADII.xl,
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
    },
    heroTitle: {
        ...TYPOGRAPHY.title,
        fontSize: 20,
        color: COLORS.text.inverse,
        marginBottom: SPACING.md,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    priceCurrent: {
        ...TYPOGRAPHY.title,
        fontSize: 18,
        color: COLORS.text.inverse,
        fontWeight: '800',
    },
    priceOriginal: {
        fontSize: 13,
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
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.text.inverse,
    },
    pricingPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    pricingPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADII.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    pricingPillActive: {
        backgroundColor: 'rgba(255,255,255,0.28)',
        borderColor: 'transparent',
    },
    pricingPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    pricingPillTextActive: { color: COLORS.text.inverse, fontWeight: '700' },

    tabHost: { flex: 1, marginTop: SPACING.md },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADII.pill,
        backgroundColor: COLORS.surface.card,
        borderWidth: 1,
        borderColor: COLORS.border.default,
    },
    tabItemActive: {
        backgroundColor: COLORS.brand.primary,
        borderColor: COLORS.brand.primary,
    },
    tabItemText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    tabItemTextActive: { color: COLORS.text.inverse },

    tabScroll: { flex: 1 },
    tabContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    tabTitle: {
        ...TYPOGRAPHY.title,
        fontSize: 16,
        marginBottom: SPACING.md,
        color: COLORS.text.primary,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    featureText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
    },
    overviewText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        lineHeight: 20,
    },
    emptyTab: { alignItems: 'center', marginTop: 40, gap: SPACING.sm },
    emptyTabText: { color: COLORS.text.tertiary, fontSize: 14 },

    bottomBar: {
        padding: SPACING.lg,
        backgroundColor: COLORS.surface.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.default,
    },
    ctaWrap: { borderRadius: RADII.lg, overflow: 'hidden', ...SHADOWS.cta },
    ctaFill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
    },
    ctaText: { fontSize: 15, fontWeight: '700', color: COLORS.text.inverse },
    subscribedPill: {
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.status.success,
        borderRadius: RADII.lg,
        alignItems: 'center',
    },
    subscribedText: { fontSize: 15, fontWeight: '700', color: COLORS.text.inverse },
});

export default BespokePerformanceScreen;
