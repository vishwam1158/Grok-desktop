import { describe, expect, it } from 'vitest'
import { filterCommands, findCommand, parseSlash } from '../src/shared/commands'

describe('slash commands', () => {
  it('parses name and args', () => {
    expect(parseSlash('/model grok-4.7')).toEqual({ name: 'model', args: 'grok-4.7' })
    expect(parseSlash('/new')).toEqual({ name: 'new', args: '' })
    expect(parseSlash('hello')).toBeNull()
  })

  it('resolves aliases', () => {
    expect(findCommand('clear')?.name).toBe('new')
    expect(findCommand('yolo')?.name).toBe('always-approve')
    expect(findCommand('help')?.name).toBe('shortcuts')
  })

  it('filters the important command menu', () => {
    const names = filterCommands('comp').map((command) => command.name)
    expect(names).toContain('compact')
    expect(filterCommands('').length).toBeGreaterThan(8)
  })
})
