import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { MapPin, Users, Radar } from 'lucide-react-native';
import * as Location from 'expo-location';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { databaseService, NearbyUser } from '../services/DatabaseService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simple map representation (no actual map library needed for MVP)
export const MapScreen: React.FC = () => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        initializeMap();
    }, []);

    const initializeMap = async () => {
        try {
            // Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Location permission denied');
                setLoading(false);
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            });

            // Load nearby users from database
            await databaseService.initialize();
            const users = await databaseService.getNearbyUsers();
            setNearbyUsers(users);
        } catch (error) {
            console.error('Failed to initialize map:', error);
            setErrorMsg('Failed to get location');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.neonCyan} />
                    <Text style={styles.loadingText}>Finding your location...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (errorMsg) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MapPin size={60} color={COLORS.textMuted} />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                    <Text style={styles.errorSubtext}>
                        Enable location access in Settings to find matches nearby
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Radar size={24} color={COLORS.neonCyan} />
                <Text style={styles.headerTitle}>Nearby</Text>
            </View>

            {/* Simple Map View */}
            <View style={styles.mapContainer}>
                {/* Map background */}
                <View style={styles.mapBackground}>
                    {/* Grid lines for visual effect */}
                    {Array.from({ length: 10 }).map((_, i) => (
                        <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineHorizontal, { top: `${i * 10}%` }]} />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                        <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineVertical, { left: `${i * 10}%` }]} />
                    ))}

                    {/* User's location (center) */}
                    <View style={styles.userMarker}>
                        <View style={styles.userMarkerPulse} />
                        <View style={styles.userMarkerDot} />
                        <Text style={styles.youLabel}>You</Text>
                    </View>

                    {/* Nearby users */}
                    {nearbyUsers.map((user, index) => {
                        // Position users in a circle around center
                        const angle = (index / nearbyUsers.length) * Math.PI * 2;
                        const distance = 80 + (user.distance / 10);
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;

                        return (
                            <View
                                key={user.id}
                                style={[
                                    styles.nearbyUserMarker,
                                    {
                                        transform: [{ translateX: x }, { translateY: y }],
                                    },
                                ]}
                            >
                                <View style={styles.nearbyUserDot} />
                                <Text style={styles.nearbyUserName}>{user.name}</Text>
                                <Text style={styles.nearbyUserDistance}>{Math.round(user.distance)}m</Text>
                            </View>
                        );
                    })}
                </View>

                {/* No matches message */}
                {nearbyUsers.length === 0 && (
                    <View style={styles.noMatchesOverlay}>
                        <Users size={40} color={COLORS.textMuted} />
                        <Text style={styles.noMatchesText}>No one nearby yet</Text>
                        <Text style={styles.noMatchesSubtext}>
                            Keep exploring! Matches appear when your paths cross.
                        </Text>
                    </View>
                )}
            </View>

            {/* Location info */}
            {userLocation && (
                <View style={styles.locationInfo}>
                    <MapPin size={16} color={COLORS.neonCyan} />
                    <Text style={styles.locationText}>
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        gap: SPACING.md,
    },
    errorText: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '600',
    },
    errorSubtext: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    mapContainer: {
        flex: 1,
        margin: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
    },
    mapBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    gridLine: {
        position: 'absolute',
        backgroundColor: COLORS.surfaceLight,
    },
    gridLineHorizontal: {
        left: 0,
        right: 0,
        height: 1,
    },
    gridLineVertical: {
        top: 0,
        bottom: 0,
        width: 1,
    },
    userMarker: {
        alignItems: 'center',
        zIndex: 10,
    },
    userMarkerPulse: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.neonCyanDim,
        opacity: 0.3,
    },
    userMarkerDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.neonCyan,
        borderWidth: 3,
        borderColor: COLORS.background,
    },
    youLabel: {
        color: COLORS.neonCyan,
        fontSize: 12,
        fontWeight: '600',
        marginTop: SPACING.xs,
    },
    nearbyUserMarker: {
        position: 'absolute',
        alignItems: 'center',
    },
    nearbyUserDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.electricMagenta,
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    nearbyUserName: {
        color: COLORS.textPrimary,
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    nearbyUserDistance: {
        color: COLORS.textMuted,
        fontSize: 10,
    },
    noMatchesOverlay: {
        position: 'absolute',
        bottom: SPACING.xl,
        left: SPACING.lg,
        right: SPACING.lg,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        alignItems: 'center',
        gap: SPACING.sm,
    },
    noMatchesText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    noMatchesSubtext: {
        color: COLORS.textSecondary,
        fontSize: 13,
        textAlign: 'center',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.md,
        marginBottom: 80, // Account for tab bar
    },
    locationText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
});

export default MapScreen;
