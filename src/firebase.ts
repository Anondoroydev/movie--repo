import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc, getDocFromServer, writeBatch, increment } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Ensure persistence is set
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Auth persistence error:", err));

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection
async function testConnection() {
  try {
    console.log("Testing Firebase connection to database:", firebaseConfig.firestoreDatabaseId);
    // Try to read a public path
    const testDoc = await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection test: SUCCESS", testDoc.exists() ? "(doc exists)" : "(doc does not exist)");
  } catch (error: any) {
    console.error("Firebase connection test: FAILED", error.message || error);
    if (error.message?.includes('Missing or insufficient permissions')) {
      console.error("PERMISSION ERROR: The firestore.rules are blocking the connection test. Please wait for the rules to propagate.");
    } else if (error.message?.includes('the client is offline')) {
      console.error("OFFLINE ERROR: Check network or authorized domains.");
    }
  }
}
testConnection();

export { signInWithPopup, signOut, onAuthStateChanged, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, writeBatch, updateProfile, increment };
export type { User };
