'use client'

import { SoccerPeriodBreakdown } from '@/lib/stats-utils'
import { useState } from 'react'
import { Trophy, Target, Shield, Zap, Flag } from 'lucide-react'

interface SoccerStatBreakdownProps {
    team1: { name: string, stats: SoccerPeriodBreakdown }
    team2: { name: string, stats: SoccerPeriodBreakdown }
    fullTime: { t1: SoccerPeriodBreakdown, t2: SoccerPeriodBreakdown }
    halfTime: { t1: SoccerPeriodBreakdown, t2: SoccerPeriodBreakdown }
    secondHalf: { t1: SoccerPeriodBreakdown, t2: SoccerPeriodBreakdown }
}

export function SoccerStatBreakdown({ team1, team2, fullTime, halfTime, secondHalf }: SoccerStatBreakdownProps) {
    const [tab, setTab] = useState<'ft' | '1h' | '2h'>('ft')

    const current = tab === 'ft' ? fullTime : tab === '1h' ? halfTime : secondHalf

    return (
        <div className="space-y-6">
            <div className="flex bg-zinc-900/50 p-1 border border-zinc-800 rounded-xl overflow-hidden">
                {(['ft', '1h', '2h'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${tab === t ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {t === 'ft' ? 'Full Time' : t === '1h' ? '1st Half' : '2nd Half'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatGroup
                    title="Goals Scored"
                    icon={<Target className="w-4 h-4 text-emerald-400" />}
                    team1Name={team1.name}
                    team2Name={team2.name}
                    rows={[
                        { label: 'Scored Over 0.5', key: 'failedToScore', isInverse: true },
                        { label: 'Scored Over 1.5', key: 'teamOver15' },
                        { label: 'Average Goals', key: 'avgGoals', isRaw: true },
                    ]}
                    data={current}
                />

                <StatGroup
                    title="Goals Conceded"
                    icon={<Shield className="w-4 h-4 text-rose-400" />}
                    team1Name={team1.name}
                    team2Name={team2.name}
                    rows={[
                        { label: 'Clean Sheet', key: 'cleanSheet' },
                        { label: 'Conceded Over 1.5', key: 'oppOver15' },
                    ]}
                    data={current}
                    isOpponentRow={true}
                />

                <StatGroup
                    title="Over 2.5 & BTTS"
                    icon={<Zap className="w-4 h-4 text-amber-400" />}
                    team1Name={team1.name}
                    team2Name={team2.name}
                    rows={[
                        { label: 'Over 2.5 Goals', key: 'over25' },
                        { label: 'BTTS (Both Teams Score)', key: 'btts' },
                        { label: 'BTTS & Over 2.5', key: 'bttsOver25' },
                        { label: 'BTTS & No Over 2.5', key: 'bttsNoOver25' },
                        { label: 'BTTS & Win', key: 'bttsWin' },
                    ]}
                    data={current}
                />

                <StatGroup
                    title="Match Corners"
                    icon={<Flag className="w-4 h-4 text-blue-400" />}
                    team1Name={team1.name}
                    team2Name={team2.name}
                    rows={[
                        { label: 'Corner Kicks (Avg)', key: 'corners.total', isRaw: true },
                        { label: 'Over 8.5 Corners', key: 'corners.over8' },
                        { label: 'Over 9.5 Corners', key: 'corners.over9' },
                        { label: 'Over 10.5 Corners', key: 'corners.over10' },
                        { label: 'Over 11.5 Corners', key: 'corners.over11' },
                    ]}
                    data={current}
                />

                <StatGroup
                    title="Team Corners"
                    icon={<Flag className="w-4 h-4 text-indigo-400" />}
                    team1Name={team1.name}
                    team2Name={team2.name}
                    rows={[
                        { label: 'Corners Earned (Avg)', key: 'corners.us', isRaw: true },
                        { label: 'Corners Against (Avg)', key: 'corners.them', isRaw: true },
                        { label: 'Over 3.5 Team Cnr', key: 'corners.teamOver35' },
                        { label: 'Over 4.5 Team Cnr', key: 'corners.teamOver45' },
                        { label: 'Over 3.5 Opp Cnr', key: 'corners.oppOver35' },
                    ]}
                    data={current}
                />
            </div>
        </div>
    )
}

function StatGroup({ title, icon, team1Name, team2Name, rows, data, isOpponentRow }: { title: string, icon: React.ReactNode, team1Name: string, team2Name: string, rows: any[], data: { t1: any, t2: any }, isOpponentRow?: boolean }) {
    return (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-2">
                {icon}
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">{title}</h3>
            </div>
            <div className="p-4 flex-1">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-zinc-500 text-[10px] uppercase tracking-widest border-b border-zinc-800/50">
                            <th className="pb-2 font-medium">Metric</th>
                            <th className="pb-2 font-medium text-center truncate max-w-[80px]" title={team1Name}>{team1Name.split(' ')[0]}</th>
                            <th className="pb-2 font-medium text-center truncate max-w-[80px]" title={team2Name}>{team2Name.split(' ')[0]}</th>
                            <th className="pb-2 font-medium text-center">Avg</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {rows.map((row) => {
                            const getVal = (obj: any, path: string) => {
                                const v = path.split('.').reduce((o, i) => o[i], obj)
                                return row.isInverse ? 100 - v : v
                            }
                            const val1 = getVal(data.t1, row.key)
                            const val2 = getVal(data.t2, row.key)
                            const avgValue = row.isRaw ? (parseFloat(val1) + parseFloat(val2)) / 2 : Math.round((val1 + val2) / 2)

                            return (
                                <tr key={row.key} className="group hover:bg-zinc-800/20 transition-colors">
                                    <td className="py-2.5 text-zinc-400 font-medium text-xs">{row.label}</td>
                                    <td className="py-2.5 text-center">
                                        <div className={`inline-flex items-center justify-center min-w-[36px] px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${row.isRaw ? 'text-white' : getProbColor(val1)}`}>
                                            {row.isRaw ? val1 : `${val1}%`}
                                        </div>
                                    </td>
                                    <td className="py-2.5 text-center">
                                        <div className={`inline-flex items-center justify-center min-w-[36px] px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${row.isRaw ? 'text-white' : getProbColor(val2)}`}>
                                            {row.isRaw ? val2 : `${val2}%`}
                                        </div>
                                    </td>
                                    <td className="py-2.5 text-center">
                                        <div className={`inline-flex items-center justify-center min-w-[36px] px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${row.isRaw ? 'text-indigo-400' : getProbColor(avgValue as number)}`}>
                                            {row.isRaw ? avgValue.toFixed(1) : `${avgValue}%`}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function getProbColor(val: number) {
    if (val >= 80) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
    if (val >= 60) return 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
    if (val >= 40) return 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
    return 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
}
