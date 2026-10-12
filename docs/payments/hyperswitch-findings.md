# What the Hyperswitch repository and docs actually say

Checked on 12 October 2026 against `juspay/hyperswitch` `main` and docs.hyperswitch.io.
Re-check before relying on any line here: connector support changes between releases.

## Licensing

| Component | Repository | Licence |
| --- | --- | --- |
| Router (core API server, Rust) | `juspay/hyperswitch` | Apache 2.0 |
| Control Center (dashboard) | `juspay/hyperswitch-control-center` | Apache 2.0 |
| Web SDK | `juspay/hyperswitch-web` | Apache 2.0 |

Apache 2.0 permits commercial use, modification and distribution under four conditions:
keep the licence and copyright notice, state the changes you made, keep attribution
notices, and accept that the patent grant ends if you sue a contributor over patents.
It grants no trademark rights, so you may run the software under your own brand but may
not present your product as "Hyperswitch" or "Juspay".

## UPI support in the open-source repository

`crates/connector_configs/toml/development.toml` declares UPI for four connectors only:

| Connector | UPI types declared |
| --- | --- |
| `razorpay` | `upi_collect` |
| `iatapay` | `upi_collect` |
| `phonepe` | `upi_collect`, `upi_intent` |
| `paytm` | `upi_collect`, `upi_intent` |

`payu` ships as a connector but declares no UPI block in that file.

The marketing page at hyperswitch.io/integrations/methods/upi-collect lists roughly 32
Indian providers including Airpay, Billdesk, Cashfree, ICICI, SBI UPI and Setu. Those
names do not appear in `crates/hyperswitch_connectors/src/connectors.rs`. Treat that page
as Juspay's commercial coverage, not as what the Apache-2.0 code can do.

## Razorpay connector, the realistic first provider

From the Razorpay connector page in the docs:

- Integration status: **sandbox**
- Payment method: UPI Collect only, INR, India
- Refunds supported, mandates not supported, automatic capture
- **Webhooks are not implemented.** Hyperswitch does not process Razorpay callbacks, so
  configuring a Razorpay webhook has no effect and payment status has to come from
  syncing with `GET /payments/{id}`

That last point is a design constraint, not a detail: the platform needs a status
reconciliation loop, and a webhook-only design would silently never settle.

## API surface

| Item | Value |
| --- | --- |
| Sandbox base URL | `https://sandbox.hyperswitch.io` |
| Production base URL | `https://api.hyperswitch.io` |
| Secret key header | `api-key: <merchant secret key>` |
| Create a payment | `POST /payments` |
| Read a payment | `GET /payments/{payment_id}` |
| Dashboard sign-up | `https://app.hyperswitch.io`, self-serve, keys under Developers then Keys |

API keys are displayed once at creation and cannot be read back.

### UPI Collect request shape

Derived from `crates/api_models/src/payments.rs`. `PaymentMethodData::Upi(UpiData)` and
`UpiData` both serialise `snake_case`, and `UpiCollectData` carries `vpa_id`:

```json
{
  "amount": 1000,
  "currency": "INR",
  "confirm": true,
  "payment_method": "upi",
  "payment_method_type": "upi_collect",
  "payment_method_data": { "upi": { "upi_collect": { "vpa_id": "someone@okbank" } } }
}
```

Amounts are in the minor unit, so 1000 is ₹10.00. This shape is read from the source and
has not yet been run against the sandbox; Milestone 4 confirms it with a real call.

## Outgoing webhooks from Hyperswitch

- Signature: HMAC-SHA512 over the raw body, hex encoded, header `X-Webhook-Signature-512`
- Key: the business profile's `payment_response_hash_key`
- Verify against the raw bytes, never against re-serialised JSON, and compare in constant time
- 33 event types exist, including `payment_succeeded`, `payment_failed`, `payment_processing`,
  `action_required`, `refund_succeeded`
- Envelope fields: `merchant_id`, `event_id`, `event_type`, `content` required;
  `timestamp` and `processor_merchant_id` optional
- `content.type` is one of `payment_details`, `refund_details`, `dispute_details`,
  `mandate_details`, `payout_details`, `subscription_details`
- Retries: 16 over about 24 hours, so handling must be idempotent on `event_id`
- Deliveries can arrive out of order; for payments compare `content.object.updated`
  against the stored value and apply only the newer state

## Why this project does not self-host the router

`docker-compose.yml` in the repo brings up Postgres, Redis, a migration runner, a
Superposition config service, the Rust router, the control center and the web SDK, with
optional Kafka, ClickHouse, OpenSearch and a Grafana stack. No resource limits are
declared, but a Rust router plus Postgres plus Redis plus a ReScript dashboard needs
several GB of RAM and a machine you control.

With a ₹0 budget and an Android phone, that is not reachable, and claiming otherwise
would waste weeks. The hosted API at `sandbox.hyperswitch.io` gives the same REST surface.
Because the provider sits behind an interface in `server/pay/`, moving to a self-hosted
router later is a base URL change, not a rewrite.

## Sources

- https://github.com/juspay/hyperswitch
- https://raw.githubusercontent.com/juspay/hyperswitch/main/crates/connector_configs/toml/development.toml
- https://raw.githubusercontent.com/juspay/hyperswitch/main/crates/api_models/src/payments.rs
- https://raw.githubusercontent.com/juspay/hyperswitch/main/docker-compose.yml
- https://docs.hyperswitch.io/integration-guide/webhooks.md
- https://docs.hyperswitch.io/integrations/connectors-integrations/payment-processor-capabilities/available-connectors/razorpay.md
- https://docs.hyperswitch.io/integration-guide/account-management/multiple-accounts-and-profiles/quick-start.md
