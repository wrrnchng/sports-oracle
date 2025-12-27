import { NextRequest, NextResponse } from 'next/server'
import { getClientIdentifier, statsRateLimiter, getRetryAfterSeconds } from '@/lib/rate-limit'
import { getAllPlayers } from '@/lib/espn'

export const dynamic = 'force-dynamic'

interface SearchResultItem {
    id: string
    displayName: string
    sport: string
    league: string
    jersey?: string
    headshot?: { href: string }
    teamRelationships?: Array<{
        type: string
        displayName: string
        core?: {
            id: string
            displayName: string
            logos?: Array<{ href: string }>
        }
    }>
    position?: { name: string; abbreviation: string } // Often missing in search
}

export async function GET(request: NextRequest) {
    try {
        const identifier = getClientIdentifier(request)
        const rateLimitResult = statsRateLimiter.check(identifier)

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: getRetryAfterSeconds(rateLimitResult.resetTime) },
                { status: 429, headers: { 'Retry-After': String(getRetryAfterSeconds(rateLimitResult.resetTime)) } }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('q')
        const sport = searchParams.get('sport')
        const league = searchParams.get('league')

        if (!query) {
            return NextResponse.json({ error: 'Query required' }, { status: 400 })
        }

        if (!sport) {
            return NextResponse.json({ error: 'Sport required' }, { status: 400 })
        }

        // UNIFIED SCRAPING STRATEGY
        // Use getAllPlayers for ALL sports to ensure consistency and context.
        // This builds an index from the team rosters.

        // Determine league default if missing
        let targetLeague = league
        if (!targetLeague) {
            if (sport === 'basketball') targetLeague = 'nba'
            else if (sport === 'soccer') targetLeague = 'eng.1' // Premier League default
            else if (sport === 'football') targetLeague = 'nfl'
            else targetLeague = 'nfl' // Fallback
        }

        const allPlayers = await getAllPlayers(sport, targetLeague!)

        // Filter in-memory
        const lowerQuery = query.toLowerCase()
        const filtered = allPlayers
            .filter((p: any) =>
                p.displayName.toLowerCase().includes(lowerQuery) ||
                p.jersey?.toString().includes(lowerQuery)
            )
            .slice(0, 10) // Limit results

        return NextResponse.json(filtered)

    } catch (error) {
        console.error('Search API error:', error)
        return NextResponse.json({ error: 'Failed to search players' }, { status: 500 })
    }
}

