import { supabase } from './supabase'
import { getTodayDate, generateRecoveryCode } from './utils'
import type { User, Checkin, RankItem } from './types'

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

/** Get ranking for a room */
export async function getRanking(roomId: string): Promise<RankItem[]> {
  // Get all users in the room
  const { data: users } = await supabase
    .from('users')
    .select('id, nickname, emoji')
    .eq('room_id', roomId)

  if (!users || users.length === 0) return []

  // Get all checkins for the room
  const { data: checkins } = await supabase
    .from('checkins')
    .select('user_id, date, created_at')
    .eq('room_id', roomId)
    .order('date', { ascending: false })

  if (!checkins) return []

  // Build ranking
  const checkinsPerUser = new Map<string, string[]>()
  const todayTimesPerUser = new Map<string, string[]>()

  const today = getTodayDate()
  for (const c of checkins) {
    const list = checkinsPerUser.get(c.user_id) || []
    list.push(c.date)
    checkinsPerUser.set(c.user_id, list)

    if (c.date === today) {
      const times = todayTimesPerUser.get(c.user_id) || []
      times.push(c.created_at)
      todayTimesPerUser.set(c.user_id, times)
    }
  }

  const ranking: RankItem[] = users.map(u => {
    const dates = checkinsPerUser.get(u.id) || []
    const todayTimes = (todayTimesPerUser.get(u.id) || []).sort()
    return {
      user_id: u.id,
      nickname: u.nickname,
      emoji: u.emoji,
      total: dates.length,
      streak: calcStreakFromDates(dates),
      checkedToday: todayTimes.length > 0,
      todayTimes,
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

function getYesterdayDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
}
