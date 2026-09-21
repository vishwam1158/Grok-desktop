import { useEffect } from 'react'
import { useAppStore } from '../store'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || target.isContentEditable
}

export function useAppHotkeys(): void {
  useEffect(() => {
    let escAt = 0

    const onKeyDown = (event: KeyboardEvent): void => {
      const meta = event.metaKey || event.ctrlKey
      const typing = isTypingTarget(event.target)
      const store = useAppStore.getState()

      if (event.key === 'Escape') {
        if (store.paletteOpen) {
          store.setPaletteOpen(false)
          return
        }
        if (store.shortcutsOpen) {
          store.setShortcutsOpen(false)
          return
        }
        if (store.settingsOpen) {
          store.setSettingsOpen(false)
          return
        }
        const now = Date.now()
        if (now - escAt < 800) {
          store.setDraft('')
          escAt = 0
        } else {
          escAt = now
        }
        return
      }

      if (meta && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        store.setPaletteOpen(!store.paletteOpen)
        return
      }
      if (meta && event.key === '.') {
        event.preventDefault()
        void store.cancel()
        return
      }
      if (meta && event.key === 'Enter') {
        event.preventDefault()
        void store.send()
        return
      }

      if (event.key === 'Tab' && event.shiftKey && typing) {
        event.preventDefault()
        void store.cyclePermission()
        return
      }

      if (store.permission && !meta && /^[1-9]$/.test(event.key)) {
        const option = store.permission.options[Number(event.key) - 1]
        if (option) {
          event.preventDefault()
          void store.respondPermission(option.optionId)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
