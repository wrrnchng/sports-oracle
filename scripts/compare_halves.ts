
async function run() {
    for (const yr of [2024, 2025]) {
        console.log(`\n--- La Liga Season ${yr} ---`);
        const h1 = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?season=${yr}&half=1`).then(r => r.json());
        const h2 = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?season=${yr}&half=2`).then(r => r.json());

        const events1 = h1.events || [];
        const events2 = h2.events || [];
        const ids1 = events1.map(e => e.id);
        const ids2 = events2.map(e => e.id);
        const unique = new Set([...ids1, ...ids2]);

        console.log(`H1: ${events1.length}, H2: ${events2.length}, Unique Total: ${unique.size}`);
        if (unique.size > 0) {
            const sorted = [...unique].map(id => [...events1, ...events2].find(e => e.id === id))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            console.log(`  Range: ${sorted[0].date.substring(0, 10)} to ${sorted[sorted.length - 1].date.substring(0, 10)}`);
        }
    }
}
run();
