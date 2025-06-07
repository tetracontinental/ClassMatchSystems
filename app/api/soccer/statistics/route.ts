import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // 男子と女子の統計を別々に取得
    const menMatches = await prisma.soccerMatch.findMany({
      where: { gender: 'men' }
    })

    const womenMatches = await prisma.soccerMatch.findMany({
      where: { gender: 'women' }
    })

    const calculateStats = (matches: any[]) => {
      const totalMatches = matches.length
      const completedMatches = matches.filter(m => m.status === 'finished').length
      const inProgressMatches = matches.filter(m => m.status === 'in_progress').length
      const waitingMatches = matches.filter(m => m.status === 'waiting').length

      const totalGoals = matches.reduce((sum, match) => {
        return sum + (match.team1FirstHalf || 0) + (match.team1SecondHalf || 0) + 
               (match.team2FirstHalf || 0) + (match.team2SecondHalf || 0)
      }, 0)

      const averageGoalsPerMatch = completedMatches > 0 ? totalGoals / completedMatches : 0

      // 最高得点試合を見つける
      let highestScoringMatch = null
      let maxGoals = 0

      matches.forEach(match => {
        const matchGoals = (match.team1FirstHalf || 0) + (match.team1SecondHalf || 0) + 
                          (match.team2FirstHalf || 0) + (match.team2SecondHalf || 0)
        if (matchGoals > maxGoals) {
          maxGoals = matchGoals
          highestScoringMatch = {
            matchCode: match.matchCode,
            totalGoals: matchGoals,
            teams: `${match.team1} vs ${match.team2}`
          }
        }
      })

      const pkMatches = matches.filter(m => m.team1PkScore !== null && m.team2PkScore !== null).length

      return {
        totalMatches,
        completedMatches,
        inProgressMatches,
        waitingMatches,
        totalGoals,
        averageGoalsPerMatch: Math.round(averageGoalsPerMatch * 100) / 100,
        highestScoringMatch,
        pkMatches
      }
    }

    const statistics = {
      men: calculateStats(menMatches),
      women: calculateStats(womenMatches),
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching soccer statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}