import { formatTokens, formatUsd } from '@shared/format'
import { useAppStore } from '../store'

function resetLabel(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function StatusBar(): React.JSX.Element {
  const status = useAppStore((state) => state.status)
  const error = useAppStore((state) => state.error)
  const usage = useAppStore((state) => state.usage)
  const allowance = useAppStore((state) => state.allowance)
  const settings = useAppStore((state) => state.settings)
  const running = status.connection === 'running'
  const failed = Boolean(error ?? status.error)
  const reset = resetLabel(allowance.periodEnd)
  const period = allowance.period ?? 'limit'

  return (
    <footer className="flex h-8 items-center gap-3 overflow-x-auto border-t border-[var(--border)] bg-[var(--bg-sidebar)] px-3 text-[11px] whitespace-nowrap text-[var(--text-muted)]">
      <span
        className={`pulse-dot shrink-0 ${running ? '' : failed ? 'error' : 'idle'}`}
        title={status.connection}
      />
      <span title="Grok Desktop version">v{status.appVersion}</span>
      <span>
        {settings.model} · {settings.permissionMode}
      </span>
      {allowance.usedPercent != null ? (
        <span
          title={`${period} allowance used ${allowance.usedPercent}%${
            allowance.buildPercent != null ? ` · Grok Build ${allowance.buildPercent}%` : ''
          }`}
        >
          {period} {allowance.usedPercent}%
          {allowance.remainingPercent != null ? ` · ${allowance.remainingPercent}% left` : ''}
        </span>
      ) : allowance.error ? (
        <span title={allowance.error}>weekly —</span>
      ) : null}
      {reset ? <span title={allowance.periodEnd ?? ''}>resets {reset}</span> : null}
      {allowance.prepaidBalance != null ? (
        <span title="Prepaid credit balance">credits {allowance.prepaidBalance}</span>
      ) : null}
      {usage.contextWindowTokens > 0 ? (
        <span
          className="flex items-center gap-2"
          title={`${usage.contextTokensUsed.toLocaleString()} of ${usage.contextWindowTokens.toLocaleString()} context tokens`}
        >
          <span className="h-1 w-14 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${Math.min(100, usage.contextPercent)}%` }}
            />
          </span>
          ctx {formatTokens(usage.contextTokensUsed)}/{formatTokens(usage.contextWindowTokens)} ·{' '}
          {formatTokens(usage.contextRemaining)} left
        </span>
      ) : (
        <span>ctx —</span>
      )}
      <span title="Session input, output, and reasoning tokens">
        in {formatTokens(usage.inputTokens)} · out {formatTokens(usage.outputTokens)} · think{' '}
        {formatTokens(usage.reasoningTokens)}
      </span>
      <span>
        {usage.turnCount} {usage.turnCount === 1 ? 'turn' : 'turns'}
      </span>
      {usage.costUsd != null ? <span>{formatUsd(usage.costUsd)}</span> : null}
      <span className="min-w-0 truncate text-[var(--danger)]">{error ?? status.error}</span>
    </footer>
  )
}
