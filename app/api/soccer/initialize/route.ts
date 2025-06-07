import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { gender } = await request.json()

    // 既存のデータを削除
    await prisma.soccerMatch.deleteMany({
      where: { gender }
    })

    // 試合コードプレフィックス
    const prefix = gender === 'men' ? 'ScM' : 'ScW'

    // サッカーの初期試合データを作成
    const matches = [
      // 1回戦
      { matchCode: `${prefix}A1`, round: 1, matchNumber: 1, team1: '3-3', team2: '2-1' },
      { matchCode: `${prefix}B1`, round: 1, matchNumber: 2, team1: '2-6', team2: '1-3' },
      
      // 2回戦
      { matchCode: `${prefix}A2`, round: 2, matchNumber: 3, team1: '3-5', team2: '1-1' },
      { matchCode: `${prefix}A3`, round: 2, matchNumber: 4, team1: '2-3', team2: '1-2' },
      { matchCode: `${prefix}A4`, round: 2, matchNumber: 5, team1: '3-5', team2: '1-1' },
      { matchCode: `${prefix}A5`, round: 2, matchNumber: 6, team1: '2-4', team2: `${prefix}A1勝者` },
      { matchCode: `${prefix}B2`, round: 2, matchNumber: 7, team1: '1-6', team2: '1-5' },
      { matchCode: `${prefix}B3`, round: 2, matchNumber: 8, team1: '3-6', team2: '3-2' },
      { matchCode: `${prefix}B4`, round: 2, matchNumber: 9, team1: '2-2', team2: '3-4' },
      { matchCode: `${prefix}B5`, round: 2, matchNumber: 10, team1: `${prefix}B1勝者`, team2: '1-4' },
      
      // 3回戦
      { matchCode: `${prefix}A6`, round: 3, matchNumber: 11, team1: `${prefix}A4勝者`, team2: `${prefix}A3勝者` },
      { matchCode: `${prefix}A7`, round: 3, matchNumber: 12, team1: `${prefix}A5勝者`, team2: `${prefix}A2勝者` },
      { matchCode: `${prefix}B6`, round: 3, matchNumber: 13, team1: `${prefix}B2勝者`, team2: `${prefix}B3勝者` },
      { matchCode: `${prefix}B7`, round: 3, matchNumber: 14, team1: `${prefix}B4勝者`, team2: `${prefix}B5勝者` },
      
      // 準決勝
      { matchCode: `${prefix}A8`, round: 4, matchNumber: 15, team1: `${prefix}A7勝者`, team2: `${prefix}A6勝者` },
      { matchCode: `${prefix}B8`, round: 4, matchNumber: 16, team1: `${prefix}B6勝者`, team2: `${prefix}B7勝者` },
      
      // 決勝
      { matchCode: `${prefix}A9`, round: 5, matchNumber: 17, team1: `${prefix}A8勝者`, team2: `${prefix}B8勝者` },
      
      // 3位決定戦
      { matchCode: `${prefix}B9`, round: 5, matchNumber: 18, team1: `${prefix}A8敗者`, team2: `${prefix}B8敗者` }
    ]

    // データベースに挿入
    for (const match of matches) {
      await prisma.soccerMatch.create({
        data: {
          matchCode: match.matchCode,
          gender,
          round: match.round,
          matchNumber: match.matchNumber,
          team1: match.team1,
          team2: match.team2,
          team1FirstHalf: 0,
          team1SecondHalf: 0,
          team2FirstHalf: 0,
          team2SecondHalf: 0,
          scheduledTime: new Date().toISOString().slice(0, 16),
          status: 'waiting'
        }
      })
    }

    return NextResponse.json({ message: 'Tournament initialized successfully' })
  } catch (error) {
    console.error('Error initializing soccer tournament:', error)
    return NextResponse.json(
      { error: 'Failed to initialize tournament' },
      { status: 500 }
    )
  }
}