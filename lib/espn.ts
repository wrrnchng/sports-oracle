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
    const response = await fetch(url)
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
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
  // Cache Schedule for 1 hour for old seasons, or 5 mins for current
  const currentYear = new Date().getFullYear()
  const ttl = season < currentYear ? 86400 : 300
  return fetchWithCache<TeamSchedule>(`schedule:${sport}:${league}:${teamId}:${season}`, url, ttl)
}

export async function getTeamSchedule(sport: string, league: string, teamId: string): Promise<TeamSchedule> {
  // Defaults to current season
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/schedule`
  const data = await fetchWithCache<TeamSchedule>(`schedule:${sport}:${league}:${teamId}`, url, 300)

  // 1. Fetch nextEvent as a fallback/supplement
  const nextEvent = await getTeamNextEvent(sport, league, teamId)

  // 2. Ensure events array exists
  data.events = data.events || []

  // 3. If nextEvent exists and isn't in schedule, add it
  if (nextEvent && !data.events.some(e => e.id === nextEvent.id)) {
    data.events.push(nextEvent)
    // Re-sort to maintain chronological order
    data.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Soccer specific: fetch ALL competition types to include cups
  if (sport === 'soccer') {
    try {
      // Fetch different season types: 1=preseason, 2=regular, 3=postseason, 4=offseason
      // For soccer, we want regular season (2) and cup competitions
      const seasonTypes = [2, 3] // Regular season and cups/playoffs

      for (const seasonType of seasonTypes) {
        try {
          const typeUrl = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/schedule?seasontype=${seasonType}`
          const typeData = await fetchWithCache<TeamSchedule>(
            `schedule:${sport}:${league}:${teamId}:type${seasonType}`,
            typeUrl,
            300
          )

          if (typeData.events && typeData.events.length > 0) {
            // Merge events that aren't already in the list
            typeData.events.forEach(event => {
              if (!data.events.some(e => e.id === event.id)) {
                data.events.push(event)
              }
            })
          }
        } catch (e) {
          // Silently continue if a season type doesn't exist
          console.warn(`No seasontype ${seasonType} for ${league}`, e)
        }
      }

      // Also fetch from Cup competitions and European competitions
      const additionalLeagues = ['eng.fa', 'eng.league_cup', 'eng.cup', 'uefa.champions', 'uefa.europa', 'uefa.europa.conf']

      // Filter out only relevant domestic cups based on current league if needed, 
      // but easier to just try them all (ESPN will return empty if not participating)
      for (const extraLeague of additionalLeagues) {
        if (extraLeague === league) continue // Skip the one we already fetched

        try {
          const extraUrl = `${ESPN_BASE_URL}/${sport}/${extraLeague}/teams/${teamId}/schedule`
          const extraData = await fetchWithCache<TeamSchedule>(
            `schedule:${sport}:${extraLeague}:${teamId}`,
            extraUrl,
            300
          )

          if (extraData.events && extraData.events.length > 0) {
            extraData.events.forEach(event => {
              if (!data.events.some(e => e.id === event.id)) {
                data.events.push(event)
              }
            })
          }
        } catch (e) {
          // Silently continue
        }
      }

      // Re-sort after merging all events
      data.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } catch (e) {
      console.warn('Failed to fetch additional soccer competitions', e)
    }
  }

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

export async function getTeamRoster(sport: string, league: string, teamId: string): Promise<RosterResponse> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/roster`
  // Cache Roster for 24 hours (rarely changes)
  return fetchWithCache<RosterResponse>(`roster:${sport}:${league}:${teamId}`, url, 86400)
}

export async function getPlayerGamelog(sport: string, league: string, athleteId: string): Promise<PlayerGameLog> {
  // Soccer API is different: sports/soccer/athletes/{id}/gamelog (no league)
  // Others use: sports/{sport}/{league}/athletes/{id}/gamelog
  const urlPath = sport === 'soccer'
    ? `sports/soccer/athletes/${athleteId}/gamelog`
    : `sports/${sport}/${league}/athletes/${athleteId}/gamelog`

  const url = `https://site.web.api.espn.com/apis/common/v3/${urlPath}?region=us&lang=en&contentorigin=espn`
  // Cache Gamelog for 1 hour (updates after games)
  return fetchWithCache<PlayerGameLog>(`gamelog:${sport}:${league}:${athleteId}`, url, 3600)
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


