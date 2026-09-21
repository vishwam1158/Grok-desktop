import { FolderOpen, Plus } from 'lucide-react'
import { useAppStore } from '../store'

export function Sidebar(): React.JSX.Element {
  const sessions = useAppStore((state) => state.sessions)
  const sessionId = useAppStore((state) => state.sessionId)
  const projectPath = useAppStore((state) => state.projectPath)
  const openProject = useAppStore((state) => state.openProject)
  const newChat = useAppStore((state) => state.newChat)
  const loadSession = useAppStore((state) => state.loadSession)
  const recent = useAppStore((state) => state.settings.recentProjects)

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Grok Desktop</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Build
          </div>
        </div>
        <button
          className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          onClick={() => void newChat()}
          title="New chat"
        >
          <Plus size={16} />
        </button>
      </div>

      <button
        className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-left text-[13px] hover:bg-[var(--bg-hover)]"
        onClick={() => void openProject()}
      >
        <FolderOpen size={15} />
        <span className="truncate">
          {projectPath ? projectPath.split(/[/\\]/).pop() : 'Open project'}
        </span>
      </button>

      <div className="px-4 pb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Sessions
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
        {sessions.length === 0 ? (
          <div className="px-2 py-6 text-[13px] text-[var(--text-muted)]">
            No saved sessions for this folder yet.
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => void loadSession(session.id)}
              className={`mb-1 w-full rounded-lg px-3 py-2 text-left ${
                session.id === sessionId ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="truncate text-[13px]">{session.title}</div>
              <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                {new Date(session.updatedAt).toLocaleString()}
              </div>
            </button>
          ))
        )}
      </div>

      {recent.length > 0 ? (
        <div className="border-t border-[var(--border)] px-3 py-3">
          <div className="mb-2 px-1 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Recent
          </div>
          {recent.slice(0, 5).map((path) => (
            <button
              key={path}
              className="mb-1 w-full truncate rounded-md px-2 py-1 text-left text-[12px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
              onClick={() => void openProject(path)}
            >
              {path}
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  )
}
