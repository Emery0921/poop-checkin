import { supabase } from './supabase'
import { MAKEUP_QUOTA_PER_WEEK, RARITY_REWARD } from './dicts'
import {
  getTodayDate,
  emptyRarityCounts,
  generateRecoveryCode,
  getRecentWeekStarts,
  getWeekStart,
  rollRarity,
  toDateString,
  getLevelTitle,
  getStatusTitle,
  getTimeTitle,
  daysBetween,
  getHour,
} from './utils'
import type { Rarity, User, Checkin, RankItem, RewardTicket, TodayCheckin } from './types'

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

/** Fetch a user by id within a room（用于补齐本地缺失的身份字段） */
export async function getUser(userId: string, roomId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .eq('room_id', roomId)
    .maybeSingle()

  if (error) throw error
  return data as User | null
}

/**
 * 更新 users 表的部分字段。
 * users 表缺 update 策略时 RLS 不报错，只是一行都改不到，所以必须显式判空，否则前端会假装成功。
 */
async function updateUser(
  userId: string,
  roomId: string,
  patch: Partial<Pick<User, 'nickname' | 'avatar_url'>>
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', userId)
    .eq('room_id', roomId)
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('修改未能写入，请确认 users 表已开启 update 策略')
  return data as User
}

/** Rename a user within a room */
export async function updateNickname(userId: string, roomId: string, nickname: string): Promise<User> {
  return updateUser(userId, roomId, { nickname })
}

/** 更新头像，传 null 表示恢复用 emoji */
export async function updateAvatar(userId: string, roomId: string, avatarUrl: string | null): Promise<User> {
  return updateUser(userId, roomId, { avatar_url: avatarUrl })
}

/** Check whether an error is a Postgres foreign key violation (e.g. user_id no longer exists) */
export function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23503'
}

/** Perform check-in（每次打卡都掷一次稀有掉落） */
export async function checkin(userId: string, roomId: string, note?: string): Promise<Checkin> {
  const date = getTodayDate()
  const { data, error } = await supabase
    .from('checkins')
    .insert({ user_id: userId, room_id: roomId, date, note: note || null, rarity: rollRarity() })
    .select()
    .single()

  if (error) throw error
  return data as Checkin
}

/**
 * 撤回打卡。改为软删除：真删了就无从统计撤回次数，
 * 也就挡不住「打卡→看掉落→撤回重摇」这种刷法。
 */
export async function cancelCheckin(checkinId: string): Promise<void> {
  const { data, error } = await supabase
    .from('checkins')
    .update({ cancelled: true })
    .eq('id', checkinId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  // checkins 缺 update 策略时 RLS 不报错，只是一行都改不到
  if (!data) throw new Error('撤回未能写入，请确认 checkins 表已开启 update 策略')
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
    .eq('cancelled', false)

  // 查询失败时按「已用完」处理，宁可少给机会也不超额
  if (error) return { used: MAKEUP_QUOTA_PER_WEEK, remaining: 0 }

  const usedThisWeek = (data || []).filter(c => getWeekStart(toDateString(c.created_at)) === weekStart).length
  return { used: usedThisWeek, remaining: Math.max(0, MAKEUP_QUOTA_PER_WEEK - usedThisWeek) }
}

/** 我的实物奖券，按获得时间倒序；只有带奖品的稀有档位才会成券 */
export async function getMyRewards(userId: string, roomId: string): Promise<RewardTicket[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('id, created_at, rarity, reward_claimed')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .not('rarity', 'is', null)
    // 撤回掉的那次打卡不该留着奖券，否则就是「中奖→撤回→重摇」白拿
    .eq('cancelled', false)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || [])
    .filter(c => RARITY_REWARD[c.rarity as Rarity])
    .map(c => ({
      checkinId: c.id,
      // 券码直接取打卡记录 id 的前 8 位，天然唯一，兑付时也能反查到是哪次打卡
      code: c.id.slice(0, 8).toUpperCase(),
      rarity: c.rarity as Rarity,
      reward: RARITY_REWARD[c.rarity as Rarity],
      createdAt: c.created_at,
      claimed: Boolean(c.reward_claimed),
    }))
}

/** 标记奖券已兑换 */
export async function claimReward(checkinId: string): Promise<void> {
  const { data, error } = await supabase
    .from('checkins')
    .update({ reward_claimed: true })
    .eq('id', checkinId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  // checkins 缺 update 策略时 RLS 不报错，只是一行都改不到
  if (!data) throw new Error('核销未能写入，请确认 checkins 表已开启 update 策略')
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
    .eq('cancelled', false)
    .order('created_at', { ascending: true })

  return (data as Checkin[]) || []
}

/** Get both the all-time ranking and the ranking of the given week (Monday key) in one round-trip */
export async function getRankings(
  roomId: string,
  weekStart: string
): Promise<{ all: RankItem[]; week: RankItem[] }> {
  // Get all users in the room
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, nickname, emoji, avatar_url')
    .eq('room_id', roomId)

  // 请求失败必须抛出，否则调用方会把「拉取失败」当成「房间是空的」而清空榜单
  if (usersError) throw usersError
  if (!users || users.length === 0) return { all: [], week: [] }

  // Get all checkins for the room
  const { data: allRows, error: checkinsError } = await supabase
    .from('checkins')
    .select('user_id, date, created_at, note, rarity, cancelled')
    .eq('room_id', roomId)
    .order('date', { ascending: false })

  if (checkinsError) throw checkinsError
  if (!allRows) return { all: [], week: [] }

  // 撤回的记录不计入任何统计，只用来数撤回次数
  const checkins = allRows.filter(c => !c.cancelled)
  const undoStats = countUndos(allRows)

  const weekRows = checkins.filter(c => getWeekStart(c.date) === weekStart)
  const isCurrentWeek = weekStart === getWeekStart(getTodayDate())
  const champions = findLastWeekChampions(checkins)

  const all = buildRanking(users, checkins, calcStreakFromDates, true, champions, undoStats)
  // 称号、「距上次打卡天数」、稀有收集数、撤回次数都按总榜数据计算，周榜沿用同一份：
  // 周榜只有当周记录，自己算出来的天数在历史周里必然大于阈值，会把人全部误判成断更
  const allTimeMeta = new Map(all.map(r => [
    r.user_id,
    {
      daysSinceLast: r.daysSinceLast,
      rarityCounts: r.rarityCounts,
      undoCount: r.undoCount,
      todayUndoCount: r.todayUndoCount,
      levelTitle: r.levelTitle,
      statusTitle: r.statusTitle,
      timeTitle: r.timeTitle,
    },
  ]))

  return {
    all,
    // 历史周不展示「今日已打卡」，避免与所选周的数据混淆
    week: buildRanking(users, weekRows, calcMaxStreakFromDates, isCurrentWeek, champions, undoStats)
      .map(r => ({ ...r, ...allTimeMeta.get(r.user_id) })),
  }
}

type RankUser = { id: string; nickname: string; emoji: string; avatar_url?: string | null }
type RankRow = {
  user_id: string
  date: string
  created_at: string
  note?: string | null
  rarity?: Rarity | null
  cancelled?: boolean
}

type UndoStats = Map<string, { total: number; today: number }>

/** 数每个人的撤回次数：累计用于公开标记，今日用于限制继续撤回 */
function countUndos(rows: RankRow[]): UndoStats {
  const today = getTodayDate()
  const stats: UndoStats = new Map()
  for (const c of rows) {
    if (!c.cancelled) continue
    const current = stats.get(c.user_id) || { total: 0, today: 0 }
    current.total += 1
    if (c.date === today) current.today += 1
    stats.set(c.user_id, current)
  }
  return stats
}

/** 上周打卡最多的人，本周挂皇冠；并列则都算冠军 */
function findLastWeekChampions(rows: RankRow[]): Set<string> {
  const lastWeekStart = getRecentWeekStarts(2)[1]
  const countPerUser = new Map<string, number>()
  for (const c of rows) {
    if (getWeekStart(c.date) !== lastWeekStart) continue
    countPerUser.set(c.user_id, (countPerUser.get(c.user_id) ?? 0) + 1)
  }

  const top = Math.max(0, ...countPerUser.values())
  return new Set(
    [...countPerUser.entries()]
      .filter(([, count]) => count === top && count > 0)
      .map(([userId]) => userId)
  )
}

function buildRanking(
  users: RankUser[],
  rows: RankRow[],
  streakOf: (dates: string[]) => number,
  includeToday: boolean,
  champions: Set<string>,
  undoStats: UndoStats
): RankItem[] {
  const datesPerUser = new Map<string, string[]>()
  const todayPerUser = new Map<string, TodayCheckin[]>()
  const hoursPerUser = new Map<string, number[]>()
  const rarityPerUser = new Map<string, Record<Rarity, number>>()

  const today = getTodayDate()
  for (const c of rows) {
    const list = datesPerUser.get(c.user_id) || []
    list.push(c.date)
    datesPerUser.set(c.user_id, list)

    const hours = hoursPerUser.get(c.user_id) || []
    hours.push(getHour(c.created_at))
    hoursPerUser.set(c.user_id, hours)

    if (c.rarity) {
      const counts = rarityPerUser.get(c.user_id) || emptyRarityCounts()
      counts[c.rarity] += 1
      rarityPerUser.set(c.user_id, counts)
    }

    if (includeToday && c.date === today) {
      const items = todayPerUser.get(c.user_id) || []
      items.push({ time: c.created_at, note: c.note ?? null, rarity: c.rarity ?? null })
      todayPerUser.set(c.user_id, items)
    }
  }

  const ranking: RankItem[] = users.map(u => {
    const dates = datesPerUser.get(u.id) || []
    const todayCheckins = (todayPerUser.get(u.id) || [])
      .sort((a, b) => a.time.localeCompare(b.time))
    const total = dates.length
    const streak = streakOf(dates)
    // YYYY-MM-DD 字典序等于时间序，直接取最大值即最近一次打卡
    const lastDate = total > 0 ? dates.reduce((a, b) => (b > a ? b : a)) : null
    const daysSinceLast = lastDate ? daysBetween(lastDate, today) : null
    return {
      user_id: u.id,
      nickname: u.nickname,
      emoji: u.emoji,
      avatarUrl: u.avatar_url ?? null,
      total,
      streak,
      checkedToday: todayCheckins.length > 0,
      todayCheckins,
      rarityCounts: rarityPerUser.get(u.id) || emptyRarityCounts(),
      isLastWeekChampion: champions.has(u.id),
      undoCount: undoStats.get(u.id)?.total ?? 0,
      todayUndoCount: undoStats.get(u.id)?.today ?? 0,
      daysSinceLast,
      levelTitle: getLevelTitle(total),
      statusTitle: getStatusTitle(streak, daysSinceLast),
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
    .eq('cancelled', false)
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
