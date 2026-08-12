export interface User {
  id: string
  nickname: string
  emoji: string
  room_id: string
  recovery_code: string
  created_at: string
}

export interface Checkin {
  id: string
  user_id: string
  room_id: string
  date: string // YYYY-MM-DD in Asia/Shanghai
  created_at: string
  note?: string
}

export interface RankItem {
  user_id: string
  nickname: string
  emoji: string
  total: number
  streak: number
  checkedToday: boolean
  todayTimes: string[] // ISO timestamps of today's checkins
}
