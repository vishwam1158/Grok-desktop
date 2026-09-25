import { contextBridge, ipcRenderer, webUtils } from 'electron'
import {
  IPC,
  type AppSettings,
  type ChatAttachment,
  type PermissionRequest,
  type SessionUpdateEvent
} from '../shared/types'
const grok = {
  getStatus: () => ipcRenderer.invoke(IPC.getStatus),
  getSettings: () => ipcRenderer.invoke(IPC.getSettings),
  setSettings: (patch: Partial<AppSettings>) => ipcRenderer.invoke(IPC.setSettings, patch),
  getAccount: () => ipcRenderer.invoke(IPC.getAccount),
  getUsage: (sessionId?: string) => ipcRenderer.invoke(IPC.getUsage, sessionId),
  getAllowance: () => ipcRenderer.invoke(IPC.getAllowance),
  listModels: () => ipcRenderer.invoke(IPC.listModels),
  pickProject: () => ipcRenderer.invoke(IPC.pickProject),
  openProject: (cwd: string) => ipcRenderer.invoke(IPC.openProject, cwd),
  removeProject: (cwd: string) => ipcRenderer.invoke(IPC.removeProject, cwd),
  leaveProject: () => ipcRenderer.invoke(IPC.leaveProject),
  listSessions: (cwd?: string) => ipcRenderer.invoke(IPC.listSessions, cwd),
  loadTranscript: (sessionId: string, cwd?: string) =>
    ipcRenderer.invoke(IPC.loadTranscript, { sessionId, cwd }),
  newChat: () => ipcRenderer.invoke(IPC.newChat),
  loadSession: (sessionId: string) => ipcRenderer.invoke(IPC.loadSession, sessionId),
  deleteSession: (sessionId: string) => ipcRenderer.invoke(IPC.deleteSession, sessionId),
  sendPrompt: (text: string, attachments?: ChatAttachment[]) =>
    ipcRenderer.invoke(IPC.sendPrompt, { text, attachments }),
  pickFiles: () => ipcRenderer.invoke(IPC.pickFiles),
  pathForFile: (file: File) => webUtils.getPathForFile(file),
  cancel: () => ipcRenderer.invoke(IPC.cancel),
  respondPermission: (requestId: string, optionId: string | null) =>
    ipcRenderer.invoke(IPC.respondPermission, { requestId, optionId }),
  login: () => ipcRenderer.invoke(IPC.login),
  logout: () => ipcRenderer.invoke(IPC.logout),
  windowMinimize: () => ipcRenderer.invoke(IPC.windowMinimize),
  windowMaximize: () => ipcRenderer.invoke(IPC.windowMaximize),
  windowClose: () => ipcRenderer.invoke(IPC.windowClose),
  saveText: (content: string, title?: string) =>
    ipcRenderer.invoke(IPC.saveText, { content, title }),
  onStatus: (listener: (payload: unknown) => void) => subscribe(IPC.eventStatus, listener),
  onUpdate: (listener: (payload: SessionUpdateEvent) => void) =>
    subscribe(IPC.eventUpdate, listener),
  onPermission: (listener: (payload: PermissionRequest) => void) =>
    subscribe(IPC.eventPermission, listener),
  onStop: (listener: (payload: { sessionId: string; stopReason: string }) => void) =>
    subscribe(IPC.eventStop, listener),
  onSession: (listener: (payload: { sessionId: string; cwd: string }) => void) =>
    subscribe(IPC.eventSession, listener),
  onAccount: (listener: (payload: unknown) => void) => subscribe(IPC.eventAccount, listener),
  onUsage: (listener: (payload: unknown) => void) => subscribe(IPC.eventUsage, listener),
  onMenuOpenProject: (listener: () => void) => subscribe('menu:open-project', listener),
  onMenuNewChat: (listener: () => void) => subscribe('menu:new-chat', listener),
  onMenuCommandPalette: (listener: () => void) => subscribe('menu:command-palette', listener),
  onMenuShortcuts: (listener: () => void) => subscribe('menu:shortcuts', listener),
  onMenuCopyLast: (listener: () => void) => subscribe('menu:copy-last', listener),
  onMenuExport: (listener: () => void) => subscribe('menu:export', listener),
  onMenuStop: (listener: () => void) => subscribe('menu:stop', listener)
}

function subscribe(channel: string, listener: (...args: any[]) => void): () => void {
  const wrapped = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => {
    listener(...args)
  }
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.removeListener(channel, wrapped)
}

contextBridge.exposeInMainWorld('grok', grok)

export type GrokDesktopAPI = typeof grok
