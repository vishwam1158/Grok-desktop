# Contributing

Thanks for helping with Grok Desktop.

## Workflow

1. Create a branch from `main`: `feat/short-name` or `fix/short-name`
2. Make a focused change
3. Run `npm test && npm run typecheck && npm run lint`
4. Open a pull request against `main`

Do not push generated `out/`, `release/`, or secrets (`auth.json`, API keys).

## Commit messages

Use Conventional Commits:

```
feat: stream tool-call diffs in the conversation
fix: resume sessions for URL-encoded cwd groups
chore: bump electron-builder
docs: document permission modes
```

## Project map

| Path                     | Role                                 |
| ------------------------ | ------------------------------------ |
| `src/main/grok-agent.ts` | ACP client around `grok agent stdio` |
| `src/main/sessions.ts`   | Reads `~/.grok/sessions`             |
| `src/renderer/src`       | Desktop UI                           |
| `src/shared/types.ts`    | IPC contract                         |
| `tests/`                 | Pure unit tests                      |

Keep Grok Build behavior in the CLI. This app should not reimplement the agent loop.

## Releases

1. Update `CHANGELOG.md` and `package.json` version
2. Tag `vX.Y.Z`
3. GitHub Actions / `npm run dist:*` produces installers
