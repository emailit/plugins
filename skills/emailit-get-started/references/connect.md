# Connect the Emailit MCP server

Server URL: `https://api.emailit.com/mcp` (Streamable HTTP). Sign in uses OAuth 2.1 with PKCE. Clients discover it from `https://api.emailit.com/.well-known/oauth-protected-resource/mcp`, so most only need the URL.

## ChatGPT

1. Open **Plugins** in ChatGPT and search for **Emailit**, then choose **Connect**.
2. Sign in to Emailit, choose the workspaces to allow (all, or only the ones you select), and approve access.
3. In a chat, ask "Which Emailit workspace am I connected to?"

Before the listing is live, a workspace admin can add it as a custom plugin: turn on developer mode, choose **+** in Plugins, and enter the server URL.

## Codex

```bash
codex plugin marketplace add emailit/plugins
```

Then open `/plugins` in Codex, install **Emailit**, and sign in when prompted. To add only the MCP server:

```bash
codex mcp add emailit --url https://api.emailit.com/mcp
codex mcp login emailit
```

## Claude (claude.ai, Desktop, and mobile)

1. Go to **Settings > Connectors** and choose **Browse connectors**, then search for **Emailit**. Before the listing is live, choose **Add custom connector** and enter the server URL.
2. Choose **Connect**, sign in, choose the workspaces to allow, and approve access.
3. In a chat, turn on Emailit from the tools menu.

On Team and Enterprise plans an owner adds the connector for the organization first.

## Claude Code

Install the plugin, which brings the server and the skills:

```bash
claude plugin marketplace add emailit/plugins
claude plugin install emailit@emailit
```

Or add only the server:

```bash
claude mcp add --transport http emailit https://api.emailit.com/mcp
```

Run `/mcp`, select **emailit**, and choose **Authenticate**.

## Cursor

Install **Emailit** from the Cursor Marketplace (**Settings > Plugins**), or open this link to add only the server:

```
cursor://anysphere.cursor-deeplink/mcp/install?name=emailit&config=eyJ1cmwiOiJodHRwczovL2FwaS5lbWFpbGl0LmNvbS9tY3AifQ==
```

The `config` value is the base64 of `{"url":"https://api.emailit.com/mcp"}`. In **Settings > MCP**, choose **Connect** next to emailit to sign in.

Manual `~/.cursor/mcp.json`:

```json
{ "mcpServers": { "emailit": { "url": "https://api.emailit.com/mcp" } } }
```

## Grok

Grok Build CLI:

```bash
grok plugin marketplace add emailit/plugins
grok plugin install emailit --trust
```

Or add only the server: `grok mcp add --transport http emailit https://api.emailit.com/mcp`. Grok opens a browser to sign in.

grok.com: open **Connectors**, choose **New Connector > Custom**, and enter the server URL.

## xAI API and other headless clients

Headless clients cannot run a browser sign in. Create an API key in the Emailit dashboard and pass it as the bearer token:

```json
{
  "type": "mcp",
  "server_url": "https://api.emailit.com/mcp",
  "server_label": "emailit",
  "authorization": "<EMAILIT_API_KEY>"
}
```

Any MCP client can do the same with the header `Authorization: Bearer <key>`.

## Trim the tool list

Add these to the server URL or as headers to expose fewer tools:

| Option | Query | Header | Example |
| --- | --- | --- | --- |
| Only some toolsets | `?toolsets=` | `X-MCP-Toolsets` | `emails,domains,events` |
| Hide write tools | `?read_only=true` | `X-MCP-Readonly` | `true` |

Toolsets: `emails`, `domains`, `dmarc`, `templates`, `api_keys`, `audiences`, `contacts`, `suppressions`, `webhooks`, `campaigns`, `automations`, `forms`, `verification`, `events`. The `workspace` toolset is always included, whatever toolsets you pick.

## Disconnect

In the Emailit dashboard, open **Account > Connected apps** and choose **Revoke access** next to the client. The client loses access at once.
