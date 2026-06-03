import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword,createUserWithEmailAndPassword, GoogleAuthProvider,FacebookAuthProvider, signInWithPopup,signOut,sendPasswordResetEmail,fetchSignInMethodsForEmail,sendEmailVerification,onAuthStateChanged,verifyPasswordResetCode,confirmPasswordReset,applyActionCode,checkActionCode} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCufXDRIMO6sNftQ0LibCebw2hOC67cCf0",
  authDomain: "curki-dashboard.firebaseapp.com",
  projectId: "curki-dashboard",
  storageBucket: "curki-dashboard.firebasestorage.app",
  messagingSenderId: "754446776405",
  appId: "1:754446776405:web:b6ae82dab5a7d28fccbcdc",
  measurementId: "G-9L6TLJ79C3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Realtime Database is not enabled on curki-dashboard. The click-counter
// feature (used in HomePage / UploaderPage) is a no-op until RTDB is enabled.
const getCount = async () => 0;
const incrementCount = async () => {};
const onCountChange = () => {};

export { auth, googleProvider,facebookProvider, signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithPopup,signOut,getCount,incrementCount,onCountChange,sendPasswordResetEmail,fetchSignInMethodsForEmail,sendEmailVerification,onAuthStateChanged,verifyPasswordResetCode,confirmPasswordReset,applyActionCode,checkActionCode};
