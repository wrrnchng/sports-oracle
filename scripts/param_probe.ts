
async function probe() {
    const base = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule';
    const urls = [
        base + '?season=2025',
        base + '?season=2025&half=1',
        base + '?season=2025&seasontype=2',
        base + '?season=2025&seasontype=2&half=1',
        base + '?seasontype=2'
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url).then(r => r.json());
            console.log(`${url} -> ${res.events?.length || 0}`);
        } catch (e) {
            console.log(`${url} -> FAILED`);
        }
    }
}
probe();
