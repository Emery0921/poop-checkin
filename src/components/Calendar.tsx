import { useState } from 'react'
import { CALENDAR_WEEKDAY_LABELS } from '../lib/dicts'
import { getTodayDate, shiftMonthKey } from '../lib/utils'

interface Props {
  dates: string[]
}

export function Calendar({ dates }: Props) {
  const today = getTodayDate()
  const currentMonth = today.slice(0, 7)
  const [viewMonth, setViewMonth] = useState(currentMonth)

  const [year, month] = viewMonth.split('-').map(Number)

  // Generate days for the month being viewed
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()

  const dateSet = new Set(dates)
  // 第一次打卡之前的月份全是空的，没必要让人一直往前翻
  const earliestMonth = dates.length > 0
    ? dates.reduce((a, b) => (b < a ? b : a)).slice(0, 7)
    : currentMonth
  const monthCount = dates.filter(d => d.startsWith(viewMonth)).length

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth(shiftMonthKey(viewMonth, -1))}
          disabled={viewMonth <= earliestMonth}
          aria-label="上一月"
          className="px-2 py-1 text-gray-400 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ‹
        </button>
        <h3 className="font-medium">
          {year}年{month}月
          <span className="ml-2 text-xs text-gray-400">{monthCount} 次</span>
        </h3>
        <button
          onClick={() => setViewMonth(shiftMonthKey(viewMonth, 1))}
          disabled={viewMonth >= currentMonth}
          aria-label="下一月"
          className="px-2 py-1 text-gray-400 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {CALENDAR_WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-gray-400 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const dateStr = `${viewMonth}-${String(day).padStart(2, '0')}`
          const checked = dateSet.has(dateStr)
          const isToday = dateStr === today
          return (
            <div
              key={dateStr}
              className={`py-1.5 rounded-lg text-sm ${
                checked ? 'bg-purple-100 text-purple-700 font-bold' : ''
              } ${isToday ? 'ring-2 ring-purple-400' : ''}`}
            >
              {checked ? '💩' : day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
