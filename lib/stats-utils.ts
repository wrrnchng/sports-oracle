export interface TeamFormStats {
    results: ('W' | 'L' | 'D')[]
    ppg: number
    winPct: number // 0-100
    avgPoints: number // Total Goals / Played
    scored: number // Avg Scored
    conceded: number // Avg Conceded
    btts: number // %
    cs: number // %
    fts: number // %
    xG: number
    xGA: number
    recentGames: any[]
}

export function calculateTeamStats(events: any[], teamId: string, sport: string, leagueId?: string): TeamFormStats {
    if (!events || !Array.isArray(events) || events.length === 0) {
        return {
            results: [],
            ppg: 0,
            winPct: 0,
            avgPoints: 0,
            scored: 0,
            conceded: 0,
            btts: 0,
            cs: 0,
            fts: 0,
            xG: 0,
            xGA: 0,
            recentGames: []
        }
    }

    // Filter valid completed matches AND match the requested league if provided
    const completedMatches = events.filter(e => {
        const state = e.competitions?.[0]?.status?.type?.state
        const isCompleted = state === 'post' || e.competitions?.[0]?.status?.type?.completed === true

        // League Filter
        const eventLeague = e.league?.slug || e.competitions?.[0]?.league?.slug || e.season?.slug
        const isCorrectLeague = leagueId ? eventLeague === leagueId : true

        return isCompleted && isCorrectLeague
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first

    if (completedMatches.length === 0) {
        return {
            results: [],
            ppg: 0,
            winPct: 0,
            avgPoints: 0,
            scored: 0,
            conceded: 0,
            btts: 0,
            cs: 0,
            fts: 0,
            xG: 0,
            xGA: 0,
            recentGames: []
        }
    }

    let wins = 0
    let draws = 0
    let losses = 0
    let goalsFor = 0
    let goalsAgainst = 0
    let bttsCount = 0
    let csCount = 0
    let ftsCount = 0

    const results: ('W' | 'L' | 'D')[] = []

    completedMatches.forEach(match => {
        const competitors = match.competitions?.[0]?.competitors
        if (!competitors) return

        const us = competitors.find((c: any) => c.team.id === teamId)
        const opponent = competitors.find((c: any) => c.team.id !== teamId)

        if (!us || !opponent) return

        // Scores Helper
        const getScoreVal = (c: any) => {
            if (typeof c.score?.value === 'number') return c.score.value
            if (typeof c.score === 'number') return c.score
            return parseInt(c.score?.value || c.score?.displayValue || c.score || '0')
        }

        const myScore = getScoreVal(us)
        const opScore = getScoreVal(opponent)

        goalsFor += myScore
        goalsAgainst += opScore

        // Result
        let result: 'W' | 'L' | 'D' = 'D'
        if (myScore > opScore) {
            wins++
            result = 'W'
        } else if (myScore < opScore) {
            losses++
            result = 'L'
        } else {
            draws++
            result = 'D'
        }

        // We only want the last 5 for the form array, but we iterate all for stats?
        // Actually, normally "Form" is last 5, but Stats are usually season stats.
        // The View passes filtered lists (all season events usually).
        // So we calculate stats on ALL passed events, and take top X for valid results list?
        // The UI shows 5 icons.

        // Stats Logic
        if (myScore > 0 && opScore > 0) bttsCount++
        if (opScore === 0) csCount++
        if (myScore === 0) ftsCount++

        results.push(result)
    })

    const played = completedMatches.length
    const ppg = played > 0 ? ((wins * 3) + (draws * 1)) / played : 0
    const winPct = played > 0 ? Math.round((wins / played) * 100) : 0

    // AVG in table was (GF + GA) / Played
    const avgPoints = played > 0 ? parseFloat(((goalsFor + goalsAgainst) / played).toFixed(2)) : 0

    const scoredAvg = played > 0 ? parseFloat((goalsFor / played).toFixed(2)) : 0
    const concededAvg = played > 0 ? parseFloat((goalsAgainst / played).toFixed(2)) : 0

    const bttsPct = played > 0 ? Math.round((bttsCount / played) * 100) : 0
    const csPct = played > 0 ? Math.round((csCount / played) * 100) : 0
    const ftsPct = played > 0 ? Math.round((ftsCount / played) * 100) : 0

    return {
        results: results.slice(0, 5), // Return last 5 for the icons
        ppg: parseFloat(ppg.toFixed(2)),
        winPct,
        avgPoints,
        scored: scoredAvg,
        conceded: concededAvg,
        btts: bttsPct,
        cs: csPct,
        fts: ftsPct,
        xG: 0, // Not available in basic ESPN API
        xGA: 0, // Not available in basic ESPN API
        recentGames: completedMatches.slice(0, 5) // Return last 5 actual match objects
    }
}
