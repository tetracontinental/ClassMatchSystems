export interface SoftballScore {
  innings: number[]  // [1回, 2回, 3回, 4回, 延長1回, 延長2回, 延長3回]
}

export interface EditHistory {
  timestamp: string
  type: 'score_change' | 'status_change' | 'time_change' | 'save' | 'janken'
  description: string
}

export interface SoftballMatch {
  id: string
  matchCode: string
  round: number
  matchNumber: number
  team1: string
  team2: string
  scores: {
    team1: SoftballScore
    team2: SoftballScore
  }
  winner: string | null
  scheduledTime: string
  startTime: string
  endTime: string
  status: 'waiting' | 'in_progress' | 'finished'
  isJankenNeeded: boolean
  jankenWinner: string | null
  isEditing: boolean
  editHistory: EditHistory[]
  createdAt: string
  updatedAt: string
  isHomeFirst: boolean  // 先行後攻の順序（trueの場合、team2が先攻、team1が後攻）
}

export interface Tournament {
  matches: SoftballMatch[]
}

export interface SaveLog {
  timestamp: string
  matchCode: string
  action: string
  details: string
}

export interface JankenChoice {
  team: 'team1' | 'team2'
  choice: 'rock' | 'paper' | 'scissors'
}

export interface JankenResult {
  team1Choice: 'rock' | 'paper' | 'scissors'
  team2Choice: 'rock' | 'paper' | 'scissors'
  winner: 'team1' | 'team2' | 'draw'
}

export interface SoftballStatistics {
  totalMatches: number
  completedMatches: number
  inProgressMatches: number
  waitingMatches: number
  highestScore: {
    score: number
    team: string
    matchCode: string
  }
  averageScore: number
  extensionMatches: number
  jankenMatches: number
  lastUpdated: string | null
}

export interface SoftballRanking {
  id: string
  className: string
  rank: number | null
  rankText: string
  eliminatedAt: string | null
  createdAt: string
  updatedAt: string
} 