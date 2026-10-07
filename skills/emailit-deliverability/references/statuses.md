# Email statuses

| Status | Meaning | Final |
| --- | --- | --- |
| `accepted` | Emailit accepted the email and queued it | No |
| `scheduled` | Waiting for `scheduled_at`. Can be canceled until 3 minutes before | No |
| `attempted` | Delivery tried and temporarily deferred; Emailit retries | No |
| `delivered` | The receiving server accepted it | No, can move to `loaded` or `clicked`, or to `bounced` or `complained` when a late report arrives |
| `loaded` | Opened (tracking pixel loaded). Needs load tracking | No |
| `clicked` | A tracked link was clicked. Needs click tracking | Yes |
| `bounced` | Not delivered and not retried: the receiving server rejected it permanently (also from a bounce report that arrives after `delivered`), the delivery attempts ran out, or Emailit could not send it, for example because its sending domain was deleted | Yes |
| `failed` | Emailit hit an internal error while processing the message. For outgoing email such an error is logged as a `failed` entry in `deliveries[]` and Emailit retries on its own, without changing the email's status | Yes |
| `rejected` | Refused before sending because the workspace is not verified yet and the recipient is not a workspace member's account email. `send-email` refuses such a send up front with a 403 and stores nothing, and a send from an unverified domain gets a 422 `Domain not verified` with nothing stored | Yes |
| `suppressed` | The recipient has a `recipient` suppression, so nothing was sent | Yes |
| `complained` | The recipient marked it as spam | Yes |
| `canceled` | Canceled before delivery | Yes |
| `held` | Not sent: the API key is set to hold mail, the workspace is out of credits or suspended, the sending domain is paused, or the spam check scored it at or above the threshold. The reason is in `deliveries[]` | Yes, `retry-email` sends a new copy |
| `received` | An inbound email received on a domain with inbound turned on | Yes |

Loads are approximate. Apple Mail Privacy Protection and image proxies load the pixel without a person opening the email, and some clients block images.

## Webhook events for each status

`email.accepted`, `email.scheduled`, `email.attempted`, `email.delivered`, `email.loaded`, `email.clicked`, `email.bounced`, `email.failed`, `email.rejected`, `email.suppressed`, `email.complained`, `email.canceled`, `email.held`, `email.received`. Load `emailit-webhooks` to receive them.
