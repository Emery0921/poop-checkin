import { useState } from 'react'
import { NicknameModal } from '../components/NicknameModal'
import { RankingList } from '../components/RankingList'
import { TodayFeed } from '../components/TodayFeed'
import { Calendar } from '../components/Calendar'
import { TitleGallery } from '../components/TitleGallery'
import { ConfirmModal } from '../components/ConfirmModal'
import { EditNicknameModal } from '../components/EditNicknameModal'
import { MakeupModal } from '../components/MakeupModal'
import { UpdateModal } from '../components/UpdateModal'
import { TitleTag } from '../components/TitleTag'
import { useHomeData } from '../hooks/useHomeData'
import { useUndoCountdown } from '../hooks/useUndoCountdown'
import type { RankMode, TabKey } from '../lib/dicts'
import { CHEERS, RANK_MODE_OPTIONS, TAB_OPTIONS, UNDO_DURATION, UPDATE_VERSION } from '../lib/dicts'
import { getLocalUser, setLocalUser, clearLocalUser, getMakeupCandidateDates, getRecentWeekStarts, formatWeekLabel, formatTitleText, filterRankVisible, getSeenUpdateVersion, setSeenUpdateVersion } from '../lib/utils'
import * as api from '../lib/api'

const WEEK_OPTIONS = getRecentWeekStarts()

function getRoomId(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('room') || 'default'
}

export function Home() {
  const roomId = getRoomId()
  const storedUser = getLocalUser(roomId)
  const [user, setUser] = useState(storedUser)
  // 新用户不需要看更新日志，只有已加入过的老用户在版本变化后弹一次
  const [showUpdate, setShowUpdate] = useState(() => !!storedUser && getSeenUpdateVersion() !== UPDATE_VERSION)
  const {
    ranking,
    weekRanking,
    todayCheckins,
    myDates,
    makeupRemaining,
    weekStart,
    setWeekStart,
    reload,
    addTodayCheckin,
    removeTodayCheckin,
    markMakeupExhausted,
  } = useHomeData(user, roomId)
  const {
    pendingCheckinId,
    countdown: undoCountdown,
    start: startUndo,
    clear: clearUndo,
  } = useUndoCountdown(UNDO_DURATION)
  const [rankMode, setRankMode] = useState<RankMode>('week')
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [tab, setTab] = useState<TabKey>('rank')
  const [showConfirm, setShowConfirm] = useState(false)
  // 存住这次打卡随机到的那句吐槽，非空即代表分享询问弹窗打开
  const [shareCheer, setShareCheer] = useState<string | null>(null)
  const [showRecoveryCode, setShowRecoveryCode] = useState(false)
  const [showEditNickname, setShowEditNickname] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showMakeup, setShowMakeup] = useState(false)
  const [makeupDate, setMakeupDate] = useState<string | null>(null)

  // 榜单只展示活跃用户，排名与分享文案里的名次都按过滤后的列表算
  const visibleRanking = filterRankVisible(ranking, user?.id)
  const visibleWeekRanking = filterRankVisible(weekRanking, user?.id)

  const handleJoin = async (nickname: string, emoji: string) => {
    setLoading(true)
    try {
      const newUser = await api.joinRoom(roomId, nickname, emoji)
      const localUser = { id: newUser.id, nickname, emoji, recoveryCode: newUser.recovery_code }
      setLocalUser(roomId, localUser)
      setUser(localUser)
      setSeenUpdateVersion(UPDATE_VERSION)
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
      addTodayCheckin(checkin)
      setAnimating(true)
      setTimeout(() => setAnimating(false), 1000)
      startUndo(checkin.id)
      // 刷新失败不影响打卡结果，不能报成「打卡失败」
      await reload().catch(() => {})
      setShareCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)])
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
    if (!pendingCheckinId) return
    try {
      await api.cancelCheckin(pendingCheckinId)
      removeTodayCheckin(pendingCheckinId)
      clearUndo()
      // 撤回已经成功，刷新失败不能报成「取消失败」
      await reload().catch(() => {})
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
      // 补卡已经成功，刷新失败不能报成「补卡失败」
      await reload().catch(() => {})
    } catch (err) {
      if (api.isForeignKeyViolation(err)) {
        clearLocalUser(roomId)
        setUser(null)
      } else if (err instanceof api.MakeupQuotaError) {
        setShowMakeup(false)
        setMakeupDate(null)
        markMakeupExhausted()
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
    const myIdx = visibleRanking.findIndex(r => r.user_id === user?.id)
    const me = myIdx >= 0 ? visibleRanking[myIdx] : null
    const titleText = me ? formatTitleText([me.levelTitle, me.statusTitle]) : ''
    const text = `💩 我已打卡${myDates.length}次${myIdx >= 0 ? `，排名第${myIdx + 1}` : ''}${titleText ? `，当前称号：${titleText}` : ''}！快来一起打卡吧 👉 ${url}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      alert('已复制分享文案到剪贴板！粘贴到群里即可~')
    }
  }

  const handleConfirmShare = () => {
    setShareCheer(null)
    handleShare()
  }

  const handleConfirmNickname = async (nickname: string) => {
    if (!user || loading) return
    // 没改动就直接关掉，不必往数据库跑一趟
    if (nickname === user.nickname) {
      setShowEditNickname(false)
      return
    }
    setLoading(true)
    try {
      await api.updateNickname(user.id, roomId, nickname)
      const nextUser = { ...user, nickname }
      setLocalUser(roomId, nextUser)
      setUser(nextUser)
      setShowEditNickname(false)
      // 昵称已经改成功，刷新失败不能报成「修改失败」
      await reload().catch(() => {})
    } catch {
      alert('昵称修改失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleShowRecoveryCode = async () => {
    if (!user || loading) return
    // 找回码功能上线前加入的老用户，本地存的身份里没有这个字段，按需从服务端补齐
    if (!user.recoveryCode) {
      setLoading(true)
      try {
        const found = await api.getUser(user.id, roomId)
        if (!found?.recovery_code) {
          alert('没查到你的找回码，可能这个身份已被删除')
          return
        }
        const nextUser = { ...user, recoveryCode: found.recovery_code }
        setLocalUser(roomId, nextUser)
        setUser(nextUser)
      } catch {
        alert('找回码获取失败，请重试')
        return
      } finally {
        setLoading(false)
      }
    }
    setShowRecoveryCode(true)
  }

  const handleCopyRecoveryCode = () => {
    if (!user?.recoveryCode || !navigator.clipboard) return
    navigator.clipboard.writeText(user.recoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCloseUpdate = () => {
    setSeenUpdateVersion(UPDATE_VERSION)
    setShowUpdate(false)
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
          <>
            <p className="text-xs text-gray-400 mt-1">
              累计 {myStats.total} 次 · 连续 {myStats.streak} 天
            </p>
            {(myStats.levelTitle || myStats.statusTitle || myStats.timeTitle) && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                <TitleTag title={myStats.levelTitle} />
                <TitleTag title={myStats.statusTitle} />
                <TitleTag title={myStats.timeTitle} />
              </div>
            )}
          </>
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
      {pendingCheckinId && undoCountdown > 0 && (
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
        {TAB_OPTIONS.map(([key, label]) => (
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
          <RankingList ranking={rankMode === 'week' ? visibleWeekRanking : visibleRanking} currentUserId={user.id} />
        </div>
      )}
      {tab === 'feed' && <TodayFeed ranking={ranking} currentUserId={user.id} />}
      {tab === 'calendar' && <Calendar dates={myDates} />}
      {tab === 'titles' && <TitleGallery myStats={myStats} />}

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
      >
        📢 分享到群
      </button>

      {/* Profile Actions */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <button
          onClick={() => setShowEditNickname(true)}
          className="hover:text-gray-600 transition-colors"
        >
          ✏️ 修改昵称
        </button>
        <span className="text-gray-200">|</span>
        <button
          onClick={handleShowRecoveryCode}
          className="hover:text-gray-600 transition-colors"
        >
          🔑 查看我的找回码
        </button>
      </div>

      {/* Edit Nickname Modal */}
      {showEditNickname && (
        <EditNicknameModal
          currentNickname={user.nickname}
          loading={loading}
          onCancel={() => setShowEditNickname(false)}
          onConfirm={handleConfirmNickname}
        />
      )}

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

      {/* Share Prompt Modal */}
      {shareCheer && (
        <ConfirmModal
          icon="🎉"
          title={shareCheer}
          description="要把战绩分享到群里吗？"
          cancelText="不用了"
          confirmText="分享到群"
          onCancel={() => setShareCheer(null)}
          onConfirm={handleConfirmShare}
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

      {/* Update Log Modal */}
      {showUpdate && <UpdateModal onClose={handleCloseUpdate} />}
    </div>
  )
}
