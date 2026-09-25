import { useEffect } from 'react'
import { useAppStore } from '../store'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || target.isContentEditable
}

export function useAppHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const meta = event.metaKey || event.ctrlKey
      const typing = isTypingTarget(event.target)
      const store = useAppStore.getState()

      if (event.key === 'Escape') {
        event.preventDefault()
        store.goBack()
        return
      }
      if (event.key === 'ArrowLeft' && event.altKey && !typing) {
        event.preventDefault()
        store.goBack()
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

    const onMouseUp = (event: MouseEvent): void => {
      if (event.button === 3) useAppStore.getState().goBack()
    }

    let startX = 0
    let startY = 0
    let tracking = false
    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || event.clientX > 28) return
      tracking = true
      startX = event.clientX
      startY = event.clientY
    }
    const onPointerUp = (event: PointerEvent): void => {
      if (!tracking) return
      tracking = false
      const dx = event.clientX - startX
      const dy = Math.abs(event.clientY - startY)
      if (dx > 72 && dy < 80) useAppStore.getState().goBack()
    }
    let wheelX = 0
    let wheelAt = 0
    const onWheel = (event: WheelEvent): void => {
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('pre, textarea, .command-menu, [data-chat-scroll]')
      ) {
        return
      }
      const now = Date.now()
      if (now - wheelAt > 280) wheelX = 0
      wheelAt = now
      wheelX += event.deltaX
      if (wheelX > 90) {
        wheelX = 0
        useAppStore.getState().goBack()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])
}
