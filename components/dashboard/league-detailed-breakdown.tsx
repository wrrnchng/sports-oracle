'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Loader2,
    Info,
    TrendingUp,
    Target,
    ShieldCheck,
    AlertCircle,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react'
import { StandingEntry, Standings } from '@/lib/types'
import { calculateAdvancedStats, AdvancedStats, SoccerAdvancedStats, BasketballAllowedStats, NFLAllowedStats } from '@/lib/stats-utils'
import { getTeamLogo } from '@/lib/logo-utils'

interface LeagueDetailedBreakdownProps {
    sport: string
    league: string
}

type SoccerTab = 'goals' | 'corners' | 'cards' | 'halves'
type BasketballTab = 'allowed' | 'quarters'
type NFLTab = 'allowed' | 'yards'

export function LeagueDetailedBreakdown({ sport, league }: LeagueDetailedBreakdownProps) {
    const [standings, setStandings] = useState<Standings | null>(null)
    const [advancedStatsMap, setAdvancedStatsMap] = useState<Record<string, AdvancedStats>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)

    // UI Tabs
    const [soccerTab, setSoccerTab] = useState<SoccerTab>('goals')

    useEffect(() => {
        if (!league) return

        let mounted = true
        setLoading(true)
        setError(null)
        setStandings(null)
        setAdvancedStatsMap({})

        const fetchAllData = async () => {
            try {
                // Normalize sport for ESPN API
                // Client uses: 'football' (soccer), 'nfl', 'ncaaf', 'basketball'
                // ESPN API expects: 'soccer', 'football' (for NFL/NCAA), 'basketball'
                const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport

                const res = await fetch(`/api/league/advanced?sport=${apiSport}&league=${league}`)
                if (!res.ok) throw new Error('Failed to fetch league data')
                const data = await res.json()

                if (mounted) {
                    setStandings(data.standings)
                    setAdvancedStatsMap(data.advancedStats)
                    setLoading(false)
                }
            } catch (err: any) {
                console.error('Detailed breakdown failed:', err)
                if (mounted) {
                    setError(err.message || 'Failed to aggregate detailed metrics')
                    setLoading(false)
                }
            }
        }

        fetchAllData()
        return () => { mounted = false }
    }, [sport, league])

    // Reset group index when sport/league changes
    useEffect(() => {
        setSelectedGroupIndex(0)
    }, [sport, league])

    const activeEntries = useMemo(() => {
        if (!standings) return []
        if (standings.groups && standings.groups.length > 0) {
            return standings.groups[selectedGroupIndex].entries
        }
        return standings.entries || []
    }, [standings, selectedGroupIndex])

    if (error) {
        return (
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-8 text-center mt-6">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-zinc-400">{error}</p>
            </div>
        )
    }

    const isSoccer = sport === 'football'
    const isBasketball = sport === 'basketball'
    const isNFL = sport === 'nfl' || sport === 'ncaaf'

    return (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900/50 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            League Performance Analytics
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1">Detailed statistical breakdown across the entire league</p>
                    </div>

                    {loading && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Aggregating live data...
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    {/* Conference/Division Selectors */}
                    {standings?.groups && standings.groups.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {standings.groups.map((group, idx) => (
                                <button
                                    key={group.name}
                                    onClick={() => setSelectedGroupIndex(idx)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedGroupIndex === idx
                                        ? 'bg-zinc-100 text-zinc-900 shadow-lg'
                                        : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                                        }`}
                                >
                                    {group.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Sport Specific Metric Tabs */}
                    {isSoccer && (
                        <div className="flex gap-2 p-1 bg-zinc-950/50 rounded-lg w-fit">
                            {[
                                { id: 'goals', label: 'Goals', icon: Target },
                                { id: 'corners', label: 'Corners', icon: TrendingUp },
                                { id: 'halves', label: 'Half-time', icon: PieChart },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSoccerTab(tab.id as SoccerTab)}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${soccerTab === tab.id
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    <tab.icon className="w-3 h-3" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-zinc-950/30 text-zinc-400 border-b border-zinc-800">
                            <th className="py-4 px-4 text-left font-semibold uppercase tracking-wider text-[10px] w-12 sticky left-0 bg-zinc-900/90 backdrop-blur z-10">#</th>
                            <th className="py-4 px-4 text-left font-semibold uppercase tracking-wider text-[10px] sticky left-12 bg-zinc-900/90 backdrop-blur z-10">Team</th>

                            {isSoccer ? (
                                soccerTab === 'goals' ? (
                                    <>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px] hover:text-zinc-100 transition-colors">Avg Goals</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px] hover:text-zinc-100 transition-colors">O1.5 %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px] hover:text-zinc-100 transition-colors">O2.5 %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px] hover:text-zinc-100 transition-colors">BTTS %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px] hover:text-zinc-100 transition-colors">FTS %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px] hover:text-zinc-100 transition-colors text-emerald-500">CS %</th>
                                    </>
                                ) : soccerTab === 'corners' ? (
                                    <>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Avg Total</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Avg Team</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Avg Opp</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">O8.5 %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">O9.5 %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">O10.5 %</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">HT O0.5 %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">HT O1.5 %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">SH O0.5 %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">SH O1.5 %</th>
                                        <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">HT BTTS %</th>
                                    </>
                                )
                            ) : isBasketball ? (
                                <>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px] text-red-400">Pts Allowed</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Reb Allowed</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Ast Allowed</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Stl Allowed</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Blk Allowed</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">3PM Allowed</th>
                                </>
                            ) : (
                                <>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px] text-red-500">Yards Allowed</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Pass Yards</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Rush Yards</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">TDs Allowed</th>
                                    <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Int Forced</th>
                                </>
                            )}
                            <th className="py-4 px-4 text-center font-semibold uppercase tracking-wider text-[10px]">Sample</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {activeEntries.map((entry, idx) => {
                            const stats = advancedStatsMap[entry.team.id]
                            const isDataLoading = !stats && loading

                            return (
                                <tr key={entry.team.id} className="hover:bg-zinc-800/10 transition-colors group">
                                    <td className="py-4 px-4 sticky left-0 bg-zinc-900/90 backdrop-blur z-10 border-r border-zinc-800/50">
                                        <span className="text-zinc-500 font-mono text-[10px]">{idx + 1}</span>
                                    </td>
                                    <td className="py-4 px-4 sticky left-12 bg-zinc-900/90 backdrop-blur z-10 border-r border-zinc-800/50">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={getTeamLogo(entry.team)}
                                                alt={entry.team.displayName}
                                                className="w-5 h-5 object-contain"
                                            />
                                            <span className="font-medium text-zinc-300 group-hover:text-white transition-colors truncate max-w-[120px]">
                                                {entry.team.shortDisplayName}
                                            </span>
                                        </div>
                                    </td>

                                    {isDataLoading ? (
                                        <td colSpan={10} className="py-4 px-4 text-center">
                                            <div className="flex justify-center items-center gap-2 text-zinc-600 text-[10px]">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Analyzing...
                                            </div>
                                        </td>
                                    ) : stats ? (
                                        <>
                                            {isSoccer && stats.soccer && (
                                                soccerTab === 'goals' ? (
                                                    <>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-300">{stats.soccer.fullTime.avgGoals}</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.soccer.fullTime.over15}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.soccer.fullTime.over25}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-emerald-400/80">{stats.soccer.fullTime.btts}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-red-400/80">{stats.soccer.fullTime.failedToScore}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-emerald-500 font-bold">{stats.soccer.fullTime.cleanSheet}%</td>
                                                    </>
                                                ) : soccerTab === 'corners' ? (
                                                    <>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-300 font-bold">{stats.soccer.fullTime.corners.total}</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.soccer.fullTime.corners.us}</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.soccer.fullTime.corners.them}</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-500">{stats.soccer.fullTime.corners.over8}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-500">{stats.soccer.fullTime.corners.over9}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-500">{stats.soccer.fullTime.corners.over10}%</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.soccer.halfTime.over05}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-500">{stats.soccer.halfTime.over15}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.soccer.secondHalf.over05}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-500">{stats.soccer.secondHalf.over15}%</td>
                                                        <td className="py-4 px-4 text-center font-mono text-zinc-500">{stats.soccer.halfTime.btts}%</td>
                                                    </>
                                                )
                                            )}

                                            {isBasketball && stats.basketball && (
                                                <>
                                                    <td className="py-4 px-4 text-center font-mono text-red-400 font-bold">{stats.basketball.points}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.basketball.rebounds}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.basketball.assists}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-zinc-500">{stats.basketball.steals}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-zinc-500">{stats.basketball.blocks}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.basketball.threePointsMade}</td>
                                                </>
                                            )}

                                            {isNFL && stats.nfl && (
                                                <>
                                                    <td className="py-4 px-4 text-center font-mono text-red-500 font-bold">{stats.nfl.yards.total}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.nfl.yards.passing}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.nfl.yards.rushing}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-zinc-400">{stats.nfl.touchdowns}</td>
                                                    <td className="py-4 px-4 text-center font-mono text-emerald-400 font-bold">{stats.nfl.interceptions}</td>
                                                </>
                                            )}

                                            <td className="py-4 px-4 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-[9px] font-mono whitespace-nowrap">
                                                    {stats.sampleSize} Games
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <td colSpan={7} className="py-4 px-4 text-center text-zinc-600 italic text-[10px]">
                                            Analysis incomplete
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-zinc-950/20 border-t border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-zinc-600" />
                    <p className="text-[10px] text-zinc-600">
                        Detailed breakdown is based on all completed games for the current season. O1.5/2.5 identifies % of matches ending with that total.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        High Value
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Defensive Vulnerability
                    </div>
                </div>
            </div>
        </div>
    )
}
