import { describe, expect, it } from 'vitest'
import { encodeSessionCwd } from '../src/main/paths'

describe('session path encoding', () => {
  it('matches Grok Build cwd grouping', () => {
    expect(encodeSessionCwd('/Users/vishwam')).toBe('%2FUsers%2Fvishwam')
  })
})
