import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { Fragment } from '../types';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const OVERLAY_SIZE = width - 40;

interface FragmentOverlayProps {
    photoUrl: string;
    fragments: Fragment[];
    isUnlocked: boolean;
}

export const FragmentOverlay: React.FC<FragmentOverlayProps> = ({ photoUrl, fragments, isUnlocked }) => {
    // We divide the image into 4 quadrants, each controlled by a fragment type
    // Top-Left: Interest, Top-Right: Tag, Bottom-Left: Silhouette, Bottom-Right: Name

    // Helper to get fragment by type
    const getFragmentState = (type: string) => fragments.find(f => f.type === type)?.isCollected || false;

    // Animation values for each quadrant opacity
    const opacTL = useSharedValue(1);
    const opacTR = useSharedValue(1);
    const opacBL = useSharedValue(1);
    const opacBR = useSharedValue(1);

    useEffect(() => {
        if (getFragmentState('interest')) opacTL.value = withTiming(0, { duration: 1000 });
        if (getFragmentState('tag')) opacTR.value = withTiming(0, { duration: 1000 });
        if (getFragmentState('silhouette')) opacBL.value = withTiming(0, { duration: 1000 });
        if (getFragmentState('name')) opacBR.value = withTiming(0, { duration: 1000 });

        if (isUnlocked) {
            // Ensure all are cleared
            opacTL.value = withTiming(0);
            opacTR.value = withTiming(0);
            opacBL.value = withTiming(0);
            opacBR.value = withTiming(0);
        }
    }, [fragments, isUnlocked]);

    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />

                {/* Quadrant Overlays */}
                <View style={styles.overlayGrid}>
                    <View style={styles.row}>
                        <AnimatedBlur style={[{ opacity: opacTL }, styles.quadrant, styles.quadrantTL]} intensity={80} tint="dark" />
                        <AnimatedBlur style={[{ opacity: opacTR }, styles.quadrant, styles.quadrantTR]} intensity={80} tint="dark" />
                    </View>
                    <View style={styles.row}>
                        <AnimatedBlur style={[{ opacity: opacBL }, styles.quadrant, styles.quadrantBL]} intensity={80} tint="dark" />
                        <AnimatedBlur style={[{ opacity: opacBR }, styles.quadrant, styles.quadrantBR]} intensity={80} tint="dark" />
                    </View>
                </View>

                {/* Grid Lines for Mosaic Effect */}
                <View style={styles.gridLines}>
                    <View style={styles.verticalLine} />
                    <View style={styles.horizontalLine} />
                </View>
            </View>
        </View>
    );
};

// Animated Blur Component
const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    imageContainer: {
        width: OVERLAY_SIZE,
        height: OVERLAY_SIZE,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        ...SHADOWS.neonCyan,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    overlayGrid: {
        ...StyleSheet.absoluteFillObject,
    },
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    quadrant: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)', // Fallback if blur not supported or for dark tint
    },
    quadrantTL: { borderBottomWidth: 1, borderRightWidth: 1, borderColor: COLORS.neonCyanDim },
    quadrantTR: { borderBottomWidth: 1, borderLeftWidth: 1, borderColor: COLORS.neonCyanDim },
    quadrantBL: { borderTopWidth: 1, borderRightWidth: 1, borderColor: COLORS.neonCyanDim },
    quadrantBR: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: COLORS.neonCyanDim },

    gridLines: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verticalLine: {
        position: 'absolute',
        width: 2,
        height: '100%',
        backgroundColor: COLORS.neonCyan,
        opacity: 0.5,
    },
    horizontalLine: {
        position: 'absolute',
        height: 2,
        width: '100%',
        backgroundColor: COLORS.neonCyan,
        opacity: 0.5,
    },
});
