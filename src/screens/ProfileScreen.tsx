import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Pressable,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
    ArrowLeft,
    Sparkles,
    Gamepad2,
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useResonanceStore } from '../store/useResonanceStore';
import { FragmentOverlay } from '../components/FragmentOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export const ProfileScreen: React.FC<Props> = ({ navigation, route }) => {
    const { userId } = route.params;
    const { nearbyProfiles } = useResonanceStore();

    const user = nearbyProfiles.find(p => p.id === userId);

    const handleBack = () => {
        navigation.goBack();
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ color: COLORS.textPrimary, textAlign: 'center', marginTop: 50 }}>Signal Lost. User not found.</Text>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </Pressable>
            </SafeAreaView>
        );
    }

    const handleChallenge = () => {
        // Navigate to GameGauntlet to start the challenge
        navigation.navigate('GameGauntlet', { partnerId: user.id });
    };

    const collectedCount = user.fragments.filter(f => f.isCollected).length;
    const progress = (collectedCount / 4) * 100;
    const allCollected = collectedCount === 4;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header with Fragment Overlay */}
                <View style={styles.heroContainer}>
                    <FragmentOverlay
                        photoUrl={user.photo}
                        fragments={user.fragments}
                        isUnlocked={user.isUnlocked}
                    />

                    {/* Back button */}
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>

                    {/* Unlocked Badge */}
                    {user.isUnlocked && (
                        <View style={styles.revealedBadge}>
                            <Sparkles size={16} color={COLORS.neonCyan} />
                            <Text style={styles.revealedText}>Connection Active</Text>
                        </View>
                    )}
                </View>

                {/* Profile Info */}
                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>
                            {user.isUnlocked ? user.name : 'Unknown Signal'}
                        </Text>
                        <Text style={styles.distance}>{user.distance}m away</Text>
                    </View>

                    {/* Progress Bar if not all collected */}
                    {!allCollected && (
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressCurrent}>{collectedCount}/4 Shards collected</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                            </View>
                            <Text style={styles.progressHint}>Collect all shards on the map to send a Challenge.</Text>
                        </View>
                    )}

                    {/* Challenge Button - ONLY when all shards collected */}
                    {allCollected && !user.isUnlocked && (
                        <View style={styles.actionsContainer}>
                            <Text style={styles.sectionTitle}>ALL SHARDS COLLECTED</Text>
                            <Pressable style={styles.challengeButton} onPress={handleChallenge}>
                                <Gamepad2 size={24} color={COLORS.background} />
                                <Text style={styles.challengeButtonText}>Send Challenge</Text>
                            </Pressable>
                            <Text style={styles.challengeHint}>
                                Challenge them to a game series. If they accept and you both connect, chat unlocks!
                            </Text>
                        </View>
                    )}

                    {/* Already Connected */}
                    {user.isUnlocked && (
                        <View style={styles.actionsContainer}>
                            <Text style={styles.sectionTitle}>CONNECTION ESTABLISHED</Text>
                            <Pressable
                                style={styles.challengeButton}
                                onPress={() => navigation.navigate('Chat', {
                                    matchId: user.id,
                                    matchName: user.name,
                                    matchImage: user.photo
                                })}
                            >
                                <Gamepad2 size={24} color={COLORS.background} />
                                <Text style={styles.challengeButtonText}>Open Chat</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>
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
        alignItems: 'center',
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.xl,
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
        zIndex: 10,
    },
    revealedBadge: {
        position: 'absolute',
        bottom: SPACING.xl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        zIndex: 10,
        ...SHADOWS.neonCyan,
    },
    revealedText: {
        color: COLORS.neonCyan,
        fontWeight: 'bold',
        fontSize: 12,
    },
    infoContainer: {
        padding: SPACING.lg,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
        paddingBottom: SPACING.md,
    },
    name: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        letterSpacing: 2,
    },
    distance: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginBottom: 6,
    },
    progressContainer: {
        gap: SPACING.sm,
    },
    progressCurrent: {
        color: COLORS.neonCyan,
        fontSize: 14,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 6,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.neonCyan,
    },
    progressHint: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontStyle: 'italic',
    },
    sectionTitle: {
        color: COLORS.textMuted,
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: SPACING.md,
        fontWeight: 'bold',
    },
    actionsContainer: {
        marginTop: SPACING.md,
    },
    hiButton: {
        backgroundColor: COLORS.neonCyan,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
        ...SHADOWS.neonCyan,
    },
    hiButtonText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    secondaryButtonText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    lockedContainer: {
        marginTop: SPACING.xl,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.lg,
        borderStyle: 'dashed',
    },
    lockedText: {
        color: COLORS.textMuted,
        textAlign: 'center',
        fontSize: 14,
        fontStyle: 'italic',
    },
    challengeButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
        ...SHADOWS.medium,
    },
    challengeButtonText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    challengeHint: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default ProfileScreen;
