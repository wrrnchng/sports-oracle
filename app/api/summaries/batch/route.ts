import { NextResponse } from 'next/server'
import { getGameSummariesBatch } from '@/lib/espn'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')
    const eventIds = searchParams.get('eventIds')?.split(',')

    if (!sport || !league || !eventIds || eventIds.length === 0) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    try {
        const summaries = await getGameSummariesBatch(sport, league, eventIds)
        return NextResponse.json(summaries)
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Failed to fetch summaries' }, { status: 500 })
    }
}
