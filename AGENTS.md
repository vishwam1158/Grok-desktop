# Grok Desktop

Electron desktop client for the official Grok Build CLI.

- Do not vendor or fork `xai-org/grok-build`. Talk to it over ACP (`grok agent stdio`).
- Keep Node-only work in `src/main`. The renderer is isolated and only uses `window.grok`.
- Session transcripts live in `~/.grok/sessions`; do not invent a second history format.
- Prefer existing Grok permission modes (`ask`, `auto`, `always-approve`) over custom policy engines.
