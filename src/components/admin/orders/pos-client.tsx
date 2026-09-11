"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/finance/format";
import {
  createPosOrder,
  type PosOrderType,
} from "@/app/admin/(dashboard)/orders/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/owner/empty-state";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PosOptionValue = {
  id: string;
  name: string;
  /** Added to the unit price by the ordering RPC, per unit. */
  priceAdjustment: number;
};

export type PosOption = {
  id: string;
  name: string;
  /** The ordering RPC refuses the item while this group is unanswered. */
  isRequired: boolean;
  values: PosOptionValue[];
};

export type PosItem = {
  key: string;
  productId: string;
  productVariantId: string | null;
  coffeeVariantId: string | null;
  name: string;
  variantLabel: string | null;
  price: number;
  categoryId: string | null;
  /** Option groups for this product. Always empty for a coffee bean variant. */
  options: PosOption[];
};

type PosCategory = { id: string; name: string };
export type PosTable = {
  id: string;
  tableNumber: string;
  /** Open dining session on this table, if any. Null means the table is free. */
  activeSessionId: string | null;
  /** Accrued total of that session, shown before an explicit join. */
  activeSessionTotal: number;
};
type CartLine = {
  /** Item plus its exact option selection — "Ice" and "Hot" must not merge. */
  key: string;
  item: PosItem;
  quantity: number;
  note: string;
  /** Option group id → chosen value id. An unanswered optional group is absent. */
  selections: Record<string, string>;
  /** Σ priceAdjustment of the chosen values, per unit. */
  optionTotal: number;
};

/** Cashier flow: build the cart → review with the customer → create the order. */
type PosStep = "cart" | "review" | "done";

function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `cashier-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Two lines merge only when the item *and* every chosen option match. */
function lineKey(item: PosItem, selections: Record<string, string>): string {
  const chosen = item.options
    .map((option) => selections[option.id] ?? "")
    .join("|");
  return chosen ? `${item.key}::${chosen}` : item.key;
}

function selectionTotal(
  item: PosItem,
  selections: Record<string, string>
): number {
  return item.options.reduce((sum, option) => {
    const value = option.values.find((v) => v.id === selections[option.id]);
    return sum + (value?.priceAdjustment ?? 0);
  }, 0);
}

function selectionLabels(
  item: PosItem,
  selections: Record<string, string>
): string[] {
  return item.options
    .map((option) => option.values.find((v) => v.id === selections[option.id])?.name)
    .filter((name): name is string => Boolean(name));
}

/**
 * A required group with a single choice — a drink served only iced, say — poses
 * no question, so it is pre-answered rather than blocking the cashier. Optional
 * groups are left untouched, matching the customer flow.
 */
function defaultSelections(item: PosItem): Record<string, string> {
  const selections: Record<string, string> = {};
  for (const option of item.options) {
    if (option.isRequired && option.values.length === 1) {
      selections[option.id] = option.values[0].id;
    }
  }
  return selections;
}

export function PosClient({
  items,
  categories,
  tables,
}: {
  items: PosItem[];
  categories: PosCategory[];
  tables: PosTable[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("ALL");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [orderType, setOrderType] = useState<PosOrderType>("DINE_IN");
  const [tableId, setTableId] = useState<string>("");
  const [joinSessionId, setJoinSessionId] = useState<string | null>(null);
  const [joinCandidate, setJoinCandidate] = useState<PosTable | null>(null);
  // The item awaiting an option choice. Non-null means the picker is open.
  const [pendingItem, setPendingItem] = useState<PosItem | null>(null);
  const [pendingSelections, setPendingSelections] = useState<
    Record<string, string>
  >({});
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [step, setStep] = useState<PosStep>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{
    id: string;
    number: string;
  } | null>(null);
  // Idempotency key is bound to one exact payload: retrying an unchanged order
  // reuses it, while editing the cart mints a new one instead of colliding with
  // the previous key.
  const requestRef = useRef<{ signature: string; id: string } | null>(null);

  const categoryHasItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.categoryId)
        counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const visibleCategories = categories.filter(
    (category) => (categoryHasItems.get(category.id) ?? 0) > 0
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryId !== "ALL" && item.categoryId !== categoryId) return false;
      return (
        !query ||
        `${item.name} ${item.variantLabel ?? ""}`.toLowerCase().includes(query)
      );
    });
  }, [items, categoryId, search]);

  const lines = Object.values(cart);
  const total = lines.reduce(
    (sum, line) => sum + (line.item.price + line.optionTotal) * line.quantity,
    0
  );
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const selectedTable = tables.find((table) => table.id === tableId);
  const joinedSession =
    joinSessionId !== null && joinSessionId === selectedTable?.activeSessionId;

  const pendingUnitPrice = pendingItem
    ? pendingItem.price + selectionTotal(pendingItem, pendingSelections)
    : 0;
  const pendingComplete = pendingItem
    ? pendingItem.options.every(
        (option) =>
          !option.isRequired || Boolean(pendingSelections[option.id])
      )
    : false;

  /**
   * A product with option groups stops at the picker first; one without goes
   * straight into the cart.
   */
  function addItem(item: PosItem) {
    if (item.options.length > 0) {
      setPendingSelections(defaultSelections(item));
      setPendingItem(item);
      return;
    }
    commitItem(item, {});
  }

  function commitItem(item: PosItem, selections: Record<string, string>) {
    const key = lineKey(item, selections);
    const optionTotal = selectionTotal(item, selections);
    setCart((current) => {
      const existing = current[key];
      return {
        ...current,
        [key]: {
          key,
          item,
          selections,
          optionTotal,
          quantity: (existing?.quantity ?? 0) + 1,
          note: existing?.note ?? "",
        },
      };
    });
  }

  function changeQuantity(key: string, delta: number) {
    setCart((current) => {
      const line = current[key];
      if (!line) return current;
      const quantity = line.quantity + delta;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: { ...line, quantity } };
    });
  }

  function setNote(key: string, note: string) {
    setCart((current) => {
      const line = current[key];
      return line ? { ...current, [key]: { ...line, note } } : current;
    });
  }

  /**
   * A free table is assigned directly. An occupied table is never merged into
   * silently — it opens an explicit opt-in instead.
   */
  function selectTable(table: PosTable) {
    if (table.activeSessionId) {
      setJoinCandidate(table);
      return;
    }
    setTableId(table.id);
    setJoinSessionId(null);
  }

  function confirmJoin() {
    if (!joinCandidate?.activeSessionId) return;
    setTableId(joinCandidate.id);
    setJoinSessionId(joinCandidate.activeSessionId);
    setJoinCandidate(null);
  }

  function buildPayload() {
    return {
      orderType,
      tableId: orderType === "DINE_IN" ? tableId : null,
      diningSessionId: orderType === "DINE_IN" ? joinSessionId : null,
      customerName: customerName.trim() || null,
      notes: orderNotes.trim() || null,
      items: lines.map((line) => ({
        productId: line.item.productId,
        productVariantId: line.item.productVariantId,
        coffeeVariantId: line.item.coffeeVariantId,
        quantity: line.quantity,
        notes: line.note.trim() || null,
        // Only answered groups travel; the RPC rejects a group sent twice or a
        // value that does not belong to its option.
        options: line.item.options.flatMap((option) => {
          const optionValueId = line.selections[option.id];
          return optionValueId ? [{ optionId: option.id, optionValueId }] : [];
        }),
      })),
    };
  }

  function requestIdFor(payload: object) {
    const signature = JSON.stringify(payload);
    if (requestRef.current?.signature !== signature) {
      requestRef.current = { signature, id: createRequestId() };
    }
    return requestRef.current.id;
  }

  async function submit() {
    const payload = buildPayload();
    setSubmitting(true);
    const result = await createPosOrder({
      requestId: requestIdFor(payload),
      ...payload,
    });
    setSubmitting(false);

    if (result.error || !result.orderId) {
      setReviewError(result.error ?? "Terjadi kesalahan.");
      return;
    }

    setReviewError(null);
    setCreatedOrder({ id: result.orderId, number: result.orderNumber ?? "" });
    setStep("done");
  }

  function startNewOrder() {
    setCart({});
    setTableId("");
    setJoinSessionId(null);
    setPendingItem(null);
    setPendingSelections({});
    setCustomerName("");
    setOrderNotes("");
    setReviewError(null);
    setCreatedOrder(null);
    requestRef.current = null;
    setStep("cart");
  }

  if (step === "done" && createdOrder) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-6 py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
          Pesanan diterima.
        </h2>

        {orderType === "DINE_IN" && selectedTable ? (
          <>
            <p className="font-display text-5xl font-bold tracking-tight text-ink">
              Meja {selectedTable.tableNumber}
            </p>
            <div className="space-y-2 rounded-sm border border-border-custom bg-card p-5 text-left">
              <p className="text-sm font-semibold text-ink">
                Silakan membawa stand meja {selectedTable.tableNumber}.
              </p>
              <p className="text-sm text-muted-text">Tempat duduk bebas.</p>
              <p className="text-sm text-muted-text">
                Untuk menambah pesanan, scan QR pada stand meja.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-text">
            Pesanan bawa pulang sedang disiapkan.
          </p>
        )}

        {createdOrder.number && (
          <p className="text-xs text-muted-text">
            Nomor pesanan {createdOrder.number}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => router.push(`/admin/orders/${createdOrder.id}`)}
            className="h-12"
          >
            Buka Detail Pesanan
          </Button>
          <Button variant="outline" onClick={startNewOrder} className="h-12">
            Mulai Pesanan Baru
          </Button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="rounded-sm border border-border-custom bg-card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Pesanan Anda
          </p>
          <ul className="mt-4 divide-y divide-border-custom/60">
            {lines.map((line) => {
              const optionLabels = selectionLabels(line.item, line.selections);
              return (
                <li
                  key={line.key}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {line.quantity}× {line.item.name}
                    </p>
                    {line.item.variantLabel && (
                      <p className="text-xs text-muted-text">
                        {line.item.variantLabel}
                      </p>
                    )}
                    {optionLabels.length > 0 && (
                      <p className="text-xs text-muted-text">
                        {optionLabels.join(" · ")}
                      </p>
                    )}
                    {line.note.trim() && (
                      <p className="text-xs italic text-muted-text">
                        Catatan: {line.note.trim()}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    {formatIDR(
                      (line.item.price + line.optionTotal) * line.quantity
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-border-custom/60 pt-4">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="font-display text-2xl font-bold text-ink">
              {formatIDR(total)}
            </span>
          </div>
          {orderType === "DINE_IN" && selectedTable && (
            <p className="mt-5 text-center font-display text-3xl font-bold tracking-tight text-ink">
              Meja {selectedTable.tableNumber}
            </p>
          )}
          {joinedSession && (
            <p className="mt-1 text-center text-xs font-semibold text-coffee">
              Ditambahkan ke sesi meja yang sedang berjalan.
            </p>
          )}
        </div>

        <p className="text-center text-base font-semibold text-ink">
          Pesanan sudah sesuai?
        </p>

        {reviewError && (
          <p
            role="alert"
            className="rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
          >
            {reviewError}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            onClick={submit}
            disabled={submitting}
            className="h-12 sm:flex-1"
          >
            {submitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Konfirmasi Pesanan
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setReviewError(null);
              setStep("cart");
            }}
            disabled={submitting}
            className="h-12 sm:flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Kembali &amp; Ubah
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari produk…"
              className="pl-9"
              aria-label="Cari produk"
            />
          </div>
        </div>

        {visibleCategories.length > 0 && (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              aria-pressed={categoryId === "ALL"}
              onClick={() => setCategoryId("ALL")}
              className={cn(
                "min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
                categoryId === "ALL"
                  ? "border-coffee bg-coffee text-paper"
                  : "border-border-custom bg-paper text-muted-text hover:text-ink"
              )}
            >
              Semua
            </button>
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
                className={cn(
                  "min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
                  categoryId === category.id
                    ? "border-coffee bg-coffee text-paper"
                    : "border-border-custom bg-paper text-muted-text hover:text-ink"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Tidak ada produk yang cocok"
            description="Coba kata kunci lain atau kategori berbeda."
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => addItem(item)}
                className="flex min-h-24 flex-col justify-between rounded-sm border border-border-custom bg-card p-3 text-left transition-colors hover:border-coffee/50 hover:bg-coffee/[0.04] focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.name}
                  </p>
                  {item.variantLabel && (
                    <p className="mt-0.5 truncate text-xs text-muted-text">
                      {item.variantLabel}
                    </p>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold tabular-nums text-coffee">
                      {formatIDR(item.price)}
                    </span>
                    {item.options.length > 0 && (
                      <SlidersHorizontal
                        className="h-3.5 w-3.5 shrink-0 text-muted-text"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted text-muted-text">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-4 rounded-sm border border-border-custom bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShoppingBag
                className="h-4 w-4 text-muted-text"
                aria-hidden="true"
              />
              Keranjang
              {totalQuantity > 0 && (
                <span className="rounded-full bg-coffee px-2 py-0.5 text-[10px] font-bold text-paper">
                  {totalQuantity}
                </span>
              )}
            </h2>
            {lines.length > 0 && (
              <button
                type="button"
                onClick={() => setCart({})}
                className="inline-flex min-h-9 items-center gap-1 rounded-sm px-2 text-xs font-semibold text-muted-text transition-colors hover:text-danger focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Kosongkan
              </button>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-muted-text">
              Jenis pesanan
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    value: "DINE_IN",
                    label: "Makan di tempat",
                    icon: Utensils,
                  },
                  { value: "TAKEAWAY", label: "Bawa pulang", icon: Package },
                ] as const
              ).map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={orderType === option.value}
                    onClick={() => {
                      setOrderType(option.value);
                      if (option.value === "TAKEAWAY") {
                        setTableId("");
                        setJoinSessionId(null);
                      }
                    }}
                    className={cn(
                      "flex min-h-11 items-center justify-center gap-2 rounded-sm border px-3 text-xs font-semibold transition-colors",
                      orderType === option.value
                        ? "border-coffee bg-coffee text-paper"
                        : "border-border-custom text-muted-text hover:text-ink"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-3">
            {orderType === "DINE_IN" && (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-text">
                    Meja
                  </span>
                  {selectedTable && (
                    <span className="text-xs font-semibold text-coffee">
                      {joinedSession
                        ? `Bergabung · Meja ${selectedTable.tableNumber}`
                        : `Dipilih · Meja ${selectedTable.tableNumber}`}
                    </span>
                  )}
                </div>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="group"
                  aria-label="Pilih meja"
                >
                  {tables.map((table) => {
                    const occupied = table.activeSessionId !== null;
                    const isSelected = table.id === tableId;
                    return (
                      <button
                        key={table.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectTable(table)}
                        className={cn(
                          "flex min-h-11 flex-col items-start justify-center gap-0.5 rounded-sm border px-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
                          isSelected
                            ? "border-coffee bg-coffee text-paper"
                            : "border-border-custom bg-paper hover:border-coffee/50"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              occupied
                                ? "bg-danger"
                                : isSelected
                                  ? "bg-paper"
                                  : "bg-success"
                            )}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-semibold">
                            Meja {table.tableNumber}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "pl-4 text-[11px] font-medium",
                            isSelected
                              ? "text-paper/80"
                              : occupied
                                ? "text-danger"
                                : "text-muted-text"
                          )}
                        >
                          {occupied ? "Terisi" : "Tersedia"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
              Nama pelanggan (opsional)
              <Input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="cth. Bu Sari"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
              Catatan pesanan (opsional)
              <Input
                value={orderNotes}
                onChange={(event) => setOrderNotes(event.target.value)}
                placeholder="Catatan umum"
              />
            </label>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-sm border border-dashed border-border-custom px-4 py-8 text-center text-sm text-muted-text">
              Keranjang kosong. Pilih produk di sebelah kiri.
            </p>
          ) : (
            <ul className="max-h-[22rem] space-y-3 overflow-y-auto">
              {lines.map((line) => {
                const optionLabels = selectionLabels(line.item, line.selections);
                return (
                  <li
                    key={line.key}
                    className="rounded-sm border border-border-custom/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {line.item.name}
                        </p>
                        {line.item.variantLabel && (
                          <p className="truncate text-xs text-muted-text">
                            {line.item.variantLabel}
                          </p>
                        )}
                        {optionLabels.length > 0 && (
                          <p className="truncate text-xs text-muted-text">
                            {optionLabels.join(" · ")}
                          </p>
                        )}
                        {line.optionTotal > 0 && (
                          <p className="truncate text-xs font-semibold text-coffee">
                            +{formatIDR(line.optionTotal)} / item
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                        {formatIDR(
                          (line.item.price + line.optionTotal) * line.quantity
                        )}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeQuantity(line.key, -1)}
                        aria-label={`Kurangi ${line.item.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-custom text-ink"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold tabular-nums text-ink">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(line.key, 1)}
                        aria-label={`Tambah ${line.item.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-custom text-ink"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        value={line.note}
                        onChange={(event) =>
                          setNote(line.key, event.target.value)
                        }
                        placeholder="Catatan…"
                        aria-label={`Catatan untuk ${line.item.name}`}
                        className="h-9 min-w-0 flex-1 rounded-sm border border-border-custom bg-paper px-2.5 text-xs text-ink"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-3 border-t border-border-custom/60 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-ink">Total</span>
              <span className="font-display text-2xl font-bold text-ink">
                {formatIDR(total)}
              </span>
            </div>
            <p className="text-xs text-muted-text">
              Pembayaran dikonfirmasi terpisah setelah pesanan dibuat.
            </p>
            <Button
              onClick={() => setStep("review")}
              disabled={
                lines.length === 0 || (orderType === "DINE_IN" && !tableId)
              }
              className="h-12 w-full"
            >
              Lanjut ke Konfirmasi
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={joinCandidate !== null}
        onOpenChange={(open) => {
          if (!open) setJoinCandidate(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-coffee" />
              Meja {joinCandidate?.tableNumber} sedang memiliki sesi aktif.
            </DialogTitle>
            <DialogDescription>
              Total sesi saat ini{" "}
              {formatIDR(joinCandidate?.activeSessionTotal ?? 0)}.
            </DialogDescription>
          </DialogHeader>
          <p className="py-4 text-sm font-semibold text-ink">
            Tambahkan pesanan ke sesi ini?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinCandidate(null)}>
              Batal
            </Button>
            <Button onClick={confirmJoin}>Gabung ke Sesi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingItem(null);
            setPendingSelections({});
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingItem?.name}
              {pendingItem?.variantLabel ? ` · ${pendingItem.variantLabel}` : ""}
            </DialogTitle>
            <DialogDescription>
              Tentukan pilihan untuk item ini sebelum menambahkannya ke
              keranjang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {pendingItem?.options.map((option) => (
              <section key={option.id} className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xs font-semibold text-ink">
                    {option.name}
                    {option.isRequired && (
                      <span className="text-danger"> *</span>
                    )}
                  </h3>
                  {!option.isRequired && (
                    <span className="text-[11px] text-muted-text">Opsional</span>
                  )}
                </div>

                {option.values.length === 0 ? (
                  <p className="rounded-sm border border-dashed border-border-custom px-3 py-2 text-xs text-muted-text">
                    Belum ada pilihan tersedia. Hubungi admin sebelum menjual
                    item ini.
                  </p>
                ) : (
                  <RadioGroup
                    name={`pos-option-${option.id}`}
                    value={pendingSelections[option.id] ?? ""}
                    onValueChange={(value) =>
                      setPendingSelections((prev) => ({
                        ...prev,
                        [option.id]: value,
                      }))
                    }
                  >
                    {!option.isRequired && (
                      <Label
                        onClick={() =>
                          setPendingSelections((prev) => {
                            const next = { ...prev };
                            delete next[option.id];
                            return next;
                          })
                        }
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 text-sm transition-colors",
                          !pendingSelections[option.id]
                            ? "border-coffee bg-coffee/[0.06]"
                            : "border-border-custom hover:border-coffee/50"
                        )}
                      >
                        <RadioGroupItem value="" />
                        <span className="font-medium text-ink">Tidak ada</span>
                      </Label>
                    )}

                    {option.values.map((value) => (
                      <Label
                        key={value.id}
                        onClick={() =>
                          setPendingSelections((prev) => ({
                            ...prev,
                            [option.id]: value.id,
                          }))
                        }
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-sm border px-3 py-2.5 text-sm transition-colors",
                          pendingSelections[option.id] === value.id
                            ? "border-coffee bg-coffee/[0.06]"
                            : "border-border-custom hover:border-coffee/50"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <RadioGroupItem value={value.id} />
                          <span className="font-medium text-ink">
                            {value.name}
                          </span>
                        </span>
                        {value.priceAdjustment > 0 && (
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-coffee">
                            +{formatIDR(value.priceAdjustment)}
                          </span>
                        )}
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              </section>
            ))}
          </div>

          <div className="flex items-baseline justify-between border-t border-border-custom pt-3">
            <span className="text-xs font-semibold text-muted-text">
              Harga per item
            </span>
            <span className="text-sm font-bold tabular-nums text-ink">
              {formatIDR(pendingUnitPrice)}
            </span>
          </div>

          {!pendingComplete && (
            <p role="alert" className="text-xs font-medium text-danger">
              Lengkapi pilihan bertanda * sebelum menambahkan.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingItem(null);
                setPendingSelections({});
              }}
            >
              Batal
            </Button>
            <Button
              disabled={!pendingComplete}
              onClick={() => {
                if (!pendingItem) return;
                commitItem(pendingItem, pendingSelections);
                setPendingItem(null);
                setPendingSelections({});
              }}
            >
              Tambah ke Keranjang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
