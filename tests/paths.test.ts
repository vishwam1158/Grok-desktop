import { describe, expect, it } from 'vitest'
import { encodeSessionCwd } from '../src/main/paths'
import { buildAgentArgs } from '../src/main/grok-agent'

describe('session path encoding', () => {
  it('matches Grok Build cwd grouping', () => {
    expect(encodeSessionCwd('/Users/vishwam')).toBe('%2FUsers%2Fvishwam')
  })
})

describe('grok agent argv', () => {
  it('places model and effort before stdio', () => {
    expect(buildAgentArgs({ model: 'grok-4.6', reasoningEffort: 'medium' })).toEqual([
      'agent',
      '-m',
      'grok-4.6',
      '--reasoning-effort',
      'medium',
      '--no-leader',
      'stdio'
    ])
  })
})
