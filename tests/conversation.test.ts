import { describe, expect, it } from 'vitest'
import {
  addUserMessage,
  applySessionUpdate,
  type ChatMessage
} from '../src/renderer/src/lib/conversation'

describe('conversation reducer', () => {
  it('appends user messages', () => {
    const next = addUserMessage([], 'hello')
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ role: 'user', text: 'hello' })
  })

  it('streams assistant text into one part', () => {
    let messages: ChatMessage[] = addUserMessage([], 'hi')
    messages = applySessionUpdate(messages, {
      sessionUpdate: 'agent_message_chunk',
      content: { type: 'text', text: 'Hel' }
    })
    messages = applySessionUpdate(messages, {
      sessionUpdate: 'agent_message_chunk',
      content: { type: 'text', text: 'lo' }
    })
    const assistant = messages[1]
    expect(assistant?.role).toBe('assistant')
    if (assistant?.role === 'assistant') {
      expect(assistant.parts).toEqual([{ type: 'text', text: 'Hello' }])
    }
  })

  it('updates matching tool calls', () => {
    let messages: ChatMessage[] = applySessionUpdate([], {
      sessionUpdate: 'tool_call',
      toolCallId: 't1',
      title: 'Read',
      status: 'in_progress'
    })
    messages = applySessionUpdate(messages, {
      sessionUpdate: 'tool_call_update',
      toolCallId: 't1',
      status: 'completed',
      rawOutput: { ok: true }
    })
    const assistant = messages[0]
    expect(assistant?.role).toBe('assistant')
    if (assistant?.role === 'assistant') {
      expect(assistant.parts[0]).toMatchObject({
        type: 'tool',
        toolCallId: 't1',
        status: 'completed'
      })
    }
  })
})
