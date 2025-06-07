import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 全ての試合データを取得
    const allMatches = await (prisma as any).volleyballMatch.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    // 全ての順位データを取得
    const allRankings = await (prisma as any).volleyballRanking.findMany()

    // 統計情報を計算
    const stats = {
      // 基本統計
      totalMatches: allMatches.length,
      completedMatches: allMatches.filter((m: any) => m.status === 'finished').length,
      inProgressMatches: allMatches.filter((m: any) => m.status === 'in_progress').length,
      waitingMatches: allMatches.filter((m: any) => m.status === 'waiting').length,

      // 性別・リーグ別統計
      menMatches: allMatches.filter((m: any) => m.gender === 'men').length,
      womenMatches: allMatches.filter((m: any) => m.gender === 'women').length,
      
      // リーグ別統計
      leagueStats: {
        A: {
          total: allMatches.filter((m: any) => m.league === 'A').length,
          completed: allMatches.filter((m: any) => m.league === 'A' && m.status === 'finished').length
        },
        B: {
          total: allMatches.filter((m: any) => m.league === 'B').length,
          completed: allMatches.filter((m: any) => m.league === 'B' && m.status === 'finished').length
        },
        C: {
          total: allMatches.filter((m: any) => m.league === 'C').length,
          completed: allMatches.filter((m: any) => m.league === 'C' && m.status === 'finished').length
        },
        E: {
          total: allMatches.filter((m: any) => m.league === 'E').length,
          completed: allMatches.filter((m: any) => m.league === 'E' && m.status === 'finished').length
        }
      },

      // スコア統計
      highestScore: (() => {
        const completedMatches = allMatches.filter((m: any) => m.status === 'finished')
        let highest = { score: 0, team: '', match: '' }
        
        completedMatches.forEach((match: any) => {
          if (match.team1Score > highest.score) {
            highest = { 
              score: match.team1Score, 
              team: match.team1, 
              match: `${match.matchCode} vs ${match.team2}` 
            }
          }
          if (match.team2Score > highest.score) {
            highest = { 
              score: match.team2Score, 
              team: match.team2, 
              match: `${match.matchCode} vs ${match.team1}` 
            }
          }
        })
        
        return highest
      })(),

      // 最大得点差
      biggestMargin: (() => {
        const completedMatches = allMatches.filter((m: any) => m.status === 'finished')
        let biggest = { margin: 0, match: '', winner: '', loser: '', score: '' }
        
        completedMatches.forEach((match: any) => {
          const margin = Math.abs(match.team1Score - match.team2Score)
          if (margin > biggest.margin) {
            const isTeam1Winner = match.team1Score > match.team2Score
            biggest = {
              margin,
              match: match.matchCode,
              winner: isTeam1Winner ? match.team1 : match.team2,
              loser: isTeam1Winner ? match.team2 : match.team1,
              score: `${match.team1Score}-${match.team2Score}`
            }
          }
        })
        
        return biggest
      })(),

      // 接戦試合（点差5点以内）
      closeMatches: allMatches.filter((m: any) => 
        m.status === 'finished' && Math.abs(m.team1Score - m.team2Score) <= 5
      ).length,

      // 今日の試合結果
      todayMatches: allMatches.filter((m: any) => {
        const today = new Date().toDateString()
        return m.status === 'finished' && m.updatedAt && new Date(m.updatedAt).toDateString() === today
      }).length,

      // 進行状況
      tournamentProgress: {
        preliminaryComplete: (() => {
          const preliminaryMatches = allMatches.filter((m: any) => ['A', 'B', 'C'].includes(m.league))
          const completedPreliminary = preliminaryMatches.filter((m: any) => m.status === 'finished')
          return preliminaryMatches.length > 0 ? Math.round((completedPreliminary.length / preliminaryMatches.length) * 100) : 0
        })(),
        finalComplete: (() => {
          const finalMatches = allMatches.filter((m: any) => m.league === 'E')
          const completedFinal = finalMatches.filter((m: any) => m.status === 'finished')
          return finalMatches.length > 0 ? Math.round((completedFinal.length / finalMatches.length) * 100) : 0
        })()
      },

      // チーム別勝利数ランキング（決勝リーグ以外）
      teamWins: (() => {
        const teamStats: { [key: string]: { wins: number, matches: number, league: string } } = {}
        
        allRankings.forEach((ranking: any) => {
          if (ranking.league !== 'E') {
            teamStats[ranking.className] = {
              wins: ranking.wins,
              matches: ranking.matches,
              league: ranking.league
            }
          }
        })
        
        return Object.entries(teamStats)
          .sort((a, b) => b[1].wins - a[1].wins)
          .slice(0, 5)
          .map(([team, stats]) => ({
            team,
            wins: stats.wins,
            matches: stats.matches,
            league: stats.league,
            winRate: stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0
          }))
      })(),

      // 最終更新時刻
      lastUpdated: allMatches.length > 0 ? allMatches[0].updatedAt : new Date().toISOString()
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching volleyball statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
} 