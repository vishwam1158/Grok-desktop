import type { SessionUpdate } from '@shared/types'

export type ToolCallPart = {
  type: 'tool'
  toolCallId: string
  title: string
  kind?: string
  status: string
  toolName?: string
  rawInput?: unknown
  rawOutput?: unknown
}

export type TextPart = { type: 'text'; text: string }
export type ThoughtPart = { type: 'thought'; text: string }
export type PlanPart = {
  type: 'plan'
  entries: Array<{ content: string; status?: string }>
}

export type AssistantPart = TextPart | ThoughtPart | ToolCallPart | PlanPart

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; parts: AssistantPart[] }

function ensureAssistant(messages: ChatMessage[]): ChatMessage[] {
  const last = messages[messages.length - 1]
  if (last?.role === 'assistant') return messages
  return [...messages, { id: crypto.randomUUID(), role: 'assistant', parts: [] }]
}

function mutateLastAssistant(
  messages: ChatMessage[],
  mutate: (parts: AssistantPart[]) => AssistantPart[]
): ChatMessage[] {
  const next = ensureAssistant(messages)
  const index = next.findLastIndex((message) => message.role === 'assistant')
  const message = next[index]
  if (!message || message.role !== 'assistant') return next
  const copy = [...next]
  copy[index] = { ...message, parts: mutate(message.parts) }
  return copy
}

function appendText(
  parts: AssistantPart[],
  type: 'text' | 'thought',
  text: string
): AssistantPart[] {
  const last = parts[parts.length - 1]
  if (last && last.type === type) {
    return [...parts.slice(0, -1), { ...last, text: last.text + text }]
  }
  return [...parts, { type, text }]
}

function chunkText(update: SessionUpdate): string {
  const content = 'content' in update ? update.content : undefined
  if (
    content &&
    typeof content === 'object' &&
    'text' in content &&
    typeof content.text === 'string'
  ) {
    return content.text
  }
  return ''
}

export function applySessionUpdate(messages: ChatMessage[], update: SessionUpdate): ChatMessage[] {
  switch (update.sessionUpdate) {
    case 'user_message_chunk': {
      const text = chunkText(update)
      if (!text) return messages
      const last = messages[messages.length - 1]
      // ACP echoes the prompt. Never insert a user bubble under assistant output.
      if (last?.role === 'assistant') return messages
      if (last?.role === 'user') {
        if (last.text.includes(text) || text.includes(last.text)) return messages
        return [...messages.slice(0, -1), { ...last, text: last.text + text }]
      }
      return [...messages, { id: crypto.randomUUID(), role: 'user', text }]
    }
    case 'agent_message_chunk': {
      const text = chunkText(update)
      if (!text) return messages
      return mutateLastAssistant(messages, (parts) => appendText(parts, 'text', text))
    }
    case 'agent_thought_chunk': {
      const text = chunkText(update)
      if (!text) return messages
      return mutateLastAssistant(messages, (parts) => appendText(parts, 'thought', text))
    }
    case 'tool_call': {
      const part: ToolCallPart = {
        type: 'tool',
        toolCallId: String(update.toolCallId ?? crypto.randomUUID()),
        title: String(update.title ?? 'Tool'),
        kind: update.kind ? String(update.kind) : undefined,
        status: String(update.status ?? 'pending'),
        toolName: update.toolName ? String(update.toolName) : undefined,
        rawInput: update.rawInput,
        rawOutput: update.rawOutput
      }
      return mutateLastAssistant(messages, (parts) => [...parts, part])
    }
    case 'tool_call_update': {
      return mutateLastAssistant(messages, (parts) =>
        parts.map((part) => {
          if (part.type !== 'tool' || part.toolCallId !== update.toolCallId) return part
          return {
            ...part,
            title: update.title ? String(update.title) : part.title,
            kind: update.kind ? String(update.kind) : part.kind,
            status: update.status ? String(update.status) : part.status,
            rawInput: update.rawInput ?? part.rawInput,
            rawOutput: update.rawOutput ?? part.rawOutput
          }
        })
      )
    }
    case 'plan': {
      const entries = Array.isArray(update.entries) ? update.entries : []
      return mutateLastAssistant(messages, (parts) => {
        const without = parts.filter((part) => part.type !== 'plan')
        return [...without, { type: 'plan', entries }]
      })
    }
    default:
      return messages
  }
}

export function addUserMessage(messages: ChatMessage[], text: string): ChatMessage[] {
  return [...messages, { id: crypto.randomUUID(), role: 'user', text }]
}
