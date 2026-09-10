"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import {
  OrderStatus,
  normalizeOrderStatus,
  type CanonicalOrderStatus,
} from "@/lib/orders/status-machine";
import { STATUS_CONFIG } from "@/lib/orders/status-config";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowRight, ShoppingBag, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PaymentInfo = {
  status: string | null;
  amount: number | null;
  payment_method: string | null;
  payment_channel: string | null;
};

type SessionPaymentInfo = PaymentInfo & {
  id: string;
  dining_session_id: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  order_type: string;
  fulfillment_type: string;
  subtotal: number;
  total: number;
  status: OrderStatus;
  customer_name: string | null;
  dining_session_id: string | null;
  created_at: string;
  table: { id: string; table_number: string } | null;
  payment: PaymentInfo | null;
  itemCount: number;
};

const ALL_STATUSES: CanonicalOrderStatus[] = [
  "NEW",
  "PREPARING",
  "READY",
  "SERVED",
  "CANCELLED",
];

const SELECT_QUERY =
  "id, order_number, order_type, fulfillment_type, subtotal, total, status, customer_name, dining_session_id, created_at, table:tables(id, table_number), payments:payments(order_id, status, amount, payment_method, payment_channel), items:order_items(id)";

const NEW_ORDER_WINDOW_MS = 90 * 1000;

function normalizeRow(
  raw: Record<string, unknown>,
  sessionPaymentBySession?: Map<string, SessionPaymentInfo>,
): OrderRow {
  const payments = Array.isArray(raw.payments)
    ? (raw.payments as PaymentInfo[])
    : [];
  const latestPayment = payments[0] ?? null;
  const diningSessionId =
    typeof raw.dining_session_id === "string" ? raw.dining_session_id : null;
  const sessionPayment = diningSessionId
    ? (sessionPaymentBySession?.get(diningSessionId) ?? null)
    : null;
  // Session-level payment is the dine-in bill of record and wins over a
  // stale or partial direct-order payment.
  const displayPayment = sessionPayment ?? latestPayment;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const table = raw.table;
  return {
    ...(raw as unknown as Omit<OrderRow, "table" | "payment" | "itemCount">),
    dining_session_id: diningSessionId,
    table: Array.isArray(table)
      ? ((table[0] as OrderRow["table"]) ?? null)
      : (table as OrderRow["table"]),
    payment: displayPayment
      ? {
          status: displayPayment.status,
          amount: displayPayment.amount,
          payment_method: displayPayment.payment_method,
          payment_channel: displayPayment.payment_channel,
        }
      : null,
    itemCount: items.length,
  };
}

function isNewArrival(order: OrderRow): boolean {
  if (normalizeOrderStatus(order.status) !== "NEW") return false;
  return (
    Date.now() - new Date(order.created_at).getTime() < NEW_ORDER_WINDOW_MS
  );
}

function sessionPaymentPreferred(
  candidate: SessionPaymentInfo,
  current: SessionPaymentInfo,
): boolean {
  if (candidate.status === "PAID" && current.status !== "PAID") return true;
  if (candidate.status !== "PAID" && current.status === "PAID") return false;
  const candidateTime = new Date(candidate.paid_at ?? candidate.created_at ?? 0).getTime();
  const currentTime = new Date(current.paid_at ?? current.created_at ?? 0).getTime();
  return (
    candidateTime > currentTime ||
    (candidateTime === currentTime && candidate.id > current.id)
  );
}

function paymentStatusOf(order: OrderRow): { label: string; cls: string } {
  switch (order.payment?.status) {
    case "PAID":
      return {
        label: "Lunas",
        cls: "bg-success/10 text-success border-success/25",
      };
    case "PENDING":
      return {
        label: "Belum Bayar",
        cls: "bg-warning/10 text-warning border-warning/25",
      };
    case "EXPIRED":
      return {
        label: "Kedaluwarsa",
        cls: "bg-muted text-muted-text border-border",
      };
    case "CANCELED":
      return {
        label: "Dibatalkan",
        cls: "bg-muted text-muted-text border-border",
      };
    case "FAILED":
      return {
        label: "Gagal",
        cls: "bg-destructive/10 text-destructive border-destructive/25",
      };
    case "REFUNDED":
      return {
        label: "Dikembalikan",
        cls: "bg-info/10 text-info border-info/25",
      };
    default:
      return {
        label: "Belum Bayar",
        cls: "bg-warning/10 text-warning border-warning/25",
      };
  }
}

export function OrdersClient({
  initialOrders,
  initialError,
}: {
  initialOrders: OrderRow[];
  initialError?: string | null;
}) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [loadError, setLoadError] = useState<string | null>(initialError ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    CanonicalOrderStatus | "ALL"
  >("ALL");
  const [isConnected, setIsConnected] = useState(true);
  const wasConnectedRef = useRef(true);
  const supabaseRef = useRef<ReturnType<
    typeof createBrowserClient<Database>
  > | null>(null);
  const lastInitialSyncRef = useRef(JSON.stringify(initialOrders));

  // Keep server-rendered rows in sync after router.refresh() on the page.
  useEffect(() => {
    const next = JSON.stringify(initialOrders);
    if (next !== lastInitialSyncRef.current) {
      lastInitialSyncRef.current = next;
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  const loadOrders = useCallback(
    async (supabase: ReturnType<typeof createBrowserClient<Database>> | null) => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("orders")
        .select(SELECT_QUERY)
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: false });
      if (error) {
        setLoadError("Gagal memuat pesanan. Menampilkan data terakhir.");
        return;
      }
      if (!data) return;

      // Refresh session payments so dine-in rows show their bill of record.
      const sessionIds = [
        ...new Set(
          data
            .map(
              (row) =>
                (row as unknown as Record<string, unknown>).dining_session_id
            )
            .filter((id): id is string => typeof id === "string"),
        ),
      ];
      const sessionPaymentBySession = new Map<string, SessionPaymentInfo>();
      if (sessionIds.length > 0) {
        const { data: sessionPayments } = await supabase
          .from("payments")
          .select(
            "id, dining_session_id, status, amount, payment_method, payment_channel, paid_at, created_at"
          )
          .in("dining_session_id", sessionIds)
          .order("created_at", { ascending: false });
        for (const payment of sessionPayments ?? []) {
          const key = (payment as SessionPaymentInfo).dining_session_id;
          if (!key) continue;
          const existing = sessionPaymentBySession.get(key);
          if (!existing || sessionPaymentPreferred(payment as SessionPaymentInfo, existing)) {
            sessionPaymentBySession.set(key, payment as SessionPaymentInfo);
          }
        }
      }

      setLoadError(null);
      setOrders(
        (data as unknown as Record<string, unknown>[]).map((row) =>
          normalizeRow(row, sessionPaymentBySession)
        )
      );
    },
    []
  );

  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabaseRef.current = supabase;

    const channel = supabase
      .channel("admin_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data } = await supabase
              .from("orders")
              .select(SELECT_QUERY)
              .eq("id", payload.new.id)
              .single();

            if (data) {
              const row = normalizeRow(data as unknown as Record<string, unknown>);
              // Upsert by ID: duplicate Realtime deliveries must not double the row.
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === row.id);
                return exists
                  ? prev.map((o) => (o.id === row.id ? row : o))
                  : [row, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payload.new.id
                  ? { ...o, ...(payload.new as Partial<OrderRow>) }
                  : o
              )
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe(async (status) => {
        const connected = status === "SUBSCRIBED";
        setIsConnected(connected);
        // Reconcile any orders missed while the channel was down.
        if (connected && !wasConnectedRef.current) {
          await loadOrders(supabase);
        }
        wasConnectedRef.current = connected;
      });

    const handleReconcile = () => {
      if (document.visibilityState === "visible" && !wasConnectedRef.current) {
        void loadOrders(supabase);
      }
    };
    document.addEventListener("visibilitychange", handleReconcile);
    window.addEventListener("focus", handleReconcile);

    return () => {
      document.removeEventListener("visibilitychange", handleReconcile);
      window.removeEventListener("focus", handleReconcile);
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  // Payment status changes do not emit order events, so refresh periodically.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadOrders(supabaseRef.current);
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const filteredOrders = orders.filter((o) => {
    if (
      statusFilter !== "ALL" &&
      normalizeOrderStatus(o.status) !== statusFilter
    )
      return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesNumber = o.order_number.toLowerCase().includes(query);
      const matchesTable = o.table?.table_number.toLowerCase().includes(query);
      if (!matchesNumber && !matchesTable) return false;
    }
    return true;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const counts = ALL_STATUSES.reduce<Record<CanonicalOrderStatus, number>>(
    (result, status) => {
      result[status] = orders.filter(
        (order) => normalizeOrderStatus(order.status) === status
      ).length;
      return result;
    },
    { NEW: 0, PREPARING: 0, READY: 0, SERVED: 0, CANCELLED: 0 }
  );

  const totalCount = orders.length;

  return (
    <div className="space-y-6">
      <div className="-mb-1 flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          aria-pressed={statusFilter === "ALL"}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
            statusFilter === "ALL"
              ? "bg-ink text-paper"
              : "text-muted-text hover:bg-muted hover:text-ink"
          )}
        >
          Semua
          <span
            className={cn(
              "rounded-sm px-1.5 py-0.5 text-[10px] font-bold",
              statusFilter === "ALL"
                ? "bg-paper/20 text-paper"
                : "bg-muted text-muted-text"
            )}
          >
            {totalCount}
          </span>
        </button>
        {ALL_STATUSES.map((status) => {
          const config = STATUS_CONFIG[status];
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(isActive ? "ALL" : status)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
                isActive
                  ? "bg-ink text-paper"
                  : "text-muted-text hover:bg-muted hover:text-ink"
              )}
            >
              {config.label}
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-[10px] font-bold",
                  isActive
                    ? "bg-paper/20 text-paper"
                    : "bg-muted text-muted-text"
                )}
              >
                {counts[status]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text" />
          <Input
            placeholder="Cari nomor pesanan atau meja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-sm pl-9"
            aria-label="Cari pesanan"
          />
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-semibold",
              isConnected
                ? "border-success/25 bg-success/5 text-success"
                : "border-danger/25 bg-danger/5 text-danger animate-pulse"
            )}
            title={
              isConnected
                ? "Tersambung real-time"
                : "Real-time terputus, mencoba menyambung ulang"
            }
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {isConnected ? "Langsung" : "Menyambung ulang"}
          </span>
          {statusFilter !== "ALL" || searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="shrink-0 text-sm font-medium text-coffee hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 outline-none rounded-sm"
            >
              Hapus filter
            </button>
          ) : null}
        </div>
      </div>

      <div className="hidden overflow-hidden border border-border-custom/70 md:block">
        {loadError && (
          <p
            role="status"
            className="mb-3 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
          >
            {loadError}
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border-custom/70">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Pesanan
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Waktu
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Meja
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Item
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Total
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Pembayaran
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Status
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-16 text-center text-muted-text"
                >
                  <ShoppingBag className="mx-auto mb-3 h-7 w-7 text-muted-text/50" />
                  Tidak ada pesanan yang cocok dengan filter saat ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const displayStatus = normalizeOrderStatus(order.status);
                const config = STATUS_CONFIG[displayStatus];
                const Icon = config.icon;
                const isNew = isNewArrival(order);
                const pay = paymentStatusOf(order);
                return (
                  <TableRow
                    key={order.id}
                    className={cn(
                      "border-b border-border-custom/60",
                      isNew && "bg-coffee/[0.05]"
                    )}
                  >
                    <TableCell className="font-semibold text-ink">
                      <span className="flex items-center gap-2">
                        {isNew && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coffee opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-coffee" />
                          </span>
                        )}
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="rounded-sm focus-visible:ring-3 focus-visible:ring-ring/40 outline-none hover:text-coffee"
                        >
                          {order.order_number}
                        </Link>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-text">
                      {formatTime(order.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.table ? (
                        <span className="font-semibold text-ink">
                          T{tableNumberLabel(order.table.table_number)}
                        </span>
                      ) : (
                        <span className="text-muted-text">Bawa pulang</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-text">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-ink">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold",
                          pay.cls
                        )}
                      >
                        {pay.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                          config.color
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-coffee hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none rounded-sm"
                      >
                        Kelola
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {loadError && (
          <p
            role="status"
            className="rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
          >
            {loadError}
          </p>
        )}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
            <ShoppingBag className="mb-3 h-7 w-7 text-muted-text/50" />
            <p className="text-sm font-medium text-ink">
              Tidak ada pesanan yang cocok
            </p>
            <p className="mt-1 text-sm text-muted-text">
              Coba ubah filter atau pencarian.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const displayStatus = normalizeOrderStatus(order.status);
            const config = STATUS_CONFIG[displayStatus];
            const Icon = config.icon;
            const isNew = isNewArrival(order);
            const pay = paymentStatusOf(order);
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className={cn(
                  "block rounded-sm border bg-card p-4 transition-colors hover:border-coffee/40 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
                  isNew
                    ? "border-coffee/50 bg-coffee/[0.04]"
                    : "border-border-custom"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {isNew && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coffee opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-coffee" />
                      </span>
                    )}
                    {order.order_number}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      config.color
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-text">
                  {order.table
                    ? `Meja ${order.table.table_number}`
                    : "Bawa pulang"}{" "}
                  · {formatTime(order.created_at)} · {order.itemCount} item
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border-custom/60 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {formatPrice(order.total)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold",
                        pay.cls
                      )}
                    >
                      {pay.label}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-coffee">
                    Kelola
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function tableNumberLabel(number: string | number) {
  return String(number);
}
