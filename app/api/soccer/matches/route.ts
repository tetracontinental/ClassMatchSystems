import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const gender = searchParams.get('gender')

    const whereClause = gender ? { gender } : {}

    const matches = await prisma.soccerMatch.findMany({
      where: whereClause,
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
      gender: match.gender,
      team1: match.team1,
      team2: match.team2,
      scores: {
        team1: {
          firstHalf: match.team1FirstHalf,
          secondHalf: match.team1SecondHalf
        },
        team2: {
          firstHalf: match.team2FirstHalf,
          secondHalf: match.team2SecondHalf
        }
      },
      pkScores: match.team1PkScore !== null && match.team2PkScore !== null ? {
        team1: match.team1PkScore,
        team2: match.team2PkScore
      } : undefined,
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
    console.error('Error fetching soccer matches:', error)
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

    const match = await prisma.soccerMatch.create({
      data: {
        matchCode: data.matchCode,
        gender: data.gender,
        round: data.round,
        matchNumber: data.matchNumber,
        team1: data.team1,
        team2: data.team2,
        scheduledTime: data.scheduledTime || new Date().toISOString().slice(0, 16)
      }
    })

    return NextResponse.json({
      id: match.id.toString(),
      matchCode: match.matchCode,
      round: match.round,
      matchNumber: match.matchNumber,
      gender: match.gender,
      team1: match.team1,
      team2: match.team2,
      scores: {
        team1: {
          firstHalf: match.team1FirstHalf,
          secondHalf: match.team1SecondHalf
        },
        team2: {
          firstHalf: match.team2FirstHalf,
          secondHalf: match.team2SecondHalf
        }
      },
      winner: match.winner,
      scheduledTime: match.scheduledTime,
      startTime: match.startTime,
      endTime: match.endTime,
      status: match.status,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString()
    })

  } catch (error) {
    console.error('Error creating soccer match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 