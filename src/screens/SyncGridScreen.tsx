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
import { SyncGrid } from '../components/games/SyncGrid';
import { staminaService } from '../services/StaminaService';

type Props = NativeStackScreenProps<RootStackParamList, 'SyncGrid'>;

export const SyncGridScreen: React.FC<Props> = ({ navigation, route }) => {
    const { roomId, partnerId } = route.params;
    const [gameCompleted, setGameCompleted] = useState(false);

    const handleGameComplete = useCallback(async (matchCount: number) => {
        setGameCompleted(true);

        // Record game in stamina
        const result = matchCount >= 5 ? 'win' : matchCount >= 3 ? 'draw' : 'loss';
        await staminaService.recordGame('syncGrid', partnerId, result);

        // Navigate to profile after delay
        setTimeout(() => {
            navigation.replace('Profile', {
                userId: partnerId,
                revealed: matchCount >= 5,
            });
        }, 2000);
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
            </View>

            {/* Game */}
            <SyncGrid
                roomId={roomId}
                partnerId={partnerId}
                partnerImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                onGameComplete={handleGameComplete}
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
