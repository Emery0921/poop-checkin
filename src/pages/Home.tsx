import { useState, useEffect, useCallback, useRef } from 'react'
import { NicknameModal } from '../components/NicknameModal'
import { RankingList } from '../components/RankingList'
import { Calendar } from '../components/Calendar'
import { Achievements } from '../components/Achievements'
import { getLocalUser, setLocalUser, clearLocalUser } from '../lib/utils'
import * as api from '../lib/api'
import type { RankItem } from '../lib/types'

const UNDO_DURATION = 180 // 3 minutes in seconds

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
  const [showConfirm, setShowConfirm] = useState(false)
  const [lastCheckinId, setLastCheckinId] = useState<string | null>(null)
  const [undoCountdown, setUndoCountdown] = useState(0)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    }
  }, [])

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

  const handleCheckinClick = () => {
    if (!user || loading) return
    setShowConfirm(true)
  }

  const handleConfirmCheckin = async () => {
    if (!user || loading) return
    setShowConfirm(false)
    setLoading(true)
    try {
      const checkin = await api.checkin(user.id, roomId)
      setTodayCount(prev => prev + 1)
      setAnimating(true)
      setTimeout(() => setAnimating(false), 1000)
      // Start undo countdown
      setLastCheckinId(checkin.id)
      setUndoCountdown(UNDO_DURATION)
      if (undoTimerRef.current) clearInterval(undoTimerRef.current)
      undoTimerRef.current = setInterval(() => {
        setUndoCountdown(prev => {
          if (prev <= 1) {
            clearInterval(undoTimerRef.current!)
            undoTimerRef.current = null
            setLastCheckinId(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      await loadData()
    } catch (err) {
      // 用户已被删除（外键约束失败），清空本地身份重新走注册流程
      if (api.isForeignKeyViolation(err)) {
        clearLocalUser(roomId)
        setUser(null)
      } else {
        alert('打卡失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async () => {
    if (!lastCheckinId) return
    try {
      await api.cancelCheckin(lastCheckinId)
      setLastCheckinId(null)
      setUndoCountdown(0)
      if (undoTimerRef.current) {
        clearInterval(undoTimerRef.current)
        undoTimerRef.current = null
      }
      await loadData()
    } catch {
      alert('取消失败，可能已超时')
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
    return <NicknameModal onJoin={handleJoin} loading={loading} />
  }

  const myStats = ranking.find(r => r.user_id === user.id)
  const undoMinutes = Math.floor(undoCountdown / 60)
  const undoSeconds = undoCountdown % 60

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
          onClick={handleCheckinClick}
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

      {/* Undo Banner */}
      {lastCheckinId && undoCountdown > 0 && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <span className="text-sm text-yellow-700">
            {undoMinutes}:{String(undoSeconds).padStart(2, '0')} 内可撤回
          </span>
          <button
            onClick={handleUndo}
            className="text-sm font-medium text-red-500 hover:text-red-600"
          >
            撤回打卡
          </button>
        </div>
      )}

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

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <p className="text-5xl mb-4">💩</p>
            <h3 className="text-lg font-bold mb-2">确认打卡？</h3>
            <p className="text-sm text-gray-500 mb-6">打卡后 3 分钟内可撤回</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCheckin}
                className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
              >
                确认打卡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
