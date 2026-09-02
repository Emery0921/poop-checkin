import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { getTodayDate, getWeekStart } from '../lib/utils'
import type { Checkin, RankItem } from '../lib/types'

/**
 * 首页所有远端数据的读取与刷新。
 * 一次 reload 覆盖排行榜（周榜 + 总榜）、今日打卡、我的打卡日期、补卡配额；
 * 页面重新可见时会自动刷新一次。
 */
export function useHomeData(user: { id: string } | null, roomId: string) {
  const [ranking, setRanking] = useState<RankItem[]>([])
  const [weekRanking, setWeekRanking] = useState<RankItem[]>([])
  const [todayCheckins, setTodayCheckins] = useState<Checkin[]>([])
  const [myDates, setMyDates] = useState<string[]>([])
  const [makeupRemaining, setMakeupRemaining] = useState(0)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(getTodayDate()))

  const reload = useCallback(
    async () => {
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
    },
    [user, roomId, weekStart]
  )

  // 首次进入与切换周次时拉取，失败就先展示空列表，等下次刷新
  useEffect(() => { reload().catch(() => {}) }, [reload])

  // 微信里切走再切回来是最常见的场景，回到前台自动拉一次，用户不用感知「刷新」
  useEffect(
    () => {
      const handleVisibilityChange = () => {
        // 后台静默刷新，失败不打扰用户，下次切回来还会再试
        if (document.visibilityState === 'visible') reload().catch(() => {})
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    },
    [reload]
  )

  /** 打卡成功后先本地加一条，不等刷新回来 */
  const addTodayCheckin = useCallback((checkin: Checkin) => {
    setTodayCheckins(prev => [...prev, checkin])
  }, [])

  /** 撤回成功后本地移除对应记录 */
  const removeTodayCheckin = useCallback((checkinId: string) => {
    setTodayCheckins(prev => prev.filter(c => c.id !== checkinId))
  }, [])

  /** 落库时才发现配额已用完，本地同步为 0，避免按钮还是可点的 */
  const markMakeupExhausted = useCallback(() => setMakeupRemaining(0), [])

  return {
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
  }
}
