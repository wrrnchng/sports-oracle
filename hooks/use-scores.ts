import { useEffect, useState, useRef } from 'react'
import type { Scoreboard } from '@/lib/types'

export type SportType = 'football' | 'basketball' | 'nfl' | 'ncaaf'

interface UseScoresOptions {
    sport: SportType
    date?: string
    autoRefresh?: boolean
    refreshInterval?: number
}

interface UseScoresReturn {
    data: Scoreboard | null
    isLoading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

// Request deduplication cache
const requestCache = new Map<string, Promise<Scoreboard>>()

export function useScores({
    sport,
    date,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute default
}: UseScoresOptions): UseScoresReturn {
    const [data, setData] = useState<Scoreboard | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Helper to check for live games in data
    const hasLiveGames = (scoreboard: Scoreboard | null) => {
        return scoreboard?.events?.some((event: any) =>
            event.competitions?.[0]?.status?.type?.state === 'in'
        ) ?? false
    }

    const fetchScores = async (isBackground = false) => {
        // If not background fetch, set loading (avoid flickering on refresh)
        if (!isBackground && !data) setIsLoading(true)

        try {
            // Abort any in-flight requests (only if manually triggered or new params)
            if (!isBackground && abortControllerRef.current) {
                // If we are just polling in background, maybe let previous finish?
                // But generally safe to abort stale.
                abortControllerRef.current.abort()
            }

            const params = new URLSearchParams({ sport })
            if (date) params.append('date', date)

            const cacheKey = `/api/scores?${params.toString()}`

            // Check if there's already a pending request for this exact query
            const cachedRequest = requestCache.get(cacheKey)
            if (cachedRequest) {
                const result = await cachedRequest
                setData(result)
                if (!isBackground) setIsLoading(false)
                return
            }

            // Create new abort controller for this request
            abortControllerRef.current = new AbortController()

            // Create new request and cache it
            const request = fetch(cacheKey, {
                signal: abortControllerRef.current.signal,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        if (response.status === 429) {
                            const retryAfter = response.headers.get('Retry-After')
                            throw new Error(`Rate limit exceeded. Try again in ${retryAfter}s.`)
                        }
                        throw new Error(`Failed to fetch scores: ${response.statusText}`)
                    }
                    return response.json()
                })
                .finally(() => {
                    requestCache.delete(cacheKey)
                })

            requestCache.set(cacheKey, request as Promise<Scoreboard>)

            const result = await request
            setData(result)
            setError(null)
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            if (!isBackground) setIsLoading(false)
        }
    }

    // Effect for initial fetch and parameter changes
    useEffect(() => {
        fetchScores(false)
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort()
        }
    }, [sport, date])

    // Effect for Polling (Live Games Only)
    useEffect(() => {
        if (!autoRefresh || !data || !hasLiveGames(data)) return

        // If we have live games, set up the interval
        const intervalId = setInterval(() => {
            fetchScores(true)
        }, refreshInterval)

        return () => clearInterval(intervalId)
    }, [autoRefresh, refreshInterval, data, sport, date]) // data dependency ensures we re-evaluate when status changes (e.g. game finishes -> stops polling)

    return {
        data,
        isLoading,
        error,
        refetch: () => fetchScores(false),
    }
}
