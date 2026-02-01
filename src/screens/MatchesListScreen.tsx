import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Image,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { MessageCircle, Heart, Sparkles, Radio, ArrowRight, X, Check } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useResonanceStore } from '../store/useResonanceStore';

interface Match {
    id: string;
    name: string;
    image?: string;
    lastMessage?: string;
    lastMessageTime?: number;
    unreadCount: number;
    isOnline: boolean;
}

// Mock Signal (Pending Request)
interface Signal {
    id: string;
    name: string; // Hidden or Partial
    photo: string;
    progress: number; // 0-4 fragments
    isIncoming: boolean; // True if they are analyzing YOU
}

// Mock matches data
const MOCK_MATCHES: Match[] = [
    {
        id: '1',
        name: 'Alex',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        lastMessage: 'Hey! Great game earlier 🎮',
        lastMessageTime: Date.now() - 300000,
        unreadCount: 2,
        isOnline: true,
    },
];

const MOCK_SIGNALS: Signal[] = [
    {
        id: 's1',
        name: 'Mystery Signal',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
        progress: 3,
        isIncoming: true,
    },
    {
        id: 's2',
        name: 'Target: Jordan',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        progress: 2,
        isIncoming: false, // You are analyzing them
    }
];

interface MatchesListScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList, 'MatchesList'>;
}

const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
};

export const MatchesListScreen: React.FC<MatchesListScreenProps> = ({ navigation }) => {
    const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
    const { nearbyProfiles } = useResonanceStore();

    // Compute signals from nearby profiles - only show if at least 1 shard collected
    const signals: Signal[] = nearbyProfiles
        .filter(profile => profile.fragments.some(f => f.isCollected))
        .map(profile => ({
            id: profile.id,
            name: profile.isUnlocked ? profile.name : 'Mystery Signal',
            photo: profile.photo,
            progress: profile.fragments.filter(f => f.isCollected).length,
            isIncoming: true, // For demo, all are incoming
        }));

    const handleMatchPress = (match: Match) => {
        navigation.navigate('Chat', {
            matchId: match.id,
            matchName: match.name,
            matchImage: match.image,
        });
    };

    const handleSignalPress = (signal: Signal) => {
        if (signal.progress === 4) {
            // All shards collected - can view profile or challenge
            navigation.navigate('Profile', { userId: signal.id, revealed: true });
        } else {
            // Not all shards collected - show profile with progress, no games yet
            navigation.navigate('Profile', { userId: signal.id, revealed: false });
        }
    };

    const renderSignal = (signal: Signal, index: number) => {
        const isReady = signal.progress === 4;
        return (
            <Pressable
                key={signal.id}
                style={styles.signalCard}
                onPress={() => handleSignalPress(signal)}
            >
                <View style={styles.signalPhotoContainer}>
                    <Image
                        source={{ uri: signal.photo }}
                        style={styles.signalPhoto}
                        blurRadius={isReady ? 0 : 10}
                    />
                    <View style={styles.signalIconOverlay}>
                        <Radio size={14} color={COLORS.background} />
                    </View>
                </View>

                <View style={styles.signalInfo}>
                    <Text style={styles.signalTitle}>
                        {signal.isIncoming ? "Incoming Resonance" : "Analyzing Target"}
                    </Text>
                    <Text style={styles.signalSubtitle}>
                        {isReady ? "Encrypted Channel Open" : `Decrypting... ${signal.progress}/4 Shards`}
                    </Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(signal.progress / 4) * 100}%` }]} />
                    </View>
                </View>

                {isReady && signal.isIncoming ? (
                    <View style={styles.actionRow}>
                        <Pressable
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => {
                                // Remove from signals (in real app, would call API)
                                Alert.alert('Challenge Declined', 'You rejected this challenge.');
                            }}
                        >
                            <X size={16} color={COLORS.textPrimary} />
                        </Pressable>
                        <Pressable
                            style={[styles.actionBtn, styles.acceptBtn]}
                            onPress={() => {
                                // Accept and start game gauntlet
                                navigation.navigate('GameGauntlet', { partnerId: signal.id });
                            }}
                        >
                            <Check size={16} color={COLORS.background} />
                        </Pressable>
                    </View>
                ) : (
                    <Text style={styles.percentText}>{Math.round((signal.progress / 4) * 100)}%</Text>
                )}
            </Pressable>
        );
    };

    const renderMatch = ({ item, index }: { item: Match; index: number }) => (
        <Animated.View entering={FadeInRight.delay(index * 100).duration(300)}>
            <Pressable
                style={styles.matchCard}
                onPress={() => handleMatchPress(item)}
            >
                <View style={styles.avatarContainer}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Heart size={20} color={COLORS.electricMagenta} />
                        </View>
                    )}
                    {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.matchInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.matchName}>{item.name}</Text>
                        {item.lastMessageTime && (
                            <Text style={styles.timeText}>{formatTime(item.lastMessageTime)}</Text>
                        )}
                    </View>
                    {item.lastMessage && (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                    )}
                </View>

                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <MessageCircle size={24} color={COLORS.neonCyan} />
                <Text style={styles.headerTitle}>CONNECTIONS</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Signals Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>ACTIVE SIGNALS ({signals.length})</Text>
                </View>
                <View style={styles.signalsList}>
                    {signals.map((s, i) => renderSignal(s, i))}
                </View>

                {/* Matches Section */}
                <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
                    <Text style={styles.sectionTitle}>ENCRYPTED CHATS</Text>
                </View>
                <FlatList
                    data={matches}
                    renderItem={renderMatch}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false} // Nested inside ScrollView
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptySubtitle}>No active chats linked.</Text>
                    }
                />
            </ScrollView>
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
        gap: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.textPrimary,
        letterSpacing: 2,
    },
    content: {
        flex: 1,
    },
    sectionHeader: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    sectionTitle: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    signalsList: {
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
    },
    signalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        gap: SPACING.md,
    },
    signalPhotoContainer: {
        width: 50,
        height: 50,
    },
    signalPhoto: {
        width: 50,
        height: 50,
        borderRadius: BORDER_RADIUS.sm,
    },
    signalIconOverlay: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: COLORS.neonCyan,
        borderRadius: 10,
        padding: 2,
    },
    signalInfo: {
        flex: 1,
    },
    signalTitle: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    signalSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 10,
        marginBottom: 6,
    },
    progressBar: {
        height: 4,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    percentText: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectBtn: {
        backgroundColor: COLORS.surfaceLight,
    },
    acceptBtn: {
        backgroundColor: COLORS.success,
    },
    listContent: {
        padding: SPACING.md,
    },
    matchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.electricMagenta,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    matchInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    matchName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    timeText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.neonCyan,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xs,
    },
    unreadText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.background,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
});

export default MatchesListScreen;
