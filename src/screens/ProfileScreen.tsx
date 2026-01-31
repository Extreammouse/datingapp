import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Image,
    ScrollView,
    Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    MapPin,
    Sparkles,
    Music,
    Coffee,
    Camera,
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// Mock user data
const MOCK_USER = {
    id: '1',
    name: 'Alex',
    age: 26,
    bio: 'Adventure seeker and coffee enthusiast. Love hiking in the mountains and discovering new coffee shops. Dog mom to a golden retriever named Luna. 🏔️☕🐕',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    location: 'San Francisco, CA',
    interests: [
        { icon: Music, label: 'Live Music' },
        { icon: Coffee, label: 'Coffee' },
        { icon: Camera, label: 'Photography' },
    ],
    bioTags: [
        { id: '1', label: 'Likes Hiking', icon: '🏔️' },
        { id: '2', label: 'Coffee Lover', icon: '☕' },
        { id: '3', label: 'Dog Person', icon: '🐕' },
    ],
    photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=400',
        'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400',
    ],
};

export const ProfileScreen: React.FC<Props> = ({ navigation, route }) => {
    const { userId, revealed } = route.params;

    const handleBack = () => {
        navigation.popToTop();
    };

    const handleConnect = () => {
        // In production: send connection request
        console.log('Connection request sent to:', userId);
    };

    const handleMessage = () => {
        // In production: navigate to chat
        console.log('Opening chat with:', userId);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header image */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: MOCK_USER.profileImage }}
                        style={styles.heroImage}
                    />
                    {!revealed && (
                        <BlurView
                            intensity={40}
                            style={StyleSheet.absoluteFill}
                            tint="dark"
                        />
                    )}

                    {/* Back button */}
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>

                    {/* Revealed badge */}
                    {revealed && (
                        <View style={styles.revealedBadge}>
                            <Sparkles size={16} color={COLORS.neonCyan} />
                            <Text style={styles.revealedText}>Profile Unlocked!</Text>
                        </View>
                    )}
                </View>

                {/* Profile info */}
                <View style={styles.infoContainer}>
                    {/* Name and age */}
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>
                            {revealed ? MOCK_USER.name : '???'}, {MOCK_USER.age}
                        </Text>
                        <View style={styles.verifiedBadge}>
                            <Sparkles size={14} color={COLORS.neonCyan} />
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.locationRow}>
                        <MapPin size={16} color={COLORS.textSecondary} />
                        <Text style={styles.location}>
                            {revealed ? MOCK_USER.location : 'Location hidden'}
                        </Text>
                    </View>

                    {/* Bio tags revealed */}
                    <View style={styles.tagsContainer}>
                        {MOCK_USER.bioTags.map((tag) => (
                            <View
                                key={tag.id}
                                style={[
                                    styles.tag,
                                    revealed && styles.tagRevealed,
                                ]}
                            >
                                <Text style={styles.tagIcon}>{revealed ? tag.icon : '?'}</Text>
                                <Text style={styles.tagLabel}>
                                    {revealed ? tag.label : '???'}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Bio */}
                    <View style={styles.bioContainer}>
                        <Text style={styles.sectionTitle}>About</Text>
                        {revealed ? (
                            <Text style={styles.bio}>{MOCK_USER.bio}</Text>
                        ) : (
                            <View style={styles.bioBlurred}>
                                <Text style={styles.bioBlurredText}>
                                    Play games to unlock their story...
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Interests */}
                    {revealed && (
                        <View style={styles.interestsContainer}>
                            <Text style={styles.sectionTitle}>Interests</Text>
                            <View style={styles.interestsRow}>
                                {MOCK_USER.interests.map((interest, index) => (
                                    <View key={index} style={styles.interestBadge}>
                                        <interest.icon size={18} color={COLORS.neonCyan} />
                                        <Text style={styles.interestLabel}>{interest.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Photo grid */}
                    {revealed && (
                        <View style={styles.photosContainer}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <View style={styles.photoGrid}>
                                {MOCK_USER.photos.map((photo, index) => (
                                    <Image
                                        key={index}
                                        source={{ uri: photo }}
                                        style={styles.gridPhoto}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Action buttons */}
            {revealed && (
                <View style={styles.actionBar}>
                    <Pressable style={styles.actionButton} onPress={handleMessage}>
                        <MessageCircle size={24} color={COLORS.textPrimary} />
                        <Text style={styles.actionButtonText}>Message</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionButton, styles.connectButton]}
                        onPress={handleConnect}
                    >
                        <Heart size={24} color={COLORS.background} />
                        <Text style={[styles.actionButtonText, styles.connectButtonText]}>
                            Connect
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Not revealed CTA */}
            {!revealed && (
                <View style={styles.notRevealedBar}>
                    <Text style={styles.notRevealedText}>
                        Complete more games to fully reveal this profile
                    </Text>
                    <Pressable style={styles.playAgainButton} onPress={handleBack}>
                        <Text style={styles.playAgainText}>Play Again</Text>
                    </Pressable>
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
    scrollView: {
        flex: 1,
    },
    heroContainer: {
        height: 400,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: SPACING.lg,
        left: SPACING.lg,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surfaceGlass,
        justifyContent: 'center',
        alignItems: 'center',
    },
    revealedBadge: {
        position: 'absolute',
        bottom: SPACING.lg,
        right: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.surfaceGlass,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    revealedText: {
        color: COLORS.neonCyan,
        fontSize: 14,
        fontWeight: '600',
    },
    infoContainer: {
        padding: SPACING.lg,
        marginTop: -SPACING.xl,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    verifiedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.xs,
    },
    location: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    tagRevealed: {
        borderColor: COLORS.neonCyanDim,
    },
    tagIcon: {
        fontSize: 16,
    },
    tagLabel: {
        color: COLORS.textPrimary,
        fontSize: 14,
    },
    bioContainer: {
        marginTop: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    bio: {
        color: COLORS.textSecondary,
        fontSize: 16,
        lineHeight: 24,
    },
    bioBlurred: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        borderStyle: 'dashed',
    },
    bioBlurredText: {
        color: COLORS.textMuted,
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    interestsContainer: {
        marginTop: SPACING.xl,
    },
    interestsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    interestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
    },
    interestLabel: {
        color: COLORS.textPrimary,
        fontSize: 14,
    },
    photosContainer: {
        marginTop: SPACING.xl,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    gridPhoto: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: BORDER_RADIUS.md,
    },
    actionBar: {
        flexDirection: 'row',
        gap: SPACING.md,
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surfaceLight,
    },
    actionButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    connectButton: {
        backgroundColor: COLORS.neonCyan,
    },
    connectButtonText: {
        color: COLORS.background,
    },
    notRevealedBar: {
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight,
        alignItems: 'center',
        gap: SPACING.md,
    },
    notRevealedText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    playAgainButton: {
        backgroundColor: COLORS.electricMagenta,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
    },
    playAgainText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;
