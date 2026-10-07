# Adding Emailit records at common DNS providers

Emailit gives full record names such as `emailit.mail.example.com`. Most providers want only the part before the zone. For a zone `example.com`:

| Emailit name | Enter in the host field |
| --- | --- |
| `emailit.mail.example.com` | `emailit.mail` |
| `emailit._domainkey.mail.example.com` | `emailit._domainkey.mail` |
| `_dmarc.mail.example.com` | `_dmarc.mail` |
| `go.mail.example.com` | `go.mail` |

If the user is sending from the root domain (`example.com`), the host for the return path and SPF records is `emailit`, and for DKIM `emailit._domainkey`.

## Cloudflare

- **DNS > Records > Add record.** Type, Name (host only), Content.
- Set **Proxy status** to **DNS only** (grey cloud) for the tracking CNAME. A proxied CNAME breaks tracking verification.
- MX: put the priority (10) in its own field.
- The Emailit dashboard can also publish the records for Cloudflare zones with one click on the domain page.

## GoDaddy

- **My Products > Domain > DNS > Add New Record.**
- Host is the part before the zone. Use `@` only for the root.
- TXT values go in without surrounding quotes.

## Namecheap

- **Domain List > Manage > Advanced DNS > Add New Record.**
- MX records go under **Mail Settings > Custom MX**. Choose **Custom MX** first, or Namecheap hides the MX type.

## Google Cloud DNS and Route 53

- These expect the full name. Route 53 accepts `emailit.mail.example.com`; Cloud DNS wants a trailing dot (`emailit.mail.example.com.`).
- TXT values must be in double quotes. Split DKIM values longer than 255 characters into several quoted strings in the same record: `"v=DKIM1; t=s; h=sha256; p=MIIB..." "...rest"`.

## Vercel, Netlify, and other platform DNS

- Add records in the project or team DNS settings. Use the host only.
- If the domain's nameservers point elsewhere, add the records where the nameservers are, not in the platform.

## Find where DNS is hosted

Run `dig NS example.com +short` (or use any online NS lookup). The nameserver names tell you the provider, for example `*.ns.cloudflare.com` or `*.domaincontrol.com` (GoDaddy).

## Check a record yourself

```bash
dig TXT emailit.mail.example.com +short
dig TXT emailit._domainkey.mail.example.com +short
dig MX emailit.mail.example.com +short
dig CNAME go.mail.example.com +short
```

An empty answer means the record is not live yet, or the name is wrong.
