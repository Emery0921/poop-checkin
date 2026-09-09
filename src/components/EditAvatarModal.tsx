import { useRef, useState } from 'react'
import { MAX_AVATAR_FILE_SIZE } from '../lib/dicts'
import { fileToAvatarDataUrl } from '../lib/utils'
import { ConfirmModal } from './ConfirmModal'

interface Props {
  emoji: string
  currentAvatarUrl: string | null
  loading: boolean
  onCancel: () => void
  onConfirm: (avatarUrl: string | null) => void
}

/** 更换头像弹窗：选图后本地压缩并预览，保存时才写库 */
export function EditAvatarModal({ emoji, currentAvatarUrl, loading, onCancel, onConfirm }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // 清空 value，否则连续选同一张图不会再触发 change
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      alert('图片太大了，换一张小于 10MB 的')
      return
    }

    setCompressing(true)
    try {
      setAvatarUrl(await fileToAvatarDataUrl(file))
    } catch {
      alert('这张图片读不出来，换一张试试')
    } finally {
      setCompressing(false)
    }
  }

  return (
    <ConfirmModal
      icon="🖼️"
      title="更换头像"
      description="图片会压缩成 128×128 存储，不上传原图"
      confirmText={loading ? '保存中...' : '保存'}
      confirmDisabled={loading || compressing || avatarUrl === currentAvatarUrl}
      onCancel={onCancel}
      onConfirm={() => onConfirm(avatarUrl)}
    >
      <div className="mb-6 flex flex-col items-center gap-3">
        {avatarUrl
          ? <img src={avatarUrl} alt="头像预览" className="w-20 h-20 rounded-full object-cover" />
          : <span className="text-5xl">{emoji}</span>}
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
            className="text-purple-500 hover:text-purple-600 transition-colors disabled:opacity-40"
          >
            {compressing ? '处理中...' : '选择图片'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              改回 emoji
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePickFile}
          className="hidden"
        />
      </div>
    </ConfirmModal>
  )
}
