'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, Calendar, User, TrendingUp, BarChart3, Loader2, RefreshCw, Search } from 'lucide-react'
import { useRoster } from '@/hooks/use-roster'
import { usePlayerLog } from '@/hooks/use-player-log'
import { formatInManila } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts'

interface PlayerStatsViewProps {
    sport: string
}

const LEAGUES: Record<string, { id: string, name: string }[]> = {
    football: [
        { id: 'eng.1', name: 'Premier League' },
        { id: 'esp.1', name: 'La Liga' },
        { id: 'uefa.champions', name: 'Champions League' }
    ],
    basketball: [
        { id: 'nba', name: 'NBA' }
    ],
    nfl: [
        { id: 'nfl', name: 'NFL' }
    ],
    ncaaf: [
        { id: 'college-football', name: 'NCAA Football' }
    ]
}

export function PlayerStatsView({ sport }: PlayerStatsViewProps) {
    const [league, setLeague] = useState('')
    const [teams, setTeams] = useState<any[]>([])
    const [selectedTeam, setSelectedTeam] = useState<string>('')
    const [selectedPlayer, setSelectedPlayer] = useState<string>('')
    const [pendingPlayerId, setPendingPlayerId] = useState<string>('')
    const [loadingTeams, setLoadingTeams] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Global Player Search State
    const [globalSearchTerm, setGlobalSearchTerm] = useState('')
    const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([])
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)
    const [showGlobalResults, setShowGlobalResults] = useState(false)

    // Debounce Global Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (globalSearchTerm.length >= 3) {
                setIsSearchingGlobal(true)
                setShowGlobalResults(true)
                const searchSport = (sport === 'nfl' || sport === 'ncaaf') ? 'football' : (sport === 'football' ? 'soccer' : sport)
                fetch(`/api/player/search?sport=${searchSport}&league=${league}&q=${encodeURIComponent(globalSearchTerm)}`)
                    .then(res => res.json())
                    .then(data => {
                        setGlobalSearchResults(Array.isArray(data) ? data : [])
                    })
                    .catch(e => console.error(e))
                    .finally(() => setIsSearchingGlobal(false))
            } else {
                setGlobalSearchResults([])
                setShowGlobalResults(false)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [globalSearchTerm, sport, league])


    // Init League
    useEffect(() => {
        const availableLeagues = LEAGUES[sport] || []
        if (availableLeagues.length > 0) {
            setLeague(availableLeagues[0].id)
        }
        setSelectedTeam('')
        setSelectedPlayer('')
        setSearchTerm('')
    }, [sport])

    // Fetch Teams
    useEffect(() => {
        if (!league) return
        setLoadingTeams(true)
        const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport

        fetch(`/api/teams?sport=${apiSport}&league=${league}`)
            .then(res => res.json())
            .then(data => {
                if (data.sports) {
                    setTeams(data.sports[0]?.leagues[0]?.teams?.map((t: any) => t.team) || [])
                }
            })
            .finally(() => setLoadingTeams(false))
    }, [sport, league])

    // Hooks
    const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport
    const { data: roster, isLoading: loadingRoster } = useRoster({
        sport: apiSport,
        league: league,
        teamId: selectedTeam
    })

    const { data: gamelog, isLoading: loadingLog } = usePlayerLog({
        sport: apiSport,
        league: league,
        athleteId: selectedPlayer
    })

    // Process Roster
    const groupedRoster = useMemo(() => {
        if (!roster?.athletes) return {}
        const athletes = roster.athletes
        const groups: Record<string, any[]> = {}

        let flatList: any[] = []

        if (Array.isArray(athletes)) {
            const firstItem = athletes[0] as any
            if (firstItem && firstItem.items) {
                athletes.forEach((group: any) => {
                    groups[group.position] = group.items
                    flatList.push(...group.items)
                })
            } else {
                athletes.forEach((player: any) => {
                    const pos = player.position?.abbreviation || 'Unk'
                    if (!groups[pos]) groups[pos] = []
                    groups[pos].push(player)
                    flatList.push(player)
                })
            }
        }

        // Check for pending player selection (Global Search)
        if (pendingPlayerId && flatList.length > 0) {
            const found = flatList.find(p => p.id === pendingPlayerId)
            if (found) {
                setSelectedPlayer(pendingPlayerId)
                setPendingPlayerId('') // Clear pending
            }
        }

        return groups
    }, [roster, pendingPlayerId])

    const filteredGroupedRoster = useMemo(() => {
        if (!searchTerm) return groupedRoster
        const filtered: Record<string, any[]> = {}
        const term = searchTerm.toLowerCase()

        Object.entries(groupedRoster).forEach(([pos, players]) => {
            const matches = (players as any[]).filter(p =>
                p.displayName?.toLowerCase().includes(term) ||
                p.jersey?.toString().includes(term) ||
                pos.toLowerCase().includes(term)
            )
            if (matches.length > 0) {
                filtered[pos] = matches
            }
        })
        return filtered
    }, [groupedRoster, searchTerm])

    // Process Stats
    const processedStats = useMemo(() => {
        if (!gamelog) return []
        const eventsMetadata = (gamelog as any).events || {}
        if (!gamelog.seasonTypes) return []

        const segment = gamelog.seasonTypes.find(s => s.type === 2) || gamelog.seasonTypes[0]
        if (!segment || !segment.categories || segment.categories.length === 0) return []

        const category = segment.categories[0]
        const eventStats = category.events || []
        const statLabels = (gamelog as any).labels || []
        const statNames = (gamelog as any).names || []
        const statDefs = category.stats || []

        return eventStats.map(event => {
            const meta = eventsMetadata[event.eventId] || {}
            const row: any = {
                id: event.eventId,
                date: meta.gameDate || event.gameDate,
                opponent: meta.opponent?.displayName || meta.game?.opponent?.displayName || 'Unknown',
                opponentLogo: meta.opponent?.logo || meta.game?.opponent?.logo,
                result: meta.gameResult || meta.game?.result || '-',
                rawStats: event.stats || []
            }

            if (event.stats) {
                statDefs.forEach((def, idx) => { row[def.abbreviation] = event.stats[idx] })
                statLabels.forEach((label: string, idx: number) => { if (event.stats[idx] !== undefined) row[label] = event.stats[idx] })
                statNames.forEach((name: string, idx: number) => { if (event.stats[idx] !== undefined) row[name] = event.stats[idx] })
            }

            if (sport === 'basketball') {
                const pts = Number(row['PTS'] || 0)
                const reb = Number(row['REB'] || 0)
                const ast = Number(row['AST'] || 0)
                row['PR'] = pts + reb
                row['PA'] = pts + ast
                row['RA'] = reb + ast
                row['PRA'] = pts + reb + ast

                if (!row['3PM']) {
                    const threePt = row['3PT'] || row['3P']
                    if (threePt && typeof threePt === 'string' && threePt.includes('-')) {
                        row['3PM'] = threePt.split('-')[0]
                    } else {
                        row['3PM'] = threePt || row['3PM'] || '-'
                    }
                }
                row['MIN'] = row['MIN'] || row['M'] || '-'
            }

            if (sport === 'nfl' || sport === 'ncaaf') {
                row['PASS_YDS'] = row['passingYards'] || '-'
                row['RUSH_YDS'] = row['rushingYards'] || '-'
                row['REC_YDS'] = row['receivingYards'] || '-'
                row['REC'] = row['receptions'] || '-'
                row['TD'] = row['totalTouchdowns'] || row['touchdowns'] || '-'
            }

            if (sport === 'football') {
                row['G'] = row['goals'] || row['G'] || '-'
                row['A'] = row['assists'] || row['A'] || '-'
                row['SH'] = row['shots'] || row['SH'] || '-'
            }

            return row
        }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
    }, [gamelog, sport])

    const playerDetails = useMemo(() => {
        if (!roster || !selectedPlayer) return null
        for (const group of Object.values(groupedRoster)) {
            const found = group.find((p: any) => p.id === selectedPlayer)
            if (found) return found
        }
        return null
    }, [roster, selectedPlayer, groupedRoster])

    return (
        <div className="h-[calc(100vh-200px)] flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-col gap-4 shrink-0">
                <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <select
                        value={league}
                        onChange={(e) => setLeague(e.target.value)}
                        className="bg-zinc-950 text-zinc-100 p-2 rounded border border-zinc-800 outline-none w-48"
                    >
                        {(LEAGUES[sport] || []).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedTeam}
                        onChange={(e) => {
                            setSelectedTeam(e.target.value)
                            setSelectedPlayer('')
                        }}
                        className="bg-zinc-950 text-zinc-100 p-2 rounded border border-zinc-800 outline-none flex-1"
                    >
                        <option value="">Select Team...</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.displayName}</option>
                        ))}
                    </select>
                </div>

                {/* Global Player Search */}
                <div className="relative z-10 w-full">
                    <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                        <Search className="w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search all players in league (e.g. LeBron James)..."
                            value={globalSearchTerm}
                            onChange={(e) => setGlobalSearchTerm(e.target.value)}
                            onFocus={() => {
                                if (globalSearchResults.length > 0) setShowGlobalResults(true)
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder:text-zinc-600 text-sm"
                        />
                        {isSearchingGlobal && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        {globalSearchTerm && (
                            <button
                                onClick={() => {
                                    setGlobalSearchTerm('')
                                    setGlobalSearchResults([])
                                    setShowGlobalResults(false)
                                }}
                                className="text-zinc-600 hover:text-zinc-400"
                            >
                                <span className="sr-only">Clear</span>
                                <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">✕</div>
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showGlobalResults && globalSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50">
                            {globalSearchResults.map((player) => (
                                <button
                                    key={player.id}
                                    onClick={() => {
                                        setGlobalSearchTerm('')
                                        setShowGlobalResults(false)
                                        // 1. Select Team
                                        // Handle both potential structures (flat teamId from getAllPlayers, or nested team object from previous API)
                                        const tId = player.teamId || player.team?.id
                                        if (tId) setSelectedTeam(tId)
                                        // 2. Set pending player to auto-select once roster loads
                                        setPendingPlayerId(player.id)
                                    }}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-zinc-900 transition-colors border-b border-zinc-900/50 last:border-0 text-left group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800 group-hover:border-blue-500/50 transition-colors">
                                        {player.headshot ? (
                                            <img src={player.headshot} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-700"><User className="w-5 h-5" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">{player.displayName}</div>
                                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                                            {(player.teamLogo || player.team?.logo) && <img src={player.teamLogo || player.team?.logo} className="w-4 h-4 object-contain" />}
                                            <span className="text-zinc-400">{player.teamName || player.team?.displayName}</span>
                                            <span>•</span>
                                            <span>#{player.jersey}</span>
                                            <span>•</span>
                                            <span>{player.position?.abbreviation || player.position?.name}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-500" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            {selectedTeam ? (
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Left: Roster List */}
                    <div className="w-64 bg-zinc-900/30 rounded-xl border border-zinc-800 flex flex-col overflow-hidden shrink-0">
                        <div className="p-3 bg-zinc-900 border-b border-zinc-800 font-bold text-sm text-zinc-400 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span>ROSTER</span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search players..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 pl-8 pr-2 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {loadingRoster ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                                </div>
                            ) : Object.keys(filteredGroupedRoster).length === 0 ? (
                                <div className="text-center py-10 text-slate-500 text-xs text-zinc-600">
                                    {searchTerm ? 'No matches found' : 'No players found'}
                                </div>
                            ) : (
                                Object.entries(filteredGroupedRoster).map(([pos, players]) => (
                                    <div key={pos} className="mb-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">{pos}</h4>
                                        <div className="space-y-1">
                                            {(players as any[]).map(player => (
                                                <button
                                                    key={player.id}
                                                    onClick={() => setSelectedPlayer(player.id)}
                                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${selectedPlayer === player.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800 text-zinc-300'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                                                        {player.headshot?.href && <img src={player.headshot.href} alt="" className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="text-sm font-medium leading-none">{player.displayName}</div>
                                                        <div className={`text-xs ${selectedPlayer === player.id ? 'text-blue-100' : 'text-zinc-500'}`}>
                                                            #{player.jersey || '-'} • {player.position?.abbreviation || pos}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Player Stats */}
                    <div className="flex-1 bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden flex flex-col">
                        {selectedPlayer && playerDetails ? (
                            <div className="flex flex-col h-full">
                                <div className="p-6 bg-zinc-900 border-b border-zinc-800 flex items-center gap-6 shrink-0">
                                    <div className="w-20 h-20 bg-zinc-800 rounded-full overflow-hidden border-2 border-zinc-700 shadow-xl">
                                        {playerDetails.headshot ? (
                                            <img src={playerDetails.headshot.href} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600"><User /></div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white flex items-end gap-2">
                                            {playerDetails.fullName}
                                            <span className="text-xl text-zinc-500 font-mono">#{playerDetails.jersey}</span>
                                        </h2>
                                        <div className="flex gap-4 text-sm text-zinc-400 mt-1">
                                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{playerDetails.position?.name}</span>
                                            <span>{playerDetails.displayHeight}</span>
                                            <span>{playerDetails.displayWeight}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                                    {loadingLog ? (
                                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-600" /></div>
                                    ) : processedStats.length > 0 ? (
                                        <div className="space-y-8">
                                            {sport === 'basketball' && (
                                                <div className="h-72 w-full bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50 flex flex-col">
                                                    <h3 className="text-xs font-bold text-zinc-500 mb-6 flex items-center gap-2 shrink-0">
                                                        <TrendingUp className="w-4 h-4" /> SCORING TREND (Last 10)
                                                    </h3>
                                                    <div className="flex-1 w-full min-h-0">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={[...processedStats].reverse()} margin={{ top: 20, right: 25, left: 10, bottom: 10 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                                <XAxis
                                                                    dataKey="date"
                                                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                                                    tickFormatter={(v) => formatInManila(new Date(v), 'MM/dd')}
                                                                    axisLine={false} tickLine={false} dy={10}
                                                                />
                                                                <YAxis
                                                                    domain={[0, (max: number) => Math.ceil(max * 1.2) + 2]}
                                                                    allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }}
                                                                />
                                                                <RechartsTooltip
                                                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                                                    itemStyle={{ color: '#fff' }}
                                                                />
                                                                <Line type="monotone" dataKey="PTS" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                                <Line type="monotone" dataKey="REB" stroke="#10b981" strokeWidth={2} dot={false} />
                                                                <Line type="monotone" dataKey="AST" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <h3 className="text-xs font-bold text-zinc-500 mb-4 flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4" /> RECENT GAMES
                                                </h3>
                                                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-zinc-900 text-zinc-400 font-medium">
                                                            <tr>
                                                                <th className="px-4 py-3">Date</th>
                                                                <th className="px-4 py-3">Opponent</th>
                                                                {sport === 'basketball' && (
                                                                    <>
                                                                        <th className="px-2 py-3 text-left text-zinc-500">MIN</th>
                                                                        <th className="px-2 py-3 text-right text-white">PTS</th>
                                                                        <th className="px-2 py-3 text-right">REB</th>
                                                                        <th className="px-2 py-3 text-right">AST</th>
                                                                        <th className="px-2 py-3 text-right text-zinc-500">STL</th>
                                                                        <th className="px-2 py-3 text-right text-zinc-500">BLK</th>
                                                                        <th className="px-2 py-3 text-right">3PM</th>
                                                                        <th className="px-2 py-3 text-right font-bold text-indigo-400">PRA</th>
                                                                    </>
                                                                )}
                                                                {sport === 'football' && (
                                                                    <>
                                                                        <th className="px-2 py-3 text-right">G</th>
                                                                        <th className="px-2 py-3 text-right">A</th>
                                                                        <th className="px-2 py-3 text-right">SH</th>
                                                                    </>
                                                                )}
                                                                {(sport === 'nfl' || sport === 'ncaaf') && (
                                                                    <>
                                                                        <th className="px-2 py-3 text-right">PASS YDS</th>
                                                                        <th className="px-2 py-3 text-right">RUSH YDS</th>
                                                                        <th className="px-2 py-3 text-right">REC YDS</th>
                                                                        <th className="px-2 py-3 text-right text-white">TD</th>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
                                                            {processedStats.map((game: any) => (
                                                                <tr key={game.id} className="hover:bg-zinc-800/50 transition-colors">
                                                                    <td className="px-4 py-3 font-mono text-zinc-500 whitespace-nowrap">{formatInManila(new Date(game.date), 'MMM d')}</td>
                                                                    <td className="px-4 py-3 text-zinc-300">{game.opponent?.displayName || game.opponent}</td>
                                                                    {sport === 'basketball' && (
                                                                        <>
                                                                            <td className="px-2 py-3 text-left font-mono text-zinc-500">{game.MIN}</td>
                                                                            <td className="px-2 py-3 text-right font-bold text-white">{game.PTS}</td>
                                                                            <td className="px-2 py-3 text-right">{game.REB}</td>
                                                                            <td className="px-2 py-3 text-right">{game.AST}</td>
                                                                            <td className="px-2 py-3 text-right text-zinc-500">{game.STL}</td>
                                                                            <td className="px-2 py-3 text-right text-zinc-500">{game.BLK}</td>
                                                                            <td className="px-2 py-3 text-right">{game['3PM']}</td>
                                                                            <td className="px-2 py-3 text-right font-bold text-indigo-400">{game.PRA}</td>
                                                                        </>
                                                                    )}
                                                                    {sport === 'football' && (
                                                                        <>
                                                                            <td className="px-2 py-3 text-right">{game.G || '-'}</td>
                                                                            <td className="px-2 py-3 text-right">{game.A || '-'}</td>
                                                                            <td className="px-2 py-3 text-right">{game.SH || '-'}</td>
                                                                        </>
                                                                    )}
                                                                    {(sport === 'nfl' || sport === 'ncaaf') && (
                                                                        <>
                                                                            <td className="px-2 py-3 text-right">{game.PASS_YDS}</td>
                                                                            <td className="px-2 py-3 text-right">{game.RUSH_YDS}</td>
                                                                            <td className="px-2 py-3 text-right">{game.REC_YDS}</td>
                                                                            <td className="px-2 py-3 text-right font-bold text-white">{game.TD}</td>
                                                                        </>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-zinc-600"><p>No recent game stats available.</p></div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <User className="w-12 h-12 mb-4 opacity-20" />
                                <p>Select a player from the roster</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl m-4">
                    <p>Select a team to view roster</p>
                </div>
            )}
        </div>
    )
}
