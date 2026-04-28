import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    
    // Provide user-friendly error alerts for common issues
    if (error.code === 'auth/unauthorized-domain') {
      alert(`Firebase Domain Error: Your app's URL is not authorized in Firebase. Please add this domain to the Authorized Domains list in your Firebase Console under Authentication > Settings.`);
    } else if (error.code === 'auth/popup-blocked') {
      alert(`Popup Blocked: Please allow popups for this site in your browser to sign in with Google.`);
    } else if (error.code === 'auth/api-key-not-valid. Please pass a valid API key.') {
      alert(`Firebase API Key Error: Your Firebase configuration is missing or invalid. Note: The Firebase API key is different from the Gemini API key.`);
    } else {
      alert(`Sign in error: ${error.message}`);
    }
    
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
