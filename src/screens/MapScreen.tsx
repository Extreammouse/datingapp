import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
    Image,
    Switch,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline, Circle } from 'react-native-maps';
import { useResonanceStore } from '../store/useResonanceStore';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../constants/theme';
import { Fragment, ResonanceProfile } from '../types';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { Navigation, Gamepad2, User, Camera, Music, Hash, Zap } from 'lucide-react-native';
import { PhotoFragment } from '../services/FirestoreFragmentService';
import { fragmentGeofenceService } from '../services/FragmentGeofenceService';
import { FragmentCollectionModal } from './FragmentCollectionModal';
import { DemoModeToggle } from '../components/DemoModeToggle';
import { firestoreFragmentService } from '../services/FirestoreFragmentService';
import { locationService } from '../services/LocationService';
import { fragmentDropService } from '../services/FragmentDropService';



const INITIAL_REGION = {
    latitude: 42.3601,
    longitude: -71.0589,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
};

// Mock user path (Trail)
const MOCK_PATH = [
    { latitude: 42.3601, longitude: -71.0589 },
    { latitude: 42.3605, longitude: -71.0585 },
    { latitude: 42.3610, longitude: -71.0582 },
    { latitude: 42.3615, longitude: -71.0580 },
    { latitude: 42.3620, longitude: -71.0575 },
];

// Fragment Marker Component (Photo Shard)
const FragmentMarker = ({ fragment, profilePhoto, onPress }: { fragment: Fragment; profilePhoto: string; onPress: () => void }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Marker
            coordinate={fragment.coordinate}
            onPress={onPress}
            opacity={fragment.isCollected ? 0.4 : 1}
        >
            <Animated.View style={[styles.shardContainer, animatedStyle]}>
                <View style={[styles.shardOuter, fragment.isCollected && styles.shardCollected]}>
                    <Image
                        source={{ uri: profilePhoto }}
                        style={styles.shardImage}
                        blurRadius={fragment.isCollected ? 0 : 5} // Blurred until collected? Or logic reversed based on user request "blurred until collected"
                    />
                    {/* Overlay Icon */}
                    <View style={styles.shardIconOverlay}>
                        {getFragmentIcon(fragment.type)}
                    </View>
                </View>
            </Animated.View>
        </Marker>
    );
};

const getFragmentIcon = (type: string) => {
    switch (type) {
        case 'interest': return <Music size={12} color={COLORS.background} />;
        case 'tag': return <Hash size={12} color={COLORS.background} />;
        case 'name': return <User size={12} color={COLORS.background} />;
        default: return <Zap size={12} color={COLORS.background} />;
    }
};

export const MapScreen: React.FC = ({ navigation }: any) => {
    const { nearbyProfiles, setActiveGameFragment, collectFragment } = useResonanceStore();
    const [loading, setLoading] = useState(true);
    const [userLoc, setUserLoc] = useState(INITIAL_REGION);

    // Demo mode toggle
    const [isDemoMode, setIsDemoMode] = useState(true);
    const [realFragments, setRealFragments] = useState<PhotoFragment[]>([]);
    const [selectedFragment, setSelectedFragment] = useState<PhotoFragment | null>(null);
    const [showCollectionModal, setShowCollectionModal] = useState(false);

    // Simulate walking (DEMO MODE ONLY)
    useEffect(() => {
        setTimeout(() => setLoading(false), 1500);

        if (isDemoMode) {
            let pathIndex = 0;
            const interval = setInterval(() => {
                if (pathIndex < MOCK_PATH.length) {
                    const nextPoint = MOCK_PATH[pathIndex];
                    setUserLoc(prev => ({ ...prev, latitude: nextPoint.latitude, longitude: nextPoint.longitude }));
                    pathIndex = (pathIndex + 1) % MOCK_PATH.length;
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isDemoMode]);


    // Load real fragments when not in demo mode
    useEffect(() => {
        const loadRealFragments = async () => {
            try {
                const fragments = await fragmentGeofenceService.getFragmentsForMap(1);
                setRealFragments(fragments);
                console.log(`[MapScreen] Loaded ${fragments.length} real fragments`);
            } catch (error) {
                console.error("[MapScreen] Error loading fragments:", error);
            }
        };

        if (!isDemoMode) {
            // Start real location tracking
            locationService.startTracking();
            locationService.getCurrentLocation().then(loc => {
                if (loc) {
                    setUserLoc({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    });
                }
            });

            loadRealFragments();
            fragmentGeofenceService.start();

            return () => {
                fragmentGeofenceService.stop();
            };
        }
    }, [isDemoMode]);


    const handleFragmentPress = (profile: ResonanceProfile, fragment: Fragment) => {
        // Simple geofence check (mock)
        const distance = Math.sqrt(
            Math.pow(fragment.coordinate.latitude - userLoc.latitude, 2) +
            Math.pow(fragment.coordinate.longitude - userLoc.longitude, 2)
        );

        // Allowed distance (approx 0.001 degrees ~ 100m)
        const MAX_DIST = 0.002;

        if (distance > MAX_DIST && !fragment.isCollected && !profile.isUnlocked) {
            Alert.alert('Out of Range', 'Move closer to the fragment to analyze signal.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (fragment.isCollected || profile.isUnlocked) {
            navigation.navigate('MyProfile', { userId: profile.id, revealed: profile.isUnlocked }); // Temp nav to profile
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setActiveGameFragment(fragment);

        Alert.alert(
            'Signal Intercepted',
            'Decrypt this shard to collect data.',
            [
                { text: 'Ignore', style: 'cancel' },
                {
                    text: 'INITIALIZE',
                    onPress: () => {
                        // Collect fragment immediately for progress sync
                        collectFragment(profile.id, fragment.id);

                        // Navigate to game for additional rewards/validation
                        navigation.navigate('GameSelection', {
                            partnerId: profile.id,
                            fragmentId: fragment.id
                        });
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.neonCyan} />
                <Text style={styles.loadingText}>Triangulating Resonance Signals...</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={INITIAL_REGION}
                region={userLoc}
                customMapStyle={DARK_MAP_STYLE}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {/* User Marker (Self) */}
                <Marker coordinate={userLoc}>
                    <View style={styles.userMarkerOut}>
                        <View style={styles.userMarkerIn} />
                    </View>
                </Marker>

                {/* Geofence Circle - 50m Collection Radius */}
                <Circle
                    center={userLoc}
                    radius={50}
                    strokeColor="rgba(0, 255, 255, 0.5)"
                    fillColor="rgba(0, 255, 255, 0.1)"
                    strokeWidth={2}
                />


                {/* Trail Logic - Show where "User" has been (Mock) */}
                <Polyline
                    coordinates={MOCK_PATH}
                    strokeColor={COLORS.neonCyan}
                    strokeWidth={2}
                    lineDashPattern={[5, 5]}
                />

                {nearbyProfiles.map((profile) => (
                    profile.fragments.map((fragment) => (
                        <FragmentMarker
                            key={fragment.id}
                            fragment={fragment}
                            profilePhoto={profile.photo}
                            onPress={() => handleFragmentPress(profile, fragment)}
                        />
                    ))
                ))}
            </MapView>

            <View style={styles.headerOverlay}>
                <View style={styles.headerBlur}>
                    <Text style={styles.headerTitle}>EXPLORE</Text>
                    <View style={styles.signalBadge}>
                        <Zap size={12} color={COLORS.background} fill={COLORS.background} />
                        <Text style={styles.signalText}>{nearbyProfiles.length} SIGNALS DETECTED</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footerOverlay}>
                <Text style={styles.footerText}>Walk near fragments to collect shards.</Text>
            </View>

            {/* Demo Mode Toggle */}
            <DemoModeToggle
                isDemoMode={isDemoMode}
                onToggle={setIsDemoMode}
            />

        </View>
    );
};

const DARK_MAP_STYLE = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#121212" }]
    },
    {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#2c2c2c" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }]
    }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 50,
        left: 20,
    },
    headerBlur: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.neonCyan,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.textPrimary,
        letterSpacing: 2,
    },
    signalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.neonCyan,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        alignSelf: 'flex-start',
        gap: 4,
    },
    signalText: {
        color: COLORS.background,
        fontSize: 10,
        fontWeight: 'bold',
    },
    loadingText: {
        color: COLORS.neonCyan,
        marginTop: SPACING.md,
        letterSpacing: 1,
    },
    shardContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shardOuter: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        backgroundColor: COLORS.surface,
        ...SHADOWS.neonCyan,
    },
    shardCollected: {
        borderColor: COLORS.success,
        opacity: 0.8,
    },
    shardImage: {
        width: '100%',
        height: '100%',
    },
    shardIconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.neonCyan,
        borderTopLeftRadius: 8,
        padding: 2,
    },
    userMarkerOut: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 0, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.electricMagenta,
    },
    userMarkerIn: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.electricMagenta,
    },
    footerOverlay: {
        position: 'absolute',
        bottom: 110, // Above Tab Bar
        alignSelf: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: 'rgba(10,10,10,0.8)',
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        letterSpacing: 1,
    }
});

export default MapScreen;
