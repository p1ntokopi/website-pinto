# P1NTO Manual Cashier — Release Test Checklist

Use this checklist for the approved manual cashier cutover. It is a test plan, not a record of results. Check a box only when evidence (test output, SQL result, screenshot, or receipt sample) has been captured for the exact release candidate and environment.

## 0. Gate and evidence

- [ ] Record commit/release identifier, tester, date/time, browser/device versions, Supabase project, and migration baseline.
- [ ] Confirm staging uses separate credentials/data from production and contains representative legacy Xendit records.
- [ ] Take and verify a restorable database backup before migration rehearsal or production cutover.
- [ ] Confirm no production migration is inferred from repository files; independently query the target database migration history.
- [ ] Confirm logs and screenshots redact tokens, credentials, phone numbers, and other customer data.
- [ ] Keep migration SQL output, automated-check output, browser console/network evidence, role-denial evidence, and printer samples with the release record.

## 1. Read-only migration preflight

Run the preflight against the target database before any write. Stop if the schema differs from assumptions or any row would violate a new constraint.

- [ ] Enumerate `order_status`, `fulfillment_type`, `payment_status`, and `user_role`; verify legacy values and ordering are understood.
- [ ] Verify no duplicate `orders.order_number` and no duplicate non-null customer/cashier request keys.
- [ ] Verify there is at most one `open` dining session per table.
- [ ] Find orphan/missing payment targets and prove every proposed payment has exactly one target (order XOR dining session).
- [ ] Find multiple `PAID` rows for the same order/session.
- [ ] Validate every existing manual payment shape; do not relabel legacy Xendit rows to satisfy a manual-payment constraint.
- [ ] Inventory historical Xendit payments, sessions, provider identifiers, and receipts before cutover; save counts for post-cutover comparison.
- [ ] Inspect the most recent open sessions and reconcile non-canceled order totals, terminal states, and payment state.
- [ ] Verify expected RLS policies, grants, RPC signatures, indexes, and migration versions in staging rather than assuming local files match remote state.

## 2. Forward-only migration rehearsal

- [ ] Apply migrations in filename order on a production-like copy. Enum labels land in an earlier committed migration than functions/data that use them.
- [ ] Confirm additive/backfill/validation steps complete without deleting or rewriting order, payment, webhook, receipt, or audit history.
- [ ] Confirm the one-open-session-per-table index and new idempotency/one-paid-target indexes build successfully.
- [ ] Confirm constraints reject zero-target and two-target payments, malformed manual payments, duplicate paid targets, and duplicate idempotency keys.
- [ ] Confirm direct mutation grants are revoked from `anon`/`authenticated` for protected operational tables and approved RPCs still execute for allowed roles.
- [ ] Regenerate database types and verify the application is compatible with both legacy states/providers and the new `NEW`/`SERVED` states.
- [ ] Re-run preflight/count queries and reconcile all historical Xendit counts exactly.

## 3. Role and RLS matrix

Test with separate accounts/tokens; hiding a button is not authorization evidence.

### Anonymous customer

- [ ] Can read only active public catalog/table metadata.
- [ ] Cannot directly select another session's orders/payments/receipts or insert/update/delete protected rows.
- [ ] A missing, malformed, expired/closed, or cross-table session token is rejected by scoped RPCs.
- [ ] Table slug alone is insufficient to read a session bill.

### Kitchen

- [ ] Can read only the bounded operational queue and required item details.
- [ ] Can perform only approved preparation transitions (for example `PREPARING → READY`); cannot accept payment, issue a receipt, close a session, manage finance, or edit prices.

### Staff

- [ ] Can read operational rows and perform only allowed customer-service transitions.
- [ ] Cannot call cashier-only payment/receipt/closure RPCs unless the approved role model explicitly grants cashier authority.

### Admin / owner cashier

- [ ] An active `admin`/`owner` can create cashier orders, settle CASH/manual QRIS, issue/reprint receipts, and explicitly close an eligible session.
- [ ] An inactive user and unauthenticated request are denied even with a syntactically valid RPC payload.
- [ ] Owner-only finance data remains denied to admin/staff/kitchen/anonymous users.

## 4. Customer table session and ordering

- [ ] First scan of an active table starts an open session and sets an opaque `HttpOnly`, `SameSite=Lax` cookie (`Secure` under HTTPS).
- [ ] A concurrent/repeated scan resumes the same open session; no second open session is created.
- [ ] Different tables receive different sessions/tokens and cannot read one another.
- [ ] Inactive/unknown tables are rejected without leaking internal database details.
- [ ] Submit a cart and verify server-side catalog lookup, availability checks, price calculation, snapshots, quantity limits, and note limits. A tampered client price is ignored.
- [ ] Double-tap and network-retry the same request UUID; exactly one order exists and both responses identify it.
- [ ] Change the cart and submit with a new request UUID; a second order is added to the same session/bill.
- [ ] Verify a new customer order displays as `NEW` and can progress `NEW → PREPARING → READY → SERVED`.
- [ ] Attempt a stale or invalid transition from two staff clients; one wins atomically and the other receives a conflict, refreshes, and does not add false history.
- [ ] Cancel where permitted with a mandatory reason; verify audit/history attribution. Confirm canceled orders are excluded from the bill.

## 5. Scoped polling, streams, and limits

- [ ] Customer status uses only a token-scoped session-summary endpoint/RPC; network inspection shows no anonymous broad `orders`, `payments`, or Realtime subscription.
- [ ] Summary payload contains only bounded identifiers/status/aggregate payment data, not other sessions, raw payment payloads, cashier metadata, or secrets.
- [ ] Poll cadence is bounded (target: 10 seconds), pauses when hidden if implemented, stops at terminal state/unmount, and backs off rather than hot-looping on failure.
- [ ] Admin/KDS streams require authenticated roles and process only operational events. Initial and reconnect reconciliation queries have status filters, deterministic ordering, and explicit limits/pagination.
- [ ] Disconnect/reconnect the network: missed orders reconcile once, no duplicates appear, and client seen-ID memory remains capped.
- [ ] Large historical datasets do not load into the active queue or live table page without bounds.

## 6. Order operations

- [ ] `NEW` appears once in the cashier/KDS queue with correct table, snapshots, options, notes, total, and age.
- [ ] Approved actor advances to `PREPARING`, then kitchen advances to `READY`, then service staff advances to `SERVED`.
- [ ] Payment state remains independent while order states change; marking an item ready/served does not create payment or close the table.
- [ ] Legacy `PENDING`, `CONFIRMED`, and `COMPLETED` records still render and remain actionable only through approved compatibility transitions.
- [ ] History/audit rows include actor, old/new state, source, reason where required, and timestamp; direct table writes are denied.

## 7. CASH and manual QRIS settlement

Run the full matrix for a single pickup order and a multi-order table session.

- [ ] CASH confirmation records provider `MANUAL`, method `CASH`, exact server-computed amount, `PAID`, paid timestamp, cashier identity, and a unique idempotency key.
- [ ] Manual QRIS confirmation records provider `MANUAL`, method `QRIS`, cashier attribution, and optional non-secret reference metadata. It does not call an online gateway or imply automated QRIS verification.
- [ ] Client amount tampering, underpayment/overpayment, canceled-only targets, already-paid targets, ineligible state, and cross-session target are rejected.
- [ ] Retry the same payment idempotency key after timeout; it returns the original result and leaves one paid row.
- [ ] Race two different keys against the same target; database uniqueness/locking permits at most one paid row and returns a safe conflict for the loser.
- [ ] Customer tracking changes to paid only after cashier confirmation; order preparation/service status is unchanged by payment.

## 8. Receipt and explicit closure separation

- [ ] Successful payment issues exactly one immutable receipt snapshot tied to exactly one order or session and to the payment/cashier.
- [ ] Snapshot totals/items reflect the transaction-time data; later product/catalog edits do not alter it.
- [ ] Re-open and print the existing receipt without creating another payment, receipt, or session completion.
- [ ] Log print attempts as requested/succeeded/failed. Simulate cancel, printer-off, write failure, and retry; financial rows remain unchanged.
- [ ] Payment alone leaves the table session open. Receipt issuance or successful printing also leaves it open.
- [ ] Closure is blocked while a non-canceled order is not served or while the session is not fully paid.
- [ ] Explicit cashier closure stores completion actor/time, total/receipt snapshot, closes the session, and frees the table.
- [ ] Retry the closure idempotency key; it returns the same completion. Race a second key; no second close/payment/receipt is created.
- [ ] After closure, the old customer token cannot append/read an open bill; a new scan creates a distinct session.

## 9. Xendit retirement and history

- [ ] Customer/cashier UI offers no Xendit checkout and creates no new Xendit payment session.
- [ ] Calling the retired provider fails before credential access or outbound network traffic.
- [ ] The retired webhook returns a fail-closed response and does not validate, persist, or apply callback payloads.
- [ ] Historical Xendit rows, provider transaction IDs, statuses, raw records (subject to access policy), receipts, and reports remain unchanged and readable by authorized roles.
- [ ] Legacy paid Xendit orders are not charged again by the manual cashier path.
- [ ] Monitoring distinguishes expected retired-callback traffic from new application errors.

## 10. Receipt layout and printer

- [ ] Browser print works for 58 mm and 80 mm; totals, CASH/QRIS method, table/session/order references, and paid state are legible.
- [ ] Print cancellation/failure has a visible retry path and never changes payment or closure state.
- [ ] Test printer configuration is isolated per cashier device and unsupported browsers fall back to browser print.
- [ ] Follow [`printer-compatibility.md`](printer-compatibility.md). Do **not** mark PRJ-58D direct printing compatible until physical evidence is attached.

## 11. Automated checks

Capture actual output; this document does not claim any command passes.

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] Unit tests cover state transitions/roles, customer and cashier idempotency, amount recomputation, one-open-session/one-paid-target races, receipt immutability/reprint, closure prerequisites/retry, and Xendit fail-closed behavior.
- [ ] Integration tests execute RPCs under anonymous, kitchen, staff, admin, owner, inactive, and unauthenticated identities and verify RLS/grant denials.
- [ ] Browser tests cover scan → two orders → lifecycle → CASH and manual QRIS → receipt retry → explicit closure, including reconnect and duplicate submissions.

## 12. Cutover, observation, and recovery

- [ ] During cutover, pause/limit affected writes if needed, apply migrations, deploy compatible server code before UI enablement, then execute the smoke subset above.
- [ ] Observe duplicate-key/conflict rates, RPC authorization failures, queue age, open sessions, payment/receipt/closure count reconciliation, polling/stream volume, and retired webhook calls.
- [ ] Roll back before new writes only by stopping the release and restoring the verified backup where appropriate.
- [ ] After accepting new-format writes, disable affected UI paths and roll forward with compensating code/migration. Do not remove enum labels/columns or delete payments, receipts, audit rows, or Xendit history.
- [ ] If snapshot restoration is considered after live writes, document the data-loss window and complete an explicit order/payment reconciliation before proceeding.
