import { formatTokens, formatUsd } from '@shared/format'
import { useAppStore } from '../store'

export function StatusBar(): React.JSX.Element {
  const status = useAppStore((state) => state.status)
  const error = useAppStore((state) => state.error)
  const usage = useAppStore((state) => state.usage)
  const account = useAppStore((state) => state.account)
  const settings = useAppStore((state) => state.settings)

  return (
    <footer className="flex h-8 items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--bg-sidebar)] px-4 text-[11px] text-[var(--text-muted)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className={status.connection === 'running' ? 'text-[var(--ok)]' : undefined}>
          {status.connection}
        </span>
        <span>{settings.model}</span>
        {usage.contextWindowTokens > 0 ? (
          <span title={`${usage.contextTokensUsed} / ${usage.contextWindowTokens} tokens`}>
            ctx {formatTokens(usage.contextTokensUsed)}/{formatTokens(usage.contextWindowTokens)} ·{' '}
            {formatTokens(usage.contextRemaining)} left
          </span>
        ) : null}
        {usage.totalTokens > 0 ? <span>{formatTokens(usage.totalTokens)} tok</span> : null}
        {usage.costUsd != null ? <span>{formatUsd(usage.costUsd)}</span> : null}
      </div>
      <div className="flex min-w-0 items-center gap-3">
        {account.subscriptionTier ? <span>{account.subscriptionTier}</span> : null}
        <span className="truncate text-[var(--danger)]">{error ?? status.error}</span>
      </div>
    </footer>
  )
}
