
async function probe() {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule';
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Keys:", Object.keys(data));
        console.log("Season Object:", JSON.stringify(data.season, null, 2));
        if (data.seasonTypes) {
            console.log("SeasonTypes:", data.seasonTypes.map(st => `${st.id}: ${st.name} (${st.year})`));
        }
        console.log("Events count:", data.events?.length);
        if (data.events?.length > 0) {
            console.log("First Event:", data.events[0].date);
            console.log("Last Event:", data.events[data.events.length - 1].date);
        }
    } catch (e) {
        console.log("Probe failed:", e);
    }
}
probe();
