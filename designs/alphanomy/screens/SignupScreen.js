/**
 * SignupScreen — alphanomy variant presentation (2026-05-04)
 *
 * Source design: alphanomy-improved.html § "02 · Sign Up".
 * Mirrors the LoginScreen layout (gradient hero + overlapping white card)
 * but flips the gradient to purple→blue (`brandReverse`) so signup reads as
 * visually distinct from sign-in. Drops the trust badges; adds a third
 * input (Full Name) and a terms-of-service checkbox row.
 *
 * Contract identical to designs/default/screens/SignupScreen.js — the
 * container at src/screens/Authentication/SignupScreen.js stays unchanged.
 */

import React from 'react';
import {
    View,
    Text as RNText,
    StyleSheet,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Check } from 'lucide-react-native';
import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
    DEFAULT_SHADOWS as SHADOWS,
} from '../tokens';

const SignupScreen = ({ viewModel, actions }) => {
    const {
        email = '',
        name = '',
        password = '',
        isPasswordVisible = false,
        isChecked = false,
        error = '',
        errorShow = false,
        success = '',
        isLoading = false,
        whiteLabelText,
        taglines,
    } = viewModel || {};
    const {
        onEmailChange = () => {},
        onNameChange = () => {},
        onPasswordChange = () => {},
        onPasswordVisibilityToggle = () => {},
        onTermsToggle = () => {},
        onSignup = () => {},
        dismissError = () => {},
        onNavigateToLogin = () => {},
        onOpenTerms = () => {},
        onOpenPrivacy = () => {},
    } = actions || {};

    const brandLabel = whiteLabelText || 'Alphanomy';
    // Per-field tagline fallback so a partial backend override still
    // renders the rest from the built-in copy. The signup hero subtitle
    // ("Join 50,000+ investors...") is a quantitative claim — tenants
    // should set this via backend, not rely on the hardcoded copy.
    const t = {
        brandSubtag: taglines?.brandSubtag || 'Create account',
        heroTitle: taglines?.heroTitle || 'Start investing\nsmarter today.',
        heroSubtitle:
            taglines?.heroSubtitle ||
            'Join 50,000+ investors getting institutional-grade advice.',
    };

    const [nameFocused, setNameFocused] = React.useState(false);
    const [emailFocused, setEmailFocused] = React.useState(false);
    const [pwdFocused, setPwdFocused] = React.useState(false);

    return (
        // Layout mirrors the working default/legacy SignupScreen — plain
        // <View> + <KeyboardAvoidingView>, NO <SafeAreaView> and NO
        // <ScrollView>. See `LoginScreen.js` for the full root-cause writeup
        // on Vivo V2058 (Android 15 / Fabric) — same fix applied here.
        <View style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.brand.secondary} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={[styles.flex, styles.scroll]}>
                        {/* ── HERO (purple→blue, reversed from LoginScreen) ── */}
                        <LinearGradient
                            colors={GRADIENTS.brandReverse}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.hero}
                        >
                            <View style={styles.orbLg} />
                            <View style={styles.orbSm} />
                            <View style={styles.orbMid} />

                            <View style={styles.logoRow}>
                                <View style={styles.logoMark}>
                                    <View style={styles.logoBolt} />
                                </View>
                                <View>
                                    <RNText style={styles.brandText}>{brandLabel}</RNText>
                                    <RNText style={styles.subText}>{t.brandSubtag}</RNText>
                                </View>
                            </View>

                            <View style={styles.heroText}>
                                <RNText style={styles.heroH}>{t.heroTitle}</RNText>
                                <RNText style={styles.heroP}>{t.heroSubtitle}</RNText>
                            </View>
                        </LinearGradient>

                        {/* ── CARD ── */}
                        <View style={styles.card}>
                            <RNText style={styles.cardTitle}>Create your account</RNText>

                            {/* Name */}
                            <View style={styles.field}>
                                <RNText style={styles.formLabel}>Full Name</RNText>
                                <View
                                    style={[
                                        styles.inputBox,
                                        nameFocused && styles.inputBoxFocused,
                                    ]}
                                >
                                    <User
                                        size={16}
                                        color={nameFocused ? COLORS.brand.primary : COLORS.text.muted}
                                        strokeWidth={1.8}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Your full name"
                                        placeholderTextColor={COLORS.text.muted}
                                        value={name}
                                        onChangeText={onNameChange}
                                        onFocus={() => setNameFocused(true)}
                                        onBlur={() => setNameFocused(false)}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Email */}
                            <View style={styles.field}>
                                <RNText style={styles.formLabel}>Email Address</RNText>
                                <View
                                    style={[
                                        styles.inputBox,
                                        emailFocused && styles.inputBoxFocused,
                                    ]}
                                >
                                    <Mail
                                        size={16}
                                        color={emailFocused ? COLORS.brand.primary : COLORS.text.muted}
                                        strokeWidth={1.8}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor={COLORS.text.muted}
                                        value={email}
                                        onChangeText={(text) => onEmailChange(text.toLowerCase())}
                                        onFocus={() => setEmailFocused(true)}
                                        onBlur={() => setEmailFocused(false)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.field}>
                                <RNText style={styles.formLabel}>Password</RNText>
                                <View
                                    style={[
                                        styles.inputBox,
                                        pwdFocused && styles.inputBoxFocused,
                                    ]}
                                >
                                    <Lock
                                        size={16}
                                        color={pwdFocused ? COLORS.brand.primary : COLORS.text.muted}
                                        strokeWidth={1.8}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Create strong password"
                                        placeholderTextColor={COLORS.text.muted}
                                        value={password}
                                        onChangeText={onPasswordChange}
                                        onFocus={() => setPwdFocused(true)}
                                        onBlur={() => setPwdFocused(false)}
                                        secureTextEntry={!isPasswordVisible}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={onPasswordVisibilityToggle}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {isPasswordVisible ? (
                                            <EyeOff size={16} color={COLORS.text.muted} strokeWidth={1.8} />
                                        ) : (
                                            <Eye size={16} color={COLORS.text.muted} strokeWidth={1.8} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Terms */}
                            <TouchableOpacity
                                style={styles.termsRow}
                                onPress={onTermsToggle}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.checkBox,
                                        isChecked && styles.checkBoxChecked,
                                    ]}
                                >
                                    {isChecked ? (
                                        <Check size={11} color={COLORS.text.inverse} strokeWidth={2.5} />
                                    ) : null}
                                </View>
                                <RNText style={styles.termsText}>
                                    {`I agree to ${brandLabel}'s `}
                                    <RNText style={styles.termsLink} onPress={onOpenTerms}>
                                        Terms of Service
                                    </RNText>
                                    {' and '}
                                    <RNText style={styles.termsLink} onPress={onOpenPrivacy}>
                                        Privacy Policy
                                    </RNText>
                                </RNText>
                            </TouchableOpacity>

                            {errorShow && error ? (
                                <View style={styles.errorBox}>
                                    <RNText style={styles.errorText}>{error}</RNText>
                                </View>
                            ) : null}
                            {success ? (
                                <View style={styles.successBox}>
                                    <RNText style={styles.successText}>{success}</RNText>
                                </View>
                            ) : null}

                            {/*
                              Primary CTA — purple→blue gradient mirroring
                              the hero. Only `isLoading` hard-disables the
                              button; when the terms checkbox is unchecked
                              we still let the press through so the
                              container's `handleSignup` can fire its
                              "Please agree to the Terms & Conditions"
                              toast (otherwise the button just feels
                              broken to users who haven't ticked the box).
                            */}
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={onSignup}
                                disabled={isLoading}
                                style={[
                                    styles.primaryBtnWrap,
                                    (!isChecked || isLoading) && styles.primaryBtnDisabled,
                                ]}
                            >
                                <LinearGradient
                                    colors={GRADIENTS.brandReverse}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.primaryBtn}
                                >
                                    <UserPlus size={16} color={COLORS.text.inverse} strokeWidth={2.2} />
                                    <RNText style={styles.btnLabel}>
                                        {isLoading ? 'Creating account…' : 'Create Account'}
                                    </RNText>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.footerRow}>
                                <RNText style={styles.footerText}>Already have an account? </RNText>
                                <TouchableOpacity onPress={onNavigateToLogin}>
                                    <RNText style={styles.footerLink}>Sign In</RNText>
                                </TouchableOpacity>
                            </View>
                        </View>
                </View>
            </KeyboardAvoidingView>
            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.brand.secondary },
    flex: { flex: 1, backgroundColor: COLORS.surface.base },
    scroll: { flexGrow: 1, backgroundColor: COLORS.surface.base },

    // ── HERO ──
    hero: {
        paddingHorizontal: SPACING.xxl,
        paddingTop: SPACING.xxxl,
        paddingBottom: SPACING.huge + SPACING.md,
        overflow: 'hidden',
    },
    orbLg: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -100,
        right: -70,
    },
    orbSm: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.05)',
        bottom: -50,
        left: 10,
    },
    orbMid: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.06)',
        top: '40%',
        right: 30,
    },

    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    logoMark: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoBolt: {
        width: 12,
        height: 18,
        backgroundColor: '#FFFFFF',
        transform: [{ skewY: '-12deg' }],
        borderRadius: 2,
    },
    brandText: {
        ...TYPOGRAPHY.title,
        color: COLORS.text.inverse,
        letterSpacing: -0.4,
    },
    subText: {
        ...TYPOGRAPHY.overline,
        color: 'rgba(255,255,255,0.55)',
        fontSize: 9,
        marginTop: 2,
    },

    heroText: { marginTop: SPACING.xxl },
    heroH: {
        ...TYPOGRAPHY.heading,
        color: COLORS.text.inverse,
        fontSize: 26,
        lineHeight: 30,
    },
    heroP: {
        ...TYPOGRAPHY.body,
        color: 'rgba(255,255,255,0.78)',
        marginTop: SPACING.sm,
        fontSize: 13,
        lineHeight: 19,
        maxWidth: 320,
    },

    // ── CARD ──
    card: {
        backgroundColor: COLORS.surface.card,
        borderTopLeftRadius: RADII.sheet,
        borderTopRightRadius: RADII.sheet,
        marginTop: -30,
        paddingHorizontal: SPACING.xxl - 4,
        paddingTop: SPACING.xxl + SPACING.xs,
        paddingBottom: SPACING.xxl,
        ...SHADOWS.modal,
    },
    cardTitle: {
        ...TYPOGRAPHY.title,
        color: COLORS.text.primary,
        fontSize: 18,
        marginBottom: SPACING.lg + 2,
    },
    field: { marginBottom: SPACING.md + 2 },
    formLabel: {
        ...TYPOGRAPHY.overline,
        color: COLORS.text.secondary,
        marginBottom: 7,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm + 2,
        backgroundColor: COLORS.surface.subtle,
        borderRadius: RADII.lg,
        borderWidth: 1.5,
        borderColor: 'transparent',
        paddingHorizontal: SPACING.md + 2,
        paddingVertical: SPACING.md,
    },
    inputBoxFocused: {
        // Focus visual: only change borderColor + backgroundColor. Do NOT
        // toggle elevation/shadow on focus — adding elevation to a parent
        // View causes Android to recompose its native layer, which detaches
        // and reattaches the TextInput child, which drops the IME's served
        // view binding (the keyboard pops up briefly then dismisses, and
        // characters disappear as you type). Same root cause as the
        // LoginScreen fix on 2026-05-07.
        backgroundColor: COLORS.surface.card,
        borderColor: COLORS.brand.primary,
    },
    input: {
        flex: 1,
        padding: 0,
        margin: 0,
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
    },

    // Terms row
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 9,
        marginTop: SPACING.xs,
        marginBottom: SPACING.md + 2,
    },
    checkBox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#C9D0E3',
        backgroundColor: COLORS.surface.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    checkBoxChecked: {
        backgroundColor: COLORS.brand.primary,
        borderColor: COLORS.brand.primary,
    },
    termsText: {
        ...TYPOGRAPHY.caption,
        flex: 1,
        color: COLORS.text.secondary,
        fontSize: 11,
        lineHeight: 17,
    },
    termsLink: {
        color: COLORS.brand.primary,
        fontWeight: '600',
    },

    errorBox: {
        backgroundColor: COLORS.status.dangerBg,
        borderRadius: RADII.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginBottom: SPACING.md,
    },
    errorText: { ...TYPOGRAPHY.caption, color: COLORS.status.danger },
    successBox: {
        backgroundColor: COLORS.status.successBg,
        borderRadius: RADII.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginBottom: SPACING.md,
    },
    successText: { ...TYPOGRAPHY.caption, color: COLORS.status.success },

    primaryBtnWrap: {
        borderRadius: RADII.lg,
        overflow: 'hidden',
        ...SHADOWS.cta,
        marginBottom: SPACING.md + 2,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.lg - 1,
    },
    btnLabel: { ...TYPOGRAPHY.button, color: COLORS.text.inverse },

    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    footerText: { ...TYPOGRAPHY.body, color: COLORS.text.secondary, fontSize: 12 },
    footerLink: {
        ...TYPOGRAPHY.bodyEmphasis,
        color: COLORS.brand.primary,
        fontSize: 12,
        fontWeight: '800',
    },
});

export default SignupScreen;
