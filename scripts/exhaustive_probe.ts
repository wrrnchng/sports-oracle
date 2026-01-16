
async function probe() {
    const slug = 'esp.1';
    const teamId = '86';
    const seasons = [2025, 2026];
    const types = [2, 3];
    const halves = [1, 2];

    for (const s of seasons) {
        for (const t of types) {
            for (const h of halves) {
                const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${teamId}/schedule?season=${s}&seasontype=${t}&half=${h}`;
                const res = await fetch(url);
                const data = await res.json();
                const events = data.events || [];
                console.log(`S:${s} T:${t} H:${h} -> Count: ${events.length}`);
                if (events.length > 0) {
                    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    console.log(`  - ${sorted[0].date.substring(0, 10)} to ${sorted[sorted.length - 1].date.substring(0, 10)}`);
                }
            }
        }
    }
}
probe();
