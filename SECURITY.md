# Security

Grok Desktop spawns the local `grok` CLI and can read/write files in the open project when the agent requests it.

- Never paste `~/.grok/auth.json` or `XAI_API_KEY` into issues
- Treat permission prompts as real: they gate shell and filesystem tools
- Report vulnerabilities privately via GitHub Security Advisories on this repository
