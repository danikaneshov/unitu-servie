// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Твой конфиг из Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDH1sVswERvfGMgYDnYA-elfJanHETHV_4",
  authDomain: "disk-60afb.firebaseapp.com",
  projectId: "disk-60afb",
  storageBucket: "disk-60afb.firebasestorage.app",
  messagingSenderId: "558961236310",
  appId: "1:558961236310:web:85c61e184f70d88c979ef7"
};

// Инициализация
const app = initializeApp(firebaseConfig);

// Экспортируем нужные сервисы, чтобы использовать их в других файлах
export const auth = getAuth(app);
export const db = getFirestore(app);