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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-6">
      <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={() => setSettingsOpen(false)} className="text-[var(--text-muted)]">
            Close
          </button>
        </div>

        <section className="mt-5">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Account
          </h3>
          <div className="mt-2 text-[13px]">
            <div>{account.name || 'Grok user'}</div>
            <div className="text-[var(--text-muted)]">{account.email || 'Not signed in'}</div>
            <div className="mt-1 text-[var(--text-muted)]">
              Plan:{' '}
              {account.subscriptionTier || (status.authenticated ? status.authSource : 'none')}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-[13px]"
              onClick={() => void login()}
            >
              Sign in
            </button>
            <button
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-[13px]"
              onClick={() => void logout()}
            >
              Sign out
            </button>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Agent
          </h3>
          <label className="mt-2 block text-[13px] text-[var(--text-muted)]">Model</label>
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            value={settings.model}
            onChange={(event) => void patchSettings({ model: event.target.value })}
          >
            {(models.length ? models.map((model) => model.id) : [settings.model]).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-[13px] text-[var(--text-muted)]">Reasoning</label>
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
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
          <label className="mt-3 block text-[13px] text-[var(--text-muted)]">Permissions</label>
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
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
        </section>

        <section className="mt-6">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Workspace
          </h3>
          <label className="mt-3 flex items-center gap-2 text-[13px]">
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

        <section className="mt-6">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Usage this chat
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[13px] text-[var(--text-muted)]">
            <div>Context {usage.contextPercent}%</div>
            <div>
              Remaining {usage.contextWindowTokens ? usage.contextRemaining.toLocaleString() : '—'}
            </div>
            <div>Input {usage.inputTokens.toLocaleString()}</div>
            <div>Output {usage.outputTokens.toLocaleString()}</div>
            <div>Turns {usage.turnCount}</div>
            <div>Calls {usage.modelCalls}</div>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Grok CLI
          </h3>
          <input
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px]"
            value={settings.grokBinary}
            placeholder={status.binaryPath ?? '~/.grok/bin/grok'}
            onChange={(event) => void patchSettings({ grokBinary: event.target.value })}
          />
          <div className="mt-2 text-[13px] text-[var(--text-muted)]">
            {status.version ?? 'not found'}
          </div>
        </section>
      </div>
    </div>
  )
}
