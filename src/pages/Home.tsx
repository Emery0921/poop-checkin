import { useState, useEffect, useCallback } from 'react'
import { NicknameModal } from '../components/NicknameModal'
import { RankingList } from '../components/RankingList'
import { Calendar } from '../components/Calendar'
import { Achievements } from '../components/Achievements'
import { getLocalUser, setLocalUser } from '../lib/utils'
import * as api from '../lib/api'
import type { RankItem } from '../lib/types'

function getRoomId(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('room') || 'default'
}

export function Home() {
  const roomId = getRoomId()
  const [user, setUser] = useState(getLocalUser(roomId))
  const [todayCount, setTodayCount] = useState(0)
  const [ranking, setRanking] = useState<RankItem[]>([])
  const [myDates, setMyDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [tab, setTab] = useState<'rank' | 'calendar' | 'achievements'>('rank')

  const loadData = useCallback(async () => {
    if (!user) return
    const [rankData, count, dates] = await Promise.all([
      api.getRanking(roomId),
      api.getTodayCheckinCount(user.id, roomId),
      api.getCheckinDates(user.id, roomId),
    ])
    setRanking(rankData)
    setTodayCount(count)
    setMyDates(dates)
  }, [user, roomId])

  useEffect(() => { loadData() }, [loadData])

  const handleJoin = async (nickname: string, emoji: string) => {
    setLoading(true)
    try {
      const newUser = await api.joinRoom(roomId, nickname, emoji)
      const localUser = { id: newUser.id, nickname, emoji }
      setLocalUser(roomId, localUser)
      setUser(localUser)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckin = async () => {
    if (!user || loading) return
    setLoading(true)
    try {
      await api.checkin(user.id, roomId)
      setTodayCount(prev => prev + 1)
      setAnimating(true)
      setTimeout(() => setAnimating(false), 1000)
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    const url = window.location.origin + window.location.pathname + '?room=' + roomId
    const myRank = ranking.findIndex(r => r.user_id === user?.id) + 1
    const text = `💩 我在「拉屎打卡」已打卡${myDates.length}次${myRank > 0 ? `，排名第${myRank}` : ''}！快来一起打卡吧 👉 ${url}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      alert('已复制分享文案到剪贴板！粘贴到群里即可~')
    }
  }

  if (!user) {
    return <NicknameModal onJoin={handleJoin} />
  }

  const myStats = ranking.find(r => r.user_id === user.id)

  return (
    <div className="p-4 pb-8 space-y-4">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold">💩 拉屎打卡</h1>
        <p className="text-sm text-gray-400">每天一拉，健康常伴</p>
      </div>

      {/* Check-in Button */}
      <div className="flex flex-col items-center py-6">
        <button
          onClick={handleCheckin}
          disabled={loading}
          className={`w-36 h-36 rounded-full text-6xl shadow-lg transition-all active:scale-95 bg-gradient-to-br from-purple-400 to-purple-600 hover:shadow-xl hover:scale-105 ${animating ? 'animate-bounce' : ''}`}
        >
          💩
        </button>
        <p className="mt-3 text-sm text-gray-500">
          {todayCount > 0 ? `今日已打卡 ${todayCount} 次 💪` : '点击打卡'}
        </p>
        {myStats && (
          <p className="text-xs text-gray-400 mt-1">
            累计 {myStats.total} 次 · 连续 {myStats.streak} 天
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {([['rank', '🏆 排行'], ['calendar', '📅 日历'], ['achievements', '🎖️ 成就']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
              tab === key ? 'bg-white font-medium shadow-sm' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'rank' && <RankingList ranking={ranking} currentUserId={user.id} />}
      {tab === 'calendar' && <Calendar dates={myDates} />}
      {tab === 'achievements' && <Achievements total={myStats?.total ?? 0} streak={myStats?.streak ?? 0} />}

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
      >
        📢 分享到群
      </button>
    </div>
  )
}
