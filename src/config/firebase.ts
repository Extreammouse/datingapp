import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCyI8xDMs-y9UGxnGDlUnBQ2DEjekD7rHQ",
    authDomain: "dateme-9f8d3.firebaseapp.com",
    projectId: "dateme-9f8d3",
    storageBucket: "dateme-9f8d3.firebasestorage.app",
    messagingSenderId: "569353742801",
    appId: "1:569353742801:web:8db048bc2a45860bf898f0",
    measurementId: "G-YRR93MJPDJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
export default app;
