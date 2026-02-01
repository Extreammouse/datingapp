import React, { useCallback, useState, useEffect } from 'react';
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
import { GameInstructionsModal } from '../components/modals/GameInstructionsModal';
import { useGameInstructions } from '../hooks/useGameInstructions';
import { MessageCircle } from 'lucide-react-native';
import { TugOfWar } from '../components/games/TugOfWar';
import { staminaService } from '../services/StaminaService';
import { databaseService } from '../services/DatabaseService';

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

    const handleOpenChat = useCallback(() => {
        navigation.replace('Chat', {
            matchId: partnerId,
            matchName: 'Match', // ideally fetch name
            matchImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        });
    }, [navigation, partnerId]);
    const [revealedTags, setRevealedTags] = useState<BioTag[]>([]);
    const { showInstructions, dismissInstructions } = useGameInstructions('tugOfWar');
    const [userGender, setUserGender] = useState<'male' | 'female' | 'other'>('other');

    useEffect(() => {
        const fetchGender = async () => {
            const profile = await databaseService.getUserProfile();
            if (profile?.gender) {
                setUserGender(profile.gender);
            }
        };
        fetchGender();
    }, []);

    const handleGameComplete = useCallback(async (userWon: boolean, finalRevealedTags: BioTag[]) => {
        setGameCompleted(true);

        // Record game in stamina
        await staminaService.recordGame('tugOfWar', partnerId, userWon ? 'win' : 'loss');

        // Navigate to profile after delay
        // Auto-navigation removed to allow manual Message action
        // setTimeout(() => {
        //     navigation.replace('Profile', {
        //         userId: partnerId,
        //         revealed: won || revealedTags.length >= 2,
        //     });
        // }, 2000);
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
            {/* Game Instructions */}
            <GameInstructionsModal
                visible={showInstructions}
                onClose={dismissInstructions}
                title="Tug of War"
                description="Tap as fast as you can to pull the rope! Win to reveal your match's hidden interests."
                icon={<MessageCircle size={32} color={COLORS.neonCyan} />}
            />

            {/* Game */}
            <TugOfWar
                roomId={roomId}
                partnerId={partnerId}
                partnerImage="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
                bioTags={MOCK_BIO_TAGS}
                userGender={userGender}
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

export default TugOfWarScreen;
