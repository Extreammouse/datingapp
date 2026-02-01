import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Haptics from 'expo-haptics';
import { GAME, COLORS } from '../constants/theme';
import { firestoreFragmentService, PhotoFragment } from './FirestoreFragmentService';

const LOCATION_TASK_NAME = 'resonance-background-location';

interface UserLocation {
    userId: string;
    latitude: number;
    longitude: number;
    timestamp: number;
}

class LocationService {
    private isTracking: boolean = false;
    private currentLocation: Location.LocationObject | null = null;
    private nearbyUsers: UserLocation[] = [];
    private proximityCallbacks: Set<(userId: string, distance: number) => void> = new Set();
    private fragmentProximityCallbacks: Set<(fragment: PhotoFragment) => void> = new Set();
    private nearbyFragments: Set<string> = new Set(); // Track which fragments we've already notified about
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private fragmentCheckInterval: NodeJS.Timeout | null = null;

    /**
     * Initialize location service and request permissions
     */
    async initialize(): Promise<boolean> {
        try {
            // Request foreground permissions
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus !== 'granted') {
                console.log('[LocationService] Foreground permission denied');
                return false;
            }

            // Request background permissions
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus !== 'granted') {
                console.log('[LocationService] Background permission denied');
                // Continue without background tracking
            }

            console.log('[LocationService] Permissions granted');
            return true;
        } catch (error) {
            console.error('[LocationService] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Start tracking location
     */
    async startTracking(): Promise<void> {
        if (this.isTracking) return;

        try {
            // Check if location services are enabled
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                console.log('[LocationService] Location services disabled');
                return;
            }

            // Get initial location
            this.currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            // Start background location updates
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.High,
                distanceInterval: 5, // Update every 5 meters
                timeInterval: 5000, // Or every 5 seconds
                foregroundService: {
                    notificationTitle: 'Resonance',
                    notificationBody: 'Finding connections nearby...',
                    notificationColor: COLORS.neonCyan,
                },
                pausesUpdatesAutomatically: false,
                activityType: Location.ActivityType.Other,
            });

            this.isTracking = true;
            console.log('[LocationService] Tracking started');
        } catch (error) {
            console.error('[LocationService] Failed to start tracking:', error);
        }
    }

    /**
     * Stop tracking location
     */
    async stopTracking(): Promise<void> {
        if (!this.isTracking) return;

        try {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
            if (isRegistered) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }

            this.stopHeartbeat();
            this.isTracking = false;
            console.log('[LocationService] Tracking stopped');
        } catch (error) {
            console.error('[LocationService] Failed to stop tracking:', error);
        }
    }

    /**
     * Get current location
     */
    async getCurrentLocation(): Promise<Location.LocationObject | null> {
        try {
            this.currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            return this.currentLocation;
        } catch (error) {
            console.error('[LocationService] Failed to get current location:', error);
            return null;
        }
    }

    /**
     * Update nearby users (called from server sync)
     */
    updateNearbyUsers(users: UserLocation[]): void {
        this.nearbyUsers = users;
        this.checkProximity();
    }

    /**
     * Check proximity to all nearby users
     */
    private checkProximity(): void {
        if (!this.currentLocation) return;

        const { latitude, longitude } = this.currentLocation.coords;

        for (const user of this.nearbyUsers) {
            const distance = this.calculateDistance(
                latitude,
                longitude,
                user.latitude,
                user.longitude
            );

            // If within threshold, trigger proximity event
            if (distance <= GAME.proximity.thresholdMeters) {
                this.triggerProximityEvent(user.userId, distance);
            }
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
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Trigger proximity event
     */
    private triggerProximityEvent(userId: string, distance: number): void {
        console.log(`[LocationService] User ${userId} is ${distance.toFixed(1)}m away!`);

        // Start heartbeat haptic pattern
        this.startHeartbeat();

        // Notify all listeners
        this.proximityCallbacks.forEach((callback) => {
            callback(userId, distance);
        });
    }

    /**
     * Start heartbeat haptic pattern
     */
    private startHeartbeat(): void {
        if (this.heartbeatInterval) return;

        // Heartbeat pattern: [0, 200, 100, 200]
        // 0ms: start
        // 200ms: first beat
        // 100ms: pause
        // 200ms: second beat
        const pattern = GAME.tugOfWar.hapticPattern;
        let index = 0;

        const playBeat = () => {
            if (index === 0 || index === 2) {
                // Pause durations
                index++;
                setTimeout(playBeat, pattern[index]);
            } else if (index === 1 || index === 3) {
                // Beat durations - trigger haptic
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                index = (index + 1) % pattern.length;

                if (index === 0) {
                    // End of pattern, wait before repeating
                    setTimeout(playBeat, 500);
                } else {
                    setTimeout(playBeat, pattern[index]);
                }
            }
        };

        // Start the heartbeat
        this.heartbeatInterval = setInterval(() => {
            // Check if still in proximity
            this.checkProximity();
        }, 2000);

        // Initial beat
        playBeat();
        console.log('[LocationService] Heartbeat started');
    }

    /**
     * Stop heartbeat haptic pattern
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            console.log('[LocationService] Heartbeat stopped');
        }
    }

    /**
     * Subscribe to proximity events
     */
    onProximity(callback: (userId: string, distance: number) => void): () => void {
        this.proximityCallbacks.add(callback);
        return () => {
            this.proximityCallbacks.delete(callback);
        };
    }

    /**
     * Check if currently tracking
     */
    isCurrentlyTracking(): boolean {
        return this.isTracking;
    }

    /**
     * Get current coordinates
     */
    getCoordinates(): { latitude: number; longitude: number } | null {
        if (!this.currentLocation) return null;
        return {
            latitude: this.currentLocation.coords.latitude,
            longitude: this.currentLocation.coords.longitude,
        };
    }
}

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('[LocationTask] Error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const lastLocation = locations[locations.length - 1];

        if (lastLocation) {
            // Update the singleton instance (note: this is a simplified approach)
            // In production, you'd want to use a more robust state management solution
            locationService['currentLocation'] = lastLocation;
            locationService['checkProximity']();
        }
    }
});

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
