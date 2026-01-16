
async function probe() {
    // LeBron James NBA Gamelog
    const athleteId = '1966';
    const baseUrl = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${athleteId}/gamelog?region=us&lang=en&contentorigin=espn`;

    console.log(`\n--- Probing Player Gamelog (LeBron James) ---`);
    for (const year of [undefined, 2025, 2026]) {
        const url = year ? `${baseUrl}&season=${year}` : baseUrl;
        try {
            const res = await fetch(url);
            const data: any = await res.json();
            const season = data.season || {};
            console.log(`Year: ${year || 'Default'} -> Season Year: ${season.year}, Name: ${season.displayName}`);
            const entries = data.entries || [];
            console.log(`  Entries count: ${entries.length}`);
            if (entries.length > 0) {
                // Find latest game date
                const allGames = entries.flatMap((e: any) => e.events || []);
                if (allGames.length > 0) {
                    allGames.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    console.log(`  Latest game date: ${allGames[0].date}`);
                }
            }
        } catch (e) {
            console.log(`  Failed: ${e}`);
        }
    }

    // NFL Season Type Probe (Cowboys - 6)
    console.log(`\n--- Probing NFL Season Types (Cowboys) ---`);
    const nflBase = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/6/schedule`;
    for (const st of [2, 3]) {
        const url = `${nflBase}?seasontype=${st}`;
        try {
            const res = await fetch(url);
            const data: any = await res.json();
            console.log(`Type ${st} (${st === 2 ? 'Reg' : 'Post'}): ${data.events?.length || 0} events`);
            if (data.events?.length > 0) {
                console.log(`  First event: ${data.events[0].date}`);
            }
        } catch (e) {
            console.log(`  Failed: ${e}`);
        }
    }
}

probe();
