// Shared Types and Helpers for ESPN Data
// Safe for Client Components

import { formatInTimeZone } from 'date-fns-tz'

export const MANILA_TIMEZONE = 'Asia/Manila'

// ============================================================================
// Type Definitions
// ============================================================================

export interface Team {
    id: string
    uid: string
    displayName: string
    shortDisplayName: string
    abbreviation: string
    logo?: string
    color?: string
    alternateColor?: string
    score?: string
}

export interface Competition {
    id: string
    uid: string
    date: string
    attendance?: number
    venue?: {
        id: string
        fullName: string
        address?: {
            city?: string
            state?: string
            country?: string
        }
    }
    competitors: Array<{
        id: string
        uid: string
        type: string
        order: number
        homeAway: 'home' | 'away'
        winner?: boolean
        team: Team
        score: string
        linescores?: Array<{
            value: number
            displayValue: string
            period: number
        }>
        records?: Array<{
            name: string
            type: string
            summary: string
        }>
    }>
    status: {
        clock: number
        displayClock: string
        period: number
        type: {
            id: string
            name: string
            state: string
            completed: boolean
            description: string
            detail: string
            shortDetail: string
        }
    }
}

export interface ScoreboardEvent {
    id: string
    uid: string
    date: string
    name: string
    shortName: string
    competitions: Competition[]
    status: Competition['status']
    links?: Array<{
        href: string
        text: string
    }>
}

export interface Scoreboard {
    leagues?: Array<{
        id: string
        name: string
        abbreviation: string
    }>
    season?: {
        type: number
        year: number
    }
    events: ScoreboardEvent[]
}

export interface NewsArticle {
    id: number
    type: string
    headline: string
    description: string
    published: string
    lastModified: string
    images?: Array<{
        id?: number
        name: string
        url: string
        width?: number
        height?: number
        caption?: string
        credit?: string
    }>
    links: {
        web: {
            href: string
        }
        mobile?: {
            href: string
        }
    }
    byline?: string
}

export interface NewsResponse {
    header: string
    articles: NewsArticle[]
}

export interface TeamInfo {
    id: string
    uid: string
    displayName: string
    shortDisplayName: string
    abbreviation: string
    logo?: string
    logos?: Array<{ href: string, alt?: string, rel?: string[], width?: number, height?: number }>
    color?: string
    alternateColor?: string
    venue?: {
        id: string
        fullName: string
    }
    record?: {
        items: Array<{
            summary: string
            stats: Array<{
                name: string
                value: number
            }>
        }>
    }
}

export interface TeamsResponse {
    sports: Array<{
        leagues: Array<{
            teams: Array<{
                team: TeamInfo
            }>
        }>
    }>
}

// --- New Interfaces for Team Stats ---

export interface TeamScheduleEvent {
    id: string
    date: string
    seasonType: number
    result?: string // W/L often not directly here, inferred from score
    competitions: Array<{
        id: string
        date: string
        attendance?: number
        type: { id: string, abbreviation: string }
        status: { type: { state: string, completed: boolean, name: string, description?: string } }
        venue?: { fullName: string }
        competitors: Array<{
            id: string
            homeAway: string
            winner?: boolean
            score?: { displayValue: string }
            team: {
                id: string
                displayName: string
                abbreviation: string
                logos?: Array<{ href: string }>
            }
        }>
    }>
}

export interface TeamSchedule {
    timestamp: string
    status: string
    season: { year: number, type: number, name: string }
    team: { id: string, displayName: string, logo: string }
    events: TeamScheduleEvent[]
}

export interface GameSummary {
    boxscore: {
        teams: Array<{
            team: { id: string, abbreviation: string, logo?: string, displayName: string }
            statistics: Array<{ name: string, displayValue: string, label: string }>
        }>
        players?: Array<{
            team: { id: string }
            statistics: Array<{
                name: string
                keys?: string[]
                names?: string[]
                labels?: string[]
                athletes: Array<{
                    athlete: {
                        displayName: string,
                        id: string,
                        shortName: string,
                        position?: { abbreviation: string }
                    }
                    stats: string[]
                }>
            }>
        }>
    }
    header: {
        id: string
        league?: { name: string, abbreviation: string }
        competitions: Array<{
            date: string
            venue?: { fullName: string }
            competitions?: any[]
            competitors: Array<{
                id: string,
                team: { id: string, displayName: string, abbreviation?: string, logos?: Array<{ href: string }> },
                score: string,
                homeAway: string,
                winner?: boolean,
                linescores?: Array<{ value: number, displayValue: string }>,
                record?: Array<{ summary: string, type: string }>
            }>
            status: { type: { state: string, completed: boolean, detail: string, name: string } }
        }>
    }
    scoringPlays?: Array<{
        text: string
        type: { text: string }
        period: { number: number, displayValue: string }
        clock: { displayValue: string }
        team?: { id: string, logo?: string }
    }>
    keyEvents?: Array<{
        id: string
        type: { text: string }
        text: string
        period: { number: number }
        clock: { displayValue: string }
        team?: { id: string }
        scoringPlay?: boolean
    }>
    pickcenter?: Array<{
        provider: { name: string }
        details: string
        overUnder: number
        spread: number
    }>
}

// ============================================================================
// Helper Functions (Safe for Client)
// ============================================================================

/**
 * Format date to YYYYMMDD format for ESPN API in Manila Time.
 */
export function formatDateForAPI(date: Date): string {
    return formatInTimeZone(date, MANILA_TIMEZONE, 'yyyyMMdd')
}

/**
 * Format date for display in Manila time
 */
export function formatInManila(date: string | Date, formatStr: string): string {
    return formatInTimeZone(new Date(date), MANILA_TIMEZONE, formatStr)
}

// ============================================================================
// Player Stats Interfaces
// ============================================================================

export interface Athlete {
    id: string
    uid: string
    fullName: string
    displayName: string
    shortName: string
    position?: {
        id: string
        name: string
        abbreviation: string
    }
    jersey?: string
    headshot?: {
        href: string
        alt: string
    }
    status?: {
        id: string
        name: string
        type: string
        abbreviation: string
    }
}

export interface RosterResponse {
    timestamp?: string
    team: {
        id: string
        displayName: string
        logo?: string
    }
    athletes: Array<{
        items: Athlete[]
        position: string
    }> | Athlete[] // ESPN API varies: sometimes grouped by position, sometimes flat list? 
    // Checking standard structure: usually `{ athletes: [ { ...player } ] }` on team/roster endpoint?
    // Wait, the roster endpoint usually returns `athletes` as a flat array of objects with `items`?
    // No, standard `.../teams/{id}/roster` returns `{ type: 'Roster', athletes: [ ... ] }`.
    // Let's assume flat array for now, but handle potential grouping if needed in usage.
    // Actually, looking at docs/experience: `athletes` is often a direct list.
}

export interface PlayerGameLogStats {
    name: string
    displayValue: string
    label?: string
    abbreviation?: string
    value?: number
}

export interface PlayerGameLogEvent {
    id: string
    date: string
    gameDate: string
    opponent: {
        id: string
        displayName: string
        abbreviation: string
        logo?: string
    }
    gameResult: string // "W 120-110"
    stats: string[] // Array of values corresponding to categories
}

export interface PlayerGameLog {
    season?: {
        year: number
        type: number
    }
    athlete: {
        id: string
        displayName: string
    }
    events: {
        [year: string]: PlayerGameLogEvent[]
    }
    // API often returns `seasonTypes` -> `categories` (labels) -> `events` (data)
    // We will parse this in the backend to a cleaner structure if possible, 
    // or type it raw. Let's type it Raw for the fetcher, then maybe clean it up?
    // Raw structure:
    seasonTypes?: Array<{
        id: string
        year: number
        type: number
        categories: Array<{
            name: string
            displayName: string
            shortDisplayName: string
            abbreviation: string
            stats: Array<{
                name: string
                displayName: string
                shortDisplayName: string
                abbreviation: string
            }>
            events: Array<{
                eventId: string
                gameDate: string
                stats: string[] // The actual stat values matching the stats definitions above
                opponent?: { id: string, displayName: string, logo?: string }
                game?: { date: string, opponent: { displayName: string, logo: string }, result: string } // Varies by sport
            }>
        }>
    }>
}

// ============================================================================
// Standings Interfaces
// ============================================================================

export interface StandingEntry {
    team: {
        id: string
        uid: string
        location: string
        name: string
        abbreviation: string
        displayName: string
        shortDisplayName: string
        logos?: Array<{ href: string }>
    }
    note?: {
        color: string
        description: string
        rank: number
    }
    stats: Array<{
        name: string
        displayName: string
        shortDisplayName: string
        abbreviation: string
        displayValue: string
        value?: number
        type?: string
    }>
}

export interface Standings {
    name: string
    abbreviation: string
    season: number
    seasonDisplayName: string
    entries: StandingEntry[]
    groups?: Array<{
        name: string
        entries: StandingEntry[]
    }>
}
