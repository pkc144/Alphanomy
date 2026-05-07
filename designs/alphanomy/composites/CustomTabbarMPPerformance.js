/**
 * CustomTabbarMPPerformance — alphanomy variant composite.
 *
 * Override of `composites.CustomTabbarMPPerformance`. Reskin of the legacy
 * green/grey segmented control to match the alphanomy pill-tabs aesthetic
 * used by `screens/ModelPortfolioScreen.js` (subtle base, gradient fill on
 * the active tab, indigo lock icon on the disabled-while-locked first tab).
 *
 * Contract is identical to default's composite — flat props, not viewModel:
 *   navigationState        — { index, routes: [{ key, title }] }
 *   jumpTo                 — (key: string) => void
 *   isSubscriptionActive   — boolean — when TRUE, first tab gets the lock icon
 *                            and is disabled. (Yes — the prop is named
 *                            `isSubscriptionActive` but the legacy logic
 *                            disables the first tab when it's TRUE; the
 *                            container passes `!isActive` so this matches
 *                            "disabled when there's NO active subscription".)
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Lock } from 'lucide-react-native';
import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_SPACING as SPACING,
} from '../tokens';

const CustomTabbarMPPerformance = memo(
    ({ navigationState, jumpTo, isSubscriptionActive }) => {
        return (
            <View style={styles.wrapper}>
                <View style={styles.tabs}>
                    {navigationState.routes.map((route, idx) => {
                        const isActive = navigationState.index === idx;
                        const isDisabled = idx === 0 && isSubscriptionActive;
                        return (
                            <TouchableOpacity
                                key={route.key}
                                style={styles.tab}
                                onPress={() => !isDisabled && jumpTo(route.key)}
                                activeOpacity={isDisabled ? 1 : 0.85}
                                disabled={isDisabled}
                            >
                                {isActive ? (
                                    <LinearGradient
                                        colors={GRADIENTS.brand}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.activeFill}
                                    >
                                        {isDisabled ? (
                                            <Lock
                                                size={12}
                                                color={COLORS.text.inverse}
                                                strokeWidth={2.2}
                                                style={styles.lockIcon}
                                            />
                                        ) : null}
                                        <Text style={styles.activeText}>
                                            {route.title}
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <View
                                        style={[
                                            styles.inactive,
                                            isDisabled && styles.inactiveDisabled,
                                        ]}
                                    >
                                        {isDisabled ? (
                                            <Lock
                                                size={12}
                                                color={COLORS.text.muted}
                                                strokeWidth={2.2}
                                                style={styles.lockIcon}
                                            />
                                        ) : null}
                                        <Text
                                            style={[
                                                styles.inactiveText,
                                                isDisabled && styles.inactiveTextDisabled,
                                            ]}
                                        >
                                            {route.title}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    },
);

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: SPACING.lg - 2,
        paddingTop: SPACING.sm + 2,
        paddingBottom: SPACING.sm,
        backgroundColor: COLORS.surface.card,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        borderRadius: 13,
        padding: 3,
        gap: 2,
    },
    tab: {
        flex: 1,
        borderRadius: 11,
        overflow: 'hidden',
    },
    activeFill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 11,
    },
    activeText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: COLORS.text.inverse,
    },
    inactive: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 11,
    },
    inactiveDisabled: { opacity: 0.6 },
    inactiveText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    inactiveTextDisabled: { color: COLORS.text.muted },
    lockIcon: { marginRight: 5 },
});

export default CustomTabbarMPPerformance;
