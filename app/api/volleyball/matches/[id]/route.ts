import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // 勝者を自動判定（バレーボールのルール：20点マッチでデュースあり、25点で勝利）
    let winner = data.winner
    if (data.status === 'finished' && !winner) {
      const team1Score = data.team1Score || 0
      const team2Score = data.team2Score || 0
      
      // バレーボールの勝利条件をチェック
      const isTeam1Winner = (team1Score >= 20 && team1Score - team2Score >= 2) || team1Score >= 25
      const isTeam2Winner = (team2Score >= 20 && team2Score - team1Score >= 2) || team2Score >= 25
      
      if (isTeam1Winner && !isTeam2Winner) {
        const currentMatch = await prisma.volleyballMatch.findUnique({ where: { id: parseInt(id) } })
        winner = currentMatch?.team1
      } else if (isTeam2Winner && !isTeam1Winner) {
        const currentMatch = await prisma.volleyballMatch.findUnique({ where: { id: parseInt(id) } })
        winner = currentMatch?.team2
      }
    }

    const match = await prisma.volleyballMatch.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.team1 !== undefined && { team1: data.team1 }),
        ...(data.team2 !== undefined && { team2: data.team2 }),
        ...(data.team1Score !== undefined && { team1Score: data.team1Score }),
        ...(data.team2Score !== undefined && { team2Score: data.team2Score }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        winner,
      }
    })

    // 試合終了時の順位更新処理
    if (winner && data.status === 'finished') {
      await updateRankings(match, winner)
    }

    const formattedMatch = {
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
    }

    return NextResponse.json(formattedMatch)

  } catch (error) {
    console.error('Error updating volleyball match:', error)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 順位更新処理
async function updateRankings(match: any, winner: string) {
  try {
    const loser = winner === match.team1 ? match.team2 : match.team1
    const winnerScore = winner === match.team1 ? match.team1Score : match.team2Score
    const loserScore = winner === match.team1 ? match.team2Score : match.team1Score
    const pointDiff = winnerScore - loserScore

    // 勝者の順位更新
    await prisma.volleyballRanking.upsert({
      where: {
        className_gender_league: {
          className: winner,
          gender: match.gender,
          league: match.league
        }
      },
      update: {
        matches: { increment: 1 },
        wins: { increment: 1 },
        pointDiff: { increment: pointDiff }
      },
      create: {
        className: winner,
        gender: match.gender,
        league: match.league,
        matches: 1,
        wins: 1,
        pointDiff: pointDiff
      }
    })

    // 敗者の順位更新
    await prisma.volleyballRanking.upsert({
      where: {
        className_gender_league: {
          className: loser,
          gender: match.gender,
          league: match.league
        }
      },
      update: {
        matches: { increment: 1 },
        pointDiff: { increment: -pointDiff }
      },
      create: {
        className: loser,
        gender: match.gender,
        league: match.league,
        matches: 1,
        wins: 0,
        pointDiff: -pointDiff
      }
    })

    // 順位を再計算
    await recalculateRankings(match.gender, match.league)

  } catch (error) {
    console.error('Error updating rankings:', error)
  }
}

// 順位再計算
async function recalculateRankings(gender: string, league: string) {
  try {
    const rankings = await prisma.volleyballRanking.findMany({
      where: { gender, league },
      orderBy: [
        { wins: 'desc' },
        { pointDiff: 'desc' }
      ]
    })

    // 順位を更新
    for (let i = 0; i < rankings.length; i++) {
      await prisma.volleyballRanking.update({
        where: { id: rankings[i].id },
        data: { rank: i + 1 }
      })
    }
  } catch (error) {
    console.error('Error recalculating rankings:', error)
  }
} 