import { databaseService, NearbyUser } from './DatabaseService';
import * as Location from 'expo-location';

// Dummy users for testing geofence collisions
const DUMMY_USERS: Omit<NearbyUser, 'distance'>[] = [
    {
        id: 'dummy_1',
        name: 'Alex',
        age: 26,
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        lastSeen: Date.now(),
        hasInteracted: false,
    },
    {
        id: 'dummy_2',
        name: 'Jordan',
        age: 28,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        lastSeen: Date.now(),
        hasInteracted: false,
    },
];

// Geofence radii for dummy users (in meters)
const DUMMY_GEOFENCES = {
    dummy_1: 100, // 100 meters
    dummy_2: 200, // 200 meters
};

class DummyDataService {
    private userLocation: { lat: number; lng: number } | null = null;

    async initialize(): Promise<void> {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                this.userLocation = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                };
            }
        } catch (error) {
            console.log('[DummyDataService] Could not get location:', error);
        }
    }

    // Calculate random position within a certain distance from user
    private getRandomPositionNearUser(radiusMeters: number): { lat: number; lng: number } {
        if (!this.userLocation) {
            // Default to a random position if no user location
            return { lat: 40.7128, lng: -74.0060 }; // NYC
        }

        // Random angle
        const angle = Math.random() * Math.PI * 2;

        // Random distance within radius
        const distance = Math.random() * radiusMeters;

        // Convert to lat/lng offset (approximate)
        const latOffset = (distance / 111000) * Math.cos(angle); // 111km per degree
        const lngOffset = (distance / (111000 * Math.cos(this.userLocation.lat * Math.PI / 180))) * Math.sin(angle);

        return {
            lat: this.userLocation.lat + latOffset,
            lng: this.userLocation.lng + lngOffset,
        };
    }

    // Calculate distance between two points in meters
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Seed dummy users into database
    async seedDummyUsers(): Promise<void> {
        await this.initialize();
        await databaseService.initialize();

        for (const user of DUMMY_USERS) {
            const geofenceRadius = DUMMY_GEOFENCES[user.id as keyof typeof DUMMY_GEOFENCES] || 150;

            // Position the dummy user at the edge of their geofence
            const dummyPosition = this.getRandomPositionNearUser(geofenceRadius);

            let distance = 0;
            if (this.userLocation) {
                distance = this.calculateDistance(
                    this.userLocation.lat,
                    this.userLocation.lng,
                    dummyPosition.lat,
                    dummyPosition.lng
                );
            }

            const nearbyUser: NearbyUser = {
                ...user,
                distance: Math.round(distance),
                lastSeen: Date.now(),
            };

            await databaseService.saveNearbyUser(nearbyUser);
            console.log(`[DummyDataService] Seeded user ${user.name} at ${Math.round(distance)}m`);
        }
    }

    // Check if user's geofence collides with a dummy user's geofence
    async checkGeofenceCollisions(userGeofenceRadius: number = 50): Promise<NearbyUser[]> {
        const nearbyUsers = await databaseService.getNearbyUsers();
        const collisions: NearbyUser[] = [];

        for (const user of nearbyUsers) {
            const dummyGeofenceRadius = DUMMY_GEOFENCES[user.id as keyof typeof DUMMY_GEOFENCES] || 150;

            // Check if geofences overlap
            // Collision occurs when distance < sum of radii
            if (user.distance < (userGeofenceRadius + dummyGeofenceRadius)) {
                collisions.push(user);
                console.log(`[DummyDataService] Geofence collision with ${user.name}!`);
            }
        }

        return collisions;
    }

    // Update dummy user distances based on current user location
    async updateDistances(): Promise<void> {
        await this.initialize();

        if (!this.userLocation) return;

        const nearbyUsers = await databaseService.getNearbyUsers();

        for (const user of nearbyUsers) {
            // Simulate slight movement (±10m)
            const newDistance = Math.max(10, user.distance + (Math.random() - 0.5) * 20);

            await databaseService.saveNearbyUser({
                ...user,
                distance: Math.round(newDistance),
                lastSeen: Date.now(),
            });
        }
    }

    // Clear all dummy data
    async clearDummyData(): Promise<void> {
        await databaseService.initialize();
        // Clear nearby users
        await databaseService.clearExpiredNearbyUsers(0); // Clear all
        console.log('[DummyDataService] Cleared all dummy data');
    }
}

export const dummyDataService = new DummyDataService();
export default dummyDataService;
