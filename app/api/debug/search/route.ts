import { NextResponse } from 'next/server'
import { getTeams, getTeamRoster } from '@/lib/espn'

export const dynamic = 'force-dynamic'

export async function GET() {
    const logs: string[] = []
    const log = (msg: any) => logs.push(typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg))

    try {
        log('--- Testing NFL ---')
        const nflTeams = await getTeams('football', 'nfl')
        const nflTeamList = nflTeams.sports?.[0]?.leagues?.[0]?.teams || []
        log(`NFL Teams found: ${nflTeamList.length}`)

        if (nflTeamList.length > 0) {
            const team = nflTeamList[0].team
            log(`Checking roster for ${team.displayName} (${team.id})`)
            const roster = await getTeamRoster('football', 'nfl', team.id)
            log(`Roster keys: ${Object.keys(roster)}`)
            if (roster.athletes) {
                log(`Athletes isArray: ${Array.isArray(roster.athletes)}`)
                if (Array.isArray(roster.athletes) && roster.athletes.length > 0) {
                    log('Sample athlete item:')
                    log(roster.athletes[0])
                }
            }
        }

        // getAllPlayers was removed as we switched to the direct Search API
        log('Skipping getAllPlayers test (function removed)')


        log('\n--- Testing NCAAF ---')
        const ncaafTeams = await getTeams('football', 'college-football')
        const ncaafTeamList = ncaafTeams.sports?.[0]?.leagues?.[0]?.teams || []
        log(`NCAAF Teams found: ${ncaafTeamList.length}`)

        // NCAA often divides into sub-groups or typically has ~130 FBS teams + FCS. 
        // The default teams endpoint might only return a subset or group 80.

        if (ncaafTeamList.length > 0) {
            const team = ncaafTeamList[0].team
            log(`Checking roster for ${team.displayName} (${team.id})`)
            const roster = await getTeamRoster('football', 'college-football', team.id)
            log(`Roster check: ${roster?.athletes ? 'Has athletes' : 'No athletes'}`)
        }

    } catch (e: any) {
        log(`Error: ${e.message}`)
        if (e.stack) log(e.stack)
    }

    return NextResponse.json({ logs })
}
