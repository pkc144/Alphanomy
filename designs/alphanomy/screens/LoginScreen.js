import React from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    Text as RNText,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    Check,
    Award,
    Sparkles,
    Lock as LockIcon,
} from 'lucide-react-native';

import {
    DEFAULT_COLORS as COLORS,
    GRADIENTS,
    DEFAULT_TYPOGRAPHY as TYPOGRAPHY,
    DEFAULT_SPACING as SPACING,
    DEFAULT_RADII as RADII,
    DEFAULT_SHADOWS as SHADOWS,
} from '../tokens';

const Glogo = require('../../../src/assets/GLogo.png');

const TRUST_ICON_MAP = {
    check: Check,
    shield: ShieldCheck,
    lock: LockIcon,
    award: Award,
    sparkles: Sparkles,
};

const resolveTrustIcon = (key) => TRUST_ICON_MAP[key] || Check;

const FALLBACK_TAGLINES = {
    brandSubtag: 'Folios · Research',
    heroTitle: 'Your Alpha,\nEngineered.',
    heroSubtitle:
        'Research-backed investment plans curated by SEBI-registered advisors.',
    trustBadges: [
        { icon: 'check', label: 'SEBI Registered' },
        { icon: 'shield', label: '256-bit Encrypted' },
    ],
};

const LoginScreen = ({ viewModel, actions }) => {
    const {
        email = '',
        password = '',
        isPasswordVisible = false,
        error = '',
        errorShow = false,
        isLoading = false,
        whiteLabelText,
        showAppleButton = false,
        taglines,
    } = viewModel || {};

    const {
        onEmailChange = () => {},
        onPasswordChange = () => {},
        onPasswordVisibilityToggle = () => {},
        onLogin = () => {},
        onGoogleLogin = () => {},
        onAppleLogin = () => {},
        onForgotPassword = () => {},
        onNavigateToSignup = () => {},
    } = actions || {};

    const brandLabel = whiteLabelText || 'Alphanomy';

    const t = {
        brandSubtag: taglines?.brandSubtag || FALLBACK_TAGLINES.brandSubtag,
        heroTitle: taglines?.heroTitle || FALLBACK_TAGLINES.heroTitle,
        heroSubtitle:
            taglines?.heroSubtitle || FALLBACK_TAGLINES.heroSubtitle,
        trustBadges:
            Array.isArray(taglines?.trustBadges) &&
            taglines.trustBadges.length > 0
                ? taglines.trustBadges
                : FALLBACK_TAGLINES.trustBadges,
    };

    const [emailFocused, setEmailFocused] = React.useState(false);
    const [pwdFocused, setPwdFocused] = React.useState(false);

    return (
        <View style={styles.safe}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.brand.primary}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* HERO */}
                    <LinearGradient
                        colors={GRADIENTS.brand}
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
                                <View style={styles.logoNameWrap}>
                                    <View style={styles.logoNameText}>
                                        <BrandText>
                                            {brandLabel}
                                        </BrandText>
                                    </View>
                                </View>

                                <SubText>
                                    {t.brandSubtag}
                                </SubText>
                            </View>
                        </View>

                        <View style={styles.heroText}>
                            <HeroHeading>
                                {t.heroTitle}
                            </HeroHeading>

                            <HeroSub>
                                {t.heroSubtitle}
                            </HeroSub>
                        </View>

                        <View style={styles.trustRow}>
                            {t.trustBadges.map((b, i) => (
                                <TrustBadge
                                    key={`${b.label}-${i}`}
                                    icon={resolveTrustIcon(b.icon)}
                                    label={b.label}
                                />
                            ))}
                        </View>
                    </LinearGradient>

                    {/* CARD */}
                    <View style={styles.card}>
                        <CardTitle>
                            Welcome back
                        </CardTitle>

                        {/* Email */}
                        <Field label="Email / Mobile">
                            <View
                                style={[
                                    styles.inputBox,
                                    emailFocused &&
                                        styles.inputBoxFocused,
                                ]}
                            >
                                <Mail
                                    size={16}
                                    color={
                                        emailFocused
                                            ? COLORS.brand.primary
                                            : COLORS.text.muted
                                    }
                                    strokeWidth={1.8}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor={
                                        COLORS.text.muted
                                    }
                                    value={email}
                                    onChangeText={(t) =>
                                        onEmailChange(
                                            t.toLowerCase()
                                        )
                                    }
                                    onFocus={() =>
                                        setEmailFocused(true)
                                    }
                                    onBlur={() =>
                                        setEmailFocused(false)
                                    }
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </Field>

                        {/* Password */}
                        <Field label="Password">
                            <View
                                style={[
                                    styles.inputBox,
                                    pwdFocused &&
                                        styles.inputBoxFocused,
                                ]}
                            >
                                <Lock
                                    size={16}
                                    color={
                                        pwdFocused
                                            ? COLORS.brand.primary
                                            : COLORS.text.muted
                                    }
                                    strokeWidth={1.8}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter password"
                                    placeholderTextColor={
                                        COLORS.text.muted
                                    }
                                    value={password}
                                    onChangeText={
                                        onPasswordChange
                                    }
                                    onFocus={() =>
                                        setPwdFocused(true)
                                    }
                                    onBlur={() =>
                                        setPwdFocused(false)
                                    }
                                    secureTextEntry={
                                        !isPasswordVisible
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                                <TouchableOpacity
                                    onPress={
                                        onPasswordVisibilityToggle
                                    }
                                    hitSlop={{
                                        top: 10,
                                        bottom: 10,
                                        left: 10,
                                        right: 10,
                                    }}
                                >
                                    {isPasswordVisible ? (
                                        <EyeOff
                                            size={16}
                                            color={
                                                COLORS.text.muted
                                            }
                                            strokeWidth={1.8}
                                        />
                                    ) : (
                                        <Eye
                                            size={16}
                                            color={
                                                COLORS.text.muted
                                            }
                                            strokeWidth={1.8}
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </Field>

                        {/* Forgot Password */}
                        <View style={styles.forgotRow}>
                            <TouchableOpacity
                                onPress={onForgotPassword}
                            >
                                <ForgotLink>
                                    Forgot password?
                                </ForgotLink>
                            </TouchableOpacity>
                        </View>

                        {/* Error */}
                        {errorShow ? (
                            <View style={styles.errorBox}>
                                <ErrorText>
                                    {error}
                                </ErrorText>
                            </View>
                        ) : null}

                        {/* Login Button */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={onLogin}
                            disabled={isLoading}
                            style={styles.primaryBtnWrap}
                        >
                            <LinearGradient
                                colors={GRADIENTS.brand}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.primaryBtn}
                            >
                                <BtnLabel>
                                    {isLoading
                                        ? 'Signing in…'
                                        : 'Sign In'}
                                </BtnLabel>

                                {!isLoading && (
                                    <ArrowRight
                                        size={16}
                                        color={
                                            COLORS.text.inverse
                                        }
                                        strokeWidth={2.2}
                                    />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />

                            <DividerText>
                                or continue with
                            </DividerText>

                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Login */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={onGoogleLogin}
                            disabled={isLoading}
                            style={styles.googleBtn}
                        >
                            <Image
                                source={Glogo}
                                style={styles.googleIcon}
                            />

                            <GoogleLabel>
                                Continue with Google
                            </GoogleLabel>
                        </TouchableOpacity>

                        {/* Apple Login */}
                        {showAppleButton ? (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={onAppleLogin}
                                disabled={isLoading}
                                style={styles.appleBtn}
                            >
                                <AppleLabel>
                                    Continue with Apple
                                </AppleLabel>
                            </TouchableOpacity>
                        ) : null}

                        {/* Footer */}
                        <View style={styles.footerRow}>
                            <FooterText>
                                Don't have an account?
                            </FooterText>

                            <TouchableOpacity
                                onPress={
                                    onNavigateToSignup
                                }
                            >
                                <FooterLink>
                                    Sign Up
                                </FooterLink>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Toast />
        </View>
    );
};

/* Typography Components */

const BrandText = ({ children }) => (
    <RNText style={styles.brandText}>
        {children}
    </RNText>
);

const SubText = ({ children }) => (
    <RNText style={styles.subText}>
        {children}
    </RNText>
);

const HeroHeading = ({ children }) => (
    <RNText style={styles.heroH}>
        {children}
    </RNText>
);

const HeroSub = ({ children }) => (
    <RNText style={styles.heroP}>
        {children}
    </RNText>
);

const CardTitle = ({ children }) => (
    <RNText style={styles.cardTitle}>
        {children}
    </RNText>
);

const FormLabel = ({ children }) => (
    <RNText style={styles.formLabel}>
        {children}
    </RNText>
);

const ForgotLink = ({ children }) => (
    <RNText style={styles.forgotLink}>
        {children}
    </RNText>
);

const ErrorText = ({ children }) => (
    <RNText style={styles.errorText}>
        {children}
    </RNText>
);

const BtnLabel = ({ children }) => (
    <RNText style={styles.btnLabel}>
        {children}
    </RNText>
);

const DividerText = ({ children }) => (
    <RNText style={styles.dividerText}>
        {children}
    </RNText>
);

const GoogleLabel = ({ children }) => (
    <RNText style={styles.googleLabel}>
        {children}
    </RNText>
);

const AppleLabel = ({ children }) => (
    <RNText style={styles.appleLabel}>
        {children}
    </RNText>
);

const FooterText = ({ children }) => (
    <RNText style={styles.footerText}>
        {children}
    </RNText>
);

const FooterLink = ({ children }) => (
    <RNText style={styles.footerLink}>
        {children}
    </RNText>
);

const TrustLabel = ({ children }) => (
    <RNText style={styles.trustLabel}>
        {children}
    </RNText>
);

const Field = ({ label, children }) => (
    <View style={styles.field}>
        <FormLabel>{label}</FormLabel>
        {children}
    </View>
);

const TrustBadge = ({ icon: IconCmp, label }) => (
    <View style={styles.trustBadge}>
        <IconCmp
            size={10}
            color={'rgba(255,255,255,0.85)'}
            strokeWidth={2.5}
        />

        <TrustLabel>{label}</TrustLabel>
    </View>
);

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.brand.primary,
    },

    flex: {
        flex: 1,
        backgroundColor: COLORS.surface.base,
    },

    scroll: {
        flexGrow: 1,
        backgroundColor: COLORS.surface.base,
        paddingBottom: 40,
    },

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

    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },

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

    logoNameWrap: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },

    logoNameText: {},

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

    heroText: {
        marginTop: SPACING.xxl,
    },

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

    trustRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },

    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: RADII.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.20)',
        paddingHorizontal: SPACING.md - 2,
        paddingVertical: 4,
    },

    trustLabel: {
        ...TYPOGRAPHY.caption,
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.88)',
    },

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

    field: {
        marginBottom: SPACING.md + 2,
    },

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

    forgotRow: {
        alignItems: 'flex-end',
        marginTop: -SPACING.xs,
        marginBottom: SPACING.md + 2,
    },

    forgotLink: {
        ...TYPOGRAPHY.bodyEmphasis,
        color: COLORS.brand.primary,
        fontSize: 12,
    },

    errorBox: {
        backgroundColor: COLORS.status.dangerBg,
        borderRadius: RADII.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginBottom: SPACING.md,
    },

    errorText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.status.danger,
    },

    primaryBtnWrap: {
        borderRadius: RADII.lg,
        overflow: 'hidden',
        ...SHADOWS.cta,
        marginBottom: SPACING.md + 2,
    },

    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.lg - 1,
    },

    btnLabel: {
        ...TYPOGRAPHY.button,
        color: COLORS.text.inverse,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm + 2,
        marginBottom: SPACING.md + 2,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7F0',
    },

    dividerText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.muted,
        fontSize: 11,
    },

    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm + 1,
        backgroundColor: COLORS.surface.card,
        borderRadius: RADII.lg,
        borderWidth: 1.5,
        borderColor: '#E5E8EE',
        paddingVertical: SPACING.md + 2,
        marginBottom: SPACING.md + 2,
        ...SHADOWS.xs,
    },

    googleIcon: {
        width: 18,
        height: 18,
    },

    googleLabel: {
        ...TYPOGRAPHY.bodyEmphasis,
        color: COLORS.text.primary,
        fontSize: 13,
    },

    appleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B1628',
        borderRadius: RADII.lg,
        paddingVertical: SPACING.md + 2,
        marginBottom: SPACING.md + 2,
    },

    appleLabel: {
        ...TYPOGRAPHY.bodyEmphasis,
        color: COLORS.text.inverse,
        fontSize: 13,
    },

    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },

    footerText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        fontSize: 12,
    },

    footerLink: {
        ...TYPOGRAPHY.bodyEmphasis,
        color: COLORS.brand.primary,
        fontSize: 12,
        fontWeight: '800',
    },
});

export default LoginScreen;