import { supabase } from './supabase'
import {
  getTodayDate,
  generateRecoveryCode,
  getWeekStart,
  toDateString,
  getLevelTitle,
  getStatusTitle,
  getTimeTitle,
  daysBetween,
  getHour,
} from './utils'
import type { User, Checkin, RankItem } from './types'

/** 每周补卡机会上限 */
export const MAKEUP_QUOTA_PER_WEEK = 1

/** 本周补卡机会已用完 */
export class MakeupQuotaError extends Error {
  constructor() {
    super('本周补卡机会已用完')
    this.name = 'MakeupQuotaError'
  }
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Create or get user in a room */
export async function joinRoom(roomId: string, nickname: string, emoji: string): Promise<User> {
  const id = generateUUID()
  const recoveryCode = generateRecoveryCode()
  const { data, error } = await supabase
    .from('users')
    .insert({ id, nickname, emoji, room_id: roomId, recovery_code: recoveryCode })
    .select()
    .single()

  if (error) throw error
  return data as User
}

/** Find a user by recovery code within a room */
export async function recoverUser(roomId: string, recoveryCode: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('room_id', roomId)
    .eq('recovery_code', recoveryCode.trim().toUpperCase())
    .maybeSingle()

  if (error) throw error
  return data as User | null
}

/** Check whether an error is a Postgres foreign key violation (e.g. user_id no longer exists) */
export function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23503'
}

/** Perform check-in */
export async function checkin(userId: string, roomId: string, note?: string): Promise<Checkin> {
  const date = getTodayDate()
  const { data, error } = await supabase
    .from('checkins')
    .insert({ user_id: userId, room_id: roomId, date, note })
    .select()
    .single()

  if (error) throw error
  return data as Checkin
}

/** Cancel a checkin by id */
export async function cancelCheckin(checkinId: string): Promise<void> {
  const { error } = await supabase
    .from('checkins')
    .delete()
    .eq('id', checkinId)

  if (error) throw error
}

/** Perform a makeup checkin for a past date (limited to once per calendar week, checked client-side) */
export async function makeupCheckin(userId: string, roomId: string, date: string, note?: string): Promise<Checkin> {
  // 落库前重新校验配额，避免弹窗停留期间配额已被用掉
  const { remaining } = await getMakeupQuota(userId, roomId)
  if (remaining <= 0) throw new MakeupQuotaError()

  const { data, error } = await supabase
    .from('checkins')
    .insert({ user_id: userId, room_id: roomId, date, note, is_makeup: true })
    .select()
    .single()

  if (error) throw error
  return data as Checkin
}

/** Check whether the user still has a makeup checkin quota left this week (counted by when the makeup was made) */
export async function getMakeupQuota(userId: string, roomId: string): Promise<{ used: number; remaining: number }> {
  const weekStart = getWeekStart(getTodayDate())
  const { data, error } = await supabase
    .from('checkins')
    .select('created_at')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .eq('is_makeup', true)

  // 查询失败时按「已用完」处理，宁可少给机会也不超额
  if (error) return { used: MAKEUP_QUOTA_PER_WEEK, remaining: 0 }

  const usedThisWeek = (data || []).filter(c => getWeekStart(toDateString(c.created_at)) === weekStart).length
  return { used: usedThisWeek, remaining: Math.max(0, MAKEUP_QUOTA_PER_WEEK - usedThisWeek) }
}

/** Get today's checkin count and timestamps for a user */
export async function getTodayCheckins(userId: string, roomId: string): Promise<Checkin[]> {
  const date = getTodayDate()
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .eq('date', date)
    .order('created_at', { ascending: true })

  return (data as Checkin[]) || []
}

/** Get both the all-time ranking and the ranking of the given week (Monday key) in one round-trip */
export async function getRankings(
  roomId: string,
  weekStart: string
): Promise<{ all: RankItem[]; week: RankItem[] }> {
  // Get all users in the room
  const { data: users } = await supabase
    .from('users')
    .select('id, nickname, emoji')
    .eq('room_id', roomId)

  if (!users || users.length === 0) return { all: [], week: [] }

  // Get all checkins for the room
  const { data: checkins } = await supabase
    .from('checkins')
    .select('user_id, date, created_at')
    .eq('room_id', roomId)
    .order('date', { ascending: false })

  if (!checkins) return { all: [], week: [] }

  const weekRows = checkins.filter(c => getWeekStart(c.date) === weekStart)
  const isCurrentWeek = weekStart === getWeekStart(getTodayDate())

  const all = buildRanking(users, checkins, calcStreakFromDates, true)
  // 称号按总榜数据计算，周榜沿用同一份，避免切到周榜时称号被「重置」
  const titleMap = new Map(all.map(r => [
    r.user_id,
    { levelTitle: r.levelTitle, statusTitle: r.statusTitle, timeTitle: r.timeTitle },
  ]))

  return {
    all,
    // 历史周不展示「今日已打卡」，避免与所选周的数据混淆
    week: buildRanking(users, weekRows, calcMaxStreakFromDates, isCurrentWeek)
      .map(r => ({ ...r, ...titleMap.get(r.user_id) })),
  }
}

type RankUser = { id: string; nickname: string; emoji: string }
type RankRow = { user_id: string; date: string; created_at: string }

function buildRanking(
  users: RankUser[],
  rows: RankRow[],
  streakOf: (dates: string[]) => number,
  includeToday: boolean
): RankItem[] {
  const datesPerUser = new Map<string, string[]>()
  const todayTimesPerUser = new Map<string, string[]>()
  const hoursPerUser = new Map<string, number[]>()

  const today = getTodayDate()
  for (const c of rows) {
    const list = datesPerUser.get(c.user_id) || []
    list.push(c.date)
    datesPerUser.set(c.user_id, list)

    const hours = hoursPerUser.get(c.user_id) || []
    hours.push(getHour(c.created_at))
    hoursPerUser.set(c.user_id, hours)

    if (includeToday && c.date === today) {
      const times = todayTimesPerUser.get(c.user_id) || []
      times.push(c.created_at)
      todayTimesPerUser.set(c.user_id, times)
    }
  }

  const ranking: RankItem[] = users.map(u => {
    const dates = datesPerUser.get(u.id) || []
    const todayTimes = (todayTimesPerUser.get(u.id) || []).sort()
    const total = dates.length
    const streak = streakOf(dates)
    // YYYY-MM-DD 字典序等于时间序，直接取最大值即最近一次打卡
    const lastDate = total > 0 ? dates.reduce((a, b) => (b > a ? b : a)) : null
    return {
      user_id: u.id,
      nickname: u.nickname,
      emoji: u.emoji,
      total,
      streak,
      checkedToday: todayTimes.length > 0,
      todayTimes,
      levelTitle: getLevelTitle(total),
      statusTitle: getStatusTitle(streak, lastDate ? daysBetween(lastDate, today) : null),
      timeTitle: getTimeTitle(hoursPerUser.get(u.id) || []),
    }
  })

  ranking.sort((a, b) => b.total - a.total || b.streak - a.streak)
  return ranking
}

/** Get checkin dates for calendar heatmap */
export async function getCheckinDates(userId: string, roomId: string): Promise<string[]> {
  const { data } = await supabase
    .from('checkins')
    .select('date')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .order('date', { ascending: true })

  return data?.map(d => d.date) || []
}

function calcStreakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0
  // Deduplicate dates (multiple checkins per day)
  const uniqueDates = [...new Set(dates)].sort().reverse()
  const today = getTodayDate()
  const yesterday = getYesterdayDate()

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1])
    const curr = new Date(uniqueDates[i])
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

/** Longest run of consecutive days within the given dates (used for weekly ranking) */
function calcMaxStreakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0
  const uniqueDates = [...new Set(dates)].sort()

  let max = 1
  let curr = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1])
    const day = new Date(uniqueDates[i])
    const diffDays = (day.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    curr = diffDays === 1 ? curr + 1 : 1
    max = Math.max(max, curr)
  }
  return max
}

function getYesterdayDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
}
