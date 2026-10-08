---
name: emailit
description: This skill should be used when the user asks to "send an email with Emailit", "check if an email was delivered", "list my Emailit domains", "add a contact", "create a template", "manage suppressions", "create an API key", or mentions Emailit, api.emailit.com, or the Emailit MCP server. Covers choosing between the Emailit MCP tools and the REST API v2, safe sending, IDs, pagination, and error handling.
---

# Emailit

Emailit is an email platform for transactional email, marketing campaigns, automations, contacts, and sending domains. Work with it through the hosted MCP server when it is connected, and through the REST API v2 when writing application code.

## Pick the interface

1. **MCP tools are available** (tool names like `send-email`, `list-domains`, `get-current-workspace`): use them for anything the user wants done now, in their account.
2. **The user is writing code**: use the REST API or an official SDK. Load the `emailit-sdk` skill for language specific code.
3. **Neither**: explain how to connect the MCP server (see `emailit-get-started`) or ask for an API key stored in `EMAILIT_API_KEY`.

Never paste an API key into code, chat, or a commit. Keys start with `secret_`. Read them from the environment.

## First call

Call `get-current-workspace` before any other tool. It returns the default workspace name and ID, your role in it, the auth type (`oauth` or `api_key`), and the granted scope (`sending`, `full`, or both, such as `sending full`). Tell the user which workspace you are acting on before you change anything.

## Multiple workspaces

An OAuth connection acts as the signed-in user and can reach every workspace they allowed when connecting: all of them, or a chosen set.

- `list-workspaces` returns only the workspaces this connection may use, with the user's role (`ADMIN` or `MEMBER`) in each. Workspace owners count as `ADMIN`.
- When the user says "in Acme Client, do X", pass `workspace: "Acme Client"` (an ID or the exact name) to that tool call. It applies to that call only. Do not switch first.
- `switch-workspace` changes the default workspace for later calls. Use it only when the user wants to keep working in another workspace.
- If a workspace the user names is not in `list-workspaces`, the connection does not have access to it. Tell the user to add it under **Account > Connected apps > Edit access** in the Emailit dashboard. No reconnect is needed.
- Members can use every tool except creating, renaming, deleting, or regenerating API keys and deleting domains. Those need the Admin role. When a tool returns `admin_role_required`, tell the user that a workspace admin must do it or change their role, and do not retry.

API key connections are bound to the one workspace the key belongs to. They have no `workspace` argument and no role limits.

## Safety rules

Some tools reach real people or remove data. Before calling them, show the user exactly what will happen and wait for a clear yes.

- **Sends to real recipients**: `send-email`, `retry-email`, `forward-email`, `send-campaign`, `start-automation`, `trigger-automation`. Confirm the from address, recipients, subject, and content. Offer to send a test to the user first.
- **Destructive**: `delete-*`, `bulk-delete-contacts`, `bulk-unsubscribe-contacts`, `update-contact` (replaces audiences), `update-campaign`, `update-automation`, `stop-automation`, `cancel-email`, `cancel-campaign`, `regenerate-api-key`, `reset-webhook-secret`, `reset-form-token`. Name the object by its human name and ID.
- **External calls**: `test-webhook` and the webhook retries send requests to the user's URL; `create-webhook` and `update-webhook` point events at a URL; `verify-domain` and `verify-email` query DNS and mail servers; `publish-form` makes a form public.

Never send to purchased or scraped lists. Emailit requires consent from every recipient. Never invent a from address: it must belong to a verified sending domain in the workspace (check with `list-domains`).

## Tools by area

The server exposes 113 tools. Clients may trim them with toolsets, so some may be missing.

| Area | Main tools |
| --- | --- |
| Workspace | `get-current-workspace`, `list-workspaces`, `switch-workspace`, `create-workspace` |
| Emails | `send-email`, `list-emails`, `get-email`, `get-email-body`, `get-email-meta`, `cancel-email`, `retry-email`, `forward-email` |
| Domains and DMARC | `create-domain`, `verify-domain`, `list-domains`, `get-dmarc-stats`, `list-dmarc-sources` |
| Templates | `create-template`, `update-template`, `publish-template` |
| Audiences and contacts | `create-audience`, `add-audience-subscriber`, `create-contact`, `list-contacts`, `export-contacts` |
| Suppressions | `list-suppressions`, `create-suppression`, `delete-suppression` |
| Campaigns | `create-campaign`, `update-campaign`, `send-campaign`, `cancel-campaign` |
| Automations | `create-automation`, `start-automation`, `list-automation-runs`, `get-automation-stats` |
| Forms | `create-form`, `publish-form` |
| Verification | `verify-email`, `create-verification-list`, `get-verification-list-results` |
| Webhooks and events | `create-webhook`, `test-webhook`, `list-events` |
| API keys | `create-api-key`, `list-api-keys`, `regenerate-api-key` |

The full list with scopes is in `references/tools.md`.

## Scopes

- `sending` scope covers `get-current-workspace`, `list-workspaces`, `switch-workspace`, and sending: `send-email`, `update-email`, `cancel-email`, `retry-email`, `forward-email`. It cannot read emails back (`list-emails`, `get-email`) or list domains.
- `full` scope covers everything. A connection can hold both.

On OAuth, the AI client requests the scopes when it connects (both, unless it asks for fewer), the consent page lists them, and the user picks the workspaces. A sending-only OAuth connection still lists every tool, and the others return an insufficient scope error. A sending API key hides the tools it cannot call.

When a tool returns an insufficient scope error, tell the user. On OAuth, reconnect so the client requests `full` (some clients offer this from the error). API key users need a key with full access.

## Working with results

- IDs have prefixes: `em_` email, `sed_` sending domain, `tem_` template, `aud_` audience, `sub_` subscriber, `con_` contact, `sup_` suppression, `wh_` webhook, `cmp_` campaign, `aut_` automation, `frm_` form, `evl_` verification list, `evt_` event, `key_` API key.
- Most list tools take `page` and `limit` (up to 100), and many accept `search`, `sort`, `order`, and `filters` as `[{field, condition, value}]`. `list-automations` and `list-automation-runs` take `page` and `per_page` instead, with plain filter arguments such as `status`. Fetch only what you need.
- Results come back as structured JSON. Quote IDs exactly; never guess them.
- Times are ISO 8601 in UTC. Convert to the user's time zone when you present them.

## Errors

| Status | Meaning | What to do |
| --- | --- | --- |
| 400 or 422 | Validation failed | Read the field errors, fix the input, retry once |
| 401 | Not authenticated | Reconnect the MCP server or check the API key |
| 403 | Missing scope or plan feature | Explain what is needed |
| 403 `admin_role_required` | The user is a Member in that workspace | Tell the user an Admin must do it; do not retry |
| 404 | Not found in this workspace | Check the ID and the workspace, or pass `workspace` for the right one |
| 409 | Conflict, such as a duplicate | Fetch the existing object instead |
| 429 | Rate limited | Wait, then retry with fewer calls |
| 5xx | Emailit error | Retry later; do not loop |

Sending is limited per workspace: messages per second and per day, set for each workspace (2 per second and 5,000 per day when none are set). Other tools are not covered by these limits. A 429 on `send-email` means wait for `retry_after` seconds. Details are in `references/rest-api.md`.

## Common tasks

- **Was my email delivered?** `list-emails` with `rcpt_to` and a date range, then `get-email` for status and events. Load `emailit-deliverability` for bounces.
- **Set up a domain**: load `emailit-domain-setup`.
- **Campaigns and automations**: load `emailit-campaigns`.
- **Webhooks**: load `emailit-webhooks`.
- **Code integration**: load `emailit-sdk`.

## Without MCP

Call `https://api.emailit.com/v2` with `Authorization: Bearer $EMAILIT_API_KEY`. Endpoints, request shapes, and curl examples are in `references/rest-api.md`.
