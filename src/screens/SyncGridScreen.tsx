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
import { Grid3X3 } from 'lucide-react-native';
import { SyncGrid } from '../components/games/SyncGrid';
import { staminaService } from '../services/StaminaService';

type Props = NativeStackScreenProps<RootStackParamList, 'SyncGrid'>;

export const SyncGridScreen: React.FC<Props> = ({ navigation, route }) => {
    const { roomId, partnerId } = route.params;
    const [matchCount, setMatchCount] = useState(0);
    const { showInstructions, dismissInstructions } = useGameInstructions('syncGrid');

    const handleOpenChat = useCallback(() => {
        navigation.replace('Chat', {
            matchId: partnerId,
            matchName: 'Match', // ideally fetch name
            matchImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        });
    }, [navigation, partnerId]);

    const handleGameComplete = useCallback(async (matches: number) => {
        navigation.replace('Chat', {
            matchId: partnerId,
            matchName: 'Match', // ideally fetch name
            matchImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
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
                <Text style={styles.title}>Sync Grid</Text>
                <View style={styles.placeholder} />
                {/* Game Instructions */}
                <GameInstructionsModal
                    visible={showInstructions}
                    onClose={dismissInstructions}
                    title="Sync Grid"
                    description="Tap the highlighted tiles to match the pattern. Sync up with your partner to clear the blur!"
                    icon={<Grid3X3 size={32} color={COLORS.neonCyan} />}
                />
            </View>
            {/* Game */}
            <SyncGrid
                roomId={roomId}
                partnerId={partnerId}
                partnerImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
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

export default SyncGridScreen;
