'use client'

import { useState, useEffect } from 'react'
import { TableTennisMatch, TableTennisStatistics, TableTennisRanking } from '@/app/types/tabletennis'

export default function TableTennisResults() {
  const [matches, setMatches] = useState<TableTennisMatch[]>([])
  const [statistics, setStatistics] = useState<TableTennisStatistics | null>(null)
  const [rankings, setRankings] = useState<TableTennisRanking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageLoadTime] = useState(new Date())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      
      // 試合データ取得
      const matchesResponse = await fetch('/api/tabletennis/matches')
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        setMatches(matchesData)
      }

      // 統計データ取得
      const statsResponse = await fetch('/api/tabletennis/statistics')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStatistics(statsData)
        if (statsData.lastUpdated) {
          setLastUpdated(new Date(statsData.lastUpdated))
        }
      }

      // 順位データ取得
      const rankingsResponse = await fetch('/api/tabletennis/rankings')
      if (rankingsResponse.ok) {
        const rankingsData = await rankingsResponse.json()
        setRankings(rankingsData)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTodayMatches = () => {
    const today = new Date().toDateString()
    return matches
      .filter(match => match.status === 'finished' && match.updatedAt && new Date(match.updatedAt).toDateString() === today)
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return bTime - aTime
      })
  }

  const getMatchStatusDisplay = (match: TableTennisMatch) => {
    switch (match.status) {
      case 'waiting':
        return {
          text: '開始前',
          color: 'bg-gray-100 text-gray-700',
          time: match.scheduledTime ? `予定: ${match.scheduledTime}` : ''
        }
      case 'in_progress':
        return {
          text: 'LIVE',
          color: 'bg-red-100 text-red-700 animate-pulse',
          time: match.startTime ? `開始: ${match.startTime}` : ''
        }
      case 'finished':
        return {
          text: '試合終了',
          color: 'bg-green-100 text-green-700',
          time: match.endTime ? `終了: ${match.endTime}` : ''
        }
      default:
        return {
          text: '不明',
          color: 'bg-gray-100 text-gray-700',
          time: ''
        }
    }
  }

  const getRoundName = (round: number) => {
    switch (round) {
      case 1: return '1回戦'
      case 2: return '2回戦'
      case 3: return '3回戦'
      case 4: return '準決勝'
      case 5: return '決勝・3位決定戦'
      default: return `${round}回戦`
    }
  }

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case 'menSingles': return '男子シングルス'
      case 'womenSingles': return '女子シングルス'
      case 'menDoubles': return '男子ダブルス'
      case 'womenDoubles': return '女子ダブルス'
      case 'mixedDoubles': return 'ミックスダブルス'
      default: return gameType
    }
  }

  const hasGameResult = (game: any) => {
    return game.set1.team1 > 0 || game.set1.team2 > 0 ||
           game.set2.team1 > 0 || game.set2.team2 > 0 ||
           game.set3.team1 > 0 || game.set3.team2 > 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏓 卓球試合結果
              </h1>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>📅 ページ読み込み: {pageLoadTime.toLocaleString('ja-JP')}</p>
                {lastUpdated && (
                  <p>🔄 最終更新: {lastUpdated.toLocaleString('ja-JP')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* トーナメント表と結果 */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🏆 トーナメント表と結果
          </h2>
          
          <div className="space-y-8">
            {[1, 2, 3, 4, 5].map(round => {
              const roundMatches = matches.filter(match => match.round === round)
              if (roundMatches.length === 0) return null

              return (
                <div key={round} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {getRoundName(round)}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {roundMatches.map(match => {
                      const statusInfo = getMatchStatusDisplay(match)
                      
                      return (
                        <div key={match.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {match.matchCode}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                              {statusInfo.time && (
                                <span className="text-xs text-gray-500">{statusInfo.time}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className={`flex items-center justify-between p-2 rounded ${
                              match.winner === match.team1 ? 'bg-green-100 border border-green-200' : 'bg-white'
                            }`}>
                              <span className="font-medium">{match.team1}</span>
                              <span className="font-bold text-lg">{match.team1Wins}</span>
                            </div>
                            <div className={`flex items-center justify-between p-2 rounded ${
                              match.winner === match.team2 ? 'bg-green-100 border border-green-200' : 'bg-white'
                            }`}>
                              <span className="font-medium">{match.team2}</span>
                              <span className="font-bold text-lg">{match.team2Wins}</span>
                            </div>
                          </div>
                          
                          {match.winner && (
                            <div className="mt-2 text-center">
                              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                🏆 勝者: {match.winner}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 本日の試合結果 */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 本日の試合結果</h2>
          <div className="space-y-3">
            {getTodayMatches().length > 0 ? (
              getTodayMatches().map(match => (
                <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {match.matchCode}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {match.team1} {match.team1Wins} - {match.team2Wins} {match.team2}
                    </div>
                    <div className="text-sm text-gray-600">
                      勝者: {match.winner}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {match.updatedAt && new Date(match.updatedAt).toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">本日の試合結果はありません</p>
            )}
          </div>
        </div>

        {/* 順位表 */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 順位表</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border text-left">順位</th>
                  <th className="px-4 py-2 border text-left">クラス</th>
                  <th className="px-4 py-2 border text-center">状態</th>
                  <th className="px-4 py-2 border text-center">敗退試合</th>
                </tr>
              </thead>
              <tbody>
                {rankings.length > 0 ? (
                  rankings
                    .sort((a, b) => {
                      if (a.rank && b.rank) return a.rank - b.rank
                      if (a.rank && !b.rank) return -1
                      if (!a.rank && b.rank) return 1
                                             return (a.rankText || '').localeCompare(b.rankText || '')
                    })
                    .map((ranking, index) => (
                      <tr key={ranking.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="px-4 py-2 border text-center">
                          {ranking.rank || '-'}
                        </td>
                        <td className="px-4 py-2 border font-medium">
                          {ranking.className}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ranking.rank === 1 
                              ? 'bg-yellow-100 text-yellow-800'
                              : ranking.rank === 2
                              ? 'bg-gray-100 text-gray-800'
                              : ranking.rank === 3
                              ? 'bg-orange-100 text-orange-800'
                              : ranking.eliminatedAt
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ranking.rankText}
                          </span>
                        </td>
                        <td className="px-4 py-2 border text-center text-sm text-gray-600">
                          {ranking.eliminatedAt || '-'}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      順位データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 大会統計 */}
        {statistics && (
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 大会統計</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{statistics.totalMatches}</div>
                <div className="text-sm text-gray-600">総試合数</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{statistics.completedMatches}</div>
                <div className="text-sm text-gray-600">完了試合数</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{statistics.totalGames}</div>
                <div className="text-sm text-gray-600">総ゲーム数</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{statistics.averageGamesPerMatch}</div>
                <div className="text-sm text-gray-600">試合平均ゲーム数</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-3xl font-bold text-indigo-600">{statistics.inProgressMatches}</div>
                <div className="text-sm text-gray-600">試合中</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-600">{statistics.waitingMatches}</div>
                <div className="text-sm text-gray-600">開始前</div>
              </div>
              {statistics.closestMatch && (
                <div className="col-span-2 text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{statistics.closestMatch.score}</div>
                  <div className="text-sm text-gray-600">最接戦</div>
                  <div className="text-xs text-gray-500">{statistics.closestMatch.teams}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 結果詳細 */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 結果詳細</h2>
          
          <div className="space-y-6">
            {matches
              .filter(match => match.status === 'finished')
              .map(match => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-lg bg-blue-100 text-blue-800 px-3 py-2 rounded">
                        {match.matchCode}
                      </span>
                      <span className="text-lg font-semibold">
                        {getRoundName(match.round)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {match.endTime && `終了: ${match.endTime}`}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* チーム1 */}
                    <div className={`p-4 rounded-lg border-2 ${
                      match.winner === match.team1 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold">{match.team1}</h4>
                        {match.winner === match.team1 && (
                          <span className="text-green-600 font-bold">🏆 勝利</span>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{match.team1Wins}</div>
                        <div className="text-sm text-gray-600">勝利ゲーム数</div>
                      </div>
                    </div>
                    
                    {/* チーム2 */}
                    <div className={`p-4 rounded-lg border-2 ${
                      match.winner === match.team2 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold">{match.team2}</h4>
                        {match.winner === match.team2 && (
                          <span className="text-green-600 font-bold">🏆 勝利</span>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{match.team2Wins}</div>
                        <div className="text-sm text-gray-600">勝利ゲーム数</div>
                      </div>
                    </div>
                  </div>

                  {/* ゲーム詳細 */}
                  <div className="mt-6">
                    <h5 className="text-lg font-semibold mb-4">ゲーム詳細</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {['menSingles', 'womenSingles', 'menDoubles', 'womenDoubles', 'mixedDoubles'].map(gameType => {
                        const game = match[gameType as keyof TableTennisMatch] as any
                        if (!hasGameResult(game)) return null
                        
                        return (
                          <div key={gameType} className="bg-white border border-gray-200 rounded p-3">
                            <div className="text-center mb-2">
                              <h6 className="font-medium text-sm">{getGameName(gameType)}</h6>
                              {game.winner && (
                                <div className="text-xs text-green-600 font-medium">
                                  勝者: {game.winner}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>第1セット</span>
                                <span>{game.set1.team1} - {game.set1.team2}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>第2セット</span>
                                <span>{game.set2.team1} - {game.set2.team2}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>第3セット</span>
                                <span>{game.set3.team1} - {game.set3.team2}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* トーナメント表形式 */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🗂️ トーナメント表（全体像）</h2>
          
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* 共通版（デスクトップとモバイル両方） */}
              <div className="grid grid-cols-5 gap-2 lg:gap-4">
                {[1, 2, 3, 4, 5].map(round => (
                  <div key={round} className="space-y-2 lg:space-y-4">
                    <h3 className="text-center font-semibold text-gray-800 border-b pb-2 text-xs lg:text-base">
                      {getRoundName(round)}
                    </h3>
                    {matches
                      .filter(match => match.round === round)
                      .map(match => (
                        <div key={match.id} className="border border-gray-200 rounded p-1 lg:p-2 text-xs lg:text-sm">
                          <div className="text-center text-xs text-gray-500 mb-1">
                            {match.matchCode}
                          </div>
                          <div className={`flex justify-between items-center py-0.5 lg:py-1 px-1 lg:px-2 rounded ${
                            match.winner === match.team1 ? 'bg-green-100' : 'bg-gray-50'
                          }`}>
                            <span className="truncate text-xs lg:text-sm">{match.team1}</span>
                            <span className="font-bold ml-1 lg:ml-2 text-xs lg:text-sm">{match.team1Wins}</span>
                          </div>
                          <div className={`flex justify-between items-center py-0.5 lg:py-1 px-1 lg:px-2 rounded mt-0.5 lg:mt-1 ${
                            match.winner === match.team2 ? 'bg-green-100' : 'bg-gray-50'
                          }`}>
                            <span className="truncate text-xs lg:text-sm">{match.team2}</span>
                            <span className="font-bold ml-1 lg:ml-2 text-xs lg:text-sm">{match.team2Wins}</span>
                          </div>
                          {match.status === 'in_progress' && (
                            <div className="text-center mt-0.5 lg:mt-1">
                              <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">LIVE</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 