import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Pressable,
    Image,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    runOnJS,
    interpolateColor,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Zap, Heart, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, ANIMATION, GAME } from '../../constants/theme';
import { BioTag } from '../../types';
import socketService from '../../services/SocketService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CORD_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const KNOT_SIZE = 60;

interface TugOfWarProps {
    roomId: string;
    partnerId: string;
    partnerImage?: string;
    bioTags: BioTag[];
    userGender?: 'male' | 'female' | 'other';
    onGameComplete: (won: boolean, revealedTags: BioTag[]) => void;
    onOpenChat?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TugOfWar: React.FC<TugOfWarProps> = ({
    roomId,
    partnerId,
    partnerImage,
    bioTags,
    userGender = 'other',
    onGameComplete,
    onOpenChat,
}) => {
    // Cord position: -1 (you win) to 1 (partner wins), 0 is center
    const cordPosition = useSharedValue(0);
    const knotScale = useSharedValue(1);
    const leftButtonScale = useSharedValue(1);
    const rightButtonScale = useSharedValue(1);

    const [revealedTags, setRevealedTags] = useState<BioTag[]>([]);
    const [milestoneReached, setMilestoneReached] = useState<number[]>([]);
    const [gameEnded, setGameEnded] = useState(false);
    const [selectedDirection, setSelectedDirection] = useState<'left' | 'right' | null>(
        userGender === 'male' ? 'left' : userGender === 'female' ? 'right' : null
    );

    // Determine pull direction based on gender:
    // Male = left (pulling opponent towards them from right)
    // Female = right (pulling opponent towards them from left)
    // Other = user chooses
    const pullDirection = selectedDirection;

    // Track which milestones have been triggered
    const checkMilestones = useCallback((position: number) => {
        const progress = Math.abs(position);
        const milestones = GAME.tugOfWar.milestones;

        milestones.forEach((milestone, index) => {
            if (progress >= milestone && !milestoneReached.includes(index)) {
                // Trigger heavy haptic
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

                // Reveal bio tag
                if (bioTags[index] && !revealedTags.find(t => t.id === bioTags[index].id)) {
                    const newTag = { ...bioTags[index], revealed: true };
                    setRevealedTags(prev => [...prev, newTag]);
                }

                setMilestoneReached(prev => [...prev, index]);
            }
        });

        // Check for win condition
        if (Math.abs(position) >= 1 && !gameEnded) {
            setGameEnded(true);
            const won = position < 0; // Negative means you pulled to your side
            Haptics.notificationAsync(
                won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
            );
            onGameComplete(won, revealedTags);
        }
    }, [milestoneReached, bioTags, revealedTags, gameEnded, onGameComplete]);

    // Handle socket events
    useEffect(() => {
        socketService.joinRoom(roomId);

        const unsubCord = socketService.onCordUpdate((data) => {
            cordPosition.value = withSpring(data.cordPosition, ANIMATION.spring);
            runOnJS(checkMilestones)(data.cordPosition);
        });

        const unsubTag = socketService.onBioTagReveal((tag) => {
            setRevealedTags(prev => [...prev, tag]);
        });

        return () => {
            unsubCord();
            unsubTag();
            socketService.leaveRoom();
        };
    }, [roomId]);

    // Handle tug action
    const handleTug = useCallback((direction: 'left' | 'right') => {
        if (gameEnded) return;

        // Light haptic feedback for tap
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Animate button press
        const buttonScale = direction === 'left' ? leftButtonScale : rightButtonScale;
        buttonScale.value = withSequence(
            withTiming(0.9, { duration: 50 }),
            withSpring(1, ANIMATION.springBouncy)
        );

        // Animate knot pulse
        knotScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1, ANIMATION.spring)
        );

        // Send to server
        socketService.sendTug(direction, 1);

        // Local preview (will be corrected by server)
        const delta = direction === 'left' ? -0.05 : 0.05;
        const newPosition = Math.max(-1, Math.min(1, cordPosition.value + delta));
        cordPosition.value = withSpring(newPosition, ANIMATION.spring);
        checkMilestones(newPosition);
    }, [gameEnded, checkMilestones]);

    // Animated styles
    const cordAnimatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            cordPosition.value,
            [-1, 0, 1],
            [COLORS.neonCyan, COLORS.cordDefault, COLORS.electricMagenta]
        );

        return {
            backgroundColor,
        };
    });

    const knotAnimatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            cordPosition.value,
            [-1, 1],
            [-CORD_WIDTH / 2 + KNOT_SIZE / 2, CORD_WIDTH / 2 - KNOT_SIZE / 2],
            Extrapolation.CLAMP
        );

        const backgroundColor = interpolateColor(
            cordPosition.value,
            [-1, 0, 1],
            [COLORS.neonCyan, COLORS.textPrimary, COLORS.electricMagenta]
        );

        return {
            transform: [
                { translateX },
                { scale: knotScale.value },
            ],
            backgroundColor,
        };
    });

    const leftButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: leftButtonScale.value }],
    }));

    const rightButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rightButtonScale.value }],
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => {
        const glowOpacity = interpolate(
            Math.abs(cordPosition.value),
            [0, 0.3, 0.6, 0.9, 1],
            [0, 0.3, 0.5, 0.8, 1],
            Extrapolation.CLAMP
        );

        return {
            opacity: glowOpacity,
        };
    });

    return (
        <View style={styles.container}>
            {/* Partner preview with blur */}
            <View style={styles.partnerPreview}>
                {partnerImage && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: partnerImage }}
                            style={styles.partnerImage}
                        />
                        <BlurView
                            intensity={revealedTags.length >= 3 ? 0 : 80 - revealedTags.length * 20}
                            style={StyleSheet.absoluteFill}
                            tint="dark"
                        />
                    </View>
                )}
            </View>

            {/* Revealed Bio Tags */}
            <View style={styles.tagsContainer}>
                {revealedTags.map((tag) => (
                    <Animated.View
                        key={tag.id}
                        style={styles.tagBadge}
                    >
                        <Heart size={14} color={COLORS.electricMagenta} />
                        <Text style={styles.tagText}>{tag.label}</Text>
                    </Animated.View>
                ))}
            </View>

            {/* Game instruction */}
            <Text style={styles.instruction}>
                Tap rapidly to pull the knot to your side!
            </Text>

            {/* Cord visualization */}
            <View style={styles.cordContainer}>
                {/* Glow effect */}
                <Animated.View style={[styles.cordGlow, glowAnimatedStyle]} />

                {/* The cord */}
                <Animated.View style={[styles.cord, cordAnimatedStyle]} />

                {/* Center marker */}
                <View style={styles.centerMarker} />

                {/* Milestone markers */}
                {GAME.tugOfWar.milestones.map((milestone, index) => (
                    <React.Fragment key={index}>
                        <View
                            style={[
                                styles.milestoneMarker,
                                { left: `${(0.5 - milestone / 2) * 100}%` },
                                milestoneReached.includes(index) && styles.milestoneReached,
                            ]}
                        />
                        <View
                            style={[
                                styles.milestoneMarker,
                                { left: `${(0.5 + milestone / 2) * 100}%` },
                                milestoneReached.includes(index) && styles.milestoneReached,
                            ]}
                        />
                    </React.Fragment>
                ))}

                {/* The knot */}
                <Animated.View style={[styles.knot, knotAnimatedStyle]}>
                    <Zap size={24} color={COLORS.background} />
                </Animated.View>
            </View>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    Tags Revealed: {revealedTags.length}/{bioTags.length}
                </Text>
            </View>

            {/* Single Pull Button - Tap rapidly to pull them towards you */}
            <AnimatedPressable
                style={[styles.pullButton, leftButtonAnimatedStyle]}
                onPress={() => handleTug('left')}
                disabled={gameEnded}
            >
                <View style={styles.pullButtonInner}>
                    <ChevronLeft size={40} color={COLORS.neonCyan} />
                    <ChevronLeft size={40} color={COLORS.neonCyan} style={styles.doubleArrowLarge} />
                    <Text style={styles.pullButtonText}>PULL</Text>
                </View>
                <Text style={styles.pullHint}>Tap rapidly to pull them to you!</Text>
            </AnimatedPressable>

            {/* Game ended overlay with Open Chat button */}
            {gameEnded && (
                <View style={styles.overlay}>
                    <Text style={styles.overlayText}>
                        {cordPosition.value < 0 ? '🎉 You Won!' : 'They Won!'}
                    </Text>
                    <Text style={styles.overlaySubtext}>
                        {revealedTags.length} tags revealed
                    </Text>
                    <Pressable
                        style={styles.connectButton}
                        onPress={() => {
                            onGameComplete(cordPosition.value < 0, revealedTags);
                            if (onOpenChat) onOpenChat();
                        }}
                    >
                        <MessageCircle size={20} color={COLORS.background} />
                        <Text style={styles.connectButtonText}>Open Chat</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.xxl,
    },
    partnerPreview: {
        width: 120,
        height: 120,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: COLORS.electricMagenta,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    partnerImage: {
        width: '100%',
        height: '100%',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        minHeight: 40,
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.electricMagentaDim,
    },
    tagText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    instruction: {
        color: COLORS.textSecondary,
        fontSize: 16,
        textAlign: 'center',
    },
    cordContainer: {
        width: CORD_WIDTH,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cordGlow: {
        position: 'absolute',
        width: '100%',
        height: 20,
        backgroundColor: COLORS.neonCyanDim,
        borderRadius: 10,
    },
    cord: {
        width: '100%',
        height: 8,
        borderRadius: 4,
    },
    centerMarker: {
        position: 'absolute',
        width: 4,
        height: 24,
        backgroundColor: COLORS.textMuted,
        borderRadius: 2,
    },
    milestoneMarker: {
        position: 'absolute',
        width: 2,
        height: 16,
        backgroundColor: COLORS.textMuted,
        borderRadius: 1,
        transform: [{ translateX: -1 }],
    },
    milestoneReached: {
        backgroundColor: COLORS.success,
        height: 20,
    },
    knot: {
        position: 'absolute',
        width: KNOT_SIZE,
        height: KNOT_SIZE,
        borderRadius: KNOT_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...COLORS.neonCyan && {
            shadowColor: COLORS.neonCyan,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 10,
        },
    },
    progressContainer: {
        paddingVertical: SPACING.md,
    },
    progressText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.xxl,
        paddingHorizontal: SPACING.lg,
    },
    tugButton: {
        width: 100,
        height: 100,
        borderRadius: BORDER_RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 2,
    },
    leftButton: {
        borderColor: COLORS.neonCyan,
    },
    rightButton: {
        borderColor: COLORS.electricMagenta,
    },
    doubleArrow: {
        marginLeft: -20,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: SPACING.xs,
    },
    // New single pull button styles
    pullButton: {
        width: 180,
        height: 120,
        borderRadius: BORDER_RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
    },
    pullButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    doubleArrowLarge: {
        marginLeft: -24,
    },
    pullButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.neonCyan,
        marginLeft: SPACING.sm,
    },
    pullHint: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: SPACING.sm,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    overlayText: {
        color: COLORS.textPrimary,
        fontSize: 32,
        fontWeight: 'bold',
    },
    overlaySubtext: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    connectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.electricMagenta,
        borderRadius: BORDER_RADIUS.full,
        marginTop: SPACING.lg,
    },
    connectButtonText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default TugOfWar;
