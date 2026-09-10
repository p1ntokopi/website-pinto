# P1NTO

P1NTO is a Next.js and Supabase application for customer table ordering, kitchen operations, cashier settlement, immutable receipts, and owner reporting. The approved target is a **manual cashier workflow**: customers may add multiple orders to one open table session, staff prepare and serve them, then an authorized cashier settles the bill with **CASH** or **manual QRIS**.

> Implementation and cutover status: the repository contains legacy behavior plus work toward this target. Treat the workflow below as the approved contract, not evidence that production migrations were applied or that end-to-end tests passed.

## Architecture

- **Next.js App Router** provides customer routes under `/t/[slug]`, authenticated admin/cashier pages, the kitchen display, receipt views, and server actions.
- **Supabase Auth + Postgres** provide identities, role profiles, transactional data, Row Level Security (RLS), and narrow `SECURITY DEFINER` RPCs for privileged writes.
- **Dining session** is the bill boundary. A partial unique index permits at most one `open` session per table; multiple orders can belong to that session.
- **Order and payment are separate state machines.** Customer-facing order progress is `NEW → PREPARING → READY → SERVED` (internal compatibility states may still exist). Payment confirmation does not imply preparation, service, receipt printing, or session closure.
- **Receipt issuance is separate from printing.** A paid order/session produces an immutable receipt snapshot; each print request is an attempt against that snapshot and must never recreate a payment.
- **Realtime is operational assistance, not authorization.** Staff streams are authenticated and scoped; anonymous customers use token-scoped, bounded summary polling rather than broad table subscriptions.

## Approved operating workflow

1. A customer scans an active table QR. The server starts or resumes that table's single open dining session and stores an opaque session token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production).
2. Every customer submission uses a client request UUID. The server validates the table/session, recalculates prices from available catalog rows, snapshots item names/prices/options, and returns the existing result on retry. The first operational customer state is `NEW`.
3. Additional orders attach to the same open session. They do not create a second bill or implicitly close the first order.
4. Staff advances each order through `NEW → PREPARING → READY → SERVED`. Legacy `PENDING`, `CONFIRMED`, and `COMPLETED` records remain readable during compatibility cutover; do not rewrite history merely to normalize labels.
5. At checkout, an authorized cashier selects exactly one settlement method: `CASH` or manual `QRIS`. The server locks the target, recomputes the unpaid amount, validates the expected state/amount, records one idempotent `PAID` payment with cashier attribution, and creates one immutable receipt snapshot.
6. Receipt display/printing is a separate action. A failed, canceled, or repeated print must not alter payment status or duplicate the receipt.
7. The table session is closed only by an explicit, idempotent cashier action after all non-canceled orders are served and the session is fully paid. Payment, receipt issuance, printing, and closure are four distinct events.

## Roles, RLS, and trust boundaries

| Role               | Intended access                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous customer | Read active catalog/table metadata; start/resume a session and create/read orders only through token-scoped RPCs. No direct order, payment, receipt, or session writes. |
| `kitchen`          | Read the bounded active queue and advance preparation states only. No payment or closure authority.                                                                     |
| `staff`            | Read operational data and perform allowed service transitions. No manual settlement unless explicitly promoted to cashier authority.                                    |
| `admin` / `owner`  | Cashier authority for manual payment, receipt issuance, explicit closure, and operational administration. Owner additionally has finance-only access.                   |

RLS is defense in depth, not the business-rule engine. Revoke direct mutations on sensitive tables and expose atomic, role-checked RPCs with a fixed `search_path`. Never ship or reference `SUPABASE_SERVICE_ROLE_KEY` in browser code. Server actions must still authenticate, validate role, validate expected state, and derive prices/totals server-side.

## Idempotency and concurrency

- Customer order creation: one unique `client_request_id` per logical cart submission; retry returns the original order.
- Cashier order creation, manual payment, receipt issuance, and session closure: require distinct idempotency keys with uniqueness enforced in Postgres.
- Status transitions: include the expected current state and execute under a row lock or compare-and-swap condition. Stale clients receive a conflict and refresh.
- Manual payment: enforce at most one paid record per target and exactly one target (`order_id` XOR `dining_session_id`). Never trust a client-supplied amount.
- Order numbers and receipt numbers must use collision-safe database allocation, not `count + 1` or random retry as the source of truth.

## Polling and stream limits

Customer status polling should request only the current token's table session and a bounded order summary (identifiers, statuses, and aggregate payment state), currently at a 10-second cadence while the page is visible. Stop on terminal state/unmount; back off on errors; never expose a public `orders` or `payments` stream.

Authenticated dashboard/KDS streams must filter to operational events and reconcile from a bounded server query after reconnect. Initial lists and recovery queries need explicit status filters, deterministic ordering, pagination/limits, and a retention cap for client-side seen IDs. Unbounded wildcard streams or full-history fetches are not an acceptable recovery strategy.

## Payment gateway retirement

Xendit is retired for new transactions. New customer and cashier flows must not create Xendit sessions, read Xendit credentials, or accept callbacks; the retired webhook should fail closed. **Historical Xendit payment rows and provider fields remain accounting records and must not be deleted, rewritten as manual payments, or hidden from historical receipts/reports.** Retirement is a forward behavior change, not historical data erasure.

## Migration and release procedure

This is a **forward-only cutover**. Do not run a down migration that removes enum labels, columns, constraints, or historical provider data.

1. Back up production and record the migration/version baseline. Use a production-like staging database first.
2. Run read-only preflight queries: enum labels; duplicate order numbers and request/idempotency keys; orphan payments; multiple paid rows per target; multiple open sessions per table; open-session totals/statuses; invalid manual-payment shapes; and counts of historical Xendit rows. Any result violating a planned constraint blocks deployment.
3. Apply migrations strictly in filename order. Keep enum additions in a committed transaction before any migration that uses the new labels. Add/backfill nullable data, validate constraints, then tighten nullability/privileges.
4. Regenerate database types and deploy server/RPC compatibility before switching UI traffic. Keep readers tolerant of legacy states and providers.
5. Smoke-test role denials, customer retry, cashier payment retry, receipt reprint, status conflicts, explicit session closure, bounded polling, and historical Xendit rendering.
6. Observe errors, duplicate-key conflicts, open-session counts, queue age, payment/receipt/closure counts, and retired webhook traffic before declaring cutover complete.

Do not infer production state from migration files in this repository. The documentation does **not** claim that a production migration has been applied.

### Rollback and roll-forward

Before traffic switches, rollback means stop the deployment and restore the tested backup if needed. After writes use the new schema, prefer roll-forward: disable affected UI paths, deploy a compensating migration/code fix, and retain all new and historical rows. Restoring a database snapshot after accepting live writes can lose orders/payments and requires an explicit incident decision and reconciliation plan. Never roll back by deleting paid rows, receipt snapshots, audit records, or Xendit history.

## Local setup

Requirements: a supported Node.js runtime, npm, and a Supabase project or local Supabase stack.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Available checks are:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

These are commands to run, not a statement that they currently pass. The manual release checklist is in [`docs/m5-manual-testing.md`](docs/m5-manual-testing.md); printer constraints are in [`docs/printer-compatibility.md`](docs/printer-compatibility.md).

## Environment variable names

No committed environment template exists: `.gitignore` currently ignores `.env*`, including `.env.example`. To avoid changing ignore/config scope, this documentation lists names only and does not create a template or include values.

Required by current application paths:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `NEXT_PUBLIC_R2_PUBLIC_URL`

Legacy Xendit variable names may remain in deployment history, but the retired runtime must not depend on them for new traffic. Keep all secrets server-only, use separate staging/production values, rotate exposed credentials, and never commit `.env` contents.

## Security release constraints

- HTTPS is mandatory in production; do not log session tokens, payment credentials, raw sensitive payloads, or customer personal data.
- Apply least privilege to Auth roles, RLS, grants, RPC execution, storage credentials, and owner finance pages.
- Rate-limit public session/order RPCs per table token and abuse source; cap item counts, quantities, note lengths, payload size, polling frequency, and result size.
- Treat QR/table slugs as locators, not authorization. The opaque session token and server validation bind access to one open session.
- Record actor, target, expected/actual state, method, and idempotency key metadata for privileged mutations without storing secrets.
- Test anonymous cross-table reads, inactive users, role escalation, stale status changes, duplicate payment, replayed closure, and malformed receipt targets before release.
