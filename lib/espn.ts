import { getCachedData, setCachedData } from '@/lib/db'
import {
  MANILA_TIMEZONE,
  formatDateForAPI,
  formatInManila,
  Scoreboard,
  NewsResponse,
  TeamsResponse,
  TeamSchedule,
  GameSummary,
  RosterResponse,
  PlayerGameLog,
  TeamScheduleEvent,
  Standings
} from '@/lib/types'

export async function getStandings(sport: string, league: string): Promise<Standings> {
  const url = `https://site.api.espn.com/apis/v2/sports/${sport}/${league}/standings`
  const cacheKey = `standings:${sport}:${league}`

  const cached = getCachedData<any>(cacheKey)
  if (cached && !cached.isStale) {
    return cached.data
  }

  try {
    console.log(`[getStandings] Fetching: ${url}`)
    const response = await fetch(url)
    console.log(`[getStandings] Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      // Try to get the response body for debugging
      const text = await response.text()
      console.error(`[getStandings] ESPN API Error Response:`, text.substring(0, 500))
      throw new Error(`API Error: ${response.statusText}`)
    }

    const data = await response.json()

    // 1. Try finding standings at root or first child (common cases)
    let standingsRoot = data.standings

    // 2. If children exist, prioritize them as they usually contain the current season/table
    if (data.children && data.children.length > 0) {
      if (data.children[0].standings) {
        standingsRoot = data.children[0].standings
      } else {
        // Fallback: search all children for one with standings
        const childWithStandings = data.children.find((c: any) => c.standings)
        if (childWithStandings) {
          standingsRoot = childWithStandings.standings
        }
      }
    }

    if (!standingsRoot) {
      console.error(`[Standings] No standings object found for ${sport}/${league}. Keys: ${Object.keys(data)}`)
      if (data.children) console.error(`[Standings] Children count: ${data.children.length}`)
      throw new Error("No standings data found in API response")
    }

    // Helper to clean entries
    const cleanEntries = (entries: any[]) => {
      const cleaned = entries?.map((entry: any) => ({
        team: {
          id: entry.team?.id || 'unknown',
          uid: entry.team?.uid || '',
          location: entry.team?.location || '',
          name: entry.team?.name || 'Unknown Team',
          abbreviation: entry.team?.abbreviation || '',
          displayName: entry.team?.displayName || 'Unknown Team',
          shortDisplayName: entry.team?.shortDisplayName || 'Unknown',
          logos: entry.team?.logos
        },
        note: entry.note,
        stats: entry.stats?.map((stat: any) => ({
          name: stat.name,
          displayName: stat.displayName,
          shortDisplayName: stat.shortDisplayName,
          abbreviation: stat.abbreviation,
          displayValue: stat.displayValue,
          value: stat.value,
          type: stat.type
        })) || []
      })) || []

      // Sort by rank if available
      return cleaned.sort((a, b) => {
        const findRank = (s: any) => {
          const name = s.name?.toLowerCase() || ''
          const type = s.type?.toLowerCase() || ''
          return name === 'rank' || type === 'rank' ||
            name === 'playoffseed' || type === 'playoffseed' ||
            name === 'seed' || type === 'seed'
        }
        const rankA = Number(a.stats.find(findRank)?.value ?? 999)
        const rankB = Number(b.stats.find(findRank)?.value ?? 999)
        return rankA - rankB
      })
    }

    // Helper to get groups (flatten hierarchical groups like NFL Conferences/Divisions)
    const getGroups = (children: any[]): any[] => {
      if (!children) return []

      let groups: any[] = []
      children.forEach(child => {
        if (child.standings?.entries) {
          groups.push({
            name: child.name,
            entries: cleanEntries(child.standings.entries)
          })
        } else if (child.children) {
          // Flatten one level deeper (e.g., Conference -> Divisions)
          groups = groups.concat(getGroups(child.children))
        }
      })
      return groups
    }

    const cleanStandings: Standings = {
      name: data.name || 'League Standings',
      abbreviation: data.abbreviation || '',
      season: standingsRoot.season || new Date().getFullYear(),
      seasonDisplayName: standingsRoot.seasonDisplayName || '',
      entries: cleanEntries(standingsRoot.entries),
      groups: getGroups(data.children || [])
    }

    setCachedData(cacheKey, cleanStandings, 900)
    return cleanStandings
  } catch (error: any) {
    console.error(`Failed to fetch standings for ${sport}/${league}:`, error.message)
    if (cached) {
      console.warn('Returning stale cache data')
      return cached.data
    }
    throw error
  }
}

import { subDays, parse, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports'

// Helper for Caching
async function fetchWithCache<T>(key: string, url: string, ttlSeconds: number): Promise<T> {
  // 1. Try Cache
  const cached = getCachedData<T>(key)
  if (cached && !cached.isStale) {
    return cached.data
  }

  // 2. Fetch API
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
    const data = await response.json()

    // 3. Save to Cache
    setCachedData(key, data, ttlSeconds)
    return data as T
  } catch (error) {
    // 4. Fallback to Stale if available
    if (cached) {
      console.warn(`Fetch failed for ${key}, using stale data.`, error)
      return cached.data
    }
    throw error // No cache and api failed
  }
}

/**
 * Fetches a single day of data from ESPN API (Internal)
 */
async function fetchRawScoreboard(
  sport: string,
  league: string,
  apiDateStr: string
): Promise<Scoreboard> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/scoreboard?dates=${apiDateStr}`
  // Cache Scoreboard for 60 seconds (Live data)
  return fetchWithCache<Scoreboard>(`scoreboard:${sport}:${league}:${apiDateStr}`, url, 60)
}

/**
 * Generic function to fetch scoreboard data, ensuring we capture all games
 * that occur on the requested Manila Date.
 * 
 * Strategy:
 * 1. Fetch requested Manila Date (Day 0) - Covers games happening Evening PHT (Morning US)
 * 2. Fetch Previous Day (Day -1) - Covers games happening Morning PHT (Evening US)
 * 3. Merge and Filter strictly for the requested Manila Date.
 */
export async function getScoreboard(
  sport: string,
  league: string,
  manilaDateStr?: string
): Promise<Scoreboard> {
  // Default to current Manila date if not provided
  if (!manilaDateStr) {
    manilaDateStr = formatDateForAPI(new Date())
  }

  // Parse Manila Date (YYYYMMDD)
  // We treat this string as "Manila Calendar Day"
  const targetDateStr = manilaDateStr

  // Calculate API Request Dates
  // We need "Target" (which is Day 0) and "Target - 1 Day"
  const dateObj = parse(targetDateStr, 'yyyyMMdd', new Date())
  const prevDateObj = subDays(dateObj, 1)
  const prevDateStr = format(prevDateObj, 'yyyyMMdd')

  // Fetch both days in parallel
  const [dayMinus1Data, day0Data] = await Promise.all([
    fetchRawScoreboard(sport, league, prevDateStr),
    fetchRawScoreboard(sport, league, targetDateStr)
  ])

  // Merge events (deduplicating by ID just in case, though usually distinct)
  const allEvents = [...(dayMinus1Data.events || []), ...(day0Data.events || [])]
  const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values())

  // Filter events that strictly fall on the requested Manila Calendar Day
  const filteredEvents = uniqueEvents.filter(event => {
    // Use the helper from types
    const eventManilaDate = formatInManila(event.date, 'yyyyMMdd')
    return eventManilaDate === targetDateStr
  })

  // Sort by date (chronological)
  filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Use structure from Day 0 but replace events
  return {
    ...day0Data,
    events: filteredEvents
  }
}

// ============================================================================
// Public Data Fetching Functions
// ============================================================================

export async function getFootballScores(date?: string): Promise<Scoreboard> {
  return getScoreboard('soccer', 'all', date)
}

export async function getBasketballScores(date?: string): Promise<Scoreboard> {
  return getScoreboard('basketball', 'nba', date)
}

export async function getNFLScores(date?: string): Promise<Scoreboard> {
  return getScoreboard('football', 'nfl', date)
}

export async function getNCAAFScores(date?: string): Promise<Scoreboard> {
  return getScoreboard('football', 'college-football', date)
}

export async function getNews(sport: string, limit: number = 5): Promise<NewsResponse> {
  const url = `${ESPN_BASE_URL}/${sport}/news?limit=${limit}`
  // Cache News for 5 minutes
  return fetchWithCache<NewsResponse>(`news:${sport}:${limit}`, url, 300)
}

export async function getTeams(sport: string, league: string): Promise<TeamsResponse> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams`
  // Cache Teams for 24 hours (rarely changes)
  return fetchWithCache<TeamsResponse>(`teams:${sport}:${league}`, url, 86400)
}

export async function getTeamScheduleForSeason(sport: string, league: string, teamId: string, season: number): Promise<TeamSchedule> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/schedule?season=${season}`

  const now = new Date()
  const currentYear = now.getFullYear()
  const isTransitionMonth = now.getMonth() < 7 // Jan to July

  // For most sports (NFL, Soccer, NBA), the "current" season year is actually the year it started.
  // In Jan 2026, season 2025 is still very much active.
  const isCurrentOrActivePastSeason = season === currentYear || (isTransitionMonth && season === currentYear - 1)

  // Cache Schedule for 1 hour for active seasons (they change often), or 24 hours for old ones
  const ttl = isCurrentOrActivePastSeason ? 3600 : 86400
  return fetchWithCache<TeamSchedule>(`schedule:${sport}:${league}:${teamId}:${season}`, url, ttl)
}

export async function getTeamSchedule(sport: string, league: string, teamId: string): Promise<TeamSchedule> {
  // Defaults to current active season in ESPN's view
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/schedule`
  const data = await fetchWithCache<TeamSchedule>(`schedule:${sport}:${league}:${teamId}`, url, 300)

  // 1. Fetch nextEvent as a fallback/supplement from the team detail endpoint
  const nextEvent = await getTeamNextEvent(sport, league, teamId)

  // 2. Ensure events array exists
  data.events = data.events || []

  // 3. If nextEvent exists and isn't in schedule, add it
  if (nextEvent && !data.events.some(e => e.id === nextEvent.id)) {
    data.events.push(nextEvent)
  }

  // 4. Scoreboard Discovery Fallback (Critical for soccer leagues with truncated schedules)
  // Some leagues (La Liga, Serie A) don't show the second half of the season in the team schedule endpoint.
  // We also check additional cup competitions because their individual team schedules are often empty.
  if (sport === 'soccer') {
    try {
      const now = new Date()
      // Query scoreboard from 3 days ago until 30 days in the future
      const pastDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      const dateStr = formatInManila(pastDate, 'yyyyMMdd')
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const futureDateStr = formatInManila(futureDate, 'yyyyMMdd')

      const discoveryLeagues = [league, 'eng.fa', 'eng.league_cup', 'eng.cup', 'uefa.champions', 'uefa.europa', 'uefa.europa.conf', 'esp.super_cup', 'esp.copa_del_rey', 'ita.cup', 'ger.cup', 'fra.cup']

      for (const dLeague of [...new Set(discoveryLeagues)]) {
        try {
          const sbUrl = `${ESPN_BASE_URL}/${sport}/${dLeague}/scoreboard?dates=${dateStr}-${futureDateStr}`
          const sbData = await fetchWithCache<any>(`sb_discovery:${sport}:${dLeague}:${dateStr}-${futureDateStr}`, sbUrl, 1800)

          if (sbData.events) {
            sbData.events.forEach((event: any) => {
              const isOurTeam = event.competitions?.[0]?.competitors?.some((c: any) => c.team?.id === teamId)
              if (isOurTeam && !data.events.some(e => e.id === event.id)) {
                if (!event.league?.slug) event.league = { slug: dLeague };
                data.events.push(event as TeamScheduleEvent)
              }
            })
          }
        } catch (err) {
          // Silently skip if a league's scoreboard fails
        }
      }
    } catch (err) {
      console.warn('Scoreboard discovery failed:', err)
    }
  }

  // 5. Broad Multi-Season/Multi-Type merging
  if (sport === 'soccer' || sport === 'football' || sport === 'basketball') {
    try {
      const now = new Date()
      const currentYear = now.getFullYear()
      const isTransitionMonth = now.getMonth() < 7 // Jan to July

      // Season types: 1=pre/main(soccer), 2=regular, 3=postseason
      // La Liga uses 1 for its main season. NFL/NBA use 2.
      const seasonTypes = (sport === 'soccer') ? [1, 2] : [2, 3]

      // Seasons: In Jan-July 2026, 2025 is often the active one, but 2026 might contain some leagues too
      const seasonsToFetch = isTransitionMonth ? [currentYear - 1, currentYear] : [currentYear]

      // Halves: Soccer often uses half=1 and half=2
      const halvesToFetch = (sport === 'soccer') ? [1, 2] : [undefined]

      for (const season of seasonsToFetch) {
        for (const seasonType of seasonTypes) {
          for (const half of halvesToFetch) {
            try {
              let urlParams = `?seasontype=${seasonType}&season=${season}`
              if (half) urlParams += `&half=${half}`

              const typeUrl = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/schedule${urlParams}`
              const cacheKey = `schedule:${sport}:${league}:${teamId}:y${season}:t${seasonType}${half ? `:h${half}` : ''}`

              const typeData = await fetchWithCache<TeamSchedule>(cacheKey, typeUrl, 3600)

              if (typeData.events && typeData.events.length > 0) {
                typeData.events.forEach(event => {
                  if (!data.events.some(e => e.id === event.id)) {
                    // Inject missing league metadata
                    if (!event.league?.slug) {
                      (event as any).league = { ...(event as any).league, slug: league };
                    }
                    data.events.push(event)
                  }
                })
              }
            } catch (e) {
              // Ignore failures for specific combinations
            }
          }
        }
      }

      // 6. Additional Soccer Cup Fetching
      if (sport === 'soccer') {
        const additionalLeagues = ['eng.fa', 'eng.league_cup', 'eng.cup', 'uefa.champions', 'uefa.europa', 'uefa.europa.conf', 'esp.super_cup', 'esp.copa_del_rey']

        for (const extraLeague of additionalLeagues) {
          if (extraLeague === league) continue

          try {
            const extraUrl = `${ESPN_BASE_URL}/${sport}/${extraLeague}/teams/${teamId}/schedule`
            const extraData = await fetchWithCache<TeamSchedule>(`schedule:${sport}:${extraLeague}:${teamId}`, extraUrl, 300)

            if (extraData.events && extraData.events.length > 0) {
              extraData.events.forEach(event => {
                if (!data.events.some(e => e.id === event.id)) {
                  data.events.push(event)
                }
              })
            }
          } catch (e) { }
        }
      }
    } catch (e) {
      console.warn('Advanced schedule merge failed', e)
    }
  }

  // Final re-sort of all discovered events
  data.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return data
}

/**
 * Fetches the next event for a team from the team detail endpoint.
 * This is often more reliable than the schedule endpoint for finding the literal "next" game.
 */
export async function getTeamNextEvent(sport: string, league: string, teamId: string): Promise<TeamScheduleEvent | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}`
  try {
    const data = await fetchWithCache<any>(`team-detail:${sport}:${league}:${teamId}`, url, 300)
    const nextEvent = data.team?.nextEvent?.[0]
    return nextEvent || null
  } catch (error) {
    console.error(`Failed to fetch next event for ${teamId}:`, error)
    return null
  }
}

export async function getHeadToHead(sport: string, league: string, teamId: string, opponentId: string): Promise<TeamScheduleEvent[]> {
  const h2hEvents: TeamScheduleEvent[] = []
  const currentYear = new Date().getFullYear()
  const eventIds = new Set<string>()

  // For soccer, we search across multiple major competitions to capture cup matches
  const leaguesToSearch = sport === 'soccer'
    ? [league, 'eng.fa', 'eng.cup', 'uefa.champions'] // Search current league + domestic/euro cups
    : [league]

  // Try up to 6 seasons back (Current + 5 past)
  for (let i = 0; i < 6; i++) {
    const season = currentYear - i
    for (const l of leaguesToSearch) {
      // Fetch for both teams to handle cases where a match is missing from one team's schedule but not the other
      // (Common in ESPN's cup match data e.g. FA Cup)
      const teamIdsToFetch = [teamId, opponentId]

      for (const tId of teamIdsToFetch) {
        try {
          const schedule = await getTeamScheduleForSeason(sport, l, tId, season)
          if (schedule.events) {
            const matches = schedule.events.filter(event => {
              if (eventIds.has(event.id)) return false

              const isFinished = event.competitions?.[0]?.status?.type?.state === 'post'
              // Verify both teams are in the match
              const teamsInEvent = event.competitions?.[0]?.competitors?.map(c => c.team.id) || []
              const hasBothTeams = teamsInEvent.includes(teamId) && teamsInEvent.includes(opponentId)

              return isFinished && hasBothTeams
            })

            matches.forEach(m => {
              if (!eventIds.has(m.id)) {
                h2hEvents.push(m)
                eventIds.add(m.id)
              }
            })
          }
        } catch (e) {
          // It's common for teams not to be in all cups every year, so we just log and continue
        }
      }
    }

    // Collect up to 10 to ensure a robust history is available
    if (h2hEvents.length >= 10) break
  }

  // Sort by date descending and take top 10
  return h2hEvents
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
}

export async function getGameSummary(sport: string, league: string, eventId: string): Promise<GameSummary> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/summary?event=${eventId}`
  // Cache Summary for 60 seconds (Live stats update often)
  // Or 5 minutes if finished, but handling that logic is complex. 60s is safe.
  return fetchWithCache<GameSummary>(`summary:${sport}:${league}:${eventId}`, url, 60)
}

/**
 * Fetches multiple game summaries in parallel.
 * Includes a small delay between batches if needed to avoid rate limiting.
 */
export async function getGameSummariesBatch(sport: string, league: string, eventIds: string[]): Promise<GameSummary[]> {
  const BATCH_SIZE = 5
  const results: GameSummary[] = []

  for (let i = 0; i < eventIds.length; i += BATCH_SIZE) {
    const batch = eventIds.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async id => {
        try {
          return await getGameSummary(sport, league, id)
        } catch (e) {
          console.error(`Failed to fetch summary for event ${id}:`, e)
          return null
        }
      })
    )
    results.push(...batchResults.filter((r): r is GameSummary => r !== null))

    // Tiny delay between batches to be safe
    if (i + BATCH_SIZE < eventIds.length) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  return results
}

export async function getTeamRoster(sport: string, league: string, teamId: string): Promise<RosterResponse> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/roster`
  // Cache Roster for 24 hours (rarely changes)
  return fetchWithCache<RosterResponse>(`roster:${sport}:${league}:${teamId}`, url, 86400)
}

export async function getPlayerGamelog(sport: string, league: string, athleteId: string, season?: number): Promise<PlayerGameLog> {
  // Soccer API is different: sports/soccer/athletes/{id}/gamelog (no league)
  // Others use: sports/{sport}/{league}/athletes/{id}/gamelog
  const urlPath = sport === 'soccer'
    ? `sports/soccer/athletes/${athleteId}/gamelog`
    : `sports/${sport}/${league}/athletes/${athleteId}/gamelog`

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Correct season logic:
  // NBA 2025-26 season is "2026" in ESPN API for games in late 2025 and 2026.
  // NFL 2025 season (playoffs in Jan 2026) is "2025".
  // Soccer 2025-26 (e.g. PL) is usually "2025" for the whole cycle (started in 2025).
  if (!season && year === 2026 && month < 7) {
    if (sport === 'basketball') {
      season = 2026 // NBA current season
    } else if (sport === 'football' || sport === 'soccer') {
      season = 2025 // NFL or Soccer current active cycle
    }
  }

  let seasonParam = season ? `&season=${season}` : '';

  const url = `https://site.web.api.espn.com/apis/common/v3/${urlPath}?region=us&lang=en&contentorigin=espn${seasonParam}`
  // Cache Gamelog for 1 hour
  return fetchWithCache<PlayerGameLog>(`gamelog:${sport}:${league}:${athleteId}${seasonParam}`, url, 3600)
}

/**
 * Enhanced gamelog that merges multiple seasons to ensure we have recent matches,
 * and aligns them with the team's schedule if a teamId is provided.
 */
export async function getPlayerTeamGamelog(
  sport: string,
  league: string,
  athleteId: string,
  teamId?: string
): Promise<PlayerGameLog> {
  const now = new Date()
  const currentYear = now.getFullYear()
  const month = now.getMonth()
  const isTransition = month < 7

  // Fetch current and previous season to ensure we have recent matches
  const seasons = isTransition ? [currentYear, currentYear - 1] : [currentYear]
  // NBA 2025-26 started in late 2025 but the API season id is 2026.
  if (sport === 'basketball' && isTransition && !seasons.includes(2026)) seasons.push(2026)

  const logs = await Promise.all(seasons.map(s => getPlayerGamelog(sport, league, athleteId, s)))

  // 1. Merge Metadata (eventId -> details)
  const mergedMetadata: Record<string, any> = {}
  logs.forEach(log => {
    if (log.events) {
      Object.entries(log.events).forEach(([id, meta]) => {
        mergedMetadata[id] = meta
      })
    }
  })

  // 2. Flatten all player stats events
  const allPlayerStatsEvents: any[] = []
  logs.forEach(log => {
    if (log.seasonTypes) {
      log.seasonTypes.forEach(st => {
        st.categories?.forEach(cat => {
          cat.events?.forEach(event => {
            if (!allPlayerStatsEvents.some(e => e.eventId === event.eventId)) {
              allPlayerStatsEvents.push(event)
            }
          })
        })
      })
    }
  })

  // Basic structure from the most recent log
  const baseLog = logs.find(l => l.seasonTypes?.length) || logs[0]

  if (teamId) {
    try {
      const schedule = await getTeamSchedule(sport, league, teamId)
      const last10Games = schedule.events
        .filter(e => e.competitions?.[0]?.status?.type?.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)

      const alignedEvents: any[] = []

      last10Games.forEach(game => {
        const playerStatsMatch = allPlayerStatsEvents.find(pe => pe.eventId === game.id)

        // Ensure metadata exists for this game (for DNP/trades)
        if (!mergedMetadata[game.id]) {
          const comp = game.competitions[0]
          const opponent = comp.competitors.find(c => c.id !== teamId)?.team
          const ourTeam = comp.competitors.find(c => c.id === teamId)

          mergedMetadata[game.id] = {
            gameDate: game.date,
            gameId: game.id,
            opponent: {
              id: opponent?.id,
              displayName: opponent?.displayName,
              logo: opponent?.logos?.[0]?.href
            },
            gameResult: ourTeam?.winner ? 'W' : 'L'
          }
        }

        if (playerStatsMatch) {
          alignedEvents.push(playerStatsMatch)
        } else {
          // DNP Placeholder
          alignedEvents.push({
            eventId: game.id,
            gameDate: game.date, // Redundant but safe
            stats: []
          })
        }
      })

      // Re-inject into the log structure
      baseLog.seasonTypes = [{
        id: "merged",
        year: currentYear,
        type: 2,
        categories: [{
          name: "aligned",
          displayName: "Recent Games",
          shortDisplayName: "Recent",
          abbreviation: "REC",
          stats: baseLog.seasonTypes?.[0]?.categories?.[0]?.stats || [],
          events: alignedEvents
        }]
      }]
    } catch (e) {
      console.warn("DNP Alignment failed, falling back to basic merge", e)
    }
  }

  // Restore metadata record structure
  baseLog.events = mergedMetadata as any

  return baseLog
}

/**
 * Fetches ALL players for a league by iterating through all teams and their rosters.
 * This is an expensive operation so we cache it for 24 hours.
 */
export async function getAllPlayers(sport: string, league: string): Promise<any[]> {
  const cacheKey = `all-players:${sport}:${league}`

  // 1. Try Cache
  const cached = getCachedData<any[]>(cacheKey)
  if (cached && !cached.isStale) {
    return cached.data
  }

  // 2. Build Index (Expensive)
  try {
    const teamsData = await getTeams(sport, league)
    const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || []

    const allPlayers: any[] = []

    // Process teams in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5
    for (let i = 0; i < teams.length; i += BATCH_SIZE) {
      const batch = teams.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (t) => {
          try {
            const roster = await getTeamRoster(sport, league, t.team.id)
            const teamPlayers: any[] = []

            if (roster.athletes) {
              if (Array.isArray(roster.athletes)) {
                roster.athletes.forEach((groupOrPlayer: any) => {
                  // Handle grouped structure (common in NFL/NBA lists sometimes)
                  if (groupOrPlayer.items) {
                    groupOrPlayer.items.forEach((p: any) => {
                      teamPlayers.push({
                        id: p.id,
                        displayName: p.displayName,
                        fullName: p.fullName,
                        jersey: p.jersey,
                        headshot: p.headshot?.href,
                        position: p.position,
                        teamId: t.team.id,
                        teamName: t.team.displayName,
                        teamLogo: t.team.logo
                      })
                    })
                  }
                  // Handle flat structure
                  else if (groupOrPlayer.id) {
                    teamPlayers.push({
                      id: groupOrPlayer.id,
                      displayName: groupOrPlayer.displayName,
                      fullName: groupOrPlayer.fullName,
                      jersey: groupOrPlayer.jersey,
                      headshot: groupOrPlayer.headshot?.href,
                      position: groupOrPlayer.position,
                      teamId: t.team.id,
                      teamName: t.team.displayName,
                      teamLogo: t.team.logo
                    })
                  }
                })
              }
            }
            return teamPlayers
          } catch (e) {
            console.error(`Failed to fetch roster for team ${t.team.id}`, e)
            return []
          }
        })
      )

      batchResults.forEach(players => allPlayers.push(...players))
    }

    // 3. Save to Cache
    setCachedData(cacheKey, allPlayers, 86400) // Cache for 24 hours
    return allPlayers
  } catch (error) {
    console.error('Failed to build player index', error)
    if (cached) return cached.data // Return stale if avail
    return []
  }
}


