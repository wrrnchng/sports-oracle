import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { TeamScheduleEvent } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface H2HStatsProps {
    matches: TeamScheduleEvent[]
    selectedTeamId: string
    opponentId: string
    sport: string
    loading?: boolean
}

export function H2HStats({ matches, selectedTeamId, opponentId, sport, loading }: H2HStatsProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800 animate-pulse">
                <Loader2 className="w-6 h-6 text-zinc-600 animate-spin mb-2" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Calculating H2H Stats...</span>
            </div>
        )
    }

    if (!matches || matches.length === 0) return null

    // Check if the matches actually involve the current selected team and opponent
    // This prevents "stale data" flashes when switching teams
    const firstMatch = matches[0]
    const teamsInMatches = firstMatch.competitions[0].competitors.map((c: any) => c.team.id)
    if (!teamsInMatches.includes(selectedTeamId) || !teamsInMatches.includes(opponentId)) {
        return null // Don't show stale stats
    }

    const totalMatches = matches.length
    let teamWins = 0
    let opponentWins = 0
    let draws = 0
    let teamGoals = 0
    let opponentGoals = 0
    let over15 = 0
    let over25 = 0
    let over35 = 0
    let btts = 0
    let teamCleanSheets = 0
    let opponentCleanSheets = 0

    // Sport-specific thresholds
    const isSoccer = sport === 'soccer' || sport === 'football'
    const isBasketball = sport === 'basketball' || sport === 'nba' || sport === 'ncaam'
    const isFootball = sport === 'football' || sport === 'nfl' || sport === 'ncaaf'

    matches.forEach(match => {
        const us = match.competitions[0].competitors.find((c: any) => c.team.id === selectedTeamId)
        const them = match.competitions[0].competitors.find((c: any) => c.team.id === opponentId)

        if (!us?.score || !them?.score) return

        const usScore = parseInt(us.score.displayValue) || 0
        const themScore = parseInt(them.score.displayValue) || 0
        const total = usScore + themScore

        teamGoals += usScore
        opponentGoals += themScore

        if (us.winner) teamWins++
        else if (them.winner) opponentWins++
        else draws++

        if (isSoccer) {
            if (total > 1.5) over15++
            if (total > 2.5) over25++
            if (total > 3.5) over35++
            if (usScore > 0 && themScore > 0) btts++
            if (themScore === 0) teamCleanSheets++
            if (usScore === 0) opponentCleanSheets++
        } else if (isBasketball) {
            if (total > 210.5) over15++ // Over 210.5
            if (total > 220.5) over25++ // Over 220.5
            if (total > 230.5) over35++ // Over 230.5
        } else if (isFootball) {
            if (total > 37.5) over15++ // Over 37.5
            if (total > 44.5) over25++ // Over 44.5
            if (total > 51.5) over35++ // Over 51.5
        }
    })

    const teamWinPct = Math.round((teamWins / totalMatches) * 100)
    const opponentWinPct = Math.round((opponentWins / totalMatches) * 100)
    const drawPct = Math.round((draws / totalMatches) * 100)

    const teamName = matches[0].competitions[0].competitors.find((c: any) => c.team.id === selectedTeamId)?.team.displayName || 'Team'
    const opponentName = matches[0].competitions[0].competitors.find((c: any) => c.team.id === opponentId)?.team.displayName || 'Opponent'

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <span>{teamName} ({teamWinPct}%)</span>
                    <span>{totalMatches} Matches</span>
                    <span>{opponentName} ({opponentWinPct}%)</span>
                </div>

                <div className="h-3 w-full flex rounded-full overflow-hidden bg-zinc-800">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${teamWinPct}%` }}
                        title={`${teamWins} Wins`}
                    />
                    <div
                        className="h-full bg-zinc-600 transition-all duration-500"
                        style={{ width: `${drawPct}%` }}
                        title={`${draws} Draws`}
                    />
                    <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${opponentWinPct}%` }}
                        title={`${opponentWins} Wins`}
                    />
                </div>

                <div className="flex justify-between text-[10px] font-medium text-zinc-400">
                    <span>{teamWins} Wins</span>
                    <span>{draws} Draws</span>
                    <span>{opponentWins} Wins</span>
                </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed italic">
                {teamName} vs {opponentName}&apos;s head to head record shows that in the previous {totalMatches} meetings,
                {teamName} has won {teamWins} times, {opponentName} has won {opponentWins} times, and {draws} ended in a draw.
                Total score of {teamGoals} - {opponentGoals} across these matches.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard
                    label={isSoccer ? "Over 1.5" : isBasketball ? "Over 210.5" : "Over 37.5"}
                    value={over15}
                    total={totalMatches}
                    color="emerald"
                />
                <StatCard
                    label={isSoccer ? "Over 2.5" : isBasketball ? "Over 220.5" : "Over 44.5"}
                    value={over25}
                    total={totalMatches}
                    color="amber"
                />
                <StatCard
                    label={isSoccer ? "Over 3.5" : isBasketball ? "Over 230.5" : "Over 51.5"}
                    value={over35}
                    total={totalMatches}
                    color="rose"
                />

                {isSoccer && (
                    <>
                        <StatCard
                            label="BTTS"
                            value={btts}
                            total={totalMatches}
                            color="indigo"
                        />
                        <StatCard
                            label={`${teamName} CS`}
                            value={teamCleanSheets}
                            total={totalMatches}
                            color="blue"
                        />
                        <StatCard
                            label={`${opponentName} CS`}
                            value={opponentCleanSheets}
                            total={totalMatches}
                            color="blue"
                        />
                    </>
                )}
            </div>
        </div>
    )
}

function StatCard({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
    const pct = Math.round((value / total) * 100)

    const colorMap: Record<string, string> = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        indigo: 'bg-indigo-500',
        blue: 'bg-blue-500'
    }

    const borderMap: Record<string, string> = {
        emerald: 'border-emerald-500/20',
        amber: 'border-amber-500/20',
        rose: 'border-rose-500/20',
        indigo: 'border-indigo-500/20',
        blue: 'border-blue-500/20'
    }

    return (
        <Card className={`bg-zinc-950/40 border ${borderMap[color]} p-4 flex flex-col gap-2`}>
            <div className="flex items-end justify-between">
                <span className="text-xl font-bold text-white">{pct}%</span>
                <span className="text-[10px] uppercase font-bold text-zinc-500">{label}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span>{value} / {total} matches</span>
            </div>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div className={`h-full ${colorMap[color]}`} style={{ width: `${pct}%` }} />
            </div>
        </Card>
    )
}
