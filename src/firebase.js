// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Yahan apna Firebase Config paste karo jo console se mila tha
const firebaseConfig = {
  apiKey: "AIzaSyBk0FccdTIZz6yIMsucexKpqBaXFC21qF0",
  authDomain: "sparkcode-cloud.firebaseapp.com",
  projectId: "sparkcode-cloud",
  storageBucket: "sparkcode-cloud.firebasestorage.app",
  messagingSenderId: "235870353401",
  appId: "1:235870353401:web:76d39a0870dcc02f89ef28",
  measurementId: "G-Y7P58K9N7W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);