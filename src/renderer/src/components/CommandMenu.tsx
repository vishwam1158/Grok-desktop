import { filterCommands, type SlashCommand } from '@shared/commands'

export function CommandMenu({
  query,
  selected,
  onSelect,
  onHover
}: {
  query: string
  selected: number
  onSelect: (command: SlashCommand) => void
  onHover: (index: number) => void
}): React.JSX.Element | null {
  const items = filterCommands(query)
  if (items.length === 0) return null
  const active = Math.min(selected, items.length - 1)

  return (
    <div className="command-menu">
      {items.map((command, index) => (
        <button
          key={command.name}
          className={`command-row ${index === active ? 'active' : ''}`}
          onMouseEnter={() => onHover(index)}
          onClick={() => onSelect(command)}
        >
          <span className="command-name">
            /{command.name}
            {command.argsHint ? <em> {command.argsHint}</em> : null}
          </span>
          <span className="command-meta">
            {command.shortcut ? <kbd>{command.shortcut}</kbd> : null}
            <span>{command.description}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
