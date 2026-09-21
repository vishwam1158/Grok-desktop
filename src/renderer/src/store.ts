import { create } from 'zustand'
import type {
  AccountInfo,
  AppSettings,
  GrokRuntimeStatus,
  ModelOption,
  PermissionRequest,
  SessionSummary,
  UsageSnapshot
} from '@shared/types'
import { DEFAULT_SETTINGS, EMPTY_USAGE } from '@shared/types'
import { addUserMessage, applySessionUpdate, type ChatMessage } from './lib/conversation'

interface AppState {
  status: GrokRuntimeStatus
  settings: AppSettings
  account: AccountInfo
  models: ModelOption[]
  usage: UsageSnapshot
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
  removeProject: (cwd: string) => Promise<void>
  newChat: () => Promise<void>
  loadSession: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  send: () => Promise<void>
  cancel: () => Promise<void>
  respondPermission: (optionId: string | null) => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
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

const idleAccount: AccountInfo = {
  email: null,
  name: null,
  subscriptionTier: null,
  authMode: null
}

export const useAppStore = create<AppState>((set, get) => ({
  status: idleStatus,
  settings: DEFAULT_SETTINGS,
  account: idleAccount,
  models: [],
  usage: EMPTY_USAGE,
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
    const [status, settings, account, models] = await Promise.all([
      window.grok.getStatus(),
      window.grok.getSettings(),
      window.grok.getAccount(),
      window.grok.listModels()
    ])
    set({ status, settings, account, models })
    if (settings.resumeLastProject && settings.lastProjectPath) {
      await get().openProject(settings.lastProjectPath)
    }
  },

  openProject: async (cwd) => {
    const path = cwd ?? (await window.grok.pickProject())
    if (!path) return
    set({
      error: null,
      permission: null,
      status: { ...get().status, connection: 'connecting' }
    })
    try {
      const result = await window.grok.openProject(path)
      set({
        projectPath: result.cwd,
        sessionId: result.sessionId,
        sessions: result.sessions,
        messages: result.messages ?? [],
        usage: result.usage ?? EMPTY_USAGE,
        settings: result.settings ?? get().settings,
        status: result.status,
        draft: ''
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    }
  },

  removeProject: async (cwd) => {
    const settings = await window.grok.removeProject(cwd)
    if (get().projectPath === cwd) {
      set({
        settings,
        projectPath: null,
        sessionId: null,
        sessions: [],
        messages: [],
        usage: EMPTY_USAGE
      })
      return
    }
    set({ settings })
  },

  newChat: async () => {
    if (!get().projectPath) return
    const result = await window.grok.newChat()
    set({
      sessionId: result.sessionId,
      messages: [],
      sessions: result.sessions,
      usage: result.usage ?? EMPTY_USAGE,
      permission: null,
      draft: ''
    })
  },

  loadSession: async (id) => {
    const result = await window.grok.loadSession(id)
    set({
      sessionId: result.sessionId,
      messages: result.messages ?? [],
      usage: result.usage ?? EMPTY_USAGE,
      permission: null,
      draft: ''
    })
  },

  deleteSession: async (id) => {
    const result = await window.grok.deleteSession(id)
    set({
      sessions: result.sessions,
      sessionId: result.sessionId,
      messages: result.messages ?? get().messages,
      usage: result.usage ?? get().usage
    })
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

  logout: async () => {
    const account = await window.grok.logout()
    set({ account })
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
      const cwd = useAppStore.getState().projectPath
      void window.grok.listSessions(cwd ?? undefined).then((sessions) => {
        useAppStore.setState({ sessions })
      })
    }),
    window.grok.onSession((payload) => {
      useAppStore.setState({ sessionId: payload.sessionId, projectPath: payload.cwd })
    }),
    window.grok.onAccount((account) => {
      useAppStore.setState({ account: account as AccountInfo })
    }),
    window.grok.onUsage((usage) => {
      useAppStore.setState({ usage: usage as UsageSnapshot })
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
