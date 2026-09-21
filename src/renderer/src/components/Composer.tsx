import { useEffect, useRef } from 'react'
import { Square } from 'lucide-react'
import { useAppStore } from '../store'

export function Composer(): React.JSX.Element | null {
  const projectPath = useAppStore((state) => state.projectPath)
  const draft = useAppStore((state) => state.draft)
  const setDraft = useAppStore((state) => state.setDraft)
  const send = useAppStore((state) => state.send)
  const cancel = useAppStore((state) => state.cancel)
  const running = useAppStore((state) => state.status.connection === 'running')
  const settings = useAppStore((state) => state.settings)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`
  }, [draft])

  if (!projectPath) return null

  return (
    <div className="border-t border-[var(--border)] px-6 py-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
        <textarea
          ref={ref}
          value={draft}
          rows={1}
          placeholder="Ask Grok to inspect, edit, or run something…"
          className="w-full resize-none bg-transparent outline-none"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void send()
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
            <select
              className="rounded-md bg-transparent px-1 py-1"
              value={settings.model}
              onChange={(event) => void patchSettings({ model: event.target.value })}
            >
              <option value="grok-4.6">grok-4.6</option>
              <option value="grok-4.5">grok-4.5</option>
              <option value="grok-4">grok-4</option>
            </select>
            <select
              className="rounded-md bg-transparent px-1 py-1"
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
              className="rounded-md bg-transparent px-1 py-1"
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
          {running ? (
            <button
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[13px]"
              onClick={() => void cancel()}
            >
              <Square size={11} fill="currentColor" />
              Stop
            </button>
          ) : (
            <button
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[13px] font-medium text-black disabled:opacity-40"
              disabled={!draft.trim()}
              onClick={() => void send()}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
