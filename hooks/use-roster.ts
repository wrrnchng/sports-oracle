import { useEffect, useState, useRef } from 'react'
import type { RosterResponse } from '@/lib/types'

interface UseRosterOptions {
    sport: string
    league: string
    teamId?: string
}

interface UseRosterReturn {
    data: RosterResponse | null
    isLoading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

// Simple Cache
const cache = new Map<string, RosterResponse>()

export function useRoster({ sport, league, teamId }: UseRosterOptions): UseRosterReturn {
    const [data, setData] = useState<RosterResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const fetchData = async () => {
        if (!teamId) {
            setData(null)
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const cacheKey = `${sport}-${league}-${teamId}`
            if (cache.has(cacheKey)) {
                setData(cache.get(cacheKey)!)
                setIsLoading(false)
                return // Optional: return stale then revalidate? For roster, staleness is fine.
            }

            if (abortControllerRef.current) abortControllerRef.current.abort()
            abortControllerRef.current = new AbortController()

            const params = new URLSearchParams({ sport, league, teamId })
            const response = await fetch(`/api/roster?${params.toString()}`, {
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) throw new Error('Failed to fetch roster')

            const result = await response.json()
            cache.set(cacheKey, result)
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
    }, [sport, league, teamId])

    return { data, isLoading, error, refetch: fetchData }
}
