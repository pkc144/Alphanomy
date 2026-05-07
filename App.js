import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';
import {StatusBar, Text, TextInput, SafeAreaView, Linking, Alert} from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {getAuth, onAuthStateChanged} from '@react-native-firebase/auth';
import notifee, {EventType} from '@notifee/react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useSafeAreaInsets,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { handleOAuthCallback } from './src/services/ZerodhaOAuthService';
import Config from 'react-native-config';

import Navigation from './src/components/Navigation';
import {CartProvider} from './src/components/CartContext';
import {ModalProvider} from './src/components/ModalContext';
import {SocialProofProvider} from './src/components/SocialProofProvider';
import DesignProvider from './src/design/DesignProvider';
import server from './src/utils/serverConfig';
import {TradeProvider} from './src/screens/TradeContext';
import {ConfigProvider} from './src/context/ConfigContext';
import {GstConfigProvider} from './src/context/GstConfigContext';
import ModalManager from './src/GlobalUIModals/ModalManager';
import BrokerAlertModal from './src/GlobalUIModals/BrokerAlertModal';
import UpdateAppModal from './src/UpdateAppModal';
import SdkProviderRoot, {
  isSdkIntegrationEnabled,
} from './src/sdk/SdkProviderRoot';

// Hoisted to module scope so its component identity stays STABLE across
// App re-renders. Previously declared inline inside the App body (`const
// SdkRootWrapper = ...`) — that recreated the wrapper function on every
// App render, React saw a new component type at the wrapper node and
// unmounted the entire navigation subtree below it on every parent state
// change, wiping useState in every screen. Reproduced as the LoginScreen
// / SignupScreen "characters disappear / fluctuate as you type / can't
// type at all" symptom (verified via adb input on emulator-5554 on
// 2026-05-07: a single `adb shell input text "TestUser"` produced only
// "T" in the field because the screen was unmounting between characters).
const SdkOnWrapper = ({userEmail, children}) => (
  <SdkProviderRoot userEmail={userEmail}>{children}</SdkProviderRoot>
);

// Same root cause: was declared inline inside App body, remounted on each
// render, and on Android each remount touched the native StatusBar APIs
// which Android registered as a window-focus event — so the IME would
// drop its bound EditText immediately after focus and the keyboard
// dismissed itself.
const CustomStatusBar = ({barStyle}) => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['rgba(0, 86, 183, 1)', 'rgba(0, 86, 183, 1)']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={{height: insets.top}}>
      <StatusBar
        animated={true}
        barStyle={barStyle || 'light-content'}
        translucent={true}
        backgroundColor="transparent"
      />
    </LinearGradient>
  );
};

const App = () => {
  const [isSplashCompleted, setSplashCompleted] = useState(false);
  const [iscomplete, setcomplete] = useState(false);
  // const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  const [userEmail, setUserEmail] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    // Handle user state changes
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      if (user?.email) {
        //console.log('got the emaiiilll:',user?.email);
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
      if (initializing) {
        setInitializing(false);
      }
    });
    // Cleanup subscription
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    // Foreground event listener
    notifee.onForegroundEvent(({type, detail}) => {
      //  console.log('detail app:',detail);
      if (type === EventType.ACTION_PRESS) {
        const {pressAction, notification} = detail;

        if (pressAction.id === 'buy_sell') {
          const {symbol, trade_id, type} = notification.data;
          //console.log(`Action: ${type === 'BUY' ? 'BUY NOW' : 'SELL NOW'}`);
          // console.log('Symbol:', symbol);
          // console.log('Trade ID:', trade_id);
        }

        if (pressAction.id === 'ignore') {
          console.log('User chose to ignore the notification.');
        }
      }
    });

    // Background event listener
    notifee.onBackgroundEvent(async ({type, detail}) => {
      console.log('detail app:', detail);
      if (type === EventType.ACTION_PRESS) {
        const {pressAction, notification} = detail;

        if (pressAction.id === 'buy_sell') {
          const {symbol, trade_id, type} = notification.data;
          console.log(`Action: ${type === 'BUY' ? 'BUY NOW' : 'SELL NOW'}`);
          console.log('Symbol:', symbol);
          console.log('Trade ID:', trade_id);
        }

        if (pressAction.id === 'ignore') {
          console.log('User chose to ignore the notification.');
        }
      }
    });

    // Deep link listener for Zerodha OAuth callback
    const handleDeepLink = async (event) => {
      const url = event.url;
      console.log('[App] Deep link received:', url);

      // Check if it's a Zerodha OAuth callback
      const scheme = Config?.REACT_APP_DEEP_LINK_SCHEME || 'rgxapp';
      if (url && url.startsWith(`${scheme}://zerodha/callback`)) {
        console.log('[App] Zerodha OAuth callback detected');

        const result = await handleOAuthCallback(url);

        if (result.success) {
          Alert.alert('Success', result.message || 'Zerodha connected successfully!');
        } else {
          Alert.alert('Error', result.error || 'Failed to connect Zerodha');
        }
      }
    };

    // Listen for deep link events
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      linkingSubscription.remove();
    };
  }, []);

  if (Text.defaultProps) {
    Text.defaultProps.allowFontScaling = false;
  } else {
    Text.defaultProps = {};
    Text.defaultProps.allowFontScaling = false;
  }

  // Override Text scaling in input fields
  if (TextInput.defaultProps) {
    TextInput.defaultProps.allowFontScaling = false;
  } else {
    TextInput.defaultProps = {};
    TextInput.defaultProps.allowFontScaling = false;
  }

  const getUserDetails = async () => {
    try {
      const response = await axios.get(
        `${server.server.baseUrl}api/user/getUser/${userEmail}`,
      );
      const user = response.data.User;
      //   console.log('the user details i get :',user?.phone_number, user?.phone_number.toString().length >= 9)
      if (user?.phone_number && user?.phone_number.toString().length >= 9) {
        setcomplete(true);
      } else {
        setcomplete(false);
      }
    } catch (error) {
      //  console.error("Error fetching user details:::;;:", error);
      setcomplete(false);
    } finally {
      setcomplete(false);
    }
  };

  useEffect(() => {
    // Simulate Splash Screen for 2 seconds
    setTimeout(() => {
      setSplashCompleted(true);
    }, 2000);
  }, []);

  useEffect(() => {
    if (!!user) {
      getUserDetails();
    }
  }, [!!user]);

  // CustomStatusBar + SdkRootWrapper are now defined at module scope (top
  // of file) so they don't get a new component identity on every App
  // render. See the comments at their definitions for the production
  // symptom that motivated the hoist.
  const sdkOn = isSdkIntegrationEnabled();

  return (
    <SafeAreaProvider style={{flex: 1}}>
      <UpdateAppModal />
      <CustomStatusBar barStyle={'dark-content'} />
      <GestureHandlerRootView style={{flex: 1}}>
        <DesignProvider>
          <SocialProofProvider>
            <CartProvider>
              <ConfigProvider>
                <TradeProvider>
                  <GstConfigProvider>
                  <ModalProvider>
                    {sdkOn ? (
                      <SdkOnWrapper userEmail={userEmail}>
                        <SafeAreaView style={{flex: 1}}>
                          <Navigation
                            iscomplete={iscomplete}
                            userEmail={userEmail}
                            isAuthenticated={!!user}
                          />
                          <Toast />
                        </SafeAreaView>
                        <ModalManager />
                        <BrokerAlertModal />
                      </SdkOnWrapper>
                    ) : (
                      <>
                        <SafeAreaView style={{flex: 1}}>
                          <Navigation
                            iscomplete={iscomplete}
                            userEmail={userEmail}
                            isAuthenticated={!!user}
                          />
                          <Toast />
                        </SafeAreaView>
                        <ModalManager />
                        <BrokerAlertModal />
                      </>
                    )}
                  </ModalProvider>
                  </GstConfigProvider>
                </TradeProvider>
              </ConfigProvider>
            </CartProvider>
          </SocialProofProvider>
        </DesignProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default App;
