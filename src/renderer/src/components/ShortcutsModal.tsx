import { X } from 'lucide-react'
import { KEYBOARD_SHORTCUTS, SLASH_COMMANDS } from '@shared/commands'
import { useAppStore } from '../store'

export function ShortcutsModal(): React.JSX.Element | null {
  const open = useAppStore((state) => state.shortcutsOpen)
  const setShortcutsOpen = useAppStore((state) => state.setShortcutsOpen)
  if (!open) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Commands and shortcuts</h2>
          <button className="icon-btn" onClick={() => setShortcutsOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">
          Type <kbd>/</kbd> in the composer, or press <kbd>⌘K</kbd> for the palette.
        </p>
        <h3 className="mt-5 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Keyboard
        </h3>
        <div className="mt-2 grid gap-1">
          {KEYBOARD_SHORTCUTS.map((item) => (
            <div key={item.keys} className="flex items-center justify-between py-1 text-[13px]">
              <span>{item.action}</span>
              <kbd>{item.keys}</kbd>
            </div>
          ))}
        </div>
        <h3 className="mt-6 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Slash commands
        </h3>
        <div className="mt-2 grid gap-1">
          {SLASH_COMMANDS.map((command) => (
            <div key={command.name} className="flex items-center justify-between py-1 text-[13px]">
              <span>
                /{command.name}
                {command.aliases.length ? (
                  <span className="text-[var(--text-muted)]">
                    {' '}
                    ({command.aliases.map((alias) => `/${alias}`).join(', ')})
                  </span>
                ) : null}
              </span>
              <span className="text-[var(--text-muted)]">{command.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
