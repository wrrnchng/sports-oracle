import { calculateAdvancedStats } from '../lib/stats-utils'
import fs from 'fs'

async function debugAdvanced() {
    const soccerSum = JSON.parse(fs.readFileSync('debug/soccer_summary_debug.json', 'utf8'))
    const teamId = '359' // Arsenal

    console.log('--- SOCCER ADVANCED ---')
    const soccerStats = calculateAdvancedStats([soccerSum], teamId, 'soccer')
    console.log(JSON.stringify(soccerStats.soccer?.fullTime, null, 2))
    console.log('HT:', JSON.stringify(soccerStats.soccer?.halfTime, null, 2))

    console.log('--- BASKETBALL ADVANCED ---')
    const bballSum = JSON.parse(fs.readFileSync('debug/basketball_summary_debug.json', 'utf8'))
    const bTeamId = '1' // Hawks
    const bStats = calculateAdvancedStats([bballSum], bTeamId, 'basketball')
    console.log(JSON.stringify(bStats.basketball, null, 2))

    console.log('--- NFL ADVANCED ---')
    const nflSum = JSON.parse(fs.readFileSync('debug/nfl_summary_debug.json', 'utf8'))
    const nTeamId = '17' // Patriots
    const nStats = calculateAdvancedStats([nflSum], nTeamId, 'football')
    console.log(JSON.stringify(nStats.nfl, null, 2))
}

debugAdvanced()
