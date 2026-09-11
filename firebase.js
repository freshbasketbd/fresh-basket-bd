// Fresh Basket BD - Firebase Configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZwu_NOP36QQqHmFatF4kGPapVBFe8t2I",
  authDomain: "fresh-basket-bd.firebaseapp.com",
  projectId: "fresh-basket-bd",
  storageBucket: "fresh-basket-bd.firebasestorage.app",
  messagingSenderId: "419953977573",
  appId: "1:419953977573:web:7841b5851dac96b1380c0c",
  measurementId: "G-WC771F869Y"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// Export everything needed by admin.js
export {
  app,
  auth,
  db,
  storage,

  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,

  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,

  ref,
  uploadBytes,
  getDownloadURL
};