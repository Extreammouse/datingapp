import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedProps,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    interpolate,
    interpolateColor,
    Extrapolation,
    runOnJS,
    useDerivedValue,
    cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Radio, Zap } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, ANIMATION, GAME } from '../../constants/theme';
import socketService from '../../services/SocketService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const WAVE_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const WAVE_HEIGHT = 200;
const SLIDER_WIDTH = SCREEN_WIDTH - SPACING.xxl * 2;
const SLIDER_HEIGHT = 60;
const KNOB_SIZE = 40;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface FrequencySyncProps {
    roomId: string;
    partnerId: string;
    partnerImage?: string;
    onGameComplete: () => void;
}

export const FrequencySync: React.FC<FrequencySyncProps> = ({
    roomId,
    partnerId,
    partnerImage,
    onGameComplete,
}) => {
    // Slider values (0.0 to 1.0)
    const myValue = useSharedValue(0.5);
    const partnerValue = useSharedValue(0.5);

    // Wave animation
    const wavePhase = useSharedValue(0);

    // Sync state
    const syncMeter = useSharedValue(0);
    const [syncHoldStart, setSyncHoldStart] = useState<number | null>(null);
    const [isInSync, setIsInSync] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);

    // Haptic interval ref
    const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Particle explosion state
    const [showParticles, setShowParticles] = useState(false);
    const particleAnimations = useRef(
        Array.from({ length: 20 }, () => ({
            x: useSharedValue(WAVE_WIDTH / 2),
            y: useSharedValue(WAVE_HEIGHT / 2),
            opacity: useSharedValue(0),
            scale: useSharedValue(0),
        }))
    ).current;

    // Start wave animation
    useEffect(() => {
        wavePhase.value = withRepeat(
            withTiming(Math.PI * 2, { duration: 2000 }),
            -1,
            false
        );
    }, []);

    // Check sync state
    const checkSync = useCallback((myVal: number, partnerVal: number) => {
        const diff = Math.abs(myVal - partnerVal);
        const inSync = diff < GAME.frequencySync.syncThreshold;

        setIsInSync(inSync);

        if (inSync) {
            // Start or continue sync hold
            if (!syncHoldStart) {
                setSyncHoldStart(Date.now());
            }

            // Calculate intensity based on closeness (0 = perfect, 0.05 = threshold)
            const intensity = 1 - (diff / GAME.frequencySync.syncThreshold);

            // Trigger haptic based on intensity
            if (!hapticIntervalRef.current) {
                hapticIntervalRef.current = setInterval(() => {
                    if (intensity > 0.8) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    } else if (intensity > 0.5) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } else {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                }, 150 - intensity * 100); // Faster vibration when closer
            }

            // Update sync meter
            if (syncHoldStart) {
                const elapsed = Date.now() - syncHoldStart;
                const progress = Math.min(100, (elapsed / GAME.frequencySync.holdDuration) * 100);
                syncMeter.value = withSpring(progress, ANIMATION.spring);

                // Check for completion
                if (elapsed >= GAME.frequencySync.holdDuration && !gameCompleted) {
                    setGameCompleted(true);
                    triggerParticleExplosion();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setTimeout(() => onGameComplete(), 1500);
                }
            }
        } else {
            // Reset sync hold
            setSyncHoldStart(null);
            syncMeter.value = withSpring(0, ANIMATION.spring);

            // Stop haptic
            if (hapticIntervalRef.current) {
                clearInterval(hapticIntervalRef.current);
                hapticIntervalRef.current = null;
            }
        }
    }, [syncHoldStart, gameCompleted, onGameComplete]);

    // Trigger particle explosion ("shatter" effect)
    const triggerParticleExplosion = useCallback(() => {
        setShowParticles(true);

        particleAnimations.forEach((particle, i) => {
            const angle = (i / particleAnimations.length) * Math.PI * 2;
            const distance = 100 + Math.random() * 100;

            particle.x.value = WAVE_WIDTH / 2;
            particle.y.value = WAVE_HEIGHT / 2;
            particle.opacity.value = 1;
            particle.scale.value = 0;

            particle.x.value = withSpring(
                WAVE_WIDTH / 2 + Math.cos(angle) * distance,
                { damping: 8, stiffness: 100 }
            );
            particle.y.value = withSpring(
                WAVE_HEIGHT / 2 + Math.sin(angle) * distance,
                { damping: 8, stiffness: 100 }
            );
            particle.scale.value = withSequence(
                withSpring(1.5, ANIMATION.springBouncy),
                withTiming(0, { duration: 800 })
            );
            particle.opacity.value = withTiming(0, { duration: 1000 });
        });
    }, []);

    // Handle socket events
    useEffect(() => {
        socketService.joinRoom(roomId);

        const unsubSync = socketService.onSyncState((data) => {
            partnerValue.value = withSpring(data.userBValue, ANIMATION.spring);
            runOnJS(checkSync)(myValue.value, data.userBValue);
        });

        const unsubResonance = socketService.onResonanceEvent((data) => {
            // Additional resonance feedback handled by checkSync
        });

        const unsubReveal = socketService.onProfileReveal(() => {
            setGameCompleted(true);
            triggerParticleExplosion();
        });

        return () => {
            unsubSync();
            unsubResonance();
            unsubReveal();
            socketService.leaveRoom();
            if (hapticIntervalRef.current) {
                clearInterval(hapticIntervalRef.current);
            }
        };
    }, [roomId, checkSync, triggerParticleExplosion]);

    // Slider gesture
    const sliderGesture = Gesture.Pan()
        .onUpdate((e) => {
            const x = Math.max(0, Math.min(SLIDER_WIDTH - KNOB_SIZE, e.x - KNOB_SIZE / 2));
            const value = x / (SLIDER_WIDTH - KNOB_SIZE);
            myValue.value = value;

            // Send to server
            socketService.sendFrequencyUpdate(value);
            runOnJS(checkSync)(value, partnerValue.value);
        });

    // Generate wave path based on slider value
    const generateWavePath = (value: number, phase: number): string => {
        const amplitude = 30 + value * 40; // Amplitude increases with value
        const frequency = 2 + value * 3; // Frequency increases with value

        let path = `M 0 ${WAVE_HEIGHT / 2}`;

        for (let x = 0; x <= WAVE_WIDTH; x += 5) {
            const y = WAVE_HEIGHT / 2 +
                Math.sin((x / WAVE_WIDTH) * Math.PI * frequency + phase) * amplitude;
            path += ` L ${x} ${y}`;
        }

        return path;
    };

    // Animated wave path
    const waveAnimatedProps = useAnimatedProps(() => {
        const path = generateWavePath(myValue.value, wavePhase.value);
        return { d: path };
    });

    // Partner wave path (slightly offset)
    const partnerWaveAnimatedProps = useAnimatedProps(() => {
        const path = generateWavePath(partnerValue.value, wavePhase.value + Math.PI);
        return { d: path };
    });

    // Wave color based on slider value (cold blue to warm rose)
    const waveColorStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            myValue.value,
            [0, 0.5, 1],
            [COLORS.frequencyCold, COLORS.neonCyan, COLORS.frequencyWarm]
        );

        return { color };
    });

    // Slider knob position
    const knobAnimatedStyle = useAnimatedStyle(() => {
        const translateX = myValue.value * (SLIDER_WIDTH - KNOB_SIZE);
        const backgroundColor = interpolateColor(
            myValue.value,
            [0, 0.5, 1],
            [COLORS.frequencyCold, COLORS.neonCyan, COLORS.frequencyWarm]
        );

        return {
            transform: [{ translateX }],
            backgroundColor,
        };
    });

    // Slider track gradient
    const sliderTrackStyle = useDerivedValue(() => {
        return myValue.value;
    });

    // Sync meter style
    const syncMeterStyle = useAnimatedStyle(() => ({
        width: `${syncMeter.value}%`,
    }));

    // Sync glow effect
    const syncGlowStyle = useAnimatedStyle(() => {
        const glowOpacity = isInSync ?
            withRepeat(withSequence(
                withTiming(0.8, { duration: 300 }),
                withTiming(0.4, { duration: 300 })
            ), -1, true) :
            withTiming(0);

        return { opacity: glowOpacity };
    });

    // Blur intensity based on sync meter
    const blurIntensity = gameCompleted ? 0 : Math.max(0, 80 - (syncMeter.value / 100) * 80);

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* Partner preview */}
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
                    </View>
                )}
                {/* Sync glow around image */}
                <Animated.View style={[styles.syncGlow, syncGlowStyle]} />
            </View>

            {/* Sync meter */}
            <View style={styles.syncMeterContainer}>
                <Text style={styles.syncMeterLabel}>
                    <Radio size={16} color={COLORS.neonCyan} /> Resonance
                </Text>
                <View style={styles.syncMeterTrack}>
                    <Animated.View style={[styles.syncMeterFill, syncMeterStyle]} />
                </View>
                <Text style={styles.syncMeterText}>
                    {isInSync ? 'In Sync! Hold it...' : 'Align your frequency'}
                </Text>
            </View>

            {/* Waveform visualization */}
            <View style={styles.waveContainer}>
                <Svg width={WAVE_WIDTH} height={WAVE_HEIGHT} style={styles.waveSvg}>
                    <Defs>
                        <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor={COLORS.frequencyCold} />
                            <Stop offset="50%" stopColor={COLORS.neonCyan} />
                            <Stop offset="100%" stopColor={COLORS.frequencyWarm} />
                        </LinearGradient>
                    </Defs>

                    {/* Partner wave (behind) */}
                    <AnimatedPath
                        animatedProps={partnerWaveAnimatedProps}
                        stroke={COLORS.electricMagentaDim}
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* My wave (front) */}
                    <AnimatedPath
                        animatedProps={waveAnimatedProps}
                        stroke="url(#waveGradient)"
                        strokeWidth={4}
                        fill="none"
                        strokeLinecap="round"
                    />
                </Svg>

                {/* Particle explosion */}
                {showParticles && particleAnimations.map((particle, i) => {
                    const particleStyle = useAnimatedStyle(() => ({
                        transform: [
                            { translateX: particle.x.value },
                            { translateY: particle.y.value },
                            { scale: particle.scale.value },
                        ],
                        opacity: particle.opacity.value,
                    }));

                    return (
                        <Animated.View
                            key={i}
                            style={[styles.particle, particleStyle]}
                        >
                            <Zap size={12} color={i % 2 === 0 ? COLORS.neonCyan : COLORS.electricMagenta} />
                        </Animated.View>
                    );
                })}
            </View>

            {/* Frequency indicator */}
            <View style={styles.frequencyLabels}>
                <Text style={[styles.frequencyLabel, { color: COLORS.frequencyCold }]}>Low</Text>
                <Text style={[styles.frequencyLabel, { color: COLORS.neonCyan }]}>●</Text>
                <Text style={[styles.frequencyLabel, { color: COLORS.frequencyWarm }]}>High</Text>
            </View>

            {/* Custom slider */}
            <GestureDetector gesture={sliderGesture}>
                <View style={styles.sliderContainer}>
                    <View style={styles.sliderTrack}>
                        {/* Gradient background */}
                        <View style={styles.sliderGradient}>
                            <View style={[styles.gradientSegment, { backgroundColor: COLORS.frequencyCold }]} />
                            <View style={[styles.gradientSegment, { backgroundColor: COLORS.neonCyan }]} />
                            <View style={[styles.gradientSegment, { backgroundColor: COLORS.frequencyWarm }]} />
                        </View>
                    </View>

                    {/* Knob */}
                    <Animated.View style={[styles.sliderKnob, knobAnimatedStyle]}>
                        <View style={styles.knobInner} />
                    </Animated.View>
                </View>
            </GestureDetector>

            {/* Instructions */}
            <Text style={styles.instruction}>
                Match your partner's frequency to reveal their profile
            </Text>

            {/* Partner frequency indicator */}
            <View style={styles.partnerIndicator}>
                <Text style={styles.partnerIndicatorText}>Partner's Frequency</Text>
                <View style={styles.partnerFrequencyBar}>
                    <Animated.View
                        style={[
                            styles.partnerFrequencyDot,
                            useAnimatedStyle(() => ({
                                left: `${partnerValue.value * 100}%`,
                            })),
                        ]}
                    />
                </View>
            </View>

            {/* Game completed overlay */}
            {gameCompleted && (
                <View style={styles.completedOverlay}>
                    <Text style={styles.completedText}>✨ Resonance Achieved ✨</Text>
                </View>
            )}
        </GestureHandlerRootView>
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
        width: 140,
        height: 140,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'visible',
        position: 'relative',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
    },
    partnerImage: {
        width: '100%',
        height: '100%',
    },
    syncGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: BORDER_RADIUS.full + 10,
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
    },
    syncMeterContainer: {
        width: '80%',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    syncMeterLabel: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    syncMeterTrack: {
        width: '100%',
        height: 8,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 4,
        overflow: 'hidden',
    },
    syncMeterFill: {
        height: '100%',
        backgroundColor: COLORS.neonCyan,
        borderRadius: 4,
    },
    syncMeterText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    waveContainer: {
        width: WAVE_WIDTH,
        height: WAVE_HEIGHT,
        position: 'relative',
        overflow: 'visible',
    },
    waveSvg: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
    },
    particle: {
        position: 'absolute',
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frequencyLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: SLIDER_WIDTH,
    },
    frequencyLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    sliderContainer: {
        width: SLIDER_WIDTH,
        height: SLIDER_HEIGHT,
        justifyContent: 'center',
        position: 'relative',
    },
    sliderTrack: {
        width: '100%',
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.surfaceLight,
        overflow: 'hidden',
    },
    sliderGradient: {
        flexDirection: 'row',
        width: '100%',
        height: '100%',
    },
    gradientSegment: {
        flex: 1,
        opacity: 0.6,
    },
    sliderKnob: {
        position: 'absolute',
        width: KNOB_SIZE,
        height: KNOB_SIZE,
        borderRadius: KNOB_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    knobInner: {
        width: KNOB_SIZE - 8,
        height: KNOB_SIZE - 8,
        borderRadius: (KNOB_SIZE - 8) / 2,
        backgroundColor: COLORS.textPrimary,
    },
    instruction: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: SPACING.lg,
    },
    partnerIndicator: {
        width: '80%',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    partnerIndicatorText: {
        color: COLORS.electricMagenta,
        fontSize: 12,
    },
    partnerFrequencyBar: {
        width: '100%',
        height: 4,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 2,
        position: 'relative',
    },
    partnerFrequencyDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.electricMagenta,
        top: -4,
        marginLeft: -6,
    },
    completedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedText: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: 'bold',
    },
});

export default FrequencySync;
