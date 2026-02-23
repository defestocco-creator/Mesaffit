
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD27OrBtrUCzyZzC8hAlfpTH7aPAYplOUg",
  authDomain: "delibery-auth.firebaseapp.com",
  databaseURL: "https://delibery-auth-default-rtdb.firebaseio.com",
  projectId: "delibery-auth",
  storageBucket: "delibery-auth.firebasestorage.app",
  messagingSenderId: "67540689774",
  appId: "1:67540689774:web:36e7f883f9ec7941bad77f",
  measurementId: "G-6VSRFRQ9MQ"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

try {
  getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics não disponível neste ambiente.");
}
