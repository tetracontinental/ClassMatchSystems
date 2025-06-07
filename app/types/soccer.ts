export interface SoccerScore {
  firstHalf: number
  secondHalf: number
}

export interface EditHistory {
  timestamp: string
  type: 'score_change' | 'status_change' | 'time_change' | 'save' | 'penalty_kick'
  description: string
}

export interface SoccerMatch {
  id: string
  matchCode: string
  round: number
  matchNumber: number
  gender: 'men' | 'women'
  team1: string
  team2: string
  scores: {
    team1: SoccerScore
    team2: SoccerScore
  }
  pkScores?: {
    team1: number
    team2: number
  }
  winner: string | null
  scheduledTime: string
  startTime: string
  endTime: string
  status: 'waiting' | 'in_progress' | 'finished'
  isEditing?: boolean
  createdAt: string
  updatedAt: string
}

export interface SoccerStatistics {
  men: {
    totalMatches: number
    completedMatches: number
    inProgressMatches: number
    waitingMatches: number
    totalGoals: number
    averageGoalsPerMatch: number
    highestScoringMatch: {
      matchCode: string
      totalGoals: number
      teams: string
    } | null
    pkMatches: number
  }
  women: {
    totalMatches: number
    completedMatches: number
    inProgressMatches: number
    waitingMatches: number
    totalGoals: number
    averageGoalsPerMatch: number
    highestScoringMatch: {
      matchCode: string
      totalGoals: number
      teams: string
    } | null
    pkMatches: number
  }
  lastUpdated: string | null
}

export interface SoccerRanking {
  id: string
  className: string
  gender: 'men' | 'women'
  rank: number | null
  rankText: string
  eliminatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Match {
  id: string
  round: number
  matchNumber: number
  team1: string
  team2: string
  scores: {
    team1: SoccerScore
    team2: SoccerScore
  }
  winner: string | null
  startTime: string
  endTime: string
  status: 'waiting' | 'in_progress' | 'finished'
  matchCode: string
  isEditing: boolean
  editHistory: EditHistory[]
  needsPenaltyKick: boolean  // PK戦必要フラグ
}

export interface Tournament {
  matches: Match[]
}

export interface SaveLog {
  timestamp: string
  matchCode: string
  action: string
  details: string
} 