// Type definitions for Resonance app

export interface User {
    id: string;
    name: string;
    age: number;
    bio: string;
    profileImage: string;
    bioTags: BioTag[];
    location?: {
        latitude: number;
        longitude: number;
    };
}

export interface BioTag {
    id: string;
    label: string;
    icon?: string;
    revealed: boolean;
}

export interface GameRoom {
    id: string;
    userA: string;
    userB: string;
    gameType: GameType;
    status: GameStatus;
    createdAt: number;
}

export type GameType = 'tugOfWar' | 'syncGrid' | 'frequencySync';
export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned';

export interface TugOfWarState {
    cordPosition: number; // -1 (userA wins) to 1 (userB wins), 0 is center
    revealedMilestones: number[];
    winner?: string;
}

export interface SyncGridState {
    tiles: SyncGridTile[];
    matchedIndices: number[];
    blurRevealProgress: number; // 0-9, each match reveals 1/9
}

export interface SyncGridTile {
    index: number;
    pattern: string;
    lastTapByUserA?: number;
    lastTapByUserB?: number;
}

export interface FrequencySyncState {
    userAValue: number;
    userBValue: number;
    syncMeter: number; // 0-100
    isInSync: boolean;
    syncHoldStartTime?: number;
    completed: boolean;
}

export interface StaminaData {
    gamesPlayed: GameRecord[];
    lastReset: number;
}

export interface GameRecord {
    timestamp: number;
    gameType: GameType;
    partnerId: string;
    result: 'win' | 'loss' | 'draw';
}

// Navigation types
export type RootStackParamList = {
    ProfileSetup: undefined;
    MainTabs: undefined;
    Home: undefined;
    MyProfile: undefined;
    Settings: undefined;
    MatchesList: undefined;
    Chat: { matchId: string; matchName: string; matchImage?: string };
    TugOfWar: { roomId: string; partnerId: string };
    SyncGrid: { roomId: string; partnerId: string };
    FrequencySync: { roomId: string; partnerId: string };
    Profile: { userId: string; revealed: boolean };
    GameSelection: { partnerId: string };
};

// Socket event types
export interface SocketEvents {
    // Connection
    connect: () => void;
    disconnect: () => void;

    // Room management
    joinRoom: (data: { roomId: string; userId: string }) => void;
    leaveRoom: (data: { roomId: string }) => void;

    // Tug of War
    tug: (data: { roomId: string; direction: 'left' | 'right'; force: number }) => void;
    cordUpdate: (data: { position: number; revealedTags: string[] }) => void;
    bioTagReveal: (data: { tag: BioTag }) => void;

    // Sync Grid
    gridTap: (data: { roomId: string; index: number; timestamp: number }) => void;
    gridMatch: (data: { index: number; blurRevealIndex: number }) => void;
    ripple: (data: { index: number }) => void;

    // Frequency Sync
    frequencyUpdate: (data: { roomId: string; value: number }) => void;
    syncState: (data: { userAValue: number; userBValue: number; isInSync: boolean }) => void;
    resonanceEvent: (data: { intensity: number }) => void;
    profileReveal: () => void;
}
