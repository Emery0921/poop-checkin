import type { RankItem } from '../lib/types'

interface Props {
  ranking: RankItem[]
  currentUserId: string
}

export function RankingList({ ranking, currentUserId }: Props) {
  if (ranking.length === 0) {
    return <p className="text-center text-gray-400 py-8">还没有人打卡，快来第一个！</p>
  }

  const medalMap: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

  return (
    <div className="space-y-2">
      {ranking.map((item, idx) => (
        <div
          key={item.user_id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
            item.user_id === currentUserId ? 'bg-purple-50 border border-purple-200' : 'bg-white'
          }`}
        >
          <span className="text-lg w-8 text-center">
            {medalMap[idx] ?? <span className="text-gray-400 text-sm">{idx + 1}</span>}
          </span>
          <span className="text-2xl">{item.emoji}</span>
          <div className="flex-1 text-left">
            <p className="font-medium text-sm flex items-center gap-1">
              {item.nickname}
              {item.checkedToday && <span className="text-xs text-green-500">✅ 今日已打卡</span>}
            </p>
            <p className="text-xs text-gray-400">
              🔥 连续{item.streak}天
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-purple-600">{item.total}</p>
            <p className="text-xs text-gray-400">次</p>
          </div>
        </div>
      ))}
    </div>
  )
}
