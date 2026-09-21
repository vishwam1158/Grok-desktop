import { useEffect } from 'react'
import { useAppStore } from '../store'

export function Toast(): React.JSX.Element | null {
  const notice = useAppStore((state) => state.notice)
  const setNotice = useAppStore((state) => state.setNotice)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2400)
    return () => window.clearTimeout(timer)
  }, [notice, setNotice])

  if (!notice) return null
  return <div className="toast">{notice}</div>
}
