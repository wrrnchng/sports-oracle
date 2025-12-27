import { NextRequest, NextResponse } from 'next/server'
import { getGameSummary } from '@/lib/espn'
import { statsRateLimiter, getClientIdentifier, getRetryAfterSeconds } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 min cache

export async function GET(request: NextRequest) {
    try {
        const identifier = getClientIdentifier(request)
        const rateLimitResult = statsRateLimiter.check(identifier)

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: getRetryAfterSeconds(rateLimitResult.resetTime) },
                { status: 429, headers: { 'Retry-After': String(getRetryAfterSeconds(rateLimitResult.resetTime)) } }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const sport = searchParams.get('sport')
        const league = searchParams.get('league')
        const eventId = searchParams.get('event')

        if (!sport || !league || !eventId) {
            return NextResponse.json({ error: 'Sport, league, and event required' }, { status: 400 })
        }

        const data = await getGameSummary(sport, league, eventId)
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
    }
}
