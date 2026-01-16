
import { format } from 'date-fns';

async function debugDiscovery() {
    const teamId = '86'; // Real Madrid
    const sport = 'soccer';
    const league = 'esp.1';

    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const futureDateStr = format(futureDate, 'yyyyMMdd');

    console.log(`Checking scoreboard: ${dateStr}-${futureDateStr}`);
    const sbUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${dateStr}-${futureDateStr}`;
    const res = await fetch(sbUrl).then(r => r.json());

    console.log(`Found ${res.events?.length || 0} events in scoreboard`);

    res.events?.forEach((event: any) => {
        const competitors = event.competitions?.[0]?.competitors || [];
        const isOurTeam = competitors.some((c: any) => c.team?.id === teamId);
        if (isOurTeam) {
            console.log(`MATCH FOUND: ${event.date} - ${event.name} (id: ${event.id})`);
        }
    });

    // Also check Super Cup
    console.log(`Checking Super Cup scoreboard...`);
    const scUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/esp.super_cup/scoreboard?dates=${dateStr}-${futureDateStr}`;
    const scRes = await fetch(scUrl).then(r => r.json());
    console.log(`Found ${scRes.events?.length || 0} events in Super Cup`);
    scRes.events?.forEach((event: any) => {
        const competitors = event.competitions?.[0]?.competitors || [];
        const isOurTeam = competitors.some((c: any) => c.team?.id === teamId);
        if (isOurTeam) {
            console.log(`SUPER CUP MATCH FOUND: ${event.date} - ${event.name} (id: ${event.id})`);
        }
    });
}
debugDiscovery();
