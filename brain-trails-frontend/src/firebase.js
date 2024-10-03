// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvVW8KOSKbN0DaQRAPLJx9vtrQBNzNoQ8",
  authDomain: "brain-trails.firebaseapp.com",
  projectId: "brain-trails",
  storageBucket: "brain-trails.appspot.com",
  messagingSenderId: "378406115962",
  appId: "1:378406115962:web:e44c11ccb9befd1bd4b9c3",
  measurementId: "G-70LNSG7XNE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app); // Keep this line
export default app;