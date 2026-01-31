import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Pressable,
} from 'react-native';
import { Zap, Battery, Clock, MessageCircle } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { User, GameType } from '../types';
import { HuddleStack } from '../components/HuddleStack';
import { staminaService } from '../services/StaminaService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Mock users for demo
const MOCK_USERS: User[] = [
    {
        id: '1',
        name: 'Alex',
        age: 26,
        bio: 'Adventure seeker and coffee enthusiast',
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        bioTags: [
            { id: '1', label: 'Likes Hiking', revealed: false },
            { id: '2', label: 'Coffee Lover', revealed: false },
            { id: '3', label: 'Dog Person', revealed: false },
        ],
    },
    {
        id: '2',
        name: 'Jordan',
        age: 28,
        bio: 'Music producer by day, stargazer by night',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        bioTags: [
            { id: '1', label: 'Music Producer', revealed: false },
            { id: '2', label: 'Night Owl', revealed: false },
            { id: '3', label: 'Vinyl Collector', revealed: false },
        ],
    },
    {
        id: '3',
        name: 'Sam',
        age: 24,
        bio: 'Yoga instructor with a passion for travel',
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        bioTags: [
            { id: '1', label: 'Yoga Teacher', revealed: false },
            { id: '2', label: 'World Traveler', revealed: false },
            { id: '3', label: 'Vegan', revealed: false },
        ],
    },
];

interface HomeScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [stamina, setStamina] = useState({
        remaining: 3,
        total: 3,
        percentage: 100,
        timeUntilReset: '24h 0m',
    });

    // Initialize stamina service
    useEffect(() => {
        const initStamina = async () => {
            await staminaService.initialize();
            updateStaminaDisplay();
        };
        initStamina();
    }, []);

    const updateStaminaDisplay = () => {
        setStamina(staminaService.getStaminaDisplay());
    };

    const handleStartGame = useCallback((user: User, gameType: GameType) => {
        if (!staminaService.canPlay()) {
            // Show stamina depleted message
            return;
        }

        // Generate a room ID (in production, this would come from the server)
        const roomId = `room_${Date.now()}_${user.id}`;

        // Navigate to the appropriate game screen
        switch (gameType) {
            case 'tugOfWar':
                navigation.navigate('TugOfWar', { roomId, partnerId: user.id });
                break;
            case 'syncGrid':
                navigation.navigate('SyncGrid', { roomId, partnerId: user.id });
                break;
            case 'frequencySync':
                navigation.navigate('FrequencySync', { roomId, partnerId: user.id });
                break;
        }
    }, [navigation]);

    const handleSwipe = useCallback((user: User, direction: 'left' | 'right') => {
        // Remove the swiped user from the stack
        setUsers((prev) => prev.filter((u) => u.id !== user.id));

        if (direction === 'right') {
            console.log('Liked:', user.name);
            // In production: send like to server
        } else {
            console.log('Passed:', user.name);
            // In production: record pass
        }
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Zap size={28} color={COLORS.neonCyan} />
                    <Text style={styles.logoText}>Resonance</Text>
                </View>

                <View style={styles.headerRight}>
                    {/* Messages button */}
                    <Pressable
                        style={styles.messagesButton}
                        onPress={() => navigation.navigate('MatchesList')}
                    >
                        <MessageCircle size={24} color={COLORS.electricMagenta} />
                    </Pressable>

                    {/* Stamina indicator */}
                    <View style={styles.staminaContainer}>
                        <Battery size={18} color={COLORS.neonCyan} />
                        <View style={styles.staminaBar}>
                            <View
                                style={[
                                    styles.staminaFill,
                                    { width: `${stamina.percentage}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.staminaText}>
                            {stamina.remaining}/{stamina.total}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Stamina warning if low */}
            {stamina.remaining === 0 && (
                <View style={styles.staminaWarning}>
                    <Clock size={16} color={COLORS.warning} />
                    <Text style={styles.staminaWarningText}>
                        Resets in {stamina.timeUntilReset}
                    </Text>
                </View>
            )}

            {/* Huddle Stack */}
            <View style={styles.stackWrapper}>
                <HuddleStack
                    users={users}
                    onStartGame={handleStartGame}
                    onSwipe={handleSwipe}
                />
            </View>

            {/* Footer hint */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {stamina.remaining > 0
                        ? 'Choose a game to reveal their profile'
                        : 'Come back when your stamina recharges'}
                </Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    messagesButton: {
        padding: SPACING.sm,
    },
    staminaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    staminaBar: {
        width: 60,
        height: 8,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 4,
        overflow: 'hidden',
    },
    staminaFill: {
        height: '100%',
        backgroundColor: COLORS.neonCyan,
        borderRadius: 4,
    },
    staminaText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    staminaWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
    },
    staminaWarningText: {
        color: COLORS.warning,
        fontSize: 14,
    },
    stackWrapper: {
        flex: 1,
        paddingTop: SPACING.md,
    },
    footer: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: 14,
    },
});

export default HomeScreen;
