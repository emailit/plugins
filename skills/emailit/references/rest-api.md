# Emailit REST API v2

Base URL: `https://api.emailit.com/v2`

Every request needs `Authorization: Bearer <api key>`. Read the key from `EMAILIT_API_KEY`. Send JSON with `Content-Type: application/json`. Updates use `POST /resource/:id`, not PATCH or PUT.

## Send an email

```bash
curl https://api.emailit.com/v2/emails \
  -H "Authorization: Bearer $EMAILIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Acme <hello@mail.acme.com>",
    "to": ["customer@example.com"],
    "subject": "Your order shipped",
    "html": "<p>Hi {{first_name}}, your order is on its way.</p>",
    "text": "Hi {{first_name}}, your order is on its way.",
    "variables": { "first_name": "Ana" }
  }'
```

Body fields:

| Field | Type | Notes |
| --- | --- | --- |
| `from` | string | Always required, even with a template. Must use a verified sending domain. `Name <addr>` is allowed. |
| `to` | string or array | Required. |
| `cc`, `bcc`, `reply_to` | string or array | Optional. |
| `subject` | string | Required unless the template sets it. |
| `html`, `text` | string | At least one, unless `template` is set. |
| `template` | string | Template ID (`tem_...`) or alias. An alias only finds published templates. |
| `variables` | object | Values for `{{name}}` placeholders. |
| `attachments` | array | `[{ "filename": "a.pdf", "content": "<base64>", "content_type": "application/pdf" }]`, or `{ "filename", "url" }` to fetch the file. Add `content_id` for inline `cid:` images. |
| `headers` | object | Extra MIME headers. |
| `meta` | object | Your own string key value pairs, returned in events and webhooks. |
| `scheduled_at` | string | Future send time: ISO 8601, a Unix timestamp, or natural language such as `in 1 hour`. |
| `tracking` | boolean or object | `true`, `false`, or `{ "loads": true, "clicks": true }`. Defaults to the sending domain settings. Needs a verified tracking CNAME. |

The response includes `id` (`em_...`) and `status`.

## SMTP

Host `smtp.emailit.com`, port `587` with STARTTLS, username `emailit`, password is the API key.

## Endpoints

| Resource | Endpoints |
| --- | --- |
| Emails | `GET /emails`, `POST /emails`, `GET /emails/:id`, `POST /emails/:id`, `GET /emails/:id/raw`, `GET /emails/:id/body`, `GET /emails/:id/meta`, `GET /emails/:id/attachments`, `POST /emails/:id/cancel`, `POST /emails/:id/retry`, `POST /emails/:id/forward` |
| Domains | `GET /domains`, `POST /domains`, `GET /domains/:id`, `POST /domains/:id`, `DELETE /domains/:id`, `POST /domains/:id/verify` |
| DMARC | `GET /domains/:id/dmarc/reports`, `GET /domains/:id/dmarc/reports/:report_id`, `POST /domains/:id/dmarc/reports`, `GET /domains/:id/dmarc/forensic`, `GET /domains/:id/dmarc/forensic/:report_id`, `GET /domains/:id/dmarc/stats`, `GET /domains/:id/dmarc/sources`, `GET /domains/:id/dmarc/countries`, `GET /domains/:id/dmarc/asns`, `GET /domains/:id/dmarc/reporters` |
| Templates | `GET /templates`, `POST /templates`, `GET /templates/:id`, `POST /templates/:id`, `DELETE /templates/:id`, `POST /templates/:id/publish` |
| API keys | `GET /api-keys`, `POST /api-keys`, `GET /api-keys/:id`, `POST /api-keys/:id`, `DELETE /api-keys/:id`, `POST /api-keys/:id/regenerate` |
| Audiences | `GET /audiences`, `POST /audiences`, `GET /audiences/:id`, `POST /audiences/:id`, `DELETE /audiences/:id` |
| Subscribers | `GET /audiences/:id/subscribers`, `POST /audiences/:id/subscribers`, `GET /audiences/:id/subscribers/:subscriberId`, `POST /audiences/:id/subscribers/:subscriberId`, `DELETE /audiences/:id/subscribers/:subscriberId` |
| Contacts | `GET /contacts`, `POST /contacts`, `GET /contacts/:id`, `POST /contacts/:id`, `DELETE /contacts/:id`, `POST /contacts/bulk`, `GET /contacts/export`, `POST /contacts/export` |
| Suppressions | `GET /suppressions`, `POST /suppressions`, `GET /suppressions/:id`, `POST /suppressions/:id`, `DELETE /suppressions/:id` |
| Webhooks | `GET /webhooks`, `POST /webhooks`, `GET /webhooks/:id`, `POST /webhooks/:id`, `DELETE /webhooks/:id`, `POST /webhooks/:id/test`, `POST /webhooks/:id/reset-secret`, `POST /webhooks/:id/retry-failed`, `POST /webhooks/:id/requests/:requestId/retry` |
| Events | `GET /events`, `GET /events/:id` |
| Campaigns | `GET /campaigns`, `POST /campaigns`, `GET /campaigns/:id`, `POST /campaigns/:id`, `DELETE /campaigns/:id`, `POST /campaigns/:id/send`, `POST /campaigns/:id/cancel` |
| Automations | `GET /automations`, `POST /automations`, `GET /automations/:id`, `POST /automations/:id`, `DELETE /automations/:id`, `POST /automations/:id/start`, `POST /automations/:id/pause`, `POST /automations/:id/stop`, `POST /automations/:id/trigger`, `GET /automations/:id/runs`, `GET /automations/:id/runs/:runId`, `GET /automations/:id/stats`, `GET /automations/:id/steps/:stepKey/stats` |
| Forms | `GET /forms`, `POST /forms`, `GET /forms/:id`, `POST /forms/:id`, `DELETE /forms/:id`, `POST /forms/:id/publish`, `POST /forms/:id/unpublish`, `POST /forms/:id/reset-token` |
| Verification | `POST /email-verifications`, `GET /email-verification-lists`, `POST /email-verification-lists`, `GET /email-verification-lists/:id`, `GET /email-verification-lists/:id/results`, `GET /email-verification-lists/:id/export` |

## Lists and filters

Most list endpoints take `page` and `limit` (1 to 100), plus `search`, `sort`, `order` (`asc` or `desc`), and `match` (`all` or `or`). Templates, automations, and automation runs take `per_page` (1 to 100) instead of `limit`, and filter with `filter[...]` keys such as `filter[name]=welcome` or, for automations, `filter[status]=running`. Other lists (and templates) take filters as query keys shaped `field.condition=value`, for example `status.exact=bounced` or `created_at.after=2026-01-01`. Conditions: `exact`, `not_exact`, `contains`, `not_contains`, `starts_with`, `ends_with`, `empty`, `not_empty`, `gt`, `gte`, `lt`, `lte`, `before`, `after`. The MCP list tools build these keys from `filters: [{field, condition, value}]`.

## Errors

Errors return JSON with `error` and `message`, and sometimes `errors` with per field details:

```json
{ "statusCode": 401, "error": "UnauthorizedError", "message": "Invalid API key" }
```

## Limits

- Sending (`POST /emails`) is limited per workspace: messages per second and messages per day, each recipient counting as one message. A workspace without its own limits gets 2 per second and 5,000 per day. The `ratelimit-limit` and `ratelimit-daily-limit` response headers show the workspace's values, and `ratelimit-remaining` and `ratelimit-daily-remaining` what is left.
- Over either limit the API returns 429 with `retry_after` in seconds (until midnight UTC for the daily limit). Slow down and retry with backoff.
- These limits apply to sending only. A few endpoints have their own: `POST /emails/:id/forward` allows 3 forwards an hour per workspace, and `POST /webhooks/:id/test` 5 calls a minute.
- To raise the sending limits, request an increase on the dashboard or contact support.
- A scheduled email can be canceled until 3 minutes before its send time.

## API key scopes

API keys have `full` or `sending` permission. Sending keys can only send and manage sent email, and can be limited to one sending domain. Use a sending key in production apps that only send.
