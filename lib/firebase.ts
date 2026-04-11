// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtR_EeuacsvEjmV12kzEMxuiJv7elw7rE",
  authDomain: "sudostress.firebaseapp.com",
  projectId: "sudostress",
  storageBucket: "sudostress.firebasestorage.app",
  messagingSenderId: "766572469279",
  appId: "1:766572469279:web:5af01713bea6cd032d092a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
