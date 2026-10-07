# Writing Emailit campaigns

## Checklist before sending

- Subject under about 60 characters, specific, no all caps or misleading "Re:".
- Inbox preview text that adds to the subject instead of repeating it. The campaign's `preview_text` field is saved but not added to the sent email, so put the text in a hidden preheader at the top of the HTML body (see the starter below).
- `from_name` the reader recognizes; `from_email` on a verified domain; `reply_to` that a person reads.
- One clear call to action, as a real link.
- `{{unsubscribe_url}}` as a visible link in every campaign body. Emailit adds List-Unsubscribe headers but does not insert an unsubscribe link or footer. Add the company's postal address where the law requires it (CAN-SPAM).
- Test send to the user, check on mobile, then send.

## Variables

| Tag | Value |
| --- | --- |
| `{{first_name}}` | Contact first name, or blank |
| `{{last_name}}` | Contact last name, or blank |
| `{{email}}` | Contact email |
| `{{cf.<field>}}` | Custom field value, for example `{{cf.plan}}` |
| `{{unsubscribe_url}}` | One click unsubscribe link for this contact |

## HTML starter

Email clients support a narrow subset of HTML and CSS. Use tables for layout, inline styles, and a 600px width.

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;">
    <div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Preview text shown in the inbox.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;">
      <tr>
        <td align="center" style="padding:24px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;">
            <tr>
              <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#1f2937;">
                <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;">Hi {{first_name}},</h1>
                <p style="margin:0 0 24px;">One short paragraph about why this email matters.</p>
                <a href="https://example.com/offer" style="display:inline-block;padding:12px 20px;background:#15c182;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Call to action</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
                Company name, street, city.<br>
                <a href="{{unsubscribe_url}}" style="color:#6b7280;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Content type

Use `content_type: "html"` when writing the body in a tool call, or `"text"` for a plain text campaign. Leave campaigns built in the dashboard editor in the editor's format and change their copy there.

## Scheduling

`send-campaign` with `scheduled_at` in ISO 8601 with a time zone offset, for example `2026-11-03T09:00:00-05:00`. Ask which time zone the user means; do not assume UTC.
