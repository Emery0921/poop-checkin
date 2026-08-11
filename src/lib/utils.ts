const EMOJIS = ['💩', '🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🐷', '🐮', '🐔', '🦄', '🐙', '👻', '🤡', '🎃']

export function randomEmoji(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
}

/** Get today's date string in Asia/Shanghai timezone */
export function getTodayDate(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
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
