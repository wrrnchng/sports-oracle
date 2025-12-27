// Mock data for sports statistics

export type Sport = "football" | "basketball" | "american-football" | "tennis"

export interface Player {
  id: string
  name: string
  team: string
  position: string
  league?: string
  category?: string
  stats: Record<string, number | string>
}

export interface Team {
  id: string
  name: string
  wins: number
  losses: number
  league?: string
  category?: string
  players: Player[]
}

export const footballLeagues = [
  "La Liga (Spain)",
  "Premier League (England)",
  "Bundesliga (Germany)",
  "Serie A (Italy)",
  "Ligue 1 (France)",
  "Eredivisie (Netherlands)",
  "FIFA World Cup",
  "AFCON",
  "UEFA Champions League",
] as const

export const basketballConferences = ["East", "West"] as const

export const americanFootballLeagues = ["NFL", "NCAA"] as const

export const tennisCategories = ["Men's", "Women's", "Doubles"] as const

const footballTeams: Team[] = [
  {
    id: "1",
    name: "Manchester City",
    wins: 24,
    losses: 3,
    league: "Premier League (England)",
    players: [
      {
        id: "p1",
        name: "Erling Haaland",
        team: "Manchester City",
        position: "Forward",
        league: "Premier League (England)",
        stats: { goals: 28, assists: 5, matches: 27 },
      },
      {
        id: "p2",
        name: "Kevin De Bruyne",
        team: "Manchester City",
        position: "Midfielder",
        league: "Premier League (England)",
        stats: { goals: 7, assists: 18, matches: 25 },
      },
    ],
  },
  {
    id: "2",
    name: "Arsenal",
    wins: 23,
    losses: 4,
    league: "Premier League (England)",
    players: [
      {
        id: "p3",
        name: "Bukayo Saka",
        team: "Arsenal",
        position: "Winger",
        league: "Premier League (England)",
        stats: { goals: 14, assists: 10, matches: 28 },
      },
      {
        id: "p4",
        name: "Martin Ødegaard",
        team: "Arsenal",
        position: "Midfielder",
        league: "Premier League (England)",
        stats: { goals: 10, assists: 8, matches: 26 },
      },
    ],
  },
  {
    id: "3",
    name: "Real Madrid",
    wins: 26,
    losses: 2,
    league: "La Liga (Spain)",
    players: [
      {
        id: "p5",
        name: "Jude Bellingham",
        team: "Real Madrid",
        position: "Midfielder",
        league: "La Liga (Spain)",
        stats: { goals: 19, assists: 6, matches: 28 },
      },
      {
        id: "p6",
        name: "Vinícius Júnior",
        team: "Real Madrid",
        position: "Winger",
        league: "La Liga (Spain)",
        stats: { goals: 21, assists: 9, matches: 27 },
      },
    ],
  },
  {
    id: "4",
    name: "Barcelona",
    wins: 24,
    losses: 4,
    league: "La Liga (Spain)",
    players: [
      {
        id: "p7",
        name: "Robert Lewandowski",
        team: "Barcelona",
        position: "Forward",
        league: "La Liga (Spain)",
        stats: { goals: 22, assists: 7, matches: 26 },
      },
      {
        id: "p8",
        name: "Gavi",
        team: "Barcelona",
        position: "Midfielder",
        league: "La Liga (Spain)",
        stats: { goals: 5, assists: 9, matches: 24 },
      },
    ],
  },
  {
    id: "5",
    name: "Bayern Munich",
    wins: 25,
    losses: 3,
    league: "Bundesliga (Germany)",
    players: [
      {
        id: "p9",
        name: "Harry Kane",
        team: "Bayern Munich",
        position: "Forward",
        league: "Bundesliga (Germany)",
        stats: { goals: 32, assists: 8, matches: 28 },
      },
      {
        id: "p10",
        name: "Jamal Musiala",
        team: "Bayern Munich",
        position: "Midfielder",
        league: "Bundesliga (Germany)",
        stats: { goals: 11, assists: 7, matches: 27 },
      },
    ],
  },
  {
    id: "6",
    name: "Inter Milan",
    wins: 27,
    losses: 2,
    league: "Serie A (Italy)",
    players: [
      {
        id: "p11",
        name: "Lautaro Martínez",
        team: "Inter Milan",
        position: "Forward",
        league: "Serie A (Italy)",
        stats: { goals: 24, assists: 5, matches: 29 },
      },
      {
        id: "p12",
        name: "Nicolò Barella",
        team: "Inter Milan",
        position: "Midfielder",
        league: "Serie A (Italy)",
        stats: { goals: 7, assists: 11, matches: 28 },
      },
    ],
  },
  {
    id: "7",
    name: "PSG",
    wins: 26,
    losses: 2,
    league: "Ligue 1 (France)",
    players: [
      {
        id: "p13",
        name: "Kylian Mbappé",
        team: "PSG",
        position: "Forward",
        league: "Ligue 1 (France)",
        stats: { goals: 29, assists: 8, matches: 27 },
      },
      {
        id: "p14",
        name: "Ousmane Dembélé",
        team: "PSG",
        position: "Winger",
        league: "Ligue 1 (France)",
        stats: { goals: 12, assists: 14, matches: 26 },
      },
    ],
  },
]

const basketballTeams: Team[] = [
  {
    id: "8",
    name: "Los Angeles Lakers",
    wins: 38,
    losses: 22,
    league: "West",
    players: [
      {
        id: "p15",
        name: "LeBron James",
        team: "Los Angeles Lakers",
        position: "Forward",
        league: "West",
        stats: { points: 25.5, assists: 7.2, rebounds: 8.1 },
      },
      {
        id: "p16",
        name: "Anthony Davis",
        team: "Los Angeles Lakers",
        position: "Center",
        league: "West",
        stats: { points: 24.3, assists: 3.5, rebounds: 12.2 },
      },
    ],
  },
  {
    id: "9",
    name: "Boston Celtics",
    wins: 48,
    losses: 12,
    league: "East",
    players: [
      {
        id: "p17",
        name: "Jayson Tatum",
        team: "Boston Celtics",
        position: "Forward",
        league: "East",
        stats: { points: 27.8, assists: 4.6, rebounds: 8.9 },
      },
      {
        id: "p18",
        name: "Jaylen Brown",
        team: "Boston Celtics",
        position: "Guard",
        league: "East",
        stats: { points: 23.1, assists: 3.5, rebounds: 5.8 },
      },
    ],
  },
  {
    id: "10",
    name: "Milwaukee Bucks",
    wins: 44,
    losses: 16,
    league: "East",
    players: [
      {
        id: "p19",
        name: "Giannis Antetokounmpo",
        team: "Milwaukee Bucks",
        position: "Forward",
        league: "East",
        stats: { points: 30.4, assists: 6.5, rebounds: 11.5 },
      },
      {
        id: "p20",
        name: "Damian Lillard",
        team: "Milwaukee Bucks",
        position: "Guard",
        league: "East",
        stats: { points: 24.3, assists: 7.0, rebounds: 4.4 },
      },
    ],
  },
  {
    id: "11",
    name: "Denver Nuggets",
    wins: 45,
    losses: 15,
    league: "West",
    players: [
      {
        id: "p21",
        name: "Nikola Jokić",
        team: "Denver Nuggets",
        position: "Center",
        league: "West",
        stats: { points: 26.4, assists: 9.0, rebounds: 12.4 },
      },
      {
        id: "p22",
        name: "Jamal Murray",
        team: "Denver Nuggets",
        position: "Guard",
        league: "West",
        stats: { points: 21.2, assists: 6.5, rebounds: 4.0 },
      },
    ],
  },
]

const americanFootballTeams: Team[] = [
  {
    id: "12",
    name: "Kansas City Chiefs",
    wins: 14,
    losses: 3,
    league: "NFL",
    players: [
      {
        id: "p23",
        name: "Patrick Mahomes",
        team: "Kansas City Chiefs",
        position: "Quarterback",
        league: "NFL",
        stats: { "Pass Yards": 4183, Touchdowns: 27, Interceptions: 14 },
      },
      {
        id: "p24",
        name: "Travis Kelce",
        team: "Kansas City Chiefs",
        position: "Tight End",
        league: "NFL",
        stats: { Receptions: 93, "Rec Yards": 984, Touchdowns: 5 },
      },
    ],
  },
  {
    id: "13",
    name: "San Francisco 49ers",
    wins: 12,
    losses: 5,
    league: "NFL",
    players: [
      {
        id: "p25",
        name: "Brock Purdy",
        team: "San Francisco 49ers",
        position: "Quarterback",
        league: "NFL",
        stats: { "Pass Yards": 4280, Touchdowns: 31, Interceptions: 11 },
      },
      {
        id: "p26",
        name: "Christian McCaffrey",
        team: "San Francisco 49ers",
        position: "Running Back",
        league: "NFL",
        stats: { "Rush Yards": 1459, Touchdowns: 21, Receptions: 67 },
      },
    ],
  },
  {
    id: "14",
    name: "Georgia Bulldogs",
    wins: 11,
    losses: 1,
    league: "NCAA",
    players: [
      {
        id: "p27",
        name: "Carson Beck",
        team: "Georgia Bulldogs",
        position: "Quarterback",
        league: "NCAA",
        stats: { "Pass Yards": 3941, Touchdowns: 28, Interceptions: 12 },
      },
      {
        id: "p28",
        name: "Brock Bowers",
        team: "Georgia Bulldogs",
        position: "Tight End",
        league: "NCAA",
        stats: { Receptions: 56, "Rec Yards": 714, Touchdowns: 6 },
      },
    ],
  },
  {
    id: "15",
    name: "Michigan Wolverines",
    wins: 13,
    losses: 0,
    league: "NCAA",
    players: [
      {
        id: "p29",
        name: "J.J. McCarthy",
        team: "Michigan Wolverines",
        position: "Quarterback",
        league: "NCAA",
        stats: { "Pass Yards": 2991, Touchdowns: 22, Interceptions: 4 },
      },
      {
        id: "p30",
        name: "Blake Corum",
        team: "Michigan Wolverines",
        position: "Running Back",
        league: "NCAA",
        stats: { "Rush Yards": 1245, Touchdowns: 27, Receptions: 15 },
      },
    ],
  },
]

const tennisPlayers: Player[] = [
  {
    id: "p31",
    name: "Novak Djokovic",
    team: "Serbia",
    position: "Singles",
    category: "Men's",
    stats: { Ranking: 1, Titles: 3, "Win Rate": "84%" },
  },
  {
    id: "p32",
    name: "Carlos Alcaraz",
    team: "Spain",
    position: "Singles",
    category: "Men's",
    stats: { Ranking: 2, Titles: 6, "Win Rate": "79%" },
  },
  {
    id: "p33",
    name: "Iga Świątek",
    team: "Poland",
    position: "Singles",
    category: "Women's",
    stats: { Ranking: 1, Titles: 5, "Win Rate": "82%" },
  },
  {
    id: "p34",
    name: "Aryna Sabalenka",
    team: "Belarus",
    position: "Singles",
    category: "Women's",
    stats: { Ranking: 2, Titles: 4, "Win Rate": "76%" },
  },
  {
    id: "p35",
    name: "Coco Gauff",
    team: "USA",
    position: "Singles",
    category: "Women's",
    stats: { Ranking: 3, Titles: 2, "Win Rate": "73%" },
  },
  {
    id: "p36",
    name: "Rajeev Ram / Joe Salisbury",
    team: "USA/UK",
    position: "Doubles",
    category: "Doubles",
    stats: { Ranking: 1, Titles: 2, "Win Rate": "78%" },
  },
]

export const sportsData: Record<Sport, { teams: Team[]; players: Player[] }> = {
  football: { teams: footballTeams, players: footballTeams.flatMap((t) => t.players) },
  basketball: { teams: basketballTeams, players: basketballTeams.flatMap((t) => t.players) },
  "american-football": { teams: americanFootballTeams, players: americanFootballTeams.flatMap((t) => t.players) },
  tennis: { teams: [], players: tennisPlayers },
}

export function searchSportsData(sport: Sport, query: string, filter?: string) {
  const data = sportsData[sport]
  const lowerQuery = query.toLowerCase()

  let teams = data.teams
  let players = data.players

  // Apply filter first
  if (filter && filter !== "all") {
    teams = teams.filter((team) => team.league === filter || team.category === filter)
    players = players.filter((player) => player.league === filter || player.category === filter)
  }

  // Then apply search query
  if (query.trim()) {
    teams = teams.filter((team) => team.name.toLowerCase().includes(lowerQuery))

    players = players.filter(
      (player) =>
        player.name.toLowerCase().includes(lowerQuery) ||
        player.team.toLowerCase().includes(lowerQuery) ||
        player.position.toLowerCase().includes(lowerQuery),
    )
  }

  return { teams, players }
}
