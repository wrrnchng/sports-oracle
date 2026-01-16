
async function run() {
    const h1 = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?season=2025&half=1').then(r => r.json());
    const h2 = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?season=2025&half=2').then(r => r.json());
    console.log('H1 Season half in response:', h1.season?.half);
    console.log('H2 Season half in response:', h2.season?.half);
    console.log('H1 events[0]:', h1.events?.[0]?.date);
    console.log('H2 events[0]:', h2.events?.[0]?.date);
}
run();
