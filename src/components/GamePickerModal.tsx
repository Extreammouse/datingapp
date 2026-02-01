import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { X, Gamepad2, MessageCircle, Zap, Trophy } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GamePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectGame: (gameName: string) => void;
    matchName: string;
}

const GAMES = [
    { id: '1', name: 'Truth or Dare', icon: MessageCircle, color: '#FF6B9D' },
    { id: '2', name: 'This or That', icon: Zap, color: '#00D4FF' },
    { id: '3', name: 'Tug of War', icon: Trophy, color: '#FFB800' },
    { id: '4', name: 'Rapid Fire', icon: Zap, color: '#FF3B30' },
    { id: '5', name: 'Sync Grid', icon: Gamepad2, color: '#34C759' },
    { id: '6', name: 'Pattern Match', icon: Gamepad2, color: '#AF52DE' },
];

export const GamePickerModal: React.FC<GamePickerModalProps> = ({
    visible,
    onClose,
    onSelectGame,
    matchName,
}) => {
    const handleSelectGame = (gameName: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelectGame(gameName);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.backdrop}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Bottom Sheet */}
            <Animated.View
                entering={SlideInDown.duration(300).springify()}
                exiting={SlideOutDown.duration(200)}
                style={styles.bottomSheet}
            >
                {/* Handle */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>🎮 Games</Text>
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <X size={24} color={COLORS.textSecondary} />
                    </Pressable>
                </View>

                {/* Subtitle */}
                <Text style={styles.subtitle}>Choose a game to play with {matchName}</Text>

                {/* Games Grid */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.gamesGrid}
                    showsVerticalScrollIndicator={false}
                >
                    {GAMES.map((game) => {
                        const IconComponent = game.icon;
                        return (
                            <Pressable
                                key={game.id}
                                style={({ pressed }) => [
                                    styles.gameCard,
                                    { backgroundColor: game.color + '15' },
                                    pressed && styles.gameCardPressed,
                                ]}
                                onPress={() => handleSelectGame(game.name)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: game.color }]}>
                                    <IconComponent size={28} color="#FFFFFF" strokeWidth={2.5} />
                                </View>
                                <Text style={styles.gameName} numberOfLines={2}>
                                    {game.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.65,
        paddingBottom: 40,
        ...SHADOWS.large,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    scrollView: {
        flex: 1,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.lg,
        gap: SPACING.md,
    },
    gameCard: {
        width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.md * 2) / 3, // 3 columns
        aspectRatio: 0.9,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        ...SHADOWS.subtle,
    },
    gameCardPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
        ...SHADOWS.medium,
    },
    gameName: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
});
