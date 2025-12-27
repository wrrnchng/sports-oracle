import React, { useState } from 'react'
import { TeamFormStats } from '@/lib/stats-utils'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface FormComparisonProps {
    team1: {
        name: string,
        logo: string,
        leagueStats: { overall: TeamFormStats, home: TeamFormStats, away: TeamFormStats },
        formStats: { overall: TeamFormStats, home: TeamFormStats, away: TeamFormStats }
    }
    team2: {
        name: string,
        logo: string,
        leagueStats: { overall: TeamFormStats, home: TeamFormStats, away: TeamFormStats },
        formStats: { overall: TeamFormStats, home: TeamFormStats, away: TeamFormStats }
    }
}

export function FormComparison({ team1, team2 }: FormComparisonProps) {
    const [team1Tab, setTeam1Tab] = useState<'overall' | 'home' | 'away'>('overall')
    const [team2Tab, setTeam2Tab] = useState<'overall' | 'home' | 'away'>('overall')

    // PPG and comparison use LEAGUE stats
    const ppg1 = team1.leagueStats.home.ppg
    const ppg2 = team2.leagueStats.away.ppg
    const diff = ppg1 - ppg2
    const adv = Math.abs(Math.round((diff / (ppg2 || 1)) * 100))
    const winner = diff > 0 ? team1.name : team2.name

    return (
        <Card className="bg-zinc-950/50 border-zinc-800 p-8 space-y-10">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                    <span className="text-indigo-500 italic">Current Form-</span> Who Will Win?
                </h3>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="text-right">
                            <div className="text-2xl font-black text-amber-500">{ppg1.toFixed(2)}</div>
                            <div className="flex gap-1 mt-1">
                                {(team1.formStats.home.results || []).map((r: any, i: number) => <FormDot key={i} result={r} />)}
                            </div>
                        </div>
                        <img src={team1.logo} alt={team1.name} className="w-16 h-16 object-contain" />
                    </div>

                    <div className="flex-1 max-w-sm">
                        <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-700"
                                style={{ width: `${(ppg1 / (ppg1 + ppg2 || 1)) * 100}%` }}
                            />
                            <div
                                className="h-full bg-rose-500 transition-all duration-700"
                                style={{ width: `${(ppg2 / (ppg1 + ppg2 || 1)) * 100}%` }}
                            />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm font-bold text-emerald-400">
                                {winner} is <span className="text-white">+{adv}%</span> better in terms of Points Per Game
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1">
                        <img src={team2.logo} alt={team2.name} className="w-16 h-16 object-contain" />
                        <div>
                            <div className="text-2xl font-black text-emerald-500">{ppg2.toFixed(2)}</div>
                            <div className="flex gap-1 mt-1">
                                {(team2.formStats.away.results || []).map((r: any, i: number) => <FormDot key={i} result={r} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Team 1 Form */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                        <img src={team1.logo} alt={team1.name} className="w-8 h-8 object-contain" />
                        <h4 className="text-sm font-bold text-white">{team1.name}</h4>
                    </div>
                    <Tabs defaultValue="overall" onValueChange={(v: any) => setTeam1Tab(v)} className="w-full">
                        <div className="flex justify-start mb-6">
                            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto">
                                <TabsTrigger value="overall" className="px-4 py-1.5 text-xs">All</TabsTrigger>
                                <TabsTrigger value="home" className="px-4 py-1.5 text-xs">Home</TabsTrigger>
                                <TabsTrigger value="away" className="px-4 py-1.5 text-xs">Away</TabsTrigger>
                            </TabsList>
                        </div>
                        <FormList
                            teamName={team1.name}
                            matches={team1.formStats[team1Tab].recentGames}
                            side="left"
                        />
                    </Tabs>
                </div>

                {/* Team 2 Form */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6 justify-end">
                        <h4 className="text-sm font-bold text-white">{team2.name}</h4>
                        <img src={team2.logo} alt={team2.name} className="w-8 h-8 object-contain" />
                    </div>
                    <Tabs defaultValue="overall" onValueChange={(v: any) => setTeam2Tab(v)} className="w-full">
                        <div className="flex justify-end mb-6">
                            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto">
                                <TabsTrigger value="overall" className="px-4 py-1.5 text-xs">All</TabsTrigger>
                                <TabsTrigger value="home" className="px-4 py-1.5 text-xs">Home</TabsTrigger>
                                <TabsTrigger value="away" className="px-4 py-1.5 text-xs">Away</TabsTrigger>
                            </TabsList>
                        </div>
                        <FormList
                            teamName={team2.name}
                            matches={team2.formStats[team2Tab].recentGames}
                            side="right"
                        />
                    </Tabs>
                </div>
            </div>
        </Card>
    )
}

function FormList({ teamName, matches, side }: { teamName: string, matches: any[], side: 'left' | 'right' }) {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return <div className="text-zinc-500 text-xs italic">No recent matches found</div>
    }

    return (
        <div className="space-y-4">
            {matches.map((m, i) => {
                const us = m.competitions[0].competitors.find((c: any) => c.team.displayName === teamName || c.team.name === teamName)
                const them = m.competitions[0].competitors.find((c: any) => c.team.displayName !== teamName && c.team.name !== teamName)
                const scoreUs = us?.score?.displayValue || us?.score || '0'
                const scoreThem = them?.score?.displayValue || them?.score || '0'
                const isWin = us?.winner
                const isDraw = !us?.winner && !them?.winner

                return (
                    <div key={i} className={cn(
                        "flex items-center gap-4 text-xs font-medium",
                        side === 'right' ? "flex-row-reverse text-right" : "text-left"
                    )}>
                        <span className="text-zinc-500 w-24 truncate">{them?.team.displayName}</span>
                        <div className={cn(
                            "px-3 py-1.5 rounded font-mono font-bold min-w-[80px] text-center shadow-sm whitespace-nowrap",
                            isWin ? "bg-emerald-500 text-white" : isDraw ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                        )}>
                            {side === 'left' ? `${scoreUs} - ${scoreThem}` : `${scoreThem} - ${scoreUs}`}
                        </div>
                        <span className="text-white font-bold w-24 truncate">{teamName}</span>
                    </div>
                )
            })}
        </div>
    )
}

function FormDot({ result }: { result: 'W' | 'L' | 'D' }) {
    const colorMap = {
        W: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
        L: 'bg-rose-500/20 text-rose-500 border-rose-500/30',
        D: 'bg-amber-500/20 text-amber-500 border-amber-500/30'
    }
    return (
        <span className={cn(
            "w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black border",
            colorMap[result]
        )}>
            {result}
        </span>
    )
}
