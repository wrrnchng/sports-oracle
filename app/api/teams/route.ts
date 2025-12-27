import { NextRequest, NextResponse } from 'next/server'
import { getTeams } from '@/lib/espn'
import { teamsRateLimiter, getClientIdentifier, getRetryAfterSeconds } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // Cache for 24 hours

export async function GET(request: NextRequest) {
    try {
        const identifier = getClientIdentifier(request)
        const rateLimitResult = teamsRateLimiter.check(identifier)

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: getRetryAfterSeconds(rateLimitResult.resetTime) },
                { status: 429, headers: { 'Retry-After': String(getRetryAfterSeconds(rateLimitResult.resetTime)) } }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const sport = searchParams.get('sport')
        const league = searchParams.get('league')

        if (!sport || !league) {
            return NextResponse.json({ error: 'Sport and league required' }, { status: 400 })
        }

        const data = await getTeams(sport, league)

        // Normalize logos: ESPN returns 'logos' array, but we need 'logo' string
        if (data.sports) {
            data.sports.forEach((s: any) => {
                s.leagues?.forEach((l: any) => {
                    l.teams?.forEach((t: any) => {
                        if (t.team) {
                            // If logo is not set but logos array exists, extract it
                            if (!t.team.logo && t.team.logos && t.team.logos.length > 0) {
                                t.team.logo = t.team.logos[0].href
                            }
                        }
                    })
                })
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }
}
