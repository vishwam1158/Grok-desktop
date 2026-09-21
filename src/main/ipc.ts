import { dialog, ipcMain, type BrowserWindow } from 'electron'
import { EMPTY_USAGE, IPC, type AppSettings } from '../shared/types'
import { detectAuth, readAccount, readGrokVersion, runGrokLogin, runGrokLogout } from './auth'
import { GrokAgent } from './grok-agent'
import { listGrokModels } from './models'
import { resolveGrokBinary } from './paths'
import { forgetProject, loadSettings, rememberProject, saveSettings } from './settings'
import { deleteSessionOnDisk, listDiskSessions, loadTranscript } from './sessions'
import { readUsage } from './usage'

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  let settings = loadSettings()
  let agent: GrokAgent | null = null
  let projectPath: string | null = null
  let account = readAccount()

  const send = (channel: string, payload: unknown): void => {
    getWindow()?.webContents.send(channel, payload)
  }

  const usageFor = (sessionId: string | null) => {
    if (!projectPath || !sessionId) return { ...EMPTY_USAGE, sessionId }
    return readUsage(projectPath, sessionId)
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
      onSession: (sessionId) => {
        settings = rememberProject(settings, cwd, sessionId)
        send(IPC.eventSession, { sessionId, cwd })
        send(IPC.eventUsage, usageFor(sessionId))
      },
      onUpdate: (event) => send(IPC.eventUpdate, event),
      onPermission: (request) => send(IPC.eventPermission, request),
      onStop: (sessionId, stopReason) => {
        send(IPC.eventStop, { sessionId, stopReason })
        send(IPC.eventUsage, usageFor(sessionId))
      },
      onAccount: (next) => {
        account = {
          email: next.email ?? account.email,
          name: next.name ?? account.name,
          subscriptionTier: next.subscriptionTier ?? account.subscriptionTier,
          authMode: next.authMode ?? account.authMode
        }
        send(IPC.eventAccount, account)
      },
      onLog: (line) => {
        console.error('[grok]', line)
      }
    })
    return agent
  }

  const openAt = async (cwd: string, resumeSessionId?: string | null) => {
    const binary = resolveGrokBinary(settings.grokBinary)
    if (!binary) throw new Error('Grok CLI was not found on this machine')
    settings = rememberProject(settings, cwd)
    projectPath = cwd
    const next = bindAgent(binary, cwd)
    await next.start(cwd)
    const sessions = listDiskSessions(cwd)
    const preferred =
      resumeSessionId ||
      settings.projects.find((project) => project.path === cwd)?.lastSessionId ||
      sessions[0]?.id ||
      null
    let sessionId: string
    if (preferred) {
      try {
        sessionId = await next.loadSession(preferred)
      } catch {
        sessionId = await next.newSession()
      }
    } else {
      sessionId = await next.newSession()
    }
    settings = rememberProject(settings, cwd, sessionId)
    return {
      cwd,
      sessionId,
      sessions: listDiskSessions(cwd),
      messages: loadTranscript(cwd, sessionId),
      usage: usageFor(sessionId),
      settings,
      status: await statusPayload()
    }
  }

  ipcMain.handle(IPC.getStatus, () => statusPayload())
  ipcMain.handle(IPC.getSettings, () => settings)
  ipcMain.handle(IPC.getAccount, () => account)
  ipcMain.handle(IPC.getUsage, (_event, sessionId?: string) =>
    usageFor(sessionId || agent?.currentSessionId || null)
  )
  ipcMain.handle(IPC.listModels, async () => {
    const binary = resolveGrokBinary(settings.grokBinary)
    return binary ? listGrokModels(binary) : []
  })
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

  ipcMain.handle(IPC.openProject, async (_event, cwd: string) => openAt(cwd))

  ipcMain.handle(IPC.removeProject, (_event, cwd: string) => {
    settings = forgetProject(settings, cwd)
    if (projectPath === cwd) {
      void agent?.stop()
      agent = null
      projectPath = null
    }
    return settings
  })

  ipcMain.handle(IPC.listSessions, (_event, cwd?: string) =>
    listDiskSessions(cwd || projectPath || undefined)
  )

  ipcMain.handle(IPC.loadTranscript, (_event, payload: { cwd?: string; sessionId: string }) => {
    const cwd = payload.cwd || projectPath
    if (!cwd) return []
    return loadTranscript(cwd, payload.sessionId)
  })

  ipcMain.handle(IPC.newChat, async () => {
    if (!agent || !projectPath) throw new Error('Open a project first')
    const sessionId = await agent.newSession()
    settings = rememberProject(settings, projectPath, sessionId)
    return {
      sessionId,
      cwd: projectPath,
      sessions: listDiskSessions(projectPath),
      messages: [],
      usage: usageFor(sessionId)
    }
  })

  ipcMain.handle(IPC.loadSession, async (_event, sessionId: string) => {
    if (!agent || !projectPath) throw new Error('Open a project first')
    await agent.loadSession(sessionId)
    settings = rememberProject(settings, projectPath, sessionId)
    return {
      sessionId,
      cwd: projectPath,
      messages: loadTranscript(projectPath, sessionId),
      usage: usageFor(sessionId)
    }
  })

  ipcMain.handle(IPC.deleteSession, async (_event, sessionId: string) => {
    const binary = resolveGrokBinary(settings.grokBinary)
    if (!binary) throw new Error('Grok CLI was not found on this machine')
    await deleteSessionOnDisk(binary, sessionId)
    const sessions = listDiskSessions(projectPath || undefined)
    if (agent?.currentSessionId === sessionId) {
      if (sessions[0]) {
        await agent.loadSession(sessions[0].id)
        if (projectPath) settings = rememberProject(settings, projectPath, sessions[0].id)
        return {
          sessionId: sessions[0].id,
          sessions,
          messages: projectPath ? loadTranscript(projectPath, sessions[0].id) : [],
          usage: usageFor(sessions[0].id)
        }
      }
      const created = await agent.newSession()
      return {
        sessionId: created,
        sessions: listDiskSessions(projectPath || undefined),
        messages: [],
        usage: usageFor(created)
      }
    }
    return { sessionId: agent?.currentSessionId ?? null, sessions, messages: null, usage: null }
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

  ipcMain.handle(IPC.logout, async () => {
    const binary = resolveGrokBinary(settings.grokBinary)
    if (!binary) throw new Error('Grok CLI was not found on this machine')
    await runGrokLogout(binary)
    account = readAccount()
    send(IPC.eventAccount, account)
    return account
  })

  ipcMain.handle(IPC.windowMinimize, () => getWindow()?.minimize())
  ipcMain.handle(IPC.windowMaximize, () => {
    const window = getWindow()
    if (!window) return
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  })
  ipcMain.handle(IPC.windowClose, () => getWindow()?.close())

  ipcMain.handle(IPC.saveText, async (_event, payload: { title?: string; content: string }) => {
    const window = getWindow()
    const result = window
      ? await dialog.showSaveDialog(window, {
          title: payload.title ?? 'Export chat',
          defaultPath: 'grok-chat.md',
          filters: [{ name: 'Markdown', extensions: ['md'] }]
        })
      : await dialog.showSaveDialog({
          title: payload.title ?? 'Export chat',
          defaultPath: 'grok-chat.md',
          filters: [{ name: 'Markdown', extensions: ['md'] }]
        })
    if (result.canceled || !result.filePath) return false
    const { writeFile } = await import('node:fs/promises')
    await writeFile(result.filePath, payload.content, 'utf8')
    return true
  })
}
