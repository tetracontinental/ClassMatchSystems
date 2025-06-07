'use client'

import { useState, useEffect } from 'react'
import { VolleyballMatch, VolleyballRanking } from '@/app/types/volleyball'

interface VolleyballStatistics {
  totalMatches: number
  completedMatches: number
  inProgressMatches: number
  waitingMatches: number
  menMatches: number
  womenMatches: number
  leagueStats: {
    A: { total: number, completed: number }
    B: { total: number, completed: number }
    C: { total: number, completed: number }
    E: { total: number, completed: number }
  }
  highestScore: { score: number, team: string, match: string }
  biggestMargin: { margin: number, match: string, winner: string, loser: string, score: string }
  closeMatches: number
  todayMatches: number
  tournamentProgress: {
    preliminaryComplete: number
    finalComplete: number
  }
  teamWins: Array<{
    team: string
    wins: number
    matches: number
    league: string
    winRate: number
  }>
  lastUpdated: string
}

export default function VolleyballResults() {
  const [menMatches, setMenMatches] = useState<VolleyballMatch[]>([])
  const [womenMatches, setWomenMatches] = useState<VolleyballMatch[]>([])
  const [menRankings, setMenRankings] = useState<VolleyballRanking[]>([])
  const [womenRankings, setWomenRankings] = useState<VolleyballRanking[]>([])
  const [statistics, setStatistics] = useState<VolleyballStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageLoadTime] = useState(new Date())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men')
  const [selectedLeague, setSelectedLeague] = useState<'all' | 'A' | 'B' | 'C' | 'E'>('all')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      
      // 男子試合データ取得
      const menResponse = await fetch('/api/volleyball/matches?gender=men')
      if (menResponse.ok) {
        const menData = await menResponse.json()
        setMenMatches(menData)
      }

      // 女子試合データ取得
      const womenResponse = await fetch('/api/volleyball/matches?gender=women')
      if (womenResponse.ok) {
        const womenData = await womenResponse.json()
        setWomenMatches(womenData)
      }

      // 男子順位データ取得
      const menRankingsResponse = await fetch('/api/volleyball/rankings?gender=men')
      if (menRankingsResponse.ok) {
        const menRankingsData = await menRankingsResponse.json()
        setMenRankings(menRankingsData)
      }

      // 女子順位データ取得
      const womenRankingsResponse = await fetch('/api/volleyball/rankings?gender=women')
      if (womenRankingsResponse.ok) {
        const womenRankingsData = await womenRankingsResponse.json()
        setWomenRankings(womenRankingsData)
      }

      // 統計データ取得（エラーハンドリング付き）
      try {
        const statsResponse = await fetch('/api/volleyball/statistics')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStatistics(statsData)
          if (statsData.lastUpdated) {
            setLastUpdated(new Date(statsData.lastUpdated))
          }
        }
      } catch (statsError) {
        console.log('Statistics not available yet')
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentMatches = () => {
    const matches = selectedGender === 'men' ? menMatches : womenMatches
    if (selectedLeague === 'all') return matches
    return matches.filter(match => match.league === selectedLeague)
  }

  const getCurrentRankings = () => {
    const rankings = selectedGender === 'men' ? menRankings : womenRankings
    if (selectedLeague === 'all') return rankings
    return rankings.filter(ranking => ranking.league === selectedLeague)
  }

  const getTodayMatches = () => {
    const today = new Date().toDateString()
    const allMatches = [...menMatches, ...womenMatches]
    return allMatches
      .filter(match => match.status === 'finished' && match.updatedAt && new Date(match.updatedAt).toDateString() === today)
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return bTime - aTime
      })
  }

  const getMatchStatusDisplay = (match: VolleyballMatch) => {
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

  const getLeagueName = (league: string) => {
    switch (league) {
      case 'A': return 'Aリーグ'
      case 'B': return 'Bリーグ'
      case 'C': return 'Cリーグ'
      case 'E': return '決勝リーグ'
      default: return `${league}リーグ`
    }
  }

  const getLeagueColor = (league: string) => {
    switch (league) {
      case 'A': return 'from-blue-500 to-blue-600'
      case 'B': return 'from-green-500 to-green-600'
      case 'C': return 'from-purple-500 to-purple-600'
      case 'E': return 'from-orange-500 to-orange-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  // リーグ別に試合をグループ化
  const groupedMatches = getCurrentMatches().reduce((groups, match) => {
    const league = match.league
    if (!groups[league]) {
      groups[league] = []
    }
    groups[league].push(match)
    return groups
  }, {} as { [key: string]: VolleyballMatch[] })

  // リーグ別に順位をグループ化
  const groupedRankings = getCurrentRankings().reduce((groups, ranking) => {
    const league = ranking.league
    if (!groups[league]) {
      groups[league] = []
    }
    groups[league].push(ranking)
    return groups
  }, {} as { [key: string]: VolleyballRanking[] })

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
                🏐 バレーボール試合結果
              </h1>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>📅 ページ読み込み: {pageLoadTime.toLocaleString('ja-JP')}</p>
                {lastUpdated && (
                  <p>🔄 最終更新: {lastUpdated.toLocaleString('ja-JP')}</p>
                )}
              </div>
            </div>
            
            {/* 性別・リーグ切り替えタブ */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 性別切り替え */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedGender('men')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedGender === 'men'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  男子
                </button>
                <button
                  onClick={() => setSelectedGender('women')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedGender === 'women'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  女子
                </button>
              </div>

              {/* リーグ切り替え */}
              <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
                {['all', 'A', 'B', 'C', 'E'].map(league => (
                  <button
                    key={league}
                    onClick={() => setSelectedLeague(league as any)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                      selectedLeague === league
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {league === 'all' ? '全て' : getLeagueName(league)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* 大会統計 */}
        {statistics && (
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 大会統計</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{statistics.totalMatches}</div>
                <div className="text-xs md:text-sm text-gray-600">総試合数</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-green-600">{statistics.completedMatches}</div>
                <div className="text-xs md:text-sm text-gray-600">完了試合数</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-orange-600">{statistics.highestScore.score}</div>
                <div className="text-xs md:text-sm text-gray-600">最高得点</div>
                <div className="text-xs text-gray-500">{statistics.highestScore.team}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-purple-600">{statistics.biggestMargin.margin}</div>
                <div className="text-xs md:text-sm text-gray-600">最大得点差</div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-pink-600">{statistics.closeMatches}</div>
                <div className="text-xs md:text-sm text-gray-600">接戦試合</div>
                <div className="text-xs text-gray-500">(5点差以内)</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-indigo-600">{statistics.todayMatches}</div>
                <div className="text-xs md:text-sm text-gray-600">今日の試合</div>
              </div>
            </div>

            {/* 進行状況 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">予選リーグ進行状況</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-blue-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${statistics.tournamentProgress.preliminaryComplete}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-blue-800">
                    {statistics.tournamentProgress.preliminaryComplete}%
                  </span>
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">決勝リーグ進行状況</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-orange-200 rounded-full h-3">
                    <div 
                      className="bg-orange-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${statistics.tournamentProgress.finalComplete}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-orange-800">
                    {statistics.tournamentProgress.finalComplete}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <span className={`text-xs px-2 py-1 rounded text-white ${
                      match.league === 'A' ? 'bg-blue-500' :
                      match.league === 'B' ? 'bg-green-500' :
                      match.league === 'C' ? 'bg-purple-500' :
                      match.league === 'E' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`}>
                      {getLeagueName(match.league)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {match.gender === 'men' ? '男子' : '女子'}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {match.team1} {match.team1Score} - {match.team2Score} {match.team2}
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

        {/* リーグ別試合結果 */}
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([league, leagueMatches]) => (
            <div key={league} className="bg-white rounded-lg shadow-md border overflow-hidden">
              <div className={`p-6 text-center bg-gradient-to-r ${getLeagueColor(league)}`}>
                <h2 className="text-2xl font-bold text-white">
                  {getLeagueName(league)} - {selectedGender === 'men' ? '男子' : '女子'}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid gap-4">
                  {leagueMatches.map(match => {
                    const statusInfo = getMatchStatusDisplay(match)
                    
                    return (
                      <div key={match.id} className={`border rounded-lg p-4 ${
                        match.status === 'finished' ? 'bg-green-50 border-green-200' :
                        match.status === 'in_progress' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div className={`text-center p-3 rounded ${
                            match.winner === match.team1 ? 'bg-green-100 border border-green-200' : 'bg-white'
                          }`}>
                            <div className="font-medium">{match.team1}</div>
                            {match.status !== 'waiting' && (
                              <div className="text-2xl font-bold mt-1">{match.team1Score}</div>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <div className="text-gray-500 font-medium">VS</div>
                            {match.winner && (
                              <div className="text-sm text-green-600 font-medium mt-1">
                                勝者: {match.winner}
                              </div>
                            )}
                          </div>
                          
                          <div className={`text-center p-3 rounded ${
                            match.winner === match.team2 ? 'bg-green-100 border border-green-200' : 'bg-white'
                          }`}>
                            <div className="font-medium">{match.team2}</div>
                            {match.status !== 'waiting' && (
                              <div className="text-2xl font-bold mt-1">{match.team2Score}</div>
                            )}
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

        {/* 順位表 */}
        <div className="space-y-6">
          {Object.entries(groupedRankings).map(([league, leagueRankings]) => (
            <div key={league} className="bg-white rounded-lg shadow-md border overflow-hidden">
              <div className={`p-6 text-center bg-gradient-to-r ${getLeagueColor(league)}`}>
                <h2 className="text-2xl font-bold text-white">
                  {getLeagueName(league)} 順位表 - {selectedGender === 'men' ? '男子' : '女子'}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold">順位</th>
                        <th className="text-left py-3 px-4 font-semibold">クラス</th>
                        <th className="text-center py-3 px-4 font-semibold">試合数</th>
                        <th className="text-center py-3 px-4 font-semibold">勝利数</th>
                        <th className="text-center py-3 px-4 font-semibold">得失点差</th>
                        {league !== 'E' && (
                          <th className="text-center py-3 px-4 font-semibold">勝率</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {leagueRankings
                        .sort((a, b) => {
                          if (b.wins !== a.wins) return b.wins - a.wins
                          return b.pointDiff - a.pointDiff
                        })
                        .map((ranking, index) => (
                          <tr key={ranking.id} className={`border-b border-gray-100 ${
                            index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : ''
                          }`}>
                            <td className="py-3 px-4">
                              <span className={`font-bold ${
                                index === 0 ? 'text-yellow-600' :
                                index === 1 ? 'text-gray-600' :
                                index === 2 ? 'text-orange-600' :
                                'text-gray-800'
                              }`}>
                                {index + 1}位
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium">{ranking.className}</td>
                            <td className="py-3 px-4 text-center">{ranking.matches}</td>
                            <td className="py-3 px-4 text-center font-bold text-green-600">{ranking.wins}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-medium ${
                                ranking.pointDiff > 0 ? 'text-blue-600' :
                                ranking.pointDiff < 0 ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {ranking.pointDiff > 0 ? '+' : ''}{ranking.pointDiff}
                              </span>
                            </td>
                            {league !== 'E' && (
                              <td className="py-3 px-4 text-center">
                                <span className="text-sm font-medium">
                                  {ranking.matches > 0 ? Math.round((ranking.wins / ranking.matches) * 100) : 0}%
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* チーム別勝利数ランキング */}
        {statistics && statistics.teamWins.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 チーム別勝利数ランキング (予選リーグ)</h2>
            <div className="grid gap-3">
              {statistics.teamWins.map((teamStat, index) => (
                <div key={teamStat.team} className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
                  index === 2 ? 'bg-orange-50 border-2 border-orange-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold">{teamStat.team}</div>
                      <div className="text-sm text-gray-600">{teamStat.league}リーグ</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{teamStat.wins}勝</div>
                    <div className="text-sm text-gray-600">
                      {teamStat.matches}試合中 ({teamStat.winRate}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 