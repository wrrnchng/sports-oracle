import { useEffect, useState, useRef } from 'react'
import type { PlayerGameLog } from '@/lib/types'

interface UsePlayerLogOptions {
    sport: string
    league: string
    athleteId?: string
    teamId?: string
}

interface UsePlayerLogReturn {
    data: PlayerGameLog | null
    isLoading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

export function usePlayerLog({ sport, league, athleteId, teamId }: UsePlayerLogOptions): UsePlayerLogReturn {
    const [data, setData] = useState<PlayerGameLog | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const fetchData = async () => {
        if (!athleteId) {
            setData(null)
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            if (abortControllerRef.current) abortControllerRef.current.abort()
            abortControllerRef.current = new AbortController()

            const params = new URLSearchParams({ sport, league, athleteId })
            if (teamId) params.append('teamId', teamId)
            const response = await fetch(`/api/player/log?${params.toString()}`, {
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) throw new Error('Failed to fetch player stats')

            const result = await response.json()
            setData(result)
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort()
        }
    }, [sport, league, athleteId, teamId])

    return { data, isLoading, error, refetch: fetchData }
}
