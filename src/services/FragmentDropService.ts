import { doc, setDoc, getDocs, collection, query, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { firebaseAuthService } from './FirebaseAuthService';
import { gameQuestionService, GameQuestion } from './GameQuestionService';
import { splitImageIntoFragments, FragmentImage } from '../utils/PhotoSplitter';

export interface Location {
    latitude: number;
    longitude: number;
}

export interface DroppedFragment {
    id: string;
    userId: string;
    userDisplayName: string;
    fragmentIndex: number;
    latitude: number;
    longitude: number;
    blurredImageUrl: string;
    clearImageUrl: string;
    gameQuestions: GameQuestion[];
    createdAt: any;
    expiresAt: any;
    status: 'active' | 'collected' | 'failed';
    collectedBy?: string;
}

class FragmentDropService {
    private distanceTraveled: number = 0;
    private nextDropThreshold: number = this.generateRandomThreshold();
    private lastLocation: Location | null = null;
    private currentFragmentIndex: number = 0;
    private fragmentImages: FragmentImage[] = [];
    private isInitialized: boolean = false;

    /**
     * Generate random drop threshold between 50m-150m
     */
    private generateRandomThreshold(): number {
        return 50 + Math.random() * 100; // 50m - 150m
    }

    /**
     * Initialize fragment dropping for user
     * @param firstPhotoUri - URI of user's first profile photo
     */
    async initialize(firstPhotoUri: string): Promise<void> {
        try {
            console.log('[FragmentDrop] Initializing with photo:', firstPhotoUri);

            // Split image into 4 fragments
            this.fragmentImages = await splitImageIntoFragments(firstPhotoUri);

            // Upload fragments to Firebase Storage
            await this.uploadFragmentsToStorage(this.fragmentImages);

            this.isInitialized = true;
            console.log('[FragmentDrop] Initialized with 4 fragments');
        } catch (error: any) {
            console.error('[FragmentDrop] Initialization error:', error.message);
            throw error;
        }
    }

    /**
     * Upload fragment images to Firebase Storage
     */
    private async uploadFragmentsToStorage(fragments: FragmentImage[]): Promise<void> {
        const currentUser = firebaseAuthService.getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        for (const fragment of fragments) {
            try {
                // Upload blurred fragment
                const blurredBlob = await fetch(fragment.blurredUri).then(r => r.blob());
                const blurredRef = ref(storage, `users/${currentUser.uid}/photos/fragment_${fragment.index}_blurred.jpg`);
                await uploadBytes(blurredRef, blurredBlob);

                // Upload clear fragment
                const clearBlob = await fetch(fragment.uri).then(r => r.blob());
                const clearRef = ref(storage, `users/${currentUser.uid}/photos/fragment_${fragment.index}_clear.jpg`);
                await uploadBytes(clearRef, clearBlob);

                console.log(`[FragmentDrop] Uploaded fragment ${fragment.index} to storage`);
            } catch (error) {
                console.error(`[FragmentDrop] Upload error for fragment ${fragment.index}:`, error);
            }
        }
    }

    /**
     * Handle location update - check if should drop fragment
     */
    async onLocationUpdate(newLocation: Location): Promise<void> {
        if (!this.isInitialized) {
            console.warn('[FragmentDrop] Not initialized, skipping drop check');
            return;
        }

        if (!this.lastLocation) {
            this.lastLocation = newLocation;
            return;
        }

        // Calculate distance traveled since last location
        const distance = this.calculateDistance(this.lastLocation, newLocation);
        this.distanceTraveled += distance;

        console.log(`[FragmentDrop] Traveled: ${this.distanceTraveled.toFixed(0)}m / ${this.nextDropThreshold.toFixed(0)}m`);

        // Check if threshold reached
        if (this.distanceTraveled >= this.nextDropThreshold) {
            // Check if location is valid (not too close to existing fragments)
            const isValid = await this.isValidDropLocation(newLocation);

            if (isValid) {
                await this.dropFragment(newLocation);

                // Reset for next drop
                this.distanceTraveled = 0;
                this.nextDropThreshold = this.generateRandomThreshold();
                this.currentFragmentIndex = (this.currentFragmentIndex + 1) % 4; // Cycle through 0-3
            } else {
                console.log('[FragmentDrop] Location too close to existing fragment, skipping');
            }
        }

        this.lastLocation = newLocation;
    }

    /**
     * Drop a fragment at the current location
     */
    private async dropFragment(location: Location): Promise<void> {
        try {
            const currentUser = firebaseAuthService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User must be authenticated to drop fragments');
            }

            const userData = await firebaseAuthService.getUserData(currentUser.uid);

            // Get 5 random questions for this fragment
            const questions = await gameQuestionService.getRandomQuestionsForFragment(currentUser.uid, 5);

            // Get download URLs for fragment images
            const blurredUrl = await getDownloadURL(
                ref(storage, `users/${currentUser.uid}/photos/fragment_${this.currentFragmentIndex}_blurred.jpg`)
            );
            const clearUrl = await getDownloadURL(
                ref(storage, `users/${currentUser.uid}/photos/fragment_${this.currentFragmentIndex}_clear.jpg`)
            );

            const fragmentId = `${currentUser.uid}_${Date.now()}_${this.currentFragmentIndex}`;

            const fragmentData: DroppedFragment = {
                id: fragmentId,
                userId: currentUser.uid,
                userDisplayName: userData?.displayName || 'Anonymous',
                fragmentIndex: this.currentFragmentIndex,
                latitude: location.latitude,
                longitude: location.longitude,
                blurredImageUrl: blurredUrl,
                clearImageUrl: clearUrl,
                gameQuestions: questions,
                createdAt: Timestamp.now(),
                expiresAt: Timestamp.fromMillis(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
                status: 'active',
            };

            await setDoc(doc(db, 'fragments', fragmentId), fragmentData);

            console.log(`[FragmentDrop] Dropped fragment ${this.currentFragmentIndex} at`, location);
        } catch (error: any) {
            console.error('[FragmentDrop] Drop error:', error.message);
            throw error;
        }
    }

    /**
     * Check if location is valid (50m+ from any existing fragment)
     */
    private async isValidDropLocation(location: Location): Promise<boolean> {
        try {
            const currentUser = firebaseAuthService.getCurrentUser();
            if (!currentUser) return false;

            // Get all active fragments from current user
            const fragmentsRef = collection(db, 'fragments');
            const q = query(
                fragmentsRef,
                where('userId', '==', currentUser.uid),
                where('status', '==', 'active')
            );

            const snapshot = await getDocs(q);

            // Check distance to each existing fragment
            for (const doc of snapshot.docs) {
                const fragment = doc.data() as DroppedFragment;
                const distance = this.calculateDistance(location, {
                    latitude: fragment.latitude,
                    longitude: fragment.longitude,
                });

                if (distance < 0.05) { // 50m = 0.05km
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('[FragmentDrop] Validation error:', error);
            return false;
        }
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * @returns Distance in kilometers
     */
    private calculateDistance(loc1: Location, loc2: Location): number {
        const R = 6371; // Earth's radius in km
        const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
        const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((loc1.latitude * Math.PI) / 180) *
            Math.cos((loc2.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Reset distance counter (for testing)
     */
    reset(): void {
        this.distanceTraveled = 0;
        this.nextDropThreshold = this.generateRandomThreshold();
        this.lastLocation = null;
    }
}

// Export singleton
export const fragmentDropService = new FragmentDropService();
export default fragmentDropService;
