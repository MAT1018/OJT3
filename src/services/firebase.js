import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCYBX_YirtCd6RW6VnkS25cJI4yeo3KmG8",
    authDomain: "rideshare-b082b.firebaseapp.com",
    projectId: "rideshare-b082b",
    storageBucket: "rideshare-b082b.firebasestorage.app",
    messagingSenderId: "35048245050",
    appId: "1:35048245050:web:5761ff6faa03bf2a7a3203",
    measurementId: "G-N2LETRNJSY"
};

const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally (it might not work in all RN environments without native setup)
let analytics;
isSupported().then(yes => yes && (analytics = getAnalytics(app)));

export const db = getFirestore(app);
