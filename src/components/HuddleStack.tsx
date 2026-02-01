import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    Pressable,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
    runOnJS,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Heart, Sparkles, Play } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, ANIMATION, SHADOWS } from '../constants/theme';
import { User, GameType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const VISIBLE_CARDS = 3;

interface HuddleStackProps {
    users: User[];
    onStartGame: (user: User, gameType: GameType) => void;
    onSwipe: (user: User, direction: 'left' | 'right') => void;
}

interface CardProps {
    user: User;
    index: number;
    totalCards: number;
    isTop: boolean;
    translateX: { value: number };
    onStartGame: (gameType: GameType) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Card: React.FC<CardProps> = ({
    user,
    index,
    totalCards,
    isTop,
    translateX,
    onStartGame,
}) => {
    // Calculate stack offset for 3D effect
    const stackOffset = Math.min(index, VISIBLE_CARDS - 1);

    const cardAnimatedStyle = useAnimatedStyle(() => {
        // Only apply drag translation to top card
        const dragTranslateX = isTop ? translateX.value : 0;

        // Rotation based on drag
        const rotation = isTop
            ? interpolate(
                translateX.value,
                [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
                [-15, 0, 15],
                Extrapolation.CLAMP
            )
            : 0;

        // Scale cards behind
        const scale = interpolate(
            stackOffset,
            [0, 1, 2],
            [1, 0.95, 0.9],
            Extrapolation.CLAMP
        );

        // Vertical offset for stack effect
        const translateY = interpolate(
            stackOffset,
            [0, 1, 2],
            [0, 15, 30],
            Extrapolation.CLAMP
        );

        // Opacity for cards behind
        const opacity = interpolate(
            stackOffset,
            [0, 1, 2, 3],
            [1, 0.8, 0.6, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateX: dragTranslateX },
                { translateY },
                { rotate: `${rotation}deg` },
                { scale },
            ],
            opacity,
            zIndex: totalCards - index,
        };
    });

    // Like/Nope indicators
    const likeIndicatorStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [0, 50, 100],
            [0, 0.5, 1],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    const nopeIndicatorStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [-100, -50, 0],
            [1, 0.5, 0],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    return (
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
            {/* Profile image with blur */}
            <View style={styles.imageContainer}>
                {user.profileImage && (
                    <>
                        <Image
                            source={{ uri: user.profileImage }}
                            style={styles.cardImage}
                        />
                        <BlurView
                            intensity={60}
                            style={StyleSheet.absoluteFill}
                            tint="dark"
                        />
                    </>
                )}

                {/* Gradient overlay */}
                <View style={styles.gradientOverlay} />

                {/* Like indicator */}
                <Animated.View style={[styles.indicator, styles.likeIndicator, likeIndicatorStyle]}>
                    <Text style={styles.indicatorText}>LIKE</Text>
                </Animated.View>

                {/* Nope indicator */}
                <Animated.View style={[styles.indicator, styles.nopeIndicator, nopeIndicatorStyle]}>
                    <Text style={styles.indicatorText}>NOPE</Text>
                </Animated.View>
            </View>

            {/* User info */}
            <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.userName}>{user.name}, {user.age}</Text>
                    <Sparkles size={20} color={COLORS.neonCyan} />
                </View>

                {/* Bio tags (blurred) */}
                <View style={styles.tagsRow}>
                    {user.bioTags.slice(0, 3).map((tag) => (
                        <View key={tag.id} style={styles.tagBlurred}>
                            <Text style={styles.tagText}>???</Text>
                        </View>
                    ))}
                </View>

                {/* Game buttons removed to rely on swipe gestures */}
            </View>

            {/* Neon border glow */}
            <View style={styles.cardGlow} />
        </Animated.View>
    );
};

export const HuddleStack: React.FC<HuddleStackProps> = ({
    users,
    onStartGame,
    onSwipe,
}) => {
    const translateX = useSharedValue(0);

    const handleSwipe = (direction: 'left' | 'right') => {
        if (users.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSwipe(users[0], direction);
        }
    };

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX;
        })
        .onEnd((e) => {
            const threshold = SCREEN_WIDTH * 0.3;

            if (e.translationX > threshold) {
                // Swipe right - like
                translateX.value = withSpring(SCREEN_WIDTH * 1.5, ANIMATION.spring, () => {
                    runOnJS(handleSwipe)('right');
                    translateX.value = 0;
                });
            } else if (e.translationX < -threshold) {
                // Swipe left - nope
                translateX.value = withSpring(-SCREEN_WIDTH * 1.5, ANIMATION.spring, () => {
                    runOnJS(handleSwipe)('left');
                    translateX.value = 0;
                });
            } else {
                // Return to center
                translateX.value = withSpring(0, ANIMATION.spring);
            }
        });

    if (users.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Heart size={80} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No more profiles nearby</Text>
                <Text style={styles.emptySubtext}>Check back later!</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <GestureDetector gesture={panGesture}>
                <View style={styles.stackContainer}>
                    {users.slice(0, VISIBLE_CARDS).map((user, index) => (
                        <Card
                            key={user.id}
                            user={user}
                            index={index}
                            totalCards={Math.min(users.length, VISIBLE_CARDS)}
                            isTop={index === 0}
                            translateX={translateX}
                            onStartGame={(gameType) => onStartGame(user, gameType)}
                        />
                    ))}
                </View>
            </GestureDetector>

            {/* Bottom action hint */}
            <View style={styles.hintContainer}>
                <Text style={styles.hintText}>Swipe to skip • Tap a game to play</Text>
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stackContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.surface,
        overflow: 'hidden',
        ...SHADOWS.subtle,
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'transparent',
        // Simulated gradient with opacity
    },
    indicator: {
        position: 'absolute',
        top: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 3,
    },
    likeIndicator: {
        right: SPACING.lg,
        borderColor: COLORS.success,
        transform: [{ rotate: '15deg' }],
    },
    nopeIndicator: {
        left: SPACING.lg,
        borderColor: COLORS.error,
        transform: [{ rotate: '-15deg' }],
    },
    indicatorText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    cardInfo: {
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    tagBlurred: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    tagText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    gameButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    gameButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        backgroundColor: COLORS.surfaceLight,
    },
    gameButtonText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.neonCyanDim,
        pointerEvents: 'none',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    emptyText: {
        fontSize: 20,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    hintContainer: {
        position: 'absolute',
        bottom: SPACING.xxl,
    },
    hintText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
});

export default HuddleStack;
