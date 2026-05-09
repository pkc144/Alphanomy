/**
 * ModelPortfolioScreen — alphanomy variant presentation (2026-05-04, live-
 * data wired 2026-05-05)
 *
 * Source design: alphanomy-improved.html § "07 · Plans". This is the screen
 * the bottom-tab "Plans" entry mounts (`<ModelPortfolioScreen type="tab" />`
 * in Navigation.js). Renders the shared alphanomy app header, pill tabs
 * (Bespoke Plans / Model Portfolio with active-grad fill), and a stack of
 * plan cards (Save % badge, original-price strikethrough, frequency pill,
 * View More + gradient Subscribe Now CTAs).
 *
 * Live data: `viewModel.alphanomyPlans = { mp, bespoke }` produced by the
 * MP container by mapping `allStrategy` / `allBespoke` through
 * `src/utils/alphanomyPlanShape.js`. When either list is empty (boot, no
 * auth, no catalog data) the presentation falls back to SAMPLE_PLANS so
 * the cards never render empty.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
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

const ModelPortfolioScreenAlphanomy = ({ viewModel, actions, home, slots }) => {
    const userEmail = home?.userEmail || viewModel?.userEmail || '';
    const userName = home?.userName || viewModel?.userName || '';
    const config = home?.config || viewModel?.config;
    const tickers = home?.tickers || viewModel?.tickers;
    // Modal slots produced by the container — `MPInvestNowModal`, success +
    // recommendation modals, etc. Render them as siblings of the SafeAreaView
    // so they overlay the whole screen (the container gates each slot on its
    // own state, e.g. `paymentModal ? <MPInvestNowModal /> : null`).
    const {
        InvestNowModalSlot = null,
        PaymentSuccessSlot = null,
        RecommendationSuccessSlot = null,
    } = slots || {};
    // Live plan rows from the container — `viewModel.alphanomyPlans` is
    // shaped from `allStrategy`/`allBespoke` via `alphanomyPlanShape.js`.
    // Empty arrays render an empty state (no fake placeholders).
    const livePlans = viewModel?.alphanomyPlans;
    const bespokePlans = livePlans?.bespoke || [];
    const mpPlans = livePlans?.mp || [];

    const { tabIndex = 0 } = viewModel || {};
    const [tab, setTab] = useState(tabIndex === 0 ? 'bespoke' : 'mp');

    // Sync local tab state with container's tabIndex (e.g. when navigating from Home View All)
    React.useEffect(() => {
        setTab(tabIndex === 0 ? 'bespoke' : 'mp');
    }, [tabIndex]);

    const plans = tab === 'bespoke' ? bespokePlans : mpPlans;

    return (
        <SafeAreaView style={styles.safe}>
            <AppHeader
                userEmail={userEmail}
                userName={userName}
                config={config}
                tickers={tickers}
            />

            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.pillTabs}>
                    <TouchableOpacity
                        style={[
                            styles.pillTab,
                            tab === 'bespoke' && styles.pillTabHidden,
                        ]}
                        onPress={() => setTab('bespoke')}
                        activeOpacity={0.85}
                    >
                        {tab === 'bespoke' ? (
                            <LinearGradient
                                colors={GRADIENTS.brand}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.pillTabGradFill}
                            >
                                <Text style={styles.pillTabTextActiveGrad}>Bespoke Plans</Text>
                            </LinearGradient>
                        ) : (
                            <Text style={styles.pillTabText}>Bespoke Plans</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.pillTab,
                            tab === 'mp' && styles.pillTabHidden,
                        ]}
                        onPress={() => setTab('mp')}
                        activeOpacity={0.85}
                    >
                        {tab === 'mp' ? (
                            <LinearGradient
                                colors={GRADIENTS.brand}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.pillTabGradFill}
                            >
                                <Text style={styles.pillTabTextActiveGrad}>Model Portfolio</Text>
                            </LinearGradient>
                        ) : (
                            <Text style={styles.pillTabText}>Model Portfolio</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {plans.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>
                            No {tab === 'bespoke' ? 'bespoke plans' : 'model portfolios'} yet
                        </Text>
                        <Text style={styles.emptySub}>
                            Plans configured for your advisor will appear here.
                        </Text>
                    </View>
                ) : (
                    plans.map((plan, idx) => (
                        <PlanCard
                            key={plan.id || idx}
                            plan={plan}
                            onSubscribe={() =>
                                actions?.onSubscribe?.(plan.id, tab)
                            }
                            onViewMore={() =>
                                actions?.onViewMore?.(plan.id, tab)
                            }
                        />
                    ))
                )}
            </ScrollView>
            {/* Modal slots — gated by container state, render nothing when closed. */}
            {InvestNowModalSlot}
            {PaymentSuccessSlot}
            {RecommendationSuccessSlot}
        </SafeAreaView>
    );
};

const PlanCard = ({ plan, onSubscribe, onViewMore }) => {
    const hasDiscount = !!plan.priceOrig;
    return (
        <View style={styles.planCard}>
            <View style={styles.planTopAccent} />
            {plan.saveBadge ? (
                <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>{plan.saveBadge}</Text>
                </View>
            ) : null}
            <View style={styles.topRow}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceWrap}>
                    {hasDiscount ? (
                        <>
                            <Text style={styles.priceOrig}>{plan.priceOrig}</Text>
                            <Text style={styles.priceNow}>{plan.priceNow}</Text>
                        </>
                    ) : (
                        <Text style={styles.priceFlat}>
                            {/* Bespoke shape exposes priceNow; MP shape exposes price.
                               Either works as the flat-price field. */}
                            {plan.priceNow || plan.price}
                        </Text>
                    )}
                    <Text style={styles.validity}>{plan.validity}</Text>
                </View>
            </View>

            <View
                style={[
                    styles.freqBadge,
                    plan.freqVariant === 'amber' && styles.freqBadgeAmber,
                ]}
            >
                <Text
                    style={[
                        styles.freqBadgeText,
                        plan.freqVariant === 'amber' && styles.freqBadgeTextAmber,
                    ]}
                >
                    {plan.freq}
                </Text>
            </View>

            <View style={styles.btnRow}>
                <TouchableOpacity
                    style={styles.btnView}
                    activeOpacity={0.85}
                    onPress={onViewMore}
                >
                    <Text style={styles.btnViewText}>View More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.btnSubWrap}
                    activeOpacity={0.9}
                    onPress={onSubscribe}
                >
                    <LinearGradient
                        colors={GRADIENTS.brand}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.btnSub}
                    >
                        <Text style={styles.btnSubText}>Subscribe Now</Text>
                        <ArrowUpRight size={13} color={COLORS.text.inverse} strokeWidth={2.2} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.surface.base },
    flex: { flex: 1 },
    body: {
        padding: SPACING.lg - 2,
        gap: SPACING.md - 2,
        paddingBottom: SPACING.huge,
    },

    emptyState: {
        paddingVertical: SPACING.huge,
        alignItems: 'center',
    },
    emptyTitle: {
        ...TYPOGRAPHY.bodyEmphasis,
        fontSize: 14,
        color: COLORS.text.primary,
    },
    emptySub: {
        fontSize: 11,
        color: COLORS.text.muted,
        marginTop: 6,
        textAlign: 'center',
    },

    pillTabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: 13,
        padding: 3,
        gap: 2,
        marginBottom: SPACING.sm + 2,
    },
    pillTab: {
        flex: 1,
        borderRadius: 11,
        overflow: 'hidden',
    },
    pillTabHidden: { backgroundColor: 'transparent' },
    pillTabGradFill: {
        paddingVertical: 9,
        alignItems: 'center',
        borderRadius: 11,
    },
    pillTabText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.text.secondary,
        textAlign: 'center',
        paddingVertical: 9,
    },
    pillTabTextActiveGrad: {
        fontSize: 11.5,
        fontWeight: '700',
        color: COLORS.text.inverse,
    },

    // Plan card (white)
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
    saveBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.status.success,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
        zIndex: 2,
    },
    saveBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: COLORS.text.inverse,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    planName: {
        ...TYPOGRAPHY.title,
        fontSize: 15,
        color: COLORS.text.primary,
        flex: 1,
        marginRight: SPACING.md,
    },
    priceWrap: { alignItems: 'flex-end' },
    priceFlat: { ...TYPOGRAPHY.bodyEmphasis, fontSize: 15, color: COLORS.text.primary },
    priceOrig: {
        fontSize: 11,
        color: COLORS.text.muted,
        textDecorationLine: 'line-through',
    },
    priceNow: { fontSize: 15, fontWeight: '700', color: COLORS.brand.primary, marginTop: 2 },
    validity: { fontSize: 10, color: COLORS.text.secondary, marginTop: 2 },

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
    freqBadgeAmber: {
        backgroundColor: 'rgba(245,158,11,0.09)',
        borderColor: 'rgba(245,158,11,0.20)',
    },
    freqBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.brand.primary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    freqBadgeTextAmber: { color: '#B45309' },

    btnRow: { flexDirection: 'row', gap: SPACING.sm },
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

export default ModelPortfolioScreenAlphanomy;
