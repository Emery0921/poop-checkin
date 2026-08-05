const ACHIEVEMENTS = [
  { id: 'first', name: '初来乍到', desc: '完成第一次打卡', icon: '🎉', threshold: 1 },
  { id: 'streak3', name: '三天连击', desc: '连续打卡3天', icon: '🔥', threshold: 3, type: 'streak' },
  { id: 'streak7', name: '一周坚持', desc: '连续打卡7天', icon: '⭐', threshold: 7, type: 'streak' },
  { id: 'streak30', name: '月度之王', desc: '连续打卡30天', icon: '👑', threshold: 30, type: 'streak' },
  { id: 'total10', name: '十次常客', desc: '累计打卡10次', icon: '🏅', threshold: 10 },
  { id: 'total50', name: '五十达人', desc: '累计打卡50次', icon: '💎', threshold: 50 },
  { id: 'total100', name: '百次传奇', desc: '累计打卡100次', icon: '🏆', threshold: 100 },
]

interface Props {
  total: number
  streak: number
}

export function Achievements({ total, streak }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <h3 className="font-medium mb-3">🏆 成就徽章</h3>
      <div className="grid grid-cols-4 gap-3">
        {ACHIEVEMENTS.map(a => {
          const value = a.type === 'streak' ? streak : total
          const unlocked = value >= a.threshold
          return (
            <div
              key={a.id}
              className={`text-center py-2 rounded-xl ${unlocked ? '' : 'opacity-30 grayscale'}`}
              title={a.desc}
            >
              <div className="text-2xl">{a.icon}</div>
              <p className="text-xs mt-1 text-gray-600">{a.name}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
