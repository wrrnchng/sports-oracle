
async function run() {
    const leagues = ['esp.1', 'eng.1'];
    for (const l of leagues) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${l}/teams`;
        const res = await fetch(url).then(r => r.json());
        const soccer = res.sports[0].leagues[0];
        console.log(`--- ${l} ---`);
        console.log("Season:", JSON.stringify(soccer.season, null, 2));
    }
}
run();
