export interface VolleyballMatch {
  id: string
  matchCode: string
  gender: 'men' | 'women'
  league: 'A' | 'B' | 'C' | 'E'
  matchNumber: number
  team1: string
  team2: string
  team1Score: number
  team2Score: number
  winner: string | null
  scheduledTime: string
  startTime: string
  endTime: string
  status: 'waiting' | 'in_progress' | 'finished'
  isEditing?: boolean
  createdAt: string
  updatedAt: string
}

export interface VolleyballRanking {
  id: string
  className: string
  gender: 'men' | 'women'
  league: 'A' | 'B' | 'C' | 'E'
  matches: number
  wins: number
  pointDiff: number
  rank: number | null
  createdAt: string
  updatedAt: string
}

export interface VolleyballStatistics {
  men: {
    totalMatches: number
    completedMatches: number
    inProgressMatches: number
    waitingMatches: number
    totalPoints: number
    averagePointsPerMatch: number
    highestScoringMatch: {
      matchCode: string
      totalPoints: number
      teams: string
    } | null
  }
  women: {
    totalMatches: number
    completedMatches: number
    inProgressMatches: number
    waitingMatches: number
    totalPoints: number
    averagePointsPerMatch: number
    highestScoringMatch: {
      matchCode: string
      totalPoints: number
      teams: string
    } | null
  }
  lastUpdated: string | null
}

export interface SaveLog {
  timestamp: string
  matchCode: string
  action: string
  details: string
}

export interface MatchChanges {
  [matchId: string]: {
    [key: string]: any
  }
}

// チーム情報（クラス合同チーム）
export interface VolleyballTeam {
  name: string // "1-1,3" など
  classes: string[] // ["1-1", "1-3"] など
}

// リーグ構成
export interface LeagueConfig {
  A: VolleyballTeam[]
  B: VolleyballTeam[]
  C: VolleyballTeam[]
  E: VolleyballTeam[] // 決勝リーグ
} 