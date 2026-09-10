import type { RewardTicket } from '../lib/types'
import { RARITY_META, RARITY_REWARD, RARITY_RULES } from '../lib/dicts'
import { formatDateWithWeekday } from '../lib/utils'
import { ConfirmModal } from './ConfirmModal'

interface Props {
  tickets: RewardTicket[]
  loading: boolean
  onClaim: (checkinId: string) => void
  onClose: () => void
}

/** 我的奖券：列出稀有掉落获得的实物奖券，线下兑付后自己标记已兑换 */
export function RewardModal({ tickets, loading, onClaim, onClose }: Props) {
  const unclaimed = tickets.filter(t => !t.claimed).length
  // 只列出有奖品的档位作为说明，金/银纯装饰不列
  const rewardable = RARITY_RULES.filter(rule => RARITY_REWARD[rule.id])

  return (
    <ConfirmModal
      icon="🎟️"
      title="我的奖券"
      description={unclaimed > 0 ? `还有 ${unclaimed} 张没兑换，找群主报券码` : '暂时没有待兑换的奖券'}
      confirmText="关闭"
      onConfirm={onClose}
    >
      <div className="mb-3 px-1 text-left">
        <p className="text-xs text-gray-400 mb-1">掉到稀有 💩 就能拿奖：</p>
        {rewardable.map(rule => (
          <p key={rule.id} className="text-xs text-gray-500">
            {RARITY_META[rule.id].icon} {RARITY_META[rule.id].name} → {RARITY_REWARD[rule.id]}
          </p>
        ))}
      </div>
      {tickets.length === 0 ? (
        <p className="mb-6 text-sm text-gray-400">还没中过奖，多打几次卡试试</p>
      ) : (
        <div className="mb-6 space-y-2 max-h-60 overflow-y-auto text-left">
          {tickets.map(ticket => (
            <div
              key={ticket.checkinId}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${
                ticket.claimed ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <span className="text-xl">{RARITY_META[ticket.rarity].icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ticket.reward}</p>
                <p className="text-xs text-gray-400">
                  {ticket.code} · {formatDateWithWeekday(ticket.createdAt.slice(0, 10))}
                </p>
              </div>
              {ticket.claimed ? (
                <span className="text-xs text-gray-400 whitespace-nowrap">已兑换</span>
              ) : (
                <button
                  onClick={() => onClaim(ticket.checkinId)}
                  disabled={loading}
                  className="px-2 py-1 text-xs text-amber-700 border border-amber-300 rounded-lg transition-colors hover:bg-amber-100 disabled:opacity-40"
                >
                  标记已兑换
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </ConfirmModal>
  )
}
