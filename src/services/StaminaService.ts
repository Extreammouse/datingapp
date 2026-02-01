import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameRecord, GameType, StaminaData } from '../types';
import { GAME } from '../constants/theme';

const STAMINA_STORAGE_KEY = '@resonance_stamina';

class StaminaService {
    private data: StaminaData | null = null;
    private weeklyLimit = 15;

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
     * Also prunes games older than 7 days for weekly limit check
     */
    private async checkAndResetIfNeeded(): Promise<void> {
        if (!this.data) return;

        const now = Date.now();
        const hoursSinceReset = (now - this.data.lastReset) / (1000 * 60 * 60);

        // Daily reset for "3 per day" logic
        // We actually need to count games played since "start of day" or just in last 24h?
        // Implementation: Reset count if > 24h since last reset.
        if (hoursSinceReset >= GAME.stamina.resetHours) {
            // Keep the games history for weekly check, but update reset time
            this.data.lastReset = now;
            await this.save();
            console.log('[StaminaService] Daily reset timestamp updated');
        }

        // Prune games older than 7 days
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const originalLength = this.data.gamesPlayed.length;
        this.data.gamesPlayed = this.data.gamesPlayed.filter(g => g.timestamp > oneWeekAgo);

        if (this.data.gamesPlayed.length !== originalLength) {
            await this.save();
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
     * Get remaining games for today (Daily Limit)
     */
    getDailyRemaining(): number {
        if (!this.data) return GAME.stamina.maxGamesPerDay;

        // Count games played since last daily reset
        const gamesSinceReset = this.data.gamesPlayed.filter(
            g => g.timestamp >= this.data!.lastReset
        ).length;

        return Math.max(0, GAME.stamina.maxGamesPerDay - gamesSinceReset);
    }

    /**
     * Get remaining games for week (Weekly Limit)
     */
    getWeeklyRemaining(): number {
        if (!this.data) return this.weeklyLimit;
        // All games in data.gamesPlayed are within last 7 days (due to pruning)
        return Math.max(0, this.weeklyLimit - this.data.gamesPlayed.length);
    }

    /**
     * Get overall remaining games (Minimum of Daily and Weekly)
     */
    getRemainingGames(): number {
        return Math.min(this.getDailyRemaining(), this.getWeeklyRemaining());
    }

    /**
     * Get total games played today
     */
    getGamesPlayedToday(): number {
        if (!this.data) return 0;
        return this.data.gamesPlayed.filter(g => g.timestamp >= this.data!.lastReset).length;
    }

    /**
     * Check if user can play a game
     */
    canPlay(): boolean {
        // return this.getRemainingGames() > 0;
        return true; // Bypass for demo/testing
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
        return this.data.gamesPlayed.filter(g => g.timestamp >= this.data!.lastReset);
    }

    /**
     * Get stamina display data
     */
    getStaminaDisplay(): {
        remaining: number;
        total: number;
        weeklyRemaining: number;
        weeklyTotal: number;
        percentage: number;
        timeUntilReset: string;
    } {
        const dailyRemaining = this.getDailyRemaining();
        const dailyTotal = GAME.stamina.maxGamesPerDay;
        const weeklyRemaining = this.getWeeklyRemaining();

        // Display usage based on what's more constraining or just verify both
        // For UI simplified bar: use the one that is closer to 0
        const effectiveRemaining = Math.min(dailyRemaining, weeklyRemaining);
        const effectiveTotal = dailyRemaining < weeklyRemaining ? dailyTotal : this.weeklyLimit;

        return {
            remaining: effectiveRemaining,
            total: effectiveTotal,
            weeklyRemaining,
            weeklyTotal: this.weeklyLimit,
            percentage: (effectiveRemaining / effectiveTotal) * 100,
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
