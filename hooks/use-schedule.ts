import { useEffect, useState, useRef } from 'react'
import type { Scoreboard } from '@/lib/types'
import { formatDateForAPI } from '@/lib/types'
import type { SportType } from './use-scores'

interface UseScheduleOptions {
    sport: SportType
    days?: number
    enabled?: boolean
}

interface ScheduleData {
    date: string
    data: Scoreboard | null
    isLoading: boolean
    error: Error | null
}

interface UseScheduleReturn {
    schedules: Map<string, ScheduleData>
    isLoading: boolean
    hasError: boolean
    refetch: () => Promise<void>
}

// Cache for schedule data
const scheduleCache = new Map<string, { data: Scoreboard; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useSchedule({
    sport,
    days = 7,
    enabled = true,
}: UseScheduleOptions): UseScheduleReturn {
    const [schedules, setSchedules] = useState<Map<string, ScheduleData>>(new Map())
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const abortControllerRef = useRef<AbortController | null>(null)

    const fetchSchedule = async () => {
        if (!enabled) {
            setIsLoading(false)
            return
        }

        try {
            setHasError(false)

            // Abort any in-flight requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            abortControllerRef.current = new AbortController()

            // Generate dates for the next N days
            const dates = Array.from({ length: days }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() + i)
                return formatDateForAPI(date)
            })

            // Initialize loading state for all dates
            const initialSchedules = new Map<string, ScheduleData>()
            dates.forEach(date => {
                initialSchedules.set(date, {
                    date,
                    data: null,
                    isLoading: true,
                    error: null,
                })
            })
            setSchedules(new Map(initialSchedules))

            // Fetch data for each date with staggered delays to respect rate limits
            for (let i = 0; i < dates.length; i++) {
                const date = dates[i]
                const cacheKey = `${sport}-${date}`

                // Check cache first
                const cached = scheduleCache.get(cacheKey)
                if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                    setSchedules(prev => {
                        const updated = new Map(prev)
                        updated.set(date, {
                            date,
                            data: cached.data,
                            isLoading: false,
                            error: null,
                        })
                        return updated
                    })
                    continue
                }

                // Add small delay between requests (except for first one)
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 150))
                }

                try {
                    const params = new URLSearchParams({ sport, date })
                    const response = await fetch(`/api/scores?${params.toString()}`, {
                        signal: abortControllerRef.current.signal,
                    })

                    if (!response.ok) {
                        throw new Error(`Failed to fetch: ${response.statusText}`)
                    }

                    const data = await response.json()

                    // Cache the result
                    scheduleCache.set(cacheKey, { data, timestamp: Date.now() })

                    setSchedules(prev => {
                        const updated = new Map(prev)
                        updated.set(date, {
                            date,
                            data,
                            isLoading: false,
                            error: null,
                        })
                        return updated
                    })
                } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        return
                    }

                    setSchedules(prev => {
                        const updated = new Map(prev)
                        updated.set(date, {
                            date,
                            data: null,
                            isLoading: false,
                            error: err instanceof Error ? err : new Error('Unknown error'),
                        })
                        return updated
                    })
                    setHasError(true)
                }
            }
        } catch (err) {
            console.error('Error fetching schedule:', err)
            setHasError(true)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (enabled) {
            fetchSchedule()
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [sport, days, enabled])

    return {
        schedules,
        isLoading,
        hasError,
        refetch: fetchSchedule,
    }
}
