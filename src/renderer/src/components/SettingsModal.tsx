import { useAppStore } from '../store'

export function SettingsModal(): React.JSX.Element | null {
  const open = useAppStore((state) => state.settingsOpen)
  const settings = useAppStore((state) => state.settings)
  const status = useAppStore((state) => state.status)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen)
  const login = useAppStore((state) => state.login)
  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={() => setSettingsOpen(false)} className="text-[var(--text-muted)]">
            Close
          </button>
        </div>
        <label className="mt-4 block text-[13px] text-[var(--text-muted)]">Grok binary</label>
        <input
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
          value={settings.grokBinary}
          placeholder={status.binaryPath ?? '~/.grok/bin/grok'}
          onChange={(event) => void patchSettings({ grokBinary: event.target.value })}
        />
        <div className="mt-4 text-[13px] text-[var(--text-muted)]">
          Detected: {status.version ?? 'not found'}
          <br />
          Auth: {status.authenticated ? status.authSource : 'none'}
        </div>
        <button
          className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2"
          onClick={() => void login()}
        >
          Run grok login
        </button>
      </div>
    </div>
  )
}
