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
import { RootStackParamList, BioTag } from '../types';
import { TugOfWar } from '../components/games/TugOfWar';
import { staminaService } from '../services/StaminaService';

type Props = NativeStackScreenProps<RootStackParamList, 'TugOfWar'>;

// Mock bio tags for demo
const MOCK_BIO_TAGS: BioTag[] = [
    { id: '1', label: 'Likes Hiking', revealed: false },
    { id: '2', label: 'Coffee Lover', revealed: false },
    { id: '3', label: 'Dog Person', revealed: false },
];

export const TugOfWarScreen: React.FC<Props> = ({ navigation, route }) => {
    const { roomId, partnerId } = route.params;
    const [gameCompleted, setGameCompleted] = useState(false);

    const handleGameComplete = useCallback(async (won: boolean, revealedTags: BioTag[]) => {
        setGameCompleted(true);

        // Record game in stamina
        await staminaService.recordGame('tugOfWar', partnerId, won ? 'win' : 'loss');

        // Navigate to profile after delay
        setTimeout(() => {
            navigation.replace('Profile', {
                userId: partnerId,
                revealed: won || revealedTags.length >= 2,
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
                <Text style={styles.title}>Tug of War</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Game */}
            <TugOfWar
                roomId={roomId}
                partnerId={partnerId}
                partnerImage="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
                bioTags={MOCK_BIO_TAGS}
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

export default TugOfWarScreen;
