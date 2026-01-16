
async function probe() {
    const sports = [
        { sport: 'basketball', league: 'nba', teamId: '1' }, // 7ers
        { sport: 'football', league: 'nfl', teamId: '6' }, // Cowboys
        { sport: 'soccer', league: 'eng.1', teamId: '359' } // Arsenal
    ];

    for (const { sport, league, teamId } of sports) {
        console.log(`\n--- Probing ${sport}/${league} Roster (Team ${teamId}) ---`);

        const urlDefault = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/roster`;
        try {
            const res = await fetch(urlDefault);
            const data: any = await res.json();
            console.log(`Default Roster - Athletes count: ${data.athletes?.length || 0}`);
            if (data.athletes?.length > 0) {
                console.log(`Sample Athlete: ${data.athletes[0].displayName || data.athletes[0].items?.[0]?.displayName}`);
            }
        } catch (e) {
            console.log(`Default fetch failed: ${e}`);
        }

        const url2025 = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/roster?season=2025`;
        try {
            const res = await fetch(url2025);
            const data: any = await res.json();
            console.log(`2025 Roster - Athletes count: ${data.athletes?.length || 0}`);
        } catch (e) {
            console.log(`2025 fetch failed: ${e}`);
        }
    }
}

probe();
