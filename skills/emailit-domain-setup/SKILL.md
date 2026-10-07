---
name: emailit-domain-setup
description: This skill should be used when the user asks to "add a sending domain", "verify my domain in Emailit", "set up SPF", "set up DKIM", "fix DNS records", "why is my domain not verified", "add a tracking domain", or "receive inbound email". Covers adding a domain, publishing the Emailit DNS records at any DNS provider, verifying, and fixing failed records.
---

# Emailit domain setup

Emailit sends only from verified domains. A domain is verified when its return path MX, SPF, and DKIM records resolve to the expected values.

## 1. Choose the domain

Ask which domain the user wants to send from. Recommend a subdomain (`mail.example.com`, `send.example.com`) instead of the root domain:

- Reputation stays separate from the company's own mailboxes.
- The root domain's existing SPF and MX records are not touched.

If the user already has the domain in Emailit, skip to step 3.

## 2. Add it

Confirm the name, then call `create-domain` with `name`. Optional flags:

- `incoming`: receive email on this domain. It needs the inbound MX.
- `dmarc_reports`: collect DMARC reports in Emailit. The suggested DMARC record then includes the reporting address. Needs the Pro or Business plan; on pay as you go it fails with 403 `plan_required`, so leave it off there.

The response contains `dns_records`. Each record has `type`, `name`, `value`, `priority`, `required`, and `status`.

## 3. Publish the records

Show the records as a table the user can copy. Use the exact `name` and `value` from `get-domain`; never rebuild them by hand. For `mail.example.com` they look like this:

| Type | Name | Value | Required |
| --- | --- | --- | --- |
| MX (priority 10) | `emailit.mail.example.com` | return path host from Emailit | Yes |
| TXT | `emailit.mail.example.com` | `v=spf1 include:_spf.emailit.com ~all` | Yes |
| TXT | `emailit._domainkey.mail.example.com` | `v=DKIM1; t=s; h=sha256; p=...` | Yes |
| TXT | `_dmarc.mail.example.com` | `v=DMARC1; p=none; ...` | Recommended |
| CNAME | `go.mail.example.com` | `go.emailitmail.com` | For tracking |
| MX (priority 10) | `inbound.mail.example.com` | `inbound.emailitmail.com` | For inbound |

The SPF and return path records sit on the `emailit.` subdomain, so they never conflict with an SPF record the user already has.

Provider notes are in `references/dns-providers.md`. The most common mistake is pasting the full name into a provider that appends the zone automatically, which creates `emailit.mail.example.com.example.com`.

## 4. Verify

DNS changes usually show up within minutes and can take up to 48 hours. When the user says the records are in, call `verify-domain` with the domain ID.

Then call `get-domain` and report each record's `status`: `ok`, `missing` (not found), `invalid` (found with the wrong value), `error` (the DNS lookup failed), or `pending` (not checked yet).

- All required records `ok` and `verification_status` is `verified`: done. Suggest sending a test with `send-email`.
- A record `missing`, `invalid`, or `error`: read its `error` and use the table in `references/troubleshooting.md`.
- Records are fine but `verification_status` is `pending_review` (`manual_review_required: true`): on pay as you go plans, domains registered less than 30 days ago get a manual review. Tell the user Emailit reviews it and there is nothing else to fix.

Do not call `verify-domain` in a tight loop. If records are missing, wait for the user to fix them.

## 5. Tracking and inbound

- **Tracking**: open and click tracking need the `go` CNAME. Do not pass `track_loads` or `track_clicks` to `create-domain`; Emailit rejects them until the CNAME verifies. After `verify-domain` shows the tracking record `ok`, turn them on with `update-domain`.
- **Inbound**: with `incoming: true` and the inbound MX in place, received emails appear in `list-emails` with `type: inbound`, and `email.received` webhooks fire.

## 6. DMARC

Start with `p=none` to monitor. After a few weeks of clean reports (`get-dmarc-stats`, `list-dmarc-sources`), move to `p=quarantine` and then `p=reject`. Load `emailit-deliverability` for reading reports.

## Removing a domain

`delete-domain` stops all sending from it and cannot be undone. Confirm the domain name with the user and warn that apps sending from it will start failing.
