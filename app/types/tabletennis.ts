export interface TableTennisScore {
  set1: number
  set2: number
  set3: number
}

export interface EditHistory {
  timestamp: string
  action: string
  details: string
}

export interface CategoryMatch {
  scores: {
    team1: TableTennisScore
    team2: TableTennisScore
  }
  setsWon: {
    team1: number
    team2: number
  }
  winner: string | null
}

export interface Match {
  id: string
  round: number
  matchNumber: number
  team1: string
  team2: string
  categories: {
    mens_singles: CategoryMatch
    womens_singles: CategoryMatch
    mens_doubles: CategoryMatch
    womens_doubles: CategoryMatch
    mixed_doubles: CategoryMatch
  }
  categoryWins: {
    team1: number
    team2: number
  }
  winner: string | null
  startTime: string
  endTime: string
  status: 'waiting' | 'in_progress' | 'finished'
  matchCode: string
  isEditing: boolean
  editHistory: EditHistory[]
}

export interface Tournament {
  matches: TableTennisMatch[]
}

export interface SaveLog {
  timestamp: string
  matchCode: string
  action: string
  details: string
}

export interface ClassResult {
  class: string
  wins: number
  categories: {
    mens_singles: number
    womens_singles: number
    mens_doubles: number
    womens_doubles: number
    mixed_doubles: number
  }
}

export interface TableTennisSet {
  team1: number
  team2: number
}

export interface TableTennisGame {
  set1: TableTennisSet
  set2: TableTennisSet
  set3: TableTennisSet
  winner?: string
}

export interface TableTennisMatch {
  id: string
  matchCode: string
  round: number
  matchNumber: number
  team1: string
  team2: string
  menSingles: TableTennisGame
  womenSingles: TableTennisGame
  menDoubles: TableTennisGame
  womenDoubles: TableTennisGame
  mixedDoubles: TableTennisGame
  team1Wins: number
  team2Wins: number
  status: 'waiting' | 'in_progress' | 'finished'
  winner?: string
  scheduledTime: string
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
  isEditing?: boolean
  editHistory?: EditHistory[]
}

export interface TableTennisStatistics {
  totalMatches: number
  completedMatches: number
  inProgressMatches: number
  waitingMatches: number
  totalGames: number
  averageGamesPerMatch: number
  closestMatch: {
    matchCode: string
    score: string
    teams: string
  } | null
  lastUpdated: number | null
}

export interface TableTennisRanking {
  id: string
  className: string
  rank: number | null
  rankText: string | null
  eliminatedAt: string | null
  createdAt: string
  updatedAt: string
} 