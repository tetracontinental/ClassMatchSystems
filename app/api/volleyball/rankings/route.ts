import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const gender = searchParams.get('gender')
    const league = searchParams.get('league')

    const whereClause: any = {}
    if (gender) whereClause.gender = gender
    if (league) whereClause.league = league

    const rankings = await prisma.volleyballRanking.findMany({
      where: whereClause,
      orderBy: [
        { league: 'asc' },
        { rank: 'asc' },
        { wins: 'desc' },
        { pointDiff: 'desc' }
      ]
    })

    const formattedRankings = rankings.map(ranking => ({
      id: ranking.id.toString(),
      className: ranking.className,
      gender: ranking.gender,
      league: ranking.league,
      matches: ranking.matches,
      wins: ranking.wins,
      pointDiff: ranking.pointDiff,
      rank: ranking.rank,
      createdAt: ranking.createdAt.toISOString(),
      updatedAt: ranking.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedRankings)

  } catch (error) {
    console.error('Error fetching volleyball rankings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { gender } = await request.json()

    if (!gender || !['men', 'women'].includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender parameter' },
        { status: 400 }
      )
    }

    // 既存の順位データを削除
    await prisma.volleyballRanking.deleteMany({
      where: { gender }
    })

    // チーム構成
    const teams = {
      A: ['1-1,3', '2-1,3', '3-5,6'],
      B: ['1-2,4', '2-5,6', '3-1,3'],
      C: ['1-5,6', '2-2,4', '3-2,4']
    }

    const rankings = []
    
    // 予選リーグの順位表を初期化
    for (const [league, leagueTeams] of Object.entries(teams)) {
      for (const team of leagueTeams) {
        rankings.push({
          className: team,
          gender,
          league,
          matches: 0,
          wins: 0,
          pointDiff: 0,
          rank: null
        })
      }
    }

    // 決勝リーグの順位表を初期化
    const finalTeams = ['A_1位', 'B_1位', 'C_1位', '教職員']
    for (const team of finalTeams) {
      rankings.push({
        className: team,
        gender,
        league: 'E',
        matches: 0,
        wins: 0,
        pointDiff: 0,
        rank: null
      })
    }

    await prisma.volleyballRanking.createMany({
      data: rankings
    })

    return NextResponse.json({
      message: `${gender === 'men' ? '男子' : '女子'}バレーボール順位表を初期化しました`,
      rankingsCreated: rankings.length
    })

  } catch (error) {
    console.error('Error initializing volleyball rankings:', error)
    return NextResponse.json(
      { error: 'Failed to initialize rankings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 