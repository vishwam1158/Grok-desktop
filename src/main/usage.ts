import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { COST_TICKS_PER_USD } from '../shared/format'
import { EMPTY_USAGE, type UsageSnapshot } from '../shared/types'
import { sessionDir } from './sessions'

interface UsageFile {
  sessionId?: string
  session?: {
    inputTokens?: number
    outputTokens?: number
    reasoningTokens?: number
    totalTokens?: number
    cachedReadTokens?: number
    modelCalls?: number
    turnCount?: number
    costUsdTicks?: number
    primaryModelId?: string
  }
}

interface SignalsFile {
  contextTokensUsed?: number
  contextWindowTokens?: number
  contextWindowUsage?: number
  turnCount?: number
  primaryModelId?: string
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return null
  }
}

export function readUsage(cwd: string, sessionId: string | null): UsageSnapshot {
  if (!sessionId) return { ...EMPTY_USAGE }
  const dir = sessionDir(cwd, sessionId)
  const usage = existsSync(join(dir, 'usage.json'))
    ? readJson<UsageFile>(join(dir, 'usage.json'))
    : null
  const signals = existsSync(join(dir, 'signals.json'))
    ? readJson<SignalsFile>(join(dir, 'signals.json'))
    : null
  const session = usage?.session
  const window = signals?.contextWindowTokens ?? 0
  const used = signals?.contextTokensUsed ?? 0
  const ticks = session?.costUsdTicks
  return {
    sessionId,
    inputTokens: session?.inputTokens ?? 0,
    outputTokens: session?.outputTokens ?? 0,
    reasoningTokens: session?.reasoningTokens ?? 0,
    totalTokens: session?.totalTokens ?? used,
    cachedReadTokens: session?.cachedReadTokens ?? 0,
    modelCalls: session?.modelCalls ?? 0,
    turnCount: session?.turnCount ?? signals?.turnCount ?? 0,
    costUsd: typeof ticks === 'number' ? ticks / COST_TICKS_PER_USD : null,
    contextTokensUsed: used,
    contextWindowTokens: window,
    contextRemaining: Math.max(0, window - used),
    contextPercent: window > 0 ? Math.min(100, Math.round((used / window) * 100)) : 0,
    primaryModelId: session?.primaryModelId ?? signals?.primaryModelId ?? null
  }
}
