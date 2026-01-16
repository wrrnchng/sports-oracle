
async function probe() {
    // Dak Prescott NFL Gamelog
    const athleteId = '2577417';
    const baseUrl = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${athleteId}/gamelog?region=us&lang=en&contentorigin=espn`;

    console.log(`\n--- Probing NFL Player Gamelog (Dak Prescott) ---`);
    for (const year of [undefined, 2025, 2026]) {
        const url = year ? `${baseUrl}&season=${year}` : baseUrl;
        try {
            const res = await fetch(url);
            const data: any = await res.json();
            const season = data.season || {};
            console.log(`Year: ${year || 'Default'} -> Season Year: ${season.year}, Name: ${season.displayName}`);
            const seasonTypes = data.seasonTypes || [];
            console.log(`  SeasonTypes count: ${seasonTypes.length}`);
            seasonTypes.forEach((st: any) => {
                const totalEvents = st.categories?.reduce((acc: number, cat: any) => acc + (cat.events?.length || 0), 0) || 0;
                console.log(`    Type ${st.type} (${st.displayName}): ${totalEvents} events`);
            });
        } catch (e) {
            console.log(`  Failed: ${e}`);
        }
    }
}

probe();
