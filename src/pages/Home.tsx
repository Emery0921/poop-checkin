import { useState, useEffect, useCallback, useRef } from 'react'
import { NicknameModal } from '../components/NicknameModal'
import { RankingList } from '../components/RankingList'
import { Calendar } from '../components/Calendar'
import { Achievements } from '../components/Achievements'
import { ConfirmModal } from '../components/ConfirmModal'
import { MakeupModal } from '../components/MakeupModal'
import { getLocalUser, setLocalUser, clearLocalUser, getMakeupCandidateDates, getTodayDate, getWeekStart, getRecentWeekStarts, formatWeekLabel } from '../lib/utils'
import * as api from '../lib/api'
import type { RankItem, Checkin } from '../lib/types'

const UNDO_DURATION = 180 // 3 minutes in seconds

const RANK_MODE_OPTIONS = [['week', '本周榜'], ['all', '总榜']] as const

const WEEK_OPTIONS = getRecentWeekStarts()

function getRoomId(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('room') || 'default'
}

export function Home() {
  const roomId = getRoomId()
  const [user, setUser] = useState(getLocalUser(roomId))
  const [todayCheckins, setTodayCheckins] = useState<Checkin[]>([])
  const [ranking, setRanking] = useState<RankItem[]>([])
  const [weekRanking, setWeekRanking] = useState<RankItem[]>([])
  const [rankMode, setRankMode] = useState<'week' | 'all'>('week')
  const [weekStart, setWeekStart] = useState(() => getWeekStart(getTodayDate()))
  const [myDates, setMyDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [tab, setTab] = useState<'rank' | 'calendar' | 'achievements'>('rank')
  const [showConfirm, setShowConfirm] = useState(false)
  const [lastCheckinId, setLastCheckinId] = useState<string | null>(null)
  const [undoCountdown, setUndoCountdown] = useState(0)
  const [showRecoveryCode, setShowRecoveryCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showMakeup, setShowMakeup] = useState(false)
  const [makeupDate, setMakeupDate] = useState<string | null>(null)
  const [makeupRemaining, setMakeupRemaining] = useState(0)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    const [rankData, checkins, dates, quota] = await Promise.all([
      api.getRankings(roomId, weekStart),
      api.getTodayCheckins(user.id, roomId),
      api.getCheckinDates(user.id, roomId),
      api.getMakeupQuota(user.id, roomId),
    ])
    setRanking(rankData.all)
    setWeekRanking(rankData.week)
    setTodayCheckins(checkins)
    setMyDates(dates)
    setMakeupRemaining(quota.remaining)
  }, [user, roomId, weekStart])

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
      const localUser = { id: newUser.id, nickname, emoji, recoveryCode: newUser.recovery_code }
      setLocalUser(roomId, localUser)
      setUser(localUser)
      setShowRecoveryCode(true)
    } finally {
      setLoading(false)
    }
  }

  const handleRecover = async (code: string): Promise<boolean> => {
    setLoading(true)
    try {
      const found = await api.recoverUser(roomId, code)
      if (!found) return false
      const localUser = { id: found.id, nickname: found.nickname, emoji: found.emoji, recoveryCode: found.recovery_code }
      setLocalUser(roomId, localUser)
      setUser(localUser)
      return true
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
      setTodayCheckins(prev => [...prev, checkin])
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
      setTodayCheckins(prev => prev.filter(c => c.id !== lastCheckinId))
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

  const handleMakeupClick = () => {
    if (!user || loading || makeupRemaining <= 0) return
    setMakeupDate(null)
    setShowMakeup(true)
  }

  const handleConfirmMakeup = async () => {
    if (!user || !makeupDate || loading || makeupRemaining <= 0) return
    setLoading(true)
    try {
      await api.makeupCheckin(user.id, roomId, makeupDate)
      setShowMakeup(false)
      setMakeupDate(null)
      await loadData()
    } catch (err) {
      if (api.isForeignKeyViolation(err)) {
        clearLocalUser(roomId)
        setUser(null)
      } else if (err instanceof api.MakeupQuotaError) {
        setShowMakeup(false)
        setMakeupDate(null)
        setMakeupRemaining(0)
        alert('本周补卡机会已用完，下周一恢复')
      } else {
        alert('补卡失败，请重试')
      }
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

  const handleCopyRecoveryCode = () => {
    if (!user || !navigator.clipboard) return
    navigator.clipboard.writeText(user.recoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) {
    return <NicknameModal onJoin={handleJoin} onRecover={handleRecover} loading={loading} />
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
          {todayCheckins.length > 0 ? `今日已打卡 ${todayCheckins.length} 次 💪` : '点击打卡'}
        </p>
        {myStats && (
          <p className="text-xs text-gray-400 mt-1">
            累计 {myStats.total} 次 · 连续 {myStats.streak} 天
          </p>
        )}
        <button
          onClick={handleMakeupClick}
          disabled={loading || makeupRemaining <= 0}
          className="mt-2 text-xs text-purple-400 hover:text-purple-600 transition-colors disabled:opacity-40 disabled:hover:text-purple-400"
        >
          🩹 补卡（本周剩余 {makeupRemaining} 次）
        </button>
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
      {tab === 'rank' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {RANK_MODE_OPTIONS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRankMode(key)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    rankMode === key ? 'bg-white font-medium shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {rankMode === 'week' && (
              <select
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-lg outline-none"
              >
                {WEEK_OPTIONS.map(week => (
                  <option key={week} value={week}>{formatWeekLabel(week)}</option>
                ))}
              </select>
            )}
          </div>
          <RankingList ranking={rankMode === 'week' ? weekRanking : ranking} currentUserId={user.id} />
        </div>
      )}
      {tab === 'calendar' && <Calendar dates={myDates} />}
      {tab === 'achievements' && <Achievements total={myStats?.total ?? 0} streak={myStats?.streak ?? 0} />}

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
      >
        📢 分享到群
      </button>

      {/* Recovery Code */}
      <button
        onClick={() => setShowRecoveryCode(true)}
        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        🔑 查看我的找回码
      </button>

      {/* Recovery Code Modal */}
      {showRecoveryCode && (
        <ConfirmModal
          icon="🔑"
          title="我的找回码"
          description="换设备后在加入页面输入此码即可找回身份和数据"
          cancelText="关闭"
          confirmText={copied ? '已复制 ✓' : '复制找回码'}
          onCancel={() => setShowRecoveryCode(false)}
          onConfirm={handleCopyRecoveryCode}
        >
          <p className="text-2xl font-bold tracking-widest text-purple-600 bg-purple-50 rounded-xl py-3 mb-4">
            {user.recoveryCode}
          </p>
        </ConfirmModal>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <ConfirmModal
          icon="💩"
          title="确认打卡？"
          description="打卡后 3 分钟内可撤回"
          confirmText="确认打卡"
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmCheckin}
        />
      )}

      {/* Makeup Modal */}
      {showMakeup && (
        <MakeupModal
          dates={getMakeupCandidateDates(myDates)}
          selectedDate={makeupDate}
          onSelectDate={setMakeupDate}
          onCancel={() => setShowMakeup(false)}
          onConfirm={handleConfirmMakeup}
          loading={loading}
        />
      )}
    </div>
  )
}
