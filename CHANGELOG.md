# Changelog

## 1.0.1

- `bulk-update-contacts` is now five tools, one per action: `bulk-add-contacts-to-audience`, `bulk-remove-contacts-from-audience`, `bulk-unsubscribe-contacts`, `bulk-resubscribe-contacts`, and `bulk-delete-contacts`. The server has 113 tools.
- Tools that overwrite data (`update-contact`, `update-campaign`, `update-automation`) and `stop-automation` are marked destructive. Webhook, domain and email verification, and form publishing tools are marked open-world. `start-automation` is marked as a send.
- `create-automation` and `update-automation` describe each step type and its settings, and no longer accept webhook steps; add those in the dashboard.
- `trigger-automation` starts only the automation you name.

## 1.0.0

First release.

- Hosted Emailit MCP server at `https://api.emailit.com/mcp` with OAuth sign in, 109 tools, tool annotations, and sending or full scopes.
- Skills: `emailit`, `emailit-get-started`, `emailit-domain-setup`, `emailit-deliverability`, `emailit-campaigns`, `emailit-webhooks`, `emailit-sdk`.
- Skill evals for every skill.
- Manifests for ChatGPT and Codex (Agent Plugins), Cursor, Claude Code, and Grok.
- Cursor rule that keeps Emailit keys and webhook secrets out of code.
