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

/** Generate an 8-char recovery code (uppercase letters + digits) */
export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉容易混淆的 0/O/1/I
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
