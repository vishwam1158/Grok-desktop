import { Minus, Settings, Square, X } from 'lucide-react'
import { useAppStore } from '../store'

const isMac = navigator.userAgent.includes('Mac')

export function Titlebar(): React.JSX.Element {
  const projectPath = useAppStore((state) => state.projectPath)
  const account = useAppStore((state) => state.account)
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen)
  const label = projectPath?.split(/[/\\]/).filter(Boolean).pop() ?? 'Grok Desktop'

  return (
    <header className="drag-region flex h-12 items-center border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-3">
      {isMac ? <div className="w-[72px]" /> : null}
      <div className="flex flex-1 items-center justify-center text-[13px] text-[var(--text-muted)]">
        <span className="truncate rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1">
          {label}
        </span>
      </div>
      <div className="no-drag flex items-center gap-1">
        {account.subscriptionTier ? (
          <span className="mr-1 rounded-full bg-[rgba(240,215,168,0.1)] px-2 py-0.5 text-[11px] text-[var(--accent)]">
            {account.subscriptionTier}
          </span>
        ) : null}
        <button className="icon-btn" title="Settings" onClick={() => setSettingsOpen(true)}>
          <Settings size={15} />
        </button>
        {isMac ? null : (
          <>
            <button className="icon-btn" onClick={() => window.grok.windowMinimize()}>
              <Minus size={14} />
            </button>
            <button className="icon-btn" onClick={() => window.grok.windowMaximize()}>
              <Square size={12} />
            </button>
            <button
              className="icon-btn hover:text-[var(--danger)]"
              onClick={() => window.grok.windowClose()}
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </header>
  )
}
