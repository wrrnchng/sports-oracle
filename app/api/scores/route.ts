import { NextRequest, NextResponse } from 'next/server'
import {
    getFootballScores,
    getBasketballScores,
    getNFLScores,
    getNCAAFScores,
} from '@/lib/espn'
import { scoresRateLimiter, getClientIdentifier, getRetryAfterSeconds } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
    try {
        // Apply rate limiting
        const identifier = getClientIdentifier(request)
        const rateLimitResult = scoresRateLimiter.check(identifier)

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: 'Too many requests. Please try again later.',
                    retryAfter: getRetryAfterSeconds(rateLimitResult.resetTime)
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(getRetryAfterSeconds(rateLimitResult.resetTime)),
                        'X-RateLimit-Limit': '60',
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetTime / 1000)),
                    }
                }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const sport = searchParams.get('sport')
        const date = searchParams.get('date')

        if (!sport) {
            return NextResponse.json(
                { error: 'Sport parameter is required' },
                { status: 400 }
            )
        }

        let data
        switch (sport) {
            case 'football':
            case 'soccer':
                data = await getFootballScores(date || undefined)
                break
            case 'basketball':
            case 'nba':
                data = await getBasketballScores(date || undefined)
                break
            case 'nfl':
                data = await getNFLScores(date || undefined)
                break
            case 'ncaaf':
            case 'college-football':
                data = await getNCAAFScores(date || undefined)
                break
            default:
                return NextResponse.json(
                    { error: `Unsupported sport: ${sport}` },
                    { status: 400 }
                )
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                'X-RateLimit-Limit': '60',
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetTime / 1000)),
            },
        })
    } catch (error) {
        console.error('Error fetching scores:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch scores' },
            { status: 500 }
        )
    }
}
