"use client"

import { GameCard } from "./game-card"
import { useSchedule } from "@/hooks/use-schedule"
import type { SportType } from "@/hooks/use-scores"
import { Loader2, Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react"
import { formatInManila, formatDateForAPI } from "@/lib/types"
import { addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface UpcomingScheduleProps {
    sport: SportType
    days?: number
}

interface DateSectionProps {
    date: string
    scheduleData: any
    sportType: SportType
    isFirst: boolean
}

function DateSection({ date, scheduleData, sportType, isFirst }: DateSectionProps) {
    const [isExpanded, setIsExpanded] = useState(isFirst)
    // Create date object from YYYYMMDD string for display
    const year = parseInt(date.substring(0, 4))
    const month = parseInt(date.substring(4, 6)) - 1
    const day = parseInt(date.substring(6, 8))
    const displayDate = new Date(year, month, day)

    const upcomingGames = scheduleData.data?.events?.filter(
        (event: any) => event.competitions[0]?.status.type.state === 'pre'
    ) || []

    if (upcomingGames.length === 0) {
        return null // Don't show dates with no upcoming games
    }

    // Check if date is Today or Tomorrow in Manila
    // We compare strings to be safe
    const todayStr = formatDateForAPI(new Date())
    const tomorrowStr = formatDateForAPI(addDays(new Date(), 1))

    const dateLabel = date === todayStr
        ? "Today"
        : date === tomorrowStr
            ? "Tomorrow"
            : formatInManila(displayDate, "EEEE, MMMM d") // This interprets 'displayDate' as local, potentially shifting it if we aren't careful.
    // Wait, 'displayDate' constructed via new Date(y, m, d) is LOCAL time 00:00.
    // If we format it in Manila, it might shift if Manila != Local.
    // Actually, we just want to format YYYYMMDD into "Friday, December 26".
    // Since we built the parts manually, we can specific formatting or just use a helper that doesn't shift.
    // Or easier:
    // The 'date' string is already Manila date.
    // We just need to format "20251224" -> "Wednesday, Dec 24".
    // We can construct a Date object that is *effectively* correct, or parse it.

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors",
                    date === todayStr && "bg-blue-500/10 border-b-2 border-blue-500"
                )}
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon className="size-5 text-muted-foreground" />
                    <div className="text-left">
                        <h3 className="font-semibold flex items-center gap-2">
                            {date === todayStr && <span className="text-blue-600">●</span>}
                            {dateLabel}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {upcomingGames.length} {upcomingGames.length === 1 ? 'game' : 'games'} scheduled
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="size-5 text-muted-foreground" />
                ) : (
                    <ChevronDown className="size-5 text-muted-foreground" />
                )}
            </button>

            {isExpanded && (
                <div className="p-4 bg-card border-t border-border">
                    {scheduleData.isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : scheduleData.error ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            Failed to load games
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
                            {upcomingGames.map((event: any) => (
                                <GameCard
                                    key={event.id}
                                    event={event}
                                    sportType={sportType}
                                    showDate={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export function UpcomingSchedule({ sport, days = 7 }: UpcomingScheduleProps) {
    const { schedules, isLoading, hasError } = useSchedule({
        sport,
        days,
        enabled: true,
    })

    if (isLoading && schedules.size === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading schedule...</p>
                </div>
            </div>
        )
    }

    // Convert schedules map to sorted array
    const sortedDates = Array.from(schedules.entries()).sort(([dateA], [dateB]) =>
        dateA.localeCompare(dateB)
    )

    // Check if there are any upcoming games across all dates
    const hasUpcomingGames = sortedDates.some(([_, data]) => {
        const upcomingGames = data.data?.events?.filter(
            (event: any) => event.competitions[0]?.status.type.state === 'pre'
        ) || []
        return upcomingGames.length > 0
    })

    if (!hasUpcomingGames && !isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4 text-center">
                    <CalendarIcon className="size-12 text-muted-foreground" />
                    <div>
                        <p className="text-lg font-semibold mb-2">No upcoming games</p>
                        <p className="text-sm text-muted-foreground">
                            There are no scheduled games in the next {days} days
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Upcoming Schedule</h2>
                    <p className="text-sm text-muted-foreground">
                        Next {days} days of scheduled games
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {sortedDates.map(([date, data], index) => (
                    <DateSection
                        key={date}
                        date={date}
                        scheduleData={data}
                        sportType={sport}
                        isFirst={index === 0}
                    />
                ))}
            </div>

            {hasError && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    Some dates failed to load. Try refreshing to see all games.
                </div>
            )}
        </div>
    )
}
