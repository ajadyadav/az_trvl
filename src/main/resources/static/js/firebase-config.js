// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, PhoneAuthProvider, linkWithCredential } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtFMMhz9cJD6cGwxkDu648a9GosC9i4sg",
  authDomain: "aerotravel-8948d.firebaseapp.com",
  projectId: "aerotravel-8948d",
  storageBucket: "aerotravel-8948d.firebasestorage.app",
  messagingSenderId: "27619911005",
  appId: "1:27619911005:web:37307fda67c73d7c9bb4b4",
  measurementId: "G-93D6JLZ6QZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, PhoneAuthProvider, linkWithCredential, doc, setDoc, getDoc, collection, getDocs, query, orderBy };
