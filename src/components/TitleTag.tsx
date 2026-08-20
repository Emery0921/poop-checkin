import type { TitleId } from '../lib/types'

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

interface Props {
  title: TitleId | null
  /** md 用于称号图鉴等展示场景，默认 sm 用于排行榜等紧凑场景 */
  size?: 'sm' | 'md'
}

const SIZE_CLASS = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
}

export function TitleTag({ title, size = 'sm' }: Props) {
  if (!title) return null

  const { name, icon, desc, className } = TITLES[title]
  return (
    <span
      className={`border rounded-md leading-none whitespace-nowrap ${SIZE_CLASS[size]} ${className}`}
      title={desc}
    >
      {icon} {name}
    </span>
  )
}

/** 把若干称号拼成纯文本（分享文案用），如「🏆 排便传奇 · 🔥 铁打作息」 */
export function formatTitleText(titles: Array<TitleId | null>): string {
  return titles
    .filter((t): t is TitleId => t !== null)
    .map(t => `${TITLES[t].icon} ${TITLES[t].name}`)
    .join(' · ')
}
