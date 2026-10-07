# Emailit sending patterns

Examples use Node; the fields are the same in every SDK and in the REST body.

## Templates and variables

Create the template once (dashboard, `create-template` tool, or the API), publish it, and send by alias:

```js
await emailit.emails.send({
  from: process.env.EMAIL_FROM,
  to: [user.email],
  template: 'password-reset',
  variables: { first_name: user.firstName, reset_url: url },
});
```

In the template, use `{{first_name}}` and `{{reset_url}}`. The template can supply the subject and content; values in the send override them. `from` is always required in the send. Sending by alias only finds published templates.

## Attachments

```js
attachments: [
  { filename: 'invoice.pdf', content: pdfBuffer.toString('base64'), content_type: 'application/pdf' },
  { filename: 'terms.pdf', url: 'https://example.com/terms.pdf' },
  { filename: 'logo.png', content: logoBase64, content_type: 'image/png', content_id: 'logo' },
]
```

Reference an inline image in HTML with `<img src="cid:logo">`. Keep the total message small; large attachments hurt delivery.

## Scheduling

```js
await emailit.emails.send({ ...message, scheduled_at: '2026-11-03T09:00:00Z' });
```

`scheduled_at` also accepts a Unix timestamp or natural language such as `tomorrow at 9am`. A scheduled email can be rescheduled (update its `scheduled_at`) or canceled until 3 minutes before it goes out.

## Correlate with your data

```js
meta: { order_id: '1234', user_id: '42' }
```

`meta` values must be strings. They come back on the email and in webhook events, so a webhook handler can find the order without a lookup table.

## Idempotency

Send the same `Idempotency-Key` header for retries of the same logical email:

```js
await fetch('https://api.emailit.com/v2/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.EMAILIT_API_KEY}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': `order-${order.id}-receipt`,
  },
  body: JSON.stringify(message),
});
```

- Keys are up to 256 characters of letters, digits, dashes, and underscores (`^[a-zA-Z0-9_-]+$`). Anything else is rejected with 400. Keys are remembered for 24 hours per workspace.
- A repeat with the same key returns the original response instead of sending again.
- A 409 means the first request with that key is still in progress. Wait and retry with the same key.

## Errors and retries

The SDKs throw typed errors:

| Error | HTTP | Retry? |
| --- | --- | --- |
| `AuthenticationException` | 401 | No. Check the key |
| `InvalidRequestException` | 400 or 404 | No. Fix the request |
| `UnprocessableEntityException` | 422 | No. For example "Domain not verified" |
| `RateLimitException` | 429 | Yes, with backoff |
| `ApiConnectionException` | network | Yes, with backoff and the same idempotency key |
| `ApiErrorException` | 5xx | Yes, a few times |

A safe retry loop: up to 3 attempts, waiting 1, 2, then 4 seconds plus jitter, always with the same idempotency key.

Sending is limited per workspace, in messages per second and per day, each recipient counting as one message. Workspaces without their own limits get 2 per second and 5,000 per day; read the `ratelimit-limit` and `ratelimit-daily-limit` response headers for the real values. Other endpoints are not covered by these limits. For bursts, queue sends and drain the queue at the per second rate rather than calling the API from every web request in parallel.

## Testing

- Unit tests: mock the SDK client; assert on the payload you pass to `emails.send`.
- Staging: use a separate workspace and API key, and send only to addresses you own.
- Never point automated tests at real customer addresses.
