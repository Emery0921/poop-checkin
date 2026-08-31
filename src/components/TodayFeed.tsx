import type { RankItem } from '../lib/types'
import { LAST_BADGE_FROM_HOUR } from '../lib/dicts'
import { formatTime, getHour } from '../lib/utils'

interface Props {
  ranking: RankItem[]
  currentUserId: string
}

/** 今日动态：把全房间今天的打卡按时间倒序排成一条流水，最早的一条挂「今日首拉」 */
export function TodayFeed({ ranking, currentUserId }: Props) {
  const items = ranking
    .flatMap(r => r.todayTimes.map(time => ({ time, emoji: r.emoji, nickname: r.nickname, userId: r.user_id })))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <p className="text-4xl mb-2">🌙</p>
        <p className="text-sm text-gray-400">今天还没有人打卡，快去抢首拉</p>
      </div>
    )
  }

  // 倒序排列后最后一条就是今天最早的那次打卡
  const firstTime = items[items.length - 1].time
  const lastTime = items[0].time
  const showLastBadge = getHour(new Date().toISOString()) >= LAST_BADGE_FROM_HOUR

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3">
      {items.map(item => (
        <div key={`${item.userId}-${item.time}`} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-gray-400 tabular-nums">{formatTime(item.time)}</span>
          <span className="text-xl">{item.emoji}</span>
          <span className={`flex-1 text-sm ${item.userId === currentUserId ? 'font-medium text-purple-600' : ''}`}>
            {item.nickname}
          </span>
          {item.time === firstTime && (
            <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-[10px] leading-none text-amber-600 whitespace-nowrap">
              🐓 今日首拉
            </span>
          )}
          {showLastBadge && item.time === lastTime && item.time !== firstTime && (
            <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded-md text-[10px] leading-none text-indigo-500 whitespace-nowrap">
              🦉 今日收尾
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
