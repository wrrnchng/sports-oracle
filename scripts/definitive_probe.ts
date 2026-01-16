
async function probe() {
    const leagues = [
        { name: 'La Liga', slug: 'esp.1', teamId: '86' },
        { name: 'Premier League', slug: 'eng.1', teamId: '359' }
    ];

    for (const league of leagues) {
        console.log(`\n--- ${league.name} (${league.slug}) ---`);
        const qs = [
            '',
            '?season=2025',
            '?season=2026',
            '?seasontype=1',
            '?seasontype=2',
            '?season=2025&half=1',
            '?season=2025&half=2'
        ];
        for (const q of qs) {
            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/teams/${league.teamId}/schedule${q}`;
            try {
                const res = await fetch(url).then(r => r.json());
                const events = res.events || [];
                if (events.length > 0) {
                    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    console.log(`  ${q || 'Default'}: ${events.length} matches [${sorted[0].date.substring(0, 10)} to ${sorted[sorted.length - 1].date.substring(0, 10)}]`);
                } else {
                    console.log(`  ${q || 'Default'}: 0 matches`);
                }
            } catch (e) {
                console.log(`  ${q || 'Default'}: FAILED`);
            }
        }
    }
}
probe();
