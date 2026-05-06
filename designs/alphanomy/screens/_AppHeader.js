/**
 * _AppHeader — internal alphanomy variant helper (NOT a registry surface).
 *
 * Shared header (gradient logo + greeting + bell + avatar + ticker strip)
 * used by HomeScreen / OrderScreen / ModelPortfolioScreen / Plans variants
 * to match alphanomy-improved.html's `app-head` block. Underscore prefix +
 * folder collocation keep it private to this variant — variants may ship
 * their own helpers without touching the design-system registry contract.
 *
 * Sample ticker data is hardcoded for the design preview phase. Live data
 * binding happens when the container exposes ticker state, at which point
 * this helper accepts a `tickers` prop and the parent passes it through.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Bell } from 'lucide-react-native';
import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
} from '../tokens';

const SAMPLE_TICKERS = [
    { name: 'Nifty 50', value: '23,995.7', change: '▼ 97.00 (0.40%)', dir: 'down' },
    { name: 'Sensex', value: '76,886.9', change: '▼ 416.72 (0.54%)', dir: 'down' },
    { name: 'BankNifty', value: '55,400', change: '▼ 0.8%', dir: 'down' },
];

const todayLabel = () => {
    try {
        return new Date().toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '';
    }
};

const initialsFrom = (raw = '') => {
    const local = (raw || '').split('@')[0] || 'You';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return ((local[0] || 'Y') + (local[1] || '')).toUpperCase();
};

const greetingFrom = (raw = '') => {
    const local = (raw || '').split('@')[0] || 'there';
    const first = local.split(/[._-]+/)[0] || local;
    return first.charAt(0).toUpperCase() + first.slice(1);
};

const AppHeader = ({ userEmail = '', config, tickers }) => {
    const ref = userEmail || config?.advisorRaCode || '';
    const greeting = greetingFrom(ref);
    const initials = initialsFrom(ref);
    // Live tickers when the array has rows AND at least one row has a real
    // LTP value (not the '—' placeholder); otherwise the sample data so the
    // header still looks complete during WebSocket warmup.
    const hasLiveData =
        Array.isArray(tickers) &&
        tickers.length > 0 &&
        tickers.some((t) => t?.value && t.value !== '—');
    const data = hasLiveData ? tickers : SAMPLE_TICKERS;

    return (
        <View style={styles.header}>
            <View style={styles.row1}>
                <View style={styles.logoWrap}>
                    <LinearGradient
                        colors={GRADIENTS.brand}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headMark}
                    >
                        <View style={styles.bolt} />
                    </LinearGradient>
                    <View>
                        <Text style={styles.greeting}>Hello, {greeting} 👋</Text>
                        <Text style={styles.subDate}>{todayLabel()}</Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <View style={styles.iconCircle}>
                        <Bell size={14} color={COLORS.text.secondary} strokeWidth={1.8} />
                        <View style={styles.notifDot} />
                    </View>
                    <LinearGradient
                        colors={GRADIENTS.brand}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>{initials}</Text>
                    </LinearGradient>
                </View>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tickerStrip}
                contentContainerStyle={styles.tickerStripContent}
            >
                {data.map((t) => (
                    <View key={t.name} style={styles.chip}>
                        <Text style={styles.tickerName}>{t.name}</Text>
                        <Text style={styles.tickerVal}>{t.value}</Text>
                        <Text
                            style={[
                                styles.tickerChg,
                                {
                                    color:
                                        t.dir === 'down'
                                            ? COLORS.status.danger
                                            : COLORS.status.success,
                                },
                            ]}
                        >
                            {t.change}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.surface.card,
        paddingHorizontal: SPACING.lg + 2,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(18,70,240,0.06)',
    },
    row1: {
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
    },
    bolt: {
        width: 11,
        height: 16,
        backgroundColor: '#FFFFFF',
        transform: [{ skewY: '-12deg' }],
        borderRadius: 2,
    },
    greeting: { ...TYPOGRAPHY.bodyEmphasis, fontSize: 15, color: COLORS.text.primary },
    subDate: { ...TYPOGRAPHY.caption, fontSize: 10, color: COLORS.text.muted, marginTop: 1 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
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
    avatar: {
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
    tickerStripContent: { gap: 7, paddingRight: SPACING.lg },
    chip: {
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
});

export default AppHeader;
