import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, FolderPlus, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { projectName } from '@shared/format'
import { relativeTime } from '../lib/time'
import { useAppStore } from '../store'
import { Mark } from './Mark'

export function Sidebar(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const chatsByProject = useAppStore((state) => state.chatsByProject)
  const sessionId = useAppStore((state) => state.sessionId)
  const projectPath = useAppStore((state) => state.projectPath)
  const openProject = useAppStore((state) => state.openProject)
  const removeProject = useAppStore((state) => state.removeProject)
  const newChatIn = useAppStore((state) => state.newChatIn)
  const loadSession = useAppStore((state) => state.loadSession)
  const deleteSession = useAppStore((state) => state.deleteSession)
  const projects = settings.projects
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (projectPath) {
      setCollapsed((current) => ({ ...current, [projectPath]: false }))
    }
  }, [projectPath])

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <Mark className="h-8 w-8" />
          <div>
            <div className="text-[14px] font-semibold tracking-tight">Grok Desktop</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </div>
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
            const chats = chatsByProject[project.path] ?? []
            const isCollapsed = collapsed[project.path] === true
            return (
              <section key={project.path} className="mb-2">
                <div
                  className={`group flex items-center rounded-xl ${
                    active
                      ? 'bg-[var(--bg-elevated)] shadow-[inset_0_0_0_1px_rgba(240,215,168,0.16)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <button
                    className="icon-btn h-8 w-7 shrink-0"
                    title={isCollapsed ? 'Show chats' : 'Hide chats'}
                    onClick={() =>
                      setCollapsed((current) => ({
                        ...current,
                        [project.path]: !isCollapsed
                      }))
                    }
                  >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    className="min-w-0 flex-1 truncate py-2 text-left text-[13px] font-medium"
                    onClick={() => void openProject(project.path)}
                    title={project.path}
                  >
                    {project.name || projectName(project.path)}
                    <span className="ml-1.5 text-[11px] font-normal text-[var(--text-muted)]">
                      {chats.length}
                    </span>
                  </button>
                  <button
                    className="icon-btn h-8 w-8"
                    title="New chat in this folder"
                    onClick={() => void newChatIn(project.path)}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    className="icon-btn mr-1 h-8 w-8 hover:text-[var(--danger)]"
                    title="Remove project"
                    onClick={() => void removeProject(project.path)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {isCollapsed ? null : (
                  <div className="mt-0.5 ml-3 border-l border-[var(--border)] pl-1.5">
                    {chats.length === 0 ? (
                      <button
                        className="w-full rounded-lg px-2 py-2 text-left text-[12px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                        onClick={() => void newChatIn(project.path)}
                      >
                        New chat
                      </button>
                    ) : (
                      chats.map((session) => (
                        <div key={session.id} className="group/chat flex items-center">
                          <button
                            onClick={() => {
                              if (projectPath !== project.path) {
                                void openProject(project.path).then(() => loadSession(session.id))
                                return
                              }
                              void loadSession(session.id)
                            }}
                            className={`min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left ${
                              active && session.id === sessionId
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
                              if (!confirm('Delete this chat from Grok history?')) return
                              if (projectPath !== project.path) {
                                void openProject(project.path).then(() => deleteSession(session.id))
                                return
                              }
                              void deleteSession(session.id)
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            )
          })
        )}
      </div>
    </aside>
  )
}
