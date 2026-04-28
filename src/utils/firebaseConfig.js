import { firebase } from '@react-native-firebase/app';
import Config from 'react-native-config';

// Firebase configuration from environment variables
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: Config.REACT_APP_FIREBASE_API_KEY,
  authDomain: Config.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: Config.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: Config.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.REACT_APP_FIREBASE_APP_ID,
  measurementId: Config.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
