import { io, Socket } from 'socket.io-client';
import { BioTag, FrequencySyncState, TugOfWarState } from '../types';

// Configure your Socket.io server URL here
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;
    private userId: string | null = null;
    private currentRoomId: string | null = null;

    // Event listeners
    private listeners: Map<string, Set<Function>> = new Map();

    /**
     * Initialize socket connection with user ID
     */
    connect(userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.userId = userId;

            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                autoConnect: true,
                auth: {
                    userId,
                },
            });

            this.socket.on('connect', () => {
                console.log('[SocketService] Connected:', this.socket?.id);
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('[SocketService] Connection error:', error);
                reject(error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[SocketService] Disconnected:', reason);
                this.emit('disconnect', reason);
            });

            // Setup game event listeners
            this.setupGameListeners();
        });
    }

    /**
     * Disconnect from socket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.currentRoomId = null;
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    // ==================== Room Management ====================

    /**
     * Join a game room
     */
    joinRoom(roomId: string): void {
        if (!this.socket || !this.userId) return;

        this.currentRoomId = roomId;
        this.socket.emit('joinRoom', { roomId, userId: this.userId });
        console.log('[SocketService] Joining room:', roomId);
    }

    /**
     * Leave current game room
     */
    leaveRoom(): void {
        if (!this.socket || !this.currentRoomId) return;

        this.socket.emit('leaveRoom', { roomId: this.currentRoomId });
        console.log('[SocketService] Leaving room:', this.currentRoomId);
        this.currentRoomId = null;
    }

    // ==================== Tug of War ====================

    /**
     * Send a tug action
     */
    sendTug(direction: 'left' | 'right', force: number = 1): void {
        if (!this.socket || !this.currentRoomId) return;

        this.socket.emit('tug', {
            roomId: this.currentRoomId,
            direction,
            force,
        });
    }

    /**
     * Listen for cord position updates
     */
    onCordUpdate(callback: (data: TugOfWarState) => void): () => void {
        return this.on('cordUpdate', callback);
    }

    /**
     * Listen for bio tag reveals
     */
    onBioTagReveal(callback: (tag: BioTag) => void): () => void {
        return this.on('bioTagReveal', callback);
    }

    // ==================== Sync Grid ====================

    /**
     * Send a grid tile tap
     */
    sendGridTap(index: number): void {
        if (!this.socket || !this.currentRoomId) return;

        this.socket.emit('gridTap', {
            roomId: this.currentRoomId,
            index,
            timestamp: Date.now(),
        });
    }

    /**
     * Listen for grid matches
     */
    onGridMatch(callback: (data: { index: number; blurRevealIndex: number }) => void): () => void {
        return this.on('gridMatch', callback);
    }

    /**
     * Listen for ripple animations
     */
    onRipple(callback: (data: { index: number }) => void): () => void {
        return this.on('ripple', callback);
    }

    // ==================== Frequency Sync ====================

    /**
     * Send frequency/slider value update
     */
    sendFrequencyUpdate(value: number): void {
        if (!this.socket || !this.currentRoomId) return;

        this.socket.emit('frequencyUpdate', {
            roomId: this.currentRoomId,
            value,
        });
    }

    /**
     * Listen for sync state updates
     */
    onSyncState(callback: (data: FrequencySyncState) => void): () => void {
        return this.on('syncState', callback);
    }

    /**
     * Listen for resonance events (when users are in sync)
     */
    onResonanceEvent(callback: (data: { intensity: number }) => void): () => void {
        return this.on('resonanceEvent', callback);
    }

    /**
     * Listen for profile reveal (3 second sync hold completed)
     */
    onProfileReveal(callback: () => void): () => void {
        return this.on('profileReveal', callback);
    }

    // ==================== Game Completion ====================

    /**
     * Listen for game completion
     */
    onGameComplete(callback: (data: { winner?: string; revealed: boolean }) => void): () => void {
        return this.on('gameComplete', callback);
    }

    // ==================== Internal Methods ====================

    private setupGameListeners(): void {
        if (!this.socket) return;

        // Tug of War events
        this.socket.on('cordUpdate', (data) => this.emit('cordUpdate', data));
        this.socket.on('bioTagReveal', (data) => this.emit('bioTagReveal', data));

        // Sync Grid events
        this.socket.on('gridMatch', (data) => this.emit('gridMatch', data));
        this.socket.on('ripple', (data) => this.emit('ripple', data));

        // Frequency Sync events
        this.socket.on('syncState', (data) => this.emit('syncState', data));
        this.socket.on('resonanceEvent', (data) => this.emit('resonanceEvent', data));
        this.socket.on('profileReveal', () => this.emit('profileReveal', null));

        // General game events
        this.socket.on('gameComplete', (data) => this.emit('gameComplete', data));
    }

    /**
     * Add event listener
     */
    private on(event: string, callback: Function): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    /**
     * Emit event to listeners
     */
    private emit(event: string, data: any): void {
        this.listeners.get(event)?.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[SocketService] Error in ${event} listener:`, error);
            }
        });
    }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
