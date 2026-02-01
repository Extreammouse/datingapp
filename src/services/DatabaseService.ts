import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { BioTag } from '../types';

export interface UserProfile {
    id: string;
    name: string;
    age: number;
    bio: string;
    photos: string[]; // Array of photo URIs
    bioTags: BioTag[];
    gender: 'male' | 'female' | 'other';
    lookingFor: 'male' | 'female' | 'everyone';
    createdAt: number;
    updatedAt: number;
}

// Helper to fix paths on iOS where container UUID changes
const fixPhotoPath = (uri: string): string => {
    if (!uri) return uri;
    // If it's a remote URL, return as is
    if (uri.startsWith('http')) return uri;

    const docDir = FileSystem.documentDirectory;
    console.log(`[DatabaseService] fixPhotoPath: uri=${uri}, docDir=${docDir}`);

    // If it is in our specific storage folder, reconstruct the path
    if (uri.includes('profile_images/')) {
        const parts = uri.split('profile_images/');
        const filename = parts[parts.length - 1];
        if (filename && docDir) {
            const newPath = docDir + 'profile_images/' + filename;
            console.log(`[DatabaseService] Reconstructed path: ${newPath}`);
            return newPath;
        }
    }
    return uri;
};

export interface NearbyUser {
    id: string;
    name: string;
    age: number;
    profileImage?: string;
    distance: number; // in meters
    lastSeen: number;
    hasInteracted: boolean;
}

class DatabaseService {
    private db: SQLite.SQLiteDatabase | null = null;
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            this.db = await SQLite.openDatabaseAsync('datingapp.db');
            await this.createTables();
            await this.migrateSchema();
            this.isInitialized = true;
            console.log('[DatabaseService] Initialized successfully');
        } catch (error) {
            console.error('[DatabaseService] Failed to initialize:', error);
            throw error;
        }
    }

    private async migrateSchema(): Promise<void> {
        if (!this.db) return;

        try {
            // Check if bio_tags table has old schema (TEXT PRIMARY KEY for id)
            const tableInfo = await this.db.getAllAsync<{ name: string; type: string }>(
                "PRAGMA table_info(bio_tags)"
            );

            const idColumn = tableInfo.find(col => col.name === 'id');
            const tagIdColumn = tableInfo.find(col => col.name === 'tag_id');

            // If id is TEXT type and tag_id doesn't exist, we need to migrate
            if (idColumn?.type === 'TEXT' && !tagIdColumn) {
                console.log('[DatabaseService] Migrating bio_tags table to new schema...');

                // Drop old table and recreate with new schema
                await this.db.execAsync('DROP TABLE IF EXISTS bio_tags');
                await this.db.execAsync(`
                    CREATE TABLE bio_tags (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tag_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        label TEXT NOT NULL,
                        icon TEXT,
                        UNIQUE(user_id, tag_id),
                        FOREIGN KEY (user_id) REFERENCES user_profile(id)
                    )
                `);
                console.log('[DatabaseService] bio_tags table migrated successfully');
            }
        } catch (error) {
            console.log('[DatabaseService] Migration check error (may be expected):', error);
        }
    }

    private async createTables(): Promise<void> {
        if (!this.db) return;

        // User profile table
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        bio TEXT,
        gender TEXT NOT NULL,
        looking_for TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

        // User photos table
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        photo_uri TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );
    `);

        // Bio tags table - use auto-increment to avoid unique constraint issues
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS bio_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        label TEXT NOT NULL,
        icon TEXT,
        UNIQUE(user_id, tag_id),
        FOREIGN KEY (user_id) REFERENCES user_profile(id)
      );
    `);

        // Nearby users cache table
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS nearby_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER,
        profile_image TEXT,
        distance REAL NOT NULL,
        last_seen INTEGER NOT NULL,
        has_interacted INTEGER DEFAULT 0
      );
    `);

        // Matches table
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        matched_at INTEGER NOT NULL,
        revealed_tags TEXT,
        profile_revealed INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES nearby_users(id)
      );
    `);

        // Game results table
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS game_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        result TEXT NOT NULL,
        played_at INTEGER NOT NULL,
        revealed_tags TEXT,
        FOREIGN KEY (match_id) REFERENCES matches(id)
      );
    `);

        console.log('[DatabaseService] Tables created');
    }

    // ============= User Profile Methods =============

    async saveUserProfile(profile: UserProfile): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const now = Date.now();

        // Insert or update the profile
        await this.db.runAsync(
            `INSERT OR REPLACE INTO user_profile 
       (id, name, age, bio, gender, looking_for, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                profile.id,
                profile.name,
                profile.age,
                profile.bio,
                profile.gender,
                profile.lookingFor,
                profile.createdAt || now,
                now,
            ]
        );

        // Clear existing photos and add new ones
        await this.db.runAsync('DELETE FROM user_photos WHERE user_id = ?', [profile.id]);
        for (let i = 0; i < profile.photos.length; i++) {
            await this.db.runAsync(
                'INSERT INTO user_photos (user_id, photo_uri, order_index, created_at) VALUES (?, ?, ?, ?)',
                [profile.id, profile.photos[i], i, now]
            );
        }

        // Clear existing bio tags and add new ones
        await this.db.runAsync('DELETE FROM bio_tags WHERE user_id = ?', [profile.id]);
        for (const tag of profile.bioTags) {
            await this.db.runAsync(
                'INSERT INTO bio_tags (tag_id, user_id, label, icon) VALUES (?, ?, ?, ?)',
                [tag.id, profile.id, tag.label, tag.icon || null]
            );
        }

        console.log('[DatabaseService] Profile saved');
    }

    async getUserProfile(): Promise<UserProfile | null> {
        if (!this.db) throw new Error('Database not initialized');

        const profile = await this.db.getFirstAsync<{
            id: string;
            name: string;
            age: number;
            bio: string;
            gender: string;
            looking_for: string;
            created_at: number;
            updated_at: number;
        }>('SELECT * FROM user_profile LIMIT 1');

        if (!profile) return null;

        // Get photos
        const photos = await this.db.getAllAsync<{ photo_uri: string }>(
            'SELECT photo_uri FROM user_photos WHERE user_id = ? ORDER BY order_index',
            [profile.id]
        );

        const validPhotos: string[] = [];
        for (const p of photos) {
            const fixedUri = fixPhotoPath(p.photo_uri);

            if (fixedUri.startsWith('http')) {
                validPhotos.push(fixedUri);
                continue;
            }

            try {
                const info = await FileSystem.getInfoAsync(fixedUri);
                if (info.exists) {
                    validPhotos.push(fixedUri);
                } else {
                    console.log('[DatabaseService] Photo does not exist on disk:', fixedUri);
                }
            } catch (e) {
                console.log('[DatabaseService] Error checking photo:', fixedUri, e);
            }
        }

        console.log(`[DatabaseService] Returning ${validPhotos.length} valid photos out of ${photos.length} total.`);

        // Get bio tags
        const bioTags = await this.db.getAllAsync<{ tag_id: string; label: string; icon: string | null }>(
            'SELECT tag_id, label, icon FROM bio_tags WHERE user_id = ?',
            [profile.id]
        );

        return {
            id: profile.id,
            name: profile.name,
            age: profile.age,
            bio: profile.bio,
            photos: validPhotos,
            bioTags: bioTags.map(t => ({ id: t.tag_id, label: t.label, icon: t.icon || undefined, revealed: false })),
            gender: profile.gender as 'male' | 'female' | 'other',
            lookingFor: profile.looking_for as 'male' | 'female' | 'everyone',
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
        };
    }

    async hasUserProfile(): Promise<boolean> {
        if (!this.db) return false;
        const result = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_profile');
        return (result?.count ?? 0) > 0;
    }

    // ============= Nearby Users Methods =============

    async saveNearbyUser(user: NearbyUser): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            `INSERT OR REPLACE INTO nearby_users 
       (id, name, age, profile_image, distance, last_seen, has_interacted) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user.id, user.name, user.age, user.profileImage || null, user.distance, user.lastSeen, user.hasInteracted ? 1 : 0]
        );
    }

    async getNearbyUsers(): Promise<NearbyUser[]> {
        if (!this.db) return [];

        const users = await this.db.getAllAsync<{
            id: string;
            name: string;
            age: number;
            profile_image: string | null;
            distance: number;
            last_seen: number;
            has_interacted: number;
        }>('SELECT * FROM nearby_users ORDER BY distance ASC');

        return users.map(u => ({
            id: u.id,
            name: u.name,
            age: u.age,
            profileImage: u.profile_image || undefined,
            distance: u.distance,
            lastSeen: u.last_seen,
            hasInteracted: u.has_interacted === 1,
        }));
    }

    async clearExpiredNearbyUsers(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
        if (!this.db) return;
        const cutoff = Date.now() - maxAge;
        await this.db.runAsync('DELETE FROM nearby_users WHERE last_seen < ?', [cutoff]);
    }

    // ============= Match Methods =============

    async saveMatch(matchId: string, userId: string, revealedTags: string[] = []): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            `INSERT OR REPLACE INTO matches 
       (id, user_id, matched_at, revealed_tags, profile_revealed) 
       VALUES (?, ?, ?, ?, ?)`,
            [matchId, userId, Date.now(), JSON.stringify(revealedTags), 0]
        );
    }

    async getMatches(): Promise<Array<{ matchId: string; userId: string; matchedAt: number }>> {
        if (!this.db) return [];

        const matches = await this.db.getAllAsync<{
            id: string;
            user_id: string;
            matched_at: number;
        }>('SELECT id, user_id, matched_at FROM matches ORDER BY matched_at DESC');

        return matches.map(m => ({
            matchId: m.id,
            userId: m.user_id,
            matchedAt: m.matched_at,
        }));
    }
}

export const databaseService = new DatabaseService();
export default databaseService;
