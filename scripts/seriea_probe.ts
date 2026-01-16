
async function run() {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/teams/110/schedule?season=2025').then(r => r.json());
    console.log('Inter 2025 count:', res.events?.length);
    if (res.events?.length > 0) {
        const sorted = [...res.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        console.log(`  Range: ${sorted[0].date.substring(0, 10)} to ${sorted[sorted.length - 1].date.substring(0, 10)}`);
    }
}
run();
