import { create } from 'zustand';
import { ResonanceProfile, Fragment } from '../types';

interface ResonanceStore {
    nearbyProfiles: ResonanceProfile[];
    activeGameFragment: Fragment | null; // The fragment currently being played for

    // Actions
    setNearbyProfiles: (profiles: ResonanceProfile[]) => void;
    collectFragment: (profileId: string, fragmentId: string) => void;
    setActiveGameFragment: (fragment: Fragment | null) => void;
    checkUnlock: (profileId: string) => boolean;
}

// Mock Data Generator
const generateMockProfiles = (): ResonanceProfile[] => {
    return [
        {
            id: 'res_1',
            name: 'Nova',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', // Cyberpunk-ish vibe
            isUnlocked: false,
            distance: 120,
            fragments: [
                { id: 'f1', type: 'interest', value: 'Synthwave', icon: 'headphones', coordinate: { latitude: 42.3611, longitude: -71.0589 }, isCollected: false },
                { id: 'f2', type: 'tag', value: 'Night Owl', icon: 'moon', coordinate: { latitude: 42.3605, longitude: -71.0595 }, isCollected: false },
                { id: 'f3', type: 'silhouette', value: 'Photo Reveal', icon: 'camera', coordinate: { latitude: 42.3615, longitude: -71.0580 }, isCollected: false },
                { id: 'f4', type: 'name', value: 'Nova', icon: 'user', coordinate: { latitude: 42.3601, longitude: -71.0585 }, isCollected: false },
            ]
        },
        {
            id: 'res_2',
            name: 'Kael',
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
            isUnlocked: false,
            distance: 350,
            fragments: [
                { id: 'f5', type: 'interest', value: 'Cyber Security', icon: 'shield', coordinate: { latitude: 42.3591, longitude: -71.0609 }, isCollected: false },
                { id: 'f6', type: 'tag', value: 'Gamer', icon: 'gamepad', coordinate: { latitude: 42.3585, longitude: -71.0615 }, isCollected: false },
                { id: 'f7', type: 'silhouette', value: 'Photo Reveal', icon: 'camera', coordinate: { latitude: 42.3595, longitude: -71.0600 }, isCollected: false },
                { id: 'f8', type: 'name', value: 'Kael', icon: 'user', coordinate: { latitude: 42.3581, longitude: -71.0605 }, isCollected: false },
            ]
        }
    ];
};

export const useResonanceStore = create<ResonanceStore>((set, get) => ({
    nearbyProfiles: generateMockProfiles(),
    activeGameFragment: null,

    setNearbyProfiles: (profiles) => {
        set({ nearbyProfiles: profiles });
    },

    setActiveGameFragment: (fragment) => {
        set({ activeGameFragment: fragment });
    },

    collectFragment: (profileId, fragmentId) => {
        set((state) => {
            const updatedProfiles = state.nearbyProfiles.map(profile => {
                if (profile.id !== profileId) return profile;

                const updatedFragments = profile.fragments.map(f =>
                    f.id === fragmentId ? { ...f, isCollected: true } : f
                );

                // Check if all collected
                const allCollected = updatedFragments.every(f => f.isCollected);

                // DEBUG log
                console.log(`[ResonanceStore] Collected ${fragmentId} for ${profile.name}. All Collected? ${allCollected}`);

                return {
                    ...profile,
                    fragments: updatedFragments,
                    isUnlocked: allCollected
                };
            });

            return { nearbyProfiles: updatedProfiles };
        });
    },

    checkUnlock: (profileId) => {
        const profile = get().nearbyProfiles.find(p => p.id === profileId);
        return profile ? profile.isUnlocked : false;
    }
}));
