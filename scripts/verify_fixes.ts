
import { getTeamSchedule, getPlayerGamelog } from '../lib/espn';

async function verify() {
    console.log("--- Verifying NFL Cowboys Schedule Fix ---");
    // Cowboys (Id 6)
    try {
        const schedule = await getTeamSchedule('football', 'nfl', '6');
        console.log(`Cowboys Events: ${schedule.events?.length || 0}`);
        if (schedule.events?.length > 0) {
            console.log(`First event date: ${schedule.events[0].date}`);
            const postSeason = schedule.events.filter((e: any) => e.seasonType === 3);
            console.log(`Postseason events: ${postSeason.length}`);
        }
    } catch (e) {
        console.error("Cowboys verify failed:", e);
    }

    console.log("\n--- Verifying NFL Player Gamelog Fix ---");
    // Dak Prescott (2577417)
    try {
        const gamelog = await getPlayerGamelog('football', 'nfl', '2577417');
        const seasonTypes = (gamelog as any).seasonTypes || [];
        console.log(`Dak SeasonTypes: ${seasonTypes.length}`);
        if (seasonTypes.length > 0) {
            seasonTypes.forEach((st: any) => {
                const totalEvents = st.categories?.reduce((acc: number, cat: any) => acc + (cat.events?.length || 0), 0) || 0;
                console.log(`  Type ${st.type} (${st.displayName}): ${totalEvents} events`);
                if (totalEvents > 0) {
                    // st.categories[0] should exist if totalEvents > 0
                    const firstCat = st.categories.find((c: any) => c.events?.length > 0);
                    if (firstCat) {
                        console.log(`  Sample event date: ${firstCat.events[0].gameDate || firstCat.events[0].date}`);
                    }
                }
            });
        } else {
            console.log("NO SEASON TYPES FOUND - GAMELOG STILL BROKEN?");
        }
    } catch (e) {
        console.error("Dak verify failed:", e);
    }
}

verify();
