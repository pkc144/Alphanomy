/**
 * PortfolioScreen — alphanomy variant presentation (2026-05-05)
 *
 * Source design: alphanomy-improved.html § "05 · Portfolio". Renders the
 * shared alphanomy app header (greeting + ticker strip), a gradient `pl-hero`
 * P&L card with grid-line texture and a "Total Returns" floating badge,
 * pill-tabs for Model Portfolios vs All Holdings (mirrors the legacy
 * `selectedInnerTab` toggle), under-tabs for Holdings vs Positions (mirrors
 * the legacy `tabIndex` toggle), and either an empty-state card or the legacy
 * `renderAllHoldings` / `renderPositions` / `renderModalPFCard` rows wrapped
 * in alphanomy chrome.
 *
 * Data contract: same `portfolio` prop bag as the default presentation
 * (`designs/default/screens/PortfolioScreen.js`). The render closures
 * (`renderAllHoldings` / `renderPositions` / `renderModalPFCard`) are reused
 * from the container's scope unchanged so list rows look identical to the
 * legacy default. Variant-specific extras (`tickers`, `userEmail`, `config`)
 * are read from the prop bag but fall back gracefully when absent.
 *
 * Container behavior reused as-is:
 *   - Plan-picker modal (Modal+overlay) — kept inline, restyled to alphanomy.
 *   - HoldingScoreModal — rendered at the end (same as default).
 *   - PanResponder gestures — wired through outer wrapper for swipe-to-tab.
 *   - RefreshControl — preserved on every FlatList.
 */

import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    Modal,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { CandlestickChart, Briefcase } from 'lucide-react-native';

import HoldingScoreModal from '../../../src/screens/PortfolioScreen/HoldingScoreModal';
import formatCurrency from '../../../src/utils/formatCurrency';
import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
    DEFAULT_SHADOWS as SHADOWS,
} from '../tokens';
import AppHeader from './_AppHeader';

const formatSignedCurrency = (value) => {
    const numValue = Number(value);
    if (Number.isNaN(numValue)) {return '₹0.00';}
    const formatted = formatCurrency(Math.abs(numValue));
    return numValue < 0 ? `-₹${formatted}` : `₹${formatted}`;
};

const PortfolioHero = ({ profitAndLoss, pnlPercentage, invested }) => {
    const pnl = Number(profitAndLoss) || 0;
    const returns = Number(pnlPercentage) || 0;
    const isPositive = returns >= 0;
    const arrow = isPositive ? '▲' : '▼';
    const badgeColor = isPositive ? '#3DFFA0' : '#FFA8A8';

    return (
        <View style={heroStyles.wrap}>
            <LinearGradient
                colors={GRADIENTS.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={heroStyles.card}>
                <View style={heroStyles.gridOverlay} pointerEvents="none" />
                <View style={heroStyles.glowA} pointerEvents="none" />
                <View style={heroStyles.glowB} pointerEvents="none" />

                <Text style={heroStyles.label}>Current P&amp;L</Text>
                <Text style={heroStyles.amount}>{formatSignedCurrency(pnl)}</Text>
                <Text style={heroStyles.invested}>
                    Invested · ₹ {formatCurrency(Number(invested) || 0)}
                </Text>

                <View style={heroStyles.badge}>
                    <Text style={heroStyles.badgeLabel}>Total Returns</Text>
                    <Text style={[heroStyles.badgeValue, { color: badgeColor }]}>
                        {arrow} {Math.abs(returns).toFixed(2)}%
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const EmptyCard = ({ kind, onConnectBroker }) => {
    const copy = {
        positions: {
            title: 'No Positions Yet',
            sub: 'Place orders now to seize opportunities and book profits.',
            cta: null,
            Icon: CandlestickChart,
        },
        holdings: {
            title: 'No Holdings Yet',
            sub: 'Connect your broker account to start tracking your portfolio.',
            cta: 'Connect Broker',
            Icon: Briefcase,
        },
        modelPortfolio: {
            title: 'No Subscriptions',
            sub: 'Subscribe to a model portfolio to see allocations here.',
            cta: null,
            Icon: Briefcase,
        },
    }[kind] || { title: 'Nothing here yet', sub: '', cta: null, Icon: Briefcase };

    const { Icon, title, sub, cta } = copy;

    return (
        <View style={emptyStyles.card}>
            <View style={emptyStyles.iconBg}>
                <Icon size={22} color={COLORS.brand.primary} strokeWidth={1.5} />
            </View>
            <Text style={emptyStyles.title}>{title}</Text>
            <Text style={emptyStyles.sub}>{sub}</Text>
            {cta && onConnectBroker ? (
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onConnectBroker}
                    style={{ marginTop: SPACING.md }}>
                    <LinearGradient
                        colors={GRADIENTS.brand}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={emptyStyles.cta}>
                        <Text style={emptyStyles.ctaText}>{cta}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

const PortfolioScreenAlphanomy = ({ portfolio }) => {
    const {
        // Tabs
        selectedInnerTab,
        setSelectedInnerTab,
        tabIndex,
        setTabIndex,

        // P&L hero
        effectiveHoldingsData,
        profitAndLoss,
        pnlPercentage,

        // Lists
        modelPortfolioStrategy,
        processedData,
        BrokerHoldingsData,
        PositionsData,
        planHoldings,
        planHoldingsLoading,

        // Plan picker
        showPlanPicker,
        setShowPlanPicker,
        selectedPlan,
        setSelectedPlan,
        broker,

        // Refresh + gestures
        refreshing,
        onRefresh,
        panResponder,

        // Renderers
        renderAllHoldings,
        renderPositions,
        renderModalPFCard,

        // Theme + navigation
        navigation,
        modelPortfolioEnabled,

        // Variant extras (graceful fallback if absent)
        userEmail,
        userName,
        config,
        tickers,

        // Modal
        modalVisible,
        scoreSymbol,
        setModalVisible,
    } = portfolio;

    const investedValue = Number(effectiveHoldingsData?.totalinvvalue) || 0;
    const goConnectBroker = () => navigation?.navigate?.('Broker Setting');
    const showMpTab = modelPortfolioEnabled === true;
    const isHoldingsLane = selectedInnerTab === 0;
    const isPositionsLane = isHoldingsLane && tabIndex === 1;

    const PILL_TABS = showMpTab
        ? [
              { id: 1, label: 'Model Portfolios' },
              { id: 0, label: 'All Holdings' },
          ]
        : [{ id: 0, label: 'All Holdings' }];

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.safe}>
                <AppHeader
                    userEmail={userEmail}
                    userName={userName}
                    config={config}
                    tickers={tickers}
                />

                <View {...panResponder.panHandlers} style={styles.body}>
                    <PortfolioHero
                        profitAndLoss={profitAndLoss}
                        pnlPercentage={pnlPercentage}
                        invested={investedValue}
                    />

                    {/* Pill tabs — Model Portfolios vs All Holdings */}
                    {showMpTab ? (
                        <View style={styles.pillTabs}>
                            {PILL_TABS.map((t) => {
                                const active = selectedInnerTab === t.id;
                                if (active) {
                                    return (
                                        <View key={t.id} style={styles.pillTabActiveWrap}>
                                            <LinearGradient
                                                colors={GRADIENTS.brand}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.pillTabActive}>
                                                <TouchableOpacity
                                                    activeOpacity={0.85}
                                                    onPress={() => setSelectedInnerTab(t.id)}
                                                    style={styles.pillTabHit}>
                                                    <Text style={styles.pillTabTextActive}>
                                                        {t.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            </LinearGradient>
                                        </View>
                                    );
                                }
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={styles.pillTab}
                                        activeOpacity={0.85}
                                        onPress={() => setSelectedInnerTab(t.id)}>
                                        <Text style={styles.pillTabText}>{t.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : null}

                    {selectedInnerTab === 1 ? (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => navigation?.navigate?.('TradePnLScreen')}
                            style={{ marginTop: SPACING.sm }}>
                            <LinearGradient
                                colors={GRADIENTS.brand}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.tradeReportBtn}>
                                <Text style={styles.tradeReportBtnText}>
                                    📊 View Trade P&amp;L Report
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : null}

                    {/* Plan picker row — only shown in holdings lane when MP active */}
                    {isHoldingsLane && modelPortfolioStrategy?.length > 0 ? (
                        <View style={styles.planSelectorRow}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.planDropdown}
                                onPress={() => setShowPlanPicker(true)}>
                                <Text style={styles.planDropdownLabel}>Plan</Text>
                                <Text style={styles.planDropdownValue} numberOfLines={1}>
                                    {selectedPlan || 'Select Plan'}
                                </Text>
                                <Text style={styles.planDropdownArrow}>▼</Text>
                            </TouchableOpacity>
                            <View style={styles.brokerBadge}>
                                <Text style={styles.planDropdownLabel}>Broker</Text>
                                <Text style={styles.brokerBadgeValue} numberOfLines={1}>
                                    {broker || 'Not Connected'}
                                </Text>
                            </View>
                        </View>
                    ) : null}

                    {/* Plan picker modal */}
                    <Modal
                        visible={!!showPlanPicker}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowPlanPicker(false)}>
                        <TouchableOpacity
                            style={styles.pickerOverlay}
                            activeOpacity={1}
                            onPress={() => setShowPlanPicker(false)}>
                            <View style={styles.pickerContainer}>
                                <Text style={styles.pickerTitle}>Select Plan</Text>
                                {(modelPortfolioStrategy || []).map((item, index) => {
                                    const active = selectedPlan === item.model_name;
                                    return (
                                        <TouchableOpacity
                                            key={item.model_name || index}
                                            style={[
                                                styles.pickerItem,
                                                active && styles.pickerItemSelected,
                                            ]}
                                            onPress={() => {
                                                setSelectedPlan(item.model_name);
                                                setShowPlanPicker(false);
                                            }}>
                                            <Text
                                                style={[
                                                    styles.pickerItemText,
                                                    active && styles.pickerItemTextSelected,
                                                ]}>
                                                {item.model_name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Under-tabs — Holdings vs Positions (only inside holdings lane) */}
                    {isHoldingsLane ? (
                        <View style={styles.underTabs}>
                            <TouchableOpacity
                                style={[styles.underTab, tabIndex === 2 && styles.underTabActive]}
                                onPress={() => setTabIndex(2)}>
                                <Text
                                    style={[
                                        styles.underTabText,
                                        tabIndex === 2 && styles.underTabTextActive,
                                    ]}>
                                    All Holdings
                                </Text>
                                {(selectedPlan ? planHoldings : BrokerHoldingsData?.holding)?.length > 0 ? (
                                    <Text style={styles.countDot}>
                                        {' '}
                                        {selectedPlan
                                            ? planHoldings.length
                                            : BrokerHoldingsData?.holding?.length}
                                    </Text>
                                ) : null}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.underTab, tabIndex === 1 && styles.underTabActive]}
                                onPress={() => setTabIndex(1)}>
                                <Text
                                    style={[
                                        styles.underTabText,
                                        tabIndex === 1 && styles.underTabTextActive,
                                    ]}>
                                    Positions
                                </Text>
                                {PositionsData?.length > 0 ? (
                                    <Text style={styles.countDot}> {PositionsData?.length}</Text>
                                ) : null}
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {/* Lane content */}
                    <View style={styles.laneBody}>
                        {!isHoldingsLane ? (
                            <FlatList
                                data={processedData}
                                renderItem={renderModalPFCard}
                                keyExtractor={(item, index) =>
                                    `${item?.modelName || index}_${index}`
                                }
                                ListEmptyComponent={<EmptyCard kind="modelPortfolio" />}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContent}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={!!refreshing}
                                        onRefresh={onRefresh}
                                        tintColor={COLORS.brand.primary}
                                    />
                                }
                            />
                        ) : isPositionsLane ? (
                            <FlatList
                                data={PositionsData}
                                renderItem={renderPositions}
                                keyExtractor={(item, index) =>
                                    `${item?.symbol || index}_${index}`
                                }
                                ListEmptyComponent={
                                    <EmptyCard kind="positions" onConnectBroker={goConnectBroker} />
                                }
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContent}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={!!refreshing}
                                        onRefresh={onRefresh}
                                        tintColor={COLORS.brand.primary}
                                    />
                                }
                            />
                        ) : planHoldingsLoading && selectedPlan ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator size="large" color={COLORS.brand.primary} />
                                <Text style={styles.loadingText}>Loading holdings…</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={selectedPlan ? planHoldings : BrokerHoldingsData?.holding}
                                renderItem={renderAllHoldings}
                                keyExtractor={(item, index) =>
                                    `${item?.symbol || index}_${index}`
                                }
                                ListEmptyComponent={
                                    <EmptyCard kind="holdings" onConnectBroker={goConnectBroker} />
                                }
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContent}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={!!refreshing}
                                        onRefresh={onRefresh}
                                        tintColor={COLORS.brand.primary}
                                    />
                                }
                            />
                        )}
                    </View>
                </View>

                {modalVisible ? (
                    <HoldingScoreModal
                        scoreSymbol={scoreSymbol}
                        setModalVisible={setModalVisible}
                        modalVisible={modalVisible}
                    />
                ) : null}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const heroStyles = StyleSheet.create({
    wrap: { marginTop: SPACING.sm },
    card: {
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 18,
        overflow: 'hidden',
        ...SHADOWS.card,
    },
    gridOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0.06,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    glowA: {
        position: 'absolute',
        right: -60,
        top: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    glowB: {
        position: 'absolute',
        left: 20,
        bottom: -50,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    label: {
        ...TYPOGRAPHY.caption,
        fontSize: 9.5,
        color: 'rgba(255,255,255,0.62)',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    amount: {
        fontSize: 34,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
        marginTop: 4,
        marginBottom: 2,
    },
    invested: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    badge: {
        position: 'absolute',
        right: 16,
        top: 16,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
    },
    badgeLabel: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.62)',
        fontWeight: '600',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    badgeValue: { fontSize: 13, fontWeight: '800', marginTop: 3, letterSpacing: -0.3 },
});

const emptyStyles = StyleSheet.create({
    card: {
        marginTop: SPACING.md + 4,
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 32,
        backgroundColor: COLORS.surface.card,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: RADII.xl,
        ...SHADOWS.card,
    },
    iconBg: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(18,70,240,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(18,70,240,0.13)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        ...TYPOGRAPHY.title,
        fontSize: 14,
        color: COLORS.text.primary,
        marginBottom: 5,
        letterSpacing: -0.2,
    },
    sub: {
        ...TYPOGRAPHY.caption,
        fontSize: 11.5,
        color: COLORS.text.secondary,
        textAlign: 'center',
        maxWidth: 220,
        lineHeight: 17,
    },
    cta: {
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 11,
        ...SHADOWS.cta || {},
    },
    ctaText: {
        color: '#fff',
        fontSize: 12.5,
        fontWeight: '700',
    },
});

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.surface.base },
    body: { flex: 1, padding: SPACING.lg - 2 },

    pillTabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: 13,
        padding: 3,
        gap: 2,
        marginTop: SPACING.md + 2,
    },
    pillTab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
    pillTabActiveWrap: { flex: 1 },
    pillTabActive: { borderRadius: 11 },
    pillTabHit: { paddingVertical: 9, alignItems: 'center' },
    pillTabText: { fontSize: 11.5, fontWeight: '600', color: COLORS.text.secondary },
    pillTabTextActive: { fontSize: 11.5, fontWeight: '700', color: '#fff' },

    tradeReportBtn: {
        paddingVertical: 10,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tradeReportBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    planSelectorRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: SPACING.md,
    },
    planDropdown: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface.subtle,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    planDropdownLabel: {
        fontSize: 10,
        color: COLORS.text.muted,
        fontWeight: '600',
        marginRight: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    planDropdownValue: {
        flex: 1,
        fontSize: 12.5,
        color: COLORS.text.primary,
        fontWeight: '700',
    },
    planDropdownArrow: { fontSize: 10, color: COLORS.text.muted, marginLeft: 4 },
    brokerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface.subtle,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    brokerBadgeValue: {
        fontSize: 12.5,
        color: COLORS.text.primary,
        fontWeight: '700',
        maxWidth: 100,
    },

    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(11,22,40,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        backgroundColor: COLORS.surface.card,
        borderRadius: 16,
        padding: 16,
        width: '82%',
        maxHeight: '60%',
        ...SHADOWS.card,
    },
    pickerTitle: {
        ...TYPOGRAPHY.title,
        fontSize: 15,
        color: COLORS.text.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 4,
    },
    pickerItemSelected: { backgroundColor: COLORS.brand.primary },
    pickerItemText: { fontSize: 13, color: COLORS.text.primary, fontWeight: '600' },
    pickerItemTextSelected: { color: '#fff' },

    underTabs: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: COLORS.surface.subtle,
        marginTop: SPACING.md + 4,
    },
    underTab: {
        flex: 1,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    underTabActive: {
        borderBottomWidth: 2.5,
        borderBottomColor: COLORS.brand.primary,
        marginBottom: -1.5,
    },
    underTabText: { fontSize: 12, fontWeight: '600', color: COLORS.text.muted },
    underTabTextActive: { color: COLORS.brand.primary, fontWeight: '700' },
    countDot: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.text.muted,
    },

    laneBody: { flex: 1, marginTop: SPACING.sm },
    listContent: { paddingBottom: SPACING.huge },

    loadingWrap: { padding: 40, alignItems: 'center' },
    loadingText: { marginTop: 12, color: COLORS.text.secondary, fontSize: 12 },
});

export default PortfolioScreenAlphanomy;
