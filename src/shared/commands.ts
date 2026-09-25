export type CommandKind = 'local' | 'agent'

export interface SlashCommand {
  name: string
  aliases: string[]
  description: string
  shortcut?: string
  kind: CommandKind
  argsHint?: string
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: 'new',
    aliases: ['clear'],
    description: 'Start a new chat',
    shortcut: '⌘N',
    kind: 'local'
  },
  {
    name: 'resume',
    aliases: [],
    description: 'Open the chat list for this project',
    shortcut: '⌘R',
    kind: 'local'
  },
  {
    name: 'compact',
    aliases: [],
    description: 'Compress conversation history',
    kind: 'agent',
    argsHint: '[what to keep]'
  },
  {
    name: 'context',
    aliases: ['session-info', 'status', 'info'],
    description: 'Show context remaining and session usage',
    kind: 'local'
  },
  {
    name: 'copy',
    aliases: [],
    description: 'Copy the last reply',
    shortcut: '⇧⌘C',
    kind: 'local'
  },
  {
    name: 'export',
    aliases: [],
    description: 'Export this chat as Markdown',
    shortcut: '⇧⌘E',
    kind: 'local'
  },
  {
    name: 'delete',
    aliases: [],
    description: 'Delete the current chat',
    kind: 'local'
  },
  {
    name: 'model',
    aliases: ['m'],
    description: 'Switch model',
    shortcut: '⌘M',
    kind: 'local',
    argsHint: '<model>'
  },
  {
    name: 'effort',
    aliases: [],
    description: 'Set reasoning effort',
    kind: 'local',
    argsHint: 'low | medium | high | xhigh'
  },
  {
    name: 'always-approve',
    aliases: ['yolo'],
    description: 'Toggle always-approve permissions',
    shortcut: '⇧Tab',
    kind: 'local'
  },
  {
    name: 'auto',
    aliases: [],
    description: 'Toggle auto permission mode',
    kind: 'local'
  },
  {
    name: 'plan',
    aliases: [],
    description: 'Enter plan mode',
    kind: 'agent',
    argsHint: '[description]'
  },
  {
    name: 'rewind',
    aliases: ['undo'],
    description: 'Rewind the last turn',
    kind: 'agent'
  },
  {
    name: 'settings',
    aliases: [],
    description: 'Open settings',
    shortcut: '⌘,',
    kind: 'local'
  },
  {
    name: 'shortcuts',
    aliases: ['help', 'keys'],
    description: 'Show keyboard shortcuts',
    shortcut: '⌘/',
    kind: 'local'
  },
  {
    name: 'login',
    aliases: [],
    description: 'Sign in with grok login',
    kind: 'local'
  },
  {
    name: 'logout',
    aliases: [],
    description: 'Sign out',
    kind: 'local'
  },
  {
    name: 'imagine',
    aliases: [],
    description: 'Generate an image',
    kind: 'agent',
    argsHint: '<description>'
  },
  {
    name: 'remember',
    aliases: [],
    description: 'Save a note to memory',
    kind: 'agent',
    argsHint: '<note>'
  },
  {
    name: 'flush',
    aliases: [],
    description: 'Flush session knowledge to memory',
    kind: 'agent'
  },
  {
    name: 'btw',
    aliases: [],
    description: 'Ask a side question without interrupting',
    kind: 'agent',
    argsHint: '<question>'
  },
  {
    name: 'feedback',
    aliases: [],
    description: 'Send feedback',
    kind: 'agent',
    argsHint: '[message]'
  },
  {
    name: 'quit',
    aliases: ['exit'],
    description: 'Quit Grok Desktop',
    shortcut: '⌘Q',
    kind: 'local'
  }
]

export const KEYBOARD_SHORTCUTS = [
  { keys: '⌘N', action: 'New chat' },
  { keys: '⌘O', action: 'Add / open project' },
  { keys: '⌘K or ⌘P', action: 'Command palette' },
  { keys: '/', action: 'Slash commands in the composer' },
  { keys: 'Enter', action: 'Send' },
  { keys: '⇧Enter', action: 'New line' },
  { keys: '⌘Enter', action: 'Send' },
  { keys: '⌘.', action: 'Stop the current turn' },
  { keys: '⇧Tab', action: 'Cycle ask / auto / always-approve' },
  { keys: '⌘,', action: 'Settings' },
  { keys: '⌘/', action: 'Keyboard shortcuts' },
  { keys: '⇧⌘C', action: 'Copy last reply' },
  { keys: '⇧⌘E', action: 'Export chat' },
  { keys: '↑', action: 'Previous prompt (empty composer)' },
  { keys: 'Esc', action: 'Back: close the panel, then leave the project' },
  { keys: '⌥← or swipe →', action: 'Same as Back' },
  { keys: '⌘Q', action: 'Quit Grok Desktop' },
  { keys: '1–9', action: 'Pick a permission option' }
]

export function parseSlash(input: string): { name: string; args: string } | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) return null
  const body = trimmed.slice(1)
  const space = body.search(/\s/)
  if (space === -1) return { name: body.toLowerCase(), args: '' }
  return {
    name: body.slice(0, space).toLowerCase(),
    args: body.slice(space).trim()
  }
}

export function findCommand(name: string): SlashCommand | undefined {
  const needle = name.toLowerCase()
  return SLASH_COMMANDS.find(
    (command) => command.name === needle || command.aliases.includes(needle)
  )
}

export function filterCommands(query: string): SlashCommand[] {
  const needle = query.replace(/^\//, '').trim().toLowerCase()
  if (!needle) return SLASH_COMMANDS
  return SLASH_COMMANDS.filter((command) => {
    const haystack = [command.name, ...command.aliases, command.description].join(' ').toLowerCase()
    return command.name.startsWith(needle) || haystack.includes(needle)
  })
}
