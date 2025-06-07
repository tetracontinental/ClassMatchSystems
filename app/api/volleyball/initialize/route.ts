import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// チーム構成
const teams = {
  A: ['1-1,3', '2-1,3', '3-5,6'],
  B: ['1-2,4', '2-5,6', '3-1,3'],
  C: ['1-5,6', '2-2,4', '3-2,4']
}

// チームとクラスのマッピング
const teamClassMapping: { [key: string]: string[] } = {
  '1-1,3': ['1-1', '1-3'],
  '1-2,4': ['1-2', '1-4'],
  '1-5,6': ['1-5', '1-6'],
  '2-1,3': ['2-1', '2-3'],
  '2-2,4': ['2-2', '2-4'],
  '2-5,6': ['2-5', '2-6'],
  '3-1,3': ['3-1', '3-3'],
  '3-2,4': ['3-2', '3-4'],
  '3-5,6': ['3-5', '3-6']
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

    // 既存のデータを削除
    await prisma.volleyballMatch.deleteMany({
      where: { gender }
    })
    await prisma.volleyballRanking.deleteMany({
      where: { gender }
    })

    const matches = []
    let matchNumber = 1

    // 予選リーグの試合を作成
    for (const [league, leagueTeams] of Object.entries(teams)) {
      let leagueMatchNumber = 1
      // 総当たり戦
      for (let i = 0; i < leagueTeams.length; i++) {
        for (let j = i + 1; j < leagueTeams.length; j++) {
          const matchCode = `V${gender === 'men' ? 'M' : 'W'}${league}${leagueMatchNumber}`
          
          matches.push({
            matchCode,
            gender,
            league,
            matchNumber,
            team1: leagueTeams[i],
            team2: leagueTeams[j],
            scheduledTime: new Date().toISOString().slice(0, 16)
          })
          
          matchNumber++
          leagueMatchNumber++
        }
      }
    }

    // 決勝リーグの試合を作成（プレースホルダー）
    const finalTeams = ['A_1位', 'B_1位', 'C_1位', '教職員']
    let finalMatchNumber = 1
    for (let i = 0; i < finalTeams.length; i++) {
      for (let j = i + 1; j < finalTeams.length; j++) {
        const matchCode = `V${gender === 'men' ? 'M' : 'W'}E${finalMatchNumber}`
        
        matches.push({
          matchCode,
          gender,
          league: 'E',
          matchNumber,
          team1: finalTeams[i],
          team2: finalTeams[j],
          scheduledTime: new Date().toISOString().slice(0, 16)
        })
        
        matchNumber++
        finalMatchNumber++
      }
    }

    // データベースに保存
    await prisma.volleyballMatch.createMany({
      data: matches
    })

    // 順位表を初期化
    const rankings = []
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

    // 決勝リーグ用の順位表も作成
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
      message: `${gender === 'men' ? '男子' : '女子'}バレーボール大会を初期化しました`,
      matchesCreated: matches.length,
      rankingsCreated: rankings.length
    })

  } catch (error) {
    console.error('Error initializing volleyball tournament:', error)
    return NextResponse.json(
      { error: 'Failed to initialize tournament' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 