import { create } from 'zustand'
import type {
  AppSettings,
  GrokRuntimeStatus,
  PermissionRequest,
  SessionSummary
} from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'
import { addUserMessage, applySessionUpdate, type ChatMessage } from './lib/conversation'

interface AppState {
  status: GrokRuntimeStatus
  settings: AppSettings
  projectPath: string | null
  sessionId: string | null
  sessions: SessionSummary[]
  messages: ChatMessage[]
  draft: string
  permission: PermissionRequest | null
  error: string | null
  settingsOpen: boolean
  setDraft: (draft: string) => void
  setSettingsOpen: (open: boolean) => void
  hydrate: () => Promise<void>
  openProject: (cwd?: string) => Promise<void>
  newChat: () => Promise<void>
  loadSession: (id: string) => Promise<void>
  send: () => Promise<void>
  cancel: () => Promise<void>
  respondPermission: (optionId: string | null) => Promise<void>
  login: () => Promise<void>
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>
}

const idleStatus: GrokRuntimeStatus = {
  binaryPath: null,
  version: null,
  authenticated: false,
  authSource: 'none',
  connection: 'disconnected',
  error: null
}

export const useAppStore = create<AppState>((set, get) => ({
  status: idleStatus,
  settings: DEFAULT_SETTINGS,
  projectPath: null,
  sessionId: null,
  sessions: [],
  messages: [],
  draft: '',
  permission: null,
  error: null,
  settingsOpen: false,
  setDraft: (draft) => set({ draft }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  hydrate: async () => {
    const [status, settings] = await Promise.all([
      window.grok.getStatus(),
      window.grok.getSettings()
    ])
    set({ status, settings })
  },

  openProject: async (cwd) => {
    const path = cwd ?? (await window.grok.pickProject())
    if (!path) return
    set({
      error: null,
      messages: [],
      permission: null,
      status: { ...get().status, connection: 'connecting' }
    })
    try {
      const result = await window.grok.openProject(path)
      set({
        projectPath: result.cwd,
        sessionId: result.sessionId,
        sessions: result.sessions,
        status: result.status,
        messages: []
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    }
  },

  newChat: async () => {
    if (!get().projectPath) return
    const result = await window.grok.newChat()
    const sessions = await window.grok.listSessions(get().projectPath ?? undefined)
    set({ sessionId: result.sessionId, messages: [], sessions, permission: null })
  },

  loadSession: async (id) => {
    await window.grok.loadSession(id)
    set({ sessionId: id, messages: [], permission: null })
  },

  send: async () => {
    const text = get().draft.trim()
    if (!text || get().status.connection === 'running') return
    set({
      draft: '',
      messages: addUserMessage(get().messages, text),
      error: null
    })
    try {
      await window.grok.sendPrompt(text)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    }
  },

  cancel: async () => {
    await window.grok.cancel()
  },

  respondPermission: async (optionId) => {
    const permission = get().permission
    if (!permission) return
    await window.grok.respondPermission(permission.requestId, optionId)
    set({ permission: null })
  },

  login: async () => {
    await window.grok.login()
  },

  patchSettings: async (patch) => {
    const settings = await window.grok.setSettings(patch)
    set({ settings })
  }
}))

export function bindGrokEvents(): () => void {
  const unsubscribers = [
    window.grok.onStatus((status) => {
      useAppStore.setState({ status: status as GrokRuntimeStatus })
    }),
    window.grok.onUpdate((event) => {
      useAppStore.setState((state) => ({
        messages: applySessionUpdate(state.messages, event.update)
      }))
    }),
    window.grok.onPermission((permission) => {
      useAppStore.setState({ permission })
    }),
    window.grok.onStop(() => {
      void window.grok
        .listSessions(useAppStore.getState().projectPath ?? undefined)
        .then((sessions) => {
          useAppStore.setState({ sessions })
        })
    }),
    window.grok.onSession((payload) => {
      useAppStore.setState({ sessionId: payload.sessionId, projectPath: payload.cwd })
    }),
    window.grok.onMenuOpenProject(() => {
      void useAppStore.getState().openProject()
    }),
    window.grok.onMenuNewChat(() => {
      void useAppStore.getState().newChat()
    })
  ]
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
}
