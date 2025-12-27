"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LiveIndicator } from "./live-indicator"
import { GameCountdown } from "./game-countdown"
import type { ScoreboardEvent } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatInManila } from "@/lib/types"
import { MapPin, Calendar } from "lucide-react"

interface GameCardProps {
    event: ScoreboardEvent
    sportType: 'football' | 'basketball' | 'nfl' | 'ncaaf'
    showDate?: boolean
}

export function GameCard({ event, sportType, showDate = false }: GameCardProps) {
    const competition = event.competitions[0]
    const status = competition.status
    const isLive = status.type.state === 'in'
    const isUpcoming = status.type.state === 'pre'
    const isCompleted = status.type.completed

    // Get home and away teams
    const homeTeam = competition.competitors.find(comp => comp.homeAway === 'home')
    const awayTeam = competition.competitors.find(comp => comp.homeAway === 'away')

    if (!homeTeam || !awayTeam) return null

    // Sport-specific color schemes
    const sportColors = {
        football: 'border-green-500/50 hover:border-green-500',
        basketball: 'border-orange-500/50 hover:border-orange-500',
        nfl: 'border-blue-500/50 hover:border-blue-500',
        ncaaf: 'border-purple-500/50 hover:border-purple-500',
    }

    // Game date/time
    const gameDate = new Date(event.date)

    return (
        <Card className={cn(
            "transition-all duration-200 hover:shadow-lg",
            isLive && "ring-2 ring-red-500/50",
            isUpcoming && "border-blue-500/30 bg-blue-500/5",
            sportColors[sportType]
        )}>
            <CardContent className="p-6">
                {/* Status Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {showDate && (
                            <>
                                <Calendar className="size-3" />
                                <span>{formatInManila(gameDate, 'MMM d')}</span>
                                <span>•</span>
                            </>
                        )}
                        <span>
                            {isUpcoming
                                ? formatInManila(gameDate, 'MMM d, h:mm a')
                                : status.type.shortDetail
                            }
                        </span>
                    </div>
                    {isLive && <LiveIndicator />}
                </div>

                {/* Upcoming Game Time & Countdown */}
                {isUpcoming && (
                    <div className="text-center mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                {formatInManila(gameDate, 'h:mm a')}
                            </span>
                        </div>
                        <GameCountdown
                            gameDate={event.date}
                            className="text-blue-600 dark:text-blue-400"
                        />
                    </div>
                )}

                {/* Away Team */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-4 flex-1">
                        {awayTeam.team.logo && (
                            <img
                                src={awayTeam.team.logo}
                                alt={awayTeam.team.displayName}
                                className="w-10 h-10 object-contain"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="text-lg font-bold truncate">
                                {awayTeam.team.displayName}
                            </div>
                            {awayTeam.records && awayTeam.records[0] && (
                                <div className="text-xs text-muted-foreground">
                                    {awayTeam.records[0].summary}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={cn(
                        "text-3xl font-black ml-6 font-mono",
                        awayTeam.winner && "text-primary"
                    )}>
                        {isUpcoming ? '-' : awayTeam.score}
                    </div>
                </div>

                {/* Home Team */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        {homeTeam.team.logo && (
                            <img
                                src={homeTeam.team.logo}
                                alt={homeTeam.team.displayName}
                                className="w-10 h-10 object-contain"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="text-lg font-bold truncate">
                                {homeTeam.team.displayName}
                            </div>
                            {homeTeam.records && homeTeam.records[0] && (
                                <div className="text-xs text-muted-foreground">
                                    {homeTeam.records[0].summary}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={cn(
                        "text-3xl font-black ml-6 font-mono",
                        homeTeam.winner && "text-primary"
                    )}>
                        {isUpcoming ? '-' : homeTeam.score}
                    </div>
                </div>

                {/* Venue Info */}
                {competition.venue && (
                    <div className="mt-4 pt-4 border-t border-border flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="size-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{competition.venue.fullName}</span>
                    </div>
                )}

                {/* Period/Quarter Info for Live Games */}
                {isLive && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {sportType === 'football' ? 'Time' : 'Quarter'} {status.period}
                        </span>
                        <span className="font-mono font-semibold">
                            {status.displayClock}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
