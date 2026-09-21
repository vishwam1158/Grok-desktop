import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import type { AccountInfo } from '../shared/types'
import { grokHome } from './paths'

export type AuthSource = 'oauth' | 'api-key' | 'none'

function walkAuthRecords(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap(walkAuthRecords)
  const record = value as Record<string, unknown>
  const nested = Object.values(record).flatMap(walkAuthRecords)
  return [record, ...nested]
}

export function readAccount(): AccountInfo {
  const empty: AccountInfo = { email: null, name: null, subscriptionTier: null, authMode: null }
  const authFile = join(grokHome(), 'auth.json')
  if (!existsSync(authFile)) return empty
  try {
    const parsed = JSON.parse(readFileSync(authFile, 'utf8')) as unknown
    const records = walkAuthRecords(parsed)
    const withEmail = records.find((record) => typeof record.email === 'string')
    if (!withEmail) return empty
    return {
      email: String(withEmail.email),
      name: typeof withEmail.first_name === 'string' ? withEmail.first_name : null,
      subscriptionTier:
        typeof withEmail.subscription_tier === 'string' ? withEmail.subscription_tier : null,
      authMode: typeof withEmail.auth_mode === 'string' ? withEmail.auth_mode : null
    }
  } catch {
    return empty
  }
}

export function detectAuth(): { authenticated: boolean; authSource: AuthSource } {
  if (process.env.XAI_API_KEY) {
    return { authenticated: true, authSource: 'api-key' }
  }
  const account = readAccount()
  if (account.email) return { authenticated: true, authSource: 'oauth' }
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

export function runGrokLogout(binary: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, ['logout'], { env: process.env })
    child.on('error', reject)
    child.on('close', () => resolve())
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
