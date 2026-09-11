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

/** 稀有掉落，普通打卡为 null */
export type Rarity = 'alien' | 'diamond' | 'rainbow' | 'gold' | 'silver'

export interface Checkin {
  id: string
  user_id: string
  room_id: string
  date: string // YYYY-MM-DD in Asia/Shanghai
  created_at: string
  note?: string | null
  is_makeup?: boolean
  rarity?: Rarity | null
  /** 实物奖券是否已兑换 */
  reward_claimed?: boolean
  /** 已撤回。撤回改为软删除，否则无法统计撤回次数 */
  cancelled?: boolean
}

/** 一张实物奖券，由带奖品的稀有掉落生成 */
export interface RewardTicket {
  checkinId: string
  /** 券码，取打卡记录 id 前 8 位 */
  code: string
  rarity: Rarity
  reward: string
  createdAt: string
  claimed: boolean
}

/** 今天的一次打卡，用于动态流与排行榜展示 */
export interface TodayCheckin {
  time: string
  note: string | null
  rarity: Rarity | null
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
  todayCheckins: TodayCheckin[]
  /** 累计掉落记录，按发生时间正序，用于按掉落顺序展示图标 */
  rarityHistory: Rarity[]
  /** 各类稀有掉落的累计数量 */
  rarityCounts: Record<Rarity, number>
  /** 上周打卡最多的人，本周挂皇冠 */
  isLastWeekChampion: boolean
  /** 累计撤回次数，达到阈值会在榜上公开标记 */
  undoCount: number
  /** 今天已撤回次数，用于限制继续撤回 */
  todayUndoCount: number
  /** 距上次打卡的天数，从未打卡为 null；始终按全部历史计算，周榜里也一致 */
  daysSinceLast: number | null
  // 三个称号槽位始终按总榜数据计算，周榜里也保持一致
  levelTitle: LevelTitleId | null
  statusTitle: StatusTitleId | null
  timeTitle: TimeTitleId | null
}
