
async function run() {
    const r1 = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/359/schedule?season=2025&half=1').then(r => r.json());
    const r2 = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/359/schedule?season=2025&half=2').then(r => r.json());

    console.log('ENG.1 H1:', r1.events?.[0]?.date, r1.events?.[r1.events.length - 1]?.date);
    console.log('ENG.1 H2:', r2.events?.[0]?.date, r2.events?.[r2.events.length - 1]?.date);
}
run();
