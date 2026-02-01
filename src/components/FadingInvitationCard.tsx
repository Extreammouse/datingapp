import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    useDerivedValue,
    interpolate,
    Extrapolation,
    withSpring,
    useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Snowflake, Clock } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, ANIMATION, SHADOWS } from '../constants/theme';
import { Invitation, useHuddleStore } from '../store/useHuddleStore';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width - 60;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface FadingInvitationCardProps {
    invitation: Invitation;
    onAccept?: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const FadingInvitationCard: React.FC<FadingInvitationCardProps> = ({ invitation, onAccept }) => {
    const { raincheckInvitation } = useHuddleStore();

    // Time tracking
    const remainingTime = useSharedValue(invitation.expiryTime - Date.now());
    const initialDuration = 15 * 60 * 1000; // 15 mins total duration reference

    // Animation states
    const isRainchecked = invitation.isRainchecked;
    const cardScale = useSharedValue(1);
    const cardOpacity = useSharedValue(1);
    const blurIntensity = useSharedValue(0);

    // Update time remaining
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const left = Math.max(0, invitation.expiryTime - now);
            remainingTime.value = left;
        }, 1000);

        return () => clearInterval(interval);
    }, [invitation.expiryTime]);

    // Progress for SVG circle (1 -> 0)
    const progress = useDerivedValue(() => {
        return remainingTime.value / initialDuration;
    });

    // Stroke dashoffset for circle
    const strokeDashoffset = useDerivedValue(() => {
        return CIRCUMFERENCE * (1 - progress.value);
    });

    // Opacity fades as time runs out
    const containerOpacity = useDerivedValue(() => {
        if (isRainchecked) return 1;
        // Fade from 1.0 to 0.4 over the duration
        return interpolate(
            progress.value,
            [0, 1],
            [0.4, 1],
            Extrapolation.CLAMP
        );
    });

    // Pulsing effect in last 2 minutes
    const pulsingStyle = useAnimatedStyle(() => {
        // Less than 2 minutes remaining (120000 ms)
        if (remainingTime.value < 120000 && !isRainchecked && remainingTime.value > 0) {
            return {
                transform: [{
                    scale: withRepeat(
                        withSequence(
                            withTiming(1.02, { duration: 500 }),
                            withTiming(1, { duration: 500 })
                        ),
                        -1,
                        true
                    )
                }]
            };
        }
        return { transform: [{ scale: cardScale.value }] };
    });

    // Raincheck handler
    const handleRaincheck = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const success = await raincheckInvitation(invitation.id);

        if (success) {
            // "Freeze" animation
            cardScale.value = withSpring(0.8);
            blurIntensity.value = withTiming(10, { duration: 500 });
            // More complex animations could move it to a "saved" slot here
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: strokeDashoffset.value,
    }));

    // Formatted time string
    const formatTime = (ms: number) => {
        const totalSeconds = Math.ceil(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
        filter: isRainchecked ? 'grayscale(100%)' : 'none',
    }));

    return (
        <Animated.View style={[styles.container, containerAnimatedStyle, pulsingStyle]}>
            {/* Countdown Border */}
            <View style={styles.svgContainer}>
                <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                    <Circle
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={RADIUS}
                        stroke={COLORS.surfaceLight}
                        strokeWidth={STROKE_WIDTH}
                        fill="none"
                    />
                    <AnimatedCircle
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={RADIUS}
                        stroke={COLORS.neonCyan}
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={CIRCUMFERENCE}
                        animatedProps={animatedProps}
                        strokeLinecap="round"
                        fill="none"
                        rotation="-90"
                        origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                    />
                </Svg>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={[styles.avatarContainer, isRainchecked && styles.avatarFrozen]}>
                    <Image
                        source={{ uri: invitation.userProfile.profileImage }}
                        style={styles.avatar}
                    />
                </View>

                <Text style={styles.name}>{invitation.userProfile.name}, {invitation.userProfile.age}</Text>

                {!isRainchecked ? (
                    <Text style={styles.timerData}>
                        <Clock size={16} color={COLORS.textSecondary} /> {formatTime(remainingTime.value)}
                    </Text>
                ) : (
                    <Text style={styles.frozenText}>Rainchecked ❄️</Text>
                )}

                {/* Initial Interaction Buttons */}
                {!isRainchecked && remainingTime.value > 0 && (
                    <View style={styles.actions}>
                        <Pressable
                            style={[styles.button, styles.raincheckButton]}
                            onPress={handleRaincheck}
                        >
                            <Snowflake size={20} color={COLORS.textPrimary} />
                            <Text style={styles.buttonText}>Raincheck</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.button, styles.acceptButton]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                if (onAccept) onAccept();
                            }}
                        >
                            <Text style={styles.buttonText}>Accept</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Freeze Overlay */}
            {isRainchecked && (
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill}>
                    <View style={styles.overlayContent}>
                        <Snowflake size={40} color={COLORS.neonCyan} />
                    </View>
                </BlurView>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    svgContainer: {
        position: 'absolute',
    },
    content: {
        alignItems: 'center',
        gap: SPACING.md,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: COLORS.textPrimary,
        ...SHADOWS.neonCyan,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarFrozen: {
        borderColor: COLORS.neonCyan,
        opacity: 0.8,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    timerData: {
        fontSize: 18,
        color: COLORS.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    frozenText: {
        fontSize: 18,
        color: COLORS.neonCyan,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: BORDER_RADIUS.full,
        gap: 8,
    },
    raincheckButton: {
        backgroundColor: COLORS.surfaceLight,
    },
    acceptButton: {
        backgroundColor: COLORS.electricMagenta,
    },
    buttonText: {
        color: COLORS.textPrimary,
        fontWeight: '600',
        fontSize: 16,
    },
    overlayContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
