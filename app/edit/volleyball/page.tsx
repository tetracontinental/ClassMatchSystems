'use client'

import { useState, useEffect } from 'react'
import { VolleyballMatch, VolleyballRanking, SaveLog, MatchChanges } from '@/app/types/volleyball'

export default function VolleyballEdit() {
  const [matches, setMatches] = useState<VolleyballMatch[]>([])
  const [rankings, setRankings] = useState<VolleyballRanking[]>([])
  const [saveLogs, setSaveLogs] = useState<SaveLog[]>([])
  const [showSaveMessage, setShowSaveMessage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men')
  const [pendingChanges, setPendingChanges] = useState<MatchChanges>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showRankings, setShowRankings] = useState(false)

  useEffect(() => {
    fetchMatches()
    loadRankings()
  }, [selectedGender])

  const fetchMatches = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/volleyball/matches?gender=${selectedGender}`)
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
      const response = await fetch('/api/volleyball/initialize', {
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
      const response = await fetch(`/api/volleyball/rankings?gender=${selectedGender}`)
      console.log('📨 順位API応答:', response.status, response.ok)
      
      if (response.ok) {
        const rankingsData = await response.json()
        console.log('✅ 取得した順位データ:', rankingsData?.length, '件')
        setRankings(rankingsData)
      } else {
        console.log('🔄 順位データを初期化します')
        await initializeRankings()
      }
    } catch (error) {
      console.error('❌ 順位データ読み込みエラー:', error)
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
      const response = await fetch('/api/volleyball/rankings', {
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
    value: string
  ) => {
    const score = parseInt(value) || 0
    const field = `${team}Score`
    
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
          [field]: score
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
      const response = await fetch(`/api/volleyball/matches/${matchId}`, {
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

  // 試合状態の更新
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
        
        // 現在のスコアを保存（pendingChangesがある場合はそれを使用）
        const currentChanges = pendingChanges[matchId] || {}
        updateData.team1Score = currentChanges.team1Score !== undefined ? currentChanges.team1Score : match.team1Score
        updateData.team2Score = currentChanges.team2Score !== undefined ? currentChanges.team2Score : match.team2Score
        
        // バレーボールの勝利条件をチェック
        const team1Score = updateData.team1Score
        const team2Score = updateData.team2Score
        
        const isTeam1Winner = (team1Score >= 20 && team1Score - team2Score >= 2) || team1Score >= 25
        const isTeam2Winner = (team2Score >= 20 && team2Score - team1Score >= 2) || team2Score >= 25
        
        if (isTeam1Winner && !isTeam2Winner) {
          updateData.winner = match.team1
        } else if (isTeam2Winner && !isTeam1Winner) {
          updateData.winner = match.team2
        } else {
          alert('勝敗が決まっていません。正しいスコアを入力してください。')
          return
        }
      }

      const response = await fetch(`/api/volleyball/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedMatch = await response.json()
        setMatches(prev => prev.map(m => 
          m.id === matchId ? updatedMatch : m
        ))
        
        // 変更をクリア
        if (newStatus === 'finished') {
          setPendingChanges(prev => {
            const newChanges = { ...prev }
            delete newChanges[matchId]
            return newChanges
          })
        }
        
        if (newStatus === 'in_progress') {
          addSaveLog(updatedMatch.matchCode, '試合開始', `${updatedMatch.team1} vs ${updatedMatch.team2}`)
        } else if (newStatus === 'finished') {
          addSaveLog(updatedMatch.matchCode, '試合終了', `勝者: ${updatedMatch.winner} (${updatedMatch.team1Score}-${updatedMatch.team2Score})`)
          // 順位表を再読み込み
          await loadRankings()
          // 決勝リーグ進出処理は手動で行うため、自動処理を無効化
          // if (updatedMatch.league !== 'E') {
          //   await checkAndUpdateFinalLeague()
          // }
        }
      }
    } catch (error) {
      console.error('Error updating match status:', error)
      alert('試合状態の更新に失敗しました。もう一度お試しください。')
    }
  }

  // 決勝リーグ進出処理
  const checkAndUpdateFinalLeague = async () => {
    try {
      // 各リーグの完了状況をチェック
      const leagueStatus: { [key: string]: { completed: boolean, winner: string | null } } = {}
      
      for (const league of ['A', 'B', 'C']) {
        const leagueMatches = matches.filter(m => m.league === league && m.gender === selectedGender)
        const completedMatches = leagueMatches.filter(m => m.status === 'finished')
        const isCompleted = leagueMatches.length > 0 && completedMatches.length === leagueMatches.length
        
        let winner = null
        if (isCompleted) {
          // 順位表から1位を取得
          const leagueRankings = rankings
            .filter(r => r.league === league && r.gender === selectedGender)
            .sort((a, b) => {
              if (b.wins !== a.wins) return b.wins - a.wins
              return b.pointDiff - a.pointDiff
            })
          
          if (leagueRankings.length > 0) {
            winner = leagueRankings[0].className
          }
        }
        
        leagueStatus[league] = { completed: isCompleted, winner }
      }

      // 完了したリーグの勝者を決勝リーグに反映
      const finalMatches = matches.filter(m => m.league === 'E' && m.gender === selectedGender)
      let hasUpdates = false
      
      for (const match of finalMatches) {
        const updateData: any = {}
        
        // A_1位 → Aリーグ1位
        if (match.team1 === 'A_1位' && leagueStatus.A.winner) {
          updateData.team1 = leagueStatus.A.winner
          hasUpdates = true
        }
        if (match.team2 === 'A_1位' && leagueStatus.A.winner) {
          updateData.team2 = leagueStatus.A.winner
          hasUpdates = true
        }
        
        // B_1位 → Bリーグ1位
        if (match.team1 === 'B_1位' && leagueStatus.B.winner) {
          updateData.team1 = leagueStatus.B.winner
          hasUpdates = true
        }
        if (match.team2 === 'B_1位' && leagueStatus.B.winner) {
          updateData.team2 = leagueStatus.B.winner
          hasUpdates = true
        }
        
        // C_1位 → Cリーグ1位
        if (match.team1 === 'C_1位' && leagueStatus.C.winner) {
          updateData.team1 = leagueStatus.C.winner
          hasUpdates = true
        }
        if (match.team2 === 'C_1位' && leagueStatus.C.winner) {
          updateData.team2 = leagueStatus.C.winner
          hasUpdates = true
        }
        
        if (Object.keys(updateData).length > 0) {
          await fetch(`/api/volleyball/matches/${match.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          })
        }
      }
      
      if (hasUpdates) {
        // 試合データを再取得
        await fetchMatches()
        addSaveLog('SYSTEM', '決勝リーグ更新', '予選リーグ勝者が決勝リーグに進出しました')
      }
    } catch (error) {
      console.error('Error updating final league:', error)
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

  const hasPendingChanges = (matchId: string): boolean => {
    return !!pendingChanges[matchId] && Object.keys(pendingChanges[matchId]).length > 0
  }

  // 編集モードの切り替え
  const toggleEditMode = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return

    if (match.isEditing) {
      // 編集完了時に勝者を再計算
      const team1Score = match.team1Score
      const team2Score = match.team2Score
      
      const isTeam1Winner = (team1Score >= 20 && team1Score - team2Score >= 2) || team1Score >= 25
      const isTeam2Winner = (team2Score >= 20 && team2Score - team1Score >= 2) || team2Score >= 25
      
      let newWinner = null
      if (isTeam1Winner && !isTeam2Winner) {
        newWinner = match.team1
      } else if (isTeam2Winner && !isTeam1Winner) {
        newWinner = match.team2
      }
      
      if (newWinner) {
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

  // 勝者更新処理
  const updateWinner = async (matchId: string, newWinner: string, match: VolleyballMatch) => {
    const oldWinner = match.winner

    try {
      const response = await fetch(`/api/volleyball/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner: newWinner })
      })

      if (response.ok) {
        if (oldWinner !== newWinner) {
          addSaveLog(match.matchCode, '勝者変更', `新勝者: ${newWinner} (旧勝者: ${oldWinner || 'なし'})`)
          await loadRankings()
        }
        
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, winner: newWinner } : m
        ))
      }
    } catch (error) {
      console.error('Error updating winner:', error)
      alert('勝者の更新に失敗しました。')
    }
  }

  // リーグ別に試合をグループ化
  const groupedMatches = matches.reduce((groups, match) => {
    const league = match.league
    if (!groups[league]) {
      groups[league] = []
    }
    groups[league].push(match)
    return groups
  }, {} as { [key: string]: VolleyballMatch[] })

  // リーグ別順位表
  const groupedRankings = rankings.reduce((groups, ranking) => {
    const league = ranking.league
    if (!groups[league]) {
      groups[league] = []
    }
    groups[league].push(ranking)
    return groups
  }, {} as { [key: string]: VolleyballRanking[] })

  const getLeagueName = (league: string) => {
    switch (league) {
      case 'A': return 'Aリーグ'
      case 'B': return 'Bリーグ'
      case 'C': return 'Cリーグ'
      case 'E': return '決勝リーグ'
      default: return `${league}リーグ`
    }
  }

  // 決勝リーグの準備状況をチェック
  const isFinalLeagueReady = (leagueMatches: VolleyballMatch[]) => {
    return leagueMatches.every(match => 
      !match.team1.includes('_1位') && 
      !match.team2.includes('_1位') && 
      match.team1 !== 'A_1位' && 
      match.team2 !== 'A_1位' &&
      match.team1 !== 'B_1位' && 
      match.team2 !== 'B_1位' &&
      match.team1 !== 'C_1位' && 
      match.team2 !== 'C_1位'
    )
  }

  // 手動勝ち上がり処理
  const handleManualAdvancement = async () => {
    const confirmed = confirm(
      '各リーグ1位チームを決勝リーグに進出させますか？\n\n' +
      'この操作により決勝リーグの対戦カードが確定されます。'
    )
    
    if (!confirmed) return

    try {
      // 各リーグの厳密な1位チーム（順位表の最上位のみ）を取得
      const leagueWinners: { [key: string]: string } = {}
      
      for (const league of ['A', 'B', 'C']) {
        const leagueRankings = rankings
          .filter(r => r.league === league && r.gender === selectedGender)
          .sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins
            return b.pointDiff - a.pointDiff
          })
        
        // 厳密に1位のチームのみ取得（配列の最初の要素のみ）
        if (leagueRankings.length > 0) {
          leagueWinners[league] = leagueRankings[0].className
          console.log(`${league}リーグ1位: ${leagueRankings[0].className}`)
        }
      }

      // 3つのリーグすべてで1位が決まっているかチェック
      if (Object.keys(leagueWinners).length !== 3) {
        alert('⚠️ 全てのリーグで1位が決定していません。\n各リーグの試合を完了してください。')
        return
      }

      // 決勝リーグの試合を更新
      const finalMatches = matches.filter(m => m.league === 'E' && m.gender === selectedGender)
      let updateCount = 0
      
      for (const match of finalMatches) {
        const updateData: any = {}
        
        // A_1位 → Aリーグ1位（厳密に1チームのみ）
        if (match.team1 === 'A_1位' && leagueWinners['A']) {
          updateData.team1 = leagueWinners['A']
          updateCount++
        }
        if (match.team2 === 'A_1位' && leagueWinners['A']) {
          updateData.team2 = leagueWinners['A']
          updateCount++
        }
        
        // B_1位 → Bリーグ1位（厳密に1チームのみ）
        if (match.team1 === 'B_1位' && leagueWinners['B']) {
          updateData.team1 = leagueWinners['B']
          updateCount++
        }
        if (match.team2 === 'B_1位' && leagueWinners['B']) {
          updateData.team2 = leagueWinners['B']
          updateCount++
        }
        
        // C_1位 → Cリーグ1位（厳密に1チームのみ）
        if (match.team1 === 'C_1位' && leagueWinners['C']) {
          updateData.team1 = leagueWinners['C']
          updateCount++
        }
        if (match.team2 === 'C_1位' && leagueWinners['C']) {
          updateData.team2 = leagueWinners['C']
          updateCount++
        }
        
        if (Object.keys(updateData).length > 0) {
          await fetch(`/api/volleyball/matches/${match.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          })
        }
      }
      
      if (updateCount > 0) {
        // 試合データを再取得
        await fetchMatches()
        
        // 順位表も再読み込みして進出状態を反映
        await loadRankings()
        
        // 進出チーム情報を表示
        const winnersList = Object.entries(leagueWinners)
          .map(([league, team]) => `${league}リーグ: ${team}`)
          .join('\n')
        
        addSaveLog('SYSTEM', '手動勝ち上がり', `予選リーグ1位チームが決勝リーグに進出 (厳密に3チーム)`)
        alert(`✅ 決勝リーグへの進出が完了しました！\n\n進出チーム:\n${winnersList}`)
      } else {
        alert('⚠️ 進出可能なチームがありません。\n各リーグの順位を確認してください。')
      }
    } catch (error) {
      console.error('Error in manual advancement:', error)
      alert('❌ 勝ち上がり処理中にエラーが発生しました。')
    }
  }

  // 決勝リーグリセット処理
  const handleFinalLeagueReset = async () => {
    const confirmed = confirm(
      '決勝リーグのみをリセットしますか？\n\n' +
      '決勝リーグの試合結果と進出チームがリセットされ、\n' +
      '予選リーグの結果は保持されます。'
    )
    
    if (!confirmed) return

    try {
      // 決勝リーグの試合を取得
      const finalMatches = matches.filter(m => m.league === 'E' && m.gender === selectedGender)
      
      for (const match of finalMatches) {
        // 決勝リーグの試合をリセット（プレースホルダーに戻す）
        const updateData = {
          team1: match.matchCode.includes('1') ? (match.matchCode.includes('E1') ? 'A_1位' : 
                  match.matchCode.includes('E2') ? 'B_1位' : 
                  match.matchCode.includes('E3') ? 'C_1位' : match.team1) : match.team1,
          team2: match.matchCode.includes('2') ? (match.matchCode.includes('E1') ? 'A_1位' : 
                  match.matchCode.includes('E2') ? 'B_1位' : 
                  match.matchCode.includes('E3') ? 'C_1位' : match.team2) : match.team2,
          team1Score: 0,
          team2Score: 0,
          status: 'waiting',
          winner: null,
          startTime: '',
          endTime: ''
        }

        // より正確なプレースホルダー設定
        if (match.matchCode === 'VME1' || match.matchCode === 'VWE1') {
          updateData.team1 = 'A_1位'
          updateData.team2 = 'B_1位'
        } else if (match.matchCode === 'VME2' || match.matchCode === 'VWE2') {
          updateData.team1 = 'C_1位'
          updateData.team2 = '教職員'
        } else if (match.matchCode === 'VME3' || match.matchCode === 'VWE3') {
          updateData.team1 = 'A_1位'
          updateData.team2 = 'C_1位'
        } else if (match.matchCode === 'VME4' || match.matchCode === 'VWE4') {
          updateData.team1 = 'B_1位'
          updateData.team2 = '教職員'
        } else if (match.matchCode === 'VME5' || match.matchCode === 'VWE5') {
          updateData.team1 = 'A_1位'
          updateData.team2 = '教職員'
        } else if (match.matchCode === 'VME6' || match.matchCode === 'VWE6') {
          updateData.team1 = 'B_1位'
          updateData.team2 = 'C_1位'
        }

        await fetch(`/api/volleyball/matches/${match.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
      }

      // データを再取得
      await fetchMatches()
      await loadRankings()
      
      addSaveLog('SYSTEM', '決勝リーグリセット', '決勝リーグのみリセット完了')
      alert('✅ 決勝リーグのリセットが完了しました！\n予選リーグの結果は保持されています。')
      
    } catch (error) {
      console.error('Error resetting final league:', error)
      alert('❌ 決勝リーグリセット中にエラーが発生しました。')
    }
  }

  // 決勝リーグの試合開始を制限
  const canStartFinalMatch = (match: VolleyballMatch) => {
    if (match.league !== 'E') return true
    return isFinalLeagueReady([match])
  }

  // 進出状態をチェックする関数
  const checkAdvancementStatus = (league: string, teamName: string) => {
    if (league === 'E') return null; // 決勝リーグは進出表示なし
    
    // 決勝リーグの試合で実際のチーム名が使われているかチェック
    const finalMatches = matches.filter(m => m.league === 'E' && m.gender === selectedGender)
    const isAdvanced = finalMatches.some(match => 
      (match.team1 === teamName && match.team1 !== `${league}_1位`) || 
      (match.team2 === teamName && match.team2 !== `${league}_1位`)
    )
    
    // より詳細な進出状態判定
    const hasPlaceholder = finalMatches.some(match => 
      match.team1.includes('_1位') || match.team2.includes('_1位')
    )
    
    return {
      isAdvanced,
      canAdvance: true, // 1位なら進出可能
      hasPlaceholder
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              🏐 バレーボール編集ページ
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full lg:w-auto">
              <button
                onClick={() => setShowRankings(!showRankings)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
              >
                {showRankings ? '順位表を隠す' : '順位表を表示'}
              </button>
              <button
                onClick={initializeTournament}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base"
              >
                トーナメントリセット
              </button>
            </div>
          </div>

          {/* 性別選択 */}
          <div className="flex gap-2 md:gap-4 mb-4">
            <button
              onClick={() => setSelectedGender('men')}
              className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-colors text-sm md:text-base flex-1 sm:flex-none ${
                selectedGender === 'men'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              男子
            </button>
            <button
              onClick={() => setSelectedGender('women')}
              className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-colors text-sm md:text-base flex-1 sm:flex-none ${
                selectedGender === 'women'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              女子
            </button>
          </div>

          {/* 保存メッセージ */}
          {showSaveMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              データが保存されました
            </div>
          )}
        </div>

        {/* 順位表 */}
        {showRankings && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">順位表</h2>
              </div>
              
              {/* 進出・リセットボタン */}
              <div className="flex gap-2">
                <button
                  onClick={handleFinalLeagueReset}
                  className="px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-bold text-sm flex items-center gap-2"
                >
                  <span>🔄</span>
                  決勝リーグリセット
                </button>
                <button
                  onClick={handleManualAdvancement}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-bold text-sm flex items-center gap-2"
                >
                  <span>🏆</span>
                  決勝リーグ進出
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {Object.entries(groupedRankings).map(([league, leagueRankings]) => (
                <div key={league} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className={`p-4 text-center font-bold text-white ${
                    league === 'A' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    league === 'B' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    league === 'C' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                    league === 'E' && matches.filter(m => m.league === 'E' && m.gender === selectedGender).length > 0 && isFinalLeagueReady(matches.filter(m => m.league === 'E' && m.gender === selectedGender)) ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    league === 'E' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                    'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}>
                    <h3 className="text-lg font-bold">
                      {getLeagueName(league)}
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {leagueRankings
                      .sort((a, b) => {
                        if (b.wins !== a.wins) return b.wins - a.wins
                        return b.pointDiff - a.pointDiff
                      })
                      .map((ranking, index) => (
                        <div key={ranking.id} className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                          index === 0 
                            ? 'bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-yellow-300 shadow-lg' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}>
                          {/* 1位の王冠表示 */}
                          {index === 0 && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-lg">👑</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            {/* 左側：順位とチーム名 */}
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-orange-400 text-white' :
                                'bg-gray-300 text-gray-700'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className={`font-bold ${index === 0 ? 'text-orange-800 text-lg' : 'text-gray-800'}`}>
                                  {ranking.className}
                                </div>
                                {index === 0 && league !== 'E' && (
                                  <div className="text-xs font-medium">
                                    {(() => {
                                      const advancementStatus = checkAdvancementStatus(league, ranking.className)
                                      if (!advancementStatus) return null
                                      
                                      if (advancementStatus.isAdvanced) {
                                        return (
                                          <span className="text-blue-600">🚀 決勝進出済</span>
                                        )
                                      } else if (advancementStatus.canAdvance) {
                                        return (
                                          <span className="text-orange-600">🏆 決勝進出対象</span>
                                        )
                                      }
                                      return null
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 右側：戦績 */}
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">試合:</span>
                                <span className="font-medium">{ranking.matches}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">勝利:</span>
                                <span className={`font-bold ${index === 0 ? 'text-green-700' : 'text-green-600'}`}>
                                  {ranking.wins}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">得失点差:</span>
                                <span className={`font-medium ${
                                  ranking.pointDiff > 0 ? (index === 0 ? 'text-blue-700' : 'text-blue-600') :
                                  ranking.pointDiff < 0 ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {ranking.pointDiff > 0 ? '+' : ''}{ranking.pointDiff}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 試合一覧 */}
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([league, leagueMatches]) => (
            <div key={league} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className={`p-6 text-center ${
                league === 'A' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                league === 'B' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                league === 'C' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                league === 'E' && isFinalLeagueReady(leagueMatches) ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                league === 'E' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                'bg-gradient-to-r from-orange-500 to-orange-600'
              }`}>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {league === 'E' ? '🏆' : '🏐'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {getLeagueName(league)}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-6">
                  {leagueMatches.map((match) => (
                    <div
                      key={match.id}
                      className={`relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                        match.status === 'finished'
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
                          : match.status === 'in_progress'
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300'
                          : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200'
                      }`}
                    >
                      {/* ステータスバー */}
                      <div className={`h-1 md:h-2 w-full ${
                        match.status === 'finished'
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : match.status === 'in_progress'
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      }`}></div>

                      <div className="p-3 md:p-6">
                        {/* ヘッダー - スマホでコンパクト */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-6 gap-2 md:gap-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <div className={`px-2 md:px-4 py-1 md:py-2 rounded-full font-mono text-xs md:text-sm font-bold text-white shadow-md ${
                              match.status === 'finished'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : match.status === 'in_progress'
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}>
                              {match.matchCode}
                            </div>
                            <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium shadow-sm ${
                              match.status === 'finished'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : match.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {match.status === 'finished' ? '🏁 終了' : 
                               match.status === 'in_progress' ? '⚡ 進行中' : '⏳ 待機中'}
                            </div>
                          </div>
                          <div className="flex gap-1 md:gap-2 w-full sm:w-auto">
                            {hasPendingChanges(match.id) && (
                              <button
                                onClick={() => saveMatch(match.id)}
                                disabled={isSaving}
                                className="px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs md:text-sm font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 shadow-md transition-all duration-200 flex-1 sm:flex-none"
                              >
                                {isSaving ? '💾' : '💾 保存'}
                              </button>
                            )}
                            {match.status === 'finished' && (
                              <button
                                onClick={() => toggleEditMode(match.id)}
                                className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium shadow-md transition-all duration-200 flex-1 sm:flex-none ${
                                  match.isEditing
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                                }`}
                              >
                                {match.isEditing ? '✅' : '✏️ 再編集'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 時刻セクション - スマホで簡略化 */}
                        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              📅 予定時刻
                            </label>
                            <input
                              type="datetime-local"
                              value={match.scheduledTime}
                              onChange={(e) => handleScheduledTimeChange(match.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
                            />
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              🚀 開始時刻
                            </label>
                            <input
                              type="text"
                              value={match.startTime}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100/90 text-gray-600"
                            />
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              🏁 終了時刻
                            </label>
                            <input
                              type="text"
                              value={match.endTime}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100/90 text-gray-600"
                            />
                          </div>
                        </div>

                        {/* スマホ用簡単時刻設定 */}
                        <div className="md:hidden mb-3">
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              📅 予定時刻
                            </label>
                            <input
                              type="datetime-local"
                              value={match.scheduledTime}
                              onChange={(e) => handleScheduledTimeChange(match.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/90"
                            />
                            
                            {/* 開始・終了時刻を小さく表示 */}
                            {(match.startTime || match.endTime) && (
                              <div className="flex gap-3 mt-2 text-xs text-gray-600">
                                {match.startTime && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-green-600">🚀</span>
                                    <span className="font-medium">開始:</span>
                                    <span className="bg-green-50 px-1 py-0.5 rounded text-xs">{match.startTime}</span>
                                  </div>
                                )}
                                {match.endTime && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-red-600">🏁</span>
                                    <span className="font-medium">終了:</span>
                                    <span className="bg-red-50 px-1 py-0.5 rounded text-xs">{match.endTime}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 試合スコア - スマホ最適化 */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/60 shadow-inner">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
                            {/* チーム1 */}
                            <div className="flex-1 text-center w-full md:w-auto">
                              <div className="mb-2 md:mb-4">
                                <h3 className="text-sm md:text-xl font-bold text-gray-800 mb-1 md:mb-2 px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200">
                                  {match.team1}
                                </h3>
                              </div>
                              <div className="flex flex-col items-center">
                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                                  スコア
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={match.team1Score}
                                  onChange={(e) => handleScoreChange(match.id, 'team1', e.target.value)}
                                  disabled={match.status !== 'in_progress' && !match.isEditing}
                                  className="w-14 h-10 md:w-20 md:h-16 px-1 md:px-3 py-1 md:py-2 border-2 border-blue-300 rounded-xl text-center text-lg md:text-2xl font-bold focus:outline-none focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-100 disabled:border-gray-300 bg-white shadow-md"
                                />
                              </div>
                            </div>

                            {/* VS セクション - スマホで小さく */}
                            <div className="flex-shrink-0 mx-2 md:mx-8">
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-8 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg mb-1 md:mb-2">
                                  <span className="text-white font-bold text-xs md:text-lg">VS</span>
                                </div>
                                <div className="text-xs md:text-sm text-gray-600 font-medium hidden md:block">
                                  🏐 バレーボール
                                </div>
                              </div>
                            </div>

                            {/* チーム2 */}
                            <div className="flex-1 text-center w-full md:w-auto">
                              <div className="mb-2 md:mb-4">
                                <h3 className="text-sm md:text-xl font-bold text-gray-800 mb-1 md:mb-2 px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg border border-red-200">
                                  {match.team2}
                                </h3>
                              </div>
                              <div className="flex flex-col items-center">
                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                                  スコア
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={match.team2Score}
                                  onChange={(e) => handleScoreChange(match.id, 'team2', e.target.value)}
                                  disabled={match.status !== 'in_progress' && !match.isEditing}
                                  className="w-14 h-10 md:w-20 md:h-16 px-1 md:px-3 py-1 md:py-2 border-2 border-red-300 rounded-xl text-center text-lg md:text-2xl font-bold focus:outline-none focus:ring-2 md:focus:ring-4 focus:ring-red-200 focus:border-red-500 disabled:bg-gray-100 disabled:border-gray-300 bg-white shadow-md"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 勝者表示 */}
                          {match.winner && (
                            <div className="mt-3 md:mt-6 text-center">
                              <div className="inline-flex items-center px-3 md:px-6 py-1 md:py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-bold text-xs md:text-lg shadow-lg">
                                <span className="mr-1 md:mr-2">🏆</span>
                                勝者: {match.winner}
                                <span className="ml-1 md:ml-2">🎉</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 試合操作ボタン - スマホでコンパクト */}
                        <div className="mt-3 md:mt-6 flex justify-center gap-2 md:gap-4">
                          {match.status === 'waiting' && (
                            <>
                              {canStartFinalMatch(match) ? (
                                <button
                                  onClick={() => handleMatchStatus(match.id, 'in_progress')}
                                  className="px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-xs md:text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                  🚀 試合開始
                                </button>
                              ) : (
                                <div className="text-center">
                                  <button
                                    disabled
                                    className="px-4 md:px-8 py-2 md:py-3 bg-gray-400 text-white rounded-xl font-bold text-xs md:text-lg cursor-not-allowed opacity-60"
                                  >
                                    🔒 進出待ち
                                  </button>
                                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                                    決勝リーグ進出を完了してください
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          {match.status === 'in_progress' && (
                            <button
                              onClick={() => handleMatchStatus(match.id, 'finished')}
                              className="px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold text-xs md:text-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              🏁 試合終了
                            </button>
                          )}
                        </div>

                        {/* バレーボールルール説明 - スマホで簡略 */}
                        {match.status === 'in_progress' && (
                          <div className="mt-3 md:mt-6 p-2 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs md:text-sm font-bold">ℹ️</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-blue-800 mb-1 text-xs md:text-base">バレーボールルール</h4>
                                <p className="text-xs md:text-sm text-blue-700">
                                  <strong className="block md:inline">20点マッチでデュースあり、25点で勝利</strong>
                                  <span className="block md:inline">
                                    <span className="md:hidden"><br /></span>
                                    <span className="md:ml-2">勝利条件: <span className="font-semibold">(20点以上で2点差)</span> または <span className="font-semibold">(25点到達)</span></span>
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 保存ログ */}
        {saveLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">保存ログ</h2>
            <div className="space-y-2">
              {saveLogs.map((log, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex gap-4">
                    <span className="font-mono text-sm">{log.matchCode}</span>
                    <span className="text-sm font-medium">{log.action}</span>
                    <span className="text-sm text-gray-600">{log.details}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('ja-JP')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 