import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    GeoPoint,
    Timestamp,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { firebaseAuthService } from './FirebaseAuthService';

export interface PhotoFragment {
    id: string;
    userId: string;
    userDisplayName: string;
    latitude: number;
    longitude: number;
    imageUrl: string; // Blurred/partial photo segment
    fullImageUrl?: string; // Full photo URL (revealed after collection)
    fragmentIndex: number; // Which piece (0-3)
    createdAt: Timestamp;
    expiresAt?: Timestamp;
    isCollected: boolean;
    collectedBy?: string;
}

export interface UserFragmentProgress {
    userId: string; // Whose fragments we're collecting
    collectorId: string; // Who is collecting
    fragmentsCollected: number[]; // [0, 1, 2, 3] - which fragments collected
    totalFragments: number;
    isProfileUnlocked: boolean;
    updatedAt: Timestamp;
}

class FirestoreFragmentService {
    private fragmentListeners: Map<string, () => void> = new Map();

    /**
     * Drop a photo fragment at current location
     */
    async dropFragment(
        latitude: number,
        longitude: number,
        imageUrl: string,
        fragmentIndex: number
    ): Promise<void> {
        try {
            const currentUser = firebaseAuthService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be authenticated to drop fragments');
            }

            const userData = await firebaseAuthService.getUserData(currentUser.uid);
            const fragmentId = `${currentUser.uid}_${Date.now()}_${fragmentIndex}`;

            const fragmentData: PhotoFragment = {
                id: fragmentId,
                userId: currentUser.uid,
                userDisplayName: userData?.displayName || 'Anonymous',
                latitude,
                longitude,
                imageUrl, // Blurred segment
                fullImageUrl: userData?.photoURL,
                fragmentIndex,
                createdAt: Timestamp.now(),
                expiresAt: Timestamp.fromMillis(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
                isCollected: false,
            };

            await setDoc(doc(db, 'fragments', fragmentId), fragmentData);
            console.log('[FirestoreFragments] Fragment dropped:', fragmentId);
        } catch (error: any) {
            console.error('[FirestoreFragments] Drop fragment error:', error.message);
            throw error;
        }
    }

    /**
     * Get nearby fragments within a radius
     */
    async getNearbyFragments(
        latitude: number,
        longitude: number,
        radiusKm: number = 1
    ): Promise<PhotoFragment[]> {
        try {
            // Firestore doesn't support geoqueries natively, so we'll fetch all uncollected
            // fragments and filter by distance client-side
            // In production, use a library like GeoFirestore or implement geohashing

            const fragmentsRef = collection(db, 'fragments');
            const q = query(fragmentsRef, where('isCollected', '==', false));
            const querySnapshot = await getDocs(q);

            const fragments: PhotoFragment[] = [];
            querySnapshot.forEach((doc: any) => {
                const data = doc.data() as PhotoFragment;
                const distance = this.calculateDistance(
                    latitude,
                    longitude,
                    data.latitude,
                    data.longitude
                );

                // Check if within radius
                if (distance <= radiusKm) {
                    fragments.push(data);
                }
            });

            console.log(`[FirestoreFragments] Found ${fragments.length} nearby fragments`);
            return fragments;
        } catch (error: any) {
            console.error('[FirestoreFragments] Get nearby fragments error:', error.message);
            throw error;
        }
    }

    /**
     * Listen to nearby fragments in real-time
     */
    listenToNearbyFragments(
        latitude: number,
        longitude: number,
        radiusKm: number,
        callback: (fragments: PhotoFragment[]) => void
    ): () => void {
        const fragmentsRef = collection(db, 'fragments');
        const q = query(fragmentsRef, where('isCollected', '==', false));

        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const fragments: PhotoFragment[] = [];
            snapshot.forEach((doc: any) => {
                const data = doc.data() as PhotoFragment;
                const distance = this.calculateDistance(
                    latitude,
                    longitude,
                    data.latitude,
                    data.longitude
                );

                if (distance <= radiusKm) {
                    fragments.push(data);
                }
            });

            callback(fragments);
        });

        return unsubscribe;
    }

    /**
     * Collect a fragment
     */
    async collectFragment(fragmentId: string): Promise<void> {
        try {
            const currentUser = firebaseAuthService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be authenticated to collect fragments');
            }

            const fragmentRef = doc(db, 'fragments', fragmentId);
            const fragmentSnap = await getDoc(fragmentRef);

            if (!fragmentSnap.exists()) {
                throw new Error('Fragment not found');
            }

            const fragmentData = fragmentSnap.data() as PhotoFragment;

            // Can't collect your own fragments
            if (fragmentData.userId === currentUser.uid) {
                throw new Error('Cannot collect your own fragments');
            }

            // Mark fragment as collected
            await updateDoc(fragmentRef, {
                isCollected: true,
                collectedBy: currentUser.uid,
            });

            // Update user's collection progress
            await this.updateFragmentProgress(
                currentUser.uid,
                fragmentData.userId,
                fragmentData.fragmentIndex
            );

            console.log('[FirestoreFragments] Fragment collected:', fragmentId);
        } catch (error: any) {
            console.error('[FirestoreFragments] Collect fragment error:', error.message);
            throw error;
        }
    }

    /**
     * Update fragment collection progress
     */
    private async updateFragmentProgress(
        collectorId: string,
        targetUserId: string,
        fragmentIndex: number
    ): Promise<void> {
        const progressId = `${collectorId}_${targetUserId}`;
        const progressRef = doc(db, 'fragmentProgress', progressId);
        const progressSnap = await getDoc(progressRef);

        let fragmentsCollected: number[] = [];
        let totalFragments = 4; // Default to 4 fragments per user

        if (progressSnap.exists()) {
            const data = progressSnap.data() as UserFragmentProgress;
            fragmentsCollected = data.fragmentsCollected;
        }

        // Add new fragment if not already collected
        if (!fragmentsCollected.includes(fragmentIndex)) {
            fragmentsCollected.push(fragmentIndex);
        }

        const isProfileUnlocked = fragmentsCollected.length >= totalFragments;

        await setDoc(progressRef, {
            userId: targetUserId,
            collectorId,
            fragmentsCollected,
            totalFragments,
            isProfileUnlocked,
            updatedAt: Timestamp.now(),
        } as UserFragmentProgress);

        console.log(
            `[FirestoreFragments] Progress updated: ${fragmentsCollected.length}/${totalFragments} collected`
        );
    }

    /**
     * Get fragment collection progress for a user
     */
    async getFragmentProgress(targetUserId: string): Promise<UserFragmentProgress | null> {
        try {
            const currentUser = firebaseAuthService.getCurrentUser();
            if (!currentUser) return null;

            const progressId = `${currentUser.uid}_${targetUserId}`;
            const progressRef = doc(db, 'fragmentProgress', progressId);
            const progressSnap = await getDoc(progressRef);

            if (progressSnap.exists()) {
                return progressSnap.data() as UserFragmentProgress;
            }

            return null;
        } catch (error: any) {
            console.error('[FirestoreFragments] Get progress error:', error.message);
            throw error;
        }
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    /**
     * Clean up listeners
     */
    cleanup(): void {
        this.fragmentListeners.forEach((unsubscribe: any) => unsubscribe());
        this.fragmentListeners.clear();
    }
}

// Export singleton
export const firestoreFragmentService = new FirestoreFragmentService();
export default firestoreFragmentService;
