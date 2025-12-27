import { NextRequest, NextResponse } from 'next/server'
import { getNews } from '@/lib/espn'
import { newsRateLimiter, getClientIdentifier, getRetryAfterSeconds } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes

export async function GET(request: NextRequest) {
    try {
        // Apply rate limiting
        const identifier = getClientIdentifier(request)
        const rateLimitResult = newsRateLimiter.check(identifier)

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
                        'X-RateLimit-Limit': '30',
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetTime / 1000)),
                    }
                }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const sport = searchParams.get('sport')
        const limitParam = searchParams.get('limit')
        const limit = limitParam ? parseInt(limitParam, 10) : 10

        if (!sport) {
            return NextResponse.json(
                { error: 'Sport parameter is required' },
                { status: 400 }
            )
        }

        let data
        switch (sport) {
            case 'basketball':
            case 'nba':
                data = await getNews('basketball/nba', limit)
                break
            case 'nfl':
                data = await getNews('football/nfl', limit)
                break
            case 'ncaaf':
            case 'college-football':
                data = await getNews('football/college-football', limit)
                break
            default:
                return NextResponse.json(
                    { error: `News not available for sport: ${sport}` },
                    { status: 400 }
                )
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                'X-RateLimit-Limit': '30',
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetTime / 1000)),
            },
        })
    } catch (error) {
        console.error('Error fetching news:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch news' },
            { status: 500 }
        )
    }
}
