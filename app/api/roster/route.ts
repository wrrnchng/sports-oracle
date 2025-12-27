import { NextRequest, NextResponse } from 'next/server'
import { getTeamRoster } from '@/lib/espn'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const sport = searchParams.get('sport')
        const league = searchParams.get('league')
        const teamId = searchParams.get('teamId')

        if (!sport || !league || !teamId) {
            return NextResponse.json({ error: 'Sport, league, and teamId required' }, { status: 400 })
        }

        const data = await getTeamRoster(sport, league, teamId)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching roster:', error)
        return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 })
    }
}
