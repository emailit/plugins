---
name: emailit-sdk
description: This skill should be used when the user asks to "integrate Emailit", "send email from my app", "add Emailit to Node", "use Emailit with Laravel", "send email in Python with Emailit", "configure Emailit SMTP", "switch from SendGrid or Resend to Emailit", or is writing code that calls api.emailit.com. Covers the official SDKs (Node, Python, PHP, Laravel, Go, Ruby, Java, .NET, Rust), SMTP, configuration, templates, attachments, idempotency, and error handling.
---

# Emailit in application code

Write production ready code that sends through Emailit. Detect the project's language and framework from its files (`package.json`, `requirements.txt` or `pyproject.toml`, `composer.json`, `go.mod`, `Gemfile`, `pom.xml` or `build.gradle`, `*.csproj`, `Cargo.toml`) and use the matching SDK.

## Rules

1. **Read the key from the environment**: `EMAILIT_API_KEY`. Add it to `.env.example` with a placeholder, never to committed config. Keys start with `secret_`.
2. **Use a sending scope key** in apps that only send. Create one in the dashboard on the **API Keys** page (or with the `create-api-key` tool, `scope: "sending"`), optionally limited to one sending domain.
3. **Send from a verified domain**. Put the from address in config (`EMAIL_FROM`), not scattered through code.
4. **Send off the request path** for anything user facing: queue a job, so a slow or failed send does not break signup or checkout.
5. **Make sends idempotent**: pass an `Idempotency-Key` header derived from your own ID (for example `order-1234-shipped`). Emailit returns the first response for repeats within 24 hours.
6. **Handle errors by type**: retry 429 and 5xx with backoff; do not retry 400, 401, 403, or 422.

## Install and send

| Language | Install | Client |
| --- | --- | --- |
| Node.js 18+ | `npm install @emailit/node` | `new Emailit(process.env.EMAILIT_API_KEY)` |
| Python 3.7+ | `pip install emailit` | `EmailitClient(os.environ["EMAILIT_API_KEY"])` |
| PHP 8.1+ | `composer require emailit/emailit-php` | `Emailit::client(getenv('EMAILIT_API_KEY'))` |
| Laravel 10+ | `composer require emailit/emailit-laravel` | `MAIL_MAILER=emailit`, or the `Emailit` facade |
| Go 1.21+ | `go get github.com/emailit/emailit-go/v2` | `emailit.NewClient(os.Getenv("EMAILIT_API_KEY"))` |
| Ruby 3.0+ | `gem install emailit` | `Emailit::EmailitClient.new(ENV["EMAILIT_API_KEY"])` |
| Java 11+ | `com.emailit:emailit-java` | `new EmailitClient(System.getenv("EMAILIT_API_KEY"))` |
| .NET 8+ | `dotnet add package Emailit` | `new EmailitClient(Environment.GetEnvironmentVariable("EMAILIT_API_KEY"))` |
| Rust | `emailit = "2"` and `tokio` | `Emailit::new(&std::env::var("EMAILIT_API_KEY")?)` |

Node example:

```js
import { Emailit } from '@emailit/node';

const emailit = new Emailit(process.env.EMAILIT_API_KEY);

const email = await emailit.emails.send({
  from: process.env.EMAIL_FROM,
  to: ['user@example.com'],
  subject: 'Welcome to Acme',
  html: '<p>Thanks for signing up.</p>',
  text: 'Thanks for signing up.',
});
console.log(email.id); // em_...
```

Full examples for every language, plus SMTP settings for frameworks with a mail transport (Django, Rails Action Mailer, Nodemailer, Spring), are in `references/languages.md`.

## Beyond a basic send

`references/patterns.md` covers:

- Templates with `{{variables}}`, created once and referenced by alias.
- Attachments by base64 content or URL, and inline images with `content_id`.
- Scheduling with `scheduled_at`, and canceling.
- `meta` for correlating webhook events with your records.
- Idempotency keys, typed errors, and retry logic.
- Testing without sending to real people.

## Migrating from another provider

Map the old fields, then swap the client. Most providers use the same concepts:

| Other provider | Emailit |
| --- | --- |
| `from`, `to`, `cc`, `bcc`, `reply_to` or `replyTo` | Same names, `reply_to` |
| Template ID plus dynamic data | `template` (ID or alias) plus `variables` |
| Custom args, tags, or metadata | `meta` (string values) |
| `send_at` or `scheduledAt` | `scheduled_at` |
| Event webhooks | `create-webhook`, signature in `X-Emailit-Signature` |

Before switching traffic: verify the sending domain in Emailit (`emailit-domain-setup`), import suppressions from the old provider (`create-suppression`, type `bounce`, `complaint`, or `unsubscribe`), and set up webhooks (`emailit-webhooks`).

## Without an SDK

Plain HTTP works from any language:

```bash
curl https://api.emailit.com/v2/emails \
  -H "Authorization: Bearer $EMAILIT_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: welcome-user-42" \
  -d '{"from":"Acme <hello@mail.acme.com>","to":"user@example.com","subject":"Welcome","html":"<p>Hi</p>"}'
```

The full endpoint list is in the `emailit` skill's `references/rest-api.md`.
