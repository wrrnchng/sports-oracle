
import { getTeamSchedule } from '../lib/espn';

async function verify() {
    console.log("--- Verifying Real Madrid (La Liga) Schedule Fix ---");
    try {
        const schedule = await getTeamSchedule('soccer', 'esp.1', '86');
        console.log(`Real Madrid Events Total: ${schedule.events?.length || 0}`);
        if (schedule.events?.length > 0) {
            const h1 = schedule.events.filter(e => new Date(e.date).getFullYear() === 2025);
            const h2 = schedule.events.filter(e => new Date(e.date).getFullYear() === 2026);
            console.log(`  2025 matches: ${h1.length}`);
            console.log(`  2026 matches: ${h2.length}`);

            // Check for upcoming match
            const now = new Date();
            const upcoming = schedule.events.filter(e => new Date(e.date) > now);
            console.log(`  Upcoming matches: ${upcoming.length}`);
            if (upcoming.length > 0) {
                console.log(`  Next Match: ${upcoming[0].date} - ${upcoming[0].name}`);
            }
        }
    } catch (e) {
        console.error("La Liga verify failed:", e);
    }
}

verify();
