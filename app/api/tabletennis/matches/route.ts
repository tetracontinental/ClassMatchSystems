import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const matches = await prisma.tableTennisMatch.findMany({
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' }
      ]
    })

    // データベースの形式をフロントエンド用に変換
    const formattedMatches = matches.map(match => ({
      id: match.id.toString(),
      matchCode: match.matchCode,
      round: match.round,
      matchNumber: match.matchNumber,
      team1: match.team1,
      team2: match.team2,
      menSingles: {
        set1: { team1: match.menSinglesTeam1Set1, team2: match.menSinglesTeam2Set1 },
        set2: { team1: match.menSinglesTeam1Set2, team2: match.menSinglesTeam2Set2 },
        set3: { team1: match.menSinglesTeam1Set3, team2: match.menSinglesTeam2Set3 },
        winner: match.menSinglesWinner
      },
      womenSingles: {
        set1: { team1: match.womenSinglesTeam1Set1, team2: match.womenSinglesTeam2Set1 },
        set2: { team1: match.womenSinglesTeam1Set2, team2: match.womenSinglesTeam2Set2 },
        set3: { team1: match.womenSinglesTeam1Set3, team2: match.womenSinglesTeam2Set3 },
        winner: match.womenSinglesWinner
      },
      menDoubles: {
        set1: { team1: match.menDoublesTeam1Set1, team2: match.menDoublesTeam2Set1 },
        set2: { team1: match.menDoublesTeam1Set2, team2: match.menDoublesTeam2Set2 },
        set3: { team1: match.menDoublesTeam1Set3, team2: match.menDoublesTeam2Set3 },
        winner: match.menDoublesWinner
      },
      womenDoubles: {
        set1: { team1: match.womenDoublesTeam1Set1, team2: match.womenDoublesTeam2Set1 },
        set2: { team1: match.womenDoublesTeam1Set2, team2: match.womenDoublesTeam2Set2 },
        set3: { team1: match.womenDoublesTeam1Set3, team2: match.womenDoublesTeam2Set3 },
        winner: match.womenDoublesWinner
      },
      mixedDoubles: {
        set1: { team1: match.mixedDoublesTeam1Set1, team2: match.mixedDoublesTeam2Set1 },
        set2: { team1: match.mixedDoublesTeam1Set2, team2: match.mixedDoublesTeam2Set2 },
        set3: { team1: match.mixedDoublesTeam1Set3, team2: match.mixedDoublesTeam2Set3 },
        winner: match.mixedDoublesWinner
      },
      team1Wins: match.team1Wins,
      team2Wins: match.team2Wins,
      status: match.status,
      winner: match.winner,
      scheduledTime: match.scheduledTime,
      startTime: match.startTime,
      endTime: match.endTime,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedMatches)

  } catch (error) {
    console.error('Error fetching table tennis matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const match = await prisma.tableTennisMatch.create({
      data: {
        matchCode: data.matchCode,
        round: data.round,
        matchNumber: data.matchNumber,
        team1: data.team1,
        team2: data.team2,
        scheduledTime: data.scheduledTime || new Date().toISOString().slice(0, 16)
      }
    })

    return NextResponse.json(match)

  } catch (error) {
    console.error('Error creating table tennis match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 