import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameRecord, GameType, StaminaData } from '../types';
import { GAME } from '../constants/theme';

const STAMINA_STORAGE_KEY = '@resonance_stamina';

class StaminaService {
    private data: StaminaData | null = null;

    /**
     * Initialize stamina data from storage
     */
    async initialize(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(STAMINA_STORAGE_KEY);
            if (stored) {
                this.data = JSON.parse(stored);
                await this.checkAndResetIfNeeded();
            } else {
                this.data = {
                    gamesPlayed: [],
                    lastReset: Date.now(),
                };
                await this.save();
            }
        } catch (error) {
            console.error('[StaminaService] Failed to initialize:', error);
            this.data = {
                gamesPlayed: [],
                lastReset: Date.now(),
            };
        }
    }

    /**
     * Check if 24 hours have passed and reset if needed
     */
    private async checkAndResetIfNeeded(): Promise<void> {
        if (!this.data) return;

        const hoursSinceReset = (Date.now() - this.data.lastReset) / (1000 * 60 * 60);

        if (hoursSinceReset >= GAME.stamina.resetHours) {
            this.data = {
                gamesPlayed: [],
                lastReset: Date.now(),
            };
            await this.save();
            console.log('[StaminaService] Daily reset completed');
        }
    }

    /**
     * Save current data to storage
     */
    private async save(): Promise<void> {
        if (!this.data) return;

        try {
            await AsyncStorage.setItem(STAMINA_STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('[StaminaService] Failed to save:', error);
        }
    }

    /**
     * Get remaining games for today
     */
    getRemainingGames(): number {
        if (!this.data) return GAME.stamina.maxGamesPerDay;
        return Math.max(0, GAME.stamina.maxGamesPerDay - this.data.gamesPlayed.length);
    }

    /**
     * Get total games played today
     */
    getGamesPlayedToday(): number {
        if (!this.data) return 0;
        return this.data.gamesPlayed.length;
    }

    /**
     * Check if user can play a game
     */
    canPlay(): boolean {
        return this.getRemainingGames() > 0;
    }

    /**
     * Get time until next reset (in milliseconds)
     */
    getTimeUntilReset(): number {
        if (!this.data) return 0;

        const resetTime = this.data.lastReset + (GAME.stamina.resetHours * 60 * 60 * 1000);
        return Math.max(0, resetTime - Date.now());
    }

    /**
     * Get formatted time until reset (e.g., "5h 23m")
     */
    getFormattedTimeUntilReset(): string {
        const ms = this.getTimeUntilReset();
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    /**
     * Record a game played
     */
    async recordGame(
        gameType: GameType,
        partnerId: string,
        result: 'win' | 'loss' | 'draw'
    ): Promise<boolean> {
        if (!this.data) {
            await this.initialize();
        }

        if (!this.canPlay()) {
            console.log('[StaminaService] No stamina remaining');
            return false;
        }

        const record: GameRecord = {
            timestamp: Date.now(),
            gameType,
            partnerId,
            result,
        };

        this.data!.gamesPlayed.push(record);
        await this.save();

        console.log('[StaminaService] Game recorded. Remaining:', this.getRemainingGames());
        return true;
    }

    /**
     * Get game history for today
     */
    getTodaysGames(): GameRecord[] {
        if (!this.data) return [];
        return [...this.data.gamesPlayed];
    }

    /**
     * Get stamina display data
     */
    getStaminaDisplay(): {
        remaining: number;
        total: number;
        percentage: number;
        timeUntilReset: string;
    } {
        const remaining = this.getRemainingGames();
        const total = GAME.stamina.maxGamesPerDay;

        return {
            remaining,
            total,
            percentage: (remaining / total) * 100,
            timeUntilReset: this.getFormattedTimeUntilReset(),
        };
    }

    /**
     * Force reset (for testing)
     */
    async forceReset(): Promise<void> {
        this.data = {
            gamesPlayed: [],
            lastReset: Date.now(),
        };
        await this.save();
        console.log('[StaminaService] Force reset completed');
    }
}

// Export singleton instance
export const staminaService = new StaminaService();
export default staminaService;
