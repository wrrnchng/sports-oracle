
async function run() {
    const h1 = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?season=2025&seasontype=1&half=1').then(r => r.json());
    const h2 = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?season=2025&seasontype=1&half=2').then(r => r.json());

    console.log('H1 first match:', h1.events?.[0]?.date, h1.events?.[0]?.name);
    console.log('H1 last match:', h1.events?.[h1.events.length - 1]?.date, h1.events?.[h1.events.length - 1]?.name);

    console.log('H2 first match:', h2.events?.[0]?.date, h2.events?.[0]?.name);
    console.log('H2 last match:', h2.events?.[h2.events.length - 1]?.date, h2.events?.[h2.events.length - 1]?.name);
}
run();
