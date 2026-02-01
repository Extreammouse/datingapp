import * as Haptics from 'expo-haptics';
import { locationService } from './LocationService';
import { firestoreFragmentService, PhotoFragment } from './FirestoreFragmentService';

/**
 * Service for detecting when users are near fragments
 */
class FragmentGeofenceService {
    private checkInterval: NodeJS.Timeout | null = null;
    private nearbyFragments: Set<string> = new Set();
    private callbacks: Set<(fragment: PhotoFragment) => void> = new Set();

    /**
     * Start monitoring for nearby fragments
     */
    start(): void {
        if (this.checkInterval) return;

        // Check every 5 seconds
        this.checkInterval = setInterval(async () => {
            await this.checkProximity();
        }, 5000);

        // Initial check
        this.checkProximity();
        console.log('[FragmentGeofence] Started');
    }

    /**
     * Stop monitoring
     */
    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('[FragmentGeofence] Stopped');
        }
    }

    /**
     * Check for nearby fragments (within 50m)
     */
    private async checkProximity(): Promise<void> {
        const coords = locationService.getCoordinates();
        if (!coords) return;

        try {
            // Get fragments within 50m (0.05km)
            const fragments = await firestoreFragmentService.getNearbyFragments(
                coords.latitude,
                coords.longitude,
                0.05
            );

            for (const fragment of fragments) {
                const distance = this.calculateDistance(
                    coords.latitude,
                    coords.longitude,
                    fragment.latitude,
                    fragment.longitude
                );

                // If within 50m and not already notified
                if (distance <= 0.05 && !this.nearbyFragments.has(fragment.id)) {
                    this.triggerProximity(fragment);
                    this.nearbyFragments.add(fragment.id);
                }

                // If moved away (>100m), remove from set
                if (distance > 0.1) {
                    this.nearbyFragments.delete(fragment.id);
                }
            }
        } catch (error) {
            console.error('[FragmentGeofence] Check error:', error);
        }
    }

    /**
     * Trigger proximity event
     */
    private triggerProximity(fragment: PhotoFragment): void {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        this.callbacks.forEach(callback => callback(fragment));
        console.log('[FragmentGeofence] Fragment nearby:', fragment.id);
    }

    /**
     * Register callback for proximity events
     */
    onFragmentProximity(callback: (fragment: PhotoFragment) => void): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Get all fragments for map display
     */
    async getFragmentsForMap(radiusKm: number = 1): Promise<PhotoFragment[]> {
        const coords = locationService.getCoordinates();
        if (!coords) return [];

        return await firestoreFragmentService.getNearbyFragments(
            coords.latitude,
            coords.longitude,
            radiusKm
        );
    }

    /**
     * Calculate distance using Haversine formula
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
        return R * c;
    }
}

export const fragmentGeofenceService = new FragmentGeofenceService();
export default fragmentGeofenceService;
