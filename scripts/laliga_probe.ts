
async function probe() {
    const leagues = [
        { name: 'La Liga', slug: 'esp.1', teamId: '86' },
        { name: 'Premier League', slug: 'eng.1', teamId: '359' }
    ];

    for (const league of leagues) {
        console.log(`\n--- ${league.name} ---`);
        const queries = [
            { label: 'Default', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/teams/${league.teamId}/schedule` },
            { label: '2025', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/teams/${league.teamId}/schedule?season=2025` },
            { label: '2026', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/teams/${league.teamId}/schedule?season=2026` }
        ];

        for (const q of queries) {
            try {
                const res = await fetch(q.url);
                const data = await res.json();
                const events = data.events || [];
                if (events.length > 0) {
                    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    console.log(`  ${q.label}: ${events.length} matches [${sorted[0].date.substring(0, 10)} to ${sorted[sorted.length - 1].date.substring(0, 10)}]`);
                } else {
                    console.log(`  ${q.label}: 0 matches`);
                }
            } catch (e) {
                console.log(`  ${q.label} failed`);
            }
        }
    }
}
probe();
