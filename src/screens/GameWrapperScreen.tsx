import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useResonanceStore } from '../store/useResonanceStore';
import { PatternSync } from '../components/games/PatternSync';
import { BarResponse } from '../components/games/BarResponse';
import { RapidFire } from '../components/games/RapidFire';
import { ThisOrThat } from '../components/games/ThisOrThat';
import { COLORS } from '../constants/theme';

export const GameWrapperScreen: React.FC = ({ navigation, route }: any) => {
    const { partnerId, fragmentId } = route.params;
    const { activeGameFragment, collectFragment } = useResonanceStore();

    const handleComplete = (success: boolean) => {
        if (success) {
            collectFragment(partnerId, fragmentId);
            Alert.alert(
                'Data Fragment Decrypted',
                'This shard has been added to your inventory.',
                [{ text: 'Return to Map', onPress: () => navigation.goBack() }]
            );
        } else {
            Alert.alert(
                'Decryption Failed',
                'Signal lost. Try again later.',
                [{ text: 'Return to Map', onPress: () => navigation.goBack() }]
            );
        }
    };

    // Route based on fragment type or just random for now
    const renderGame = () => {
        if (!activeGameFragment) return <PatternSync onComplete={handleComplete} />;

        switch (activeGameFragment.type) {
            case 'interest':
                return <PatternSync onComplete={handleComplete} />;
            case 'tag':
                return <BarResponse onComplete={handleComplete} />;
            case 'silhouette':
                return <ThisOrThat onComplete={handleComplete} />;
            case 'name':
                return <RapidFire onComplete={handleComplete} />;
            default:
                return <PatternSync onComplete={handleComplete} />;
        }
    };

    return (
        <View style={styles.container}>
            {renderGame()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
});
