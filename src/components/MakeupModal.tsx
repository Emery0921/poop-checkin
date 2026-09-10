import { formatDateWithWeekday } from '../lib/utils'
import { ConfirmModal } from './ConfirmModal'

interface Props {
  dates: string[]
  selectedDate: string | null
  remaining: number
  onSelectDate: (date: string) => void
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}

/** 补卡弹窗：从最近未打卡的日期中选一天补卡，外壳复用 ConfirmModal */
export function MakeupModal({ dates, selectedDate, remaining, onSelectDate, onCancel, onConfirm, loading }: Props) {
  return (
    <ConfirmModal
      icon="🩹"
      title="选择补卡日期"
      description={`本周还剩 ${remaining} 次补卡机会，选一个之前错过的日期`}
      confirmText="确认补卡"
      confirmDisabled={!selectedDate || loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {dates.length === 0 ? (
        <p className="mb-6 text-sm text-gray-400">最近没有可补卡的日期</p>
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
    </ConfirmModal>
  )
}
