/**
 * ============================================================================
 * designs/alphanomy — ALPHANOMY 2026 VARIANT ROOT
 * ============================================================================
 *
 * Source design: alphanomy-improved.html (9 screens). This variant is the
 * thin foundation slice — tokens are shipped in full, and one screen
 * (LoginScreen) is overridden as the visual proof. Every other screen,
 * composite, and primitive falls through to designs/default/.
 *
 * To extend the variant, add a screen file under `designs/alphanomy/screens/`
 * and register it in the `components` map below using the same dot-namespaced
 * key as default (e.g. `screens.HomeScreen`). Custom variants cannot add new
 * keys that default doesn't have.
 *
 * Activation: set `DESIGN_VARIANT=alphanomy` in `.env` (or pass
 * `<DesignProvider variant="alphanomy">` for tests).
 * ============================================================================
 */

import * as tokens from './tokens';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import OrderScreen from './screens/OrderScreen';
import ModelPortfolioScreen from './screens/ModelPortfolioScreen';
import AccountSettingsScreen from './screens/AccountSettingsScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import NotificationListScreen from './screens/NotificationListScreen';
import MPPerformanceScreen from './screens/MPPerformanceScreen';
import EmptyStateMP from './composites/EmptyStateMP';
import CustomTabbarMPPerformance from './composites/CustomTabbarMPPerformance';

const variant = {
    name: 'alphanomy',
    tokens,
    components: {
        'screens.LoginScreen': LoginScreen,
        'screens.SignupScreen': SignupScreen,
        'screens.HomeScreen': HomeScreen,
        'screens.OrderScreen': OrderScreen,
        'screens.ModelPortfolioScreen': ModelPortfolioScreen,
        'screens.AccountSettingsScreen': AccountSettingsScreen,
        'screens.PortfolioScreen': PortfolioScreen,
        'screens.NotificationListScreen': NotificationListScreen,
        // MPPerformanceScreen — pass 1 (chrome + locked state). Tab bodies
        // (Portfolio / Overview / Research scenes) still render through
        // legacy chrome; pass 2 will theme the distribution / chart /
        // methodology blocks.
        'screens.MPPerformanceScreen': MPPerformanceScreen,
        'composites.EmptyStateMP': EmptyStateMP,
        'composites.CustomTabbarMPPerformance': CustomTabbarMPPerformance,
    },
    // SDK widget defaults fall through to designs/default/sdk/ — no overrides
    // shipped in this slice.
};

export default variant;
