import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface Props {
    isDemoMode: boolean;
    onToggle: (value: boolean) => void;
}

export const DemoModeToggle: React.FC<Props> = ({ isDemoMode, onToggle }) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.label}>
                    {isDemoMode ? '🎮 Demo Mode' : '🔴 Live Mode'}
                </Text>
                <Switch
                    value={isDemoMode}
                    onValueChange={onToggle}
                    trackColor={{ false: COLORS.neonCyan, true: COLORS.surface }}
                    thumbColor={isDemoMode ? COLORS.textPrimary : COLORS.neonCyan}
                />
            </View>
            <Text style={styles.description}>
                {isDemoMode
                    ? 'Using mock data for testing'
                    : 'Using real Firebase fragments'
                }
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        right: SPACING.md,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
        },
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    description: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
});
