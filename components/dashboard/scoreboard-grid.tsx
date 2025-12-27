"use client"

import { GameCard } from "./game-card"
import type { Scoreboard } from "@/lib/types"
import type { SportType } from "@/hooks/use-scores"
import { Loader2, CalendarOff, Star } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"

interface ScoreboardGridProps {
    data: Scoreboard | null
    isLoading: boolean
    error: Error | null
    sportType: SportType
}

export function ScoreboardGrid({ data, isLoading, error, sportType }: ScoreboardGridProps) {
    const { favorites } = useFavorites()
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading games...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                        <p className="text-lg font-semibold mb-2">Failed to load games</p>
                        <p className="text-sm text-muted-foreground">{error.message}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!data || !data.events || data.events.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4 text-center">
                    <CalendarOff className="size-12 text-muted-foreground" />
                    <div>
                        <p className="text-lg font-semibold mb-2">No games scheduled</p>
                        <p className="text-sm text-muted-foreground">
                            There are no games for the selected date
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Separate favorites and other games
    const favoriteGames = data.events.filter(event => favorites.includes(event.id))
    const otherGames = data.events.filter(event => !favorites.includes(event.id))

    const liveGames = otherGames.filter(
        event => event.competitions[0]?.status.type.state === 'in'
    )
    const upcomingGames = otherGames.filter(
        event => event.competitions[0]?.status.type.state === 'pre'
    )
    const completedGames = otherGames.filter(
        event => event.competitions[0]?.status.type.completed
    )

    return (
        <div className="space-y-8">
            {/* Favorites Section */}
            {favoriteGames.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="size-5 text-yellow-500 fill-current" />
                        <h2 className="text-xl font-semibold">Favorites ({favoriteGames.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteGames.map(event => (
                            <GameCard key={event.id} event={event} sportType={sportType} />
                        ))}
                    </div>
                    <div className="mt-8 border-b border-zinc-800/50" />
                </div>
            )}
            {/* Live Games Section */}
            {liveGames.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex items-center justify-center">
                            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold">Live Now ({liveGames.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveGames.map(event => (
                            <GameCard key={event.id} event={event} sportType={sportType} />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Games Section */}
            {upcomingGames.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">📅</span>
                        <h2 className="text-xl font-semibold">Upcoming ({upcomingGames.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingGames.map(event => (
                            <GameCard key={event.id} event={event} sportType={sportType} />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Games Section */}
            {completedGames.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">✅</span>
                        <h2 className="text-xl font-semibold">Final ({completedGames.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedGames.map(event => (
                            <GameCard key={event.id} event={event} sportType={sportType} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
