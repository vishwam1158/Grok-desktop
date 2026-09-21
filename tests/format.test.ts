import { describe, expect, it } from 'vitest'
import { formatTokens, formatUsd } from '../src/shared/format'

describe('format helpers', () => {
  it('formats token counts', () => {
    expect(formatTokens(0)).toBe('0')
    expect(formatTokens(213079)).toBe('213k')
    expect(formatTokens(500000)).toBe('500k')
  })

  it('formats usd', () => {
    expect(formatUsd(null)).toBe('—')
    expect(formatUsd(1.25)).toBe('$1.25')
  })
})
