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

  it('keeps the user prompt above reasoning', () => {
    let messages: ChatMessage[] = addUserMessage([], 'fix the bug')
    messages = applySessionUpdate(messages, {
      sessionUpdate: 'agent_thought_chunk',
      content: { type: 'text', text: 'Looking at the stack trace…' }
    })
    messages = applySessionUpdate(messages, {
      sessionUpdate: 'user_message_chunk',
      content: { type: 'text', text: 'fix the bug' }
    })
    expect(messages.map((message) => message.role)).toEqual(['user', 'assistant'])
    expect(messages[0]).toMatchObject({ role: 'user', text: 'fix the bug' })
  })

  it('starts a new assistant after a later user prompt', () => {
    let messages: ChatMessage[] = addUserMessage([], 'first')
    messages = applySessionUpdate(messages, {
      sessionUpdate: 'agent_message_chunk',
      content: { type: 'text', text: 'done' }
    })
    messages = addUserMessage(messages, 'second')
    messages = applySessionUpdate(messages, {
      sessionUpdate: 'agent_thought_chunk',
      content: { type: 'text', text: 'thinking about second' }
    })
    expect(messages.map((message) => message.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant'
    ])
    const firstAssistant = messages[1]
    const secondAssistant = messages[3]
    expect(firstAssistant?.role === 'assistant' && firstAssistant.parts).toEqual([
      { type: 'text', text: 'done' }
    ])
    expect(secondAssistant?.role === 'assistant' && secondAssistant.parts).toEqual([
      { type: 'thought', text: 'thinking about second' }
    ])
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
