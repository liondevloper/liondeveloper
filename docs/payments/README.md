# Branded UPI payment platform

A merchant-facing payments platform at `/pay`, built on the website's existing Express and
Postgres stack, using Hyperswitch's hosted API as the payment provider behind an interface.

- [What the Hyperswitch repo and docs actually say](./hyperswitch-findings.md)
- [Indian regulation, security and merchant onboarding](./compliance-and-security.md)

## The three modes

Every order records the mode it was created in and the three never mix.

| Mode | What happens | Money |
| --- | --- | --- |
| `mock` | Nothing leaves this server. Status changes come from an explicit operator action and are labelled mock everywhere. | None |
| `hyperswitch_sandbox` | Real HTTPS calls to `sandbox.hyperswitch.io` with test keys and a test connector. | None |
| `hyperswitch_live` | Real calls to `api.hyperswitch.io`. | Real |

Live mode requires three separate things: a live API key in the environment,
`PAY_LIVE_MODE_ENABLED=true`, and `live_access` on the individual merchant row. Missing any
one leaves the mode switched off and the dashboard says which one is missing.

## Milestones

| # | Milestone | State |
| --- | --- | --- |
| 1 | Merchant accounts: schema, registration, login, mode config endpoint | done, 14 tests pass |
| 2 | API keys: prefixed, hashed at rest, shown once, revocable | not started |
| 3 | Payment orders, mock provider, hosted checkout page | not started |
| 4 | Hyperswitch sandbox provider: UPI Collect create and status sync | not started |
| 5 | Webhooks in (HMAC-SHA512 verified) and out (signed, retried) | not started |
| 6 | Responsive transaction history, filters, order detail, event timeline | not started |
| 7 | Live mode gate, onboarding checklist, hardening | not started |

A milestone is marked done only after its tests pass.

## Running the tests

```
npm run test:pay
```

Boots the real Express app on an ephemeral port and drives the API over HTTP. It creates
one merchant with a reserved `@lion.invalid` email and deletes it afterwards, because this
database is shared with the published site.

## Layout

```
server/pay/
  config.js     modes, credential lookup, merchant session key derivation
  schema.js     pay_* tables, additive migrations only
  session.js    merchant JWT cookie, audience checked
  routes.js     /api/pay/*
  selftest.js   HTTP integration tests
src/pay/
  api.ts        typed client, no secrets
  PayApp.tsx    shell and session loading
  Auth.tsx      registration and sign in
  Dashboard.tsx merchant overview and mode state
  pay.css       mobile first styles
```

## Working from an Android phone

Everything happens in the browser. No local toolchain, no Termux, no laptop.

1. **Code.** This workspace. Chat here; the preview panel reloads on save.
2. **Hyperswitch dashboard.** `app.hyperswitch.io` in Chrome. Sign up, stay in test mode,
   create an API key under Developers then Keys. The key is shown once, so paste it
   somewhere safe immediately.
3. **Payment provider sandbox.** Razorpay's dashboard works on mobile. Test mode keys live
   under Settings then API Keys.
4. **Secrets.** Never paste a key into a file. Send it in chat and it is written to the
   project's environment settings, which survive a restart.
5. **Testing UPI.** Sandbox UPI Collect sends a collect request to a VPA. In a provider
   sandbox nothing reaches a real UPI app; the status is driven by the provider's test
   behaviour and read back by status sync.
6. **Going live.** Only after a provider account with completed KYC exists. The first live
   payment is ₹1, to your own VPA, refunded the same day.

## Deployment

The platform ships with the website: one Node process serving the built React app and the
API, one managed Postgres. Publishing is the Update project button.

Before any live traffic, three things must be true:

- The database is in an Indian region, for RBI data localisation
- `SESSION_SECRET` and the Hyperswitch keys are set as environment variables, never in files
- HTTPS everywhere, which the platform's hosting provides
