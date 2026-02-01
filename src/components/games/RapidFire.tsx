import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface RapidFireProps {
    onComplete: (success: boolean) => void;
    question?: string;
}

export const RapidFire: React.FC<RapidFireProps> = ({
    onComplete,
    question = "What's their favorite movie genre?"
}) => {
    const [answer, setAnswer] = useState('');
    const [gameState, setGameState] = useState<'playing' | 'success' | 'fail'>('playing');

    // Timer animation
    const progress = useSharedValue(1);

    useEffect(() => {
        progress.value = withTiming(0, {
            duration: 10000, // 10 seconds
            easing: Easing.linear
        }, (finished) => {
            if (finished) {
                runOnJS(handleTimeout)();
            }
        });
    }, []);

    const handleTimeout = () => {
        if (gameState === 'playing') {
            setGameState('fail');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => onComplete(false), 1500);
        }
    };

    const handleSubmit = () => {
        if (answer.trim().length > 0) {
            setGameState('success');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => onComplete(true), 1500);
        }
    };

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
        backgroundColor: progress.value < 0.3 ? COLORS.error : COLORS.neonCyan
    }));

    return (
        <View style={styles.container}>
            <View style={styles.timerContainer}>
                <Animated.View style={[styles.timerBar, progressStyle]} />
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>RAPID FIRE</Text>
                <Text style={styles.question}>{question}</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Type your answer..."
                    placeholderTextColor={COLORS.textMuted}
                    value={answer}
                    onChangeText={setAnswer}
                    autoFocus
                    editable={gameState === 'playing'}
                    onSubmitEditing={handleSubmit}
                />

                <Pressable
                    style={[styles.button, !answer.trim() && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={!answer.trim() || gameState !== 'playing'}
                >
                    <Text style={styles.buttonText}>LOCK ANSWER</Text>
                </Pressable>
            </View>

            {gameState !== 'playing' && (
                <View style={styles.resultOverlay}>
                    <Text style={styles.resultText}>
                        {gameState === 'success' ? 'ANSWER LOGGED' : 'TIME OUT'}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
    },
    timerContainer: {
        height: 6,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: SPACING.xl,
        marginBottom: SPACING.xxl,
    },
    timerBar: {
        height: '100%',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    label: {
        color: COLORS.electricMagenta,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: SPACING.sm,
    },
    question: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: SPACING.xl,
        lineHeight: 34,
    },
    input: {
        backgroundColor: COLORS.surface,
        color: COLORS.textPrimary,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        fontSize: 18,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        marginBottom: SPACING.lg,
    },
    button: {
        backgroundColor: COLORS.neonCyan,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: COLORS.surfaceLight,
        opacity: 0.5,
    },
    buttonText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    resultOverlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultText: {
        color: COLORS.textPrimary,
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 4,
    }
});
