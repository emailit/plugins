---
name: emailit-webhooks
description: This skill should be used when the user asks to "set up an Emailit webhook", "receive bounce notifications", "verify the webhook signature", "handle email.delivered events", "my webhook is failing", "retry failed webhooks", or "sync Emailit events to my database". Covers creating webhooks, choosing events and filters, verifying X-Emailit-Signature, handling batched payloads, retries, and debugging.
---

# Emailit webhooks

Emailit sends HTTPS POST requests to the user's endpoint when events happen: email delivery outcomes, opens and clicks, domain, contact, audience, subscriber, template, suppression, verification, and campaign changes.

## Create a webhook

1. Ask for the endpoint URL (HTTPS, publicly reachable) and which events the app needs. Do not subscribe to everything by default; fewer events mean less load.
2. Call `create-webhook` with `name`, `url`, and either `events: [...]` or `all_events: true`. Event names are in `references/events.md`.
3. Optional `filter` delivers only matching events:

```json
{ "match": "all", "rules": [{ "field": "meta.app", "operator": "equals", "value": "billing" }] }
```

   A `field` is a dotted path inside the event's `object` (shown below), so write `meta.app`, `status`, or `to`, not `data.meta.app`. Loads and clicks nest the email, so use `email.meta.app` there. Operators: `equals`, `not_equals`, `contains`, `not_contains`, `starts_with`, `ends_with`, `greater_than`, `less_than`, `is_set`, `is_not_set`, `in`, `not_in`. Up to 25 rules. Filters need the Pro or Business plan; `get-webhook` shows `filters_allowed`.

4. The response includes `secret` (`whsec_...`); `get-webhook` returns it too. Tell the user to store it as `EMAILIT_WEBHOOK_SECRET` in their app's secret store. Do not repeat it in chat more than needed, and never write it into code or a commit. If it leaks, `reset-webhook-secret` issues a new one and the old one stops working at once.
5. `test-webhook` sends a sample event to the URL. Confirm first, since it calls the user's server.

## The request

```
POST <your url>
Content-Type: application/json
X-Emailit-Signature: <hex HMAC-SHA256>
X-Emailit-Timestamp: <unix seconds>
```

The body is a **JSON array** of events. Emailit batches events, so loop over every item:

```json
[
  {
    "event_id": "evt_...",
    "type": "email.delivered",
    "object": { "id": "em_...", "object": "email", "to": "user@example.com", "status": "delivered", "meta": { "order_id": "1234" } },
    "data": {
      "object": { "id": "em_...", "object": "email", "to": "user@example.com", "status": "delivered", "meta": { "order_id": "1234" } }
    }
  }
]
```

Each event carries the resource twice: at `data.object` and, as a copy, at the top level `object`. Read it from `data.object` (for example `event.data.object.meta.order_id`). Fields per event type are in `references/events.md`.

## Verify every request

Signature = hex of HMAC-SHA256, keyed with the webhook secret, over the string `"{timestamp}.{raw body}"`.

1. Read the **raw** body bytes before any JSON parsing. Re-serialized JSON will not match.
2. Compute the HMAC and compare with `X-Emailit-Signature` in constant time.
3. Reject timestamps more than 300 seconds from now, to block replays.
4. Return 401 on failure.

Code for Node, Next.js, Python, PHP, and Go, and the SDK helpers (`WebhookSignature.verify`) are in `references/verify-signature.md`.

## Handle events safely

- **Respond fast**: return 2xx within a few seconds, then process in a background job. Requests time out after 30 seconds.
- **Deduplicate** on `event_id`. Retries and batching mean the same event can arrive more than once.
- **Order is not guaranteed**. Use the event's own timestamps and the email's current status rather than arrival order. A `delivered` can arrive after `loaded`.
- **Correlate** with your own data through `meta` set on `send-email` (for example `data.object.meta.order_id`).

## Retries and failures

Any non-2xx response or timeout is a failure. Emailit retries each request with backoff: 5 minutes, 30 minutes, 2 hours, 5 hours, then every 12 hours, up to 11 attempts. The owner is alerted after the third failed attempt. A webhook with no successful delivery for 3 days is disabled.

- Check state: `get-webhook` shows `enabled` and `last_used_at`. `list-events` shows the events that were generated. Per request response codes are on the webhook page in the dashboard.
- Resend failed requests: `retry-failed-webhook-requests` queues again every request that failed permanently (all attempts used) in the last 7 days. If it finds any, it also re-enables the webhook, so fix the endpoint first. It returns `retried` with the count; 0 means nothing was resent and the webhook was left as it was.
- Resend one request: `retry-webhook-request` with the request ID from the dashboard. Only permanently failed requests can be retried, and it re-enables the webhook too.
- Turn a webhook back on without resending: `update-webhook` with `enabled: true`.

## Debugging checklist

| Symptom | Check |
| --- | --- |
| Signature never matches | Using the raw body, the right secret (it changes on reset), and `timestamp + "." + body` |
| 401 or 403 from the endpoint | Auth middleware, CSRF protection, or a firewall blocking the POST |
| Timeouts | Do the work after responding |
| Only one event handled | Body is an array; loop over it |
| No requests at all | `enabled` is false, the event is not subscribed, or the filter excludes it |

## Without MCP

REST endpoints: `POST /v2/webhooks`, `POST /v2/webhooks/:id` (update), `POST /v2/webhooks/:id/test`, `POST /v2/webhooks/:id/reset-secret`, `POST /v2/webhooks/:id/retry-failed`, `POST /v2/webhooks/:id/requests/:requestId/retry`.
