import { UPDATE_ITEMS } from '../lib/dicts'
import { ConfirmModal } from './ConfirmModal'

interface Props {
  onClose: () => void
}

/** 版本更新日志弹窗，只在更新后首次进入时展示 */
export function UpdateModal({ onClose }: Props) {
  return (
    <ConfirmModal icon="🎉" title="本次更新" confirmText="知道了" onConfirm={onClose}>
      <ul className="mb-6 space-y-2 text-left text-sm text-gray-600">
        {UPDATE_ITEMS.map(item => (
          <li key={item} className="flex gap-2">
            <span className="text-purple-400">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </ConfirmModal>
  )
}
