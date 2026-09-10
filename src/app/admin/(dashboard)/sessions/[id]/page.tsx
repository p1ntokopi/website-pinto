import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock3, Printer, Receipt, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/finance/format";
import {
  normalizeOrderStatus,
  type OrderStatus,
} from "@/lib/orders/status-machine";
import { STATUS_CONFIG } from "@/lib/orders/status-config";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionCheckoutClient } from "@/components/admin/sessions/session-checkout-client";

export const metadata: Metadata = {
  title: "Checkout Sesi Meja - Pinto Admin",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  QRIS: "QRIS",
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DiningSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("dining_sessions")
    .select(
      "id, status, started_at, completed_at, table:tables(id, table_number, capacity)"
    )
    .eq("id", id)
    .single();

  if (sessionError) {
    if (sessionError.code === "PGRST116") notFound();
    console.error("[session detail]", sessionError.code, sessionError.message);
    throw new Error("Gagal memuat sesi meja.");
  }
  if (!session) notFound();

  const [
    { data: orders, error: ordersError },
    { data: payments, error: paymentsError },
    { data: receipts, error: receiptsError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total, created_at")
      .eq("dining_session_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select(
        "id, status, amount, payment_method, payment_channel, paid_at, created_at"
      )
      .eq("dining_session_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("receipts")
      .select("id, receipt_number, issued_at")
      .eq("dining_session_id", id)
      .order("issued_at", { ascending: false })
      .limit(1),
  ]);

  if (ordersError) {
    console.error("[session orders]", ordersError.code, ordersError.message);
    throw new Error("Gagal memuat pesanan sesi meja.");
  }
  if (paymentsError) {
    console.error(
      "[session payments]",
      paymentsError.code,
      paymentsError.message
    );
    throw new Error("Gagal memuat pembayaran sesi meja.");
  }
  if (receiptsError) {
    console.error(
      "[session receipts]",
      receiptsError.code,
      receiptsError.message
    );
    throw new Error("Gagal memuat struk sesi meja.");
  }

  const table = Array.isArray(session.table)
    ? (session.table[0] ?? null)
    : session.table;
  const sessionOrders = orders ?? [];
  const billableOrders = sessionOrders.filter(
    (order) => normalizeOrderStatus(order.status as OrderStatus) !== "CANCELLED"
  );
  const total = billableOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );
  const paidPayment =
    payments?.find((payment) => payment.status === "PAID") ?? null;
  const receipt = receipts?.[0] ?? null;
  const isPaid = Boolean(paidPayment);
  const allServed =
    billableOrders.length > 0 &&
    billableOrders.every(
      (order) => normalizeOrderStatus(order.status as OrderStatus) === "SERVED"
    );
  const canComplete = session.status === "open" && isPaid && allServed;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/tables/live"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-sm text-muted-text transition-colors outline-none hover:bg-muted hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40"
          aria-label="Kembali ke meja langsung"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
            Sesi Makan di Tempat
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {table ? `Meja ${table.table_number}` : "Sesi Meja"}
          </h1>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "border font-semibold",
            session.status === "open"
              ? "border-warning/25 bg-warning/10 text-warning"
              : "border-success/25 bg-success/10 text-success"
          )}
        >
          {session.status === "open" ? "Aktif" : "Selesai"}
        </Badge>
        {receipt && (
          <Button
            variant="outline"
            render={<Link href={`/admin/receipts/${receipt.id}`} />}
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="grid gap-3 border border-border-custom/70 bg-card p-4 sm:grid-cols-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Mulai
              </span>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock3 className="h-4 w-4 text-muted-text" />
                {formatTime(session.started_at)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Kapasitas
              </span>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
                <Utensils className="h-4 w-4 text-muted-text" />
                {table?.capacity ?? "—"} orang
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Total Sesi
              </span>
              <p className="mt-1 text-lg font-bold text-ink">
                {formatIDR(total)}
              </p>
            </div>
          </section>

          <section className="overflow-hidden border border-border-custom/70 bg-card">
            <div className="flex items-center justify-between border-b border-border-custom/60 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Receipt className="h-4 w-4 text-muted-text" />
                Pesanan dalam Sesi
              </h2>
              <span className="text-xs font-medium text-muted-text">
                {sessionOrders.length} pesanan
              </span>
            </div>

            {sessionOrders.length > 0 ? (
              <ul className="divide-y divide-border-custom/60">
                {sessionOrders.map((order) => {
                  const status = normalizeOrderStatus(
                    order.status as OrderStatus
                  );
                  const config = STATUS_CONFIG[status];
                  const StatusIcon = config.icon;
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between gap-3 p-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {order.order_number}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-text">
                            {formatTime(order.created_at)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-semibold text-ink">
                            {formatIDR(Number(order.total))}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("border font-semibold", config.color)}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-text">
                Belum ada pesanan dalam sesi ini.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="space-y-3 border border-border-custom/70 bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">
                Status Pembayaran
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "border font-semibold",
                  isPaid
                    ? "border-success/25 bg-success/10 text-success"
                    : "border-warning/25 bg-warning/10 text-warning"
                )}
              >
                {isPaid ? "Lunas" : "Belum Bayar"}
              </Badge>
            </div>
            {paidPayment && (
              <div className="space-y-1 text-xs text-muted-text">
                <p>
                  {PAYMENT_LABELS[
                    paidPayment.payment_channel ??
                      paidPayment.payment_method ??
                      ""
                  ] ??
                    paidPayment.payment_channel ??
                    paidPayment.payment_method ??
                    "Manual"}
                  {" · "}
                  {formatIDR(Number(paidPayment.amount))}
                </p>
                {paidPayment.paid_at && (
                  <p>{formatTime(paidPayment.paid_at)}</p>
                )}
                {receipt && <p>Struk {receipt.receipt_number}</p>}
              </div>
            )}
          </section>

          {session.status === "open" ? (
            <SessionCheckoutClient
              sessionId={session.id}
              amount={total}
              isPaid={isPaid}
              canComplete={canComplete}
              receiptPath={receipt ? `/admin/receipts/${receipt.id}` : null}
            />
          ) : (
            <section className="space-y-2 border border-success/30 bg-success/5 p-4">
              <p className="text-sm font-semibold text-success">
                Sesi sudah diselesaikan
              </p>
              <p className="text-xs text-muted-text">
                {session.completed_at
                  ? `Ditutup ${formatTime(session.completed_at)}.`
                  : "Meja sudah ditutup."}
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
