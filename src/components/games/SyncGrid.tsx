import React, { useEffect, useCallback, useState, useRef } from 'react';
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
    withTiming,
    withSequence,
    withDelay,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Polygon, Rect, G } from 'react-native-svg';
import { Grid3X3, MessageCircle } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, ANIMATION, GAME } from '../../constants/theme';
import socketService from '../../services/SocketService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = GAME.syncGrid.gridSize;
const TILE_SIZE = (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md * 2) / GRID_SIZE;
const MATCH_WINDOW = GAME.syncGrid.matchWindow;

interface SyncGridProps {
    roomId: string;
    partnerId: string;
    partnerImage?: string;
    onGameComplete: (matchCount: number) => void;
    onOpenChat?: () => void;
}

// Abstract SVG patterns for each tile
const TilePatterns: React.FC<{ index: number; size: number; color: string }>[] = [
    // Concentric circles
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="40" stroke={color} strokeWidth="2" fill="none" />
            <Circle cx="50" cy="50" r="28" stroke={color} strokeWidth="2" fill="none" />
            <Circle cx="50" cy="50" r="16" stroke={color} strokeWidth="2" fill="none" />
            <Circle cx="50" cy="50" r="4" fill={color} />
        </Svg>
    ),
    // Triangle grid
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Polygon points="50,15 85,75 15,75" stroke={color} strokeWidth="2" fill="none" />
            <Polygon points="50,35 70,65 30,65" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
    ),
    // Spiral
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path
                d="M50,50 Q60,40 50,30 Q35,30 35,50 Q35,70 55,70 Q80,70 80,45 Q80,15 45,15"
                stroke={color}
                strokeWidth="2"
                fill="none"
            />
        </Svg>
    ),
    // Diamond lattice
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Rect x="35" y="35" width="30" height="30" transform="rotate(45 50 50)" stroke={color} strokeWidth="2" fill="none" />
            <Rect x="42" y="42" width="16" height="16" transform="rotate(45 50 50)" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
    ),
    // Wave pattern
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path d="M10,50 Q25,30 40,50 Q55,70 70,50 Q85,30 100,50" stroke={color} strokeWidth="2" fill="none" />
            <Path d="M10,35 Q25,15 40,35 Q55,55 70,35 Q85,15 100,35" stroke={color} strokeWidth="2" fill="none" />
            <Path d="M10,65 Q25,45 40,65 Q55,85 70,65 Q85,45 100,65" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
    ),
    // Hexagon
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Polygon points="50,10 90,30 90,70 50,90 10,70 10,30" stroke={color} strokeWidth="2" fill="none" />
            <Polygon points="50,25 75,37 75,62 50,75 25,62 25,37" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
    ),
    // Cross pattern
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path d="M50,15 L50,85 M15,50 L85,50" stroke={color} strokeWidth="3" />
            <Path d="M25,25 L75,75 M75,25 L25,75" stroke={color} strokeWidth="2" opacity="0.5" />
        </Svg>
    ),
    // Dots grid
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <G>
                {[25, 50, 75].map(x =>
                    [25, 50, 75].map(y => (
                        <Circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill={color} />
                    ))
                )}
            </G>
        </Svg>
    ),
    // Star burst
    ({ size, color }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path d="M50,10 L50,90 M10,50 L90,50 M20,20 L80,80 M80,20 L20,80" stroke={color} strokeWidth="2" />
            <Circle cx="50" cy="50" r="10" fill={color} />
        </Svg>
    ),
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SyncGrid: React.FC<SyncGridProps> = ({
    roomId,
    partnerId,
    partnerImage,
    onGameComplete,
    onOpenChat,
}) => {
    const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
    const [rippleIndex, setRippleIndex] = useState<number | null>(null);
    const [blurRevealProgress, setBlurRevealProgress] = useState(0);

    // Track which tiles were tapped for local feedback
    const tileScales = useRef(
        Array.from({ length: GRID_SIZE * GRID_SIZE }, () => useSharedValue(1))
    ).current;

    const rippleScale = useSharedValue(0);
    const rippleOpacity = useSharedValue(0);

    // Handle tile tap
    const handleTileTap = useCallback((index: number) => {
        if (matchedIndices.includes(index)) return;

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Animate tile scale
        tileScales[index].value = withSequence(
            withTiming(0.9, { duration: 50 }),
            withSpring(1, ANIMATION.springBouncy)
        );

        // Send to server
        socketService.sendGridTap(index);
    }, [matchedIndices, tileScales]);

    // Trigger ripple animation
    const triggerRipple = useCallback((index: number) => {
        setRippleIndex(index);
        rippleScale.value = 0;
        rippleOpacity.value = 1;

        rippleScale.value = withTiming(3, { duration: 600 });
        rippleOpacity.value = withDelay(200, withTiming(0, { duration: 400 }));

        // Heavy haptic for match
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        setTimeout(() => setRippleIndex(null), 600);
    }, []);

    // Handle socket events
    useEffect(() => {
        socketService.joinRoom(roomId);

        const unsubMatch = socketService.onGridMatch((data) => {
            const { index, blurRevealIndex } = data;
            setMatchedIndices(prev => [...prev, index]);
            setBlurRevealProgress(prev => prev + 1);
            triggerRipple(index);

            // Check for game completion (all 9 tiles matched)
            if (matchedIndices.length + 1 >= GRID_SIZE * GRID_SIZE) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onGameComplete(matchedIndices.length + 1);
            }
        });

        const unsubRipple = socketService.onRipple((data) => {
            triggerRipple(data.index);
        });

        return () => {
            unsubMatch();
            unsubRipple();
            socketService.leaveRoom();
        };
    }, [roomId, matchedIndices.length, onGameComplete, triggerRipple]);

    // Calculate blur intensity based on revealed segments
    const blurIntensity = Math.max(0, 80 - (blurRevealProgress / (GRID_SIZE * GRID_SIZE)) * 80);

    // Ripple animated style
    const rippleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale.value }],
        opacity: rippleOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Partner preview with progressive unblur */}
            <View style={styles.partnerPreview}>
                {partnerImage && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: partnerImage }}
                            style={styles.partnerImage}
                        />
                        <BlurView
                            intensity={blurIntensity}
                            style={StyleSheet.absoluteFill}
                            tint="dark"
                        />
                        {/* Reveal overlay grid */}
                        <View style={styles.revealGrid}>
                            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.revealTile,
                                        { width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` },
                                        matchedIndices.includes(i) && styles.revealTileRevealed,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* Progress text */}
            <View style={styles.progressContainer}>
                <Grid3X3 size={20} color={COLORS.neonCyan} />
                <Text style={styles.progressText}>
                    {matchedIndices.length} / {GRID_SIZE * GRID_SIZE} Synced
                </Text>
            </View>

            {/* Instruction */}
            <Text style={styles.instruction}>
                Tap the same tile as your match within 2 seconds!
            </Text>

            {/* Grid */}
            <View style={styles.gridContainer}>
                <View style={styles.grid}>
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                        const PatternComponent = TilePatterns[index];
                        const isMatched = matchedIndices.includes(index);
                        const isRippling = rippleIndex === index;

                        const tileAnimatedStyle = useAnimatedStyle(() => ({
                            transform: [{ scale: tileScales[index].value }],
                        }));

                        return (
                            <View key={index} style={styles.tileWrapper}>
                                <AnimatedPressable
                                    style={[
                                        styles.tile,
                                        isMatched && styles.tileMatched,
                                        tileAnimatedStyle,
                                    ]}
                                    onPress={() => handleTileTap(index)}
                                    disabled={isMatched}
                                >
                                    <PatternComponent
                                        index={index}
                                        size={TILE_SIZE - SPACING.md}
                                        color={isMatched ? COLORS.success : COLORS.neonCyan}
                                    />
                                </AnimatedPressable>

                                {/* Ripple effect */}
                                {isRippling && (
                                    <Animated.View style={[styles.ripple, rippleAnimatedStyle]} />
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Match indicator */}
            <View style={styles.matchIndicator}>
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.matchDot,
                            matchedIndices.includes(i) && styles.matchDotActive,
                        ]}
                    />
                ))}
            </View>
            {/* Game completed overlay */}
            {matchedIndices.length + 1 >= GRID_SIZE * GRID_SIZE && (
                <View style={styles.completedOverlay}>
                    <Text style={styles.completedText}>✨ Resonance Achieved ✨</Text>
                    {onOpenChat && (
                        <Pressable
                            style={styles.connectButton}
                            onPress={onOpenChat}
                        >
                            <MessageCircle size={20} color={COLORS.background} />
                            <Text style={styles.connectButtonText}>Message</Text>
                        </Pressable>
                    )}
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
        width: 150,
        height: 150,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    partnerImage: {
        width: '100%',
        height: '100%',
    },
    revealGrid: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    revealTile: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    revealTileRevealed: {
        backgroundColor: 'transparent',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    progressText: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '600',
    },
    instruction: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: SPACING.lg,
    },
    gridContainer: {
        padding: SPACING.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: TILE_SIZE * GRID_SIZE + SPACING.sm * 2,
        gap: SPACING.sm,
    },
    tileWrapper: {
        position: 'relative',
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundColor: COLORS.gridTile,
        borderRadius: BORDER_RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    tileMatched: {
        backgroundColor: COLORS.gridTileActive,
        borderColor: COLORS.success,
    },
    ripple: {
        position: 'absolute',
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: TILE_SIZE / 2,
        backgroundColor: COLORS.ripple,
        top: 0,
        left: 0,
    },
    matchIndicator: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    matchDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.surfaceLight,
    },
    matchDotActive: {
        backgroundColor: COLORS.success,
    },
    completedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    completedText: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: 'bold',
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

export default SyncGrid;
