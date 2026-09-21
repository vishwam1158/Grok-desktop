import { formatTokens, formatUsd } from '@shared/format'
import { useAppStore } from '../store'

export function StatusBar(): React.JSX.Element {
  const status = useAppStore((state) => state.status)
  const error = useAppStore((state) => state.error)
  const usage = useAppStore((state) => state.usage)
  const settings = useAppStore((state) => state.settings)
  const running = status.connection === 'running'
  const failed = Boolean(error ?? status.error)

  return (
    <footer className="flex h-8 items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--bg-sidebar)] px-3 text-[11px] text-[var(--text-muted)]">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`pulse-dot ${running ? '' : failed ? 'error' : 'idle'}`}
          title={status.connection}
        />
        <span>{settings.model}</span>
        {usage.contextWindowTokens > 0 ? (
          <span
            className="flex items-center gap-2"
            title={`${usage.contextTokensUsed} / ${usage.contextWindowTokens}`}
          >
            <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.min(100, usage.contextPercent)}%` }}
              />
            </span>
            {formatTokens(usage.contextRemaining)} left
          </span>
        ) : null}
        {usage.totalTokens > 0 ? <span>{formatTokens(usage.totalTokens)} tok</span> : null}
        {usage.costUsd != null ? <span>{formatUsd(usage.costUsd)}</span> : null}
      </div>
      <div className="min-w-0 truncate text-[var(--danger)]">{error ?? status.error}</div>
    </footer>
  )
}
