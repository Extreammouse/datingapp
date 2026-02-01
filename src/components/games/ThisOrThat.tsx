import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { Sun, Moon, Coffee, Beer, Music, Book, Gamepad2, Tv, Plane, Home } from 'lucide-react-native';

interface ThisOrThatProps {
    onComplete: (success: boolean) => void;
    tags?: string[]; // Profile tags to base questions on (e.g., "Night Owl", "Gamer")
}

type Option = {
    label: string;
    icon: React.ReactNode;
};

type Question = {
    id: string;
    left: Option;
    right: Option;
    correctSide: 'left' | 'right'; // The side that matches the user's tag
};

// Generic fallback questions
const GENERIC_QUESTIONS: Question[] = [
    {
        id: 'g1',
        left: { label: 'Coffee', icon: <Coffee size={40} color={COLORS.neonCyan} /> },
        right: { label: 'Tea', icon: <Beer size={40} color={COLORS.electricMagenta} /> }, // Using Beer icon as placeholder for drink
        correctSide: Math.random() > 0.5 ? 'left' : 'right', // Random for generic
    },
    {
        id: 'g2',
        left: { label: 'Movies', icon: <Tv size={40} color={COLORS.neonCyan} /> },
        right: { label: 'Books', icon: <Book size={40} color={COLORS.electricMagenta} /> },
        correctSide: Math.random() > 0.5 ? 'left' : 'right',
    },
    {
        id: 'g3',
        left: { label: 'Travel', icon: <Plane size={40} color={COLORS.neonCyan} /> },
        right: { label: 'Homebody', icon: <Home size={40} color={COLORS.electricMagenta} /> },
        correctSide: Math.random() > 0.5 ? 'left' : 'right',
    },
];

const TAG_MAPPINGS: Record<string, Question> = {
    'Night Owl': {
        id: 't_nightowl',
        left: { label: 'Early Bird', icon: <Sun size={40} color={COLORS.neonCyan} /> },
        right: { label: 'Night Owl', icon: <Moon size={40} color={COLORS.electricMagenta} /> },
        correctSide: 'right',
    },
    'Gamer': {
        id: 't_gamer',
        left: { label: 'Board Games', icon: <Book size={40} color={COLORS.neonCyan} /> },
        right: { label: 'Video Games', icon: <Gamepad2 size={40} color={COLORS.electricMagenta} /> },
        correctSide: 'right',
    },
    'Synthwave': {
        id: 't_music',
        left: { label: 'Modern Pop', icon: <Music size={40} color={COLORS.neonCyan} /> },
        right: { label: 'Retro Synth', icon: <Music size={40} color={COLORS.electricMagenta} /> },
        correctSide: 'right',
    },
};

export const ThisOrThat: React.FC<ThisOrThatProps> = ({ onComplete, tags = [] }) => {
    const [currentRound, setCurrentRound] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<'left' | 'right' | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    // Generate questions once based on tags (prevent infinite loop)
    const questions = React.useMemo(() => {
        const derivedQuestions: Question[] = [];

        tags.forEach(tag => {
            if (TAG_MAPPINGS[tag]) {
                derivedQuestions.push(TAG_MAPPINGS[tag]);
            }
        });

        // Fill remaining slots with generic questions
        const needed = 3 - derivedQuestions.length;
        if (needed > 0) {
            const shuffledGeneric = [...GENERIC_QUESTIONS].sort(() => 0.5 - Math.random());
            derivedQuestions.push(...shuffledGeneric.slice(0, needed));
        }

        return derivedQuestions.slice(0, 3);
    }, [tags.join(',')]); // Stable dependency

    const handleChoice = (side: 'left' | 'right') => {
        if (selected || gameOver) return;

        setSelected(side);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRevealed(true);

        const currentQ = questions[currentRound];
        const isMatch = side === currentQ.correctSide;

        if (isMatch) {
            setScore(prev => prev + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        setTimeout(() => {
            if (currentRound < questions.length - 1) {
                // Next round
                setCurrentRound(prev => prev + 1);
                setSelected(null);
                setRevealed(false);
            } else {
                // Game Over
                setGameOver(true);
                setTimeout(() => {
                    const passed = score + (isMatch ? 1 : 0) >= 2; // Pass if 2/3 correct
                    onComplete(passed);
                }, 1500);
            }
        }, 1500);
    };

    if (questions.length === 0) return null;

    const currentQ = questions[currentRound];

    if (gameOver) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>SYNC COMPLETE</Text>
                <Text style={styles.scoreText}>Score: {score}/3</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>THIS OR THAT</Text>
                <Text style={styles.subtitle}>Round {currentRound + 1}/3</Text>
                <View style={styles.progressBar}>
                    {[0, 1, 2].map(idx => (
                        <View
                            key={idx}
                            style={[
                                styles.progressDot,
                                idx < currentRound ? styles.dotCompleted : (idx === currentRound ? styles.dotActive : null)
                            ]}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.cardsContainer}>
                {/* Left Choice */}
                <Pressable
                    style={[
                        styles.card,
                        selected === 'left' && styles.cardSelected,
                        revealed && currentQ.correctSide === 'left' && styles.cardCorrect,
                        revealed && currentQ.correctSide !== 'left' && selected === 'left' && styles.cardWrong
                    ]}
                    onPress={() => handleChoice('left')}
                >
                    {currentQ.left.icon}
                    <Text style={[styles.cardLabel, selected === 'left' && styles.cardLabelSelected]}>
                        {currentQ.left.label}
                    </Text>
                </Pressable>

                <Text style={styles.vs}>VS</Text>

                {/* Right Choice */}
                <Pressable
                    style={[
                        styles.card,
                        selected === 'right' && styles.cardSelected,
                        revealed && currentQ.correctSide === 'right' && styles.cardCorrect,
                        revealed && currentQ.correctSide !== 'right' && selected === 'right' && styles.cardWrong
                    ]}
                    onPress={() => handleChoice('right')}
                >
                    {currentQ.right.icon}
                    <Text style={[styles.cardLabel, selected === 'right' && styles.cardLabelSelected]}>
                        {currentQ.right.label}
                    </Text>
                </Pressable>
            </View>

            {revealed && (
                <Text style={styles.matchText}>
                    {selected === currentQ.correctSide ? "IT'S A MATCH" : "DISSENTING OPINION"}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
    },
    header: {
        position: 'absolute',
        top: 40,
        alignItems: 'center',
        width: '100%',
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        letterSpacing: 2,
    },
    progressBar: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.surfaceLight,
    },
    dotActive: {
        backgroundColor: COLORS.neonCyan,
    },
    dotCompleted: {
        backgroundColor: COLORS.textPrimary,
    },
    scoreText: {
        color: COLORS.neonCyan,
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: SPACING.md,
    },
    cardsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: SPACING.sm,
    },
    card: {
        width: '40%',
        aspectRatio: 0.8,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        gap: SPACING.md,
        ...SHADOWS.medium,
    },
    cardSelected: {
        borderColor: COLORS.textPrimary,
        transform: [{ scale: 1.05 }],
    },
    cardCorrect: {
        borderColor: COLORS.success,
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
    },
    cardWrong: {
        borderColor: COLORS.error,
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
    },
    cardLabel: {
        fontSize: 14, // Slightly smaller to fit
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
    cardLabelSelected: {
        color: COLORS.textPrimary,
    },
    vs: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
    matchText: {
        position: 'absolute',
        bottom: 80,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: COLORS.textPrimary,
    },
});
