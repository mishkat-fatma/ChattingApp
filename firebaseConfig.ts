import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBphIMAHNr__6H5732YY61k10KEdawQTk4",
  authDomain: "chattingapp-5bf76.firebaseapp.com",
  projectId: "chattingapp-5bf76",
  storageBucket: "chattingapp-5bf76.firebasestorage.app",
  messagingSenderId: "1014217722707",
  appId: "1:1014217722707:web:12c74fadc64bd44ef46fa6",
  measurementId: "G-W95VX5KX18"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);