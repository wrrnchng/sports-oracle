import { NextResponse } from 'next/server'
import { getStandings, getTeamSchedule, getGameSummary } from '@/lib/espn'
import { calculateAdvancedStats, AdvancedStats } from '@/lib/stats-utils'
import { getCachedData, setCachedData } from '@/lib/db'
import { Standings } from '@/lib/types'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')

    if (!sport || !league) {
        return NextResponse.json({ error: 'Sport and League are required' }, { status: 400 })
    }

    const apiSport = (sport === 'football' || sport === 'soccer') ? 'soccer' :
        (sport === 'nfl' || sport === 'ncaaf' || sport === 'american-football') ? 'football' :
            (sport === 'basketball' || sport === 'nba') ? 'basketball' :
                sport

    const cacheKey = `league-advanced:${apiSport}:${league}`
    const cached = getCachedData<any>(cacheKey)
    if (cached && !cached.isStale) {
        return NextResponse.json(cached.data)
    }

    try {
        // 1. Fetch Standings (non-blocking - if it fails, we can still calculate stats)
        let standings: Standings | null = null
        try {
            standings = await getStandings(apiSport, league)
        } catch (standingsError: any) {
            console.error('Failed to fetch standings, but continuing with stats calculation:', standingsError.message)
            // We'll create a minimal standings object from team schedules instead
        }

        // If standings failed, we need to get team list another way
        let entries: any[] = []
        if (standings) {
            entries = standings.groups && standings.groups.length > 0
                ? standings.groups.flatMap((g: any) => g.entries)
                : standings.entries || []
        } else {
            // Fallback: fetch teams from the teams endpoint
            console.log(`[Advanced Stats] Standings failed, fetching teams from teams endpoint`)
            const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${apiSport}/${league}/teams`
            console.log(`[Advanced Stats] Fetching teams from: ${teamsUrl}`)
            const teamsResponse = await fetch(teamsUrl)
            console.log(`[Advanced Stats] Teams response status: ${teamsResponse.status}`)

            if (teamsResponse.ok) {
                const teamsData = await teamsResponse.json()
                console.log(`[Advanced Stats] Teams data keys:`, Object.keys(teamsData))
                const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || []
                console.log(`[Advanced Stats] Found ${teams.length} teams`)
                entries = teams.map((t: any) => ({
                    team: {
                        id: t.team.id,
                        uid: t.team.uid,
                        location: t.team.location,
                        name: t.team.name,
                        abbreviation: t.team.abbreviation,
                        displayName: t.team.displayName,
                        shortDisplayName: t.team.shortDisplayName,
                        logos: t.team.logos
                    },
                    stats: []
                }))
            } else {
                const errorText = await teamsResponse.text()
                console.error(`[Advanced Stats] Teams endpoint failed:`, errorText.substring(0, 500))
            }
        }

        if (entries.length === 0) {
            throw new Error('No teams found for this league')
        }

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
            standings: standings || {
                name: `${league.toUpperCase()} Standings`,
                abbreviation: league.toUpperCase(),
                season: new Date().getFullYear(),
                seasonDisplayName: `${new Date().getFullYear()}`,
                entries: entries,
                groups: []
            },
            advancedStats
        }

        // Cache for 15 minutes
        setCachedData(cacheKey, result, 900)

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('League advanced aggregation failed:', error)
        console.error('Error stack:', error.stack)
        return NextResponse.json({
            error: error.message || 'Failed to aggregate data',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
