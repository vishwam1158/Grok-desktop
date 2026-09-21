import { Minus, Square, X } from 'lucide-react'
import { useAppStore } from '../store'

const isMac = navigator.userAgent.includes('Mac')

export function Titlebar(): React.JSX.Element {
  const projectPath = useAppStore((state) => state.projectPath)
  const account = useAppStore((state) => state.account)
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen)

  return (
    <header className="drag-region flex h-12 items-center border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-4">
      {isMac ? <div className="w-[72px]" /> : null}
      <div className="flex flex-1 items-center justify-center text-[13px] text-[var(--text-muted)]">
        <span className="truncate">{projectPath ?? 'Grok Desktop'}</span>
      </div>
      <div className="no-drag flex items-center gap-2">
        {account.subscriptionTier ? (
          <span className="text-[11px] text-[var(--text-muted)]">{account.subscriptionTier}</span>
        ) : null}
        <button
          className="rounded-md px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          onClick={() => setSettingsOpen(true)}
        >
          Settings
        </button>
        {isMac ? null : (
          <>
            <button onClick={() => window.grok.windowMinimize()}>
              <Minus size={14} />
            </button>
            <button onClick={() => window.grok.windowMaximize()}>
              <Square size={12} />
            </button>
            <button onClick={() => window.grok.windowClose()}>
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </header>
  )
}
