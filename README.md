# Grok Desktop

A Claude Code-like **desktop app** for [Grok Build](https://github.com/xai-org/grok-build), SpaceXAI’s coding agent.

This repository is **not** a fork of `xai-org/grok-build`. It is a native shell that launches the official `grok` CLI as an [Agent Client Protocol](https://agentclientprotocol.com) server (`grok agent stdio`) and renders the session in a desktop UI.

[Grok Build](https://github.com/xai-org/grok-build) remains the source of truth for the agent, tools, sessions, skills, MCP, and permissions. Grok Desktop is the editor-style client around it.

## What you get

- Project picker and recent folders
- Streaming chat with reasoning, tool cards, and plans
- Permission prompts (ask / auto / always-approve)
- Resume of Grok sessions stored under `~/.grok/sessions`
- Model and reasoning-effort controls
- `grok login` from the app when you are not authenticated

## Requirements

- macOS, Linux, or Windows
- Node.js 22+
- The official Grok Build CLI, authenticated

```bash
curl -fsSL https://x.ai/cli/install.sh | bash
grok --version
grok login
```

See the [Grok Build README](https://github.com/xai-org/grok-build) and [user guide](https://docs.x.ai/build/overview).

## Develop

```bash
git clone https://github.com/vishwam1158/Grok-desktop.git
cd Grok-desktop
npm install
npm run dev
```

Useful scripts:

| Script              | Purpose                         |
| ------------------- | ------------------------------- |
| `npm run dev`       | Electron + Vite with hot reload |
| `npm test`          | Unit tests                      |
| `npm run typecheck` | Main and renderer TypeScript    |
| `npm run lint`      | ESLint                          |
| `npm run dist:mac`    | Packaged macOS `.app` / `.dmg` |
| `npm run install:mac` | Build and write `Grok Desktop.app` |

If `npm run dev` fails with `Error: Electron uninstall`, the Chromium binary did not finish downloading. Restore it and retry:

```bash
npm run electron:install
npm run dev
```

## Install on this Mac

`npm run dev` is a preview. It shows up as **Electron** in the Dock and is not installed.

To put a real **Grok Desktop** app in `/Applications`:

```bash
cd /Users/vishwam/Projects/Grok-desktop
npm run install:mac
```

Then open **Grok Desktop** from Applications, Spotlight, or Launchpad. The first launch on an unsigned local build may need:

```bash
xattr -cr "/Applications/Grok Desktop.app"
open -a "Grok Desktop"
```

## Architecture

```
┌──────────────────────────────────────────────┐
│ Renderer (React)                             │
│  sidebar · conversation · composer · perms   │
└──────────────────────▲───────────────────────┘
                       │ contextBridge IPC
┌──────────────────────┴───────────────────────┐
│ Main process                                 │
│  window · settings · session index           │
│  GrokAgent  ── JSON-RPC ACP ──► grok agent   │
└──────────────────────────────────────────────┘
```

The agent process is `grok agent stdio`. Conversation state, tools, and `~/.grok` files stay with Grok Build. The desktop app:

1. Resolves `~/.grok/bin/grok` (or `PATH`, or a custom binary)
2. Initializes ACP (`initialize` → `session/new` or `session/load`)
3. Streams `session/update` into the UI
4. Forwards `session/request_permission` to a modal

## Version control

This project is maintained on GitHub at [vishwam1158/Grok-desktop](https://github.com/vishwam1158/Grok-desktop).

- `main` is the release branch
- Feature work goes through pull requests
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
- CI runs typecheck, tests, lint, and format on every PR

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License 2.0. Grok Build itself is licensed separately by SpaceXAI.
