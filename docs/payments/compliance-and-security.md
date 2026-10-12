# Indian regulation, security and merchant onboarding

Written 12 October 2026. This is engineering guidance, not legal advice. Before going
live, have a lawyer who works on RBI-regulated payments read your actual setup.

## The rule that decides the architecture

RBI regulates anyone who collects money from a customer and passes it to a merchant.
Under the Reserve Bank of India (Regulation of Payment Aggregators) Directions, 2025:

- A non-bank payment aggregator needs RBI authorisation under the Payment and Settlement
  Systems Act, 2007
- Minimum net worth ₹15 crore at application, rising to ₹25 crore by the end of the third
  financial year after authorisation
- Only a company incorporated under the Companies Act, 2013 can apply
- Merchant funds must sit in an escrow account with a scheduled commercial bank
- Settlement to the merchant within T+1
- Aggregators are split into PA-O (online), PA-P (proximity) and PA-CB (cross-border)
- Existing non-bank aggregators had to apply by 31 December 2025

So with ₹0 of capital you cannot hold other people's money. Any design where a payment
lands in your account and you later pay the merchant is an unauthorised payment
aggregator, whatever it is called in the UI.

### What is allowed instead

**Non-custodial orchestration.** Each merchant brings their own credentials for an
RBI-authorised provider (Razorpay, PayU, Cashfree and so on). Your platform creates the
payment through that provider's API, and the money settles from the provider directly
into that merchant's own bank account. You never touch the funds. You are selling
software, not payment aggregation.

This is the model implemented here, and it is also how Hyperswitch itself works: a
connector is configured with the merchant's own processor credentials.

Two consequences to keep honest:

- Never show a wallet, a balance or a payout in the dashboard. Showing a balance is the
  interface of a custodian.
- Each merchant completes their provider's KYC with the provider. You do not become their
  KYC agent.

## UPI specifics

UPI runs on NPCI rails. Only a bank can be a PSP in UPI; a non-bank app that provides a
UPI interface to end users does so as a Third Party Application Provider, which requires
a sponsor PSP bank and NPCI approval. Collecting through an authorised aggregator's UPI
Collect or Intent flow does not make you a TPAP, because the VPA, the mandate and the
collect request all belong to the aggregator and its PSP bank.

Practical limits worth building against:

- UPI is INR only and domestic
- A UPI Collect request expires, commonly in a few minutes. The order must expire too
- Per-transaction limits are set by NPCI and the banks, not by you
- Chargebacks exist in UPI through the dispute process; plan for refunds

## Other Indian obligations that apply to the software

- **DPDP Act, 2023.** Customer email, phone and VPA are personal data. Collect the
  minimum, state the purpose, and delete on request.
- **Data localisation.** RBI's 2018 directive requires payment system data of Indian
  transactions to be stored in India. If you keep any transaction data, the database must
  be in an Indian region. Check where your managed Postgres actually lives before live
  traffic.
- **GST.** You charge GST on your software fee. The provider charges GST on theirs.
- **Receipts.** The customer's receipt comes from the merchant, and it must name the
  merchant, not you.

## Security rules enforced in this codebase

1. **No raw card data, ever.** This platform handles UPI only. No PAN, CVV or expiry is
   accepted, logged or stored anywhere. That keeps the build out of PCI-DSS scope.
2. **No secret in frontend code.** Everything under `src/` ships to the browser. Secret
   keys live only in `server/pay/` and are read from environment variables. The browser
   never sees a provider key.
3. **API keys hashed at rest.** Merchant API keys are stored as a SHA-256 hash with a
   visible prefix for identification. A database dump does not yield usable keys.
4. **Session separation.** Merchant sessions are signed with a key derived from, but not
   equal to, the website admin secret, and carry an audience claim. A merchant token
   cannot open the admin panel. There is a test for this.
5. **Webhook verification before trust.** An inbound webhook updates nothing until its
   HMAC-SHA512 signature verifies against the raw body in constant time.
6. **Status comes from the provider only.** An order reaches `succeeded` only after a
   verified provider event or a provider status sync says so. No code path lets the UI,
   the merchant, or a mock mark a real payment as paid.
7. **Mode isolation.** Mock, sandbox and live keep separate credentials and separate rows,
   and every order records the mode it was created in. Mock orders can never appear in a
   live total.

## Merchant onboarding steps

1. Merchant registers on `/pay` and lands in mock mode.
2. Merchant creates their own account with an RBI-authorised provider and finishes that
   provider's KYC: PAN, GST if registered, bank proof, business proof, website or app URL.
3. Merchant creates a Hyperswitch account and connects the provider there with their own
   credentials.
4. Merchant tests end to end in sandbox mode on this platform.
5. You review and enable `live_access` for that merchant, with their provider approval on
   file.
6. Live keys go into server environment variables, `PAY_LIVE_MODE_ENABLED` is set to
   `true`, and the first live payment is a real ₹1 to a real VPA, refunded afterwards.

## Sources

- RBI (Regulation of Payment Aggregators) Directions, 2025, and RBI's 2020 PA/PG guidelines
- RBI storage of payment system data directive, 6 April 2018
- NPCI UPI procedural guidelines on PSPs and third party application providers
- Digital Personal Data Protection Act, 2023
