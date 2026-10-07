---
name: emailit-get-started
description: This skill should be used when the user asks to "set up Emailit", "connect Emailit", "get started with Emailit", "send my first email", "is Emailit connected", or has just installed the Emailit plugin. Walks through connecting the hosted MCP server with OAuth, confirming the workspace, checking a sending domain, and sending a first test email.
---

# Get started with Emailit

Use this flow the first time a user works with Emailit in this client, or whenever the Emailit tools are missing or failing to authenticate. Keep each step short and tell the user what you found before moving on.

## 1. Check the connection

Call `get-current-workspace`.

- **It works**: say "You're connected to the <name> workspace (<id>) with <scope> access." and go to step 2.
- **The tool does not exist**: the MCP server is not connected. Give the user the steps for their client from `references/connect.md`, then stop until they confirm.
- **401 or an auth error**: the sign in expired or was revoked. Ask the user to reconnect (most clients have a "Reconnect" or "Authenticate" button next to the server).

With OAuth, the user chose which workspaces this connection may use: all of them, or a selected set. Call `list-workspaces` to show them with the user's role in each. To act in one of them, pass `workspace` to the tool call ("In Acme Client, list my domains"), or call `switch-workspace` to change the default. A workspace that is missing can be added under **Account > Connected apps > Edit access** in the Emailit dashboard without reconnecting.

## 2. Check for a verified sending domain

Call `list-domains`. It needs the `full` scope, like `get-domain`, `list-emails`, and `get-email` below. If it returns an insufficient scope error, or is missing while `get-current-workspace` works, the connection has `sending` scope only (or the tool list is trimmed). Emailit is still connected: ask the user which verified domain to send from, and see "Access levels" to get full access.

- **At least one verified domain**: note its name. Emails must be sent from an address on that domain.
- **A domain that is not verified**: call `get-domain` and list the DNS records still pending. Offer the `emailit-domain-setup` skill.
- **No domains**: ask which domain or subdomain they want to send from. Recommend a subdomain such as `mail.example.com` so marketing and transactional reputation stay separate from the root domain. Then follow `emailit-domain-setup`.

Do not continue to a real send until a domain is verified.

## 3. Send a test email to the user

Ask for the user's own address, or use one they already gave you. Propose the email first:

```
From:    Emailit Test <test@<verified-domain>>
To:      <user's address>
Subject: Emailit is connected
Body:    A short HTML and plain text message.
```

After the user confirms, call `send-email` with `from`, `to`, `subject`, `html`, and `text`. Report the returned `id` (`em_...`) and status.

Wait a few seconds, then call `get-email` with that ID (full scope). A `delivered` status means it worked. If it is `bounced`, `failed`, or `rejected`, read the reason from the email and load `emailit-deliverability`. With sending scope only, ask the user to check their inbox instead.

## 4. Suggest next steps

Offer two or three of these, based on what the user said they want:

- Add the API to their app: `emailit-sdk` (Node, Python, PHP, Laravel, Go, Ruby, Java, .NET, Rust, or SMTP).
- Receive delivery and bounce events: `emailit-webhooks`.
- Build an audience and send a campaign, or set up an automation: `emailit-campaigns`.
- Check DMARC reports and reputation: `emailit-deliverability`.
- Create a template with variables: `create-template`, then `publish-template`.

## Access levels

The AI client requests the scopes when it connects; unless it asks for fewer, it gets both. The consent page lists what the client will be able to do, and the user chooses the workspaces there, not the scopes.

- **Sending**: send email and manage sent email (`send-email`, `update-email`, `cancel-email`, `retry-email`, `forward-email`), plus `get-current-workspace`, `list-workspaces`, and `switch-workspace`. Enough for an agent that only sends; it cannot read emails back or check domains.
- **Full**: everything else, including reading emails, domains, contacts, campaigns, automations, webhooks, and API keys.

`get-current-workspace` shows the granted scope. If a tool returns an insufficient scope error, explain that the connection has sending access only and the user can reconnect so the client requests full access.

## API key option

Some clients cannot run OAuth, such as the xAI API or a CI job. In that case the user creates an API key on the **API Keys** page of the Emailit dashboard and sends it as `Authorization: Bearer <key>` to `https://api.emailit.com/mcp`. Keep the key in an environment variable or the client's secret store. Never ask the user to paste it into the chat.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| No Emailit tools | Server not added, or plugin not enabled | Follow `references/connect.md` |
| 401 on every call | Token expired or connection revoked | Reconnect the server |
| Fewer tools than expected | Toolsets trimmed, read only mode, or a sending API key | Check the server URL query and headers, or use full access |
| "Domain not verified" on send | DNS not published or not verified yet | `emailit-domain-setup` |
| "Workspace not verified" (`unverified_workspace_recipient`) on send | New workspaces can only send to their members' account emails until Emailit verifies the workspace | Send the test to the address the user signs in with |
| "Pending verification" (`pending_review`) with all records valid | On pay as you go plans, domains registered less than 30 days ago get a manual review | Wait for the review, or upgrade to Pro or Business |
