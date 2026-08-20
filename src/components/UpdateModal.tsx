import { ConfirmModal } from './ConfirmModal'

/**
 * 更新日志版本号。有需要告知用户的改动时改这里，
 * 与 localStorage 里已读的版本不一致时，老用户进入会弹一次。
 */
export const UPDATE_VERSION = '2026-08-20'

const UPDATE_ITEMS = [
  '新增称号系统：累计次数、连续天数、常打卡时段各一个称号，自动评定',
  '连续两天没打卡会挂上「断更」类称号，打回来就恢复',
  '「成就」页签换成「称号图鉴」，可以查看每个称号的解锁条件',
  '排行榜里也能看到别人的称号',
]

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
