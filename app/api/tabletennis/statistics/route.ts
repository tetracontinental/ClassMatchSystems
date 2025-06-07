import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const matches = await prisma.tableTennisMatch.findMany()

    const statistics = {
      totalMatches: matches.length,
      completedMatches: matches.filter(match => match.status === 'finished').length,
      inProgressMatches: matches.filter(match => match.status === 'in_progress').length,
      waitingMatches: matches.filter(match => match.status === 'waiting').length,
      totalGames: matches.reduce((total, match) => total + match.team1Wins + match.team2Wins, 0),
      averageGamesPerMatch: matches.length > 0 
        ? (matches.reduce((total, match) => total + match.team1Wins + match.team2Wins, 0) / matches.length).toFixed(1)
        : 0,
      closestMatch: (() => {
        const finishedMatches = matches.filter(match => match.status === 'finished' && match.team1Wins > 0 && match.team2Wins > 0)
        if (finishedMatches.length === 0) return null
        
        const closest = finishedMatches.reduce((prev, current) => {
          const prevDiff = Math.abs(prev.team1Wins - prev.team2Wins)
          const currentDiff = Math.abs(current.team1Wins - current.team2Wins)
          return currentDiff < prevDiff ? current : prev
        })
        
        return {
          matchCode: closest.matchCode,
          score: `${closest.team1Wins}-${closest.team2Wins}`,
          teams: `${closest.team1} vs ${closest.team2}`
        }
      })(),
      lastUpdated: matches.length > 0 
        ? Math.max(...matches.map(match => new Date(match.updatedAt).getTime()))
        : null
    }

    return NextResponse.json(statistics)

  } catch (error) {
    console.error('Error fetching table tennis statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 