// Minimal test to reproduce the standings fetch issue
import { getStandings } from '../lib/espn.js'

async function testStandings() {
    console.log('Testing NFL standings fetch...')
    try {
        const standings = await getStandings('football', 'nfl')
        console.log('Success! Standings:', standings.name)
        console.log('Groups:', standings.groups?.length || 0)
        console.log('Entries:', standings.entries?.length || 0)
    } catch (error) {
        console.error('Failed:', error.message)
        console.error('Stack:', error.stack)
    }
}

testStandings()
