import { useAppStore } from '../store'

export function PermissionModal(): React.JSX.Element | null {
  const permission = useAppStore((state) => state.permission)
  const respondPermission = useAppStore((state) => state.respondPermission)
  if (!permission) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow)]">
        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Permission
        </div>
        <h2 className="mt-2 text-lg font-semibold">{permission.title}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--text-muted)]">
          Grok wants to run a tool in this project. Press 1–9 or click an option.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {permission.options.map((option, index) => (
            <button
              key={option.optionId}
              className={`rounded-xl px-3 py-2.5 text-left ${
                index === 0
                  ? 'bg-white text-black'
                  : 'border border-[var(--border)] hover:bg-[var(--bg-hover)]'
              }`}
              onClick={() => void respondPermission(option.optionId)}
            >
              <div className="text-[14px] font-medium">{option.name}</div>
              <div
                className={`text-[11px] uppercase tracking-wide ${
                  index === 0 ? 'text-black/55' : 'text-[var(--text-muted)]'
                }`}
              >
                {option.kind}
              </div>
            </button>
          ))}
          <button
            className="mt-1 text-[13px] text-[var(--text-muted)]"
            onClick={() => void respondPermission(null)}
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  )
}
