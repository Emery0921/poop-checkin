import { supabase } from './supabase'
import { getTodayDate } from './utils'
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
  const { data, error } = await supabase
    .from('users')
    .insert({ id, nickname, emoji, room_id: roomId })
    .select()
    .single()

  if (error) throw error
  return data as User
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

/** Get today's checkin count for a user */
export async function getTodayCheckinCount(userId: string, roomId: string): Promise<number> {
  const date = getTodayDate()
  const { count } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .eq('date', date)

  return count ?? 0
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
    .select('user_id, date')
    .eq('room_id', roomId)
    .order('date', { ascending: false })

  if (!checkins) return []

  // Build ranking
  const checkinsPerUser = new Map<string, string[]>()

  for (const c of checkins) {
    const list = checkinsPerUser.get(c.user_id) || []
    list.push(c.date)
    checkinsPerUser.set(c.user_id, list)
  }

  const today = getTodayDate()
  const ranking: RankItem[] = users.map(u => {
    const dates = checkinsPerUser.get(u.id) || []
    return {
      user_id: u.id,
      nickname: u.nickname,
      emoji: u.emoji,
      total: dates.length,
      streak: calcStreakFromDates(dates),
      checkedToday: dates.includes(today),
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
