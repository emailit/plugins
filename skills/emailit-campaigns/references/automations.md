# Emailit automation reference

## Triggers by context

| Context | Triggers |
| --- | --- |
| `contact` | `contact.added_to_audience`, `contact.removed_from_audience`, `contact.updated`, `contact.loaded_email`, `contact.clicked_in_email`, `contact.visits_url`, `contact.date_anniversary`, `contact.on_date`, `contact.on_purchase`, `contact.on_event` |
| `email` | `email.received`, `email.delivered`, `email.bounced`, `email.complained`, `email.loaded`, `email.clicked`, `email.failed`, `email.suppressed`, `email.canceled` |
| `event` | Any custom name starting with `event.` (exactly one trigger) |
| Any | `system.manual` (run with `trigger-automation`), `system.schedule` |

`contact` and `email` automations can have several triggers, but they must all connect to the same first action.

Trigger `config` can narrow when it fires:

- `audience_id`: only for that audience (audience triggers).
- `filter`: `{ "match": "all" | "any", "rules": [{ "field", "operator", "value" }] }`.

## Actions by context

| Action | contact | email | event | Required config |
| --- | --- | --- | --- | --- |
| `wait` | yes | yes | yes | `seconds` (up to 2592000, 30 days) |
| `condition` | yes | yes | yes | `filter` with `match` and at least one rule |
| `experiment` | yes | yes | yes | `variants: [{ key, weight }]`, optional `control` |
| `call_webhook` | yes | yes | yes | `url`; optional `method`, `headers`, `body` |
| `run_automation` | yes | yes | yes | `automation_id` |
| `end` | yes | yes | yes | none |
| `send_email` | yes | yes | yes | `type: "template"`, `template_id`; optional `from`, `subject`, `reply_to` |
| `add_to_audience` | yes | no | no | `audience_id` |
| `remove_from_audience` | yes | no | no | `audience_id` |
| `edit_contact` | yes | no | no | `fields: [{ key, value }]` |
| `forward_email` | no | yes | yes | `to`; optional `from`, `subject` |
| `add_to_suppressions` | no | yes | yes | `email` in `event` context; optional `type` (default `recipient`), `reason` |
| `remove_from_suppressions` | no | yes | yes | `email` in `event` context |
| `create_contact` | no | yes | yes | `email` in `event` context; optional `first_name`, `audience_id` |

In `email` context these three actions use the email's recipient. In `event` context there is no contact or email, so set `config.email`, usually from the payload: `{ "email": "{{payload.email}}" }`. Config strings can use `{{payload.*}}`, `{{meta.*}}`, `{{contact.*}}`, and `{{email.*}}`. Without an address the step fails when a run reaches it.

Condition operators: `equals`, `not_equals`, `contains`, `not_contains`, `greater_than`, `less_than`, `is_set`, `is_not_set`, `starts_with`, `ends_with`, `in`, `not_in`.

`create-automation` accepts incomplete action config (for example no `template_id` yet). `update-automation` with `steps` checks every step fully. `start-automation` does not, so before starting, read the automation back and make sure each step's required config is filled in; an incomplete step fails when a run reaches it.

## Branches

- `condition` takes the `yes` or `no` branch.
- `experiment` takes the branch named after the chosen variant key.
- Other steps continue on `default` (the branch can be omitted).

## Example: welcome series

Contact joins the Newsletter audience, gets a welcome email, waits 3 days, then gets a tips email only if their `plan` custom field is still empty.

```json
{
  "name": "Welcome series",
  "context": "contact",
  "steps": [
    { "key": "joined", "type": "trigger", "trigger": "contact.added_to_audience", "config": { "audience_id": "aud_..." } },
    { "key": "welcome", "type": "action", "action": "send_email", "config": { "type": "template", "template_id": "tem_welcome" } },
    { "key": "wait3d", "type": "action", "action": "wait", "config": { "seconds": 259200 } },
    { "key": "check", "type": "action", "action": "condition", "config": { "filter": { "match": "all", "rules": [{ "field": "contact.custom_fields.plan", "operator": "is_not_set" }] } } },
    { "key": "tips", "type": "action", "action": "send_email", "config": { "type": "template", "template_id": "tem_tips" } },
    { "key": "done", "type": "action", "action": "end" }
  ],
  "connections": [
    { "from": "joined", "to": "welcome" },
    { "from": "welcome", "to": "wait3d" },
    { "from": "wait3d", "to": "check" },
    { "from": "check", "to": "tips", "branch": "yes" },
    { "from": "check", "to": "done", "branch": "no" }
  ]
}
```

## Example: bounce clean up

```json
{
  "name": "Suppress hard bounces",
  "context": "email",
  "steps": [
    { "key": "bounced", "type": "trigger", "trigger": "email.bounced" },
    { "key": "suppress", "type": "action", "action": "add_to_suppressions" }
  ],
  "connections": [{ "from": "bounced", "to": "suppress" }]
}
```

## Example: manual trigger with a payload

Use `system.manual` and run it with `trigger-automation`, passing `payload` (for example `{ "email": "user@example.com" }`). The automation must be running. Its steps may send real email, so confirm first.

## Run statuses

`running`, `completed`, `failed`, `skipped`, `canceled`, `paused`. Filter `list-automation-runs` by `status` (it pages with `page` and `per_page`, not `limit`), then open one with `get-automation-run` to see each step's outcome and error.
