# Emailit MCP tools

Every tool on the hosted server at `https://api.emailit.com/mcp`, grouped by toolset. This file is generated from the server catalog.

Tools with scope `sending` also work with `full`, and a connection can hold both. OAuth connections list every tool, and a tool outside the granted scope returns an insufficient scope error. API key connections only list the tools their scope allows.

Trim the list with the `X-MCP-Toolsets` header or the `?toolsets=` query (comma separated toolset names from the headings). The `workspace` toolset is always included. Hide write tools with `X-MCP-Readonly: true` or `?read_only=true`; `switch-workspace` stays, because it only changes the default workspace of the connection.

`list-workspaces`, `switch-workspace`, and `create-workspace` exist only on OAuth connections. API key connections are bound to one workspace; of the workspace tools they get only `get-current-workspace`.

Kinds: read (no changes), create, update, action (changes state), delete, destructive (cannot be undone), external (calls a URL you own), send (reaches real recipients).

On OAuth connections every tool outside the workspace toolset also takes an optional `workspace` argument (a workspace ID or exact name from `list-workspaces`). It runs that one call in that workspace without changing the default. Tools marked "Requires the Admin role" are refused with `admin_role_required` when the signed-in user is a Member of the workspace. API key connections have no `workspace` argument and no role limits.

## Workspace (`workspace`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `get-current-workspace` | read | sending | Return the Emailit workspace this connection acts on by default, your role in it, and the granted scope. Call it to confirm which account changes apply to. |
| `list-workspaces` | read | sending | List the workspaces this connection may use, with your role in each. Pass a workspace ID or name as `workspace` to any tool to act in it. |
| `switch-workspace` | update | sending | Change the default workspace for later tool calls on this connection. To act in another workspace for a single call, pass `workspace` to that tool instead. |
| `create-workspace` | create | full | Create a new workspace, give this connection access to it, and switch to it. |

## Emails (`emails`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `send-email` | send | sending | Send a transactional email from a verified sending domain. Supports HTML, plain text, templates with variables, attachments, CC/BCC, scheduling, and open/click tracking. Delivers to real recipients, so confirm recipients and content with the user first. |
| `list-emails` | read | full | List sent and received emails with pagination, status, recipient, sender, subject, domain, API key, and date filters. |
| `get-email` | read | full | Retrieve a single email with its status and delivery details. |
| `get-email-raw` | read | full | Return the full raw MIME message of an email. |
| `get-email-body` | read | full | Return the parsed text and HTML body of an email. |
| `get-email-attachments` | read | full | Return the attachments of an email. |
| `get-email-meta` | read | full | Return email metadata and headers without attachment content. |
| `update-email` | update | sending | Change the send time of a scheduled email. |
| `cancel-email` | destructive | sending | Best-effort cancel of a scheduled, accepted, or attempted email. Pulls it from the send queue; not guaranteed if delivery already started. |
| `retry-email` | send | sending | Retry delivery of a failed, errored, or held email to its original recipients. |
| `forward-email` | send | sending | Forward an outgoing email to a new recipient. Default is a plain resend. Set include_headers to add forwarded headers and an optional comment. Limited to 3 forwards per hour per workspace. |

## Domains (`domains`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `create-domain` | create | full | Add a sending domain. Returns the SPF, DKIM, return-path, and DMARC DNS records to publish before verifying. |
| `get-domain` | read | full | Retrieve a domain with its DNS records and per-record verification status. |
| `list-domains` | read | full | List sending domains in the workspace. |
| `update-domain` | update | full | Update domain settings such as open/click tracking, inbound, or DMARC report collection. |
| `delete-domain` | delete | full | Permanently delete a domain. Sending from it stops immediately. Requires the Admin role in the workspace. |
| `verify-domain` | external | full | Look up the domain's DNS records now and update the verification status of each record. |

## DMARC (`dmarc`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `list-dmarc-reports` | read | full | List DMARC aggregate or forensic reports received for a domain. |
| `get-dmarc-report` | read | full | Retrieve one DMARC aggregate report with its records. |
| `list-dmarc-forensic-reports` | read | full | List DMARC forensic (failure) reports for a domain. |
| `get-dmarc-forensic-report` | read | full | Retrieve one DMARC forensic report. |
| `get-dmarc-stats` | read | full | DMARC pass/fail totals and alignment rates for a domain over a date range. |
| `list-dmarc-sources` | read | full | Sending sources (IPs and hostnames) seen in DMARC reports, with pass/fail counts. |
| `list-dmarc-countries` | read | full | DMARC message volume by sending country. |
| `list-dmarc-asns` | read | full | DMARC message volume by sending network (ASN). |
| `list-dmarc-reporters` | read | full | Organizations that sent DMARC reports for the domain. |
| `upload-dmarc-report` | create | full | Import a DMARC aggregate report (XML, or base64 of a .xml/.gz/.zip file) for a domain. |

## Templates (`templates`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `create-template` | create | full | Create an email template. Reference it from send-email by ID or alias; publish it before use. |
| `get-template` | read | full | Retrieve a template with its content. |
| `list-templates` | read | full | List templates in the workspace. |
| `update-template` | update | full | Update a template draft. Publish it to make the change live. |
| `delete-template` | delete | full | Permanently delete a template. |
| `publish-template` | action | full | Publish the current template draft so new sends use it. |

## API keys (`api_keys`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `create-api-key` | create | full | Create an API key. The secret is returned only once; tell the user to store it securely. Requires the Admin role in the workspace. |
| `get-api-key` | read | full | Retrieve an API key (without its secret). |
| `list-api-keys` | read | full | List API keys in the workspace. |
| `update-api-key` | update | full | Rename an API key. Requires the Admin role in the workspace. |
| `delete-api-key` | delete | full | Permanently revoke an API key. Apps using it stop working immediately. Requires the Admin role in the workspace. |
| `regenerate-api-key` | destructive | full | Issue a new secret for an API key and invalidate the old one immediately. The new secret is returned only once. Requires the Admin role in the workspace. |

## Audiences and subscribers (`audiences`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `create-audience` | create | full | Create an audience (mailing list) for campaigns and automations. |
| `get-audience` | read | full | Retrieve an audience with subscriber counts. |
| `list-audiences` | read | full | List audiences in the workspace. |
| `update-audience` | update | full | Rename an audience. |
| `delete-audience` | delete | full | Permanently delete an audience and its subscriber records. Contacts are kept. |
| `list-audience-subscribers` | read | full | List subscribers of an audience, optionally only subscribed or unsubscribed. |
| `get-audience-subscriber` | read | full | Retrieve one subscriber of an audience. |
| `add-audience-subscriber` | create | full | Add an email address to an audience. Creates the contact if it does not exist. |
| `update-audience-subscriber` | update | full | Update a subscriber, including subscribing or unsubscribing them from the audience. |
| `remove-audience-subscriber` | delete | full | Remove a subscriber from an audience. The contact is kept. |

## Contacts (`contacts`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `create-contact` | create | full | Create a contact, optionally subscribing it to audiences and setting custom fields. |
| `get-contact` | read | full | Retrieve a contact by ID or email address. |
| `list-contacts` | read | full | List contacts with search, audience, subscription, and custom-field filters. |
| `update-contact` | destructive | full | Update a contact. Passing audiences replaces its audience memberships, and unsubscribed: true stops all marketing email to it. |
| `delete-contact` | delete | full | Permanently delete a contact and its audience memberships. |
| `bulk-delete-contacts` | delete | full | Permanently delete up to 100 contacts and their audience memberships. |
| `bulk-add-contacts-to-audience` | update | full | Subscribe up to 100 contacts to an audience. |
| `bulk-remove-contacts-from-audience` | delete | full | Remove up to 100 contacts from an audience. |
| `bulk-unsubscribe-contacts` | destructive | full | Unsubscribe up to 100 contacts from all marketing email. They stop receiving campaigns and automations. |
| `bulk-resubscribe-contacts` | update | full | Resubscribe up to 100 contacts. Only do this when they asked to receive email again. |
| `export-contacts` | read | full | Export contacts matching the filters as CSV text (email, names, subscription, audiences, custom fields). |

## Suppressions (`suppressions`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `create-suppression` | create | full | Add an email address to the suppression list so Emailit never sends to it. |
| `get-suppression` | read | full | Retrieve a suppression by ID or email address. |
| `list-suppressions` | read | full | List suppressed addresses with search, type, reason, and expiry filters. |
| `update-suppression` | update | full | Change the type, reason, or expiry of a suppression. |
| `delete-suppression` | delete | full | Remove an address from the suppression list so it can receive email again. |

## Webhooks (`webhooks`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `create-webhook` | external | full | Create a webhook: Emailit will send email, domain, contact, and campaign events to this URL. The response includes the signing secret. |
| `get-webhook` | read | full | Retrieve a webhook with its subscribed events and filter. |
| `list-webhooks` | read | full | List webhooks in the workspace. |
| `update-webhook` | external | full | Update a webhook URL, name, events, filter, or enable it again. Events then go to the new URL. |
| `delete-webhook` | delete | full | Permanently delete a webhook. Pending deliveries are dropped. |
| `test-webhook` | external | full | Send a sample event of the given type to the webhook URL and return the response. Limited to 5 per minute. |
| `reset-webhook-secret` | destructive | full | Rotate the webhook signing secret. The old secret stops working immediately; the new one is returned once. |
| `retry-failed-webhook-requests` | external | full | Send every failed delivery of a webhook to its URL again and re-enable the webhook. |
| `retry-webhook-request` | external | full | Send one webhook delivery to its URL again. |

## Campaigns (`campaigns`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `list-campaigns` | read | full | List marketing campaigns, optionally by status. |
| `get-campaign` | read | full | Retrieve a campaign with its content, recipients, and stats. |
| `create-campaign` | create | full | Create a draft campaign. Add recipients with update-campaign, then send with send-campaign. |
| `update-campaign` | destructive | full | Update a draft campaign. Passing content replaces its body and passing recipients replaces the audience list (at least one audience must be included); the previous values can't be restored. |
| `delete-campaign` | delete | full | Permanently delete a campaign that has not been sent. |
| `send-campaign` | send | full | Send a campaign to its audiences now, or schedule it with scheduled_at. Delivers to real subscribers, so confirm with the user first. |
| `cancel-campaign` | destructive | full | Cancel a draft or sending campaign. Scheduled campaigns cannot be canceled; delete them to stop the send. Emails already delivered are not recalled. |

## Automations (`automations`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `list-automations` | read | full | List automations with context, status, and name filters. |
| `get-automation` | read | full | Retrieve an automation with its steps and connections. |
| `create-automation` | create | full | Save a new automation as a draft: a trigger step, action steps, and connections between step keys. Saving runs nothing; steps run only after start-automation (for each matching event) or trigger-automation (one run). Each action does the same as one tool: send_email = send-email with a template, forward_email = forward-email, add_to_audience = add-audience-subscriber, remove_from_audience = remove-audience-subscriber, edit_contact = update-contact, create_contact = create-contact, add_to_suppressions = create-suppression, remove_from_suppressions = delete-suppression. wait, condition, experiment, run_automation and end only control the flow. Steps that call webhooks can only be added in the dashboard. |
| `update-automation` | destructive | full | Change an automation's name, description or settings, or replace its steps and connections (same step types as create-automation). Passing steps or connections replaces the whole graph; the previous steps can't be restored. |
| `delete-automation` | delete | full | Delete an automation. New events no longer start runs; runs already in progress finish. |
| `start-automation` | send | full | Start or resume an automation. From then on every event that matches its trigger starts a run that executes its steps for real, including sending emails and changing contacts (see get-automation for the steps). Each run uses 3 credits. |
| `pause-automation` | action | full | Pause an automation so new events don't start runs. Runs already in progress keep going. |
| `stop-automation` | destructive | full | Stop an automation and cancel every run in progress. Canceled runs can't be resumed, even if the automation is started again. |
| `trigger-automation` | send | full | Start one run of a running automation now. The run executes the automation's steps right away (see get-automation), including sending real emails. The automation needs a system.manual trigger step; in contact automations pass the contact as payload.contact_id. |
| `list-automation-runs` | read | full | List runs of an automation, optionally by status. |
| `get-automation-run` | read | full | Retrieve one automation run with its step history. |
| `get-automation-stats` | read | full | Return run totals by status and outcome for an automation. |
| `get-automation-step-stats` | read | full | Return totals for one step, including the delivery funnel for send_email steps. |

## Forms (`forms`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `list-forms` | read | full | List signup forms with name, type, and status filters. |
| `get-form` | read | full | Retrieve a signup form with its definition and settings. |
| `create-form` | create | full | Create a draft signup form (popup, full page, flyout, embed, or banner). |
| `update-form` | update | full | Update a form name, type, definition, or settings. |
| `delete-form` | delete | full | Permanently delete a form. Embedded copies stop working. |
| `publish-form` | external | full | Publish a form so it starts collecting signups from anyone with its link or embed. |
| `unpublish-form` | action | full | Take a form offline. It stops collecting signups. |
| `reset-form-token` | destructive | full | Rotate the public form token. Existing embed codes stop working until updated. |

## Email verification (`verification`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `verify-email` | external | full | Check whether one address is deliverable (syntax, MX, disposable, role, and optional SMTP checks). Uses verification credits. |
| `create-verification-list` | create | full | Verify up to 10,000 addresses in the background. Uses one verification credit per address; poll get-verification-list for progress. |
| `list-verification-lists` | read | full | List bulk verification lists with their progress. |
| `get-verification-list` | read | full | Retrieve a verification list with progress and result counts. |
| `get-verification-list-results` | read | full | Return per-address results of a verification list, optionally by status or result. |

## Events (`events`)

| Tool | Kind | Scope | Description |
| --- | --- | --- | --- |
| `list-events` | read | full | List workspace events (email delivered, bounced, clicked, contact created, and more), newest first. |
| `get-event` | read | full | Retrieve one event with its full payload. |
