import { formatDateWithWeekday } from '../lib/utils'

interface Props {
  dates: string[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}

/** 补卡弹窗：从最近未打卡的日期中选择一天进行补卡（每周限 1 次） */
export function MakeupModal({ dates, selectedDate, onSelectDate, onCancel, onConfirm, loading }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
        <p className="text-5xl mb-4">🩹</p>
        <h3 className="text-lg font-bold mb-2">选择补卡日期</h3>
        <p className="text-sm text-gray-500 mb-4">每周仅有 1 次补卡机会，请选择一个之前错过的日期</p>
        {dates.length === 0 ? (
          <p className="text-sm text-gray-400 mb-6">最近没有可补卡的日期</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-6 max-h-48 overflow-y-auto">
            {dates.map(date => (
              <button
                key={date}
                onClick={() => onSelectDate(date)}
                className={`py-2 rounded-xl text-sm border transition-colors ${
                  selectedDate === date
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {formatDateWithWeekday(date)}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedDate || loading}
            className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-40"
          >
            确认补卡
          </button>
        </div>
      </div>
    </div>
  )
}
