import { getStandings } from '@/lib/espn'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')

    if (!sport || !league) {
        return NextResponse.json({ error: 'Sport and League are required' }, { status: 400 })
    }

    try {
        const data = await getStandings(sport, league)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching standings:', error)
        return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 })
    }
}
