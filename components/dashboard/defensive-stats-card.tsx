'use client'

import { BasketballAllowedStats, NFLAllowedStats } from '@/lib/stats-utils'
import { Shield, Target, Zap, Waves, Activity } from 'lucide-react'

interface DefensiveStatsCardProps {
    sport: string
    basketball?: BasketballAllowedStats
    nfl?: NFLAllowedStats
    teamName: string
}

export function DefensiveStatsCard({ sport, basketball, nfl, teamName }: DefensiveStatsCardProps) {
    if (sport === 'basketball' && basketball) {
        return (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">Allowed Stats</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                        {teamName}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <MetricBox label="Points" value={basketball.points} icon={<Activity className="w-3 h-3" />} subValue="Avg / match" />
                    <MetricBox label="Rebounds" value={basketball.rebounds} icon={<Waves className="w-3 h-3" />} subValue="Avg / match" />
                    <MetricBox label="Assists" value={basketball.assists} icon={<Zap className="w-3 h-3" />} subValue="Avg / match" />
                    <MetricBox label="Steals" value={basketball.steals} icon={<Target className="w-3 h-3" />} subValue="Avg / match" />
                    <MetricBox label="Blocks" value={basketball.blocks} icon={<Shield className="w-3 h-3" />} subValue="Avg / match" />
                    <MetricBox label="3PM" value={basketball.threePointsMade} icon={<Target className="w-3 h-3" />} subValue="Avg / match" />
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Allowed Points Per Quarter</h4>
                    <div className="grid grid-cols-4 gap-2">
                        {basketball.perQuarter.points.map((p, i) => (
                            <div key={i} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 text-center">
                                <div className="text-[10px] text-zinc-500 mb-1 font-bold uppercase">Q{i + 1}</div>
                                <div className="text-lg font-mono font-bold text-white">{p}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (sport === 'nfl' && nfl) {
        return (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">Allowed Stats</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                        {teamName}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="col-span-2">
                        <MetricBox label="Total Yards Allowed" value={nfl.yards.total} subValue="Avg per game" prominent />
                    </div>
                    <MetricBox label="Pass Yards" value={nfl.yards.passing} subValue="Avg / match" />
                    <MetricBox label="Rush Yards" value={nfl.yards.rushing} subValue="Avg / match" />
                    <MetricBox label="TDs Allowed" value={nfl.touchdowns} subValue="Avg / match" />
                    <MetricBox label="Receptions" value={nfl.receptions} subValue="Avg / match" />
                    <MetricBox label="Interceptions" value={nfl.interceptions} subLabel="Takeaways" subValue="Avg / match" />
                </div>
            </div>
        )
    }

    return null
}

function MetricBox({ label, value, subLabel, subValue, icon, prominent }: any) {
    return (
        <div className={`p-4 rounded-xl border border-zinc-800/50 transition-all hover:border-zinc-700 hover:bg-zinc-800/20 ${prominent ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-zinc-950'}`}>
            <div className="flex items-center gap-2 mb-1">
                {icon && <span className="text-indigo-400">{icon}</span>}
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className={`font-mono font-bold text-white ${prominent ? 'text-3xl' : 'text-xl'}`}>{value}</span>
                {subLabel && <span className="text-[10px] text-zinc-500 uppercase">{subLabel}</span>}
            </div>
            {subValue && <div className="text-[10px] text-zinc-500 mt-1">{subValue}</div>}
        </div>
    )
}
