import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyD98h39VaKHLeEiDR21uJsSrnzGFbvEUtY",
  authDomain: "deckmastery.firebaseapp.com",
  projectId: "deckmastery",
  storageBucket: "deckmastery.firebasestorage.app",
  messagingSenderId: "1009631704260",
  appId: "1:1009631704260:web:6f8a8db49942cb6df3c591",
  measurementId: "G-QNB9MFS5VM",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "europe-west3");
