import { FolderPlus, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { projectName } from '@shared/format'
import logo from '../assets/logo.png'
import { relativeTime } from '../lib/time'
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
    <aside className="flex w-[292px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <img
            src={logo}
            alt=""
            className="h-8 w-8 rounded-[9px] object-cover shadow-[inset_0_0_0_1px_var(--border)]"
          />
          <div>
            <div className="text-[14px] font-semibold tracking-tight">Grok Desktop</div>
            <div className="text-[11px] text-[var(--text-muted)]">Build</div>
          </div>
        </div>
        <button className="icon-btn" onClick={() => void openProject()} title="Add project">
          <FolderPlus size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
        {projects.length === 0 ? (
          <button
            className="mx-1 w-[calc(100%-8px)] rounded-2xl border border-dashed border-[var(--border)] px-3 py-8 text-[13px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
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
                  className={`group flex items-center rounded-xl ${
                    active
                      ? 'bg-[var(--bg-elevated)] shadow-[inset_0_0_0_1px_rgba(240,215,168,0.16)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <button
                    className="min-w-0 flex-1 truncate px-3 py-2 text-left text-[13px] font-medium"
                    onClick={() => void openProject(project.path)}
                    title={project.path}
                  >
                    {project.name || projectName(project.path)}
                  </button>
                  <button
                    className="icon-btn mr-1 opacity-0 group-hover:opacity-100 hover:text-[var(--danger)]"
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
                  <div className="mt-1 mb-3 ml-2 border-l border-[var(--border)] pl-2">
                    <div className="mb-1 flex items-center justify-between px-1 pt-1">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        Chats
                      </span>
                      <button
                        className="icon-btn h-7 w-7"
                        title="New chat"
                        onClick={() => void newChat()}
                      >
                        <Plus size={14} />
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
                            className={`min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left ${
                              session.id === sessionId
                                ? 'bg-[rgba(240,215,168,0.08)]'
                                : 'hover:bg-[var(--bg-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <MessageSquare
                                size={12}
                                className="shrink-0 text-[var(--text-muted)]"
                              />
                              <span className="truncate text-[13px]">{session.title}</span>
                            </div>
                            <div className="pl-[18px] text-[11px] text-[var(--text-muted)]">
                              {relativeTime(session.updatedAt)}
                            </div>
                          </button>
                          <button
                            className="icon-btn h-7 w-7 opacity-0 group-hover/chat:opacity-100 hover:text-[var(--danger)]"
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
