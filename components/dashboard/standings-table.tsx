
"use client"

import { useEffect, useState } from "react"
import { StandingEntry, Standings } from "@/lib/types"
import { Loader2, Plus, Minus, Info } from "lucide-react"

interface StandingsTableProps {
    sport: string
    league: string
}

export function StandingsTable({ sport, league }: StandingsTableProps) {
    const [standings, setStandings] = useState<Standings | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)

    useEffect(() => {
        if (!league) return

        let mounted = true
        setLoading(true)
        setError(null)
        setStandings(null)
        setSelectedGroupIndex(0)

        // Map sport key for API if needed
        const apiSport = sport === 'football' ? 'soccer' : (sport === 'nfl' || sport === 'ncaaf') ? 'football' : sport

        fetch(`/api/standings?sport=${apiSport}&league=${league}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch standings")
                return res.json()
            })
            .then(data => {
                if (mounted) {
                    if (data.entries || (data.groups && data.groups.length > 0)) {
                        setStandings(data)
                        // If tabs exist, default to first tab (usually East or current season)
                        if (data.groups && data.groups.length > 0) {
                            setSelectedGroupIndex(0)
                        }
                    } else {
                        setError("No standings data available")
                    }
                    setLoading(false)
                }
            })
            .catch(err => {
                console.error(err)
                if (mounted) {
                    setError("Failed to load standings")
                    setLoading(false)
                }
            })

        return () => { mounted = false }
    }, [sport, league])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-zinc-600" />
            </div>
        )
    }

    if (error || !standings) {
        if (!league) return null // Don't show error if no league selected yet
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
                <Info className="w-6 h-6" />
                <p>{error || "No standings available"}</p>
            </div>
        )
    }
    // Helper to get stat value
    const getStat = (entry: StandingEntry, type: string) => {
        // Try precise match first
        let stat = entry.stats.find(s => s.type === type || s.name === type)
        // Fallback to abbreviation if needed (less reliable)
        if (!stat) stat = entry.stats.find(s => s.abbreviation === type)
        return stat?.displayValue || '-'
    }

    const getStatValue = (entry: StandingEntry, type: string) => {
        let stat = entry.stats.find(s => s.type === type || s.name === type)
        if (!stat) stat = entry.stats.find(s => s.abbreviation === type)
        return stat?.value || 0
    }

    // Determine entries to show based on selected group
    const activeEntries = standings?.groups && standings.groups.length > 0
        ? standings.groups[selectedGroupIndex].entries
        : standings?.entries || [] // Ensure activeEntries is always an array

    // Flag for sport-specific rendering
    const isBasketball = league === 'nba' || league === 'mens-college-basketball'
    const isNFL = league === 'nfl'
    const isSoccer = league === 'eng.1'

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-zinc-600" />
            </div>
        )
    }

    if (error || !standings || activeEntries.length === 0) { // Added activeEntries.length check
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
                <Info className="w-6 h-6" />
                <p>{error || "No standings available"}</p>
            </div>
        )
    }

    return (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {standings.name} Table
                    </h3>
                </div>

                {/* Tabs for Conferences/Groups (Divisions for NFL) */}
                {standings.groups && standings.groups.length > 0 && (
                    <div className="flex flex-wrap gap-1 bg-zinc-950/50 p-1 rounded-lg w-fit max-w-full overflow-x-auto no-scrollbar">
                        {standings.groups.map((group, idx) => (
                            <button
                                key={group.name}
                                onClick={() => setSelectedGroupIndex(idx)}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${selectedGroupIndex === idx
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                    }`}
                            >
                                {group.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                            <th className="py-2 px-3 text-left w-12 text-xs font-semibold uppercase tracking-wider">Pos</th>
                            <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>

                            {isBasketball ? (
                                <>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider text-white">W</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider text-zinc-400">L</th>
                                    <th className="py-2 px-3 text-center w-14 text-xs font-semibold uppercase tracking-wider text-zinc-400">Pct</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider text-zinc-400">GB</th>
                                    <th className="py-2 px-3 text-center w-14 text-xs font-semibold uppercase tracking-wider hidden md:table-cell text-zinc-400">Conf</th>
                                    <th className="py-2 px-3 text-center w-14 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell text-zinc-400">Home</th>
                                    <th className="py-2 px-3 text-center w-14 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell text-zinc-400">Away</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell text-zinc-400">L10</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider text-zinc-400">Strk</th>
                                </>
                            ) : isNFL ? (
                                <>
                                    <th className="py-2 px-3 text-center w-10 text-xs font-semibold uppercase tracking-wider text-white">W</th>
                                    <th className="py-2 px-3 text-center w-10 text-xs font-semibold uppercase tracking-wider text-zinc-400">L</th>
                                    <th className="py-2 px-3 text-center w-10 text-xs font-semibold uppercase tracking-wider text-zinc-500">T</th>
                                    <th className="py-2 px-3 text-center w-14 text-xs font-semibold uppercase tracking-wider">Pct</th>
                                    <th className="py-2 px-3 text-center w-14 text-xs font-semibold uppercase tracking-wider">PF</th>
                                    <th className="py-2 px-3 text-center w-14 text-xs font-semibold uppercase tracking-wider">PA</th>
                                    <th className="py-2 px-3 text-center w-16 text-xs font-semibold uppercase tracking-wider hidden md:table-cell text-zinc-400">Home</th>
                                    <th className="py-2 px-3 text-center w-16 text-xs font-semibold uppercase tracking-wider hidden md:table-cell text-zinc-400">Away</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider">Strk</th>
                                </>
                            ) : (
                                <>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider">MP</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider">Win</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider text-green-500">GF</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider text-red-500">GA</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider">GD</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider text-white">Pts</th>
                                    <th className="py-2 px-3 text-center w-12 text-xs font-semibold uppercase tracking-wider">AVG</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {activeEntries.map((entry, index) => {
                            const findRank = (s: any) => {
                                const name = s.name?.toLowerCase() || ''
                                const type = s.type?.toLowerCase() || ''
                                return name === 'rank' || type === 'rank' ||
                                    name === 'playoffseed' || type === 'playoffseed' ||
                                    name === 'seed' || type === 'seed'
                            }
                            const rank = entry.stats.find(findRank)?.value || index + 1
                            const noteColor = entry.note?.color

                            return (
                                <tr key={entry.team.id} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="py-2 px-3">
                                        <div
                                            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-zinc-900"
                                            style={{ backgroundColor: noteColor || '#27272a', color: noteColor ? '#000' : '#a1a1aa' }}
                                        >
                                            {rank}
                                        </div>
                                    </td>
                                    <td className="py-2 px-3">
                                        <div className="flex items-center gap-3">
                                            {entry.team.logos?.[0]?.href && (
                                                <img src={entry.team.logos[0].href} alt={entry.team.shortDisplayName} className="w-6 h-6 object-contain" />
                                            )}
                                            <span className="font-medium text-zinc-200 group-hover:text-white truncate max-w-[120px] md:max-w-[180px]">
                                                {entry.team.shortDisplayName}
                                            </span>
                                        </div>
                                    </td>

                                    {isBasketball ? (
                                        <>
                                            <td className="py-2 px-3 text-center font-mono font-bold text-white">{getStat(entry, 'wins')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400">{getStat(entry, 'losses')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-300">{getStat(entry, 'winPercent')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400">{getStat(entry, 'gamesBehind')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400 hidden md:table-cell">{getStat(entry, 'vsconf')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400 hidden lg:table-cell">{getStat(entry, 'home')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400 hidden lg:table-cell">{getStat(entry, 'road')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-300 hidden sm:table-cell">{getStat(entry, 'lasttengames')}</td>
                                            <td className="py-2 px-3 text-center font-mono font-medium text-white">{getStat(entry, 'streak')}</td>
                                        </>
                                    ) : isNFL ? (
                                        <>
                                            <td className="py-2 px-3 text-center font-mono font-bold text-white">{getStat(entry, 'wins')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400">{getStat(entry, 'losses')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-500">{getStat(entry, 'ties')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-300">{getStat(entry, 'winPercent')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-green-400">{getStat(entry, 'pointsFor')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-red-400">{getStat(entry, 'pointsAgainst')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400 hidden md:table-cell">{getStat(entry, 'home')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400 hidden md:table-cell">{getStat(entry, 'road')}</td>
                                            <td className="py-2 px-3 text-center font-mono font-medium text-white">{getStat(entry, 'streak')}</td>
                                        </>
                                    ) : (
                                        <>
                                            {/* Matches Played */}
                                            <td className="py-2 px-3 text-center font-mono text-zinc-300">{getStatValue(entry, 'gamesPlayed')}</td>
                                            {/* Win % */}
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400">{getStat(entry, 'wins')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-green-400 font-medium">{getStatValue(entry, 'pointsFor')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-red-400">{getStatValue(entry, 'pointsAgainst')}</td>
                                            <td className="py-2 px-3 text-center font-mono text-zinc-300">
                                                {getStatValue(entry, 'pointDifferential') > 0 ? `+${getStatValue(entry, 'pointDifferential')}` : getStatValue(entry, 'pointDifferential')}
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono font-bold text-white">{getStat(entry, 'points')}</td>
                                            {/* Average Goals */}
                                            <td className="py-2 px-3 text-center font-mono text-zinc-400">
                                                {getStatValue(entry, 'gamesPlayed') > 0
                                                    ? ((getStatValue(entry, 'pointsFor') + getStatValue(entry, 'pointsAgainst')) / getStatValue(entry, 'gamesPlayed')).toFixed(2)
                                                    : '0.00'}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend if needed */}
            {activeEntries.some(e => e.note) && (
                <div className="p-3 bg-zinc-950/30 border-t border-zinc-800 flex flex-wrap gap-4 text-xs">
                    {Array.from(new Set(activeEntries.filter(e => e.note).map(e => JSON.stringify(e.note)))).map(noteStr => {
                        const note = JSON.parse(noteStr)
                        return (
                            <div key={note.description} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: note.color }}></span>
                                <span className="text-zinc-500">{note.description}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
