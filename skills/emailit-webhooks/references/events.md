# Emailit webhook event types

| Group | Events |
| --- | --- |
| Email delivery | `email.accepted`, `email.scheduled`, `email.attempted`, `email.delivered`, `email.bounced`, `email.failed`, `email.rejected`, `email.suppressed`, `email.canceled`, `email.held` |
| Email engagement | `email.loaded`, `email.clicked`, `email.complained`, `email.unsubscribed`, `email.resubscribed` |
| Inbound | `email.received` |
| Domains | `domain.created`, `domain.updated`, `domain.deleted` |
| Audiences | `audience.created`, `audience.updated`, `audience.deleted` |
| Subscribers | `subscriber.created`, `subscriber.updated`, `subscriber.deleted`, `subscriber.resubscribed` |
| Contacts | `contact.created`, `contact.updated`, `contact.deleted` |
| Templates | `template.created`, `template.updated`, `template.deleted` |
| Suppressions | `suppression.created`, `suppression.updated`, `suppression.deleted` |
| Verification | `email_verification.created`, `email_verification.updated`, `email_verification_list.created`, `email_verification_list.updated` |
| Campaigns | `campaign.created`, `campaign.updated`, `campaign.deleted`, `campaign.scheduled`, `campaign.queued`, `campaign.sending`, `campaign.testing`, `campaign.sent`, `campaign.canceled`, `campaign.archived` |

`email.held` (Emailit held the email: the API key is set to hold, the workspace is out of credits or suspended, the sending domain is paused, or the spam check scored it too high) and `subscriber.resubscribed` (a subscriber rejoined an audience; `subscriber.updated` fires too) are sent, but they are not in the event name list that `create-webhook`, `update-webhook`, and `test-webhook` accept. To receive them through MCP, create the webhook with `all_events: true`.

## Typical subscriptions

| Goal | Events |
| --- | --- |
| Keep order emails in sync | `email.delivered`, `email.bounced`, `email.failed`, `email.complained` |
| Clean your own user table | `email.bounced`, `email.complained`, `email.unsubscribed`, `suppression.created` |
| Engagement analytics | `email.loaded`, `email.clicked` |
| Inbound processing | `email.received` |
| CRM sync | `contact.created`, `contact.updated`, `subscriber.created`, `subscriber.deleted` |

## Payload fields by group

Every event has `event_id`, `type`, and `data.object` (copied to the top level `object`). The fields below are inside `data.object`.

- **Delivery outcomes** (`email.delivered`, `email.bounced`, `email.attempted`, `email.failed`, `email.rejected`, `email.suppressed`, `email.held`, `email.complained`): `id` (`em_...`), `object` (`email`), `from`, `to`, `subject`, `status`, `meta` from the send, `created_at`, `updated_at`. `email.attempted` adds `smtp_code`, `smtp_enhanced_code`, and `smtp_response`.
- **Accepted, scheduled, canceled**: `id`, `object`, `from`, `to`, `subject`, `meta`, `timestamp`. `email.scheduled` adds `scheduled_at`; `email.canceled` adds `status` and `previous_status`.
- **Loads and clicks**: `id`, `object` (`load` or `click`), `email_id`, `email` (`id`, `rcpt_to`, `mail_from`, `subject`, `created_at`, `campaign`, `meta`), `contact`, `ip_address`, `user_agent`, `created_at`. Clicks also include `link` with `id` and `url`.
- **Unsubscribes and resubscribes** (`email.unsubscribed`, `email.resubscribed`): `id`, `object`, `from`, `to`, `subject`, `campaign`, `contact`, and `unsubscribed_at` or `resubscribed_at`.
- **Inbound** (`email.received`): `id`, `object`, `from`, `to`, `subject`, `created_at`.
- **Resource events** (`domain.*`, `contact.*`, `subscriber.*`, `campaign.*`, and so on): the resource itself, with its `id` and `object` type.

`test-webhook` sends a sample of the chosen type. Samples are not identical to live events: some include fields that live events do not have (for example `message_id`, `email_id` on delivery events, and `complaint_type` on complaints). Build handlers against the fields listed above.
