import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const match = await prisma.tableTennisMatch.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.team1 !== undefined && { team1: data.team1 }),
        ...(data.team2 !== undefined && { team2: data.team2 }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.winner !== undefined && { winner: data.winner }),
        ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.team1Wins !== undefined && { team1Wins: data.team1Wins }),
        ...(data.team2Wins !== undefined && { team2Wins: data.team2Wins }),
        
        // 男子シングルス
        ...(data.menSinglesTeam1Set1 !== undefined && { menSinglesTeam1Set1: data.menSinglesTeam1Set1 }),
        ...(data.menSinglesTeam1Set2 !== undefined && { menSinglesTeam1Set2: data.menSinglesTeam1Set2 }),
        ...(data.menSinglesTeam1Set3 !== undefined && { menSinglesTeam1Set3: data.menSinglesTeam1Set3 }),
        ...(data.menSinglesTeam2Set1 !== undefined && { menSinglesTeam2Set1: data.menSinglesTeam2Set1 }),
        ...(data.menSinglesTeam2Set2 !== undefined && { menSinglesTeam2Set2: data.menSinglesTeam2Set2 }),
        ...(data.menSinglesTeam2Set3 !== undefined && { menSinglesTeam2Set3: data.menSinglesTeam2Set3 }),
        ...(data.menSinglesWinner !== undefined && { menSinglesWinner: data.menSinglesWinner }),
        
        // 女子シングルス
        ...(data.womenSinglesTeam1Set1 !== undefined && { womenSinglesTeam1Set1: data.womenSinglesTeam1Set1 }),
        ...(data.womenSinglesTeam1Set2 !== undefined && { womenSinglesTeam1Set2: data.womenSinglesTeam1Set2 }),
        ...(data.womenSinglesTeam1Set3 !== undefined && { womenSinglesTeam1Set3: data.womenSinglesTeam1Set3 }),
        ...(data.womenSinglesTeam2Set1 !== undefined && { womenSinglesTeam2Set1: data.womenSinglesTeam2Set1 }),
        ...(data.womenSinglesTeam2Set2 !== undefined && { womenSinglesTeam2Set2: data.womenSinglesTeam2Set2 }),
        ...(data.womenSinglesTeam2Set3 !== undefined && { womenSinglesTeam2Set3: data.womenSinglesTeam2Set3 }),
        ...(data.womenSinglesWinner !== undefined && { womenSinglesWinner: data.womenSinglesWinner }),
        
        // 男子ダブルス
        ...(data.menDoublesTeam1Set1 !== undefined && { menDoublesTeam1Set1: data.menDoublesTeam1Set1 }),
        ...(data.menDoublesTeam1Set2 !== undefined && { menDoublesTeam1Set2: data.menDoublesTeam1Set2 }),
        ...(data.menDoublesTeam1Set3 !== undefined && { menDoublesTeam1Set3: data.menDoublesTeam1Set3 }),
        ...(data.menDoublesTeam2Set1 !== undefined && { menDoublesTeam2Set1: data.menDoublesTeam2Set1 }),
        ...(data.menDoublesTeam2Set2 !== undefined && { menDoublesTeam2Set2: data.menDoublesTeam2Set2 }),
        ...(data.menDoublesTeam2Set3 !== undefined && { menDoublesTeam2Set3: data.menDoublesTeam2Set3 }),
        ...(data.menDoublesWinner !== undefined && { menDoublesWinner: data.menDoublesWinner }),
        
        // 女子ダブルス
        ...(data.womenDoublesTeam1Set1 !== undefined && { womenDoublesTeam1Set1: data.womenDoublesTeam1Set1 }),
        ...(data.womenDoublesTeam1Set2 !== undefined && { womenDoublesTeam1Set2: data.womenDoublesTeam1Set2 }),
        ...(data.womenDoublesTeam1Set3 !== undefined && { womenDoublesTeam1Set3: data.womenDoublesTeam1Set3 }),
        ...(data.womenDoublesTeam2Set1 !== undefined && { womenDoublesTeam2Set1: data.womenDoublesTeam2Set1 }),
        ...(data.womenDoublesTeam2Set2 !== undefined && { womenDoublesTeam2Set2: data.womenDoublesTeam2Set2 }),
        ...(data.womenDoublesTeam2Set3 !== undefined && { womenDoublesTeam2Set3: data.womenDoublesTeam2Set3 }),
        ...(data.womenDoublesWinner !== undefined && { womenDoublesWinner: data.womenDoublesWinner }),
        
        // ミックスダブルス
        ...(data.mixedDoublesTeam1Set1 !== undefined && { mixedDoublesTeam1Set1: data.mixedDoublesTeam1Set1 }),
        ...(data.mixedDoublesTeam1Set2 !== undefined && { mixedDoublesTeam1Set2: data.mixedDoublesTeam1Set2 }),
        ...(data.mixedDoublesTeam1Set3 !== undefined && { mixedDoublesTeam1Set3: data.mixedDoublesTeam1Set3 }),
        ...(data.mixedDoublesTeam2Set1 !== undefined && { mixedDoublesTeam2Set1: data.mixedDoublesTeam2Set1 }),
        ...(data.mixedDoublesTeam2Set2 !== undefined && { mixedDoublesTeam2Set2: data.mixedDoublesTeam2Set2 }),
        ...(data.mixedDoublesTeam2Set3 !== undefined && { mixedDoublesTeam2Set3: data.mixedDoublesTeam2Set3 }),
        ...(data.mixedDoublesWinner !== undefined && { mixedDoublesWinner: data.mixedDoublesWinner }),
      }
    })

    // フロントエンド用の形式に変換
    const formattedMatch = {
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
    }

    return NextResponse.json(formattedMatch)

  } catch (error) {
    console.error('Error updating table tennis match:', error)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 