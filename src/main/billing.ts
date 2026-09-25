import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EMPTY_ALLOWANCE, type AllowanceSnapshot } from '../shared/types'
import { grokHome } from './paths'

const BILLING_URL = 'https://cli-chat-proxy.grok.com/v1/billing?format=credits'

function accessToken(): string | null {
  const authFile = join(grokHome(), 'auth.json')
  if (!existsSync(authFile)) return null
  try {
    const parsed = JSON.parse(readFileSync(authFile, 'utf8')) as unknown
    return findToken(parsed)
  } catch {
    return null
  }
}

function findToken(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findToken(item)
      if (found) return found
    }
    return null
  }
  const record = value as Record<string, unknown>
  if (typeof record.key === 'string' && record.key.length > 20) return record.key
  for (const nested of Object.values(record)) {
    const found = findToken(nested)
    if (found) return found
  }
  return null
}

function numberVal(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value && typeof value === 'object' && 'val' in value) {
    const inner = (value as { val?: unknown }).val
    if (typeof inner === 'number' && Number.isFinite(inner)) return inner
  }
  return null
}

export async function fetchAllowance(): Promise<AllowanceSnapshot> {
  const token = accessToken()
  if (!token) return { ...EMPTY_ALLOWANCE, error: 'Sign in to see the weekly limit' }
  try {
    const response = await fetch(BILLING_URL, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    if (!response.ok) return { ...EMPTY_ALLOWANCE, error: 'Usage limit unavailable' }
    const body = (await response.json()) as { config?: Record<string, unknown> }
    const config = body.config ?? {}
    const period = config.currentPeriod as
      { type?: string; start?: string; end?: string } | undefined
    const used = numberVal(config.creditUsagePercent)
    const kind =
      period?.type === 'USAGE_PERIOD_TYPE_WEEKLY'
        ? 'weekly'
        : period?.type === 'USAGE_PERIOD_TYPE_MONTHLY'
          ? 'monthly'
          : period
            ? 'period'
            : null
    const products = Array.isArray(config.productUsage) ? config.productUsage : []
    const build = products.find(
      (item) =>
        item && typeof item === 'object' && (item as { product?: string }).product === 'GrokBuild'
    ) as { usagePercent?: number } | undefined
    return {
      period: kind,
      usedPercent: used,
      remainingPercent: used == null ? null : Math.max(0, Math.round((100 - used) * 10) / 10),
      periodStart: typeof period?.start === 'string' ? period.start : null,
      periodEnd:
        typeof period?.end === 'string'
          ? period.end
          : typeof config.billingPeriodEnd === 'string'
            ? config.billingPeriodEnd
            : null,
      prepaidBalance: numberVal(config.prepaidBalance),
      buildPercent: typeof build?.usagePercent === 'number' ? build.usagePercent : null,
      error: null
    }
  } catch {
    return { ...EMPTY_ALLOWANCE, error: 'Usage limit unavailable' }
  }
}
