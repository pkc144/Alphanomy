/**
 * EmptyStateMP — alphanomy variant composite (locked Premium state).
 *
 * Override of `composites.EmptyStateMP`. Container at
 * `src/screens/Drawer/EmptyStateMP.js` resolves this presentation when the
 * user lands on `MPPerformanceScreen` for a plan they haven't subscribed to.
 *
 * Default variant uses a red Lock icon on a flat white surface; alphanomy
 * recasts it to the brand indigo with a soft tinted halo to match the rest
 * of the variant's "subscribe to unlock" affordances.
 *
 * Contract identical to default's composite — viewModel = { title, subtitle,
 * themeColor, mainColor }. The themeColor / mainColor passed by the
 * container come from advisor config; we ignore them here so every tenant
 * running the alphanomy variant gets the same indigo treatment regardless
 * of `appadvisors.themeColor` / `mainColor`. (If a tenant ever needs an
 * advisor-coloured lock here, swap COLORS.brand.primary for themeColor.)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import {
    DEFAULT_COLORS as COLORS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
} from '../tokens';

const EmptyStateMP = ({ viewModel }) => {
    const {
        title = 'Premium Access Required',
        subtitle = 'Purchase this plan to view all distributions and unlock advanced insights.',
    } = viewModel || {};
    return (
        <View style={styles.container}>
            <View style={styles.haloOuter}>
                <View style={styles.haloInner}>
                    <Lock size={36} color={COLORS.brand.primary} strokeWidth={2.2} />
                </View>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.lg,
        backgroundColor: 'transparent',
    },
    haloOuter: {
        width: 96,
        height: 96,
        borderRadius: 48,
        // Faint outer ring — derived from brand primary at low alpha
        // (rgba 18,70,240,0.07). Hardcoded because the tokens don't expose
        // a direct surface variant for this depth; if more screens need it
        // we'll add `surface.haloOuter` to the token bundle.
        backgroundColor: 'rgba(18,70,240,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    haloInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.surface.subtle,
        borderWidth: 1,
        borderColor: COLORS.border.strong,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...TYPOGRAPHY.title,
        fontSize: 17,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.xs + 2,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        fontSize: 12.5,
        lineHeight: 18,
        color: COLORS.text.muted,
        textAlign: 'center',
        maxWidth: 280,
    },
    // RADII import kept for future extension (e.g. CTA pill below subtitle).
    _radii: { borderRadius: RADII.pill },
});

export default EmptyStateMP;
