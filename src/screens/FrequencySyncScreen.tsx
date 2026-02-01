import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../types';
import { GameInstructionsModal } from '../components/modals/GameInstructionsModal';
import { useGameInstructions } from '../hooks/useGameInstructions';
import { Activity } from 'lucide-react-native';
import { FrequencySync } from '../components/games/FrequencySync';
import { staminaService } from '../services/StaminaService';

type Props = NativeStackScreenProps<RootStackParamList, 'FrequencySync'>;

export const FrequencySyncScreen: React.FC<Props> = ({ navigation, route }) => {
    const { roomId, partnerId } = route.params;
    const [syncScore, setSyncScore] = useState(0);
    const { showInstructions, dismissInstructions } = useGameInstructions('frequencySync');

    const handleOpenChat = useCallback(() => {
        navigation.replace('Chat', {
            matchId: partnerId,
            matchName: 'Match',
            matchImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        });
    }, [navigation, partnerId]);

    const handleGameComplete = useCallback(async (score: number) => {
        setSyncScore(score);

        // Record game in stamina - Frequency Sync always reveals if completed
        await staminaService.recordGame('frequencySync', partnerId, 'win');

        navigation.replace('Chat', {
            matchId: partnerId,
            matchName: 'Match',
            matchImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        });
    }, [navigation, partnerId]);

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Frequency Sync</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Game Instructions */}
            <GameInstructionsModal
                visible={showInstructions}
                onClose={dismissInstructions}
                title="Frequency Sync"
                description="Move the slider to find the resonance point. Hold it steady when the waves align to sync up!"
                icon={<Activity size={32} color={COLORS.neonCyan} />}
            />

            {/* Game */}
            <FrequencySync
                roomId={roomId}
                partnerId={partnerId}
                partnerImage="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
                onGameComplete={handleGameComplete}
                onOpenChat={handleOpenChat}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        padding: SPACING.sm,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 40,
    },
});

export default FrequencySyncScreen;
