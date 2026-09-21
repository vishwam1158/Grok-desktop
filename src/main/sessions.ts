import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { applySessionUpdate, type ChatMessage } from '../shared/conversation'
import type { SessionSummary, SessionUpdate } from '../shared/types'
import { sessionGroupDir, sessionsRoot } from './paths'

interface SummaryJson {
  session_summary?: string
  generated_title?: string
  last_turn_summary?: string
  title?: string
  summary?: string
  current_model_id?: string
  model?: string
  modelId?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  last_active_at?: string
  num_messages?: number
  num_chat_messages?: number
  message_count?: number
  messageCount?: number
  info?: { id?: string; cwd?: string }
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return null
  }
}

function decodeCwd(encoded: string, groupDir: string): string {
  try {
    return decodeURIComponent(encoded)
  } catch {
    const marker = join(groupDir, '.cwd')
    if (existsSync(marker)) {
      try {
        return readFileSync(marker, 'utf8').trim()
      } catch {
        return encoded
      }
    }
    return encoded
  }
}

export function sessionDir(cwd: string, sessionId: string): string {
  return join(sessionGroupDir(cwd), sessionId)
}

export function listDiskSessions(cwd?: string): SessionSummary[] {
  const root = sessionsRoot()
  if (!existsSync(root)) return []

  const groups = cwd ? [sessionGroupDir(cwd)] : readdirSync(root).map((name) => join(root, name))
  const results: SessionSummary[] = []

  for (const group of groups) {
    if (!existsSync(group) || !statSync(group).isDirectory()) continue
    const encoded = group.split(/[/\\]/).pop() ?? ''
    const groupCwd = decodeCwd(encoded, group)

    for (const entry of readdirSync(group)) {
      const dir = join(group, entry)
      if (!statSync(dir).isDirectory()) continue
      const summaryPath = join(dir, 'summary.json')
      const summary = existsSync(summaryPath) ? readJson<SummaryJson>(summaryPath) : null
      const stats = statSync(existsSync(summaryPath) ? summaryPath : dir)
      results.push({
        id: summary?.info?.id || entry,
        title:
          summary?.generated_title ||
          summary?.session_summary ||
          summary?.last_turn_summary ||
          summary?.title ||
          summary?.summary ||
          'New chat',
        cwd: summary?.info?.cwd || groupCwd,
        createdAt: summary?.createdAt || summary?.created_at || stats.birthtime.toISOString(),
        updatedAt:
          summary?.last_active_at ||
          summary?.updatedAt ||
          summary?.updated_at ||
          stats.mtime.toISOString(),
        model: summary?.current_model_id || summary?.model || summary?.modelId || null,
        messageCount:
          summary?.num_chat_messages ??
          summary?.num_messages ??
          summary?.messageCount ??
          summary?.message_count ??
          0
      })
    }
  }

  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function loadTranscript(cwd: string, sessionId: string): ChatMessage[] {
  const updatesPath = join(sessionDir(cwd, sessionId), 'updates.jsonl')
  if (!existsSync(updatesPath)) return []
  let messages: ChatMessage[] = []
  for (const line of readFileSync(updatesPath, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const parsed = JSON.parse(line) as {
        params?: { update?: SessionUpdate }
        update?: SessionUpdate
      }
      const update = parsed.params?.update ?? parsed.update
      if (update?.sessionUpdate) messages = applySessionUpdate(messages, update)
    } catch {
      // skip malformed lines
    }
  }
  return messages
}

export function deleteSessionOnDisk(binary: string, sessionId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, ['sessions', 'delete', sessionId], { env: process.env })
    let err = ''
    child.stderr?.on('data', (chunk: Buffer) => {
      err += chunk.toString('utf8')
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(err.trim() || `Failed to delete session ${sessionId}`))
    })
  })
}
