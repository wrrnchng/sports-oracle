import React from 'react'
import { TeamFormStats } from '@/lib/stats-utils'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TeamFormCardProps {
    teamName: string
    leagueName: string
    leaguePos?: string
    logo: string
    leagueStats: { overall: TeamFormStats, home: TeamFormStats, away: TeamFormStats }
    formStats: { overall: TeamFormStats, home: TeamFormStats, away: TeamFormStats }
    sport: string
}

export function TeamFormCard({ teamName, leagueName, leaguePos, logo, leagueStats, formStats, sport }: TeamFormCardProps) {
    const isSoccer = sport === 'soccer' || sport === 'football'

    return (
        <Card className="bg-zinc-950/50 border-zinc-800 p-6 space-y-6">
            <div className="flex items-center gap-4">
                <img src={logo} alt={teamName} className="w-16 h-16 object-contain" />
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {teamName}
                    </h3>
                    <p className="text-sm text-zinc-400">{leagueName}</p>
                    {leaguePos && <p className="text-xs text-zinc-500 font-medium">League Pos. {leaguePos}</p>}
                </div>
            </div>

            {/* Form & Results */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-zinc-900/40 rounded-lg overflow-hidden border border-zinc-800/50">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                            <tr>
                                <th className="px-4 py-2">Form</th>
                                <th className="px-4 py-2 text-center">Results</th>
                                <th className="px-4 py-2 text-right">PPG</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {[
                                { label: 'Overall', lStats: leagueStats.overall, fStats: formStats.overall },
                                { label: 'Home', lStats: leagueStats.home, fStats: formStats.home },
                                { label: 'Away', lStats: leagueStats.away, fStats: formStats.away }
                            ].map((row) => (
                                <tr key={row.label} className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-zinc-300">{row.label}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center gap-1.5">
                                            {(row.fStats?.results || []).map((res: any, i: number) => (
                                                <FormIcon key={i} result={res} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {row.lStats ? (
                                            <span className={cn(
                                                "inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white",
                                                (row.lStats.ppg || 0) >= 2 ? "bg-emerald-500" : (row.lStats.ppg || 0) >= 1.2 ? "bg-amber-500" : "bg-rose-500"
                                            )}>
                                                {(row.lStats.ppg || 0).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-500 text-xs">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Stats Table */}
            <div className="bg-zinc-900/40 rounded-lg overflow-hidden border border-zinc-800/50">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                        <tr>
                            <th className="px-4 py-2">Stats</th>
                            <th className="px-4 py-2 text-center">Overall</th>
                            <th className="px-4 py-2 text-center bg-indigo-500/10 text-indigo-400">Home</th>
                            <th className="px-4 py-2 text-center bg-zinc-800/30">Away</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30 font-medium">
                        <StatRow label="Win %" o={leagueStats.overall?.winPct ? leagueStats.overall.winPct + '%' : '-'} h={leagueStats.home?.winPct ? leagueStats.home.winPct + '%' : '-'} a={leagueStats.away?.winPct ? leagueStats.away.winPct + '%' : '-'} />
                        <StatRow label="AVG" o={leagueStats.overall?.avgPoints || '-'} h={leagueStats.home?.avgPoints || '-'} a={leagueStats.away?.avgPoints || '-'} />
                        <StatRow label="Scored" o={leagueStats.overall?.scored || '-'} h={leagueStats.home?.scored || '-'} a={leagueStats.away?.scored || '-'} />
                        <StatRow label="Conceded" o={leagueStats.overall?.conceded || '-'} h={leagueStats.home?.conceded || '-'} a={leagueStats.away?.conceded || '-'} />
                        {isSoccer && (
                            <>
                                <StatRow label="BTTS" o={leagueStats.overall?.btts ? leagueStats.overall.btts + '%' : '-'} h={leagueStats.home?.btts ? leagueStats.home.btts + '%' : '-'} a={leagueStats.away?.btts ? leagueStats.away.btts + '%' : '-'} />
                                <StatRow label="CS" o={leagueStats.overall?.cs ? leagueStats.overall.cs + '%' : '-'} h={leagueStats.home?.cs ? leagueStats.home.cs + '%' : '-'} a={leagueStats.away?.cs ? leagueStats.away.cs + '%' : '-'} />
                                <StatRow label="FTS" o={leagueStats.overall?.fts ? leagueStats.overall.fts + '%' : '-'} h={leagueStats.home?.fts ? leagueStats.home.fts + '%' : '-'} a={leagueStats.away?.fts ? leagueStats.away.fts + '%' : '-'} />
                            </>
                        )}
                        {/* Use placeholders if needed for xG/xGA or just leave them out as per ESPN limitation */}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

function StatRow({ label, o, h, a }: { label: string, o: any, h: any, a: any }) {
    return (
        <tr className="hover:bg-zinc-800/30 transition-colors">
            <td className="px-4 py-2.5 text-zinc-400 font-normal">{label}</td>
            <td className="px-4 py-2.5 text-center text-zinc-100">{o}</td>
            <td className="px-4 py-2.5 text-center text-indigo-400 bg-indigo-500/5">{h}</td>
            <td className="px-4 py-2.5 text-center text-zinc-400 bg-zinc-800/10">{a}</td>
        </tr>
    )
}

function FormIcon({ result }: { result: 'W' | 'L' | 'D' }) {
    const colorMap = {
        W: 'bg-emerald-500',
        L: 'bg-rose-500',
        D: 'bg-amber-500'
    }
    return (
        <span className={cn(
            "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
            colorMap[result]
        )}>
            {result}
        </span>
    )
}
