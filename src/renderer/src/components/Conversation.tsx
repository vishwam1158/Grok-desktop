import { useEffect, useRef } from 'react'
import { Markdown } from './Markdown'
import { useAppStore } from '../store'
import type { AssistantPart } from '../lib/conversation'

function ToolCard({ part }: { part: Extract<AssistantPart, { type: 'tool' }> }): React.JSX.Element {
  const status =
    part.status === 'completed'
      ? 'text-[var(--ok)]'
      : part.status === 'failed'
        ? 'text-[var(--danger)]'
        : 'text-[var(--warn)]'
  return (
    <details className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[13px]">
        <span className="truncate">{part.title}</span>
        <span className={`ml-3 text-[11px] uppercase tracking-wide ${status}`}>{part.status}</span>
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
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!projectPath) {
    return <Welcome />
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="text-2xl font-semibold tracking-tight">What should Grok build?</div>
        <p className="mt-2 max-w-md text-[var(--text-muted)]">
          Ask for a review, a refactor, a test run, or a new feature. Grok Build runs locally
          through the official <code>grok</code> CLI.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto px-8 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {messages.map((message) =>
          message.role === 'user' ? (
            <div
              key={message.id}
              className="ml-auto max-w-[80%] rounded-2xl bg-[var(--bg-elevated)] px-4 py-3"
            >
              <div className="whitespace-pre-wrap">{message.text}</div>
            </div>
          ) : (
            <div key={message.id} className="flex flex-col gap-3">
              {message.parts.map((part, index) => {
                if (part.type === 'thought') {
                  return (
                    <div key={index} className="text-[13px] italic text-[var(--thought)]">
                      {part.text}
                    </div>
                  )
                }
                if (part.type === 'tool') {
                  return <ToolCard key={part.toolCallId} part={part} />
                }
                if (part.type === 'plan') {
                  return (
                    <div key={index} className="rounded-xl border border-[var(--border)] p-3">
                      {part.entries.map((entry, entryIndex) => (
                        <div key={entryIndex} className="flex gap-2 text-[13px]">
                          <span className="text-[var(--text-muted)]">
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
          <div className="text-[13px] text-[var(--text-muted)]">Grok is working…</div>
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
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
          SpaceXAI · Grok Build
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">A desktop home for Grok.</h1>
        <p className="mt-3 max-w-lg text-[15px] leading-7 text-[var(--text-muted)]">
          Same agent as the official TUI — sessions, tools, permissions, and models — with a Claude
          Code-like workspace around it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-black"
            onClick={() => void openProject()}
          >
            Open a project
          </button>
          {!status.authenticated ? (
            <button
              className="rounded-lg border border-[var(--border)] px-4 py-2"
              onClick={() => void login()}
            >
              Sign in with grok login
            </button>
          ) : null}
        </div>
        <div className="mt-8 grid gap-2 text-[13px] text-[var(--text-muted)]">
          <div>CLI: {status.version ?? 'not found'}</div>
          <div>Auth: {status.authenticated ? status.authSource : 'not signed in'}</div>
        </div>
        {recent.length > 0 ? (
          <div className="mt-8">
            <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Recent projects
            </div>
            {recent.map((path) => (
              <button
                key={path}
                className="mb-1 block w-full truncate rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-elevated)]"
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
