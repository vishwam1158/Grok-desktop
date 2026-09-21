import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { SessionSummary } from '../shared/types'
import { sessionGroupDir, sessionsRoot } from './paths'

interface SummaryJson {
  title?: string
  summary?: string
  model?: string
  modelId?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  message_count?: number
  messageCount?: number
}

function readJson(path: string): SummaryJson | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as SummaryJson
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
      const sessionDir = join(group, entry)
      if (!statSync(sessionDir).isDirectory()) continue
      const summaryPath = join(sessionDir, 'summary.json')
      const summary = existsSync(summaryPath) ? readJson(summaryPath) : null
      const stats = statSync(existsSync(summaryPath) ? summaryPath : sessionDir)
      results.push({
        id: entry,
        title: summary?.title || summary?.summary || 'Untitled session',
        cwd: groupCwd,
        createdAt: summary?.createdAt || summary?.created_at || stats.birthtime.toISOString(),
        updatedAt: summary?.updatedAt || summary?.updated_at || stats.mtime.toISOString(),
        model: summary?.model || summary?.modelId || null,
        messageCount: summary?.messageCount ?? summary?.message_count ?? 0
      })
    }
  }

  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
