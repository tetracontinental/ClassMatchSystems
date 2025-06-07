import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // 全試合データを取得
    const matches = await prisma.softballMatch.findMany()

    // 基本統計
    const totalMatches = matches.length
    const completedMatches = matches.filter(match => match.status === 'finished').length
    const inProgressMatches = matches.filter(match => match.status === 'in_progress').length
    const waitingMatches = matches.filter(match => match.status === 'waiting').length

    // 最高得点の計算
    let highestScore = { score: 0, team: '', matchCode: '' }
    let totalScore = 0
    let scoreCount = 0

    matches.forEach(match => {
      if (match.team1Total > highestScore.score) {
        highestScore = {
          score: match.team1Total,
          team: match.team1,
          matchCode: match.matchCode
        }
      }
      if (match.team2Total > highestScore.score) {
        highestScore = {
          score: match.team2Total,
          team: match.team2,
          matchCode: match.matchCode
        }
      }

      if (match.status === 'finished') {
        totalScore += match.team1Total + match.team2Total
        scoreCount += 2
      }
    })

    // 平均得点
    const averageScore = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : 0

    // 延長戦の回数（7回以降にスコアがある試合）
    const extensionMatches = matches.filter(match => {
      if (match.status !== 'finished') return false
      
      try {
        const team1Scores = JSON.parse(match.team1Scores)
        const team2Scores = JSON.parse(match.team2Scores)
        
        // 5回目以降（インデックス4以降）にスコアがあるかチェック
        for (let i = 4; i < team1Scores.length; i++) {
          if (team1Scores[i] > 0 || team2Scores[i] > 0) {
            return true
          }
        }
        return false
      } catch {
        return false
      }
    }).length

    // じゃんけん決着の回数
    const jankenMatches = matches.filter(match => match.isJankenNeeded && match.jankenWinner).length

    // 最終更新日時
    const lastUpdated = matches.length > 0 
      ? matches.reduce((latest, match) => 
          new Date(match.updatedAt) > new Date(latest) ? match.updatedAt : latest
        , matches[0].updatedAt)
      : null

    const statistics = {
      totalMatches,
      completedMatches,
      inProgressMatches,
      waitingMatches,
      highestScore,
      averageScore,
      extensionMatches,
      jankenMatches,
      lastUpdated
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching softball statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
} 