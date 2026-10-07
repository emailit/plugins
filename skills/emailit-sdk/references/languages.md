# Emailit SDK examples by language

Every example reads the key from `EMAILIT_API_KEY` and the sender from `EMAIL_FROM`. Replace recipients and content.

## Node.js

```bash
npm install @emailit/node
```

```js
import { Emailit } from '@emailit/node';

const emailit = new Emailit(process.env.EMAILIT_API_KEY);

const email = await emailit.emails.send({
  from: process.env.EMAIL_FROM,
  to: ['user@example.com'],
  subject: 'Your receipt',
  html: '<p>Thanks for your order.</p>',
});
```

Nodemailer over SMTP:

```js
import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: 'smtp.emailit.com',
  port: 587,
  secure: false,
  auth: { user: 'emailit', pass: process.env.EMAILIT_API_KEY },
});
```

## Python

```bash
pip install emailit
```

```python
import os
from emailit import EmailitClient

client = EmailitClient(os.environ["EMAILIT_API_KEY"])

email = client.emails.send({
    "from": os.environ["EMAIL_FROM"],
    "to": ["user@example.com"],
    "subject": "Your receipt",
    "html": "<p>Thanks for your order.</p>",
})
print(email.id)
```

Django over SMTP (`settings.py`):

```python
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.emailit.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "emailit"
EMAIL_HOST_PASSWORD = os.environ["EMAILIT_API_KEY"]
DEFAULT_FROM_EMAIL = os.environ["EMAIL_FROM"]
```

## PHP

```bash
composer require emailit/emailit-php
```

```php
$emailit = Emailit::client(getenv('EMAILIT_API_KEY'));

$email = $emailit->emails()->send([
    'from'    => getenv('EMAIL_FROM'),
    'to'      => ['user@example.com'],
    'subject' => 'Your receipt',
    'html'    => '<p>Thanks for your order.</p>',
]);
echo $email->id;
```

## Laravel

```bash
composer require emailit/emailit-laravel
```

`.env`:

```env
EMAILIT_API_KEY=secret_xxx
MAIL_MAILER=emailit
MAIL_FROM_ADDRESS=hello@mail.example.com
```

`config/mail.php`, inside `mailers`:

```php
'emailit' => [
    'transport' => 'emailit',
],
```

Then every Mailable and notification sends through Emailit: `Mail::to($user)->send(new WelcomeEmail($user));`. For API features such as templates or scheduling, use the facade:

```php
use Emailit\Laravel\Facades\Emailit;

Emailit::emails()->send([
    'from' => config('mail.from.address'),
    'to' => [$user->email],
    'template' => 'welcome',
    'variables' => ['first_name' => $user->first_name],
]);
```

## Go

```bash
go get github.com/emailit/emailit-go/v2
```

```go
client := emailit.NewClient(os.Getenv("EMAILIT_API_KEY"))

email, err := client.Emails.Send(&emailit.SendEmailRequest{
	From:    os.Getenv("EMAIL_FROM"),
	To:      []string{"user@example.com"},
	Subject: "Your receipt",
	Html:    "<p>Thanks for your order.</p>",
})
if err != nil {
	if emailit.IsRateLimitError(err) {
		// back off and retry
	}
	return err
}
fmt.Println(email.Id)
```

## Ruby

```bash
gem install emailit
```

```ruby
client = Emailit::EmailitClient.new(ENV.fetch("EMAILIT_API_KEY"))

email = client.emails.send(
  from: ENV.fetch("EMAIL_FROM"),
  to: ["user@example.com"],
  subject: "Your receipt",
  html: "<p>Thanks for your order.</p>"
)
puts email.id
```

Rails Action Mailer over SMTP (`config/environments/production.rb`):

```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
  address: "smtp.emailit.com",
  port: 587,
  user_name: "emailit",
  password: ENV.fetch("EMAILIT_API_KEY"),
  authentication: :plain,
  enable_starttls_auto: true
}
```

## Java

Maven `com.emailit:emailit-java` or Gradle `implementation 'com.emailit:emailit-java:+'` (pin a version in production).

```java
EmailitClient emailit = new EmailitClient(System.getenv("EMAILIT_API_KEY"));

EmailSendParams params = EmailSendParams.builder()
        .setFrom(System.getenv("EMAIL_FROM"))
        .setTo(Arrays.asList("user@example.com"))
        .setSubject("Your receipt")
        .setHtml("<p>Thanks for your order.</p>")
        .build();

EmailitObject email = emailit.emails().send(params);
```

Spring Boot over SMTP (`application.properties`):

```properties
spring.mail.host=smtp.emailit.com
spring.mail.port=587
spring.mail.username=emailit
spring.mail.password=${EMAILIT_API_KEY}
spring.mail.properties.mail.smtp.starttls.enable=true
```

## .NET

```bash
dotnet add package Emailit
```

```csharp
using Emailit;
using Emailit.Options;
using Emailit.Resources;

var emailit = new EmailitClient(Environment.GetEnvironmentVariable("EMAILIT_API_KEY"));

Email email = emailit.Emails.Send(new EmailSendOptions
{
    From = Environment.GetEnvironmentVariable("EMAIL_FROM"),
    To = new[] { "user@example.com" },
    Subject = "Your receipt",
    Html = "<p>Thanks for your order.</p>",
});
```

## Rust

```toml
[dependencies]
emailit = "2"
tokio = { version = "1", features = ["full"] }
```

```rust
use emailit::types::CreateEmailBaseOptions;
use emailit::Emailit;

#[tokio::main]
async fn main() -> emailit::Result<()> {
    let emailit = Emailit::new(&std::env::var("EMAILIT_API_KEY").expect("EMAILIT_API_KEY"));
    let email = CreateEmailBaseOptions::new(
        "hello@mail.example.com",
        ["user@example.com"],
        "Your receipt",
    )
    .with_html("<p>Thanks for your order.</p>");

    let result = emailit.emails.send(email).await?;
    println!("{}", result.id.unwrap());
    Ok(())
}
```

## SMTP for anything else

| Setting | Value |
| --- | --- |
| Host | `smtp.emailit.com` |
| Port | `587` (STARTTLS) |
| Username | `emailit` |
| Password | The API key |

SMTP is the right choice for software with a built in mail setting (WordPress plugins, Ghost, Supabase Auth, Keycloak). Use the API for templates, scheduling, `meta`, and idempotency.
