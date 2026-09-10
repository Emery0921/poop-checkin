import type { LevelTitleId, Rarity, StatusTitleId, TimeTitleId, TitleId } from './types'

/** 打卡吐槽的最大长度，太长动态流放不下 */
export const NOTE_MAX_LENGTH = 20

/** 稀有掉落概率，必须从稀有到常见排列，按顺序累加判定、命中即停；合计 16.7% */
export const RARITY_RULES: Array<{ id: Rarity; chance: number }> = [
  { id: 'alien', chance: 0.002 },
  { id: 'diamond', chance: 0.005 },
  { id: 'rainbow', chance: 0.01 },
  { id: 'gold', chance: 0.05 },
  { id: 'silver', chance: 0.1 },
]

/** 稀有掉落展示信息 */
export const RARITY_META: Record<Rarity, { icon: string; name: string; cheer: string }> = {
  alien: { icon: '👽', name: '外星💩', cheer: '外星💩！千分之二的传说，截图留证 👽' },
  diamond: { icon: '💎', name: '钻石💩', cheer: '钻石💩！硬得发光 💎' },
  rainbow: { icon: '🌈', name: '彩虹💩', cheer: '彩虹💩！百里挑一的运气 🌈' },
  gold: { icon: '🥇', name: '金💩', cheer: '金💩 落地，今天财运不错 🥇' },
  silver: { icon: '🥈', name: '银💩', cheer: '银💩 到手，也算小赚 🥈' },
}

/**
 * 稀有掉落对应的实物奖品，只有低概率三档有，空字符串表示纯装饰。
 * 中奖即生成一张带券码的奖券，线下兑付后在「我的奖券」里标记已兑换。
 */
export const RARITY_REWARD: Record<Rarity, string> = {
  alien: '星巴克',
  diamond: '奶茶',
  rainbow: '瑞幸',
  gold: '',
  silver: '',
}

/** 上周冠军本周挂的皇冠 */
export const CHAMPION_ICON = '👑'

/** 每天最多允许撤回几次，防止靠反复打卡撤回来刷稀有掉落 */
export const MAX_UNDO_PER_DAY = 2

/** 累计撤回达到这个次数，就在排行榜公开标记 */
export const UNDO_MARK_THRESHOLD = 2

/** 撤回标记的图标 */
export const UNDO_ICON = '🔁'

/** 加入时随机分配的头像候选 */
export const EMOJIS = ['💩', '🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🐷', '🐮', '🐔', '🦄', '🐙', '👻', '🤡', '🎃']

/** 昵称最大长度 */
export const NICKNAME_MAX_LENGTH = 12

/** 上传头像压缩后的边长（正方形），base64 直接存库，别调太大 */
export const AVATAR_SIZE = 128

/** 头像压缩质量 */
export const AVATAR_QUALITY = 0.7

/** 允许选择的原图大小上限，超过直接拒绝，避免在手机上解码巨图卡死 */
export const MAX_AVATAR_FILE_SIZE = 10 * 1024 * 1024

/** 头像展示尺寸：md 用于排行榜，sm 用于动态列表 */
export const AVATAR_SIZE_CLASS = {
  sm: { box: 'w-6 h-6', text: 'text-xl' },
  md: { box: 'w-8 h-8', text: 'text-2xl' },
}

/** 打卡后可撤回的秒数 */
export const UNDO_DURATION = 180

/** 每周补卡机会上限 */
export const MAKEUP_QUOTA_PER_WEEK = 1

/** 补卡可选日期的回看天数 */
export const MAKEUP_LOOKBACK_DAYS = 14

/** 周榜可回看的周数 */
export const RECENT_WEEK_COUNT = 8

/** 排行榜模式 */
export const RANK_MODE_OPTIONS = [['week', '周榜'], ['all', '总榜']] as const

export type RankMode = (typeof RANK_MODE_OPTIONS)[number][0]

/** 首页内容分区 */
export const TAB_OPTIONS = [
  ['rank', '🏆 排行'],
  ['feed', '⚡ 动态'],
  ['calendar', '📅 日历'],
  ['titles', '🎖️ 称号'],
] as const

export type TabKey = (typeof TAB_OPTIONS)[number][0]

/** 排行榜前三名的奖牌 */
export const MEDAL_MAP: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

/** 打卡成功后的随机吐槽，每次打卡换一句 */
export const CHEERS = [
  '一泻千里，畅通无阻 🚀',
  '今日份废料已清空 ♻️',
  '肠道通畅，人生顺畅 ✨',
  '这一泡，气吞山河 🌊',
  '轻装上阵，神清气爽 🍃',
  '恭喜卸货，重量级选手 🏋️',
  '排空成功，身轻如燕 🕊️',
  '又是一次完美的输出 🎯',
]

/** 白天的「最后一个」只是「最新一条」，没有信息量，只有到了这个点之后才算真的收尾 */
export const LAST_BADGE_FROM_HOUR = 22

/** 日历表头的星期文案 */
export const CALENDAR_WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/** 日历格子按当天打卡次数逐级加深，索引 0 对应 1 次，超过档位数按最后一档 */
export const CALENDAR_LEVEL_CLASS = [
  'bg-purple-100 text-purple-700',
  'bg-purple-200 text-purple-800',
  'bg-purple-300 text-purple-900',
  'bg-purple-500 text-white',
]

/** 日期文案里的星期，索引与 Date.getUTCDay() 对齐 */
export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 身份信息按房间存，key 为 poop_user_<roomId> */
export const USER_STORAGE_KEY_PREFIX = 'poop_user_'

/** 已读过的更新日志版本，跨房间共享（更新内容与房间无关） */
export const SEEN_UPDATE_KEY = 'poop_seen_update'

/**
 * 更新日志版本号。有需要告知用户的改动时改这里，
 * 与 localStorage 里已读的版本不一致时，老用户进入会弹一次。
 */
export const UPDATE_VERSION = '2026-09-10'

/** 更新日志弹窗里展示的条目，与版本号同步维护 */
export const UPDATE_ITEMS = [
  '打卡有概率掉稀有 💩，外星 / 钻石 / 彩虹三档还能掉实物奖券',
  '打卡可以填一句吐槽，动态里能看到',
  '每天最多撤回 2 次，撤回多了排行榜会公开标记',
  '日历按当天打卡次数颜色逐级加深',
]

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
export const TIME_TITLE_MIN_CHECKINS = 5

/** 断更两天起算，达到该间隔才把连续称号换成断更称号 */
export const DROUGHT_FROM_DAYS = 2

/** 距上次打卡超过这个天数就不参与排名（自己除外，否则会看不到自己的数据） */
export const HIDE_FROM_RANK_AFTER_DAYS = 5

/** 称号展示信息：名称、图标、解锁条件文案、标签配色 */
export const TITLES: Record<TitleId, { name: string; icon: string; desc: string; className: string }> = {
  // 主线：累计次数，只涨不掉
  rookie: { name: '蹲坑新人', icon: '🚽', desc: '累计打卡 1 次', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  pipe: { name: '初通管道', icon: '💧', desc: '累计打卡 3 次', className: 'bg-sky-50 text-sky-600 border-sky-200' },
  warmup: { name: '渐入佳境', icon: '📅', desc: '累计打卡 5 次', className: 'bg-teal-50 text-teal-600 border-teal-200' },
  punctual: { name: '准时老手', icon: '⏰', desc: '累计打卡 7 次', className: 'bg-green-50 text-green-600 border-green-200' },
  stable: { name: '稳定输出', icon: '🎯', desc: '累计打卡 10 次', className: 'bg-lime-50 text-lime-600 border-lime-200' },
  master: { name: '通畅大师', icon: '💎', desc: '累计打卡 15 次', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  rocket: { name: '一泻千里', icon: '🚀', desc: '累计打卡 20 次', className: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  legend: { name: '排便传奇', icon: '🏆', desc: '累计打卡 25 次', className: 'bg-purple-50 text-purple-600 border-purple-200' },
  dragon: { name: '肠道真龙', icon: '🐉', desc: '累计打卡 30 次', className: 'bg-rose-50 text-rose-600 border-rose-200' },
  enlighten: { name: '修成正果', icon: '🧘', desc: '累计打卡 60 次', className: 'bg-amber-50 text-amber-600 border-amber-200' },

  // 支线（连续中）：连续天数，会掉
  combo3: { name: '三日连击', icon: '🌱', desc: '连续打卡 3 天', className: 'bg-green-50 text-green-600 border-green-200' },
  iron: { name: '铁打作息', icon: '🔥', desc: '连续打卡 5 天', className: 'bg-orange-50 text-orange-600 border-orange-200' },
  unshakable: { name: '雷打不动', icon: '⚡', desc: '连续打卡 7 天', className: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  god: { name: '肠道之神', icon: '👑', desc: '连续打卡 10 天', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  perpetual: { name: '通畅永动机', icon: '🌟', desc: '连续打卡 14 天', className: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' },

  // 支线（断更中）：与上面互斥
  drought: { name: '有点干旱', icon: '🌵', desc: '已断更 2 天', className: 'bg-stone-50 text-stone-500 border-stone-200' },
  dormant: { name: '肠道休眠', icon: '💤', desc: '已断更 3 天', className: 'bg-slate-50 text-slate-500 border-slate-200' },
  cobweb: { name: '结蛛网了', icon: '🕸️', desc: '已断更 5 天', className: 'bg-neutral-100 text-neutral-500 border-neutral-300' },
  fossil: { name: '已石化', icon: '🗿', desc: '已断更 7 天', className: 'bg-zinc-100 text-zinc-500 border-zinc-300' },

  // 时段：打卡时间点分布，无高低之分
  morning: { name: '闻鸡起蹲', icon: '🐓', desc: '多在 05:00-08:59 打卡', className: 'bg-orange-50 text-orange-500 border-orange-200' },
  paid: { name: '带薪蹲坑', icon: '💼', desc: '多在 09:00-11:59 打卡', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  afternoon: { name: '午后放松', icon: '🍚', desc: '多在 12:00-17:59 打卡', className: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  night: { name: '夜间作业', icon: '🌙', desc: '多在 18:00-22:59 打卡', className: 'bg-violet-50 text-violet-600 border-violet-200' },
  midnight: { name: '午夜惊魂', icon: '🦉', desc: '多在 23:00-04:59 打卡', className: 'bg-indigo-50 text-indigo-500 border-indigo-200' },
}

/** 称号标签尺寸：md 用于称号图鉴等展示场景，sm 用于排行榜等紧凑场景 */
export const TITLE_TAG_SIZE_CLASS = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
}

export type TitleCategoryKey = 'level' | 'streak' | 'drought' | 'time'

/** 称号图鉴的分类页签 */
export const TITLE_CATEGORY_OPTIONS: Array<[TitleCategoryKey, string]> = [
  ['level', '🏅 主线'],
  ['streak', '🔥 连续'],
  ['drought', '🌵 断更'],
  ['time', '⏱ 时段'],
]

/** 称号图鉴每个分类的评定说明 */
export const TITLE_CATEGORY_HINTS: Record<TitleCategoryKey, string> = {
  level: '按累计打卡次数解锁，拿到就不会掉',
  streak: '按当前连续天数获得，断一天就掉档',
  drought: '连续两天没打卡自动挂上，与连续称号互斥',
  time: '看打卡时间点最集中的时段，满 5 次才评定',
}

