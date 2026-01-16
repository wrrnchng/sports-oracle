import { NextRequest, NextResponse } from 'next/server'
import { getPlayerGamelog, getPlayerTeamGamelog } from '@/lib/espn'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const sport = searchParams.get('sport')
        const league = searchParams.get('league')
        const athleteId = searchParams.get('athleteId')
        const teamId = searchParams.get('teamId')

        if (!sport || !league || !athleteId) {
            return NextResponse.json({ error: 'Sport, league, and athleteId required' }, { status: 400 })
        }

        const data = await getPlayerTeamGamelog(sport, league, athleteId, teamId || undefined)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching gamelog:', error)
        return NextResponse.json({ error: 'Failed to fetch gamelog' }, { status: 500 })
    }
}
