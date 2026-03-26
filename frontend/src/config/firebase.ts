import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// TODO: Replace with your Firebase project config
// Get these values from Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyCBKvygTjpzyxkfyKP5RAP8Q_1jr6a71XE",
  authDomain: "vibechat-version-1.firebaseapp.com",
  projectId: "vibechat-version-1",
  storageBucket: "vibechat-version-1.firebasestorage.app",
  messagingSenderId: "132057605516",
  appId: "1:132057605516:web:92a7b94067c940aa1aa2a9"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Request additional OAuth scopes if needed
googleProvider.addScope('email')
googleProvider.addScope('profile')
