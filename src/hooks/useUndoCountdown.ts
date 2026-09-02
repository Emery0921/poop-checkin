import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 打卡后的撤回倒计时。倒计时归零后自动失效，
 * clear 用于撤回成功后立刻结束，start 会覆盖上一次未结束的倒计时。
 */
export function useUndoCountdown(duration: number) {
  const [pendingCheckinId, setPendingCheckinId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clear = useCallback(
    () => {
      stopTimer()
      setPendingCheckinId(null)
      setCountdown(0)
    },
    [stopTimer]
  )

  const start = useCallback(
    (checkinId: string) => {
      stopTimer()
      setPendingCheckinId(checkinId)
      setCountdown(duration)
      timerRef.current = setInterval(
        () => {
          setCountdown(prev => {
            if (prev <= 1) {
              stopTimer()
              setPendingCheckinId(null)
              return 0
            }
            return prev - 1
          })
        },
        1000
      )
    },
    [duration, stopTimer]
  )

  // 组件卸载时别把定时器留在后台
  useEffect(() => stopTimer, [stopTimer])

  return { pendingCheckinId, countdown, start, clear }
}
