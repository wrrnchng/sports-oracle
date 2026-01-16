'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Calendar, Info, MapPin, Loader2, Star } from 'lucide-react'
import { TeamInfo, TeamSchedule, formatInManila } from '@/lib/types'
import { useFavorites } from '@/hooks/use-favorites'
import { MatchStatsCard } from './match-stats-card'
import { StandingsTable } from './standings-table'
import { H2HStats } from './h2h-stats'
import { calculateTeamStats, calculateAdvancedStats, AdvancedStats } from '@/lib/stats-utils'
import { TeamFormCard } from './team-form-card'
import { FormComparison } from './form-comparison'
import { SoccerStatBreakdown } from './soccer-stat-breakdown'
import { DefensiveStatsCard } from './defensive-stats-card'
import { LeagueDetailedBreakdown } from './league-detailed-breakdown'
import { useMemo } from 'react'
import { getTeamLogo } from '@/lib/logo-utils'

interface TeamStatsViewProps {
    sport: string
}

const LEAGUES: Record<string, { id: string, name: string }[]> = {
    football: [ // Soccer
        { id: 'eng.1', name: 'Premier League' },
        { id: 'esp.1', name: 'La Liga' },
        { id: 'ita.1', name: 'Serie A' },
        { id: 'ger.1', name: 'Bundesliga' },
        { id: 'uefa.champions', name: 'Champions League' }
    ],
    basketball: [
        { id: 'nba', name: 'NBA' },
        { id: 'mens-college-basketball', name: 'NCAA Men' }
    ],
    nfl: [
        { id: 'nfl', name: 'NFL' }
    ],
    ncaaf: [
        { id: 'college-football', name: 'NCAA Football' }
    ]
}

export function TeamStatsView({ sport }: TeamStatsViewProps) {
    const { favorites, toggleFavorite, isFavorite } = useFavorites()
    const [league, setLeague] = useState('')
    const [teams, setTeams] = useState<TeamInfo[]>([])
    const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null)
    const [schedule, setSchedule] = useState<TeamSchedule | null>(null)
    const [loadingTeams, setLoadingTeams] = useState(false)
    const [loadingSchedule, setLoadingSchedule] = useState(false)

    // Detailed Match Modal
    const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
    const [matchSource, setMatchSource] = useState<'recent' | 'h2h' | null>(null)
    const [h2hMatches, setH2hMatches] = useState<any[]>([])
    const [loadingH2H, setLoadingH2H] = useState(false)
    const [opponentSchedule, setOpponentSchedule] = useState<TeamSchedule | null>(null)
    const [loadingOpponentSchedule, setLoadingOpponentSchedule] = useState(false)

    // Advanced Stats State
    const [advancedStats, setAdvancedStats] = useState<{
        team1: AdvancedStats | null,
        team2: AdvancedStats | null
    }>({ team1: null, team2: null })
    const [loadingAdvanced, setLoadingAdvanced] = useState(false)

    // Reset when sport changes
    useEffect(() => {
        const availableLeagues = LEAGUES[sport] || []
        if (availableLeagues.length > 0) {
            setLeague(availableLeagues[0].id)
        }
        setSelectedTeam(null)
        setSchedule(null)
        setOpponentSchedule(null)
        setAdvancedStats({ team1: null, team2: null })
    }, [sport])

    // Fetch Teams when league changes
    useEffect(() => {
        if (!league) return

        let mounted = true
        setLoadingTeams(true)

        // Map sport key for API if needed (e.g. 'football' is soccer in API if league is eng.1)
        // My library handles 'soccer'/'all'. getTeams('soccer', 'eng.1')
        // sport prop is 'football' (soccer), 'basketball', 'nfl'.
        // API needs: 'soccer' for 'football' prop? 
        // My getTeams helper takes (sport, league).
        // If prop is 'football', API expects 'soccer'.
        // If prop is 'nfl', API expects 'football' (and league 'nfl'). 
        // THIS IS TRICKY. I need to normalize.

        const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport

        fetch(`/api/teams?sport=${apiSport}&league=${league}`)
            .then(res => res.json())
            .then(data => {
                if (mounted && data.sports) {
                    setTeams(data.sports[0]?.leagues[0]?.teams?.map((t: any) => t.team) || [])
                    setLoadingTeams(false)
                }
            })
            .catch(err => {
                console.error(err)
                if (mounted) setLoadingTeams(false)
            })

        return () => { mounted = false }
    }, [sport, league])

    // Fetch Schedule when selectedTeam changes
    useEffect(() => {
        if (!selectedTeam) {
            setSchedule(null)
            return
        }

        let mounted = true
        setLoadingSchedule(true)

        const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport
        const scheduleLeague = league

        fetch(`/api/schedule?sport=${apiSport}&league=${scheduleLeague}&teamId=${selectedTeam.id}`)
            .then(res => res.json())
            .then(data => {
                if (mounted) {
                    setSchedule(data)
                    setLoadingSchedule(false)
                }
            })
            .catch(err => {
                console.error(err)
                if (mounted) setLoadingSchedule(false)
            })

        return () => { mounted = false }
    }, [selectedTeam, sport, league])

    // Discovery logic for matches
    const now = new Date()
    // A 4-hour buffer for matches that are currently in progress
    const liveThreshold = new Date(now.getTime() - 4 * 60 * 60 * 1000)

    const scheduleEvents = schedule?.events || []

    // 1. Find the actual Next Match (Upcoming or Live)
    // We prioritize Live matches, then the first match after 'now' (with buffer)
    const upcomingSchedule = [...scheduleEvents]
        .filter(e => {
            const eventDate = new Date(e.date)
            const state = e.competitions?.[0]?.status?.type?.state
            // If it's live/in-progress, always show it as next
            if (state === 'in') return true
            // Otherwise must be in the future
            return eventDate > liveThreshold
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const upcomingMatch = upcomingSchedule[0]

    // 2. Head-to-Head opponent
    const opponentId = upcomingMatch?.competitions[0].competitors.find((c: any) => c.team.id !== selectedTeam?.id)?.team.id

    const recentMatchesRaw = [...scheduleEvents]
        .filter(e => {
            const status = e.competitions?.[0]?.status?.type
            // If it's the current upcoming match, don't show it in recent history
            if (upcomingMatch && e.id === upcomingMatch.id) return false
            // Must be completed (post) or in the past
            return status?.state === 'post' || status?.completed === true || new Date(e.date) < liveThreshold
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const recentMatches = useMemo(() => {
        return [...recentMatchesRaw].sort((a, b) => {
            const aFav = favorites.includes(a.id)
            const bFav = favorites.includes(b.id)
            if (aFav && !bFav) return -1
            if (!aFav && bFav) return 1
            return 0
        }).slice(0, 10)
    }, [recentMatchesRaw, favorites])

    // Fetch Opponent Schedule
    useEffect(() => {
        if (!opponentId) {
            setOpponentSchedule(null)
            return
        }

        let mounted = true
        setLoadingOpponentSchedule(true)

        const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport
        const scheduleLeague = league

        fetch(`/api/schedule?sport=${apiSport}&league=${scheduleLeague}&teamId=${opponentId}`)
            .then(res => res.json())
            .then(data => {
                if (mounted) {
                    setOpponentSchedule(data)
                    setLoadingOpponentSchedule(true) // Actually keep it loading if we want, or set false
                    setLoadingOpponentSchedule(false)
                }
            })
            .catch(err => {
                console.error(err)
                if (mounted) setLoadingOpponentSchedule(false)
            })

        return () => { mounted = false }
    }, [opponentId, sport, league])

    // Fetch H2H when opponentId is found
    useEffect(() => {
        if (!selectedTeam || !opponentId) {
            setH2hMatches([])
            return
        }

        let mounted = true
        setLoadingH2H(true)

        const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport
        const h2hLeague = league // Use the current league

        fetch(`/api/h2h?sport=${apiSport}&league=${h2hLeague}&teamId=${selectedTeam.id}&opponentId=${opponentId}`)
            .then(res => res.json())
            .then(data => {
                if (mounted) {
                    setH2hMatches(Array.isArray(data) ? data : [])
                    setLoadingH2H(false)
                }
            })
            .catch(err => {
                console.error(err)
                if (mounted) setLoadingH2H(false)
            })

        return () => { mounted = false }
    }, [selectedTeam, opponentId, sport, league])

    // Fetch Advanced Stats when schedules are ready
    useEffect(() => {
        if (!selectedTeam || !opponentId || !schedule || !opponentSchedule) {
            setAdvancedStats({ team1: null, team2: null })
            return
        }

        let mounted = true
        setLoadingAdvanced(true)

        const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport
        // Identify games for each
        const isAdvancedSeasonal = apiSport === 'basketball' || apiSport === 'football'

        const team1Events = (schedule.events || [])
            .filter(e => e.competitions?.[0]?.status?.type?.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, isAdvancedSeasonal ? undefined : 15) // All for NBA/NFL, 15 for Soccer

        const team2Events = (opponentSchedule.events || [])
            .filter(e => e.competitions?.[0]?.status?.type?.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, isAdvancedSeasonal ? undefined : 15)

        if (team1Events.length === 0 || team2Events.length === 0) {
            setLoadingAdvanced(false)
            return
        }

        const fetchAll = async () => {
            try {
                const [res1, res2] = await Promise.all([
                    fetch(`/api/summaries/batch?sport=${apiSport}&league=${league}&eventIds=${team1Events.map(e => e.id).join(',')}`),
                    fetch(`/api/summaries/batch?sport=${apiSport}&league=${league}&eventIds=${team2Events.map(e => e.id).join(',')}`)
                ])
                const [sums1, sums2] = await Promise.all([res1.json(), res2.json()])

                if (mounted) {
                    setAdvancedStats({
                        team1: calculateAdvancedStats(sums1, selectedTeam.id, apiSport),
                        team2: calculateAdvancedStats(sums2, opponentId, apiSport)
                    })
                    setLoadingAdvanced(false)
                }
            } catch (err) {
                console.error('Failed to fetch advanced stats:', err)
                if (mounted) setLoadingAdvanced(false)
            }
        }

        fetchAll()
        return () => { mounted = false }
    }, [selectedTeam?.id, opponentId, schedule?.events, opponentSchedule?.events, sport, league])

    const availableLeagues = LEAGUES[sport] || []

    // Calculate Stats for Comparison (League-specific)
    const teamStats = useMemo(() => {
        if (!schedule?.events || !selectedTeam) return null
        return {
            overall: calculateTeamStats(schedule.events, selectedTeam.id, sport, league),
            home: calculateTeamStats(schedule.events.filter((e: any) => e.competitions[0].competitors.find((c: any) => c.team.id === selectedTeam.id)?.homeAway === 'home'), selectedTeam.id, sport, league),
            away: calculateTeamStats(schedule.events.filter((e: any) => e.competitions[0].competitors.find((c: any) => c.team.id === selectedTeam.id)?.homeAway === 'away'), selectedTeam.id, sport, league),
        }
    }, [schedule, selectedTeam, sport, league])

    const opponentStats = useMemo(() => {
        if (!opponentSchedule?.events || !opponentId) return null
        return {
            overall: calculateTeamStats(opponentSchedule.events, opponentId, sport, league),
            home: calculateTeamStats(opponentSchedule.events.filter((e: any) => e.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.homeAway === 'home'), opponentId, sport, league),
            away: calculateTeamStats(opponentSchedule.events.filter((e: any) => e.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.homeAway === 'away'), opponentId, sport, league),
        }
    }, [opponentSchedule, opponentId, sport, league])

    // Calculate Stats for Form Comparison (All Competitions)
    const teamStatsAllComps = useMemo(() => {
        if (!schedule?.events || !selectedTeam) return null
        return {
            overall: calculateTeamStats(schedule.events, selectedTeam.id, sport), // No league filter
            home: calculateTeamStats(schedule.events.filter((e: any) => e.competitions[0].competitors.find((c: any) => c.team.id === selectedTeam.id)?.homeAway === 'home'), selectedTeam.id, sport),
            away: calculateTeamStats(schedule.events.filter((e: any) => e.competitions[0].competitors.find((c: any) => c.team.id === selectedTeam.id)?.homeAway === 'away'), selectedTeam.id, sport),
        }
    }, [schedule, selectedTeam, sport])

    const opponentStatsAllComps = useMemo(() => {
        if (!opponentSchedule?.events || !opponentId) return null
        return {
            overall: calculateTeamStats(opponentSchedule.events, opponentId, sport), // No league filter
            home: calculateTeamStats(opponentSchedule.events.filter((e: any) => e.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.homeAway === 'home'), opponentId, sport),
            away: calculateTeamStats(opponentSchedule.events.filter((e: any) => e.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.homeAway === 'away'), opponentId, sport),
        }
    }, [opponentSchedule, opponentId, sport])

    const handleNextMatch = () => {
        const list = matchSource === 'recent' ? recentMatches : h2hMatches
        if (!list || !selectedMatch) return
        const idx = list.findIndex((m: any) => m.id === selectedMatch.id)
        if (idx !== -1 && idx < list.length - 1) {
            setSelectedMatch(list[idx + 1])
        }
    }

    const handlePrevMatch = () => {
        const list = matchSource === 'recent' ? recentMatches : h2hMatches
        if (!list || !selectedMatch) return
        const idx = list.findIndex((m: any) => m.id === selectedMatch.id)
        if (idx > 0) {
            setSelectedMatch(list[idx - 1])
        }
    }

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Controls */}
            <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <select
                    value={league}
                    onChange={(e) => {
                        setLeague(e.target.value)
                        setSelectedTeam(null)
                    }}
                    className="bg-zinc-950 text-zinc-100 p-2 rounded border border-zinc-800 outline-none focus:border-indigo-500"
                >
                    {availableLeagues.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>

                <select
                    value={selectedTeam?.id || ''}
                    onChange={(e) => {
                        const team = teams.find(t => t.id === e.target.value)
                        setSelectedTeam(team || null)
                        setSchedule(null) // Reset synchronously
                        setOpponentSchedule(null) // Reset synchronously
                        setH2hMatches([]) // Reset synchronously
                    }}
                    className="bg-zinc-950 text-zinc-100 p-2 rounded border border-zinc-800 outline-none focus:border-indigo-500 flex-1"
                    disabled={loadingTeams}
                >
                    <option value="">Select a Team...</option>
                    {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.displayName}</option>
                    ))}
                </select>
            </div>

            {/* Team Details */}
            {selectedTeam ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div className="flex items-center gap-6 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800">
                        <img src={getTeamLogo(selectedTeam)} alt={selectedTeam.displayName} className="w-24 h-24 object-contain drop-shadow-lg" />
                        <div>
                            <h2 className="text-3xl font-bold text-white">{selectedTeam.displayName}</h2>
                            <p className="text-zinc-400 text-lg">{selectedTeam.record?.items?.[0]?.summary || ''}</p>
                        </div>
                    </div>

                    {/* Stats Comparison Section */}
                    {teamStats && (
                        <div className="space-y-6">
                            <div className="text-center py-2 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                                <span className="text-xs text-zinc-500 italic">* {selectedTeam.displayName} {opponentStats ? `and ${upcomingMatch?.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.team.displayName}'s` : ''} average prediction data across current season</span>
                            </div>

                            <div className={`grid grid-cols-1 ${opponentStats ? 'md:grid-cols-2' : ''} gap-6`}>
                                <TeamFormCard
                                    teamName={selectedTeam.displayName}
                                    leagueName={availableLeagues.find(l => l.id === league)?.name || ''}
                                    logo={getTeamLogo(selectedTeam)}
                                    leagueStats={teamStats}
                                    formStats={teamStatsAllComps || teamStats}
                                    sport={sport}
                                />
                                {opponentStats && (
                                    <TeamFormCard
                                        teamName={upcomingMatch?.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.team.displayName || ''}
                                        leagueName={availableLeagues.find(l => l.id === league)?.name || ''}
                                        logo={getTeamLogo(upcomingMatch?.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.team)}
                                        leagueStats={opponentStats}
                                        formStats={opponentStatsAllComps || opponentStats}
                                        sport={sport}
                                    />
                                )}
                            </div>

                            {opponentStats && (() => {
                                const competitors = upcomingMatch?.competitions[0].competitors || []
                                const homeCompetitor = competitors.find((c: any) => c.homeAway === 'home')
                                const isSelectedHome = homeCompetitor?.team.id === selectedTeam.id

                                const homeTeamData = isSelectedHome
                                    ? {
                                        name: selectedTeam.displayName,
                                        logo: getTeamLogo(selectedTeam),
                                        leagueStats: teamStats,
                                        formStats: teamStatsAllComps || teamStats
                                    }
                                    : {
                                        name: homeCompetitor?.team.displayName || '',
                                        logo: getTeamLogo(homeCompetitor?.team),
                                        leagueStats: opponentStats,
                                        formStats: opponentStatsAllComps || opponentStats
                                    }

                                const awayTeamData = isSelectedHome
                                    ? {
                                        name: upcomingMatch?.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.team.displayName || '',
                                        logo: getTeamLogo(upcomingMatch?.competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.team),
                                        leagueStats: opponentStats,
                                        formStats: opponentStatsAllComps || opponentStats
                                    }
                                    : {
                                        name: selectedTeam.displayName,
                                        logo: getTeamLogo(selectedTeam),
                                        leagueStats: teamStats,
                                        formStats: teamStatsAllComps || teamStats
                                    }

                                return (
                                    <FormComparison
                                        team1={homeTeamData}
                                        team2={awayTeamData}
                                    />
                                )
                            })()}

                            {/* Advanced Breakdown */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Info className="w-5 h-5 text-indigo-400" />
                                        Detailed Performance Breakdown
                                    </h3>
                                    {loadingAdvanced && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
                                </div>

                                {advancedStats.team1 && selectedTeam ? (
                                    sport === 'football' && advancedStats.team1.soccer ? (
                                        <SoccerStatBreakdown
                                            team1={{
                                                name: selectedTeam.displayName,
                                                stats: advancedStats.team1.soccer.fullTime
                                            }}
                                            team2={opponentStats ? {
                                                name: upcomingMatch?.competitions?.[0]?.competitors?.find(c => c.team.id === opponentId)?.team?.displayName || 'Opponent',
                                                stats: advancedStats.team2?.soccer?.fullTime || undefined
                                            } : undefined}
                                            fullTime={{ t1: advancedStats.team1.soccer.fullTime, t2: advancedStats.team2?.soccer?.fullTime }}
                                            halfTime={{ t1: advancedStats.team1.soccer.halfTime, t2: advancedStats.team2?.soccer?.halfTime }}
                                            secondHalf={{ t1: advancedStats.team1.soccer.secondHalf, t2: advancedStats.team2?.soccer?.secondHalf }}
                                        />
                                    ) : (sport === 'basketball' || sport === 'nfl') && (advancedStats.team1.basketball || advancedStats.team1.nfl) ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <DefensiveStatsCard
                                                sport={sport}
                                                basketball={advancedStats.team1.basketball}
                                                nfl={advancedStats.team1.nfl}
                                                teamName={selectedTeam.displayName}
                                            />
                                            {opponentStats && (
                                                <DefensiveStatsCard
                                                    sport={sport}
                                                    basketball={advancedStats.team2?.basketball}
                                                    nfl={advancedStats.team2?.nfl}
                                                    teamName={upcomingMatch?.competitions?.[0]?.competitors?.find(c => c.team.id === opponentId)?.team?.displayName || 'Opponent'}
                                                />
                                            )}
                                        </div>
                                    ) : null
                                ) : !loadingAdvanced ? (
                                    <div className="p-12 text-center bg-zinc-900/20 rounded-2xl border border-zinc-800 border-dashed">
                                        <p className="text-zinc-500 italic">Select an opponent match to view detailed breakdowns.</p>
                                    </div>
                                ) : (
                                    <div className="p-12 flex justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upcoming */}
                        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
                            <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-wider mb-4">Next Match</h3>
                            {upcomingMatch ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-lg font-semibold text-white">
                                                vs {upcomingMatch.competitions[0].competitors.find(c => c.id !== selectedTeam.id)?.team.displayName}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleFavorite(upcomingMatch.id)
                                                }}
                                                className={`p-1.5 rounded-full transition-colors ${isFavorite(upcomingMatch.id) ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-zinc-600 hover:bg-zinc-800'}`}
                                            >
                                                <Star className={`size-4 ${isFavorite(upcomingMatch.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                                            UPCOMING
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(upcomingMatch.date).toLocaleString('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                        <MapPin className="w-4 h-4" />
                                        {upcomingMatch.competitions[0].venue?.fullName || 'TBA'}
                                    </div>

                                    {/* H2H Section */}
                                    <div className="mt-8 pt-6 border-t border-zinc-800">
                                        <H2HStats
                                            matches={h2hMatches}
                                            selectedTeamId={selectedTeam.id}
                                            opponentId={opponentId || ''}
                                            sport={sport}
                                            loading={loadingH2H}
                                        />

                                        <h4 className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest mt-8 mb-4">Past Records</h4>
                                        <div className="space-y-2">
                                            {loadingH2H ? (
                                                <div className="flex justify-center p-4">
                                                    <Loader2 className="animate-spin w-5 h-5 text-zinc-600" />
                                                </div>
                                            ) : h2hMatches.length > 0 ? (
                                                h2hMatches.map(match => {
                                                    const opponent = match.competitions[0].competitors.find((c: any) => c.team.id !== selectedTeam.id)
                                                    const us = match.competitions[0].competitors.find((c: any) => c.team.id === selectedTeam.id)
                                                    const isWin = us?.winner === true
                                                    const date = new Date(match.date).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: '2-digit' })

                                                    return (
                                                        <button
                                                            key={match.id}
                                                            onClick={() => {
                                                                setSelectedMatch(match)
                                                                setMatchSource('h2h')
                                                            }}
                                                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors group text-left border border-transparent hover:border-zinc-700"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        toggleFavorite(match.id)
                                                                    }}
                                                                    className={`p-1.5 rounded-full transition-colors ${isFavorite(match.id) ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-zinc-600 hover:bg-zinc-800'}`}
                                                                >
                                                                    <Star className={`size-3 ${isFavorite(match.id) ? 'fill-current' : ''}`} />
                                                                </button>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-mono text-zinc-500">{date}</span>
                                                                    <span className="text-sm font-medium text-zinc-400 group-hover:text-white">
                                                                        {us?.homeAway === 'home' ? 'vs' : '@'} {opponent?.team.abbreviation}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                                    {isWin ? 'W' : 'L'}
                                                                </div>
                                                                <span className="text-sm font-bold font-mono text-zinc-300">
                                                                    {us?.score?.displayValue} - {opponent?.score?.displayValue}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-zinc-600 text-xs italic">No previous meetings found in recent seasons.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-zinc-600 italic text-sm">No upcoming matches scheduled.</p>
                            )}
                        </div>

                        {/* Recent History */}
                        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
                            <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-wider mb-4">Recent Form</h3>
                            <div className="space-y-2">
                                {recentMatches?.map(match => {
                                    const opponent = match.competitions[0].competitors.find(c => c.team.id !== selectedTeam.id)
                                    const us = match.competitions[0].competitors.find(c => c.team.id === selectedTeam.id)
                                    const formattedDate = new Date(match.date).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' })
                                    const isWin = us?.winner === true
                                    const score = match.competitions[0].status.type.description === 'Postponed' ? 'P-P' : `${companyScore(match, selectedTeam.id)}`

                                    return (
                                        <button
                                            key={match.id}
                                            onClick={() => {
                                                setSelectedMatch(match)
                                                setMatchSource('recent')
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleFavorite(match.id)
                                                    }}
                                                    className={`p-1.5 rounded-full transition-colors ${isFavorite(match.id) ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-zinc-600 hover:bg-zinc-800'}`}
                                                >
                                                    <Star className={`size-4 ${isFavorite(match.id) ? 'fill-current' : ''}`} />
                                                </button>
                                                <span className="text-xs font-mono text-zinc-500 w-12">{formattedDate}</span>
                                                <div className="flex items-center gap-2">
                                                    <img src={opponent?.team.logos?.[0]?.href} className="w-5 h-5 object-contain" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                                                            {match.competitions[0].competitors.find(c => c.team.id === selectedTeam.id)?.homeAway === 'home' ? 'vs' : '@'} {opponent?.team.abbreviation}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-normal">
                                                            {match.competitions[0].competitors.find(c => c.team.id === selectedTeam.id)?.homeAway === 'home' ? '(Home)' : '(Away)'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-bold font-mono ${isWin ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                                    {(typeof us?.score === 'object' ? us?.score?.displayValue : us?.score) || '0'} - {(typeof opponent?.score === 'object' ? opponent?.score?.displayValue : opponent?.score) || '0'}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                                            </div>
                                        </button>
                                    )
                                })}
                                {!recentMatches?.length && (!loadingSchedule ? <p className="text-zinc-600 text-sm">No recent matches found.</p> : <Loader2 className="animate-spin w-5 h-5 text-zinc-600" />)}
                            </div>
                        </div>
                    </div>

                    {/* Standings Table & Detailed Breakdown - Always show below details if team is selected */}
                    <div className="space-y-8 mt-8">
                        <StandingsTable sport={sport} league={league} />
                        <LeagueDetailedBreakdown sport={sport} league={league} />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Main League View: Standings & Detailed Breakdown */}
                    <StandingsTable sport={sport} league={league} />
                    <LeagueDetailedBreakdown sport={sport} league={league} />
                </div>
            )}

            {/* Modal */}
            {selectedMatch && (
                <MatchStatsCard
                    isOpen={!!selectedMatch}
                    onClose={() => {
                        setSelectedMatch(null)
                        setMatchSource(null)
                    }}
                    onNext={(() => {
                        const list = matchSource === 'recent' ? recentMatches : h2hMatches
                        if (!list || !selectedMatch) return undefined
                        const idx = list.findIndex((m: any) => m.id === selectedMatch.id)
                        return (idx !== -1 && idx < list.length - 1) ? handleNextMatch : undefined
                    })()}
                    onPrevious={(() => {
                        const list = matchSource === 'recent' ? recentMatches : h2hMatches
                        if (!list || !selectedMatch) return undefined
                        const idx = list.findIndex((m: any) => m.id === selectedMatch.id)
                        return (idx !== -1 && idx > 0) ? handlePrevMatch : undefined
                    })()}
                    sport={sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport}
                    league={league}
                    eventId={selectedMatch.id}
                    homeTeamId={selectedMatch.competitions[0].competitors.find((c: any) => c.homeAway === 'home')?.team.id}
                    awayTeamId={selectedMatch.competitions[0].competitors.find((c: any) => c.homeAway === 'away')?.team.id}
                    date={selectedMatch.date}
                />
            )}
        </div>
    )
}

function companyScore(match: any, myTeamId: string) {
    // Helper just in case
    return ''
}

