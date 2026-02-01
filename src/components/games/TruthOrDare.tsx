import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, MessageCircle, AlertTriangle } from 'lucide-react-native';

interface TruthOrDareProps {
    onComplete: (success: boolean) => void;
}

type Mode = 'setup' | 'play';
type Choice = 'truth' | 'dare';

export const TruthOrDare: React.FC<TruthOrDareProps> = ({ onComplete }) => {
    const [mode, setMode] = useState<Mode>('setup');
    const [customTruth, setCustomTruth] = useState('');
    const [customDare, setCustomDare] = useState('');

    // Play state
    const [revealedQ, setRevealedQ] = useState<string | null>(null);

    const handleStartGame = () => {
        if (!customTruth.trim() || !customDare.trim()) {
            Alert.alert('Incomplete', 'Please fill in both fields.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMode('play');
    };

    const handleChoice = (choice: Choice) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (choice === 'truth') {
            setRevealedQ(customTruth);
        } else {
            setRevealedQ(customDare);
        }
    };

    const handleDone = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete(true);
    };

    if (mode === 'setup') {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Pressable style={styles.backButton}>
                            <ArrowLeft size={24} color={COLORS.textSecondary} />
                        </Pressable>
                        <Text style={styles.headerTitle}>Truth or Dare</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <Text style={styles.subtext}>✨ Playing with Match</Text>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.instruction}>
                        Write a Truth question and a Dare challenge for your match.
                    </Text>

                    {/* Truth Input Card */}
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Truth Question</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter truth question..."
                            placeholderTextColor={COLORS.textMuted}
                            value={customTruth}
                            onChangeText={setCustomTruth}
                            multiline
                            maxLength={120}
                        />
                    </View>

                    {/* Dare Input Card */}
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Dare Challenge</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter dare challenge..."
                            placeholderTextColor={COLORS.textMuted}
                            value={customDare}
                            onChangeText={setCustomDare}
                            multiline
                            maxLength={120}
                        />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Pressable style={styles.submitButton} onPress={handleStartGame}>
                        <Text style={styles.submitButtonText}>Submit Questions</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // Play Mode
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={{ width: 24 }} />
                    <Text style={styles.headerTitle}>Truth or Dare</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.subtext}>Waiting for them to choose...</Text>
            </View>

            <View style={styles.playContent}>
                {!revealedQ ? (
                    <View style={styles.choiceGrid}>
                        <Pressable
                            style={[styles.choiceCard, { borderColor: COLORS.neonCyan }]}
                            onPress={() => handleChoice('truth')}
                        >
                            <MessageCircle size={40} color={COLORS.neonCyan} />
                            <Text style={styles.choiceText}>TRUTH</Text>
                        </Pressable>

                        <Text style={styles.orText}>OR</Text>

                        <Pressable
                            style={[styles.choiceCard, { borderColor: COLORS.electricMagenta }]}
                            onPress={() => handleChoice('dare')}
                        >
                            <AlertTriangle size={40} color={COLORS.electricMagenta} />
                            <Text style={styles.choiceText}>DARE</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.revealContainer}>
                        <Text style={styles.revealLabel}>THEY CHOSE...</Text>
                        <View style={styles.revealedCard}>
                            <Text style={styles.questionText}>"{revealedQ}"</Text>
                        </View>

                        <Pressable style={[styles.submitButton, { marginTop: SPACING.xl }]} onPress={handleDone}>
                            <Text style={styles.submitButtonText}>Game Complete</Text>
                        </Pressable>
                    </View>
                )}

                <Text style={styles.demoNote}>*Simulated: Tap to see the question you wrote</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D15', // Dark background like screenshot
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    backButton: {
        padding: 4,
        backgroundColor: '#1E1E26',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtext: {
        fontSize: 14,
        color: '#8E8E9A',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    instruction: {
        color: '#8E8E9A',
        fontSize: 14,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    inputCard: {
        backgroundColor: '#151520',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    inputLabel: {
        color: '#8E8E9A',
        fontSize: 12,
        marginBottom: SPACING.xs,
    },
    input: {
        color: '#FFFFFF',
        fontSize: 16,
        minHeight: 40,
    },
    footer: {
        padding: SPACING.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    submitButton: {
        backgroundColor: '#A0522D', // Earthy orange/brown matching screenshot style
        borderRadius: 24,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Play Styles
    playContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
    },
    choiceGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    choiceCard: {
        width: '42%',
        aspectRatio: 0.8,
        backgroundColor: '#151520',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        gap: SPACING.md,
    },
    choiceText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    orText: {
        color: '#444455',
        fontSize: 16,
        fontWeight: 'bold',
    },
    revealContainer: {
        alignItems: 'center',
        width: '100%',
    },
    revealLabel: {
        color: '#8E8E9A',
        fontSize: 14,
        marginBottom: SPACING.md,
        letterSpacing: 2,
    },
    revealedCard: {
        width: '100%',
        backgroundColor: '#151520',
        padding: SPACING.xl,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2D2D3A',
        alignItems: 'center',
    },
    questionText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 30,
    },
    demoNote: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        color: '#444455',
        fontSize: 12,
    },
});
