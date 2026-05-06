// Bridgeless-mode startup race fix.
//
// Reanimated requires new architecture (bridgeless). In bridgeless mode,
// when a legacy native module (notifee/firebase/razorpay/etc.) fires an
// event during early init, the bridge tries to call into the JS module
// `RCTEventEmitter` — but RN's renderer (which registers it) hasn't loaded
// yet because index.js's import chain is still resolving. The thrown error
// aborts the whole bundle evaluation, AppRegistry.registerComponent is
// never called, and the app boots to a blank white screen.
//
// Pre-registering a no-op RCTEventEmitter handler before any other import
// runs absorbs those early events safely, letting App.js finish loading.
require('react-native/Libraries/EventEmitter/RCTEventEmitter').register({
  receiveEvent: () => {},
  receiveTouches: () => {},
});

import { AppRegistry, AppState, LogBox } from 'react-native';

LogBox.ignoreLogs([
  /Failed to call into JavaScript module method RCTEventEmitter\.receiveEvent/,
]);

import App from './App';
import { name as appName } from './app.json';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import NatificationServiceNav from './src/components/NatificationServiceNav';
import messaging from '@react-native-firebase/messaging';

let notificationDisplayed = false;

// Display the notification function
const displayNotification = async (title, body) => {
  try {
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      vibration: true,
      sound: 'default',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [300, 500],
    });

    // Display notification only if the app is not in the foreground and notification hasn't been shown
    if (AppState.currentState !== 'active' && !notificationDisplayed) {
      console.log('App not active, displaying notification');
      await notifee.displayNotification({
        title: title,
        body: body,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default', // Handle notification press event
          },
        },
      });
      notificationDisplayed = true;
    }
  } catch (error) {
    console.log('Error displaying notification: ' + error);
  }
};

// Background message handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  if (remoteMessage) {
    const { title, body } = remoteMessage.notification;
    // Display notification in the background
    await displayNotification(title, body);
    console.log('Notification received in background');
  }
});

// Handle notification when the app was closed and opened via notification
messaging().getInitialNotification().then(async (remoteMessage) => {
  if (remoteMessage) {
    const { title, body } = remoteMessage.notification;
    // Display notification only, do not navigate automatically
    await displayNotification(title, body);
    console.log('Notification received when app was closed');
  }
});

// Handle notification press events when the app is in the foreground
notifee.onForegroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed in foreground');
    // Navigate to NotificationScreen when the notification is pressed
    NatificationServiceNav.navigate('NotificationScreen');
  }
});

// Handle notification press events when the app is in the background
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed in background');
    // Navigate to NotificationScreen when the notification is pressed
    NatificationServiceNav.navigate('NotificationScreen');
  }
});

// Register the app
AppRegistry.registerComponent(appName, () => App);
