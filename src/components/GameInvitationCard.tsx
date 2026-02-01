import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Gamepad2, MessageCircle, Zap, Trophy, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface GameInvitationCardProps {
    gameName: string;
    onPress: () => void;
}

const GAME_CONFIGS: Record<string, { color: string; icon: any; displayName: string; previewImage?: any }> = {
    'Truth or Dare': {
        color: '#FF6B9D',
        icon: MessageCircle,
        displayName: 'TRUTH OR DARE',
        previewImage: require('../../assets/images/truth_dare_preview.png')
    },
    'This or That': {
        color: '#00D4FF',
        icon: Zap,
        displayName: 'THIS OR THAT',
        previewImage: require('../../assets/images/this_that_preview.png')
    },
    'Tug of War': {
        color: '#FFB800',
        icon: Trophy,
        displayName: 'TUG OF WAR',
        previewImage: require('../../assets/images/tug_war_preview.png')
    },
    'Rapid Fire': { color: '#FF3B30', icon: Zap, displayName: 'RAPID FIRE' },
    'Sync Grid': { color: '#34C759', icon: Gamepad2, displayName: 'SYNC GRID' },
    'Pattern Match': { color: '#AF52DE', icon: Gamepad2, displayName: 'PATTERN MATCH' },
};

export const GameInvitationCard: React.FC<GameInvitationCardProps> = ({ gameName, onPress }) => {
    const config = GAME_CONFIGS[gameName] || GAME_CONFIGS['Truth or Dare'];
    const IconComponent = config.icon;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: config.color + '10', borderColor: config.color + '30' },
                pressed && styles.pressed,
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
        >
            {/* Game Preview Area */}
            <View style={styles.previewArea}>
                {config.previewImage ? (
                    <Image
                        source={config.previewImage}
                        style={styles.previewImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.iconFallback, { backgroundColor: config.color + '20' }]}>
                        <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
                            <IconComponent size={40} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                    </View>
                )}

                {/* Play Button Overlay */}
                <View style={[styles.playButton, { backgroundColor: config.color }]}>
                    <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                </View>
            </View>

            {/* Game Title */}
            <View style={styles.footer}>
                <Text style={styles.gameTitle}>{config.displayName}</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 280,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        marginVertical: SPACING.sm,
        ...SHADOWS.medium,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    previewArea: {
        height: 140,
        position: 'relative',
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    iconFallback: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.large,
    },
    playButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.medium,
    },
    footer: {
        backgroundColor: COLORS.surface,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
    },
    gameTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        letterSpacing: 1,
    },
});
