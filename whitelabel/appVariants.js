/**
 * ============================================================================
 * whitelabel/appVariants — TENANT CONFIG ROOT (upstream)
 * ============================================================================
 *
 * 🔴 PER-FORK FILE. NOT BYTE-IDENTICAL ACROSS REPOS. 🔴
 *
 * The `APP_VARIANTS` map for tenants this repo ships. `src/utils/Config.js`
 * is the upstream-managed re-exporter (byte-identical across forks); this
 * file holds the actual values per repo.
 *
 * To add a new tenant, add an entry below. To create a fork (whitelabel
 * overlay), copy this file into the fork's `whitelabel/appVariants.js`
 * and edit. See `docs/WHITELABEL_RECIPE.md`.
 * ============================================================================
 */

// SharedDefaultLogo is the fallback logo applied to every variant
// that doesn't explicitly override `logo`. The file at
// `src/assets/AppLogo/logo.png` is the ZamZam-branded logo (the
// asset is byte-identical to `src/assets/AppLogo/Zamzam.png`) — so
// any variant that inherits `sharedUIConfig` without overriding
// `logo` will display ZamZam branding. Variants which need their
// own brand MUST set `logo` and `toolbarlogo` explicitly (see
// `alphaquark` below). The variable was previously named
// `ZamzamLogo`, which made the leak path visually obvious in code
// review but was misleading: this is the SHARED-CONFIG fallback
// logo, not a ZamZam-specific asset.
import SharedDefaultLogo from '../src/assets/AppLogo/logo.png';
import AlphaQuarkLogo from '../src/assets/logo.png';

// Shared UI config — theme, colors, layout
const sharedUIConfig = {
  themeColor: '#ff0000',
  logo: SharedDefaultLogo,
  toolbarlogo: SharedDefaultLogo,
  homeScreenLayout: 'layout1',
  mainColor: '#0D021F',
  secondaryColor: '#ffffff',
  gradient1: '#F0F0F0',
  gradient2: '#773D9A',
  placeholderText: '#B893F1',
  CardborderWidth: 1.5,
  cardElevation: 0,
  basket1: '#6A29CA',
  basket2: '#4F0A9E',
  cardverticalmargin: 3,
  tabIconColor: '#fff',
  bottomTabBorderTopWidth: 0,
  bottomTabbg: '#242424',
  selectedTabcolor: '#8555EF',
  basketcolor: '#600CC0',
  basketsymbolbg: '#6D0DD6',
  googleWebClientId: '892331696104-e26pu9iotqrjk1o6jq4ifd4e95fasil1.apps.googleusercontent.com',
  googleIosClientId: '892331696104-3ga6a5c9ell75turpt6th0bbpc8ftvjl.apps.googleusercontent.com',
};

// Per-advisor config: subdomain + advisorRaCode
// When copying the app for a new advisor, just add a new entry here.
const APP_VARIANTS = {
  alphaquark: {
    // These values must be a production-safe first-paint fallback. The remote
    // config normally replaces them, but a slow/offline launch must still look
    // like AlphaQuark rather than rendering the near-white placeholder theme.
    themeColor: '#0056B7',
    logo: AlphaQuarkLogo,
    toolbarlogo: AlphaQuarkLogo,
    homeScreenLayout: 'layout2',
    mainColor: '#0056B7',
    secondaryColor: '#413E3E',
    gradient1: '#0056B7',
    gradient2: '#002651',
    placeholderText: '#FFFFFF',
    CardborderWidth: 0,
    cardElevation: 3,
    cardverticalmargin: 3,
    tabIconColor: '#000',
    bottomTabBorderTopWidth: 1.5,
    bottomTabbg: '#fff',
    selectedTabcolor: '#000',
    basketcolor: '#721E30',
    basketsymbolbg: '#8D2952',
    basket1: '#9D2115',
    basket2: '#6B1207',
    googleWebClientId: '892331696104-e26pu9iotqrjk1o6jq4ifd4e95fasil1.apps.googleusercontent.com',
    // iOS-only Google Sign-In client ID. LoginScreen requires this on iOS —
    // without it GIDSignIn raises an uncaught NSException on signIn() and
    // SIGABRTs the app (same crash class as the markup App Store rejection,
    // submission 6401f4b2, 2026-07-23). Value from ios/GoogleService-Info.plist's
    // CLIENT_ID.
    googleIosClientId: '892331696104-3ga6a5c9ell75turpt6th0bbpc8ftvjl.apps.googleusercontent.com',
    subdomain: 'prod',
    advisorRaCode: 'ALPHAQUARK',
    paymentModal: {
      headerBg: '#0056B7',
      stepActiveColor: '#0056B7',
      stepCompletedColor: '#29A400',
      buttonPrimaryBg: '#0056B7',
      buttonSecondaryBg: '#0056B7',
      accentColor: '#0056B7',
      checkboxActiveColor: '#29A400',
      linkColor: '#0056B7',
      progressBarColor: '#0056B7',
    },
  },
  alphanomy: {
    ...sharedUIConfig,
    subdomain: 'alphanomy',
    advisorRaCode: 'ALPHANOMY',
    logo: null,
    toolbarlogo: null,
    googleWebClientId: '713385591555-uj9v6fdjnceg9dr5ts0gb0l5523uhqr2.apps.googleusercontent.com',
    googleIosClientId: '713385591555-kffitn2ee2c7kr6j66bqaf8hr72fcp58.apps.googleusercontent.com',
    mainColor: '#1246F0',
    secondaryColor: '#FFFFFF',
    gradient1: '#1246F0',
    gradient2: '#7C3AED',
    placeholderText: '#8B96B0',
    bottomTabbg: 'rgba(255,255,255,0.97)',
    tabIconColor: '#8B96B0',
    selectedTabcolor: '#1246F0',
    basket1: '#1246F0',
    basket2: '#7C3AED',
    basketcolor: '#1246F0',
    basketsymbolbg: 'rgba(18,70,240,0.09)',
  },
  zamzamcapital: {...sharedUIConfig, subdomain: 'zamzamcapital',   advisorRaCode: 'ZAMZAMCAPITAL'},
  rgxresearch:   {...sharedUIConfig, subdomain: 'rgxresearch',     advisorRaCode: 'RGXRESEARCH'},
  arfs:          {...sharedUIConfig, subdomain: 'arfs',            advisorRaCode: 'ARFS'},
  magnus:        {...sharedUIConfig, subdomain: 'zamzamcapital',   advisorRaCode: 'ZAMZAMCAPITAL'},

  EmptyStateUi: {
    backgroundColor: '#6B1400',
    darkerColor: '#3A0B00',
    mediumColor: '#4D2418',
    brighterColor: '#8B2500',
    mutedColor: '#5A3327',
    lightColor: '#F8E8E5',
    mediumLightShade: '#F5DDD8',
    lightWarmColor: '#E4F1FE',
  },
};

export default APP_VARIANTS;
