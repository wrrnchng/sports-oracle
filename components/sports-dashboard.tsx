"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trophy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateSelector } from "./dashboard/date-selector"
import { ScoreboardGrid } from "./dashboard/scoreboard-grid"
import { NewsSidebar } from "./dashboard/news-sidebar"
import { useScores, type SportType } from "@/hooks/use-scores"
import { formatDateForAPI } from "@/lib/types"
import type { NewsEnabledSport } from "@/hooks/use-news"

import { TeamStatsView } from "./dashboard/team-stats-view"
import { PlayerStatsView } from "./dashboard/player-stats-view"

const sportConfig = {
  // ... existing config
  football: { label: "Football", icon: "⚽", hasNews: false },
  basketball: { label: "Basketball", icon: "🏀", hasNews: true },
  nfl: { label: "NFL", icon: "🏈", hasNews: true },
  ncaaf: { label: "NCAA Football", icon: "🎓", hasNews: true },
} as const

type ValidSportType = keyof typeof sportConfig

export function SportsDashboard() {
  const [activeSport, setActiveSport] = useState<ValidSportType>("basketball")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'matches' | 'stats' | 'players'>('matches')

  const formattedDate = formatDateForAPI(selectedDate)
  // Check if date is today (logic should match date selector)
  const isToday = formattedDate === formatDateForAPI(new Date())

  // Fetch scores with auto-refresh for live games (only for today)
  const { data, isLoading, error, refetch } = useScores({
    sport: activeSport as SportType,
    date: formattedDate,
    autoRefresh: isToday && viewMode === 'matches',
    refreshInterval: 60000,
  })

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const handleSportChange = (sport: string) => {
    setActiveSport(sport as ValidSportType)
  }

  // Check if current sport supports news
  const currentSportConfig = sportConfig[activeSport]
  const showNews = currentSportConfig.hasNews

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="size-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-balance">Sports Oracle</h1>
                <p className="text-sm text-muted-foreground">Live scores and stats from ESPN</p>
              </div>
            </div>
            {isToday && viewMode === 'matches' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeSport} onValueChange={handleSportChange} className="w-full">
          {/* Top Control Bar: Sport Tabs + View Toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <TabsList className="bg-card/50 backdrop-blur-sm h-auto p-1">
              {Object.entries(sportConfig).map(([sport, config]) => (
                <TabsTrigger
                  key={sport}
                  value={sport}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
                >
                  <span>{config.icon}</span>
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* View Mode Toggle */}
            <div className="bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 flex">
              <button
                onClick={() => setViewMode('matches')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'matches' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Matches
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'stats' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Team Stats
              </button>
              <button
                onClick={() => setViewMode('players')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'players' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Player Stats
              </button>
            </div>
          </div>

          {/* Date Selector (Only in Matches View) */}
          {viewMode === 'matches' && (
            <div className="mb-8">
              <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />
            </div>
          )}

          {/* Content for each sport */}
          {Object.keys(sportConfig).map((sport) => (
            <TabsContent key={sport} value={sport} className="space-y-8 mt-0">
              {viewMode === 'matches' ? (
                <div className={showNews ? "grid grid-cols-1 lg:grid-cols-3 gap-8" : ""}>
                  {/* Scores Section */}
                  <div className={showNews ? "lg:col-span-2" : ""}>
                    <ScoreboardGrid
                      data={data}
                      isLoading={isLoading}
                      error={error}
                      sportType={activeSport as SportType}
                    />
                  </div>

                  {/* News Sidebar - only for sports with news */}
                  {showNews && activeSport !== 'football' && (
                    <div className="lg:col-span-1">
                      <div className="sticky top-24">
                        <NewsSidebar
                          sport={activeSport as NewsEnabledSport}
                          limit={5}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : viewMode === 'stats' ? (
                <TeamStatsView sport={activeSport} />
              ) : (
                <PlayerStatsView sport={activeSport} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}
