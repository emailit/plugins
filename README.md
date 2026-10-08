# Emailit plugin for ChatGPT, Codex, Claude, Cursor, and Grok

The official [Emailit](https://emailit.com) plugin. It connects your AI assistant to the hosted Emailit MCP server, so it can send transactional email, check delivery, set up and verify sending domains, investigate bounces, manage contacts and audiences, run campaigns and automations, and configure webhooks. It also ships skills that teach the assistant how to integrate the Emailit API and SDKs into your code.

You sign in with your Emailit account through OAuth and choose which workspaces the plugin can use: all of them, or only the ones you select. Change that later under **Account > Connected apps > Edit access**. No API key is stored in the plugin.

## What is included

| Part | Description |
| --- | --- |
| MCP server | `https://api.emailit.com/mcp`, 113 tools across emails, domains, DMARC, templates, audiences, contacts, suppressions, campaigns, automations, forms, verification, webhooks, events, API keys, and workspaces |
| `emailit` skill | Choosing MCP or REST, safe sending, IDs, errors, and the full tool list |
| `emailit-get-started` skill | Connect, confirm the workspace, check a domain, send a first test email |
| `emailit-domain-setup` skill | Add a domain, publish DNS records at any provider, verify, and fix failures |
| `emailit-deliverability` skill | Bounces, spam placement, suppressions, DMARC reports, and list verification |
| `emailit-campaigns` skill | Audiences, contacts, campaigns, automations, and signup forms |
| `emailit-webhooks` skill | Events, filters, signature verification, retries, and debugging |
| `emailit-sdk` skill | Node, Python, PHP, Laravel, Go, Ruby, Java, .NET, Rust, and SMTP |
| Cursor rule | Keeps Emailit keys and webhook secrets out of source code |

## Install

### ChatGPT

Open **Plugins**, search for **Emailit**, and choose **Connect**. Sign in, choose the workspaces to allow, and approve access.

### Codex

```bash
codex plugin marketplace add emailit/plugins
```

Open `/plugins`, install **Emailit**, and sign in when prompted.

### Claude

On claude.ai, Claude Desktop, or mobile: **Settings > Connectors > Browse connectors**, search for **Emailit**, and choose **Connect**.

In Claude Code:

```bash
claude plugin marketplace add emailit/plugins
claude plugin install emailit@emailit
```

Then run `/mcp`, select **emailit**, and choose **Authenticate**.

### Cursor

Install **Emailit** from the [Cursor Marketplace](https://cursor.com/marketplace), then choose **Connect** next to emailit in **Settings > MCP**.

### Grok

```bash
grok plugin marketplace add emailit/plugins
grok plugin install emailit --trust
```

On grok.com, open **Connectors > New Connector > Custom** and enter `https://api.emailit.com/mcp`.

## Access and security

- **OAuth 2.1 with PKCE.** Your assistant never sees your password. The assistant requests **sending** access (send and manage sent email), **full** access (everything), or both, which is the default. The consent page lists what it will be able to do, and you choose which workspaces it can use.
- **Confirmation before impact.** Tools that send email, delete data, or call external URLs carry MCP annotations that let your client ask you first, and the skills tell the assistant to confirm. The Emailit server does not enforce the confirmation itself; whether you are asked depends on your client and its settings.
- **Revoke at any time** in the Emailit dashboard under **Account > Connected apps**.
- **API keys stay with Emailit.** The MCP server signs in with OAuth and needs no key. Only when it isn't connected do the skills use an Emailit API key from your environment, and only to call Emailit's own REST API (listed below). Code the SDK skill writes into your project reads the key the same way.
- **Headless clients** (the xAI API, CI jobs) can send an Emailit API key as `Authorization: Bearer <key>` to the same server. Use a sending scope key where you can.

To expose fewer tools, add `?toolsets=emails,domains` or `?read_only=true` to the server URL, or send the `X-MCP-Toolsets` and `X-MCP-Readonly` headers.

## Endpoints this plugin uses

The plugin talks only to Emailit:

| Endpoint | Purpose |
| --- | --- |
| `https://api.emailit.com/mcp` | Hosted MCP server (Streamable HTTP) |
| `https://api.emailit.com/.well-known/oauth-protected-resource/mcp` | OAuth resource metadata |
| `https://api.emailit.com/.well-known/oauth-authorization-server` | OAuth server metadata |
| `https://api.emailit.com/oauth/register` | Dynamic client registration |
| `https://api.emailit.com/oauth/authorize` | Sign in and consent |
| `https://api.emailit.com/oauth/token` | Token exchange and refresh |
| `https://api.emailit.com/oauth/revoke` | Token revocation |
| `https://api.emailit.com/v2` | REST API, used by code that the SDK skill writes into your project |
| `smtp.emailit.com:587` | SMTP, used only if your project is configured for it |

## Requirements

An Emailit account. Sending needs a verified sending domain; the `emailit-get-started` skill walks you through it.

## Development

This repository is published from Emailit's main repository, where every change is validated against each directory's rules and the skills are tested with evals. The validation tooling and evals aren't published: nobody who installs the plugin needs them. `skills/emailit/references/tools.md` is generated from the Emailit MCP server catalog. Report problems to support@emailit.com.

This repository is published from Emailit's main repository, and each release replaces its contents. Please report problems and suggestions as issues rather than pull requests.

| File | Read by |
| --- | --- |
| `plugin.json`, `mcp.json` | ChatGPT, Codex, and other Agent Plugins clients |
| `.cursor-plugin/` | Cursor |
| `.claude-plugin/`, `.mcp.json` | Claude Code, Claude directory, Grok |
| `.grok-plugin/plugin.json` | Grok |
| `.agents/plugins/marketplace.json` | Codex marketplace |

## Support

[emailit.com/contact](https://emailit.com/contact/) or support@emailit.com. Documentation: [Emailit plugins and skills](https://emailit.com/docs/mcp/plugins-and-skills/) and the [hosted MCP server guide](https://emailit.com/docs/mcp/). Privacy policy: [emailit.com/privacy-policy](https://emailit.com/privacy-policy/).

## License

MIT
