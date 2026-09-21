import { dialog, ipcMain, type BrowserWindow } from 'electron'
import type { AppSettings } from '../shared/types'
import { IPC } from '../shared/types'
import { detectAuth, readGrokVersion, runGrokLogin } from './auth'
import { GrokAgent } from './grok-agent'
import { resolveGrokBinary } from './paths'
import { loadSettings, rememberProject, saveSettings } from './settings'
import { listDiskSessions } from './sessions'

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  let settings = loadSettings()
  let agent: GrokAgent | null = null
  let projectPath: string | null = null

  const send = (channel: string, payload: unknown): void => {
    getWindow()?.webContents.send(channel, payload)
  }

  const statusPayload = async () => {
    const binary = resolveGrokBinary(settings.grokBinary)
    const auth = detectAuth()
    const version = binary ? await readGrokVersion(binary) : null
    return {
      binaryPath: binary,
      version,
      authenticated: auth.authenticated,
      authSource: auth.authSource,
      connection: agent ? (agent.isRunning ? 'running' : 'ready') : 'disconnected',
      error: binary ? null : 'Grok CLI not found. Install from https://x.ai/cli'
    }
  }

  const bindAgent = (binary: string, cwd: string): GrokAgent => {
    agent = new GrokAgent(binary, settings, {
      onStatus: (connection, error) => {
        void statusPayload().then((base) => {
          send(IPC.eventStatus, { ...base, connection, error: error ?? base.error })
        })
      },
      onSession: (sessionId) => send(IPC.eventSession, { sessionId, cwd }),
      onUpdate: (event) => send(IPC.eventUpdate, event),
      onPermission: (request) => send(IPC.eventPermission, request),
      onStop: (sessionId, stopReason) => send(IPC.eventStop, { sessionId, stopReason }),
      onLog: (line) => {
        if (process.env.NODE_ENV === 'development') console.error('[grok]', line)
      }
    })
    return agent
  }

  ipcMain.handle(IPC.getStatus, () => statusPayload())
  ipcMain.handle(IPC.getSettings, () => settings)
  ipcMain.handle(IPC.setSettings, async (_event, patch: Partial<AppSettings>) => {
    settings = { ...settings, ...patch }
    saveSettings(settings)
    agent?.updateSettings(settings)
    return settings
  })

  ipcMain.handle(IPC.pickProject, async () => {
    const window = getWindow()
    const options: Electron.OpenDialogOptions = {
      title: 'Open project',
      properties: ['openDirectory']
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  ipcMain.handle(IPC.openProject, async (_event, cwd: string) => {
    const binary = resolveGrokBinary(settings.grokBinary)
    if (!binary) throw new Error('Grok CLI was not found on this machine')
    settings = rememberProject(settings, cwd)
    projectPath = cwd
    const next = bindAgent(binary, cwd)
    await next.start(cwd)
    const sessionId = await next.newSession()
    return {
      cwd,
      sessionId,
      sessions: listDiskSessions(cwd),
      status: await statusPayload()
    }
  })

  ipcMain.handle(IPC.listSessions, (_event, cwd?: string) =>
    listDiskSessions(cwd || projectPath || undefined)
  )

  ipcMain.handle(IPC.newChat, async () => {
    if (!agent) throw new Error('Open a project first')
    const sessionId = await agent.newSession()
    return { sessionId, cwd: projectPath }
  })

  ipcMain.handle(IPC.loadSession, async (_event, sessionId: string) => {
    if (!agent) throw new Error('Open a project first')
    await agent.loadSession(sessionId)
    return { sessionId, cwd: projectPath }
  })

  ipcMain.handle(IPC.sendPrompt, async (_event, text: string) => {
    if (!agent) throw new Error('Open a project first')
    await agent.prompt(text)
  })

  ipcMain.handle(IPC.cancel, async () => {
    await agent?.cancel()
  })

  ipcMain.handle(
    IPC.respondPermission,
    (_event, payload: { requestId: string; optionId: string | null }) => {
      agent?.resolvePermission(payload.requestId, payload.optionId)
    }
  )

  ipcMain.handle(IPC.login, async () => {
    const binary = resolveGrokBinary(settings.grokBinary)
    if (!binary) throw new Error('Grok CLI was not found on this machine')
    await runGrokLogin(binary)
  })

  ipcMain.handle(IPC.windowMinimize, () => getWindow()?.minimize())
  ipcMain.handle(IPC.windowMaximize, () => {
    const window = getWindow()
    if (!window) return
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  })
  ipcMain.handle(IPC.windowClose, () => getWindow()?.close())
}

export async function disposeAgent(): Promise<void> {
  // agent is closed by the window lifecycle in index.ts
}
