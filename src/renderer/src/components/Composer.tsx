import { useEffect, useRef } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { useAppStore } from '../store'

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
  const patchSettings = useAppStore((state) => state.patchSettings)
  const ref = useRef<HTMLTextAreaElement>(null)
  const canSend = Boolean(draft.trim()) && !running

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`
  }, [draft])

  if (!projectPath) return null

  return (
    <div className="px-6 pb-5 pt-2">
      <div className="mx-auto max-w-3xl rounded-[22px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow)]">
        <div className="flex items-end gap-2">
          <textarea
            ref={ref}
            value={draft}
            rows={1}
            placeholder="Message Grok…"
            className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 outline-none placeholder:text-[var(--text-muted)]"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void send()
              }
            }}
          />
          {running ? (
            <button className="stop-btn" title="Stop" onClick={() => void cancel()}>
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              className="send-btn"
              title="Send"
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
          {usage.contextWindowTokens > 0 ? (
            <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
              {usage.contextPercent}% context
            </span>
          ) : (
            <span className="shrink-0 text-[11px] text-[var(--text-muted)]">Enter to send</span>
          )}
        </div>
      </div>
    </div>
  )
}
