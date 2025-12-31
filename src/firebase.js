import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword,createUserWithEmailAndPassword, GoogleAuthProvider,FacebookAuthProvider, signInWithPopup,signOut,sendPasswordResetEmail,fetchSignInMethodsForEmail,sendEmailVerification,onAuthStateChanged} from "firebase/auth";
import {getDatabase,ref,get,set,onValue,increment} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDJbuqokI3GNZaDE3A8ptWjCcbwNcewtsM",
    authDomain: "intelcaredashboard.firebaseapp.com",
    projectId: "intelcaredashboard",
    storageBucket: "intelcaredashboard.firebasestorage.app",
    messagingSenderId: "812085753268",
    appId: "1:812085753268:web:e65d724e6b6e93cf986ee1",
    measurementId: "G-CZDVK48GY2",
    databaseURL: "https://intelcaredashboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const db = getDatabase(app);
const countRef = ref(db, "clickCount");

// Functions to export
const getCount = async () => {
  if (!auth.currentUser) {
   return;
  }
  const snapshot = await get(countRef);
  console.log(snapshot.exists() ? snapshot.val() : 0)
  return snapshot.exists() ? snapshot.val() : 0;
};


const incrementCount = async () => {
  const current = await getCount();
  await set(countRef, current + 1);
};

const onCountChange = (callback) => {
  onValue(countRef, (snapshot) => {
    callback(snapshot.val() ?? 0);
  });
};

export { auth, googleProvider,facebookProvider, signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithPopup,signOut,getCount,incrementCount,onCountChange,sendPasswordResetEmail,fetchSignInMethodsForEmail,sendEmailVerification,onAuthStateChanged};
