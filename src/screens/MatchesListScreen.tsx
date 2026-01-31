import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Image,
    SafeAreaView,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { MessageCircle, Heart, Sparkles } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

interface Match {
    id: string;
    name: string;
    image?: string;
    lastMessage?: string;
    lastMessageTime?: number;
    unreadCount: number;
    isOnline: boolean;
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
    {
        id: '2',
        name: 'Jordan',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        lastMessage: 'That was so fun!',
        lastMessageTime: Date.now() - 3600000,
        unreadCount: 0,
        isOnline: false,
    },
    {
        id: '3',
        name: 'Sam',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
        lastMessage: "Let's play again soon",
        lastMessageTime: Date.now() - 86400000,
        unreadCount: 0,
        isOnline: true,
    },
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

    const handleMatchPress = (match: Match) => {
        navigation.navigate('Chat', {
            matchId: match.id,
            matchName: match.name,
            matchImage: match.image,
        });
    };

    const renderMatch = ({ item, index }: { item: Match; index: number }) => (
        <Animated.View entering={FadeInRight.delay(index * 100).duration(300)}>
            <Pressable
                style={styles.matchCard}
                onPress={() => handleMatchPress(item)}
            >
                {/* Avatar */}
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

                {/* Info */}
                <View style={styles.matchInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.matchName}>{item.name}</Text>
                        {item.lastMessageTime && (
                            <Text style={styles.timeText}>
                                {formatTime(item.lastMessageTime)}
                            </Text>
                        )}
                    </View>
                    {item.lastMessage && (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                    )}
                </View>

                {/* Unread badge */}
                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Sparkles size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Matches Yet</Text>
            <Text style={styles.emptySubtitle}>
                Play some games to reveal profiles and make connections!
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <MessageCircle size={28} color={COLORS.neonCyan} />
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            {/* Matches List */}
            <FlatList
                data={matches}
                renderItem={renderMatch}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
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
        gap: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    listContent: {
        padding: SPACING.md,
        flexGrow: 1,
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: SPACING.lg,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
});

export default MatchesListScreen;
