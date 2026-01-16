
async function run() {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/359/schedule?season=2026').then(r => r.json());
    console.log('ENG.1 2026 Season:', JSON.stringify(res.season, null, 2));
    if (res.seasonTypes) console.log('ENG.1 2026 SeasonTypes:', res.seasonTypes.map(st => st.id));
    if (res.events?.length > 0) {
        console.log('Sample Event:', res.events[0].date, res.events[0].name);
    }
}
run();
