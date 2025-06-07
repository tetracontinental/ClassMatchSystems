import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 勝ち上がり先のマッピング
const getNextMatchInfo = (matchCode: string) => {
  const prefix = matchCode.substring(0, 3) // ScM or ScW
  const code = matchCode.substring(3) // A1, B1, etc.
  
  const nextMatches: Record<string, { nextMatch: string; position: 'team1' | 'team2' }> = {
    'A1': { nextMatch: `${prefix}A5`, position: 'team2' },
    'B1': { nextMatch: `${prefix}B5`, position: 'team1' },
    'A2': { nextMatch: `${prefix}A7`, position: 'team2' },
    'A3': { nextMatch: `${prefix}A6`, position: 'team2' },
    'A4': { nextMatch: `${prefix}A6`, position: 'team1' },
    'A5': { nextMatch: `${prefix}A7`, position: 'team1' },
    'B2': { nextMatch: `${prefix}B6`, position: 'team1' },
    'B3': { nextMatch: `${prefix}B6`, position: 'team2' },
    'B4': { nextMatch: `${prefix}B7`, position: 'team1' },
    'B5': { nextMatch: `${prefix}B7`, position: 'team2' },
    'A6': { nextMatch: `${prefix}A8`, position: 'team2' },
    'A7': { nextMatch: `${prefix}A8`, position: 'team1' },
    'B6': { nextMatch: `${prefix}B8`, position: 'team1' },
    'B7': { nextMatch: `${prefix}B8`, position: 'team2' },
    'A8': { nextMatch: `${prefix}A9`, position: 'team1' },
    'B8': { nextMatch: `${prefix}A9`, position: 'team2' }
  }
  
  return nextMatches[code]
}

// 敗者の勝ち上がり先（3位決定戦用）
const getLoserNextMatch = (matchCode: string) => {
  const prefix = matchCode.substring(0, 3)
  const code = matchCode.substring(3)
  
  if (code === 'A8' || code === 'B8') {
    return { nextMatch: `${prefix}B9`, position: code === 'A8' ? 'team1' : 'team2' }
  }
  return null
}

// 勝者を次の試合に進出させる
const updateNextMatch = async (currentMatch: any, winner: string, loser?: string) => {
  const nextMatchInfo = getNextMatchInfo(currentMatch.matchCode)
  
  if (nextMatchInfo) {
    const updateData: any = {}
    updateData[nextMatchInfo.position] = winner
    
    await prisma.soccerMatch.updateMany({
      where: { matchCode: nextMatchInfo.nextMatch },
      data: updateData
    })
  }
  
  // 3位決定戦への敗者進出処理
  if (loser) {
    const loserNextInfo = getLoserNextMatch(currentMatch.matchCode)
    if (loserNextInfo) {
      const updateData: any = {}
      updateData[loserNextInfo.position] = loser
      
      await prisma.soccerMatch.updateMany({
        where: { matchCode: loserNextInfo.nextMatch },
        data: updateData
      })
    }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // 勝者を自動判定
    let winner = data.winner
    if (data.status === 'finished' && !winner) {
      const team1Total = (data.team1FirstHalf || 0) + (data.team1SecondHalf || 0)
      const team2Total = (data.team2FirstHalf || 0) + (data.team2SecondHalf || 0)
      
      if (team1Total !== team2Total) {
        const currentMatch = await prisma.soccerMatch.findUnique({ where: { id: parseInt(id) } })
        winner = team1Total > team2Total ? currentMatch?.team1 : currentMatch?.team2
      } else if (data.team1PkScore !== undefined && data.team2PkScore !== undefined) {
        const currentMatch = await prisma.soccerMatch.findUnique({ where: { id: parseInt(id) } })
        winner = data.team1PkScore > data.team2PkScore ? currentMatch?.team1 : currentMatch?.team2
      }
    }

    const match = await prisma.soccerMatch.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.team1 !== undefined && { team1: data.team1 }),
        ...(data.team2 !== undefined && { team2: data.team2 }),
        ...(data.team1FirstHalf !== undefined && { team1FirstHalf: data.team1FirstHalf }),
        ...(data.team1SecondHalf !== undefined && { team1SecondHalf: data.team1SecondHalf }),
        ...(data.team2FirstHalf !== undefined && { team2FirstHalf: data.team2FirstHalf }),
        ...(data.team2SecondHalf !== undefined && { team2SecondHalf: data.team2SecondHalf }),
        ...(data.team1PkScore !== undefined && { team1PkScore: data.team1PkScore }),
        ...(data.team2PkScore !== undefined && { team2PkScore: data.team2PkScore }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        winner,
        team1Total: (data.team1FirstHalf || 0) + (data.team1SecondHalf || 0),
        team2Total: (data.team2FirstHalf || 0) + (data.team2SecondHalf || 0),
      }
    })

    // 試合終了時の勝ち上がり処理
    if (winner && data.status === 'finished') {
      const loser = winner === match.team1 ? match.team2 : match.team1
      await updateNextMatch(match, winner, loser)
    }

    const formattedMatch = {
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
    }

    return NextResponse.json(formattedMatch)

  } catch (error) {
    console.error('Error updating soccer match:', error)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 