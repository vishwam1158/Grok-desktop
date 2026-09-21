import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'

export function grokHome(): string {
  return process.env.GROK_HOME || join(homedir(), '.grok')
}

export function encodeSessionCwd(cwd: string): string {
  return encodeURIComponent(cwd)
}

export function sessionsRoot(): string {
  return join(grokHome(), 'sessions')
}

export function sessionGroupDir(cwd: string): string {
  return join(sessionsRoot(), encodeSessionCwd(cwd))
}

export function whichOnPath(name: string): string | null {
  const pathEnv = process.env.PATH ?? ''
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue
    const candidate = join(dir, name)
    if (existsSync(candidate)) return candidate
    if (process.platform === 'win32' && existsSync(`${candidate}.exe`)) {
      return `${candidate}.exe`
    }
  }
  return null
}

export function defaultGrokBinary(): string | null {
  const managed = join(grokHome(), 'bin', process.platform === 'win32' ? 'grok.exe' : 'grok')
  if (existsSync(managed)) return managed
  return whichOnPath('grok')
}

export function resolveGrokBinary(configured: string): string | null {
  if (configured && existsSync(configured)) return configured
  return defaultGrokBinary()
}
