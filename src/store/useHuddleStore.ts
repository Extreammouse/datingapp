import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export interface Invitation {
    id: string;
    userProfile: User;
    timestamp: number; // When the invitation was created
    expiryTime: number; // When it expires (timestamp + 15 mins)
    isRainchecked: boolean;
    status: 'pending' | 'expired' | 'rainchecked';
}

interface HuddleStore {
    invitations: Invitation[];

    // Actions
    addInvitation: (userProfile: User) => void;
    raincheckInvitation: (id: string) => Promise<boolean>; // Returns success/fail based on 24h limit
    checkExpirations: () => void;
    removeInvitation: (id: string) => void;
}

const RAINCHECK_KEY = 'last_raincheck_date';
const INVITATION_DURATION = 15 * 60 * 1000; // 15 minutes

export const useHuddleStore = create<HuddleStore>((set, get) => ({
    invitations: [],

    addInvitation: (userProfile: User) => {
        const now = Date.now();
        const newInvitation: Invitation = {
            id: Math.random().toString(36).substr(2, 9),
            userProfile,
            timestamp: now,
            expiryTime: now + INVITATION_DURATION,
            isRainchecked: false,
            status: 'pending',
        };

        set((state) => ({
            invitations: [...state.invitations, newInvitation],
        }));
    },

    raincheckInvitation: async (id: string) => {
        const now = Date.now();

        // Check local storage for last raincheck
        try {
            const lastRaincheck = await AsyncStorage.getItem(RAINCHECK_KEY);
            if (lastRaincheck) {
                const lastDate = parseInt(lastRaincheck, 10);
                const oneDay = 24 * 60 * 60 * 1000;

                if (now - lastDate < oneDay) {
                    console.log('Raincheck not available yet (24h cooldown)');
                    return false;
                }
            }

            // Update store
            set((state) => ({
                invitations: state.invitations.map((inv) =>
                    inv.id === id
                        ? { ...inv, isRainchecked: true, status: 'rainchecked' as const }
                        : inv
                ),
            }));

            // Save new timestamp
            await AsyncStorage.setItem(RAINCHECK_KEY, now.toString());
            return true;

        } catch (error) {
            console.error('Failed to raincheck invitation:', error);
            return false;
        }
    },

    checkExpirations: () => {
        const now = Date.now();
        set((state) => ({
            invitations: state.invitations.map((inv) => {
                if (inv.status === 'pending' && now > inv.expiryTime) {
                    return { ...inv, status: 'expired' as const };
                }
                return inv;
            }).filter(inv => inv.status !== 'expired'),
        }));

        // Use filter to actually remove them as requested
        set((state) => ({
            invitations: state.invitations.filter((inv) =>
                inv.isRainchecked || (Date.now() <= inv.expiryTime)
            )
        }));
    },

    removeInvitation: (id: string) => {
        set((state) => ({
            invitations: state.invitations.filter((inv) => inv.id !== id),
        }));
    },
}));
