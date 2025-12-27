import { getGameSummary } from '../lib/espn'
import fs from 'fs'

async function debugSummaries() {
    // Soccer example: Arsenal vs Crystal Palace (760341 from missing_match_search.txt)
    const soccerId = '760341'
    try {
        console.log(`Fetching soccer summary for ${soccerId}...`)
        const soccerSummary = await getGameSummary('soccer', 'eng.league_cup', soccerId)
        fs.writeFileSync('soccer_summary_debug.json', JSON.stringify(soccerSummary, null, 2))
        console.log('Saved soccer_summary_debug.json')
    } catch (err) {
        console.error('Soccer summary failed:', err)
    }

    // Basketball example: 401810278
    const basketballId = '401810278'
    try {
        console.log(`Fetching basketball summary for ${basketballId}...`)
        const basketballSummary = await getGameSummary('basketball', 'nba', basketballId)
        fs.writeFileSync('debug/basketball_summary_debug.json', JSON.stringify(basketballSummary, null, 2))
        console.log('Saved basketball_summary_debug.json')
    } catch (err) {
        console.error('Basketball summary failed:', err)
    }

    // NFL example: 401671701 (just a guess, let me find a real one if fails)
    const nflId = '401671701'
    try {
        console.log(`Fetching nfl summary for ${nflId}...`)
        const nflSummary = await getGameSummary('football', 'nfl', nflId)
        fs.writeFileSync('debug/nfl_summary_debug.json', JSON.stringify(nflSummary, null, 2))
        console.log('Saved nfl_summary_debug.json')
    } catch (err) {
        console.error('NFL summary failed:', err)
    }
}

debugSummaries()
