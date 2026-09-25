import { create } from 'zustand'
import type {
  AccountInfo,
  AllowanceSnapshot,
  AppSettings,
  GrokRuntimeStatus,
  ModelOption,
  ChatAttachment,
  PermissionRequest,
  SessionSummary,
  SessionUpdate,
  UsageSnapshot
} from '@shared/types'
import { DEFAULT_SETTINGS, EMPTY_ALLOWANCE, EMPTY_USAGE } from '@shared/types'
import { findCommand, parseSlash } from '@shared/commands'
import type { PermissionMode, ReasoningEffort } from '@shared/types'
import {
  addUserMessage,
  applySessionUpdate,
  conversationMarkdown,
  lastAssistantMarkdown,
  type ChatMessage
} from './lib/conversation'

interface AppState {
  status: GrokRuntimeStatus
  settings: AppSettings
  account: AccountInfo
  models: ModelOption[]
  usage: UsageSnapshot
  allowance: AllowanceSnapshot
  projectPath: string | null
  sessionId: string | null
  sessions: SessionSummary[]
  chatsByProject: Record<string, SessionSummary[]>
  messages: ChatMessage[]
  draft: string
  attachments: ChatAttachment[]
  permission: PermissionRequest | null
  error: string | null
  notice: string | null
  settingsOpen: boolean
  shortcutsOpen: boolean
  paletteOpen: boolean
  promptHistory: string[]
  setDraft: (draft: string) => void
  addAttachments: (files: ChatAttachment[]) => void
  removeAttachment: (id: string) => void
  setSettingsOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setPaletteOpen: (open: boolean) => void
  setNotice: (notice: string | null) => void
  copyLastReply: () => Promise<void>
  exportChat: () => Promise<void>
  cyclePermission: () => Promise<void>
  recallPrompt: (direction: 1 | -1) => void
  runSlash: (text: string) => Promise<'handled' | 'forward'>
  goBack: () => void
  leaveProject: () => Promise<void>
  hydrate: () => Promise<void>
  openProject: (cwd?: string) => Promise<void>
  removeProject: (cwd: string) => Promise<void>
  newChat: () => Promise<void>
  newChatIn: (cwd: string) => Promise<void>
  refreshChats: () => Promise<void>
  refreshAllowance: () => Promise<void>
  loadSession: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  send: () => Promise<void>
  cancel: () => Promise<void>
  respondPermission: (optionId: string | null) => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>
}

const pendingUpdates: SessionUpdate[] = []
let updateFrame = 0

function queueSessionUpdate(update: SessionUpdate): void {
  pendingUpdates.push(update)
  if (updateFrame) return
  updateFrame = requestAnimationFrame(() => {
    updateFrame = 0
    const batch = pendingUpdates.splice(0)
    useAppStore.setState((state) => {
      let messages = state.messages
      for (const item of batch) messages = applySessionUpdate(messages, item)
      return messages === state.messages ? state : { messages }
    })
  })
}

const idleStatus: GrokRuntimeStatus = {
  appVersion: '0.1.0',
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
  allowance: EMPTY_ALLOWANCE,
  projectPath: null,
  sessionId: null,
  sessions: [],
  chatsByProject: {},
  messages: [],
  draft: '',
  attachments: [],
  permission: null,
  error: null,
  notice: null,
  settingsOpen: false,
  shortcutsOpen: false,
  paletteOpen: false,
  promptHistory: [],
  setDraft: (draft) => set({ draft }),
  addAttachments: (files) =>
    set((state) => ({
      attachments: [
        ...state.attachments,
        ...files.filter((file) => !state.attachments.some((item) => item.path === file.path))
      ]
    })),
  removeAttachment: (id) =>
    set((state) => ({ attachments: state.attachments.filter((file) => file.id !== id) })),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setNotice: (notice) => set({ notice }),

  hydrate: async () => {
    const [status, settings, account, models] = await Promise.all([
      window.grok.getStatus(),
      window.grok.getSettings(),
      window.grok.getAccount(),
      window.grok.listModels()
    ])
    set({ status, settings, account, models })
    await Promise.all([get().refreshChats(), get().refreshAllowance()])
    if (settings.resumeLastProject && settings.lastProjectPath) {
      await get().openProject(settings.lastProjectPath)
    }
  },

  refreshAllowance: async () => {
    const allowance = (await window.grok.getAllowance()) as AllowanceSnapshot
    set({ allowance })
  },

  refreshChats: async () => {
    const projects = get().settings.projects
    const pairs = await Promise.all(
      projects.map(async (project) => {
        const sessions = (await window.grok.listSessions(project.path)) as SessionSummary[]
        return [project.path, sessions] as const
      })
    )
    const chatsByProject = Object.fromEntries(pairs)
    const current = get().projectPath
    set({
      chatsByProject,
      sessions: current ? (chatsByProject[current] ?? get().sessions) : get().sessions
    })
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
      await get().refreshChats()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    }
  },

  goBack: () => {
    const state = get()
    if (state.paletteOpen) {
      set({ paletteOpen: false, draft: state.draft === '/' ? '' : state.draft })
      return
    }
    if (state.shortcutsOpen) {
      set({ shortcutsOpen: false })
      return
    }
    if (state.settingsOpen) {
      set({ settingsOpen: false })
      return
    }
    if (state.permission) {
      void get().respondPermission(null)
      return
    }
    if (state.draft) {
      set({ draft: '' })
      return
    }
    if (state.projectPath) {
      void get().leaveProject()
      return
    }
    set({ notice: 'Home screen. ⌘Q quits the app.' })
  },

  leaveProject: async () => {
    const status = await window.grok.leaveProject()
    set({
      status,
      projectPath: null,
      sessionId: null,
      sessions: [],
      messages: [],
      usage: EMPTY_USAGE,
      draft: '',
      permission: null,
      paletteOpen: false
    })
  },

  newChatIn: async (cwd) => {
    if (get().projectPath !== cwd) await get().openProject(cwd)
    await get().newChat()
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
    await get().refreshChats()
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
    await get().refreshChats()
  },

  send: async () => {
    const text = get().draft.trim()
    const attachments = get().attachments
    if ((!text && attachments.length === 0) || get().status.connection === 'running') return
    if (text.startsWith('/') && attachments.length === 0) {
      const result = await get().runSlash(text)
      if (result === 'handled') {
        set({ draft: '', paletteOpen: false })
        return
      }
    }
    const shown = [
      text,
      attachments.length ? `Attached: ${attachments.map((file) => file.name).join(', ')}` : ''
    ]
      .filter(Boolean)
      .join('\n')
    const history = text
      ? [text, ...get().promptHistory.filter((item) => item !== text)].slice(0, 50)
      : get().promptHistory
    set({
      draft: '',
      attachments: [],
      messages: addUserMessage(get().messages, shown),
      error: null,
      promptHistory: history,
      paletteOpen: false
    })
    try {
      await window.grok.sendPrompt(text, attachments)
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
  },

  copyLastReply: async () => {
    const text = lastAssistantMarkdown(get().messages)
    if (!text) {
      set({ notice: 'No reply to copy yet' })
      return
    }
    await navigator.clipboard.writeText(text)
    set({ notice: 'Copied last reply' })
  },

  exportChat: async () => {
    const markdown = conversationMarkdown(get().messages)
    if (!markdown.trim()) {
      set({ notice: 'Nothing to export' })
      return
    }
    const saved = await window.grok.saveText(markdown, 'Export chat')
    set({ notice: saved ? 'Chat exported' : 'Export cancelled' })
  },

  cyclePermission: async () => {
    const order: PermissionMode[] = ['ask', 'auto', 'always-approve']
    const current = get().settings.permissionMode
    const next = order[(order.indexOf(current) + 1) % order.length] ?? 'ask'
    const settings = await window.grok.setSettings({ permissionMode: next })
    set({ settings, notice: `Permissions: ${next}` })
  },

  recallPrompt: (direction) => {
    const history = get().promptHistory
    if (history.length === 0) return
    const current = get().draft
    const index = history.indexOf(current)
    const nextIndex =
      direction < 0
        ? Math.min(history.length - 1, index < 0 ? 0 : index + 1)
        : Math.max(-1, index - 1)
    set({ draft: nextIndex < 0 ? '' : (history[nextIndex] ?? '') })
  },

  runSlash: async (text) => {
    const parsed = parseSlash(text)
    if (!parsed?.name) return 'forward'
    const command = findCommand(parsed.name)
    if (!command) return 'forward'
    if (command.kind === 'agent') return 'forward'

    switch (command.name) {
      case 'new':
        await get().newChat()
        set({ notice: 'New chat' })
        return 'handled'
      case 'resume':
        set({ notice: 'Pick a chat in the sidebar', paletteOpen: false })
        return 'handled'
      case 'context': {
        const usage = get().usage
        set({
          notice: usage.contextWindowTokens
            ? `Context ${usage.contextPercent}% · ${usage.contextRemaining.toLocaleString()} left`
            : 'No usage recorded for this chat yet'
        })
        return 'handled'
      }
      case 'copy':
        await get().copyLastReply()
        return 'handled'
      case 'export':
        await get().exportChat()
        return 'handled'
      case 'delete': {
        const id = get().sessionId
        if (id && confirm('Delete this chat from Grok history?')) await get().deleteSession(id)
        return 'handled'
      }
      case 'model': {
        const wanted = parsed.args.toLowerCase()
        if (!wanted) {
          set({ notice: `Model: ${get().settings.model}` })
          return 'handled'
        }
        const match =
          get().models.find((model) => model.id.toLowerCase() === wanted) ||
          get().models.find((model) => model.id.toLowerCase().includes(wanted))
        if (!match) {
          set({ notice: `Unknown model: ${parsed.args}` })
          return 'handled'
        }
        await get().patchSettings({ model: match.id })
        set({ notice: `Model: ${match.id}` })
        return 'handled'
      }
      case 'effort': {
        const level = parsed.args.toLowerCase() as ReasoningEffort
        if (!['low', 'medium', 'high', 'xhigh'].includes(level)) {
          set({ notice: 'Usage: /effort low | medium | high | xhigh' })
          return 'handled'
        }
        await get().patchSettings({ reasoningEffort: level })
        set({ notice: `Effort: ${level}` })
        return 'handled'
      }
      case 'always-approve': {
        const next: PermissionMode =
          get().settings.permissionMode === 'always-approve' ? 'ask' : 'always-approve'
        await get().patchSettings({ permissionMode: next })
        set({ notice: `Permissions: ${next}` })
        return 'handled'
      }
      case 'auto': {
        const next: PermissionMode = get().settings.permissionMode === 'auto' ? 'ask' : 'auto'
        await get().patchSettings({ permissionMode: next })
        set({ notice: `Permissions: ${next}` })
        return 'handled'
      }
      case 'settings':
        set({ settingsOpen: true, paletteOpen: false })
        return 'handled'
      case 'shortcuts':
        set({ shortcutsOpen: true, paletteOpen: false })
        return 'handled'
      case 'login':
        await get().login()
        set({ notice: 'Opening grok login' })
        return 'handled'
      case 'logout':
        await get().logout()
        set({ notice: 'Signed out' })
        return 'handled'
      case 'quit':
        await window.grok.windowClose()
        return 'handled'
      default:
        return 'forward'
    }
  }
}))

export function bindGrokEvents(): () => void {
  const unsubscribers = [
    window.grok.onStatus((status) => {
      useAppStore.setState({ status: status as GrokRuntimeStatus })
    }),
    window.grok.onUpdate((event) => {
      queueSessionUpdate(event.update)
    }),
    window.grok.onPermission((permission) => {
      useAppStore.setState({ permission })
    }),
    window.grok.onStop(() => {
      void useAppStore.getState().refreshChats()
      void useAppStore.getState().refreshAllowance()
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
    }),
    window.grok.onMenuCommandPalette(() => {
      useAppStore.setState((state) => ({ paletteOpen: !state.paletteOpen, shortcutsOpen: false }))
    }),
    window.grok.onMenuShortcuts(() => {
      useAppStore.setState({ shortcutsOpen: true, paletteOpen: false })
    }),
    window.grok.onMenuCopyLast(() => {
      void useAppStore.getState().copyLastReply()
    }),
    window.grok.onMenuExport(() => {
      void useAppStore.getState().exportChat()
    }),
    window.grok.onMenuStop(() => {
      void useAppStore.getState().cancel()
    })
  ]
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
}
