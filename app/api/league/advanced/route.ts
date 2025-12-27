import { NextResponse } from 'next/server'
import { getStandings, getTeamSchedule, getGameSummary } from '@/lib/espn'
import { calculateAdvancedStats, AdvancedStats } from '@/lib/stats-utils'
import { getCachedData, setCachedData } from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')

    if (!sport || !league) {
        return NextResponse.json({ error: 'Sport and League are required' }, { status: 400 })
    }

    // Smarter normalization:
    // 1. If sport is 'football' it could be soccer or american football based on league
    // 2. If sport is explicitly 'nfl', 'ncaaf', it's definitely 'football'
    // 3. 'soccer' is always 'soccer'
    // 4. 'basketball' is always 'basketball'
    const apiSport =
        (sport === 'soccer' || (sport === 'football' && (league.includes('eng') || league.includes('esp') || league.includes('ita') || league.includes('ger') || league.includes('uefa')))) ? 'soccer' :
            (sport === 'nfl' || sport === 'ncaaf' || sport === 'american-football' || (sport === 'football' && (league === 'nfl' || league === 'college-football'))) ? 'football' :
                (sport === 'basketball' || sport === 'nba' || sport === 'mens-college-basketball') ? 'basketball' :
                    sport

    const cacheKey = `league-advanced:${apiSport}:${league}`
    const cached = getCachedData<any>(cacheKey)
    if (cached && !cached.isStale) {
        return NextResponse.json(cached.data)
    }

    try {
        // 1. Fetch Standings
        const standings = await getStandings(apiSport, league)

        // Robust flattening of entries from groups (NFL has conferences/divisions)
        const entries = standings.groups && standings.groups.length > 0
            ? standings.groups.flatMap((g: any) => g.entries || [])
            : standings.entries || []

        // 2. Fetch Schedules and identify all unique completed matches for the season
        const teamMatchIds: Record<string, string[]> = {}
        const eventToLeagueMap: Record<string, string> = {}
        const allUniqueEventIds = new Set<string>()

        // Process teams in larger batches for the server
        const BATCH_SIZE = 10
        for (let i = 0; i < entries.length; i += BATCH_SIZE) {
            const batch = entries.slice(i, i + BATCH_SIZE)
            await Promise.all(batch.map(async (entry) => {
                try {
                    const schedule = await getTeamSchedule(apiSport, league, entry.team.id)

                    if (schedule.events) {
                        schedule.events.forEach(e => {
                            if (e.competitions?.[0]?.status?.type?.completed) {
                                // Important: We need the actual league for this match
                                // For soccer, it might be a cup league
                                const matchLeague = e.league?.slug || e.competitions[0].league?.slug || league

                                if (!teamMatchIds[entry.team.id]) teamMatchIds[entry.team.id] = []
                                teamMatchIds[entry.team.id].push(e.id)

                                eventToLeagueMap[e.id] = matchLeague
                                allUniqueEventIds.add(e.id)
                            }
                        })
                    }
                } catch (err) {
                    console.error(`Failed to fetch schedule for ${entry.team.id}:`, err)
                }
            }))
        }

        const uniqueIdsArray = Array.from(allUniqueEventIds)
        const summaryMap: Record<string, any> = {}

        // 3. Batch fetch summaries with correct leagues
        // We'll process in chunks to handle unique leagues per match
        const SUMMARY_BATCH = 15
        for (let i = 0; i < uniqueIdsArray.length; i += SUMMARY_BATCH) {
            const chunk = uniqueIdsArray.slice(i, i + SUMMARY_BATCH)
            const chunkSummaries = await Promise.all(chunk.map(id =>
                getGameSummary(apiSport, eventToLeagueMap[id], id).catch(() => null)
            ))

            chunkSummaries.forEach((s: any) => {
                if (s?.header?.id) summaryMap[s.header.id] = s
            })
        }

        // 4. Calculate Advanced Stats for each team (Full Season)
        const advancedStats: Record<string, AdvancedStats> = {}
        entries.forEach(entry => {
            const ids = teamMatchIds[entry.team.id] || []
            const teamSummaries = ids.map(id => summaryMap[id]).filter(Boolean)
            if (teamSummaries.length > 0) {
                advancedStats[entry.team.id] = calculateAdvancedStats(teamSummaries, entry.team.id, apiSport)
            }
        })

        const result = {
            standings,
            advancedStats
        }

        // Cache for 15 minutes
        setCachedData(cacheKey, result, 900)

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('League advanced aggregation failed:', error)
        return NextResponse.json({ error: error.message || 'Failed to aggregate data' }, { status: 500 })
    }
}
