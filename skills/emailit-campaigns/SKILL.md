---
name: emailit-campaigns
description: This skill should be used when the user asks to "create a campaign", "send a newsletter", "schedule a campaign", "build an audience", "import contacts", "create a welcome series", "set up an automation", "add a signup form", or "see campaign results" in Emailit. Covers audiences, contacts, campaigns, automations, and signup forms, with safe sending.
---

# Emailit campaigns, automations, and audiences

Marketing email in Emailit is built from audiences (lists of subscribers), campaigns (one send to one or more audiences), automations (event driven flows), and forms (signup capture). Every recipient must have opted in.

## Before anything sends

- Confirm the workspace with `get-current-workspace`.
- Confirm a verified sending domain with `list-domains`. The campaign `from_email` must use it.
- Confirm consent: never send to purchased, rented, or scraped lists. If the user mentions one, decline and explain why.
- Show a summary and wait for an explicit yes before `send-campaign`, `trigger-automation`, or `start-automation`.

## Audiences and contacts

- Create a list: `create-audience` with `name`.
- Add someone: `add-audience-subscriber` with the audience `id`, `email`, and optional `first_name`, `last_name`, `custom_fields`. It creates the contact if needed.
- Contacts across all audiences: `list-contacts`, `get-contact`, `create-contact` (can join `audiences` directly), `update-contact`.
- Many at once: `bulk-update-contacts` with up to 100 contact IDs and one action (`add_to_audience`, `remove_from_audience`, `unsubscribe`, `resubscribe`, `delete`). Confirm deletes and unsubscribes.
- Export: `export-contacts` returns CSV for the matching contacts.

For large imports (thousands of rows) point the user to CSV import in the dashboard; tool calls one at a time are slow and rate limited.

## Campaigns

Flow: **create draft, set recipients, review, test, send or schedule.**

1. `create-campaign` with `name`, `subject`, `from_email`, `from_name`, `preview_text`, `content`, and `content_type` (use `html`, or `text` for plain text). It returns a draft (`cmp_...`).
2. `update-campaign` with `recipients: [{ "audience_id": "aud_..." }]`. Add `"exclude": true` to leave out an audience. Passing `recipients` replaces the whole list, and at least one included audience is required.
3. Review: `get-campaign`. Read back the subject, from, and `recipients` (audiences and exclusions); it has no recipient count. For a rough size, `get-audience` shows each audience's `subscribers_count`, before exclusions, unsubscribes, and suppressions. Show the content summary.
4. Test: offer to `send-email` the same subject and HTML to the user's own address first.
5. Send: after a clear yes, `send-campaign` with the `id`. Add `scheduled_at` (ISO 8601) to schedule it instead.
6. Stop it: `cancel-campaign` works on draft and sending campaigns. A scheduled campaign cannot be canceled; `delete-campaign` removes it so it never sends. Confirm either one first.

Personalize with `{{first_name}}`, `{{last_name}}`, `{{email}}`, `{{cf.<field>}}` for custom fields, and `{{unsubscribe_url}}`. Empty values render as blank, so write copy that still reads well without a first name. Emailit adds List-Unsubscribe headers but no unsubscribe link or footer to the body, so every campaign body must contain `{{unsubscribe_url}}`.

Campaign writing guidance and an HTML starter are in `references/campaigns.md`.

### Results

`get-campaign` returns the status, `sent_at`, and the recipient audiences. Engagement totals per campaign are shown in the dashboard report. Through the tools, use `list-events` with `type` such as `campaign.sent`, `email.clicked`, or `email.bounced`, and note that opens are approximate.

## Automations

An automation is a graph of steps. A trigger step starts a run; action steps run in order along connections.

1. Pick the `context`:
   - `contact`: runs per contact (audience joins, updates, dates, clicks).
   - `email`: runs per email event (delivered, bounced, received).
   - `event`: runs on a custom `event.*` trigger.
2. `create-automation` with `name`, `context`, `steps`, and `connections`. It is created as a draft.
3. Check it with `get-automation`. Explain the flow in plain words.
4. `start-automation` after the user confirms. `pause-automation` and `stop-automation` stop new runs.
5. Monitor with `list-automation-runs` (`page` and `per_page`, optional `status`), `get-automation-run`, `get-automation-stats`, and `get-automation-step-stats`.

Step shape:

```json
{ "key": "welcome", "type": "action", "action": "send_email", "config": { "type": "template", "template_id": "tem_..." } }
```

Connections join step keys: `{ "from": "trigger", "to": "welcome" }`. After a `condition` step use `"branch": "yes"` or `"branch": "no"`. After an `experiment` step use the variant key as the branch.

Valid triggers and actions for each context, config fields, and full examples are in `references/automations.md`. `send_email` steps send a published template, so create and publish the template first (`create-template`, `publish-template`).

## Forms

- `create-form` with `name` and `type` (`popup`, `full_page`, `flyout`, `embed`, or `banner`). The form `definition` and `settings` are easiest to design in the dashboard editor; offer to create a draft and let the user style it there.
- `publish-form` starts collecting signups; `unpublish-form` stops it.
- `reset-form-token` invalidates the old embed token. Embedded forms stop working until the snippet is updated, so confirm first.

## Common requests

| Request | Tools |
| --- | --- |
| "Send our April newsletter to Customers" | `list-audiences`, `create-campaign`, `update-campaign`, `get-campaign`, then confirm and `send-campaign` |
| "Welcome new subscribers" | `create-template`, `publish-template`, `create-automation` (trigger `contact.added_to_audience` with `audience_id`), `start-automation` |
| "How did last week's campaign do?" | `list-campaigns`, `get-campaign` |
| "Remove everyone who bounced from this list" | `list-suppressions` (type bounce), `list-audience-subscribers`, `remove-audience-subscriber` after confirming |
