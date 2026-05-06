/**
 * NotificationListScreen — alphanomy variant presentation (2026-05-06)
 *
 * Source design: alphanomy-improved.html § "08 · Notifications". Renders a
 * sticky header (Notifications + Mark all read), a flat list of
 * notification rows grouped by date section ("Today", "Yesterday",
 * arbitrary headers), with:
 *   - 38×38 colored icon tile on the left (si-blue / si-green / si-amber /
 *     si-purple / si-red palette from the HTML mockup, mapped to a
 *     `kind` field per row).
 *   - Title + description in the body.
 *   - Time label on the right.
 *   - Unread rows: pale-blue background tint + 3px brand-blue rail on the
 *     left edge (matches `.notif-item.unread::before` from the HTML).
 *
 * Same viewModel / actions contract as designs/default/screens/NotificationListScreen.js
 * — switching variants does not change the container.
 *
 * If the container hasn't supplied any notifications yet, a `FALLBACK_ITEMS`
 * sample list ships so the design preview matches the HTML mockup
 * one-to-one (Order Executed / Advisory Alert / Market Closure / Advisor
 * Message / Stop-Loss Triggered). The fallback is replaced the moment the
 * container exposes a real `notifications` array.
 */

import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import {
    ChevronLeft,
    Activity,
    Shield,
    AlertTriangle,
    MessageSquare,
} from 'lucide-react-native';

import {
    DEFAULT_COLORS as COLORS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
} from '../tokens';

// Fallback rows mirror the HTML mockup so the preview is renderable
// before any real notifications feed is wired. Container can override
// at any time by passing `viewModel.notifications`.
const FALLBACK_ITEMS = [
    {
        id: 'fb-1',
        section: 'Today',
        kind: 'order',
        title: 'Order Executed · Nifty Call',
        message:
            'Your BUY order for NIFTY 23500 CE has been executed at ₹142.50',
        time: '2m ago',
        unread: true,
    },
    {
        id: 'fb-2',
        section: 'Today',
        kind: 'advisory',
        title: 'Advisory Alert',
        message:
            'Sanjana has updated the Momentum Plan target price to ₹24,200',
        time: '1h ago',
        unread: true,
    },
    {
        id: 'fb-3',
        section: 'Yesterday',
        kind: 'reminder',
        title: 'Market Closure Reminder',
        message:
            'Markets will remain closed tomorrow on account of Maharashtra Day.',
        time: 'Apr 27',
        unread: false,
    },
    {
        id: 'fb-4',
        section: 'Yesterday',
        kind: 'message',
        title: 'Advisor Message',
        message:
            'Your advisor has replied to your query about BankNifty hedging.',
        time: 'Apr 27',
        unread: false,
    },
    {
        id: 'fb-5',
        section: 'Yesterday',
        kind: 'alert',
        title: 'Stop-Loss Triggered',
        message:
            'SL order for BANKNIFTY 54000 PE triggered at ₹68.00. Loss: ₹210',
        time: 'Apr 27',
        unread: false,
    },
];

// Maps a `kind` token to (icon component, tile background, stroke color).
// Matches the HTML's si-blue / si-green / si-amber / si-purple / si-red
// palette plus per-icon stroke color from the SVGs.
const KIND_MAP = {
    order: {
        Icon: Activity,
        tileBg: 'rgba(18,70,240,0.09)',
        stroke: '#1246F0',
    },
    advisory: {
        Icon: Shield,
        tileBg: 'rgba(0,179,126,0.09)',
        stroke: '#00B37E',
    },
    reminder: {
        Icon: AlertTriangle,
        tileBg: 'rgba(245,158,11,0.09)',
        stroke: '#B45309',
    },
    message: {
        Icon: MessageSquare,
        tileBg: 'rgba(124,58,237,0.09)',
        stroke: '#7C3AED',
    },
    alert: {
        Icon: Activity,
        tileBg: 'rgba(229,57,53,0.08)',
        stroke: '#E53935',
    },
};

const groupBySection = (items) => {
    const groups = [];
    const seen = new Map();
    for (const item of items) {
        const key = item.section || 'Earlier';
        if (!seen.has(key)) {
            const block = { section: key, rows: [] };
            seen.set(key, block);
            groups.push(block);
        }
        seen.get(key).rows.push(item);
    }
    return groups;
};

const NotificationRow = ({ item }) => {
    const map = KIND_MAP[item.kind] || KIND_MAP.order;
    const { Icon, tileBg, stroke } = map;
    return (
        <View style={[styles.row, item.unread && styles.rowUnread]}>
            {item.unread ? <View style={styles.unreadRail} /> : null}
            <View style={[styles.iconTile, { backgroundColor: tileBg }]}>
                <Icon size={16} color={stroke} strokeWidth={1.8} />
            </View>
            <View style={styles.body}>
                <Text style={styles.bodyTitle} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={styles.bodyDesc}>{item.message}</Text>
            </View>
            {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
        </View>
    );
};

const SectionHeader = ({ label }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
    </View>
);

const NotificationListScreen = ({ viewModel, actions }) => {
    const containerItems = viewModel?.notifications;
    const items =
        Array.isArray(containerItems) && containerItems.length > 0
            ? containerItems
            : FALLBACK_ITEMS;
    const onBack = actions?.onBack || (() => {});
    const onMarkAllRead = actions?.onMarkAllRead || (() => {});
    const onNotificationPress = actions?.onNotificationPress;

    const groups = useMemo(() => groupBySection(items), [items]);
    const hasUnread = items.some((it) => it.unread);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface.card} />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onBack}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <ChevronLeft size={22} color={COLORS.text.primary} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <TouchableOpacity onPress={onMarkAllRead} disabled={!hasUnread}>
                    <Text
                        style={[
                            styles.markAllRead,
                            !hasUnread && styles.markAllReadDisabled,
                        ]}>
                        Mark all read
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                {groups.map((g, gi) => (
                    <View key={`${g.section}-${gi}`}>
                        <SectionHeader label={g.section} />
                        {g.rows.map((row) => (
                            <TouchableOpacity
                                key={row.id}
                                activeOpacity={onNotificationPress ? 0.7 : 1}
                                onPress={
                                    onNotificationPress
                                        ? () => onNotificationPress(row)
                                        : undefined
                                }>
                                <NotificationRow item={row} />
                            </TouchableOpacity>
                        ))}
                        {gi < groups.length - 1 ? <View style={styles.gap} /> : null}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.surface.base },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md + 2,
        paddingVertical: 12,
        backgroundColor: COLORS.surface.card,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(18,70,240,0.06)',
    },
    title: {
        ...TYPOGRAPHY.title,
        fontSize: 16,
        color: COLORS.text.primary,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    markAllRead: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.brand.primary,
    },
    markAllReadDisabled: { color: COLORS.text.muted },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: SPACING.huge },

    sectionHeader: {
        paddingHorizontal: SPACING.md + 2,
        paddingTop: 10,
        paddingBottom: 6,
        backgroundColor: COLORS.surface.base,
    },
    sectionLabel: {
        fontSize: 9.5,
        fontWeight: '700',
        color: COLORS.text.muted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 11,
        paddingHorizontal: SPACING.md + 2,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(18,70,240,0.04)',
        backgroundColor: COLORS.surface.card,
        position: 'relative',
    },
    rowUnread: { backgroundColor: '#F0F4FF' },
    unreadRail: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: COLORS.brand.primary,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },

    iconTile: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    body: { flex: 1 },
    bodyTitle: {
        fontSize: 12.5,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 3,
        letterSpacing: -0.1,
    },
    bodyDesc: {
        fontSize: 11.5,
        color: COLORS.text.secondary,
        lineHeight: 17,
    },
    time: {
        fontSize: 10,
        color: COLORS.text.muted,
        marginTop: 2,
    },

    gap: {
        height: 6,
        backgroundColor: COLORS.surface.base,
    },
});

export default NotificationListScreen;
