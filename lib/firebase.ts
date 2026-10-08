import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD772Rb4Atk39rndlEDf57vGEUgz4NAsXg",
  authDomain: "bolu-english.firebaseapp.com",
  projectId: "bolu-english",
  storageBucket: "bolu-english.firebasestorage.app",
  messagingSenderId: "112365562206",
  appId: "1:112365562206:web:36369f9ba6fb395a68c7cf",
  measurementId: "G-LFYKV4695C",
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
