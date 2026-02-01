import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameType } from '../types';

const INSTRUCTIONS_KEY_PREFIX = '@resonance_instructions_seen_';

export const useGameInstructions = (gameType: GameType) => {
    const [showInstructions, setShowInstructions] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkInstructionsSeen();
    }, [gameType]);

    const checkInstructionsSeen = async () => {
        try {
            const hasSeen = await AsyncStorage.getItem(`${INSTRUCTIONS_KEY_PREFIX}${gameType}`);
            if (!hasSeen) {
                setShowInstructions(true);
            }
        } catch (error) {
            console.error('Error checking instructions status:', error);
            // Default to showing if error, better safe than sorry
            setShowInstructions(true);
        } finally {
            setLoading(false);
        }
    };

    const dismissInstructions = async () => {
        try {
            await AsyncStorage.setItem(`${INSTRUCTIONS_KEY_PREFIX}${gameType}`, 'true');
            setShowInstructions(false);
        } catch (error) {
            console.error('Error saving instructions status:', error);
        }
    };

    const resetInstructions = async () => {
        try {
            await AsyncStorage.removeItem(`${INSTRUCTIONS_KEY_PREFIX}${gameType}`);
            setShowInstructions(true);
        } catch (error) {
            console.error('Error resetting instructions status:', error);
        }
    };

    return {
        showInstructions,
        dismissInstructions,
        resetInstructions,
        loading,
    };
};
