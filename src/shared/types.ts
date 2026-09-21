export type PermissionMode = 'ask' | 'auto' | 'always-approve'

export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh'

export type AgentConnectionState = 'disconnected' | 'connecting' | 'ready' | 'running' | 'error'

export interface AppSettings {
  grokBinary: string
  model: string
  permissionMode: PermissionMode
  reasoningEffort: ReasoningEffort
  recentProjects: string[]
}

export interface GrokRuntimeStatus {
  binaryPath: string | null
  version: string | null
  authenticated: boolean
  authSource: 'oauth' | 'api-key' | 'none'
  connection: AgentConnectionState
  error: string | null
}

export interface SessionSummary {
  id: string
  title: string
  cwd: string
  updatedAt: string
  createdAt: string
  model: string | null
  messageCount: number
}

export interface PermissionOption {
  optionId: string
  name: string
  kind: string
}

export interface PermissionRequest {
  requestId: string
  sessionId: string
  title: string
  toolCallId?: string
  options: PermissionOption[]
}

export interface ContentBlock {
  type: string
  text?: string
  mimeType?: string
  data?: string
  uri?: string
  name?: string
  [key: string]: unknown
}

export interface ToolCallEvent {
  toolCallId: string
  title?: string
  kind?: string
  status?: string
  toolName?: string
  rawInput?: unknown
  rawOutput?: unknown
  content?: unknown[]
  locations?: unknown[]
}

export type SessionUpdate =
  | { sessionUpdate: 'user_message_chunk'; content: ContentBlock }
  | { sessionUpdate: 'agent_message_chunk'; content: ContentBlock }
  | { sessionUpdate: 'agent_thought_chunk'; content: ContentBlock }
  | ({ sessionUpdate: 'tool_call' } & ToolCallEvent)
  | ({ sessionUpdate: 'tool_call_update' } & Partial<ToolCallEvent> & {
        toolCallId: string
      })
  | { sessionUpdate: 'plan'; entries: Array<{ content: string; status?: string }> }
  | { sessionUpdate: 'available_commands'; commands?: unknown[]; tools?: unknown[] }
  | { sessionUpdate: 'session_info_update'; title?: string }
  | { sessionUpdate: string; content?: ContentBlock; [key: string]: unknown }

export interface SessionUpdateEvent {
  sessionId: string
  update: SessionUpdate
}

export interface PromptStopEvent {
  sessionId: string
  stopReason: string
}

export interface AgentErrorEvent {
  message: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  grokBinary: '',
  model: 'grok-4.6',
  permissionMode: 'ask',
  reasoningEffort: 'medium',
  recentProjects: []
}

export const IPC = {
  getStatus: 'grok:get-status',
  getSettings: 'grok:get-settings',
  setSettings: 'grok:set-settings',
  pickProject: 'grok:pick-project',
  openProject: 'grok:open-project',
  listSessions: 'grok:list-sessions',
  newChat: 'grok:new-chat',
  loadSession: 'grok:load-session',
  sendPrompt: 'grok:send-prompt',
  cancel: 'grok:cancel',
  respondPermission: 'grok:respond-permission',
  login: 'grok:login',
  windowMinimize: 'window:minimize',
  windowMaximize: 'window:maximize',
  windowClose: 'window:close',
  eventStatus: 'event:status',
  eventUpdate: 'event:session-update',
  eventPermission: 'event:permission',
  eventStop: 'event:prompt-stop',
  eventError: 'event:error',
  eventSession: 'event:session'
} as const
