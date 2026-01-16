
async function probe() {
    const sports = [
        { sport: 'basketball', league: 'nba', teamId: '1' }, // 7ers
        { sport: 'football', league: 'nfl', teamId: '6' }, // Cowboys
        { sport: 'soccer', league: 'eng.1', teamId: '359' } // Arsenal
    ];

    for (const { sport, league, teamId } of sports) {
        console.log(`\n--- Probing ${sport}/${league} (Team ${teamId}) ---`);

        // 1. No season
        const urlDefault = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule`;
        try {
            const res = await fetch(urlDefault);
            const data = await res.json();
            console.log(`Default (No Season) Season: ${data.season?.year} - ${data.season?.displayName}`);
            console.log(`Events count: ${data.events?.length || 0}`);
            if (data.events?.length > 0) {
                console.log(`Latest event: ${data.events[data.events.length - 1].date}`);
            }
        } catch (e) {
            console.log(`Default fetch failed: ${e}`);
        }

        // 2. Season 2026
        const url2026 = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule?season=2026`;
        try {
            const res = await fetch(url2026);
            const data = await res.json();
            console.log(`Season 2026 Season: ${data.season?.year} - ${data.season?.displayName}`);
            console.log(`Events count: ${data.events?.length || 0}`);
        } catch (e) {
            console.log(`2026 fetch failed: ${e}`);
        }

        // 3. Season 2025
        const url2025 = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule?season=2025`;
        try {
            const res = await fetch(url2025);
            const data = await res.json();
            console.log(`Season 2025 Season: ${data.season?.year} - ${data.season?.displayName}`);
            console.log(`Events count: ${data.events?.length || 0}`);
        } catch (e) {
            console.log(`2025 fetch failed: ${e}`);
        }
    }
}

probe();
