import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { Readable, Writable } from 'node:stream'
import * as acp from '@agentclientprotocol/sdk'
import type {
  AgentConnectionState,
  AppSettings,
  PermissionMode,
  PermissionRequest,
  SessionUpdateEvent
} from '../shared/types'

export interface GrokAgentEvents {
  onStatus: (state: AgentConnectionState, error?: string | null) => void
  onSession: (sessionId: string) => void
  onUpdate: (event: SessionUpdateEvent) => void
  onPermission: (request: PermissionRequest) => void
  onStop: (sessionId: string, stopReason: string) => void
  onLog: (line: string) => void
}

interface PendingPermission {
  resolve: (optionId: string | null) => void
}

function sessionMeta(mode: PermissionMode): Record<string, unknown> {
  if (mode === 'always-approve') return { yoloMode: true }
  if (mode === 'auto') return { autoMode: true }
  return {}
}

function isInsideRoot(root: string, target: string): boolean {
  const rel = relative(root, target)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

export class GrokAgent {
  private proc: ChildProcess | null = null
  private connection: acp.ClientConnection | null = null
  private sessionId: string | null = null
  private projectRoot: string | null = null
  private running = false
  private permissions = new Map<string, PendingPermission>()

  constructor(
    private binary: string,
    private settings: AppSettings,
    private events: GrokAgentEvents
  ) {}

  get currentSessionId(): string | null {
    return this.sessionId
  }

  get isRunning(): boolean {
    return this.running
  }

  updateSettings(settings: AppSettings): void {
    this.settings = settings
  }

  async start(projectRoot: string): Promise<void> {
    await this.stop()
    this.projectRoot = resolve(projectRoot)
    this.events.onStatus('connecting')

    const args = ['agent', 'stdio', '--no-auto-update']
    if (this.settings.model) {
      args.push('-m', this.settings.model)
    }
    if (this.settings.reasoningEffort) {
      args.push('--reasoning-effort', this.settings.reasoningEffort)
    }

    const proc = spawn(this.binary, args, {
      cwd: this.projectRoot,
      env: {
        ...process.env,
        GROK_DISABLE_AUTOUPDATER: '1',
        HOME: process.env.HOME ?? homedir()
      },
      stdio: ['pipe', 'pipe', 'pipe']
    })
    this.proc = proc

    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8').trim()
      if (text) this.events.onLog(text)
    })
    proc.on('exit', (code, signal) => {
      if (this.proc === proc) {
        this.connection = null
        this.sessionId = null
        this.running = false
        const message = `grok agent exited (${signal ?? code ?? 'unknown'})`
        this.events.onStatus('disconnected', message)
      }
    })
    proc.on('error', (error) => {
      this.events.onStatus('error', error.message)
    })

    if (!proc.stdin || !proc.stdout) {
      throw new Error('Failed to open grok agent stdio')
    }

    const input = Writable.toWeb(proc.stdin)
    const output = Readable.toWeb(proc.stdout) as ReadableStream<Uint8Array>
    const stream = acp.ndJsonStream(input, output)

    this.connection = acp
      .client({ name: 'grok-desktop' })
      .onRequest(acp.methods.client.session.requestPermission, (ctx) =>
        this.handlePermission(ctx.params)
      )
      .onRequest(acp.methods.client.fs.readTextFile, (ctx) => this.handleRead(ctx.params))
      .onRequest(acp.methods.client.fs.writeTextFile, (ctx) => this.handleWrite(ctx.params))
      .onNotification(acp.methods.client.session.update, (ctx) => {
        const sessionId = String(ctx.params.sessionId ?? this.sessionId ?? '')
        this.events.onUpdate({
          sessionId,
          update: ctx.params.update as SessionUpdateEvent['update']
        })
      })
      .connect(stream)

    await this.connection.agent.request(acp.methods.agent.initialize, {
      protocolVersion: acp.PROTOCOL_VERSION,
      clientInfo: {
        name: 'grok-desktop',
        title: 'Grok Desktop',
        version: '0.1.0'
      },
      clientCapabilities: {
        fs: { readTextFile: true, writeTextFile: true }
      }
    })

    this.events.onStatus('ready')
  }

  async newSession(): Promise<string> {
    const agent = this.requireAgent()
    const cwd = this.requireProject()
    const created = await agent.request(acp.methods.agent.session.new, {
      cwd,
      mcpServers: [],
      _meta: sessionMeta(this.settings.permissionMode)
    })
    this.sessionId = created.sessionId
    this.events.onSession(created.sessionId)
    return created.sessionId
  }

  async loadSession(sessionId: string): Promise<string> {
    const agent = this.requireAgent()
    const cwd = this.requireProject()
    await agent.request(acp.methods.agent.session.load, {
      sessionId,
      cwd,
      mcpServers: []
    })
    this.sessionId = sessionId
    this.events.onSession(sessionId)
    return sessionId
  }

  async prompt(text: string): Promise<void> {
    const agent = this.requireAgent()
    if (!this.sessionId) {
      await this.newSession()
    }
    const sessionId = this.sessionId
    if (!sessionId) throw new Error('No active session')
    this.running = true
    this.events.onStatus('running')
    try {
      const result = await agent.request(acp.methods.agent.session.prompt, {
        sessionId,
        prompt: [{ type: 'text', text }]
      })
      this.events.onStop(sessionId, result.stopReason)
    } finally {
      this.running = false
      this.events.onStatus('ready')
    }
  }

  async cancel(): Promise<void> {
    const agent = this.connection?.agent
    if (!agent || !this.sessionId) return
    await agent.notify(acp.methods.agent.session.cancel, { sessionId: this.sessionId })
  }

  resolvePermission(requestId: string, optionId: string | null): void {
    const pending = this.permissions.get(requestId)
    if (!pending) return
    this.permissions.delete(requestId)
    pending.resolve(optionId)
  }

  async stop(): Promise<void> {
    for (const [id, pending] of this.permissions) {
      pending.resolve(null)
      this.permissions.delete(id)
    }
    this.connection?.close()
    this.connection = null
    this.sessionId = null
    this.running = false
    const proc = this.proc
    this.proc = null
    if (proc && proc.exitCode === null) {
      proc.kill('SIGTERM')
    }
  }

  private requireAgent(): acp.ClientContext {
    if (!this.connection) throw new Error('Grok agent is not connected')
    return this.connection.agent
  }

  private requireProject(): string {
    if (!this.projectRoot) throw new Error('No project is open')
    return this.projectRoot
  }

  private resolveSafe(path: string): string {
    const root = this.requireProject()
    const absolute = resolve(isAbsolute(path) ? path : join(root, path))
    if (!isInsideRoot(root, absolute)) {
      throw new Error('Path is outside the open project')
    }
    return absolute
  }

  private async handlePermission(
    params: acp.RequestPermissionRequest
  ): Promise<acp.RequestPermissionResponse> {
    const requestId = randomUUID()
    const request: PermissionRequest = {
      requestId,
      sessionId: params.sessionId,
      title: params.toolCall.title ?? 'Grok wants to run a tool',
      toolCallId: params.toolCall.toolCallId,
      options: params.options.map((option) => ({
        optionId: option.optionId,
        name: option.name,
        kind: option.kind
      }))
    }
    const optionId = await new Promise<string | null>((resolve) => {
      this.permissions.set(requestId, { resolve })
      this.events.onPermission(request)
    })
    if (!optionId) {
      return { outcome: { outcome: 'cancelled' } }
    }
    return { outcome: { outcome: 'selected', optionId } }
  }

  private async handleRead(params: acp.ReadTextFileRequest): Promise<acp.ReadTextFileResponse> {
    const path = this.resolveSafe(params.path)
    if (params.line !== undefined || params.limit !== undefined) {
      const content = await readFileSlice(path, params.line ?? undefined, params.limit ?? undefined)
      return { content }
    }
    const content = await readFile(path, 'utf8')
    return { content }
  }

  private async handleWrite(params: acp.WriteTextFileRequest): Promise<acp.WriteTextFileResponse> {
    const path = this.resolveSafe(params.path)
    await writeFile(path, params.content, 'utf8')
    return {}
  }
}

async function readFileSlice(
  path: string,
  line: number | undefined,
  limit: number | undefined
): Promise<string> {
  const start = Math.max(1, line ?? 1)
  const maxLines = limit ?? Number.POSITIVE_INFINITY
  const stream = createReadStream(path, { encoding: 'utf8' })
  let buffer = ''
  let current = 1
  const collected: string[] = []
  for await (const chunk of stream) {
    buffer += chunk
    let idx: number
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const next = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      if (current >= start && collected.length < maxLines) collected.push(next)
      current += 1
      if (collected.length >= maxLines) {
        stream.destroy()
        return collected.join('\n')
      }
    }
  }
  if (buffer && current >= start && collected.length < maxLines) collected.push(buffer)
  return collected.join('\n')
}
