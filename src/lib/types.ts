export interface User {
  id: string
  nickname: string
  emoji: string
  room_id: string
  recovery_code: string
  /** 上传的头像，压缩后的 base64；为空则展示 emoji */
  avatar_url?: string | null
  created_at: string
}

export interface Checkin {
  id: string
  user_id: string
  room_id: string
  date: string // YYYY-MM-DD in Asia/Shanghai
  created_at: string
  note?: string
  is_makeup?: boolean
}

/** 主线称号：按累计次数，只涨不掉 */
export type LevelTitleId =
  | 'rookie' | 'pipe' | 'warmup' | 'punctual' | 'stable'
  | 'master' | 'rocket' | 'legend' | 'dragon' | 'enlighten'

/** 支线称号：状态型。连续中挂正称号，断更后挂负称号，两者互斥 */
export type StatusTitleId =
  | 'combo3' | 'iron' | 'unshakable' | 'god' | 'perpetual'
  | 'drought' | 'dormant' | 'cobweb' | 'fossil'

/** 时段称号：按历史打卡时间点的分布，无高低之分 */
export type TimeTitleId = 'morning' | 'paid' | 'afternoon' | 'night' | 'midnight'

export type TitleId = LevelTitleId | StatusTitleId | TimeTitleId

export interface RankItem {
  user_id: string
  nickname: string
  emoji: string
  /** 上传的头像，为空则回退到 emoji */
  avatarUrl: string | null
  total: number
  streak: number
  checkedToday: boolean
  todayTimes: string[] // ISO timestamps of today's checkins
  /** 距上次打卡的天数，从未打卡为 null；始终按全部历史计算，周榜里也一致 */
  daysSinceLast: number | null
  // 三个称号槽位始终按总榜数据计算，周榜里也保持一致
  levelTitle: LevelTitleId | null
  statusTitle: StatusTitleId | null
  timeTitle: TimeTitleId | null
}
