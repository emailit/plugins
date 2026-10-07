# Reading DMARC data in Emailit

Emailit collects DMARC aggregate and forensic reports for domains with `dmarc_reports: true` (set on `create-domain` or `update-domain`), once the domain's `_dmarc` record points `rua` and `ruf` at the reporting address from `get-domain`. Turning on DMARC reports needs the Pro or Business plan; on pay as you go the call fails with 403 `plan_required`.

## Tools

| Tool | Use it for |
| --- | --- |
| `get-dmarc-stats` | Pass and fail totals for a date range. Start here |
| `list-dmarc-sources` | Sending IPs and services seen using the domain, with pass rates |
| `list-dmarc-reporters` | Which mailbox providers sent reports (Google, Microsoft, Yahoo, and others) |
| `list-dmarc-countries`, `list-dmarc-asns` | Where unexpected traffic comes from |
| `list-dmarc-reports`, `get-dmarc-report` | Individual aggregate reports |
| `list-dmarc-forensic-reports`, `get-dmarc-forensic-report` | Failure samples, when providers send them |
| `upload-dmarc-report` | Import a report the user received elsewhere |

## How to read the results

- **Emailit sources passing**: SPF and DKIM aligned. This is the goal.
- **Emailit sources failing DKIM**: the DKIM record changed or was removed. Check `get-domain`.
- **Another legitimate service failing** (a CRM, a helpdesk, Google Workspace): that service needs its own SPF include or DKIM key on the domain. Name the service from the source hostname or ASN.
- **Unknown sources failing**: likely spoofing. This is the evidence for moving to a stricter policy.

## Moving the policy

1. `p=none` for at least 2 to 4 weeks while reports come in.
2. Fix every legitimate source until its pass rate is close to 100 percent.
3. `p=quarantine`, optionally with `pct=25` and rising.
4. `p=reject` once quarantine shows no legitimate failures.

Never suggest `p=reject` while a legitimate source still fails; that source's email would be dropped.
