import { getTodayDate } from '../lib/utils'

interface Props {
  dates: string[]
}

export function Calendar({ dates }: Props) {
  const today = getTodayDate()
  const [year, month] = today.split('-').map(Number)

  // Generate days for current month
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()

  const dateSet = new Set(dates)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bg-white rounded-2xl p-4">
      <h3 className="text-center font-medium mb-3">
        {year}年{month}月
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekDays.map(d => (
          <div key={d} className="text-gray-400 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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
