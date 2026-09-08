import { useState } from 'react'
import { NICKNAME_MAX_LENGTH } from '../lib/dicts'
import { ConfirmModal } from './ConfirmModal'

interface Props {
  currentNickname: string
  loading: boolean
  onCancel: () => void
  onConfirm: (nickname: string) => void
}

/** 修改昵称弹窗，外壳复用 ConfirmModal */
export function EditNicknameModal({ currentNickname, loading, onCancel, onConfirm }: Props) {
  const [nickname, setNickname] = useState(currentNickname)
  const trimmed = nickname.trim()

  return (
    <ConfirmModal
      icon="✏️"
      title="修改昵称"
      description="改完后排行榜、动态里都会同步显示新昵称"
      confirmText={loading ? '保存中...' : '保存'}
      confirmDisabled={!trimmed || loading}
      onCancel={onCancel}
      onConfirm={() => onConfirm(trimmed)}
    >
      <input
        type="text"
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        placeholder="输入新昵称"
        maxLength={NICKNAME_MAX_LENGTH}
        className="w-full mb-6 px-4 py-3 border border-gray-200 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
        autoFocus
      />
    </ConfirmModal>
  )
}
