# Fixing failed domain records

Call `get-domain` and read each record's `status` (`missing`, `invalid`, or `error`) and `error`. Match the error below.

| Record | Error or symptom | Cause | Fix |
| --- | --- | --- | --- |
| Any | No record found | Not published, wrong host, or not propagated yet | Check the host field (see `dns-providers.md`), wait a few minutes, verify again |
| Any | Name doubled, such as `emailit.mail.example.com.example.com` | Full name pasted where the provider appends the zone | Use the host part only |
| SPF | An SPF record exists but it does not include `_spf.emailit.com` | The record on `emailit.<domain>` has other content | Replace it with exactly `v=spf1 include:_spf.emailit.com ~all` |
| SPF | Two SPF records | A second `v=spf1` TXT on the same name | Keep one record; merge includes if both are needed |
| DKIM | Value does not match | Truncated or extra quotes or spaces | Paste the value from `get-domain` again. Split long values into quoted 255 character chunks if the provider needs it |
| Return path MX | Points to another server | Wrong value or an old MX on the same name | The MX on `emailit.<domain>` must point only to the Emailit return path host from `get-domain` |
| Tracking CNAME | Not resolving | Proxied by Cloudflare, or a conflicting A record | Set DNS only (grey cloud); delete other records on the same name |
| Inbound MX | Not resolving | Missing or wrong priority | Add MX 10 to `inbound.emailitmail.com` on the inbound host |
| DMARC | Not found | Optional record not added | Add `_dmarc` TXT. Not required for verification |

## `verification_status` is `pending_review` ("Pending verification" in the dashboard) with every record ok

On pay as you go plans, domains registered less than 30 days ago are reviewed by hand. Nothing else needs to change. Pro and Business plans skip this check.

## The domain was verified, then failed

Emailit rechecks DNS every day and emails the workspace owner when a required record breaks. A record that disappears (for example after a DNS provider migration) moves the domain out of verified, and sends from it are refused. Publish the records again and call `verify-domain`, or wait for the next daily check to restore it.

## Check propagation

`dig TXT <name> @1.1.1.1 +short` and `dig TXT <name> @8.8.8.8 +short`. If public resolvers show the value but verification fails, wait 10 minutes for caches and verify once more.
