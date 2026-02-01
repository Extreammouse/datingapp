import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert } from 'react-native';
import { useResonanceStore } from '../store/useResonanceStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { PatternSync } from '../components/games/PatternSync';
import { BarResponse } from '../components/games/BarResponse';
import { RapidFire } from '../components/games/RapidFire';
import { Check, X } from 'lucide-react-native';
import { Pressable } from 'react-native';

// Games: 0=PatternSync, 1=BarResponse, 2=RapidFire, 3=Vote
const TOTAL_GAMES = 3;

export const GameGauntletScreen: React.FC = ({ navigation, route }: any) => {
    const { partnerId } = route.params;
    const { collectFragment } = useResonanceStore();
    const [stage, setStage] = useState(0); // 0, 1, 2 = Games, 3 = Vote
    const [gameWins, setGameWins] = useState(0);

    // Allow back with confirmation
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            Alert.alert(
                'Leave Game?',
                'Your progress will be lost.',
                [
                    { text: 'Stay', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() }
                ]
            );
            return true; // Prevent default back
        });
        return () => backHandler.remove();
    }, [navigation]);

    const handleGameComplete = (success: boolean) => {
        if (success) setGameWins(w => w + 1);

        // Move to next game or vote
        if (stage < TOTAL_GAMES - 1) {
            setStage(s => s + 1);
        } else {
            setStage(TOTAL_GAMES); // Go to vote screen
        }
    };

    const handleFinalVote = (connect: boolean) => {
        if (connect) {
            // Mark all fragments as collected for this partner
            // This is a simplification - in real app, you'd track per-fragment
            Alert.alert('Resonance Confirmed', 'You matched! Chat unlocked forever.', [
                { text: 'Go to Chat', onPress: () => navigation.navigate('Chat', { matchId: partnerId, matchName: 'Unlocked Match' }) }
            ]);
        } else {
            Alert.alert('Link Severed', 'You chose to disconnect.', [
                { text: 'Exit', onPress: () => navigation.popToTop() }
            ]);
        }
    };

    const renderContent = () => {
        switch (stage) {
            case 0: return <PatternSync onComplete={handleGameComplete} />;
            case 1: return <BarResponse onComplete={handleGameComplete} />;
            case 2: return <RapidFire onComplete={handleGameComplete} />;
            case 3:
                return (
                    <View style={styles.voteContainer}>
                        <Text style={styles.voteTitle}>FINAL RESONANCE CHECK</Text>
                        <Text style={styles.voteSubtitle}>
                            Games Won: {gameWins}/{TOTAL_GAMES}
                        </Text>

                        <View style={styles.voteButtons}>
                            <Pressable
                                style={[styles.voteBtn, styles.voteReject]}
                                onPress={() => handleFinalVote(false)}
                            >
                                <X size={32} color={COLORS.textPrimary} />
                                <Text style={styles.voteBtnText}>FADE</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.voteBtn, styles.voteAccept]}
                                onPress={() => handleFinalVote(true)}
                            >
                                <Check size={32} color={COLORS.background} />
                                <Text style={[styles.voteBtnText, { color: COLORS.background }]}>RESONATE</Text>
                            </Pressable>
                        </View>
                    </View>
                );
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.header}>
                <View style={[styles.stepDot, stage >= 0 && styles.stepActive]} />
                <View style={styles.stepLine} />
                <View style={[styles.stepDot, stage >= 2 && styles.stepActive]} />
                <View style={styles.stepLine} />
                <View style={[styles.stepDot, stage >= 4 && styles.stepActive]} />
            </View>

            <View style={styles.content}>
                {renderContent()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.surfaceLight,
    },
    stepActive: {
        backgroundColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
        shadowRadius: 10,
        shadowOpacity: 1,
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: COLORS.surfaceLight,
    },
    content: {
        flex: 1,
    },
    interludeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xl,
    },
    pulseRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.neonCyanDim,
    },
    interludeTitle: {
        color: COLORS.neonCyan,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    timer: {
        fontSize: 64,
        fontWeight: '900',
        color: COLORS.textPrimary,
    },
    interludeHint: {
        color: COLORS.textMuted,
        fontSize: 14,
    },
    voteContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    voteTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        letterSpacing: 2,
        textAlign: 'center',
    },
    voteSubtitle: {
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
        fontSize: 16,
    },
    voteButtons: {
        flexDirection: 'row',
        gap: SPACING.xl,
    },
    voteBtn: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        borderWidth: 1,
    },
    voteReject: {
        borderColor: COLORS.error,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
    },
    voteAccept: {
        borderColor: COLORS.success,
        backgroundColor: COLORS.success,
    },
    voteBtnText: {
        fontWeight: 'bold',
        letterSpacing: 1,
        color: COLORS.textPrimary,
    },
});
