# Verifying Emailit webhook signatures

Algorithm: `hex(HMAC_SHA256(key = webhook secret, message = timestamp + "." + raw_body))`, compared with the `X-Emailit-Signature` header. The key is the whole secret, including the `whsec_` prefix. Reject if `X-Emailit-Timestamp` is more than 300 seconds away from now.

The body is always a JSON array of events, even when it holds one event. Each event's resource is at `data.object`.

## SDK helpers

The official SDKs include `WebhookSignature.verify`, which raises an error on a bad signature or an old timestamp. Its return value is a single parsed event, but the body is an array, so use the helper only for the check. Then parse the raw body yourself and loop over every event:

```js
import { WebhookSignature } from '@emailit/node';
WebhookSignature.verify(rawBody, signature, timestamp, process.env.EMAILIT_WEBHOOK_SECRET);
for (const event of JSON.parse(rawBody)) {
  // handle event.type and event.data.object, deduplicating on event.event_id
}
```

```python
from emailit import WebhookSignature
WebhookSignature.verify(raw_body, signature, timestamp, os.environ["EMAILIT_WEBHOOK_SECRET"])
for event in json.loads(raw_body):
    ...  # handle event["type"] and event["data"]["object"]
```

```php
use Emailit\WebhookSignature;
WebhookSignature::verify($rawBody, $signature, $timestamp, getenv('EMAILIT_WEBHOOK_SECRET'));
foreach (json_decode($rawBody, true) as $event) {
    // handle $event['type'] and $event['data']['object']
}
```

```ruby
Emailit::WebhookSignature.verify(raw_body, signature, timestamp, ENV["EMAILIT_WEBHOOK_SECRET"])
JSON.parse(raw_body).each do |event|
  # handle event["type"] and event["data"]["object"]
end
```

A fifth tolerance argument (seconds) changes the replay window. If a helper raises an error on a correctly signed array body, use the manual check below instead.

## Node.js (Express), no SDK

```js
import crypto from 'node:crypto';
import express from 'express';

const app = express();

app.post('/webhooks/emailit', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.get('X-Emailit-Signature') || '';
  const timestamp = req.get('X-Emailit-Timestamp') || '';
  const rawBody = req.body.toString('utf8');

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return res.sendStatus(401);

  const expected = crypto
    .createHmac('sha256', process.env.EMAILIT_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  const valid = signature.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return res.sendStatus(401);

  for (const event of JSON.parse(rawBody)) {
    queue.add('emailit-event', event, { jobId: event.event_id });
  }
  res.sendStatus(200);
});
```

## Next.js route handler

```ts
import crypto from 'node:crypto';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-emailit-signature') ?? '';
  const timestamp = request.headers.get('x-emailit-timestamp') ?? '';

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return new Response(null, { status: 401 });

  const expected = crypto.createHmac('sha256', process.env.EMAILIT_WEBHOOK_SECRET!).update(`${timestamp}.${rawBody}`).digest('hex');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new Response(null, { status: 401 });
  }

  const events = JSON.parse(rawBody) as Array<{ event_id: string; type: string; data: { object: Record<string, unknown> } }>;
  // enqueue events, deduplicating on event_id
  return new Response(null, { status: 200 });
}
```

## Python (Flask)

```python
import hashlib, hmac, json, os, time
from flask import Flask, request, abort

app = Flask(__name__)

@app.post("/webhooks/emailit")
def emailit_webhook():
    raw_body = request.get_data(as_text=True)
    signature = request.headers.get("X-Emailit-Signature", "")
    timestamp = request.headers.get("X-Emailit-Timestamp", "0")

    if abs(time.time() - int(timestamp)) > 300:
        abort(401)
    expected = hmac.new(
        os.environ["EMAILIT_WEBHOOK_SECRET"].encode(),
        f"{timestamp}.{raw_body}".encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        abort(401)

    for event in json.loads(raw_body):
        handle_event.delay(event)  # deduplicate on event["event_id"]
    return "", 200
```

## PHP

```php
$rawBody = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_EMAILIT_SIGNATURE'] ?? '';
$timestamp = $_SERVER['HTTP_X_EMAILIT_TIMESTAMP'] ?? '0';

if (abs(time() - (int) $timestamp) > 300) { http_response_code(401); exit; }

$expected = hash_hmac('sha256', $timestamp . '.' . $rawBody, getenv('EMAILIT_WEBHOOK_SECRET'));
if (!hash_equals($expected, $signature)) { http_response_code(401); exit; }

foreach (json_decode($rawBody, true) as $event) {
    // dispatch a job, deduplicating on $event['event_id']
}
http_response_code(200);
```

In Laravel, exclude the route from CSRF protection and read the body with `$request->getContent()`.

## Go

```go
func emailitWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "bad body", http.StatusBadRequest)
		return
	}
	ts := r.Header.Get("X-Emailit-Timestamp")
	sig := r.Header.Get("X-Emailit-Signature")

	sec, _ := strconv.ParseInt(ts, 10, 64)
	if d := time.Now().Unix() - sec; d > 300 || d < -300 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	mac := hmac.New(sha256.New, []byte(os.Getenv("EMAILIT_WEBHOOK_SECRET")))
	mac.Write([]byte(ts + "." + string(body)))
	if !hmac.Equal([]byte(hex.EncodeToString(mac.Sum(nil))), []byte(sig)) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var events []map[string]any
	_ = json.Unmarshal(body, &events)
	// enqueue events, deduplicating on event_id
	w.WriteHeader(http.StatusOK)
}
```
