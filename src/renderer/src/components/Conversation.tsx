import { useEffect, useRef } from 'react'
import logo from '../assets/logo.png'
import { Markdown } from './Markdown'
import { useAppStore } from '../store'
import type { AssistantPart } from '../lib/conversation'

function ToolCard({ part }: { part: Extract<AssistantPart, { type: 'tool' }> }): React.JSX.Element {
  const tone =
    part.status === 'completed'
      ? 'text-[var(--ok)]'
      : part.status === 'failed'
        ? 'text-[var(--danger)]'
        : 'text-[var(--warn)]'
  return (
    <details className="overflow-hidden rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[13px]">
        <span className="truncate font-medium">{part.title}</span>
        <span className={`ml-3 text-[10px] uppercase tracking-[0.12em] ${tone}`}>
          {part.status}
        </span>
      </summary>
      <pre className="max-h-72 overflow-auto border-t border-[var(--border)] p-3 text-[12px] text-[var(--text-muted)]">
        {JSON.stringify({ input: part.rawInput, output: part.rawOutput }, null, 2)}
      </pre>
    </details>
  )
}

export function Conversation(): React.JSX.Element {
  const messages = useAppStore((state) => state.messages)
  const projectPath = useAppStore((state) => state.projectPath)
  const connection = useAppStore((state) => state.status.connection)
  const showThinking = useAppStore((state) => state.settings.showThinking)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!projectPath) {
    return <Welcome />
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <img src={logo} alt="" className="mb-4 h-12 w-12 rounded-2xl object-cover" />
        <div className="text-[28px] font-semibold tracking-tight">What should Grok build?</div>
        <p className="mt-2 max-w-md text-[15px] leading-6 text-[var(--text-muted)]">
          Review a diff, run tests, or start a feature. Your prompt stays above the reply.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto px-8 py-7">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[78%] rounded-[22px] bg-[var(--bg-user)] px-4 py-3 text-[15px] leading-6 shadow-[inset_0_0_0_1px_rgba(240,215,168,0.12)]">
                <div className="whitespace-pre-wrap">{message.text}</div>
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex flex-col gap-3">
              {message.parts.map((part, index) => {
                if (part.type === 'thought') {
                  if (!showThinking) return null
                  return (
                    <div
                      key={index}
                      className="rounded-xl border-l-2 border-[rgba(240,215,168,0.35)] bg-[rgba(240,215,168,0.05)] px-3 py-2 text-[13px] leading-5 text-[var(--thought)]"
                    >
                      {part.text}
                    </div>
                  )
                }
                if (part.type === 'tool') {
                  return <ToolCard key={part.toolCallId} part={part} />
                }
                if (part.type === 'plan') {
                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3"
                    >
                      {part.entries.map((entry, entryIndex) => (
                        <div key={entryIndex} className="flex gap-2 py-0.5 text-[13px]">
                          <span className="w-16 shrink-0 text-[var(--text-muted)]">
                            {entry.status ?? 'pending'}
                          </span>
                          <span>{entry.content}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return <Markdown key={index} text={part.text} />
              })}
            </div>
          )
        )}
        {connection === 'running' ? (
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
            <span className="working">
              <span />
              <span />
              <span />
            </span>
            Grok is working
          </div>
        ) : null}
        <div ref={bottom} />
      </div>
    </div>
  )
}

function Welcome(): React.JSX.Element {
  const status = useAppStore((state) => state.status)
  const openProject = useAppStore((state) => state.openProject)
  const login = useAppStore((state) => state.login)
  const recent = useAppStore((state) => state.settings.recentProjects)

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-xl px-8">
        <img src={logo} alt="" className="mb-5 h-14 w-14 rounded-2xl object-cover" />
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
          SpaceXAI · Grok Build
        </div>
        <h1 className="mt-3 text-[42px] font-semibold leading-[1.05] tracking-tight">
          A desktop home
          <br />
          for Grok.
        </h1>
        <p className="mt-4 max-w-lg text-[16px] leading-7 text-[var(--text-muted)]">
          Projects, chats, permissions, and usage — wrapped around the official Grok Build agent.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button className="primary-btn" onClick={() => void openProject()}>
            Open a project
          </button>
          {!status.authenticated ? (
            <button className="ghost-btn" onClick={() => void login()}>
              Sign in
            </button>
          ) : null}
        </div>
        <div className="mt-8 flex gap-6 text-[13px] text-[var(--text-muted)]">
          <div>{status.version ?? 'CLI not found'}</div>
          <div>{status.authenticated ? 'Signed in' : 'Not signed in'}</div>
        </div>
        {recent.length > 0 ? (
          <div className="mt-8">
            <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Recent
            </div>
            {recent.slice(0, 5).map((path) => (
              <button
                key={path}
                className="mb-1 block w-full truncate rounded-xl px-3 py-2 text-left hover:bg-[var(--bg-elevated)]"
                onClick={() => void openProject(path)}
              >
                {path}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
