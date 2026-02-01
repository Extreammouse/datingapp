import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserData {
    uid: string;
    email: string;
    displayName: string;
    age?: number;
    bio?: string;
    gender?: 'male' | 'female' | 'other';
    lookingFor?: 'male' | 'female' | 'everyone';
    photoURL?: string;
    createdAt: any;
    updatedAt: any;
}

class FirebaseAuthService {
    private authStateListeners: Set<(user: User | null) => void> = new Set();

    /**
     * Initialize auth state listener
     */
    initialize() {
        onAuthStateChanged(auth, (user) => {
            console.log('[FirebaseAuth] Auth state changed:', user?.uid);
            this.authStateListeners.forEach(listener => listener(user));
        });
    }

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback: (user: User | null) => void): () => void {
        this.authStateListeners.add(callback);
        // Immediately call with current user
        callback(auth.currentUser);

        return () => {
            this.authStateListeners.delete(callback);
        };
    }

    /**
     * Sign up with email and password
     */
    async signUp(email: string, password: string, displayName: string): Promise<User> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with display name
            await updateProfile(user, { displayName });

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            } as UserData);

            console.log('[FirebaseAuth] User created:', user.uid);
            return user;
        } catch (error: any) {
            console.error('[FirebaseAuth] Sign up error:', error.message);
            throw error;
        }
    }

    /**
     * Sign in with email and password
     */
    async signIn(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('[FirebaseAuth] User signed in:', userCredential.user.uid);
            return userCredential.user;
        } catch (error: any) {
            console.error('[FirebaseAuth] Sign in error:', error.message);
            throw error;
        }
    }

    /**
     * Sign out current user
     */
    async signOut(): Promise<void> {
        try {
            await signOut(auth);
            console.log('[FirebaseAuth] User signed out');
        } catch (error: any) {
            console.error('[FirebaseAuth] Sign out error:', error.message);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    async resetPassword(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
            console.log('[FirebaseAuth] Password reset email sent');
        } catch (error: any) {
            console.error('[FirebaseAuth] Reset password error:', error.message);
            throw error;
        }
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return auth.currentUser;
    }

    /**
     * Get user data from Firestore
     */
    async getUserData(userId: string): Promise<UserData | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data() as UserData;
            }
            return null;
        } catch (error: any) {
            console.error('[FirebaseAuth] Get user data error:', error.message);
            throw error;
        }
    }

    /**
     * Update user data in Firestore
     */
    async updateUserData(userId: string, data: Partial<UserData>): Promise<void> {
        try {
            await updateDoc(doc(db, 'users', userId), {
                ...data,
                updatedAt: serverTimestamp(),
            });
            console.log('[FirebaseAuth] User data updated:', userId);
        } catch (error: any) {
            console.error('[FirebaseAuth] Update user data error:', error.message);
            throw error;
        }
    }
}

// Export singleton
export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
