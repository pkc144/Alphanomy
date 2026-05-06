/**
 * AccountSettingsScreen — alphanomy variant presentation (2026-05-04)
 *
 * Source design: alphanomy-improved.html § "09 · Profile". Renders a
 * gradient profile card (avatar + name + email + Edit pill) followed by
 * grouped settings sections (Account / Preferences / Account Actions).
 * Each row has a soft-tinted icon tile + label + chevron, matching the
 * mockup. The destructive "Sign Out" row uses the danger color.
 *
 * Same viewModel/actions contract as designs/default/screens/
 * AccountSettingsScreen.js. The default presentation passes a flat array
 * of `menuItems` shaped as `{ id, title, items: [{ icon, label, onPress,
 * isLogout }] }` — this variant iterates that exact shape and styles each
 * section the alphanomy way. Icons are rendered through `item.icon`
 * (a lucide-react-native component) wrapped in a colored tile that cycles
 * through the alphanomy palette by section index.
 */

import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react-native';
import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
    DEFAULT_SHADOWS as SHADOWS,
} from '../tokens';

// Icon tile background palette — cycles through the alphanomy palette so
// each section's rows feel visually grouped. Derived from tokens; only the
// dark-amber stroke (#B45309) is inline because it's a legibility-tuned
// shade darker than `status.warning` (#F59E0B) that doesn't have a
// dedicated token. Danger is reserved for `isLogout` rows (see iconTile
// rendering below).
const ICON_BG_CYCLE = [
    { bg: COLORS.status.infoBg, stroke: COLORS.brand.primary },        // blue
    { bg: COLORS.brand.secondaryBg, stroke: COLORS.brand.secondary },   // purple
    { bg: COLORS.status.successBg, stroke: COLORS.status.success },    // green
    { bg: COLORS.status.warningBg, stroke: '#B45309' },                // amber
];

// The HTML mockup omits a back button (it imagines this screen as a bottom
// tab "Profile"), but the actual app routes AccountSettingsScreen as a
// Stack.Screen reached from the More tab. Without a back affordance the
// user can only exit via the system back gesture — easily missed. We
// render a minimal top bar with `onGoBack` + `onNavigateNotifications`
// wired through the existing actions contract.
const AccountSettingsScreen = ({ viewModel, actions }) => {
    const {
        userName = '',
        userEmail = '',
        userInitials = '',
        menuItems = [],
        // Live app-version string from the container (DeviceInfo.getVersion +
        // getBuildNumber + REACT_APP_WHITE_LABEL_TEXT). Falls back to a
        // generic placeholder when the variant runs in a context where the
        // container hasn't supplied it (test snapshots, isolated previews).
        appVersion,
    } = viewModel || {};
    const {
        onGoBack = () => {},
        onNavigateNotifications = () => {},
    } = actions || {};

    const versionLine = appVersion || 'Alphanomy';

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface.base} />

            {/* Top bar — back + title + bell. Fixed above the scroll. */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.topBarBtn}
                    onPress={onGoBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={20} color={COLORS.text.primary} strokeWidth={2.2} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Profile</Text>
                <TouchableOpacity
                    style={styles.topBarBtn}
                    onPress={onNavigateNotifications}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <Bell size={18} color={COLORS.text.secondary} strokeWidth={1.8} />
                    <View style={styles.topBarNotifDot} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile gradient card */}
                <LinearGradient
                    colors={GRADIENTS.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileCard}
                >
                    <View style={styles.profileOrb} />
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>{userInitials || initialsFor(userName, userEmail)}</Text>
                    </View>
                    <View style={styles.profileTextWrap}>
                        <Text style={styles.profileName} numberOfLines={1}>
                            {userName || extractNameFromEmail(userEmail) || 'Your name'}
                        </Text>
                        <Text style={styles.profileEmail} numberOfLines={1}>
                            {userEmail || 'Add your email'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Sections */}
                {menuItems.map((section, sIdx) => (
                    <View key={section.id || section.title || sIdx}>
                        {section.title ? (
                            <Text style={styles.sectionLabel}>{section.title}</Text>
                        ) : null}
                        <View style={styles.group}>
                            {(section.items || []).map((item, iIdx) => {
                                const isLast = iIdx === (section.items?.length || 0) - 1;
                                const palette = ICON_BG_CYCLE[(sIdx + iIdx) % ICON_BG_CYCLE.length];
                                const Icon = item.icon;
                                return (
                                    <TouchableOpacity
                                        key={item.label || iIdx}
                                        style={[styles.row, !isLast && styles.rowBorder]}
                                        onPress={item.onPress}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.rowL}>
                                            <View
                                                style={[
                                                    styles.iconTile,
                                                    item.isLogout && styles.iconTileDanger,
                                                    !item.isLogout && { backgroundColor: palette.bg },
                                                ]}
                                            >
                                                {Icon ? (
                                                    <Icon
                                                        size={14}
                                                        color={
                                                            item.isLogout
                                                                ? COLORS.status.danger
                                                                : palette.stroke
                                                        }
                                                        strokeWidth={1.8}
                                                    />
                                                ) : null}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.rowLbl,
                                                    item.isLogout && styles.rowLblDanger,
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </View>
                                        <ChevronRight
                                            size={14}
                                            color={COLORS.text.disabled}
                                            strokeWidth={2}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                <Text style={styles.versionText}>{versionLine}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const initialsFor = (name = '', email = '') => {
    const src = (name || email || '').split('@')[0];
    const parts = src.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {return (parts[0][0] + parts[1][0]).toUpperCase();}
    return ((src[0] || 'U') + (src[1] || '')).toUpperCase();
};

const extractNameFromEmail = (email = '') => {
    const local = (email || '').split('@')[0];
    if (!local) {return '';}
    return local
        .split(/[._-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.surface.base },
    flex: { flex: 1 },
    body: { paddingTop: SPACING.sm, paddingBottom: SPACING.huge, gap: 0 },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md + 4,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md - 2,
        backgroundColor: COLORS.surface.base,
    },
    topBarBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface.card,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    topBarTitle: {
        ...TYPOGRAPHY.title,
        fontSize: 16,
        color: COLORS.text.primary,
        letterSpacing: -0.3,
    },
    topBarNotifDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.status.danger,
        borderWidth: 1.5,
        borderColor: COLORS.surface.card,
    },

    profileCard: {
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
        borderRadius: RADII.xl + 2,
        padding: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md + 1,
        position: 'relative',
        overflow: 'hidden',
    },
    profileOrb: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255,255,255,0.07)',
        right: -30,
        top: -30,
    },
    profileAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileAvatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text.inverse,
    },
    profileTextWrap: { flex: 1 },
    profileName: {
        ...TYPOGRAPHY.title,
        fontSize: 16,
        color: COLORS.text.inverse,
        letterSpacing: -0.3,
    },
    profileEmail: {
        ...TYPOGRAPHY.caption,
        fontSize: 11,
        color: 'rgba(255,255,255,0.65)',
        marginTop: 2,
    },
    editBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: RADII.pill,
        paddingHorizontal: SPACING.md,
        paddingVertical: 5,
    },
    editBtnText: {
        ...TYPOGRAPHY.bodyEmphasis,
        fontSize: 11,
        color: COLORS.text.inverse,
        fontWeight: '700',
    },

    sectionLabel: {
        ...TYPOGRAPHY.overline,
        fontSize: 9.5,
        color: COLORS.text.muted,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md - 2,
        paddingBottom: 7,
    },
    group: {
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.md + 2,
        backgroundColor: COLORS.surface.card,
        borderRadius: RADII.xl,
        borderWidth: 1,
        borderColor: COLORS.border.default,
        overflow: 'hidden',
        ...SHADOWS.card,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md + 3,
        paddingVertical: 13,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.subtle,
    },
    rowL: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        flex: 1,
    },
    iconTile: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconTileDanger: {
        backgroundColor: COLORS.status.dangerBg,
    },
    rowLbl: { ...TYPOGRAPHY.body, fontSize: 13, color: COLORS.text.primary, fontWeight: '500' },
    rowLblDanger: { color: COLORS.status.danger },

    versionText: {
        ...TYPOGRAPHY.caption,
        fontSize: 10,
        color: COLORS.text.muted,
        textAlign: 'center',
        paddingTop: SPACING.sm,
        letterSpacing: 0.5,
    },
});

export default AccountSettingsScreen;
