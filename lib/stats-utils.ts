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
        const eventLeague = (e.league?.slug || e.competitions?.[0]?.league?.slug || e.season?.slug || '').toLowerCase()
        const targetLeague = (leagueId || '').toLowerCase()
        let isCorrectLeague = targetLeague ? eventLeague === targetLeague : true

        // Fallback for NBA/NFL where slugs might be missing from schedule data
        if (targetLeague && !isCorrectLeague && !eventLeague) {
            if (sport === 'basketball' && targetLeague === 'nba') isCorrectLeague = true
            if (sport === 'nfl' && targetLeague === 'nfl') isCorrectLeague = true
        }

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

// --- Advanced Stats Interfaces ---

export interface SoccerPeriodBreakdown {
    over05: number;
    over15: number;
    over25: number;
    over35: number;
    over45: number;
    btts: number;
    bttsWin: number;
    bttsDraw: number;
    bttsOver25: number;
    bttsNoOver25: number;
    failedToScore: number;
    cleanSheet: number;
    avgGoals: number;
    teamOver15: number;
    oppOver15: number;
    corners: {
        total: number;
        us: number;
        them: number;
        over6: number;
        over7: number;
        over8: number;
        over9: number;
        over10: number;
        over11: number;
        over12: number;
        over13: number;
        teamOver25: number;
        teamOver35: number;
        teamOver45: number;
        oppOver25: number;
        oppOver35: number;
        oppOver45: number;
    }
}

export interface SoccerAdvancedStats {
    fullTime: SoccerPeriodBreakdown;
    halfTime: SoccerPeriodBreakdown;
    secondHalf: SoccerPeriodBreakdown;
}

export interface BasketballAllowedStats {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    threePointsMade: number;
    perQuarter: {
        points: number[];
    }
}

export interface NFLAllowedStats {
    touchdowns: number;
    receptions: number;
    interceptions: number;
    yards: {
        total: number;
        passing: number;
        receiving: number;
        rushing: number;
    }
}

export interface AdvancedStats {
    soccer?: SoccerAdvancedStats;
    basketball?: BasketballAllowedStats;
    nfl?: NFLAllowedStats;
    sampleSize: number;
}

export function calculateAdvancedStats(summaries: any[], teamId: string, sport: string): AdvancedStats {
    if (!summaries || summaries.length === 0) return { sampleSize: 0 }

    if (sport === 'soccer') {
        const stats: SoccerAdvancedStats = {
            fullTime: createEmptyPeriodBreakdown(),
            halfTime: createEmptyPeriodBreakdown(),
            secondHalf: createEmptyPeriodBreakdown()
        }

        summaries.forEach(s => {
            const competitors = s.header?.competitions?.[0]?.competitors
            if (!competitors) return

            const us = competitors.find((c: any) => c.id === teamId)
            const opponent = competitors.find((c: any) => c.id !== teamId)
            if (!us || !opponent) return

            const myScore = parseInt(us.score || '0')
            const opScore = parseInt(opponent.score || '0')
            const totalScore = myScore + opScore

            // Extract Half-Time scores from linescores
            const myHT = parseInt(us.linescores?.[0]?.displayValue || '0')
            const opHT = parseInt(opponent.linescores?.[0]?.displayValue || '0')
            const totalHT = myHT + opHT

            const my2H = parseInt(us.linescores?.[1]?.displayValue || '0')
            const op2H = parseInt(opponent.linescores?.[1]?.displayValue || '0')
            const total2H = my2H + op2H

            // Extract Corners from Plays
            const plays = s.boxscore?.plays || []
            const cornerPlays = plays.filter((p: any) => p.type?.text === 'Corner Kick')
            const myFTCorners = cornerPlays.filter((p: any) => p.team?.id === teamId).length
            const opFTCorners = cornerPlays.filter((p: any) => p.team?.id !== teamId).length

            const myHTCorners = cornerPlays.filter((p: any) => p.team?.id === teamId && p.period?.number === 1).length
            const opHTCorners = cornerPlays.filter((p: any) => p.team?.id !== teamId && p.period?.number === 1).length

            const my2HCorners = cornerPlays.filter((p: any) => p.team?.id === teamId && p.period?.number === 2).length
            const op2HCorners = cornerPlays.filter((p: any) => p.team?.id !== teamId && p.period?.number === 2).length

            // If team stats are available, use them for FT corners as they might be more accurate
            const teamStat = (team: any, name: string) => {
                const s = team?.statistics?.find((st: any) => st.name === name)
                return parseInt(s?.displayValue || '0')
            }
            const boxUs = s.boxscore?.teams?.find((t: any) => t.team.id === teamId)
            const boxOp = s.boxscore?.teams?.find((t: any) => t.team.id !== teamId)
            const myFinalCorners = teamStat(boxUs, 'wonCorners') || myFTCorners
            const opFinalCorners = teamStat(boxOp, 'wonCorners') || opFTCorners

            // Update Full Time
            updatePeriodStats(stats.fullTime, myScore, opScore, totalScore, myFinalCorners, opFinalCorners)
            // Update 1st Half
            updatePeriodStats(stats.halfTime, myHT, opHT, totalHT, myHTCorners, opHTCorners)
            // Update 2nd Half
            updatePeriodStats(stats.secondHalf, my2H, op2H, total2H, my2HCorners, op2HCorners)
        })

        // Finalize averages (percentages)
        finalizePeriodStats(stats.fullTime, summaries.length)
        finalizePeriodStats(stats.halfTime, summaries.length)
        finalizePeriodStats(stats.secondHalf, summaries.length)

        return { soccer: stats, sampleSize: summaries.length }
    }

    if (sport === 'basketball') {
        let tPoints = 0, tReb = 0, tAst = 0, tStl = 0, tBlk = 0, t3PM = 0
        const qPoints = [0, 0, 0, 0]

        summaries.forEach(s => {
            const teamStats = s.boxscore?.teams
            const competitors = s.header?.competitions?.[0]?.competitors
            if (!teamStats || !competitors) return

            // Opponent is the one we "allow" stats to
            const opponentStats = teamStats.find((t: any) => t.team.id !== teamId)
            const opponentHeader = competitors.find((c: any) => c.id !== teamId)
            if (!opponentStats || !opponentHeader) return

            const getStat = (name: string) => {
                const stat = opponentStats.statistics?.find((st: any) => st.name === name)
                return parseFloat(stat?.displayValue || '0')
            }

            tPoints += parseInt(opponentHeader.score || '0')
            tReb += getStat('totalRebounds')
            tAst += getStat('assists')
            tStl += getStat('steals')
            tBlk += getStat('blocks')

            const threePT = opponentStats.statistics?.find((st: any) => st.name === 'threePointFieldGoalsMade-threePointFieldGoalsAttempted')
            if (threePT) {
                t3PM += parseInt(threePT.displayValue.split('-')[0] || '0')
            }

            // Quarter points
            const linescores = s.header?.competitions?.[0]?.competitors?.find((c: any) => c.id !== teamId)?.linescores
            if (linescores) {
                linescores.forEach((l: any, i: number) => {
                    if (i < 4) qPoints[i] += parseInt(l.displayValue || '0')
                })
            }
        })

        const count = summaries.length
        return {
            basketball: {
                points: parseFloat((tPoints / count).toFixed(1)),
                rebounds: parseFloat((tReb / count).toFixed(1)),
                assists: parseFloat((tAst / count).toFixed(1)),
                steals: parseFloat((tStl / count).toFixed(1)),
                blocks: parseFloat((tBlk / count).toFixed(1)),
                threePointsMade: parseFloat((t3PM / count).toFixed(1)),
                perQuarter: {
                    points: qPoints.map(p => parseFloat((p / count).toFixed(1)))
                }
            },
            sampleSize: count
        }
    }

    if (sport === 'football') { // NFL
        let tTD = 0, tRec = 0, tInt = 0, tYards = 0, tPassY = 0, tRushY = 0

        summaries.forEach(s => {
            const teamStats = s.boxscore?.teams
            const competitors = s.header?.competitions?.[0]?.competitors
            if (!teamStats || !competitors) return

            const opponentStats = teamStats.find((t: any) => t.team.id !== teamId)
            const opponentHeader = competitors.find((c: any) => c.id !== teamId)
            if (!opponentStats || !opponentHeader) return

            const getStat = (name: string) => {
                const stat = opponentStats.statistics?.find((st: any) => st.name === name)
                return parseFloat(stat?.displayValue || '0')
            }

            tYards += getStat('totalYards')
            tPassY += getStat('netPassingYards')
            tRushY += getStat('rushingYards')
            tInt += getStat('interceptions') // Interceptions thrown by OUR team (allowed to them) or theirs? Pattern is "Allowed to them"

            // Receptions and TDs often need player sum
            let gameRec = 0, gameTD = 0
            s.boxscore?.players?.forEach((pGroup: any) => {
                if (pGroup.team.id !== teamId) {
                    const recStatIdx = pGroup.statistics?.findIndex((st: any) => st.name === 'receiving')
                    const rushStatIdx = pGroup.statistics?.findIndex((st: any) => st.name === 'rushing')
                    const passStatIdx = pGroup.statistics?.findIndex((st: any) => st.name === 'passing')

                    if (recStatIdx !== -1) {
                        const recIdx = pGroup.statistics[recStatIdx].keys.indexOf('receptions')
                        const tdIdx = pGroup.statistics[recStatIdx].keys.indexOf('receivingTouchdowns')
                        pGroup.statistics[recStatIdx].athletes.forEach((a: any) => {
                            gameRec += parseInt(a.stats[recIdx] || '0')
                            gameTD += parseInt(a.stats[tdIdx] || '0')
                        })
                    }
                    if (rushStatIdx !== -1) {
                        const tdIdx = pGroup.statistics[rushStatIdx].keys.indexOf('rushingTouchdowns')
                        pGroup.statistics[rushStatIdx].athletes.forEach((a: any) => {
                            gameTD += parseInt(a.stats[tdIdx] || '0')
                        })
                    }
                    if (passStatIdx !== -1) {
                        const tdIdx = pGroup.statistics[passStatIdx].keys.indexOf('passingTouchdowns')
                        pGroup.statistics[passStatIdx].athletes.forEach((a: any) => {
                            // Note: Passing TDs are usually counted towards team TDs
                            gameTD += parseInt(a.stats[tdIdx] || '0')
                        })
                    }
                }
            })
            tRec += gameRec
            tTD += gameTD
        })

        const count = summaries.length
        return {
            nfl: {
                touchdowns: parseFloat((tTD / count).toFixed(1)),
                receptions: parseFloat((tRec / count).toFixed(1)),
                interceptions: parseFloat((tInt / count).toFixed(1)),
                yards: {
                    total: parseFloat((tYards / count).toFixed(1)),
                    passing: parseFloat((tPassY / count).toFixed(1)),
                    receiving: parseFloat((tRec > 0 ? tPassY / count : 0).toFixed(1)), // Receiving yards = Passing yards usually
                    rushing: parseFloat((tRushY / count).toFixed(1))
                }
            },
            sampleSize: count
        }
    }

    return { sampleSize: 0 }
}

function createEmptyPeriodBreakdown(): SoccerPeriodBreakdown {
    return {
        over05: 0, over15: 0, over25: 0, over35: 0, over45: 0,
        btts: 0, bttsWin: 0, bttsDraw: 0, bttsOver25: 0, bttsNoOver25: 0,
        failedToScore: 0, cleanSheet: 0, avgGoals: 0,
        teamOver15: 0, oppOver15: 0,
        corners: {
            total: 0, us: 0, them: 0,
            over6: 0, over7: 0, over8: 0, over9: 0, over10: 0, over11: 0, over12: 0, over13: 0,
            teamOver25: 0, teamOver35: 0, teamOver45: 0,
            oppOver25: 0, oppOver35: 0, oppOver45: 0
        }
    }
}

function updatePeriodStats(period: SoccerPeriodBreakdown, myScore: number, opScore: number, totalScore: number, myCorners = 0, opCorners = 0) {
    if (totalScore > 0.5) period.over05++
    if (totalScore > 1.5) period.over15++
    if (totalScore > 2.5) period.over25++
    if (totalScore > 3.5) period.over35++
    if (totalScore > 4.5) period.over45++

    if (myScore > 0 && opScore > 0) period.btts++
    if (myScore > 0 && opScore > 0 && myScore > opScore) period.bttsWin++
    if (myScore > 0 && opScore > 0 && myScore === opScore) period.bttsDraw++
    if (myScore > 0 && opScore > 0 && totalScore > 2.5) period.bttsOver25++
    if (!(myScore > 0 && opScore > 0) && totalScore > 2.5) period.bttsNoOver25++

    if (myScore === 0) period.failedToScore++
    if (opScore === 0) period.cleanSheet++

    if (myScore > 1.5) period.teamOver15++
    if (opScore > 1.5) period.oppOver15++

    period.avgGoals += totalScore

    // Corners
    const totalCorners = myCorners + opCorners
    period.corners.total += totalCorners
    period.corners.us += myCorners
    period.corners.them += opCorners

    if (totalCorners > 6) period.corners.over6++
    if (totalCorners > 7) period.corners.over7++
    if (totalCorners > 8) period.corners.over8++
    if (totalCorners > 9) period.corners.over9++
    if (totalCorners > 10) period.corners.over10++
    if (totalCorners > 11) period.corners.over11++
    if (totalCorners > 12) period.corners.over12++
    if (totalCorners > 13) period.corners.over13++

    if (myCorners > 2.5) period.corners.teamOver25++
    if (myCorners > 3.5) period.corners.teamOver35++
    if (myCorners > 4.5) period.corners.teamOver45++

    if (opCorners > 2.5) period.corners.oppOver25++
    if (opCorners > 3.5) period.corners.oppOver35++
    if (opCorners > 4.5) period.corners.oppOver45++
}

function finalizePeriodStats(period: SoccerPeriodBreakdown, count: number) {
    if (count === 0) return
    period.over05 = Math.round((period.over05 / count) * 100)
    period.over15 = Math.round((period.over15 / count) * 100)
    period.over25 = Math.round((period.over25 / count) * 100)
    period.over35 = Math.round((period.over35 / count) * 100)
    period.over45 = Math.round((period.over45 / count) * 100)
    period.btts = Math.round((period.btts / count) * 100)
    period.bttsWin = Math.round((period.bttsWin / count) * 100)
    period.bttsDraw = Math.round((period.bttsDraw / count) * 100)
    period.bttsOver25 = Math.round((period.bttsOver25 / count) * 100)
    period.bttsNoOver25 = Math.round((period.bttsNoOver25 / count) * 100)
    period.failedToScore = Math.round((period.failedToScore / count) * 100)
    period.cleanSheet = Math.round((period.cleanSheet / count) * 100)
    period.teamOver15 = Math.round((period.teamOver15 / count) * 100)
    period.oppOver15 = Math.round((period.oppOver15 / count) * 100)
    period.avgGoals = parseFloat((period.avgGoals / count).toFixed(2))

    // Finalize Corners
    const c = period.corners
    c.over6 = Math.round((c.over6 / count) * 100)
    c.over7 = Math.round((c.over7 / count) * 100)
    c.over8 = Math.round((c.over8 / count) * 100)
    c.over9 = Math.round((c.over9 / count) * 100)
    c.over10 = Math.round((c.over10 / count) * 100)
    c.over11 = Math.round((c.over11 / count) * 100)
    c.over12 = Math.round((c.over12 / count) * 100)
    c.over13 = Math.round((c.over13 / count) * 100)

    c.teamOver25 = Math.round((c.teamOver25 / count) * 100)
    c.teamOver35 = Math.round((c.teamOver35 / count) * 100)
    c.teamOver45 = Math.round((c.teamOver45 / count) * 100)

    c.oppOver25 = Math.round((c.oppOver25 / count) * 100)
    c.oppOver35 = Math.round((c.oppOver35 / count) * 100)
    c.oppOver45 = Math.round((c.oppOver45 / count) * 100)

    c.total = parseFloat((c.total / count).toFixed(2))
    c.us = parseFloat((c.us / count).toFixed(2))
    c.them = parseFloat((c.them / count).toFixed(2))
}

