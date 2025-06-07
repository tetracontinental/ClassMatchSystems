'use client'

import { useState, useEffect } from 'react'
import { SoccerMatch } from '@/app/types/soccer'

interface SaveLog {
  timestamp: string
  matchCode: string
  action: string
  details: string
}

interface MatchChanges {
  [matchId: string]: {
    [key: string]: any
  }
}

interface Ranking {
  id: string
  className: string
  gender: 'men' | 'women'
  rank: number | null
  rankText: string
  eliminatedAt: string | null
}

export default function SoccerEdit() {
  const [matches, setMatches] = useState<SoccerMatch[]>([])
  const [saveLogs, setSaveLogs] = useState<SaveLog[]>([])
  const [showSaveMessage, setShowSaveMessage] = useState(false)
  const [showPkModal, setShowPkModal] = useState(false)
  const [currentPkMatch, setCurrentPkMatch] = useState<SoccerMatch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men')
  const [pendingChanges, setPendingChanges] = useState<MatchChanges>({})
  const [isSaving, setIsSaving] = useState(false)
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [showRankings, setShowRankings] = useState(false)

  useEffect(() => {
    fetchMatches()
    loadRankings()
  }, [selectedGender])

  const fetchMatches = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/soccer/matches?gender=${selectedGender}`)
      if (response.ok) {
        const data = await response.json()
        setMatches(data)
      } else {
        await initializeTournament()
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
      await initializeTournament()
    } finally {
      setIsLoading(false)
    }
  }

  const initializeTournament = async () => {
    if (!confirm('トーナメントをリセットしますか？すべてのデータが削除されます。')) {
      return
    }

    try {
      const response = await fetch('/api/soccer/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: selectedGender })
      })
      if (response.ok) {
        await fetchMatches()
        setSaveLogs([])
        setShowSaveMessage(false)
        setPendingChanges({})
        addSaveLog('SYSTEM', 'トーナメントリセット', `${selectedGender === 'men' ? '男子' : '女子'}トーナメントを初期化しました`)
        // 順位も初期化
        await initializeRankings()
      } else {
        alert('リセットに失敗しました。もう一度お試しください。')
      }
    } catch (error) {
      console.error('Error initializing tournament:', error)
      alert('リセット中にエラーが発生しました。')
    }
  }

  const loadRankings = async () => {
    try {
      console.log('📊 順位データ読み込み開始:', selectedGender)
      const response = await fetch(`/api/soccer/rankings?gender=${selectedGender}`)
      console.log('📨 順位API応答:', response.status, response.ok)
      
      if (response.ok) {
        const rankingsData = await response.json()
        console.log('✅ 取得した順位データ:', rankingsData?.length, '件')
        console.log('📋 順位データ詳細:', rankingsData)
        setRankings(rankingsData)
      } else {
        const errorText = await response.text()
        console.error('❌ 順位API エラー:', errorText)
        // 順位データが存在しない場合は初期化
        console.log('🔄 順位データを初期化します')
        await initializeRankings()
      }
    } catch (error) {
      console.error('❌ 順位データ読み込みエラー:', error)
      // エラーが発生した場合も初期化を試行
      try {
        await initializeRankings()
      } catch (initError) {
        console.error('❌ 順位初期化もエラー:', initError)
      }
    }
  }

  const initializeRankings = async () => {
    try {
      console.log('🔄 順位初期化開始:', selectedGender)
      const response = await fetch('/api/soccer/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: selectedGender })
      })
      console.log('📨 順位初期化API応答:', response.status, response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ 順位初期化成功:', result)
        await loadRankings()
      } else {
        const errorText = await response.text()
        console.error('❌ 順位初期化エラー:', errorText)
      }
    } catch (error) {
      console.error('❌ 順位初期化エラー:', error)
    }
  }

  // スコア変更（自動保存なし）
  const handleScoreChange = (
    matchId: string,
    team: 'team1' | 'team2',
    half: 'firstHalf' | 'secondHalf',
    value: string
  ) => {
    const score = parseInt(value) || 0
    const field = `${team}${half.charAt(0).toUpperCase() + half.slice(1)}`
    
    setPendingChanges(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: score
      }
    }))

    // ローカル状態も更新して即座に反映
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          scores: {
            ...m.scores,
            [team]: {
              ...m.scores?.[team],
              [half]: score
            }
          }
        }
      }
      return m
    }))
  }

  // 試合予定時刻変更
  const handleScheduledTimeChange = (matchId: string, time: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        scheduledTime: time
      }
    }))

    setMatches(prev => prev.map(m => 
      m.id === matchId ? { ...m, scheduledTime: time } : m
    ))
  }

  // 保存ボタン
  const saveMatch = async (matchId: string) => {
    if (!pendingChanges[matchId]) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/soccer/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingChanges[matchId])
      })

      if (response.ok) {
        const updatedMatch = await response.json()
        setMatches(prev => prev.map(m => 
          m.id === matchId ? updatedMatch : m
        ))
        
        // 変更をクリア
        setPendingChanges(prev => {
          const newChanges = { ...prev }
          delete newChanges[matchId]
          return newChanges
        })

        addSaveLog(updatedMatch.matchCode, 'データ保存', '手動保存完了')
      }
    } catch (error) {
      console.error('Error saving match:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 試合状態の更新（バスケットボールの実装を参考に改善）
  const handleMatchStatus = async (matchId: string, newStatus: 'waiting' | 'in_progress' | 'finished') => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return

    try {
      const currentTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      
      let updateData: any = { status: newStatus }
      
      if (newStatus === 'in_progress') {
        updateData.startTime = currentTime
      } else if (newStatus === 'finished') {
        updateData.endTime = currentTime
        
        const team1Total = (match.scores?.team1?.firstHalf || 0) + (match.scores?.team1?.secondHalf || 0)
        const team2Total = (match.scores?.team2?.firstHalf || 0) + (match.scores?.team2?.secondHalf || 0)

        // 同点の場合はPK戦が必要
        if (team1Total === team2Total) {
          setCurrentPkMatch(match)
          setShowPkModal(true)
          return // PK戦の結果を待つため、ここで処理を中断
        } else {
          // 勝者を決定
          updateData.winner = team1Total > team2Total ? match.team1 : match.team2
        }
      }

      const response = await fetch(`/api/soccer/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedMatch = await response.json()
        setMatches(prev => prev.map(m => 
          m.id === matchId ? updatedMatch : m
        ))
        
        if (newStatus === 'in_progress') {
          addSaveLog(updatedMatch.matchCode, '試合開始', `${updatedMatch.team1} vs ${updatedMatch.team2}`)
        } else if (newStatus === 'finished') {
          addSaveLog(updatedMatch.matchCode, '試合終了', `勝者: ${updatedMatch.winner}`)
          // 順位処理を実行
          if (updatedMatch.winner) {
            await processMatchRankings(updatedMatch, updatedMatch.winner)
          }
          // 次の試合の更新のために少し遅れてデータを再取得
          setTimeout(() => fetchMatches(), 1000)
        }
      }
    } catch (error) {
      console.error('Error updating match status:', error)
      alert('試合状態の更新に失敗しました。もう一度お試しください。')
    }
  }

  const savePkResult = async (team1PkScore: number, team2PkScore: number) => {
    if (!currentPkMatch) return

    try {
      const currentTime = new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })

      const response = await fetch(`/api/soccer/matches/${currentPkMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'finished',
          endTime: currentTime,
          team1PkScore,
          team2PkScore
        })
      })

      if (response.ok) {
        const updatedMatch = await response.json()
        setMatches(prev => prev.map(m => 
          m.id === currentPkMatch.id ? updatedMatch : m
        ))
        addSaveLog(updatedMatch.matchCode, 'PK戦終了', `勝者: ${updatedMatch.winner}`)
        // 順位処理を実行
        if (updatedMatch.winner) {
          await processMatchRankings(updatedMatch, updatedMatch.winner)
        }
        setShowPkModal(false)
        setCurrentPkMatch(null)
        
        // 次の試合も更新するために全データを再取得
        setTimeout(() => fetchMatches(), 1000)
      }
    } catch (error) {
      console.error('Error saving PK result:', error)
    }
  }

  const addSaveLog = (matchCode: string, action: string, details: string) => {
    const newLog: SaveLog = {
      timestamp: new Date().toISOString(),
      matchCode,
      action,
      details
    }
    setSaveLogs(prev => [newLog, ...prev].slice(0, 10))
    setShowSaveMessage(true)
    setTimeout(() => setShowSaveMessage(false), 3000)
  }

  const calculateTotal = (scores: any): number => {
    return (scores?.firstHalf || 0) + (scores?.secondHalf || 0)
  }

  const getWinnerTeam = (match: SoccerMatch): 'team1' | 'team2' | null => {
    if (match.winner) {
      return match.winner === match.team1 ? 'team1' : 'team2'
    }
    return null
  }

  const hasPendingChanges = (matchId: string): boolean => {
    return !!pendingChanges[matchId] && Object.keys(pendingChanges[matchId]).length > 0
  }

  // 次の試合が開始されているかチェックする関数
  const isNextMatchStarted = (match: SoccerMatch): boolean => {
    const prefix = match.matchCode.substring(0, 3) // ScM or ScW
    const code = match.matchCode.substring(3) // A1, B1, etc.
    
    // サッカーの進出マップ（正確な体系）
    const advancementMap: { [key: string]: string } = {
      'A1': `${prefix}A5`,
      'B1': `${prefix}B5`,
      'A2': `${prefix}A7`,
      'A3': `${prefix}A6`,
      'A4': `${prefix}A6`,
      'A5': `${prefix}A7`,
      'B2': `${prefix}B6`,
      'B3': `${prefix}B6`,
      'B4': `${prefix}B7`,
      'B5': `${prefix}B7`,
      'A6': `${prefix}A8`,
      'A7': `${prefix}A8`,
      'B6': `${prefix}B8`,
      'B7': `${prefix}B8`,
      'A8': `${prefix}A9`,
      'B8': `${prefix}A9`
    }

    const nextMatchCode = advancementMap[code]
    if (!nextMatchCode) return false

    const nextMatch = matches.find(m => m.matchCode === nextMatchCode)
    return nextMatch ? nextMatch.status !== 'waiting' : false
  }

  // 編集モードの切り替え
  const toggleEditMode = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return

    // 次の試合が開始されている場合は再編集不可
    if (match.status === 'finished' && !match.isEditing && isNextMatchStarted(match)) {
      alert('次の試合が既に開始されているため、この試合は再編集できません。')
      return
    }

    if (match.isEditing) {
      // 編集完了時に勝者を再計算
      const team1Total = calculateTotal(match.scores?.team1)
      const team2Total = calculateTotal(match.scores?.team2)
      
      // 同点の場合
      if (team1Total === team2Total) {
        // PK戦の結果があるかチェック
        if (match.pkScores && match.pkScores.team1 !== match.pkScores.team2) {
          // PK戦で決着がついている場合
          const newWinner = match.pkScores.team1 > match.pkScores.team2 ? match.team1 : match.team2
          await updateWinner(matchId, newWinner, match)
        } else {
          alert('同点のため勝者を決定できません。PK戦の結果を入力してください。')
          return
        }
      } else {
        // 通常の勝敗
        const newWinner = team1Total > team2Total ? match.team1 : match.team2
        await updateWinner(matchId, newWinner, match)
      }
    }

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, isEditing: !m.isEditing }
      }
      return m
    }))
  }

  // 勝者更新処理を分離
  const updateWinner = async (matchId: string, newWinner: string, match: SoccerMatch) => {
    const oldWinner = match.winner

    try {
      // 勝者を更新
      const response = await fetch(`/api/soccer/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner: newWinner })
      })

      if (response.ok) {
        // 勝者が変わった場合は次の試合も更新
        if (oldWinner !== newWinner) {
          await updateNextMatch(match, oldWinner, newWinner)
          addSaveLog(match.matchCode, '勝者変更', `新勝者: ${newWinner} (旧勝者: ${oldWinner || 'なし'})`)
        }
        
        // ローカル状態の勝者も更新
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, winner: newWinner } : m
        ))
      }
    } catch (error) {
      console.error('Error updating winner:', error)
      alert('勝者の更新に失敗しました。')
    }
  }

  // 次の試合の更新処理（改善版）
  const updateNextMatch = async (match: SoccerMatch, oldWinner: string | null, newWinner: string) => {
    const prefix = match.matchCode.substring(0, 3) // ScM or ScW
    const code = match.matchCode.substring(3) // A1, B1, etc.
    
    // サッカーの進出マップ（正確な体系）
    const advancementMap: { [key: string]: { nextMatch: string, position: 'team1' | 'team2' } } = {
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

    const advancement = advancementMap[code]
    if (advancement) {
      const nextMatch = matches.find(m => m.matchCode === advancement.nextMatch)
      if (nextMatch) {
        // 次の試合が既に開始されている場合は警告
        if (nextMatch.status !== 'waiting') {
          alert(`注意: 次の試合(${nextMatch.matchCode})は既に開始されているため、進出チームの変更はできません。`)
          return
        }

        const updateData: any = {}
        updateData[advancement.position] = newWinner

        try {
          await fetch(`/api/soccer/matches/${nextMatch.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          })
          
          // ローカル状態も更新
          setMatches(prev => prev.map(m => 
            m.id === nextMatch.id 
              ? { ...m, [advancement.position]: newWinner }
              : m
          ))

          addSaveLog(nextMatch.matchCode, '進出チーム更新', `${advancement.position}: ${newWinner}`)
        } catch (error) {
          console.error('Error updating next match:', error)
          alert('次の試合の更新に失敗しました。')
        }
      }
    }

    // 3位決定戦への敗者進出処理（準決勝の場合）
    if (code === 'A8' || code === 'B8') {
      const loser = match.team1 === newWinner ? match.team2 : match.team1
      const thirdPlaceMatch = matches.find(m => m.matchCode === `${prefix}B9`)
      
      if (thirdPlaceMatch && thirdPlaceMatch.status === 'waiting') {
        const loserPosition = code === 'A8' ? 'team1' : 'team2'
        const updateData: any = {}
        updateData[loserPosition] = loser

        try {
          await fetch(`/api/soccer/matches/${thirdPlaceMatch.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          })
          
          // ローカル状態も更新
          setMatches(prev => prev.map(m => 
            m.id === thirdPlaceMatch.id 
              ? { ...m, [loserPosition]: loser }
              : m
          ))

          addSaveLog(thirdPlaceMatch.matchCode, '3位決定戦進出', `${loserPosition}: ${loser}`)
        } catch (error) {
          console.error('Error updating third place match:', error)
        }
      }
    }
  }

  // 順位更新機能
  const updateRanking = async (className: string, rank: number | null, rankText: string, eliminatedAt: string | null = null) => {
    try {
      console.log('🏆 順位更新:', { className, rank, rankText, eliminatedAt, gender: selectedGender })
      const response = await fetch('/api/soccer/rankings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          gender: selectedGender,
          rank,
          rankText,
          eliminatedAt
        })
      })

      console.log('📨 順位更新API応答:', response.status, response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ 順位更新成功:', result)
        await loadRankings()
      } else {
        const errorText = await response.text()
        console.error('❌ 順位更新エラー:', errorText)
      }
    } catch (error) {
      console.error('❌ 順位更新エラー:', error)
    }
  }

  // 試合終了時の順位処理
  const processMatchRankings = async (match: SoccerMatch, winner: string) => {
    const loser = match.team1 === winner ? match.team2 : match.team1
    const code = match.matchCode.substring(3) // A1, B1, etc.

    // 各試合の敗者順位処理
    switch (code) {
      // 1回戦敗者はベスト19
      case 'A1':
      case 'B1':
        await updateRanking(loser, 19, 'ベスト19', match.matchCode)
        break
      
      // 2回戦敗者はベスト16  
      case 'A2':
      case 'A3':
      case 'A4':
      case 'A5':
      case 'B2':
      case 'B3':
      case 'B4':
      case 'B5':
        await updateRanking(loser, 16, 'ベスト16', match.matchCode)
        break
      
      // 3回戦敗者はベスト8
      case 'A6':
      case 'A7':
      case 'B6':
      case 'B7':
        await updateRanking(loser, 8, 'ベスト8', match.matchCode)
        break
      
      // 準決勝敗者は4位（3位決定戦進出）
      case 'A8':
      case 'B8':
        await updateRanking(loser, 4, '4位', match.matchCode)
        break
      
      // 3位決定戦
      case 'B9':
        await updateRanking(loser, 4, '4位', match.matchCode)
        await updateRanking(winner, 3, '3位', match.matchCode)
        break
      
      // 決勝戦
      case 'A9':
        await updateRanking(loser, 2, '2位', match.matchCode)
        await updateRanking(winner, 1, '1位', match.matchCode)
        break
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">サッカーデータを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ サッカー管理</h1>
              <p className="text-gray-600">試合の進行状況とスコアを管理できます（手動保存）</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedGender('men')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedGender === 'men'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  👨 男子
                </button>
                <button
                  onClick={() => setSelectedGender('women')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedGender === 'women'
                      ? 'bg-pink-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  👩 女子
                </button>
              </div>
              
              <button
                onClick={() => setShowRankings(!showRankings)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showRankings ? '🏆 順位表を非表示' : '🏆 順位表を表示'}
              </button>
              
              <button
                onClick={initializeTournament}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🔄 リセット
              </button>
            </div>
          </div>
        </div>

        {showSaveMessage && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <p className="font-medium">✅ 保存しました</p>
          </div>
        )}

        {/* 順位表 */}
        {showRankings && (
          <div className="mb-6 bg-white rounded-lg shadow-lg border p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🏆 現在の順位</h2>
            
            {/* デバッグ情報 */}
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <p><strong>デバッグ情報:</strong></p>
              <p>取得した順位データ: {rankings.length}件</p>
              <p>選択中の性別: {selectedGender}</p>
              {rankings.length === 0 && (
                <p className="text-red-600">⚠️ 順位データが取得できていません。コンソールを確認してください。</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 8, 16, 19].map(rank => (
                <div key={rank} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2 text-center">
                    {rank <= 4 ? `${rank}位` : `ベスト${rank}`}
                  </h3>
                  <div className="space-y-1">
                    {rankings
                      .filter(r => r.rank === rank)
                      .map(ranking => (
                        <div key={ranking.className} className="text-sm text-center p-2 bg-white rounded border">
                          {ranking.className}
                        </div>
                      ))}
                    {rankings.filter(r => r.rank === rank).length === 0 && (
                      <div className="text-sm text-gray-500 text-center p-2">-</div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2 text-green-700 text-center">参加中</h3>
                <div className="space-y-1">
                  {rankings
                    .filter(r => !r.rank || r.rankText === '参加中')
                    .map(ranking => (
                      <div key={ranking.className} className="text-sm text-green-600 text-center p-2 bg-white rounded border">
                        {ranking.className}
                      </div>
                    ))}
                  {rankings.filter(r => !r.rank || r.rankText === '参加中').length === 0 && (
                    <div className="text-sm text-gray-500 text-center p-2">データなし</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {matches
            .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)
            .map((match) => {
              const winnerTeam = getWinnerTeam(match)
              const isMatchInProgress = match.status === 'in_progress'
              const isMatchFinished = match.status === 'finished'
              const canEditScores = isMatchInProgress || match.isEditing
              
              return (
                <div key={match.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-2xl font-bold text-blue-600">{match.matchCode}</span>
                        <span className="text-sm text-gray-500">第{match.round}回戦 試合{match.matchNumber}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          match.status === 'waiting' ? 'bg-gray-100 text-gray-600' :
                          match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {match.status === 'waiting' ? '待機中' :
                           match.status === 'in_progress' ? '試合中' : '終了'}
                        </span>
                      </div>

                      {/* 試合予定時刻 */}
                      <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-1">試合予定日時</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={match.scheduledTime ? match.scheduledTime.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                            onChange={(e) => {
                              const date = e.target.value
                              const time = match.scheduledTime ? match.scheduledTime.slice(11, 16) : '09:00'
                              handleScheduledTimeChange(match.id, `${date}T${time}`)
                            }}
                            className="px-3 py-1 border rounded text-sm"
                            disabled={isMatchFinished}
                          />
                          <input
                            type="time"
                            value={match.scheduledTime?.slice(11, 16) || '09:00'}
                            onChange={(e) => {
                              const date = match.scheduledTime ? match.scheduledTime.slice(0, 10) : new Date().toISOString().slice(0, 10)
                              const time = e.target.value
                              handleScheduledTimeChange(match.id, `${date}T${time}`)
                            }}
                            className="px-3 py-1 border rounded text-sm"
                            disabled={isMatchFinished}
                          />
                        </div>
                        {match.startTime && (
                          <span className="block mt-1 text-sm text-green-600">開始: {match.startTime}</span>
                        )}
                        {match.endTime && (
                          <span className="block mt-1 text-sm text-red-600">終了: {match.endTime}</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        {/* チーム1 */}
                        <div className={`text-center p-4 rounded-lg border-2 ${
                          winnerTeam === 'team1' 
                            ? 'border-yellow-400 bg-yellow-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                            {winnerTeam === 'team1' && <span className="text-yellow-500">🏆</span>}
                            {match.team1}
                          </div>
                          <div className="flex gap-2 justify-center">
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={match.scores?.team1?.firstHalf || 0}
                                onChange={(e) => handleScoreChange(match.id, 'team1', 'firstHalf', e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                disabled={!canEditScores}
                              />
                              <div className="text-xs text-gray-500 mt-1">前半</div>
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={match.scores?.team1?.secondHalf || 0}
                                onChange={(e) => handleScoreChange(match.id, 'team1', 'secondHalf', e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                disabled={!canEditScores}
                              />
                              <div className="text-xs text-gray-500 mt-1">後半</div>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-blue-600 mt-2">
                            {calculateTotal(match.scores?.team1)}
                          </div>
                        </div>

                        {/* VS */}
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-400">VS</div>
                          {match.pkScores && (
                            <div className="mt-2">
                              <div className="text-sm text-gray-500">PK戦</div>
                              <div className="text-lg font-bold text-red-600">
                                {match.pkScores.team1} - {match.pkScores.team2}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* チーム2 */}
                        <div className={`text-center p-4 rounded-lg border-2 ${
                          winnerTeam === 'team2' 
                            ? 'border-yellow-400 bg-yellow-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                            {winnerTeam === 'team2' && <span className="text-yellow-500">🏆</span>}
                            {match.team2}
                          </div>
                          <div className="flex gap-2 justify-center">
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={match.scores?.team2?.firstHalf || 0}
                                onChange={(e) => handleScoreChange(match.id, 'team2', 'firstHalf', e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                disabled={!canEditScores}
                              />
                              <div className="text-xs text-gray-500 mt-1">前半</div>
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={match.scores?.team2?.secondHalf || 0}
                                onChange={(e) => handleScoreChange(match.id, 'team2', 'secondHalf', e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                disabled={!canEditScores}
                              />
                              <div className="text-xs text-gray-500 mt-1">後半</div>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-blue-600 mt-2">
                            {calculateTotal(match.scores?.team2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ボタンエリア */}
                    <div className="flex flex-col gap-2">
                      {match.status === 'waiting' && hasPendingChanges(match.id) && (
                        <button
                          onClick={() => saveMatch(match.id)}
                          disabled={isSaving}
                          className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50 font-medium"
                        >
                          💾 保存
                        </button>
                      )}
                      
                      {match.status === 'waiting' && (
                        <button
                          onClick={() => handleMatchStatus(match.id, 'in_progress')}
                          className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors font-medium"
                        >
                          ▶️ 開始
                        </button>
                      )}
                      
                      {match.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => handleMatchStatus(match.id, 'finished')}
                            className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors font-medium"
                          >
                            ⏹️ 終了
                          </button>
                          <button
                            onClick={() => saveMatch(match.id)}
                            disabled={isSaving}
                            className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50 font-medium"
                          >
                            💾 保存
                          </button>
                        </>
                      )}
                      
                      {match.status === 'finished' && !match.isEditing && !isNextMatchStarted(match) && (
                        <button
                          onClick={() => toggleEditMode(match.id)}
                          className="px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors font-medium"
                        >
                          ✏️ 再編集
                        </button>
                      )}
                      
                      {match.isEditing && (
                        <>
                          <button
                            onClick={() => saveMatch(match.id)}
                            disabled={isSaving}
                            className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50 font-medium"
                          >
                            💾 保存
                          </button>
                          <button
                            onClick={() => toggleEditMode(match.id)}
                            className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors font-medium"
                          >
                            ✅ 完了
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {showPkModal && currentPkMatch && (
          <PkModal
            match={currentPkMatch}
            onSave={savePkResult}
            onCancel={() => {
              setShowPkModal(false)
              setCurrentPkMatch(null)
            }}
          />
        )}

        {saveLogs.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">📝 最近の操作</h3>
            <div className="space-y-2">
              {saveLogs.map((log, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {new Date(log.timestamp).toLocaleTimeString()} - {log.matchCode}
                  </span>
                  <span className="font-medium">{log.action}</span>
                  <span className="text-gray-500">{log.details}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PkModal({ 
  match, 
  onSave, 
  onCancel 
}: {
  match: SoccerMatch
  onSave: (team1Score: number, team2Score: number) => void
  onCancel: () => void
}) {
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)

  const handleSave = () => {
    if (team1Score === team2Score) {
      alert('PK戦は同点になりません。勝者を決めてください。')
      return
    }
    onSave(team1Score, team2Score)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">⚽ PK戦</h3>
        <p className="text-gray-600 mb-4">
          同点のため、PK戦の結果を入力してください
        </p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="font-bold mb-2">{match.team1}</div>
              <input
                type="number"
                min="0"
                value={team1Score}
                onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded text-center"
              />
            </div>
            <div className="text-center">
              <div className="font-bold mb-2">{match.team2}</div>
              <input
                type="number"
                min="0"
                value={team2Score}
                onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded text-center"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              保存
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}