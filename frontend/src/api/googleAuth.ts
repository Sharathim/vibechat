import {
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'

export interface GoogleUserInfo {
  email: string
  name: string
  photoURL: string | null
  idToken: string
}

export const googleAuthService = {
  // Initiate Google sign-in (try popup first, fallback to redirect)
  signIn: async (): Promise<GoogleUserInfo | null> => {
    try {
      // Try popup first (more reliable)
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      return {
        email: result.user.email || '',
        name: result.user.displayName || '',
        photoURL: result.user.photoURL,
        idToken,
      }
    } catch (error: any) {
      // If popup blocked, fall back to redirect
      if (error.code === 'auth/popup-blocked' ||
          error.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, googleProvider)
        return null // Will be handled by getRedirectResult
      }
      throw error
    }
  },

  // Check for redirect result (call on page load)
  getRedirectResult: async (): Promise<GoogleUserInfo | null> => {
    try {
      const result = await getRedirectResult(auth)
      if (!result) return null

      const idToken = await result.user.getIdToken()
      return {
        email: result.user.email || '',
        name: result.user.displayName || '',
        photoURL: result.user.photoURL,
        idToken,
      }
    } catch (error) {
      console.error('Redirect result error:', error)
      return null
    }
  },

  // Get user info from current Firebase auth state
  getCurrentUser: async (): Promise<GoogleUserInfo | null> => {
    const user = auth.currentUser
    if (!user) return null

    try {
      const idToken = await user.getIdToken()
      return {
        email: user.email || '',
        name: user.displayName || '',
        photoURL: user.photoURL,
        idToken,
      }
    } catch {
      return null
    }
  },

  // Listen for auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback)
  },

  // Sign out from Firebase
  signOut: async (): Promise<void> => {
    await signOut(auth)
  },

  // Get current user's ID token
  getIdToken: async (): Promise<string | null> => {
    const user = auth.currentUser
    if (!user) return null
    return user.getIdToken()
  },
}

export default googleAuthService
