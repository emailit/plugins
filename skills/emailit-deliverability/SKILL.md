---
name: emailit-deliverability
description: This skill should be used when the user asks "why did my email bounce", "why are my emails going to spam", "was this email delivered", "check my DMARC reports", "clean my email list", "remove a suppression", "lower my bounce rate", or "improve deliverability" in Emailit. Covers investigating delivery status, bounces, complaints, suppressions, DMARC data, list verification, and sending practices.
---

# Emailit deliverability

Answer with evidence from the account, not general advice. Pull the data first, then explain the cause and the fix.

## Investigate one email

1. Find it: `list-emails` with `rcpt_to`, `subject`, or `mail_from`, plus `date_from` and `date_to`. Use `status` to narrow to `bounced`, `failed`, `rejected`, `suppressed`, `complained`, or `held`.
2. Open it: `get-email` with the ID. Read:
   - `status`: the current state. Meanings are in `references/statuses.md`.
   - `deliveries[]`: each delivery attempt with `status`, `output` (the receiving server's SMTP reply), and `details`. The SMTP reply is the most useful evidence for a bounce.
   - `spam_score` and `spam_checks`: Emailit's own content scan.
   - `sending_domain`: the SPF, DKIM, DMARC, and return path status of the domain it was sent from.
3. Explain the cause in plain words, quoting the SMTP reply. Then give one concrete fix.

Common SMTP replies:

| Reply contains | Meaning | Fix |
| --- | --- | --- |
| `550 5.1.1`, "user unknown", "does not exist" | Hard bounce: the mailbox does not exist | Remove the address. Emailit suppresses it automatically if auto suppression is on |
| `552`, "mailbox full", "over quota" | Mailbox full | Retry later with `retry-email`; remove if it repeats |
| `421`, `451`, "try again later", "rate limited" | Temporary deferral | Nothing; Emailit retries. Status stays `attempted` meanwhile |
| `550 5.7.1`, "spam", "policy", "blocked" | Content or reputation block | Check DMARC alignment, spam score, links, and recent complaint rate |
| "SPF", "DKIM", "DMARC", "authentication" | Authentication failed | Fix the domain records (`emailit-domain-setup`) |

## Investigate a trend

- Volume and outcomes: `list-emails` with `status` and a date range; compare counts for `delivered`, `bounced`, and `complained`.
- Workspace events: `list-events` with `type` such as `email.bounced` or `email.complained` and `include_data: true`.
- Per domain authentication: `get-dmarc-stats`, `list-dmarc-sources`, and `list-dmarc-reporters` for the domain. See `references/dmarc.md`.

Benchmarks to compare against: bounce rate under 2 percent, complaint rate under 0.1 percent. Higher numbers put the account's reputation at risk and can pause sending.

## Suppressions

What a suppression blocks depends on its type and on how the email is sent:

- **API and SMTP sends** are blocked only by a `recipient` suppression. The email gets status `suppressed`. `bounce`, `complaint`, and `unsubscribe` entries do not stop them.
- **Campaigns** skip every address with a suppression of any type, plus unsubscribed contacts and subscribers.
- A suppression whose `keep_until` has passed no longer blocks anything.

Managing them:

- Automatic suppression (a workspace setting) adds a `recipient` suppression after bounces and a `complaint` suppression after a spam complaint. Pro and Business can limit it to one of the two or turn it off; other plans always have both on.
- Find one: `list-suppressions` with `search`. Read it with `get-suppression`.
- Add one: `create-suppression` with `email`, an optional `type` (default `recipient`, the only type that also stops API and SMTP sends), an optional `reason`, and optional `keep_until`.
- Remove one: `delete-suppression`. Only do this when the user confirms the address is valid and the person wants the email. Never remove a `complaint` or `unsubscribe` suppression just to get a campaign out; that breaks consent rules and hurts reputation.

## Verify addresses before sending

- One address: `verify-email` with `mode: "fast"` (syntax, MX, disposable, role) or `"full"` (adds an SMTP mailbox check). Both use verification credits; tell the user before running them.
- A list: `create-verification-list`, then poll `get-verification-list` until it finishes, then `get-verification-list-results`. Results are `safe`, `invalid`, `disposable`, `disabled`, `inbox_full`, `role`, or `unknown`. Suggest removing `invalid`, `disabled`, and `disposable` addresses, and reviewing `role`, `inbox_full`, and `unknown` ones before mailing them.

## Checklist for "my emails go to spam"

Work through these with real data and report each one:

1. **Authentication**: `get-domain` shows SPF, DKIM, and return path `ok`. A DMARC record exists.
2. **Alignment**: DMARC stats show passing alignment for Emailit sources. Unknown sources sending as the domain point to spoofing or a forgotten service.
3. **List quality**: recent bounce rate under 2 percent. Run list verification on old or imported lists.
4. **Complaints**: complaint rate under 0.1 percent. Every marketing email needs a working unsubscribe; campaign emails get a List-Unsubscribe header automatically.
5. **Content**: `spam_score` on recent emails. Avoid link shorteners, image only emails, and mismatched link text.
6. **Consistency**: a recognizable from name and address, and a steady sending volume. Warm up new domains by starting small.
7. **Separation**: transactional and marketing mail on different subdomains.

## Retrying

`retry-email` works only for `bounced`, `failed`, `suppressed`, or `held` emails less than 30 days old. It sends a new copy to the recipient with a new email ID, and a `recipient` suppression still blocks it. Confirm with the user, and do not retry hard bounces to addresses that do not exist.
