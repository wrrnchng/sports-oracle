"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface GameCountdownProps {
    gameDate: string
    className?: string
}

export function GameCountdown({ gameDate, className }: GameCountdownProps) {
    const [timeUntil, setTimeUntil] = useState<string>("")

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date()
            const game = new Date(gameDate)
            const diff = game.getTime() - now.getTime()

            if (diff <= 0) {
                setTimeUntil("Starting soon")
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

            if (days > 0) {
                setTimeUntil(`In ${days}d ${hours}h`)
            } else if (hours > 0) {
                setTimeUntil(`In ${hours}h ${minutes}m`)
            } else {
                setTimeUntil(`In ${minutes}m`)
            }
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [gameDate])

    if (!timeUntil) return null

    return (
        <div className={className}>
            <Clock className="inline-block mr-1 size-3" />
            <span className="text-xs font-medium">{timeUntil}</span>
        </div>
    )
}
