'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { X, Loader2, Trophy, Clock, AlertTriangle, MapPin, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react'
import { GameSummary } from '@/lib/types'
import { extractBasketballQuarterlyStats } from '@/lib/stats-utils'

interface MatchStatsCardProps {
    isOpen: boolean
    onClose: () => void
    sport: string
    league: string
    eventId: string
    homeTeamId: string
    awayTeamId: string
    date: string
    onNext?: () => void
    onPrevious?: () => void
}

export function MatchStatsCard({
    isOpen,
    onClose,
    sport,
    league,
    eventId,
    homeTeamId,
    awayTeamId,
    date,
    onNext,
    onPrevious
}: MatchStatsCardProps) {
    const [summary, setSummary] = useState<GameSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'home' | 'away' | 'stats'>('home')

    useEffect(() => {
        if (!isOpen || !eventId) return

        let mounted = true
        setLoading(true)
        setError(null)

        fetch(`/api/summary?sport=${sport}&league=${league}&event=${eventId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch stats')
                return res.json()
            })
            .then(data => {
                if (mounted) {
                    setSummary(data)
                    setLoading(false)
                }
            })
            .catch(err => {
                if (mounted) {
                    setError('Stats unavailable')
                    setLoading(false)
                }
            })

        return () => { mounted = false }
    }, [isOpen, eventId, sport, league])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && onNext) onNext()
            if (e.key === 'ArrowLeft' && onPrevious) onPrevious()
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onNext, onPrevious, onClose])

    if (!isOpen) return null

    const homeTeamIdToUse = homeTeamId || summary?.header?.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.id
    const awayTeamIdToUse = awayTeamId || summary?.header?.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.id

    // find home/away in summary boxscore (sometimes order differs)
    const homeTeamStats = summary?.boxscore?.teams?.find(t => t.team.id === homeTeamIdToUse)
    const awayTeamStats = summary?.boxscore?.teams?.find(t => t.team.id === awayTeamIdToUse)

    // Header Data
    const competitionName = summary?.header?.league?.name || sport.toUpperCase()
    const homeComp = summary?.header?.competitions[0]?.competitors?.find(c => c.homeAway === 'home')
    const awayComp = summary?.header?.competitions[0]?.competitors?.find(c => c.homeAway === 'away')
    const displayDate = summary?.header?.competitions?.[0]?.date ? new Date(summary.header.competitions[0].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''
    const matchStatus = summary?.header?.competitions?.[0]?.status?.type?.detail || 'Final'

    const renderHeader = () => {
        const hRecord = homeComp?.record?.find((r: any) => r.type === 'total')?.summary || homeComp?.record?.[0]?.summary
        const aRecord = awayComp?.record?.find((r: any) => r.type === 'total')?.summary || awayComp?.record?.[0]?.summary

        return (
            <div className="mb-8">
                <div className="flex justify-between items-center text-xs text-zinc-500 mb-6 uppercase tracking-wider">
                    <span>{competitionName} &bull; {displayDate}</span>
                    <span className="text-white font-bold">{matchStatus}</span>
                </div>

                <div className="flex items-center justify-between px-4">
                    <div className="flex flex-col items-center gap-2 w-1/3">
                        <img src={homeComp?.team?.logos?.[0]?.href} className="w-16 h-16 object-contain drop-shadow-xl" />
                        <div className="flex flex-col items-center">
                            <span className="text-center font-bold text-zinc-100 text-sm leading-tight">{homeComp?.team?.displayName}</span>
                            {hRecord && <span className="text-[10px] text-zinc-600 font-mono mt-0.5">({hRecord})</span>}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-4xl font-black font-mono text-white">
                        <span className={homeComp?.winner ? 'text-indigo-400' : ''}>{homeComp?.score}</span>
                        <span className="text-zinc-700">-</span>
                        <span className={awayComp?.winner ? 'text-indigo-400' : ''}>{awayComp?.score}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 w-1/3">
                        <img src={awayComp?.team?.logos?.[0]?.href} className="w-16 h-16 object-contain drop-shadow-xl" />
                        <div className="flex flex-col items-center">
                            <span className="text-center font-bold text-zinc-100 text-sm leading-tight">{awayComp?.team?.displayName}</span>
                            {aRecord && <span className="text-[10px] text-zinc-600 font-mono mt-0.5">({aRecord})</span>}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Helper to get stat value
    const getStat = (teamStats: any, statName: string) => {
        return teamStats?.statistics?.find((s: any) => s.name === statName || s.label === statName)?.displayValue || '-'
    }

    // Helper to finding total for a stat (sum of both teams if numeric)
    const getTotal = (statName: string) => {
        const h = parseFloat(getStat(homeTeamStats, statName)) || 0
        const a = parseFloat(getStat(awayTeamStats, statName)) || 0
        if (isNaN(h) || isNaN(a)) return '-'
        return h + a
    }

    const renderSoccerStats = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium border-b border-zinc-800 pb-2">
                <div className="text-zinc-400">Home</div>
                <div className="text-zinc-500 uppercase text-xs tracking-wider">Stat</div>
                <div className="text-zinc-400">Away</div>
            </div>

            {[
                { label: 'Shots on Target', key: 'shotsOnTarget' },
                { label: 'Corners', key: 'wonCorners' },
                { label: 'Yellow Cards', key: 'yellowCards' },
                { label: 'Red Cards', key: 'redCards' },
            ].map(stat => (
                <div key={stat.key} className="grid grid-cols-3 gap-4 text-center items-center">
                    <div className="text-emerald-400 font-bold">{getStat(homeTeamStats, stat.key)}</div>
                    <div className="text-zinc-400 text-xs">{stat.label}</div>
                    <div className="text-blue-400 font-bold">{getStat(awayTeamStats, stat.key)}</div>
                </div>
            ))}

            {/* Goalscorers */}
            <div className="mt-6">
                <h4 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Goalscorers</h4>
                <div className="space-y-2 text-sm">
                    {summary?.scoringPlays?.filter(p => p.type.text === 'Goal').map((play, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-900/50 p-2 rounded">
                            <span className={play.team?.id === homeTeamId ? 'text-emerald-400' : 'text-zinc-400'}>
                                {play.team?.id === homeTeamId ? (play.text || 'Goal') : ''}
                            </span>
                            <span className="text-xs text-zinc-600 font-mono">{play.clock?.displayValue}</span>
                            <span className={play.team?.id === awayTeamId ? 'text-blue-400' : 'text-zinc-400'}>
                                {play.team?.id === awayTeamId ? (play.text || 'Goal') : ''}
                            </span>
                        </div>
                    )) || <div className="text-zinc-600 italic">No goals recorded</div>}
                </div>
            </div>
        </div>
    )
    const renderBasketballStats = () => {
        const homeComp = summary?.header?.competitions[0]?.competitors?.find(c => c.homeAway === 'home')
        const awayComp = summary?.header?.competitions[0]?.competitors?.find(c => c.homeAway === 'away')
        const homePlayers = summary?.boxscore?.players?.find(p => p.team.id === homeTeamId)
        const awayPlayers = summary?.boxscore?.players?.find(p => p.team.id === awayTeamId)
        const homeBox = summary?.boxscore?.teams?.find(t => t.team.id === homeTeamId)
        const awayBox = summary?.boxscore?.teams?.find(t => t.team.id === awayTeamId)

        // Linescore (Points by period)
        const periods = homeComp?.linescores?.map((_, i) => i + 1) || [1, 2, 3, 4]

        // Quarterly Stats
        const quarterlyData = extractBasketballQuarterlyStats(summary)

        return (
            <div className="space-y-6">
                {/* Linescore Table */}
                <div className="overflow-x-auto bg-zinc-900/30 p-4 rounded-lg border border-zinc-800/50">
                    <table className="w-full text-sm text-zinc-400 border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left py-3 font-medium px-4">Team</th>
                                {periods.map(p => <th key={p} className="text-center py-3 font-medium w-12">{p}</th>)}
                                <th className="text-center py-3 font-bold text-zinc-200 w-16">T</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-zinc-800/50">
                                <td className="py-3 px-4 text-zinc-300 font-medium whitespace-nowrap">{homeComp?.team?.displayName}</td>
                                {homeComp?.linescores?.map((ls: any, i: number) => (
                                    <td key={i} className="text-center py-3">{ls.displayValue || ls.value}</td>
                                ))}
                                <td className="text-center py-3 font-bold text-white text-lg">{homeComp?.score}</td>
                            </tr>
                            <tr className="border-b border-zinc-800/50">
                                <td className="py-3 px-4 text-zinc-300 font-medium whitespace-nowrap">{awayComp?.team?.displayName}</td>
                                {awayComp?.linescores?.map((ls: any, i: number) => (
                                    <td key={i} className="text-center py-3">{ls.displayValue || ls.value}</td>
                                ))}
                                <td className="text-center py-3 font-bold text-white text-lg">{awayComp?.score}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Quarterly Breakdown Table (New) */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-widest px-1">
                        <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                        Quarterly Breakdown
                    </h4>
                    <div className="overflow-x-auto bg-zinc-900/10 rounded-lg border border-zinc-800/40">
                        <table className="w-full text-[11px] border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/40 text-zinc-500 uppercase font-bold">
                                    <th className="py-2.5 px-3 text-left w-20">Period</th>
                                    <th className="py-2.5 px-3 text-center border-l border-zinc-800/50" colSpan={3}>{homeComp?.team?.abbreviation}</th>
                                    <th className="py-2.5 px-3 text-center border-l border-zinc-800/50" colSpan={3}>{awayComp?.team?.abbreviation}</th>
                                </tr>
                                <tr className="text-zinc-600 border-b border-zinc-800/50 font-mono">
                                    <th className="py-1 px-3"></th>
                                    <th className="py-1 px-2 text-center border-l border-zinc-800/50">PTS</th>
                                    <th className="py-1 px-2 text-center">REB</th>
                                    <th className="py-1 px-2 text-center">AST</th>
                                    <th className="py-1 px-2 text-center border-l border-zinc-800/50">PTS</th>
                                    <th className="py-1 px-2 text-center">REB</th>
                                    <th className="py-1 px-2 text-center">AST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quarterlyData.quarters.map((q) => (
                                    <tr key={q.period} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                                        <td className="py-2 px-3 font-bold text-zinc-400">{q.label}</td>
                                        <td className="py-2 px-2 text-center border-l border-zinc-800/50 font-mono text-zinc-100">{q.home.pts}</td>
                                        <td className="py-2 px-2 text-center font-mono text-zinc-400">{q.home.reb}</td>
                                        <td className="py-2 px-2 text-center font-mono text-zinc-400">{q.home.ast}</td>
                                        <td className="py-2 px-2 text-center border-l border-zinc-800/50 font-mono text-zinc-100">{q.away.pts}</td>
                                        <td className="py-2 px-2 text-center font-mono text-zinc-400">{q.away.reb}</td>
                                        <td className="py-2 px-2 text-center font-mono text-zinc-400">{q.away.ast}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 bg-zinc-900/20 rounded-t-lg">
                    {[
                        { id: 'home', label: homeComp?.team?.abbreviation || 'HOME' },
                        { id: 'away', label: awayComp?.team?.abbreviation || 'AWAY' },
                        { id: 'stats', label: 'STATS' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 text-xs font-bold tracking-widest transition-all border-b-2 ${activeTab === tab.id
                                ? 'border-indigo-500 text-white bg-indigo-500/10'
                                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                    {activeTab === 'stats' ? (
                        <div className="space-y-1 py-4">
                            <div className="flex justify-between items-center px-6 mb-6">
                                <img src={homeComp?.team?.logos?.[0]?.href} className="w-8 h-8 object-contain" />
                                <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Team Comparison</span>
                                <img src={awayComp?.team?.logos?.[0]?.href} className="w-8 h-8 object-contain" />
                            </div>
                            {[
                                { label: 'Field goals', key: 'fieldGoalsMade-fieldGoalsAttempted' },
                                { label: 'Field goal %', key: 'fieldGoalPct' },
                                { label: '3 pointers', key: 'threePointFieldGoalsMade-threePointFieldGoalsAttempted' },
                                { label: 'Three point %', key: 'threePointFieldGoalPct' },
                                { label: 'Free throws', key: 'freeThrowsMade-freeThrowsAttempted' },
                                { label: 'Free throw %', key: 'freeThrowPct' },
                                { label: 'Total rebounds', key: 'totalRebounds' },
                                { label: 'Offensive Rebounds', key: 'offensiveRebounds' },
                                { label: 'Defensive rebounds', key: 'defensiveRebounds' },
                                { label: 'Assists', key: 'assists' },
                                { label: 'Blocks', key: 'blocks' },
                                { label: 'Steals', key: 'steals' },
                                { label: 'Turnovers', key: 'turnovers' },
                                { label: 'Points off turnovers', key: 'pointsOffTurnovers' },
                                { label: 'Fast break points', key: 'fastBreakPoints' },
                                { label: 'Points in the paint', key: 'pointsInPaint' },
                                { label: 'Fouls', key: 'fouls' },
                                { label: 'Largest lead', key: 'largestLead' },
                            ].map((stat, i) => (
                                <div key={stat.key} className={`flex flex-col gap-1 px-4 py-2 ${i % 2 === 0 ? 'bg-zinc-900/20' : ''}`}>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-200 w-24 text-left font-mono font-bold">{getStat(homeBox, stat.key)}</span>
                                        <span className="text-zinc-500 text-[10px] uppercase font-bold text-center flex-1">{stat.label}</span>
                                        <span className="text-zinc-200 w-24 text-right font-mono font-bold">{getStat(awayBox, stat.key)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-zinc-500 border-b border-zinc-800">
                                        <th className="py-4 font-bold pr-4 sticky left-0 bg-zinc-950 px-4">PLAYER</th>
                                        <th className="px-3 font-bold text-center">MIN</th>
                                        <th className="px-3 font-bold text-center">REB</th>
                                        <th className="px-3 font-bold text-center">AST</th>
                                        <th className="px-3 font-bold text-center text-zinc-200">PTS</th>
                                        <th className="px-3 font-bold text-center">FGM</th>
                                        <th className="px-3 font-bold text-center">3PM</th>
                                        <th className="px-3 font-bold text-center">STL</th>
                                        <th className="px-3 font-bold text-center">BLK</th>
                                        <th className="pl-4 font-bold text-right pr-4">+/-</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activeTab === 'home' ? homePlayers : awayPlayers)?.statistics?.[0]?.athletes?.map((player: any) => {
                                        const stats = player.stats || []
                                        const keys = (activeTab === 'home' ? homePlayers : awayPlayers)?.statistics?.[0]?.names || []
                                        const getVal = (key: string) => {
                                            const idx = keys.indexOf(key)
                                            return idx !== -1 ? stats[idx] : '-'
                                        }

                                        // Skip players who didn't play (DNP)
                                        if (stats.some((s: string) => s.includes("DNP") || s.includes("DECISION"))) {
                                            return (
                                                <tr key={player.athlete.id} className="border-b border-zinc-900 text-xs opacity-50">
                                                    <td className="py-3 pr-2 sticky left-0 bg-zinc-950 border-r border-zinc-900">
                                                        <div className="flex flex-col">
                                                            <span className="text-zinc-400">{player.athlete.displayName}</span>
                                                            <span className="text-zinc-600 text-[10px] uppercase font-mono">{player.athlete.position?.abbreviation}</span>
                                                        </div>
                                                    </td>
                                                    <td colSpan={9} className="py-3 pl-4 text-[10px] text-zinc-600 italic">DNP - Coach's Decision</td>
                                                </tr>
                                            )
                                        }

                                        return (
                                            <tr key={player.athlete.id} className="border-b border-zinc-900 text-sm hover:bg-zinc-900/40 transition-colors">
                                                <td className="py-4 pr-4 whitespace-nowrap sticky left-0 bg-zinc-950 border-r border-zinc-900 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-zinc-200 font-medium">{player.athlete.displayName}</span>
                                                        <span className="text-xs text-zinc-500 uppercase font-mono">{player.athlete.position?.abbreviation}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 text-center text-zinc-400 font-mono">{getVal('MIN')}</td>
                                                <td className="px-3 text-center text-zinc-400 font-mono">{getVal('REB')}</td>
                                                <td className="px-3 text-center text-zinc-400 font-mono">{getVal('AST')}</td>
                                                <td className="px-3 text-center text-white font-bold font-mono">{getVal('PTS')}</td>
                                                <td className="px-3 text-center text-zinc-400 font-mono">{getVal('FG')?.split('-')?.[0]}</td>
                                                <td className="px-3 text-center text-zinc-400 font-mono">{getVal('3PT')?.split('-')?.[0]}</td>
                                                <td className="px-3 text-center text-zinc-400 font-mono">{getVal('STL')}</td>
                                                <td className="px-3 text-center text-zinc-400 font-mono">{getVal('BLK')}</td>
                                                <td className={`pr-4 text-right font-mono ${parseFloat(getVal('+/-')) > 0 ? 'text-emerald-500' : parseFloat(getVal('+/-')) < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                                                    {getVal('+/-')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="pt-6 border-t border-zinc-800 text-[10px] flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        <span className="text-indigo-400/80">Venue:</span>
                        <span>{summary?.header?.competitions?.[0]?.venue?.fullName}</span>
                    </div>
                </div>
            </div>
        )
    }

    const renderNFLStats = () => (
        <div className="space-y-6">
            {/* Score */}
            <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-lg">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{summary?.header?.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.score}</div>
                    <div className="text-xs text-zinc-500">Home</div>
                </div>
                <div className="text-zinc-600 font-bold">VS</div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{summary?.header?.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.score}</div>
                    <div className="text-xs text-zinc-500">Away</div>
                </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                <div className="text-center text-zinc-500 col-span-3 pb-2 border-b border-zinc-800">Team Stats</div>

                {[
                    { label: 'Passing', key: 'passingYards' }, // or 'netPassingYards'
                    { label: 'Rushing', key: 'rushingYards' },
                    { label: 'Penalties', key: 'totalPenaltiesYards' }, // 'totalPenalties' often 'X-Y'
                ].map(stat => (
                    <div key={stat.key} className="contents">
                        <div className="text-right text-zinc-300">{getStat(homeTeamStats, stat.key)}</div>
                        <div className="text-center text-zinc-600 text-xs uppercase">{stat.label}</div>
                        <div className="text-left text-zinc-300">{getStat(awayTeamStats, stat.key)}</div>
                    </div>
                ))}
            </div>

            {/* Touchdowns */}
            <div>
                <h4 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Touchdowns</h4>
                <div className="space-y-2">
                    {/* Filter scoring plays for TD */}
                    {summary?.scoringPlays?.filter(p => p.type?.text?.includes('Touchdown')).map((play, i) => (
                        <div key={i} className="text-sm bg-zinc-900/50 p-2 rounded border-l-2 border-zinc-700">
                            <span className="text-zinc-300 font-medium">{play.text}</span>
                            <div className="text-xs text-zinc-500 mt-1 flex justify-between">
                                <span>{play.team?.id === homeTeamId ? 'Home' : 'Away'}</span>
                                <span>Q{play.period?.number} - {play.clock?.displayValue}</span>
                            </div>
                        </div>
                    )) || <div className="text-zinc-600 text-sm">No Touchdowns</div>}
                </div>
            </div>

            {/* Handicap/Spread */}
            {summary?.pickcenter && summary.pickcenter.length > 0 && (
                <div className="text-center mt-4">
                    <span className="text-xs bg-black/40 px-2 py-1 rounded text-zinc-400 border border-zinc-800">
                        Odds: {summary.pickcenter[0].details || 'N/A'}
                    </span>
                </div>
            )}
        </div>
    )

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-zinc-950/95 border-b border-zinc-800 p-4 flex justify-between items-center z-10">
                    <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        Match Stats
                    </h3>
                    <div className="flex items-center gap-4">
                        {(onPrevious || onNext) && (
                            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                <button
                                    onClick={onPrevious}
                                    disabled={!onPrevious}
                                    className="p-1.5 hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent rounded-md text-zinc-400 hover:text-white transition-colors"
                                    title="Previous Match (←)"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="w-px h-4 bg-zinc-800 mx-1" />
                                <button
                                    onClick={onNext}
                                    disabled={!onNext}
                                    className="p-1.5 hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent rounded-md text-zinc-400 hover:text-white transition-colors"
                                    title="Next Match (→)"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-zinc-500 text-sm">Loading stats...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400 flex flex-col items-center gap-2">
                            <AlertTriangle className="w-8 h-8 opacity-50" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {renderHeader()}

                            {/* Content based on Sport */}
                            {(sport === 'soccer') && renderSoccerStats()}
                            {(sport === 'basketball' || sport === 'nba') && renderBasketballStats()}
                            {(sport === 'football' || sport === 'nfl') && renderNFLStats()}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
