interface Props {
  icon: string
  title: string
  description?: string
  children?: React.ReactNode
  cancelText?: string
  confirmText: string
  onCancel: () => void
  onConfirm: () => void
}

/** 通用二次确认 / 提示弹窗：图标 + 标题 + 描述 + 自定义内容 + 取消/确认按钮 */
export function ConfirmModal({
  icon,
  title,
  description,
  children,
  cancelText = '取消',
  confirmText,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
        <p className="text-5xl mb-4">{icon}</p>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-500 mb-6">{description}</p>}
        {children}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
