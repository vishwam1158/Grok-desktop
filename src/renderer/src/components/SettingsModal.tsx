import { X } from 'lucide-react'
import { formatTokens } from '@shared/format'
import { useAppStore } from '../store'

export function SettingsModal(): React.JSX.Element | null {
  const open = useAppStore((state) => state.settingsOpen)
  const settings = useAppStore((state) => state.settings)
  const status = useAppStore((state) => state.status)
  const account = useAppStore((state) => state.account)
  const models = useAppStore((state) => state.models)
  const usage = useAppStore((state) => state.usage)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen)
  const login = useAppStore((state) => state.login)
  const logout = useAppStore((state) => state.logout)
  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button className="icon-btn" onClick={() => setSettingsOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <section className="mt-5 rounded-2xl border border-[var(--border)] p-4">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Account
          </h3>
          <div className="mt-2 text-[14px]">{account.name || 'Grok user'}</div>
          <div className="text-[13px] text-[var(--text-muted)]">
            {account.email || 'Not signed in'}
          </div>
          <div className="mt-1 text-[13px] text-[var(--accent)]">
            {account.subscriptionTier || (status.authenticated ? status.authSource : 'none')}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="ghost-btn" onClick={() => void login()}>
              Sign in
            </button>
            <button className="ghost-btn" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        </section>

        <section className="mt-4 grid gap-3">
          <label className="text-[13px] text-[var(--text-muted)]">
            Model
            <select
              className="field mt-1"
              value={settings.model}
              onChange={(event) => void patchSettings({ model: event.target.value })}
            >
              {(models.length ? models.map((model) => model.id) : [settings.model]).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] text-[var(--text-muted)]">
            Reasoning
            <select
              className="field mt-1"
              value={settings.reasoningEffort}
              onChange={(event) =>
                void patchSettings({
                  reasoningEffort: event.target.value as typeof settings.reasoningEffort
                })
              }
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="xhigh">xhigh</option>
            </select>
          </label>
          <label className="text-[13px] text-[var(--text-muted)]">
            Permissions
            <select
              className="field mt-1"
              value={settings.permissionMode}
              onChange={(event) =>
                void patchSettings({
                  permissionMode: event.target.value as typeof settings.permissionMode
                })
              }
            >
              <option value="ask">ask</option>
              <option value="auto">auto</option>
              <option value="always-approve">always-approve</option>
            </select>
          </label>
        </section>

        <section className="mt-4 rounded-2xl border border-[var(--border)] p-4">
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={settings.showThinking}
              onChange={(event) => void patchSettings({ showThinking: event.target.checked })}
            />
            Show reasoning
          </label>
          <label className="mt-2 flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={settings.resumeLastProject}
              onChange={(event) => void patchSettings({ resumeLastProject: event.target.checked })}
            />
            Reopen last project on launch
          </label>
        </section>

        <section className="mt-4 rounded-2xl border border-[var(--border)] p-4 text-[13px] text-[var(--text-muted)]">
          <h3 className="text-[11px] uppercase tracking-[0.16em]">Usage this chat</h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>Context {usage.contextPercent}%</div>
            <div>Left {usage.contextWindowTokens ? formatTokens(usage.contextRemaining) : '—'}</div>
            <div>Input {formatTokens(usage.inputTokens)}</div>
            <div>Output {formatTokens(usage.outputTokens)}</div>
          </div>
        </section>

        <section className="mt-4">
          <label className="text-[13px] text-[var(--text-muted)]">
            Grok CLI
            <input
              className="field mt-1"
              value={settings.grokBinary}
              placeholder={status.binaryPath ?? '~/.grok/bin/grok'}
              onChange={(event) => void patchSettings({ grokBinary: event.target.value })}
            />
          </label>
          <div className="mt-2 text-[12px] text-[var(--text-muted)]">
            {status.version ?? 'not found'}
          </div>
        </section>
      </div>
    </div>
  )
}
