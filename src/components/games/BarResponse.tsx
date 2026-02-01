import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface BarResponseProps {
    onComplete: (success: boolean) => void;
    question?: string;
    targetValue?: number; // 0-100
}

export const BarResponse: React.FC<BarResponseProps> = ({
    onComplete,
    question = "How spontaneous are you?",
    targetValue = 75 // Mock target
}) => {
    const [value, setValue] = useState(50);
    const [submitted, setSubmitted] = useState(false);
    const [sliderWidth, setSliderWidth] = useState(0);
    const sliderRef = useRef<View>(null);

    // Animation for reveal
    const targetIndicatorScale = useSharedValue(0);

    // Track position for pan responder
    const updateValue = useCallback((locationX: number) => {
        if (submitted || sliderWidth === 0) return;
        const percentage = Math.min(Math.max((locationX / sliderWidth) * 100, 0), 100);
        setValue(Math.round(percentage));
    }, [submitted, sliderWidth]);

    const handleComplete = useCallback(() => {
        if (submitted) return;
        setSubmitted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show target
        targetIndicatorScale.value = withSpring(1);

        // Check win
        const diff = Math.abs(value - targetValue);
        const success = diff <= 15;

        setTimeout(() => {
            onComplete(success);
        }, 2000);
    }, [submitted, value, targetValue, onComplete, targetIndicatorScale]);

    // PanResponder for stable gesture handling
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !submitted,
            onMoveShouldSetPanResponder: () => !submitted,
            onPanResponderGrant: (evt) => {
                const locationX = evt.nativeEvent.locationX;
                updateValue(locationX);
                Haptics.selectionAsync();
            },
            onPanResponderMove: (evt, gestureState) => {
                // Calculate position based on dx from start
                const startX = evt.nativeEvent.locationX - gestureState.dx;
                const currentX = startX + gestureState.dx;
                updateValue(currentX);
            },
            onPanResponderRelease: () => {
                handleComplete();
            },
        })
    ).current;

    const targetStyle = useAnimatedStyle(() => ({
        transform: [{ scale: targetIndicatorScale.value }],
    }));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.gameTitle}>BAR RESPONSE</Text>
                <Text style={styles.question}>{question}</Text>
            </View>

            <View style={styles.sliderContainer}>
                <View style={styles.labels}>
                    <Text style={styles.label}>Not at all</Text>
                    <Text style={styles.label}>Very much</Text>
                </View>

                {/* Custom Track with PanResponder */}
                <View
                    ref={sliderRef}
                    style={styles.trackContainer}
                    onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.trackBar} />

                    {/* Active Fill */}
                    <View style={[styles.activeFill, { width: `${value}%` }]} />

                    {/* Thumb */}
                    <View style={[styles.thumb, { left: `${value}%` }]} />

                    {/* Target Indicator (Hidden until submit) */}
                    <Animated.View style={[
                        styles.targetIndicator,
                        { left: `${targetValue}%` },
                        targetStyle
                    ]}>
                        <View style={styles.targetLine} />
                        <View style={styles.targetLabelContainer}>
                            <Text style={styles.targetLabelText}>THEM</Text>
                        </View>
                    </Animated.View>
                </View>

                <Text style={styles.currentValue}>{Math.round(value)}%</Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {submitted
                        ? (Math.abs(value - targetValue) <= 15 ? 'Resonance Achieved!' : 'Sync Failed.')
                        : 'Drag to guess their response...'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        padding: SPACING.xl,
    },
    header: {
        marginBottom: SPACING.xxl,
        alignItems: 'center',
    },
    gameTitle: {
        fontSize: 12,
        color: COLORS.electricMagenta,
        letterSpacing: 2,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
    },
    question: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    sliderContainer: {
        width: '100%',
        alignItems: 'center',
    },
    labels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: SPACING.xs,
    },
    label: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    trackContainer: {
        width: '100%',
        height: 40,
        justifyContent: 'center',
    },
    trackBar: {
        width: '100%',
        height: 6,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 3,
    },
    activeFill: {
        position: 'absolute',
        height: 6,
        backgroundColor: COLORS.neonCyan,
        borderRadius: 3,
        left: 0,
    },
    thumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.textPrimary,
        marginLeft: -12, // Center thumb
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    targetIndicator: {
        position: 'absolute',
        top: -20,
        alignItems: 'center',
        zIndex: 1,
    },
    targetLine: {
        width: 2,
        height: 40,
        backgroundColor: COLORS.electricMagenta,
    },
    targetLabelContainer: {
        backgroundColor: COLORS.electricMagenta,
        paddingHorizontal: 4,
        borderRadius: 4,
        marginTop: 4,
    },
    targetLabelText: {
        color: COLORS.background,
        fontSize: 10,
        fontWeight: 'bold',
    },
    currentValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.neonCyan,
        marginTop: SPACING.md,
    },
    footer: {
        marginTop: SPACING.xl,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    }
});
