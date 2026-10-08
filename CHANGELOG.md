# Changelog

## 1.0.4

- Release notes reworded. No changes to the skills or the MCP server.

## 1.0.3

- The public repository no longer includes the validation tooling (`scripts/`) or the skill evals (`skill-evals/`). They aren't needed to use the plugin.
- The README says where the skills send an Emailit API key: only to Emailit's REST API, and only when the MCP server isn't connected.
- SDK skill: the attachment examples no longer use a file name or URL that the Claude directory's scan mistook for something the plugin sends.

## 1.0.2

- The validation tooling's `package.json` and lockfile moved to `scripts/`. With them at the root, Claude Code installed the tooling's packages for everyone who installed the plugin.

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
