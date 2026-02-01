import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface GameInstructionsModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export const GameInstructionsModal: React.FC<GameInstructionsModalProps> = ({
    visible,
    onClose,
    title,
    description,
    icon,
}) => {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                <Animated.View
                    entering={ZoomIn.duration(300)}
                    exiting={ZoomOut.duration(200)}
                    style={styles.modalContainer}
                >
                    <View style={styles.card}>
                        {/* Header with Icon */}
                        <View style={styles.iconContainer}>
                            {icon || <Info size={32} color={COLORS.neonCyan} />}
                        </View>

                        <Text style={styles.title}>{title}</Text>

                        <View style={styles.divider} />

                        <Text style={styles.description}>
                            {description}
                        </Text>

                        <Pressable
                            style={styles.button}
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>Got it!</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: SPACING.xl,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        ...SHADOWS.medium,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    divider: {
        width: 40,
        height: 2,
        backgroundColor: COLORS.surfaceLight,
        marginBottom: SPACING.md,
        borderRadius: 1,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    button: {
        width: '100%',
        backgroundColor: COLORS.neonCyan,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        ...SHADOWS.neonCyan,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.background,
    },
});

export default GameInstructionsModal;
