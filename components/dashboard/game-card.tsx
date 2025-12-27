"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LiveIndicator } from "./live-indicator"
import { GameCountdown } from "./game-countdown"
import type { ScoreboardEvent } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatInManila } from "@/lib/types"
import { MapPin, Calendar, Star } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"

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

    const { toggleFavorite, isFavorite } = useFavorites()
    const favorited = isFavorite(event.id)

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
            <CardContent className="p-3 relative">
                {/* Status Header moved to absolute top-right or just minimal */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {showDate && (
                            <>
                                <span>{formatInManila(gameDate, 'MMM d')}</span>
                                <span>•</span>
                            </>
                        )}
                        <span className={cn(isLive && "text-red-500 font-bold")}>
                            {isUpcoming
                                ? formatInManila(gameDate, 'h:mm a')
                                : status.type.shortDetail
                            }
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {isLive && <LiveIndicator />}
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleFavorite(event.id)
                            }}
                            className={cn(
                                "p-1 rounded-full transition-all hover:bg-zinc-800/50 group/star",
                                favorited ? "text-yellow-500" : "text-zinc-500 hover:text-yellow-400"
                            )}
                            title={favorited ? "Remove from favorites" : "Add to favorites"}
                        >
                            <Star className={cn(
                                "size-4 transition-transform",
                                favorited ? "fill-current scale-110" : "group-hover/star:scale-110"
                            )} />
                        </button>
                    </div>
                </div>

                {/* Upcoming Game Time & Countdown */}
                {/* Upcoming Game Time & Countdown */}
                {isUpcoming && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                        <GameCountdown
                            gameDate={event.date}
                            className="text-[10px] text-blue-600 dark:text-blue-400 font-medium text-center"
                        />
                    </div>
                )}

                {/* Teams Grid */}
                <div className="grid gap-2">
                    {/* Away Team */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {awayTeam.team.logo && (
                                <img
                                    src={awayTeam.team.logo}
                                    alt={awayTeam.team.displayName}
                                    className="w-6 h-6 object-contain"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate leading-none">
                                    {awayTeam.team.displayName}
                                </div>
                                {awayTeam.records?.[0] && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {awayTeam.records[0].summary}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={cn(
                            "text-xl font-bold ml-2 font-mono tabular-nums",
                            awayTeam.winner && "text-primary"
                        )}>
                            {isUpcoming ? '-' : awayTeam.score}
                        </div>
                    </div>

                    {/* Home Team */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {homeTeam.team.logo && (
                                <img
                                    src={homeTeam.team.logo}
                                    alt={homeTeam.team.displayName}
                                    className="w-6 h-6 object-contain"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate leading-none">
                                    {homeTeam.team.displayName}
                                </div>
                                {homeTeam.records?.[0] && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {homeTeam.records[0].summary}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={cn(
                            "text-xl font-bold ml-2 font-mono tabular-nums",
                            homeTeam.winner && "text-primary"
                        )}>
                            {isUpcoming ? '-' : homeTeam.score}
                        </div>
                    </div>
                </div>

                {/* Venue Info */}
                {competition.venue && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="size-2.5 flex-shrink-0" />
                        <span className="line-clamp-1">{competition.venue.fullName}</span>
                    </div>
                )}

                {/* Period/Quarter Info for Live Games */}
                {isLive && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            {sportType === 'football' ? 'Time' : 'Q'}{status.period}
                        </span>
                        <span className="font-mono font-bold text-red-500">
                            {status.displayClock}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
