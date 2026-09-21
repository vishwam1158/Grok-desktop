import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { grokHome } from './paths'

export type AuthSource = 'oauth' | 'api-key' | 'none'

export function detectAuth(): { authenticated: boolean; authSource: AuthSource } {
  if (process.env.XAI_API_KEY) {
    return { authenticated: true, authSource: 'api-key' }
  }
  const authFile = join(grokHome(), 'auth.json')
  if (!existsSync(authFile)) {
    return { authenticated: false, authSource: 'none' }
  }
  try {
    const parsed = JSON.parse(readFileSync(authFile, 'utf8')) as Record<string, unknown>
    const hasToken = Boolean(
      parsed.access_token || parsed.accessToken || parsed.token || parsed.refresh_token
    )
    return { authenticated: hasToken, authSource: hasToken ? 'oauth' : 'none' }
  } catch {
    return { authenticated: false, authSource: 'none' }
  }
}

export function runGrokLogin(binary: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, ['login'], {
      detached: true,
      stdio: 'ignore',
      env: process.env
    })
    child.on('error', reject)
    child.unref()
    resolve()
  })
}

export function readGrokVersion(binary: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(binary, ['--version'], { env: process.env })
    let out = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      out += chunk.toString('utf8')
    })
    child.on('error', () => resolve(null))
    child.on('close', () => {
      const line = out.trim().split('\n')[0] ?? ''
      resolve(line || null)
    })
  })
}
