import { useEffect, useState, useRef } from 'react'
import type { NewsResponse } from '@/lib/types'

export type NewsEnabledSport = 'basketball' | 'nfl' | 'ncaaf'

interface UseNewsOptions {
    sport: NewsEnabledSport
    limit?: number
}

interface UseNewsReturn {
    data: NewsResponse | null
    isLoading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

// Request deduplication cache
const requestCache = new Map<string, Promise<NewsResponse>>()

export function useNews({ sport, limit = 10 }: UseNewsOptions): UseNewsReturn {
    const [data, setData] = useState<NewsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const fetchNews = async () => {
        try {
            setError(null)

            // Abort any in-flight requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }

            const params = new URLSearchParams({ sport, limit: limit.toString() })
            const cacheKey = `/api/news?${params.toString()}`

            // Check if there's already a pending request for this exact query
            const cachedRequest = requestCache.get(cacheKey)
            if (cachedRequest) {
                const result = await cachedRequest
                setData(result)
                setIsLoading(false)
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
                        // Check for rate limiting
                        if (response.status === 429) {
                            const retryAfter = response.headers.get('Retry-After')
                            throw new Error(
                                `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
                            )
                        }
                        throw new Error(`Failed to fetch news: ${response.statusText}`)
                    }
                    return response.json()
                })
                .finally(() => {
                    // Remove from cache after completion
                    requestCache.delete(cacheKey)
                })

            // Store in cache
            requestCache.set(cacheKey, request as Promise<NewsResponse>)

            const result = await request
            setData(result)
        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return
            }
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNews()

        return () => {
            // Cleanup: abort any in-flight requests when component unmounts
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [sport, limit])

    return {
        data,
        isLoading,
        error,
        refetch: fetchNews,
    }
}
