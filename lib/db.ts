import Database from 'better-sqlite3';
import path from 'path';

// Singleton pattern for Next.js hot reloading
const globalForDb = global as unknown as { db: Database.Database };

const dbPath = path.join(process.cwd(), 'sports-oracle.db');

export const db = globalForDb.db || new Database(dbPath, {
    // verbose: console.log 
});

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

// Initialize Schema
db.exec(`
    CREATE TABLE IF NOT EXISTS api_cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        expiry INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_cache_expiry ON api_cache(expiry);
`);

export interface CacheEntry<T> {
    data: T;
    isStale: boolean;
}

/**
 * Get cached data. Returns null if missing.
 * Does NOT auto-delete expired data here (lazy expiration or background prune preferred).
 * But for simplicity, we can ignore expiry if we want "stale" data, 
 * or check it if we want strict freshness.
 * 
 * Strategy: Return data if exists, let caller decide if it needs refresh based on timestamp.
 */
export function getCachedData<T>(key: string): CacheEntry<T> | null {
    const stmt = db.prepare('SELECT data, timestamp, expiry FROM api_cache WHERE key = ?');
    const row = stmt.get(key) as { data: string, timestamp: number, expiry: number } | undefined;

    if (!row) return null;

    try {
        return {
            data: JSON.parse(row.data) as T,
            isStale: Date.now() > row.expiry
        };
    } catch (e) {
        console.error('Error parsing cached data for key:', key, e);
        return null; // Corrupt data
    }
}

/**
 * Set cached data with a TTL (in seconds).
 */
export function setCachedData(key: string, data: any, ttlSeconds: number = 60): void {
    const now = Date.now();
    const expiry = now + (ttlSeconds * 1000);

    // SQLite upsert
    const stmt = db.prepare(`
        INSERT INTO api_cache (key, data, timestamp, expiry)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            data = excluded.data,
            timestamp = excluded.timestamp,
            expiry = excluded.expiry
    `);

    stmt.run(key, JSON.stringify(data), now, expiry);
}

/**
 * Prune expired items (Call periodically or on startup)
 */
export function pruneCache(): void {
    const now = Date.now();
    db.prepare('DELETE FROM api_cache WHERE expiry < ?').run(now);
}
