import { useAppStore } from '../store'

export function StatusBar(): React.JSX.Element {
  const status = useAppStore((state) => state.status)
  const error = useAppStore((state) => state.error)
  const sessionId = useAppStore((state) => state.sessionId)

  return (
    <footer className="flex h-8 items-center justify-between border-t border-[var(--border)] bg-[var(--bg-sidebar)] px-4 text-[11px] text-[var(--text-muted)]">
      <div className="flex items-center gap-3">
        <span className={status.connection === 'running' ? 'text-[var(--ok)]' : undefined}>
          {status.connection}
        </span>
        <span>{status.version ?? 'grok missing'}</span>
        {sessionId ? <span className="truncate">{sessionId.slice(0, 8)}</span> : null}
      </div>
      <div className="truncate text-[var(--danger)]">{error ?? status.error}</div>
    </footer>
  )
}
