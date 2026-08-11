import { useState } from 'react'
import { randomEmoji } from '../lib/utils'

interface Props {
  onJoin: (nickname: string, emoji: string) => void
  loading: boolean
}

export function NicknameModal({ onJoin, loading }: Props) {
  const [nickname, setNickname] = useState('')
  const [emoji, setEmoji] = useState(randomEmoji)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nickname.trim() && !loading) {
      onJoin(nickname.trim(), emoji)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="text-xl font-bold text-center mb-4">加入打卡</h2>
        <div className="text-center mb-4">
          <button
            type="button"
            onClick={() => setEmoji(randomEmoji())}
            className="text-5xl hover:scale-110 transition-transform cursor-pointer"
            title="点击换头像"
          >
            {emoji}
          </button>
          <p className="text-xs text-gray-400 mt-1">点击换头像</p>
        </div>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="输入你的昵称"
          maxLength={12}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          autoFocus
        />
        <button
          type="submit"
          disabled={!nickname.trim() || loading}
          className="w-full mt-4 bg-purple-500 text-white rounded-xl py-3 text-lg font-medium disabled:opacity-40 hover:bg-purple-600 transition-colors"
        >
          {loading ? '加入中...' : '开始打卡'}
        </button>
      </form>
    </div>
  )
}
