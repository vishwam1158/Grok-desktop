import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { filterCommands, type SlashCommand } from '@shared/commands'
import { useAppStore } from '../store'
import { CommandMenu } from './CommandMenu'

export function Composer(): React.JSX.Element | null {
  const projectPath = useAppStore((state) => state.projectPath)
  const draft = useAppStore((state) => state.draft)
  const setDraft = useAppStore((state) => state.setDraft)
  const send = useAppStore((state) => state.send)
  const cancel = useAppStore((state) => state.cancel)
  const running = useAppStore((state) => state.status.connection === 'running')
  const settings = useAppStore((state) => state.settings)
  const models = useAppStore((state) => state.models)
  const usage = useAppStore((state) => state.usage)
  const paletteOpen = useAppStore((state) => state.paletteOpen)
  const setPaletteOpen = useAppStore((state) => state.setPaletteOpen)
  const runSlash = useAppStore((state) => state.runSlash)
  const recallPrompt = useAppStore((state) => state.recallPrompt)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const ref = useRef<HTMLTextAreaElement>(null)
  const [selected, setSelected] = useState(0)
  const canSend = Boolean(draft.trim()) && !running
  const slashQuery = draft.startsWith('/') ? draft.slice(1).split(/\s/)[0] : paletteOpen ? '' : null
  const showMenu = slashQuery !== null && !draft.slice(1).includes(' ')
  const items = useMemo(
    () => (showMenu ? filterCommands(slashQuery ?? '') : []),
    [showMenu, slashQuery]
  )

  useEffect(() => {
    setSelected(0)
  }, [slashQuery])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`
  }, [draft])

  useEffect(() => {
    if (!paletteOpen) return
    const current = useAppStore.getState().draft
    if (!current.startsWith('/')) setDraft('/')
    ref.current?.focus()
  }, [paletteOpen, setDraft])

  if (!projectPath) return null

  const pick = (command: SlashCommand): void => {
    if (command.argsHint) {
      setDraft(`/${command.name} `)
      setPaletteOpen(false)
      ref.current?.focus()
      return
    }
    if (command.kind === 'local') {
      void runSlash(`/${command.name}`).then(() => setDraft(''))
      setPaletteOpen(false)
      return
    }
    setDraft(`/${command.name}`)
    setPaletteOpen(false)
    void send()
  }

  return (
    <div className="relative px-6 pb-5 pt-2">
      <div className="relative mx-auto max-w-3xl">
        {showMenu ? (
          <CommandMenu
            query={slashQuery ?? ''}
            selected={selected}
            onHover={setSelected}
            onSelect={pick}
          />
        ) : null}
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow)]">
          <div className="flex items-end gap-2">
            <textarea
              ref={ref}
              value={draft}
              rows={1}
              placeholder="Message Grok…   / commands"
              className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 outline-none placeholder:text-[var(--text-muted)]"
              onChange={(event) => {
                setDraft(event.target.value)
                if (event.target.value.startsWith('/')) setPaletteOpen(true)
              }}
              onKeyDown={(event) => {
                if (showMenu && items.length > 0) {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    setSelected((value) => (value + 1) % items.length)
                    return
                  }
                  if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    setSelected((value) => (value - 1 + items.length) % items.length)
                    return
                  }
                  if (event.key === 'Tab' || event.key === 'Enter') {
                    event.preventDefault()
                    const command = items[Math.min(selected, items.length - 1)]
                    if (command) pick(command)
                    return
                  }
                }
                if (event.key === 'ArrowUp' && !draft && !event.shiftKey) {
                  event.preventDefault()
                  recallPrompt(-1)
                  return
                }
                if (event.key === 'ArrowDown' && !event.shiftKey) {
                  recallPrompt(1)
                  return
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
            />
            {running ? (
              <button className="stop-btn" title="Stop  ⌘." onClick={() => void cancel()}>
                <Square size={12} fill="currentColor" />
              </button>
            ) : (
              <button
                className="send-btn"
                title="Send  Enter"
                disabled={!canSend}
                onClick={() => void send()}
              >
                <ArrowUp size={18} strokeWidth={2.6} />
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 px-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <select
                className="pill-select"
                value={settings.model}
                onChange={(event) => void patchSettings({ model: event.target.value })}
              >
                {(models.length ? models.map((model) => model.id) : [settings.model]).map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <select
                className="pill-select"
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
              <select
                className="pill-select"
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
            </div>
            <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
              {usage.contextWindowTokens > 0
                ? `${usage.contextPercent}% context`
                : '/ commands · ⌘K'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
