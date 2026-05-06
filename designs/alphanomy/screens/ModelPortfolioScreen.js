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

// Fallback plan rows used when the container hasn't supplied catalog data
// yet (boot, no auth, no advisor config, empty catalog response). Same
// shape that `src/utils/alphanomyPlanShape.js` produces.
const FALLBACK_PLANS = {
    bespoke: [
        {
            id: 'fallback-momentum-weekly',
            name: 'Momentum Weekly',
            priceNow: '₹ 1.00',
            validity: 'Validity: 12 Days',
            freq: 'Weekly',
            freqVariant: 'amber',
        },
        {
            id: 'fallback-sanjana-premium',
            name: 'Sanjana Premium',
            priceOrig: '₹ 3,487',
            priceNow: '₹ 2,999',
            validity: 'Monthly validity',
            freq: 'Monthly',
            saveBadge: 'Save 14%',
        },
        {
            id: 'fallback-recurring-growth',
            name: 'Recurring Growth',
            priceNow: '₹ 100.00',
            validity: 'Monthly validity',
            freq: 'Monthly',
        },
    ],
    mp: [
        {
            id: 'fallback-alpha-growth',
            name: 'Alpha Growth Plan',
            priceNow: '₹ 20.00',
            validity: 'Monthly validity',
            freq: 'Monthly',
        },
    ],
};

const ModelPortfolioScreenAlphanomy = ({ viewModel, actions, home }) => {
    const userEmail = home?.userEmail || viewModel?.userEmail || '';
    const config = home?.config || viewModel?.config;
    const tickers = home?.tickers || viewModel?.tickers;
    // Live plan rows from container; fall back to design-preview entries
    // when the catalog is empty (boot, no auth, no advisor config).
    const livePlans = viewModel?.alphanomyPlans;
    const liveBespoke = livePlans?.bespoke?.length ? livePlans.bespoke : null;
    const liveMp = livePlans?.mp?.length ? livePlans.mp : null;

    const [tab, setTab] = useState('bespoke');
    const plans =
        tab === 'bespoke'
            ? liveBespoke || FALLBACK_PLANS.bespoke
            : liveMp || FALLBACK_PLANS.mp;

    return (
        <SafeAreaView style={styles.safe}>
            <AppHeader userEmail={userEmail} config={config} tickers={tickers} />

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

                {plans.map((plan, idx) => (
                    <PlanCard key={plan.id || idx} plan={plan} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const PlanCard = ({ plan }) => {
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
                <TouchableOpacity style={styles.btnView} activeOpacity={0.85}>
                    <Text style={styles.btnViewText}>View More</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSubWrap} activeOpacity={0.9}>
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
