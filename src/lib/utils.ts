import type { LevelTitleId, StatusTitleId, TimeTitleId } from './types'

const EMOJIS = ['💩', '🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🐷', '🐮', '🐔', '🦄', '🐙', '👻', '🤡', '🎃']

export function randomEmoji(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
}

/** Get today's date string in Asia/Shanghai timezone */
export function getTodayDate(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
}

/** Format an ISO timestamp as HH:mm:ss in Asia/Shanghai timezone */
export function formatTime(isoTime: string): string {
  return new Date(isoTime).toLocaleTimeString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Calculate consecutive days streak ending at today */
export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const today = getTodayDate()

  // Must include today or yesterday to have a streak
  if (sorted[0] !== today && sorted[0] !== getYesterday()) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
}

/** Parse a YYYY-MM-DD string as UTC midnight, so calendar math never depends on the device timezone */
function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z')
}

/** Shift a date string by the given number of days (negative = past) */
function shiftDate(dateStr: string, days: number): string {
  const d = parseDate(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Get the Monday (YYYY-MM-DD) of the week that contains the given date string */
export function getWeekStart(dateStr: string): string {
  const day = parseDate(dateStr).getUTCDay() // 0 = Sunday, 1 = Monday, ...
  return shiftDate(dateStr, -(day === 0 ? 6 : day - 1))
}

/** Get the Monday keys of the most recent weeks, newest first (including the current week) */
export function getRecentWeekStarts(count = 8): string[] {
  const thisWeek = getWeekStart(getTodayDate())
  return Array.from({ length: count }, (_, i) => shiftDate(thisWeek, -7 * i))
}

/** Format a week (by its Monday) as 本周 / 上周 / "MM-DD ~ MM-DD" */
export function formatWeekLabel(weekStart: string): string {
  const thisWeek = getWeekStart(getTodayDate())
  if (weekStart === thisWeek) return '本周'
  if (weekStart === shiftDate(thisWeek, -7)) return '上周'
  return `${weekStart.slice(5)} ~ ${shiftDate(weekStart, 6).slice(5)}`
}

/** Convert an ISO timestamp to a YYYY-MM-DD date string in Asia/Shanghai */
export function toDateString(isoTime: string): string {
  return new Date(isoTime).toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
}

/** Get the hour (0-23) of an ISO timestamp in Asia/Shanghai */
export function getHour(isoTime: string): number {
  return Number(new Date(isoTime).toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).slice(11, 13))
}

/** Number of days from one date string to another (both YYYY-MM-DD) */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000)
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** Format a date string as "MM-DD 周x" for display */
export function formatDateWithWeekday(dateStr: string): string {
  return `${dateStr.slice(5)} ${WEEKDAY_LABELS[parseDate(dateStr).getUTCDay()]}`
}

/** Get all dates (YYYY-MM-DD) that are in the past relative to today and not yet checked in, within a lookback window */
export function getMakeupCandidateDates(checkedDates: string[], lookbackDays = 14): string[] {
  const checkedSet = new Set(checkedDates)
  const today = getTodayDate()
  return Array.from({ length: lookbackDays }, (_, i) => shiftDate(today, -(i + 1)))
    .filter(date => !checkedSet.has(date))
}

/** 主线称号门槛，从高到低排列 */
export const LEVEL_RULES: Array<{ id: LevelTitleId; total: number }> = [
  { id: 'enlighten', total: 60 },
  { id: 'dragon', total: 30 },
  { id: 'legend', total: 25 },
  { id: 'rocket', total: 20 },
  { id: 'master', total: 15 },
  { id: 'stable', total: 10 },
  { id: 'punctual', total: 7 },
  { id: 'warmup', total: 5 },
  { id: 'pipe', total: 3 },
  { id: 'rookie', total: 1 },
]

/** 连续中的支线称号，从高到低排列 */
export const STREAK_RULES: Array<{ id: StatusTitleId; streak: number }> = [
  { id: 'perpetual', streak: 14 },
  { id: 'god', streak: 10 },
  { id: 'unshakable', streak: 7 },
  { id: 'iron', streak: 5 },
  { id: 'combo3', streak: 3 },
]

/** 断更后的支线称号，按已断天数从多到少排列 */
export const DROUGHT_RULES: Array<{ id: StatusTitleId; days: number }> = [
  { id: 'fossil', days: 7 },
  { id: 'cobweb', days: 5 },
  { id: 'dormant', days: 3 },
  { id: 'drought', days: 2 },
]

/** 时段称号的区间（Asia/Shanghai 小时），from > to 表示跨天 */
export const TIME_BUCKETS: Array<{ id: TimeTitleId; from: number; to: number }> = [
  { id: 'morning', from: 5, to: 8 },
  { id: 'paid', from: 9, to: 11 },
  { id: 'afternoon', from: 12, to: 17 },
  { id: 'night', from: 18, to: 22 },
  { id: 'midnight', from: 23, to: 4 },
]

/** 打卡次数太少时时段分布没有代表性，不给时段称号 */
const TIME_TITLE_MIN_CHECKINS = 5

/** 主线称号：累计次数达到的最高档 */
export function getLevelTitle(total: number): LevelTitleId | null {
  return LEVEL_RULES.find(r => total >= r.total)?.id ?? null
}

/** 支线称号：连续中给正称号，断更 2 天以上给负称号，从未打卡则没有称号 */
export function getStatusTitle(streak: number, daysSinceLast: number | null): StatusTitleId | null {
  if (daysSinceLast === null) return null
  if (daysSinceLast >= 2) return DROUGHT_RULES.find(r => daysSinceLast >= r.days)?.id ?? null
  return STREAK_RULES.find(r => streak >= r.streak)?.id ?? null
}

/** 时段称号：历史打卡时间点落得最多的那个区间 */
export function getTimeTitle(hours: number[]): TimeTitleId | null {
  if (hours.length < TIME_TITLE_MIN_CHECKINS) return null

  const counts = new Map<TimeTitleId, number>()
  for (const hour of hours) {
    const bucket = TIME_BUCKETS.find(b => (
      b.from > b.to ? hour >= b.from || hour <= b.to : hour >= b.from && hour <= b.to
    ))
    if (bucket) counts.set(bucket.id, (counts.get(bucket.id) ?? 0) + 1)
  }

  // 并列时取 TIME_BUCKETS 中靠前的，保证结果稳定
  let best = TIME_BUCKETS[0].id
  for (const { id } of TIME_BUCKETS) {
    if ((counts.get(id) ?? 0) > (counts.get(best) ?? 0)) best = id
  }
  return best
}

const STORAGE_KEY_PREFIX = 'poop_user_'

export function getLocalUser(roomId: string): { id: string; nickname: string; emoji: string; recoveryCode: string } | null {
  const raw = localStorage.getItem(STORAGE_KEY_PREFIX + roomId)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setLocalUser(roomId: string, user: { id: string; nickname: string; emoji: string; recoveryCode: string }) {
  localStorage.setItem(STORAGE_KEY_PREFIX + roomId, JSON.stringify(user))
}

export function clearLocalUser(roomId: string) {
  localStorage.removeItem(STORAGE_KEY_PREFIX + roomId)
}

/** 已读过的更新日志版本，跨房间共享（更新内容与房间无关） */
const SEEN_UPDATE_KEY = 'poop_seen_update'

export function getSeenUpdateVersion(): string | null {
  return localStorage.getItem(SEEN_UPDATE_KEY)
}

export function setSeenUpdateVersion(version: string) {
  localStorage.setItem(SEEN_UPDATE_KEY, version)
}

/** Generate an 8-char recovery code (uppercase letters + digits) */
export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉容易混淆的 0/O/1/I
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
