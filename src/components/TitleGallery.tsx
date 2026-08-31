import { useState } from 'react'
import type { RankItem, TitleId } from '../lib/types'
import type { TitleCategoryKey } from '../lib/dicts'
import {
  DROUGHT_RULES,
  LEVEL_RULES,
  STREAK_RULES,
  TIME_BUCKETS,
  TITLES,
  TITLE_CATEGORY_HINTS,
  TITLE_CATEGORY_OPTIONS,
} from '../lib/dicts'
import { TitleTag } from './TitleTag'

interface Props {
  myStats?: RankItem
}

export function TitleGallery({ myStats }: Props) {
  const [category, setCategory] = useState<TitleCategoryKey>('level')
  const total = myStats?.total ?? 0
  const streak = myStats?.streak ?? 0
  const owned = new Set([myStats?.levelTitle, myStats?.statusTitle, myStats?.timeTitle])

  // 规则数组是从高到低排的，图鉴里从低到高展示更符合「升级路线」的直觉
  const rowsOf: Record<TitleCategoryKey, Array<{ id: TitleId; dim: boolean }>> = {
    level: [...LEVEL_RULES].reverse().map(r => ({ id: r.id, dim: total < r.total })),
    streak: [...STREAK_RULES].reverse().map(r => ({ id: r.id, dim: streak < r.streak })),
    drought: [...DROUGHT_RULES].reverse().map(r => ({ id: r.id, dim: false })),
    time: TIME_BUCKETS.map(b => ({ id: b.id, dim: false })),
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {TITLE_CATEGORY_OPTIONS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
              category === key ? 'bg-white font-medium shadow-sm' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4">
        <p className="text-xs text-gray-400">{TITLE_CATEGORY_HINTS[category]}</p>
        <div className="mt-3 space-y-2.5">
          {rowsOf[category].map(({ id, dim }) => (
            <div key={id} className={`flex items-center gap-2 ${dim ? 'opacity-40' : ''}`}>
              <TitleTag title={id} size="md" />
              <span className="flex-1 text-xs text-gray-500">{TITLES[id].desc}</span>
              {owned.has(id) && (
                <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-[10px] leading-none text-amber-600">
                  当前
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
