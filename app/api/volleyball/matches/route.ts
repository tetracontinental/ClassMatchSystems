import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const gender = searchParams.get('gender')

    const whereClause = gender ? { gender } : {}

    const matches = await prisma.volleyballMatch.findMany({
      where: whereClause,
      orderBy: [
        { league: 'asc' },
        { matchNumber: 'asc' }
      ]
    })

    // データベースの形式をフロントエンド用に変換
    const formattedMatches = matches.map(match => ({
      id: match.id.toString(),
      matchCode: match.matchCode,
      gender: match.gender,
      league: match.league,
      matchNumber: match.matchNumber,
      team1: match.team1,
      team2: match.team2,
      team1Score: match.team1Score,
      team2Score: match.team2Score,
      winner: match.winner,
      scheduledTime: match.scheduledTime,
      startTime: match.startTime,
      endTime: match.endTime,
      status: match.status,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedMatches)

  } catch (error) {
    console.error('Error fetching volleyball matches:', error)
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

    const match = await prisma.volleyballMatch.create({
      data: {
        matchCode: data.matchCode,
        gender: data.gender,
        league: data.league,
        matchNumber: data.matchNumber,
        team1: data.team1,
        team2: data.team2,
        scheduledTime: data.scheduledTime || new Date().toISOString().slice(0, 16)
      }
    })

    return NextResponse.json({
      id: match.id.toString(),
      matchCode: match.matchCode,
      gender: match.gender,
      league: match.league,
      matchNumber: match.matchNumber,
      team1: match.team1,
      team2: match.team2,
      team1Score: match.team1Score,
      team2Score: match.team2Score,
      winner: match.winner,
      scheduledTime: match.scheduledTime,
      startTime: match.startTime,
      endTime: match.endTime,
      status: match.status,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString()
    })

  } catch (error) {
    console.error('Error creating volleyball match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 