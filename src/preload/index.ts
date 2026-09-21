import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC,
  type AppSettings,
  type PermissionRequest,
  type SessionUpdateEvent
} from '../shared/types'

const grok = {
  getStatus: () => ipcRenderer.invoke(IPC.getStatus),
  getSettings: () => ipcRenderer.invoke(IPC.getSettings),
  setSettings: (patch: Partial<AppSettings>) => ipcRenderer.invoke(IPC.setSettings, patch),
  pickProject: () => ipcRenderer.invoke(IPC.pickProject),
  openProject: (cwd: string) => ipcRenderer.invoke(IPC.openProject, cwd),
  listSessions: (cwd?: string) => ipcRenderer.invoke(IPC.listSessions, cwd),
  newChat: () => ipcRenderer.invoke(IPC.newChat),
  loadSession: (sessionId: string) => ipcRenderer.invoke(IPC.loadSession, sessionId),
  sendPrompt: (text: string) => ipcRenderer.invoke(IPC.sendPrompt, text),
  cancel: () => ipcRenderer.invoke(IPC.cancel),
  respondPermission: (requestId: string, optionId: string | null) =>
    ipcRenderer.invoke(IPC.respondPermission, { requestId, optionId }),
  login: () => ipcRenderer.invoke(IPC.login),
  windowMinimize: () => ipcRenderer.invoke(IPC.windowMinimize),
  windowMaximize: () => ipcRenderer.invoke(IPC.windowMaximize),
  windowClose: () => ipcRenderer.invoke(IPC.windowClose),
  onStatus: (listener: (payload: unknown) => void) => subscribe(IPC.eventStatus, listener),
  onUpdate: (listener: (payload: SessionUpdateEvent) => void) =>
    subscribe(IPC.eventUpdate, listener),
  onPermission: (listener: (payload: PermissionRequest) => void) =>
    subscribe(IPC.eventPermission, listener),
  onStop: (listener: (payload: { sessionId: string; stopReason: string }) => void) =>
    subscribe(IPC.eventStop, listener),
  onSession: (listener: (payload: { sessionId: string; cwd: string }) => void) =>
    subscribe(IPC.eventSession, listener),
  onMenuOpenProject: (listener: () => void) => subscribe('menu:open-project', listener),
  onMenuNewChat: (listener: () => void) => subscribe('menu:new-chat', listener)
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
