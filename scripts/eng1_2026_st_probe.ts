
async function run() {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/359/schedule?season=2026').then(r => r.json());
    if (res.events && res.events.length > 0) {
        console.log('ENG.1 2026 SeasonType:', res.events[0].seasonType.id);
        console.log('ENG.1 2026 Year:', res.season.year);
    } else {
        console.log('No events for ENG.1 2026');
    }
}
run();
