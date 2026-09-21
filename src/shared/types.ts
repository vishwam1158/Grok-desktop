export type PermissionMode = 'ask' | 'auto' | 'always-approve'

export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh'

export type AgentConnectionState = 'disconnected' | 'connecting' | 'ready' | 'running' | 'error'

export interface ProjectRecord {
  path: string
  name: string
  lastSessionId: string | null
  addedAt: string
}

export interface AppSettings {
  grokBinary: string
  model: string
  permissionMode: PermissionMode
  reasoningEffort: ReasoningEffort
  showThinking: boolean
  resumeLastProject: boolean
  lastProjectPath: string | null
  projects: ProjectRecord[]
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

export interface AccountInfo {
  email: string | null
  name: string | null
  subscriptionTier: string | null
  authMode: string | null
}

export interface ModelOption {
  id: string
  isDefault: boolean
}

export interface UsageSnapshot {
  sessionId: string | null
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  totalTokens: number
  cachedReadTokens: number
  modelCalls: number
  turnCount: number
  costUsd: number | null
  contextTokensUsed: number
  contextWindowTokens: number
  contextRemaining: number
  contextPercent: number
  primaryModelId: string | null
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

export const EMPTY_USAGE: UsageSnapshot = {
  sessionId: null,
  inputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  totalTokens: 0,
  cachedReadTokens: 0,
  modelCalls: 0,
  turnCount: 0,
  costUsd: null,
  contextTokensUsed: 0,
  contextWindowTokens: 0,
  contextRemaining: 0,
  contextPercent: 0,
  primaryModelId: null
}

export const DEFAULT_SETTINGS: AppSettings = {
  grokBinary: '',
  model: 'grok-4.7',
  permissionMode: 'ask',
  reasoningEffort: 'medium',
  showThinking: true,
  resumeLastProject: true,
  lastProjectPath: null,
  projects: [],
  recentProjects: []
}

export const IPC = {
  getStatus: 'grok:get-status',
  getSettings: 'grok:get-settings',
  setSettings: 'grok:set-settings',
  getAccount: 'grok:get-account',
  getUsage: 'grok:get-usage',
  listModels: 'grok:list-models',
  pickProject: 'grok:pick-project',
  openProject: 'grok:open-project',
  removeProject: 'grok:remove-project',
  listSessions: 'grok:list-sessions',
  loadTranscript: 'grok:load-transcript',
  newChat: 'grok:new-chat',
  loadSession: 'grok:load-session',
  deleteSession: 'grok:delete-session',
  sendPrompt: 'grok:send-prompt',
  cancel: 'grok:cancel',
  respondPermission: 'grok:respond-permission',
  login: 'grok:login',
  logout: 'grok:logout',
  windowMinimize: 'window:minimize',
  windowMaximize: 'window:maximize',
  windowClose: 'window:close',
  saveText: 'grok:save-text',
  eventStatus: 'event:status',
  eventUpdate: 'event:session-update',
  eventPermission: 'event:permission',
  eventStop: 'event:prompt-stop',
  eventError: 'event:error',
  eventSession: 'event:session',
  eventAccount: 'event:account',
  eventUsage: 'event:usage'
} as const
