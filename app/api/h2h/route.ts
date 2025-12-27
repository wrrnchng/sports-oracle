import { NextRequest, NextResponse } from 'next/server'
import { getHeadToHead } from '@/lib/espn'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')
    const teamId = searchParams.get('teamId')
    const opponentId = searchParams.get('opponentId')

    if (!sport || !league || !teamId || !opponentId) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    try {
        const events = await getHeadToHead(sport, league, teamId, opponentId)
        return NextResponse.json(events)
    } catch (error) {
        console.error('API Error in H2H:', error)
        return NextResponse.json({ error: 'Failed to fetch H2H data' }, { status: 500 })
    }
}
