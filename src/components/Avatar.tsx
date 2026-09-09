import { AVATAR_SIZE_CLASS } from '../lib/dicts'

interface Props {
  emoji: string
  avatarUrl?: string | null
  /** md 用于排行榜，sm 用于动态列表 */
  size?: 'sm' | 'md'
}

/** 有上传头像就显示图片，没有就回退到 emoji */
export function Avatar({ emoji, avatarUrl, size = 'md' }: Props) {
  const { box, text } = AVATAR_SIZE_CLASS[size]

  if (!avatarUrl) {
    return <span className={text}>{emoji}</span>
  }

  return <img src={avatarUrl} alt="" className={`${box} shrink-0 rounded-full object-cover`} />
}
