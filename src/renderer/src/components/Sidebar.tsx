import { FolderPlus, Plus, Trash2 } from 'lucide-react'
import { projectName } from '@shared/format'
import { useAppStore } from '../store'

export function Sidebar(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const sessions = useAppStore((state) => state.sessions)
  const sessionId = useAppStore((state) => state.sessionId)
  const projectPath = useAppStore((state) => state.projectPath)
  const openProject = useAppStore((state) => state.openProject)
  const removeProject = useAppStore((state) => state.removeProject)
  const newChat = useAppStore((state) => state.newChat)
  const loadSession = useAppStore((state) => state.loadSession)
  const deleteSession = useAppStore((state) => state.deleteSession)
  const projects = settings.projects

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Grok Desktop</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Projects
          </div>
        </div>
        <button
          className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          onClick={() => void openProject()}
          title="Add project"
        >
          <FolderPlus size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
        {projects.length === 0 ? (
          <button
            className="mx-1 mb-3 w-[calc(100%-8px)] rounded-lg border border-dashed border-[var(--border)] px-3 py-6 text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
            onClick={() => void openProject()}
          >
            Open a folder to start
          </button>
        ) : (
          projects.map((project) => {
            const active = project.path === projectPath
            return (
              <div key={project.path} className="mb-1">
                <div
                  className={`group flex items-center rounded-lg ${
                    active ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <button
                    className="min-w-0 flex-1 truncate px-3 py-2 text-left text-[13px]"
                    onClick={() => void openProject(project.path)}
                    title={project.path}
                  >
                    {project.name || projectName(project.path)}
                  </button>
                  <button
                    className="mr-1 hidden rounded p-1 text-[var(--text-muted)] group-hover:block hover:text-[var(--danger)]"
                    title="Remove project"
                    onClick={(event) => {
                      event.stopPropagation()
                      void removeProject(project.path)
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {active ? (
                  <div className="ml-2 mt-1 border-l border-[var(--border)] pl-2">
                    <div className="mb-1 flex items-center justify-between px-1">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Chats
                      </span>
                      <button
                        className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                        title="New chat"
                        onClick={() => void newChat()}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    {sessions.length === 0 ? (
                      <div className="px-2 py-3 text-[12px] text-[var(--text-muted)]">
                        No chats yet
                      </div>
                    ) : (
                      sessions.map((session) => (
                        <div key={session.id} className="group/chat flex items-center">
                          <button
                            onClick={() => void loadSession(session.id)}
                            className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-left ${
                              session.id === sessionId
                                ? 'bg-[var(--bg-elevated)]'
                                : 'hover:bg-[var(--bg-elevated)]'
                            }`}
                          >
                            <div className="truncate text-[13px]">{session.title}</div>
                            <div className="truncate text-[11px] text-[var(--text-muted)]">
                              {new Date(session.updatedAt).toLocaleString()}
                            </div>
                          </button>
                          <button
                            className="hidden rounded p-1 text-[var(--text-muted)] group-hover/chat:block hover:text-[var(--danger)]"
                            title="Delete chat"
                            onClick={() => {
                              if (confirm('Delete this chat from Grok history?')) {
                                void deleteSession(session.id)
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
