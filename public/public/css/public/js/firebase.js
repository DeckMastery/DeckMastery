import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyD98h39VaKHLeEiDR21uJsSrnzGFbvEUtY",
  authDomain: "deckmastery.firebaseapp.com",
  projectId: "deckmastery",
  storageBucket: "deckmastery.firebasestorage.app",
  messagingSenderId: "1009631704260",
  appId: "1:1009631704260:web:6f8a8db49942cb6df3c591",
  measurementId: "G-QNB9MFS5VM"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ نفس المنطقة التي ضبطناها في Functions v2
export const functions = getFunctions(app, "europe-west1");
