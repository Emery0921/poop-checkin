import type { TitleId } from '../lib/types'
import { TITLES, TITLE_TAG_SIZE_CLASS } from '../lib/dicts'

interface Props {
  title: TitleId | null
  /** md 用于称号图鉴等展示场景，默认 sm 用于排行榜等紧凑场景 */
  size?: 'sm' | 'md'
}

export function TitleTag({ title, size = 'sm' }: Props) {
  if (!title) return null

  const { name, icon, desc, className } = TITLES[title]
  return (
    <span
      className={`border rounded-md leading-none whitespace-nowrap ${TITLE_TAG_SIZE_CLASS[size]} ${className}`}
      title={desc}
    >
      {icon} {name}
    </span>
  )
}
