import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Image,
    SafeAreaView,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    FadeInDown,
} from 'react-native-reanimated';
import { Send, ArrowLeft, Heart, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import socketService from '../services/SocketService';

export interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: number;
    type: 'text' | 'reaction' | 'system';
    reaction?: string;
}

interface ChatScreenProps {
    matchId: string;
    matchName: string;
    matchImage?: string;
    currentUserId: string;
    onBack: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Message bubble component
const MessageBubble: React.FC<{
    message: Message;
    isOwn: boolean;
    showAvatar: boolean;
    matchImage?: string;
}> = ({ message, isOwn, showAvatar, matchImage }) => {
    if (message.type === 'system') {
        return (
            <View style={styles.systemMessage}>
                <Sparkles size={14} color={COLORS.neonCyan} />
                <Text style={styles.systemMessageText}>{message.text}</Text>
            </View>
        );
    }

    if (message.type === 'reaction') {
        return (
            <View style={[styles.reactionBubble, isOwn && styles.reactionBubbleOwn]}>
                <Text style={styles.reactionEmoji}>{message.reaction}</Text>
            </View>
        );
    }

    return (
        <Animated.View
            entering={FadeInDown.duration(200).springify()}
            style={[styles.messageRow, isOwn && styles.messageRowOwn]}
        >
            {!isOwn && showAvatar && (
                <View style={styles.avatarContainer}>
                    {matchImage ? (
                        <Image source={{ uri: matchImage }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Heart size={12} color={COLORS.electricMagenta} />
                        </View>
                    )}
                </View>
            )}
            {!isOwn && !showAvatar && <View style={styles.avatarSpacer} />}

            <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.theirBubble]}>
                <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                    {message.text}
                </Text>
                <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
                    {formatTime(message.timestamp)}
                </Text>
            </View>
        </Animated.View>
    );
};

// Format timestamp
const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Quick reactions
const QUICK_REACTIONS = ['❤️', '😊', '🔥', '✨', '💫', '🎉'];

export const ChatScreen: React.FC<ChatScreenProps> = ({
    matchId,
    matchName,
    matchImage,
    currentUserId,
    onBack,
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'system-1',
            text: `You matched with ${matchName}! Start the conversation.`,
            senderId: 'system',
            timestamp: Date.now() - 60000,
            type: 'system',
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [showReactions, setShowReactions] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendButtonScale = useSharedValue(1);
    const inputFocused = useSharedValue(0);

    // Socket connection for real-time chat
    useEffect(() => {
        socketService.joinRoom(`chat_${matchId}`);
        return () => {
            socketService.leaveRoom();
        };
    }, [matchId]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    // Send message
    const handleSend = useCallback(() => {
        if (!inputText.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        sendButtonScale.value = withSpring(0.8, { damping: 10 }, () => {
            sendButtonScale.value = withSpring(1);
        });

        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            text: inputText.trim(),
            senderId: currentUserId,
            timestamp: Date.now(),
            type: 'text',
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputText('');
    }, [inputText, currentUserId, sendButtonScale]);

    // Send reaction
    const handleReaction = useCallback((emoji: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const reactionMessage: Message = {
            id: `reaction_${Date.now()}`,
            text: '',
            senderId: currentUserId,
            timestamp: Date.now(),
            type: 'reaction',
            reaction: emoji,
        };

        setMessages((prev) => [...prev, reactionMessage]);
        setShowReactions(false);
    }, [currentUserId]);

    // Animated styles
    const sendButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sendButtonScale.value }],
    }));

    const inputContainerStyle = useAnimatedStyle(() => ({
        borderColor: inputFocused.value
            ? COLORS.neonCyan
            : COLORS.surfaceLight,
    }));

    // Render message item
    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isOwn = item.senderId === currentUserId;
        const prevMessage = messages[index - 1];
        const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== item.senderId);

        return (
            <MessageBubble
                message={item}
                isOwn={isOwn}
                showAvatar={showAvatar}
                matchImage={matchImage}
            />
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={styles.backButton}>
                        <ArrowLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>

                    <View style={styles.headerInfo}>
                        {matchImage ? (
                            <Image source={{ uri: matchImage }} style={styles.headerAvatar} />
                        ) : (
                            <View style={styles.headerAvatarPlaceholder}>
                                <Heart size={16} color={COLORS.electricMagenta} />
                            </View>
                        )}
                        <View>
                            <Text style={styles.headerName}>{matchName}</Text>
                            <Text style={styles.headerStatus}>Online</Text>
                        </View>
                    </View>

                    <View style={styles.placeholder} />
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                />

                {/* Quick Reactions */}
                {showReactions && (
                    <Animated.View
                        entering={FadeInDown.duration(200)}
                        style={styles.reactionsContainer}
                    >
                        {QUICK_REACTIONS.map((emoji) => (
                            <Pressable
                                key={emoji}
                                style={styles.reactionButton}
                                onPress={() => handleReaction(emoji)}
                            >
                                <Text style={styles.reactionButtonEmoji}>{emoji}</Text>
                            </Pressable>
                        ))}
                    </Animated.View>
                )}

                {/* Input */}
                <Animated.View style={[styles.inputContainer, inputContainerStyle]}>
                    <Pressable
                        style={styles.reactionToggle}
                        onPress={() => setShowReactions(!showReactions)}
                    >
                        <Text style={styles.reactionToggleText}>😊</Text>
                    </Pressable>

                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                        maxLength={500}
                        onFocus={() => {
                            inputFocused.value = withTiming(1, { duration: 200 });
                            setShowReactions(false);
                        }}
                        onBlur={() => {
                            inputFocused.value = withTiming(0, { duration: 200 });
                        }}
                    />

                    <AnimatedPressable
                        style={[styles.sendButton, sendButtonStyle]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Send
                            size={20}
                            color={inputText.trim() ? COLORS.neonCyan : COLORS.textMuted}
                        />
                    </AnimatedPressable>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.electricMagenta,
    },
    headerAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    headerStatus: {
        fontSize: 12,
        color: COLORS.success,
    },
    placeholder: {
        width: 40,
    },
    messagesList: {
        padding: SPACING.md,
        paddingBottom: SPACING.lg,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: SPACING.sm,
        alignItems: 'flex-end',
    },
    messageRowOwn: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        marginRight: SPACING.sm,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarSpacer: {
        width: 36,
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
    },
    ownBubble: {
        backgroundColor: COLORS.neonCyan,
        borderBottomRightRadius: SPACING.xs,
    },
    theirBubble: {
        backgroundColor: COLORS.surface,
        borderBottomLeftRadius: SPACING.xs,
    },
    messageText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    ownMessageText: {
        color: COLORS.background,
    },
    messageTime: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
        alignSelf: 'flex-end',
    },
    ownMessageTime: {
        color: 'rgba(0, 0, 0, 0.5)',
    },
    systemMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.md,
    },
    systemMessageText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    reactionBubble: {
        alignSelf: 'flex-start',
        marginBottom: SPACING.sm,
        marginLeft: 36,
    },
    reactionBubbleOwn: {
        alignSelf: 'flex-end',
        marginLeft: 0,
    },
    reactionEmoji: {
        fontSize: 28,
    },
    reactionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
    },
    reactionButton: {
        padding: SPACING.sm,
    },
    reactionButtonEmoji: {
        fontSize: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight,
        gap: SPACING.sm,
    },
    reactionToggle: {
        padding: SPACING.sm,
    },
    reactionToggleText: {
        fontSize: 24,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        color: COLORS.textPrimary,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatScreen;
