import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
    Modal,
} from 'react-native';
import { X, Swords, Grid3X3, Radio } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface GameSelectionScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GameSelection'>;
    route: { params: { partnerId: string } };
}

export const GameSelectionScreen: React.FC<GameSelectionScreenProps> = ({ navigation, route }) => {
    const partnerId = route.params?.partnerId || 'demo_partner';

    const handleGameSelect = (gameType: 'TugOfWar' | 'SyncGrid' | 'FrequencySync') => {
        const roomId = `room_${Date.now()}`;

        navigation.replace(gameType, {
            roomId,
            partnerId,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Choose a Game</Text>
                <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X size={24} color={COLORS.textPrimary} />
                </Pressable>
            </View>

            {/* Game Options */}
            <View style={styles.gamesContainer}>
                {/* Tug of War */}
                <Pressable
                    style={styles.gameCard}
                    onPress={() => handleGameSelect('TugOfWar')}
                >
                    <View style={[styles.gameIcon, { backgroundColor: COLORS.electricMagentaDim }]}>
                        <Swords size={40} color={COLORS.electricMagenta} />
                    </View>
                    <Text style={styles.gameTitle}>Tug of War</Text>
                    <Text style={styles.gameDescription}>
                        Pull the rope to reveal each other's bio tags!
                    </Text>
                </Pressable>

                {/* Sync Grid */}
                <Pressable
                    style={styles.gameCard}
                    onPress={() => handleGameSelect('SyncGrid')}
                >
                    <View style={[styles.gameIcon, { backgroundColor: COLORS.neonCyanDim }]}>
                        <Grid3X3 size={40} color={COLORS.neonCyan} />
                    </View>
                    <Text style={styles.gameTitle}>Sync Grid</Text>
                    <Text style={styles.gameDescription}>
                        Match patterns together to sync up!
                    </Text>
                </Pressable>

                {/* Frequency Sync */}
                <Pressable
                    style={styles.gameCard}
                    onPress={() => handleGameSelect('FrequencySync')}
                >
                    <View style={[styles.gameIcon, { backgroundColor: 'rgba(138, 43, 226, 0.2)' }]}>
                        <Radio size={40} color="#8A2BE2" />
                    </View>
                    <Text style={styles.gameTitle}>Frequency Sync</Text>
                    <Text style={styles.gameDescription}>
                        Tune into the same wavelength together!
                    </Text>
                </Pressable>
            </View>
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
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: SPACING.sm,
    },
    gamesContainer: {
        flex: 1,
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    gameCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        gap: SPACING.md,
    },
    gameIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    gameDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default GameSelectionScreen;
