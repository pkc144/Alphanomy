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
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
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

const AppHeader = ({ userEmail = '', userName = '', config, tickers }) => {
    const ref = userEmail || config?.advisorRaCode || '';
    // Greeting + initials: prefer the full user name (`userDetails.name` or
    // Firebase displayName) when the container supplies it; fall back to
    // email-derived first-name + initials so the header still renders
    // sensibly during boot / for unauthenticated previews.
    const greeting = userName
        ? userName.trim().split(/\s+/)[0]
        : greetingFrom(ref);
    const initials = userName
        ? userName
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0].toUpperCase())
              .join('')
        : initialsFrom(ref);
    // Live tickers when the array has rows AND at least one row has a real
    // LTP value (not the '—' placeholder); otherwise the sample data so the
    // header still looks complete during WebSocket warmup.
    const hasLiveData =
        Array.isArray(tickers) &&
        tickers.length > 0 &&
        tickers.some((t) => t?.value && t.value !== '—');
    const data = hasLiveData ? tickers : SAMPLE_TICKERS;

    // Bell tap → notification screen, avatar tap → profile/settings screen
    // (registered as `More` in Navigation.js). `useNavigation()` returns null
    // when the header is rendered outside a NavigationContainer (e.g. tests,
    // Storybook), so both handlers guard the call.
    const navigation = useNavigation();
    const canNavigate =
        navigation && typeof navigation.navigate === 'function';
    const onBellPress = () => {
        if (canNavigate) navigation.navigate('NotificationListScreen');
    };
    const onAvatarPress = () => {
        if (!canNavigate) return;
        // `Navigation.js` registers TWO routes named "More":
        //   1. Tab.Screen "More" (line 430) — an empty `View` placeholder; the
        //      tab's `tabPress` listener intercepts taps and re-navigates to
        //      the parent stack's "More" screen.
        //   2. Stack.Screen "More" (line 1219) — the real AccountSettingsScreen.
        // When called from inside the tab navigator, `navigation.navigate('More')`
        // resolves to the closer Tab placeholder (which renders nothing). We
        // need the parent stack's route, so reach for it via `getParent()`.
        const parent = navigation.getParent?.();
        if (parent && typeof parent.navigate === 'function') {
            parent.navigate('More');
        } else {
            navigation.navigate('More');
        }
    };

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
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={onBellPress}
                        style={styles.iconCircle}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Bell size={18} color={COLORS.text.secondary} strokeWidth={1.8} />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={onAvatarPress}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <LinearGradient
                            colors={GRADIENTS.brand}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{initials}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
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
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(18,70,240,0.06)',
    },
    row1: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md + 2,
    },
    logoWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md - 2 },
    headMark: {
        width: 44,
        height: 44,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bolt: {
        width: 14,
        height: 20,
        backgroundColor: '#FFFFFF',
        transform: [{ skewY: '-12deg' }],
        borderRadius: 2,
    },
    greeting: { ...TYPOGRAPHY.bodyEmphasis, fontSize: 17, color: COLORS.text.primary },
    subDate: { ...TYPOGRAPHY.caption, fontSize: 11, color: COLORS.text.muted, marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2 },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.status.danger,
        borderWidth: 1.5,
        borderColor: COLORS.surface.card,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...TYPOGRAPHY.bodyEmphasis,
        fontSize: 13,
        color: COLORS.text.inverse,
        letterSpacing: 0.5,
        fontWeight: '800',
    },
    tickerStrip: { paddingBottom: 2 },
    tickerStripContent: { gap: SPACING.sm + 2, paddingRight: SPACING.lg },
    chip: {
        // No minWidth — chip stays content-sized for a tighter look. The
        // `fontVariant: ['tabular-nums']` on tickerVal / tickerChg below
        // keeps the digits inside each chip stable so LTP updates don't
        // visibly jiggle, even though the chip's overall width does
        // change slightly when the value's character count changes.
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: 13,
        paddingHorizontal: SPACING.md + 2,
        paddingVertical: 9,
    },
    tickerName: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.text.secondary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    tickerVal: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginVertical: 3,
        letterSpacing: -0.2,
        // Tabular digits keep "23,995.7" the same width as "24,001.2" so
        // the value text doesn't reflow on every ltp_update.
        fontVariant: ['tabular-nums'],
    },
    tickerChg: {
        fontSize: 10,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
});

export default AppHeader;
