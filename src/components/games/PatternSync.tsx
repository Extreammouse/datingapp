import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence } from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants/theme'; // Adjust path as needed
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const GRID_SIZE = 4;
const CELL_SIZE = (width - SPACING.xl * 2 - (GRID_SIZE - 1) * SPACING.sm) / GRID_SIZE;

interface PatternSyncProps {
    onComplete: (success: boolean) => void;
}

export const PatternSync: React.FC<PatternSyncProps> = ({ onComplete }) => {
    const [pattern, setPattern] = useState<number[]>([]);
    const [userPattern, setUserPattern] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'memorize' | 'recall' | 'success' | 'fail'>('memorize');
    const [timeLeft, setTimeLeft] = useState(3);

    // Generate random pattern
    useEffect(() => {
        const newPattern = [];
        const patternLength = 5;
        // Ensure unique cells for pattern
        const availableCells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

        for (let i = 0; i < patternLength; i++) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            newPattern.push(availableCells[randomIndex]);
            availableCells.splice(randomIndex, 1);
        }
        setPattern(newPattern);
    }, []);

    // Timer for memorization phase
    useEffect(() => {
        if (gameState === 'memorize') {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setGameState('recall');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState]);

    const handleCellPress = (index: number) => {
        if (gameState !== 'recall') return;

        // Check if cell is part of pattern
        const isCorrect = pattern.includes(index);

        if (isCorrect) {
            // Check if already selected
            if (userPattern.includes(index)) return;

            const newUserPattern = [...userPattern, index];
            setUserPattern(newUserPattern);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Check win condition
            if (newUserPattern.length === pattern.length) {
                setGameState('success');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTimeout(() => onComplete(true), 1000);
            }
        } else {
            // Wrong cell
            setGameState('fail');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => onComplete(false), 1000);
        }
    };

    const LoadingBar = () => {
        const widthVal = useSharedValue(0);

        useEffect(() => {
            if (gameState === 'memorize') {
                widthVal.value = withTiming(width - SPACING.xl * 2, { duration: 3000 });
            }
        }, [gameState]);

        const animatedStyle = useAnimatedStyle(() => ({
            width: widthVal.value,
        }));

        return (
            <View style={styles.timerBarContainer}>
                <Animated.View style={[styles.timerBarFill, animatedStyle]} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>PATTERN SYNC</Text>
                <Text style={styles.subtitle}>
                    {gameState === 'memorize' ? 'Memorize the pattern...' :
                        gameState === 'recall' ? 'Replicate the connection.' :
                            gameState === 'success' ? 'Synchronized!' : 'Desynchronized.'}
                </Text>
            </View>

            <View style={styles.gridContainer}>
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                    const isPattern = pattern.includes(index);
                    const isSelected = userPattern.includes(index);
                    const showPattern = gameState === 'memorize' && isPattern;
                    const showSelected = gameState !== 'memorize' && isSelected;

                    return (
                        <Pressable
                            key={index}
                            style={[
                                styles.cell,
                                showPattern && styles.cellPattern,
                                showSelected && styles.cellSelected,
                                gameState === 'fail' && !isPattern && isSelected && styles.cellError
                            ]}
                            onPress={() => handleCellPress(index)}
                            disabled={gameState !== 'recall'}
                        />
                    );
                })}
            </View>

            {gameState === 'memorize' && <LoadingBar />}

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {gameState === 'memorize'
                        ? 'Wait for signal...'
                        : `${userPattern.length} / ${pattern.length} Node Links`}
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
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.neonCyan,
        letterSpacing: 3,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        letterSpacing: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: width - SPACING.xl * 2,
        gap: SPACING.sm,
        justifyContent: 'center',
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    cellPattern: {
        backgroundColor: COLORS.neonCyan,
        borderColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    cellSelected: {
        backgroundColor: COLORS.electricMagenta,
        borderColor: COLORS.electricMagenta,
        shadowColor: COLORS.electricMagenta,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    cellError: {
        backgroundColor: COLORS.error,
        borderColor: COLORS.error,
    },
    timerBarContainer: {
        width: '100%',
        height: 4,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 2,
        marginTop: SPACING.xl,
        overflow: 'hidden',
    },
    timerBarFill: {
        height: '100%',
        backgroundColor: COLORS.neonCyan,
    },
    footer: {
        marginTop: SPACING.xl,
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: 12,
        letterSpacing: 1,
    }
});
