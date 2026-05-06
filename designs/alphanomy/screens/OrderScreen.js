/**
 * OrderScreen — alphanomy variant presentation (2026-05-04)
 *
 * Source design: alphanomy-improved.html § "06 · Orders". Renders the
 * shared alphanomy app header (greeting + ticker strip), a pill-tab strip
 * (Orders Placed / Rejected), a soft search bar, and either a list of
 * orders (when `viewModel.orders` is non-empty) or the alphanomy empty
 * state (matching the HTML mockup).
 *
 * Same viewModel/actions contract as designs/default/screens/OrderScreen.js.
 * Search and tab filters are LOCAL UI state — same as the default
 * presentation. The list rendering is a stripped-down version (one row per
 * order, no basket grouping in this preview); legacy default presentation
 * is the source of truth for advanced row layouts.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Search, ShoppingCart } from 'lucide-react-native';
import {
    DEFAULT_COLORS as COLORS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
    DEFAULT_SHADOWS as SHADOWS,
} from '../tokens';
import AppHeader from './_AppHeader';

const TABS = [
    { id: 'placed', label: 'Orders Placed' },
    { id: 'rejected', label: 'Rejected' },
];

const Row = ({ order }) => (
    <View style={localRowStyles.row}>
        <View style={localRowStyles.flex}>
            <Text style={localRowStyles.symbol}>
                {order?.symbol || order?.tradingsymbol || '—'}
            </Text>
            <Text style={localRowStyles.meta}>
                {(order?.transactionType || order?.transaction_type || 'BUY').toUpperCase()}
                {' · '}
                {order?.quantity ?? order?.qty ?? '—'} qty
                {order?.broker ? ` · ${order.broker}` : ''}
            </Text>
        </View>
        <View style={localRowStyles.alignEnd}>
            <Text style={localRowStyles.price}>
                ₹{Number(order?.price || order?.avg_price || 0).toFixed(2)}
            </Text>
            <Text
                style={[
                    localRowStyles.status,
                    {
                        color:
                            (order?.status || '').toLowerCase().includes('reject')
                                ? COLORS.status.danger
                                : COLORS.status.success,
                    },
                ]}
            >
                {order?.status || '—'}
            </Text>
        </View>
    </View>
);

const OrderScreen = ({ viewModel, actions, home }) => {
    const ordersRaw = viewModel?.orders;
    const isLoading = !!viewModel?.isLoading;
    // Container `home` prop bag isn't passed for OrderScreen — it has its
    // own viewModel. Pull email/config from a few likely places to render
    // the header sensibly.
    const userEmail = home?.userEmail || viewModel?.userEmail || '';
    const userName = home?.userName || viewModel?.userName || '';
    const config = home?.config || viewModel?.config;
    const tickers = home?.tickers || viewModel?.tickers;

    const [tab, setTab] = useState('placed');
    const [search, setSearch] = useState('');

    const renderRow = useCallback(({ item }) => <Row order={item} />, []);

    const filtered = useMemo(() => {
        const orders = ordersRaw || [];
        const q = search.trim().toLowerCase();
        return orders.filter((o) => {
            if (tab === 'rejected') {
                if (!(o.status || '').toLowerCase().includes('reject')) {
                    return false;
                }
            }
            if (q) {
                const hay = `${o.symbol || ''} ${o.tradingsymbol || ''} ${o.broker || ''}`.toLowerCase();
                if (!hay.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [ordersRaw, tab, search]);

    return (
        <SafeAreaView style={styles.safe}>
            <AppHeader
                userEmail={userEmail}
                userName={userName}
                config={config}
                tickers={tickers}
            />

            <View style={styles.body}>
                {/* Pill tabs */}
                <View style={styles.pillTabs}>
                    {TABS.map((t) => {
                        const active = tab === t.id;
                        return (
                            <TouchableOpacity
                                key={t.id}
                                style={[styles.pillTab, active && styles.pillTabActive]}
                                onPress={() => setTab(t.id)}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.pillTabText,
                                        active && styles.pillTabTextActive,
                                    ]}
                                >
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Search */}
                <View style={styles.searchBar}>
                    <Search size={14} color={COLORS.text.muted} strokeWidth={1.8} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search orders…"
                        placeholderTextColor={COLORS.text.muted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Content: empty state vs list */}
                {filtered.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconBg}>
                            <ShoppingCart
                                size={22}
                                color={COLORS.brand.primary}
                                strokeWidth={1.5}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {isLoading ? 'Loading…' : 'No Orders Yet'}
                        </Text>
                        <Text style={styles.emptySub}>
                            {tab === 'rejected'
                                ? 'Rejected orders will appear here when a broker bounces a trade.'
                                : 'Orders placed through your broker will appear here.'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={(item, i) =>
                            item?.order_id || item?.id || `${i}`
                        }
                        renderItem={renderRow}
                        ItemSeparatorComponent={() => <View style={styles.rowSpacer} />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: SPACING.huge }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const localRowStyles = StyleSheet.create({
    flex: { flex: 1 },
    alignEnd: { alignItems: 'flex-end' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface.card,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: RADII.lg,
        paddingHorizontal: SPACING.md + 2,
        paddingVertical: SPACING.md,
        ...SHADOWS.xs,
    },
    symbol: { ...TYPOGRAPHY.bodyEmphasis, fontSize: 13, color: COLORS.text.primary },
    meta: {
        ...TYPOGRAPHY.caption,
        fontSize: 10.5,
        color: COLORS.text.muted,
        marginTop: 2,
    },
    price: { ...TYPOGRAPHY.bodyEmphasis, fontSize: 13, color: COLORS.text.primary },
    status: { fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
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
        marginBottom: SPACING.md + 2,
    },
    pillTab: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 11,
        alignItems: 'center',
    },
    pillTabActive: {
        backgroundColor: COLORS.surface.card,
        borderWidth: 1,
        borderColor: 'rgba(18,70,240,0.08)',
        ...SHADOWS.xs,
    },
    pillTabText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    pillTabTextActive: {
        color: COLORS.text.primary,
        fontWeight: '700',
    },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm + 2,
        backgroundColor: COLORS.surface.card,
        borderWidth: 1.5,
        borderColor: COLORS.border.default,
        borderRadius: RADII.lg,
        paddingHorizontal: SPACING.md + 2,
        paddingVertical: SPACING.md - 1,
        marginBottom: SPACING.md,
        ...SHADOWS.xs,
    },
    searchInput: {
        flex: 1,
        padding: 0,
        margin: 0,
        ...TYPOGRAPHY.body,
        fontSize: 12.5,
        color: COLORS.text.primary,
    },

    emptyCard: {
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xxxl,
        backgroundColor: COLORS.surface.card,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: RADII.xl,
        ...SHADOWS.card,
    },
    emptyIconBg: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(18,70,240,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(18,70,240,0.13)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md + 2,
    },
    emptyTitle: {
        ...TYPOGRAPHY.title,
        fontSize: 14,
        color: COLORS.text.primary,
        marginBottom: 5,
        letterSpacing: -0.2,
    },
    emptySub: {
        ...TYPOGRAPHY.caption,
        fontSize: 11.5,
        color: COLORS.text.secondary,
        textAlign: 'center',
        maxWidth: 240,
        lineHeight: 17,
    },

    rowSpacer: { height: SPACING.sm },
});

export default OrderScreen;
