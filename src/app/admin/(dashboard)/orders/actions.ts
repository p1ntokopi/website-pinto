"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  canTransition,
  normalizeOrderStatus,
  type CanonicalOrderStatus,
  type OrderStatus,
  type UserRole,
} from "@/lib/orders/status-machine";
import { STATUS_CONFIG } from "@/lib/orders/status-config";

type RpcResult = {
  success?: boolean;
  error?: string;
  order_id?: string;
  orderId?: string;
  order_number?: string;
  orderNumber?: string;
  payment_id?: string;
  paymentId?: string;
  receipt_id?: string;
  receiptId?: string;
  receipt_number?: string;
  receiptNumber?: string;
  amount?: number;
  change?: number;
};

export type CashierPaymentResult = {
  ok?: boolean;
  error?: string;
  paymentId?: string;
  receiptId?: string;
  receiptNumber?: string;
  amount?: number;
  change?: number;
  receiptPath?: string;
};

type OperationalContext = Awaited<ReturnType<typeof getOperationalClient>>;

async function getOperationalClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      supabase,
      user: null,
      role: null,
      error: "Sesi berakhir. Silakan login ulang.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role as UserRole | undefined;

  if (!role || !["admin", "owner", "staff", "kitchen"].includes(role)) {
    return {
      supabase,
      user: null,
      role: null,
      error: "Akun tidak memiliki akses operasional.",
    };
  }

  return { supabase, user, role, error: null };
}

function revalidateOperations(orderId?: string, sessionId?: string) {
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
  if (sessionId) revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/tables/live");
  revalidatePath("/admin/owner");
  revalidatePath("/admin/owner/finance");
  revalidatePath("/admin/owner/reports");
}

function rpcFailure(data: unknown, fallback: string): string | null {
  const result = data as RpcResult | null;
  if (result && result.success === false) return result.error || fallback;
  return null;
}

/**
 * The ordering RPCs raise curated, cashier-facing reasons with SQLSTATE 23514
 * (rule violation, e.g. an occupied table) and 22023 (invalid argument).
 * PostgreSQL uses the same codes for raw constraint and type failures, so
 * anything that reads like engine output stays behind the generic fallback.
 */
const RAW_DB_MESSAGE =
  /violates|constraint|relation "|column "|null value|does not exist|permission denied|syntax error/i;

function actionableRpcError(error: {
  code?: string | null;
  message?: string | null;
}): string | null {
  if (error.code !== "23514" && error.code !== "22023") return null;
  const message = error.message?.trim();
  if (!message || RAW_DB_MESSAGE.test(message)) return null;
  return message;
}

function paymentResult(
  data: unknown,
  receiptPath: (receiptId: string) => string
): CashierPaymentResult {
  const result = (data ?? {}) as RpcResult;
  const paymentId = result.payment_id ?? result.paymentId;
  const receiptId = result.receipt_id ?? result.receiptId;
  const receiptNumber = result.receipt_number ?? result.receiptNumber;
  if (!paymentId || !receiptId) {
    return { error: "RPC tidak mengembalikan identitas pembayaran dan struk." };
  }

  return {
    ok: true,
    paymentId,
    receiptId,
    receiptNumber,
    amount: result.amount,
    change: result.change,
    receiptPath: receiptPath(receiptId),
  };
}

export async function updateOrderStatus(
  orderId: string,
  targetStatus: CanonicalOrderStatus,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  const context = await getOperationalClient();
  const { supabase, role, error } = context;
  if (error || !role) return { error };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) return { error: "Pesanan tidak ditemukan." };

  const currentStatus = order.status as OrderStatus;
  if (!canTransition(currentStatus, targetStatus, role)) {
    const canonicalCurrent = normalizeOrderStatus(currentStatus);
    const label = STATUS_CONFIG[canonicalCurrent].label;
    return {
      error: `Status pesanan sudah berubah menjadi "${label}". Muat ulang lalu coba lagi.`,
    };
  }

  const cancellationReason = reason?.trim() || null;
  if (targetStatus === "CANCELLED" && !cancellationReason) {
    return { error: "Alasan pembatalan wajib diisi." };
  }

  const { data, error: rpcError } = await supabase.rpc(
    "transition_order_status",
    {
      p_order_id: orderId,
      p_expected_status: currentStatus,
      p_new_status: targetStatus,
      p_reason: cancellationReason,
      p_metadata: { source: "admin_order_action" },
    }
  );

  if (rpcError) {
    console.error("transition_order_status error:", rpcError);
    return { error: "Gagal memperbarui status pesanan." };
  }

  const failure = rpcFailure(data, "Transisi status ditolak.");
  if (failure) return { error: failure };

  revalidateOperations(orderId);
  return { success: true };
}

export type ManualPaymentMethod = "CASH" | "QRIS";

export type CashierPaymentInput = {
  method: ManualPaymentMethod;
  amount: number;
  requestId: string;
  cashReceived?: number | null;
  qrisAccepted?: boolean;
};

function validatePayment(input: CashierPaymentInput): string | null {
  if (!input.requestId.trim()) return "ID permintaan pembayaran tidak valid.";
  if (!Number.isFinite(input.amount) || input.amount <= 0)
    return "Nominal pembayaran tidak valid.";
  if (input.method === "CASH") {
    if (
      !Number.isFinite(input.cashReceived) ||
      Number(input.cashReceived) < input.amount
    ) {
      return "Uang diterima harus sama dengan atau lebih besar dari total.";
    }
  } else if (!input.qrisAccepted) {
    return "Konfirmasi penerimaan QRIS diperlukan.";
  }
  return null;
}

/** Confirms a cashier-observed CASH or QRIS payment in one backend transaction. */
export async function confirmCashierPayment(
  orderId: string,
  input: CashierPaymentInput
): Promise<CashierPaymentResult> {
  const context = await getOperationalClient();
  const { supabase, role, error } = context;
  if (error) return { error };
  if (!role || !["admin", "owner", "staff"].includes(role)) {
    return {
      error:
        "Hanya kasir, admin, atau owner yang dapat mengonfirmasi pembayaran.",
    };
  }

  const validationError = validatePayment(input);
  if (validationError) return { error: validationError };

  const cashReceived =
    input.method === "CASH" ? Number(input.cashReceived) : null;
  const { data, error: rpcError } = await supabase.rpc(
    "confirm_cashier_payment",
    {
      p_idempotency_key: input.requestId,
      p_method: input.method,
      p_order_id: orderId,
      p_dining_session_id: null,
      p_tendered_amount: input.method === "CASH" ? cashReceived : input.amount,
      p_cashier_metadata: {
        qrisAccepted:
          input.method === "QRIS" ? input.qrisAccepted === true : undefined,
        source: "admin_order_detail",
      },
    }
  );

  if (rpcError) {
    console.error("confirm_cashier_payment error:", rpcError);
    return { error: "Gagal mengonfirmasi pembayaran." };
  }

  const failure = rpcFailure(data, "Pembayaran ditolak.");
  if (failure) return { error: failure };

  revalidateOperations(orderId);
  return paymentResult(data, (receiptId) => `/admin/receipts/${receiptId}`);
}

export type ReceiptPrintAttemptStatus = "REQUESTED" | "SUCCEEDED" | "FAILED";

export async function recordReceiptPrintAttempt(
  receiptId: string,
  status: ReceiptPrintAttemptStatus,
  printerMetadata: Record<string, string | number | boolean | null>,
  errorMessage?: string | null
): Promise<{ ok?: boolean; error?: string }> {
  const context = await getOperationalClient();
  const { supabase, role, error } = context;
  if (error) return { error };
  if (!role || !["admin", "owner", "staff"].includes(role)) {
    return { error: "Hanya kasir, admin, atau owner yang dapat mencatat pencetakan." };
  }
  if (!receiptId.trim()) return { error: "Identitas struk tidak valid." };

  const { error: rpcError } = await supabase.rpc(
    "record_receipt_print_attempt",
    {
      p_receipt_id: receiptId,
      p_status: status,
      p_printer_metadata: printerMetadata,
      p_error_message: status === "FAILED" ? (errorMessage?.slice(0, 1000) ?? null) : null,
    }
  );

  if (rpcError) {
    console.error("record_receipt_print_attempt error:", rpcError);
    return { error: "Audit pencetakan tidak dapat disimpan." };
  }
  return { ok: true };
}

export type PosOrderType = "DINE_IN" | "TAKEAWAY";

/** One chosen value of one option group. The RPC re-validates ownership and availability. */
export type PosItemOptionInput = {
  optionId: string;
  optionValueId: string;
};

export type PosItemInput = {
  productId: string;
  productVariantId?: string | null;
  coffeeVariantId?: string | null;
  quantity: number;
  notes?: string | null;
  options?: PosItemOptionInput[] | null;
};

export type CreatePosOrderInput = {
  requestId: string;
  orderType: PosOrderType;
  tableId?: string | null;
  diningSessionId?: string | null;
  customerName?: string | null;
  notes?: string | null;
  items: PosItemInput[];
};

/** Creates an unpaid cashier order atomically. Payment is always a separate confirmation. */
export async function createPosOrder(input: CreatePosOrderInput): Promise<{
  ok?: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}> {
  const context: OperationalContext = await getOperationalClient();
  const { supabase, role, error } = context;
  if (error) return { error };
  if (!role || !["admin", "owner", "staff"].includes(role)) {
    return {
      error: "Hanya kasir, admin, atau owner yang dapat membuat pesanan.",
    };
  }

  const requestId = input.requestId?.trim();
  if (!requestId) return { error: "ID permintaan pesanan tidak valid." };
  if (input.orderType !== "DINE_IN" && input.orderType !== "TAKEAWAY") {
    return { error: "Jenis pesanan tidak valid." };
  }
  if (input.orderType === "DINE_IN" && !input.tableId) {
    return { error: "Pilih meja untuk pesanan makan di tempat." };
  }
  if (
    input.orderType === "TAKEAWAY" &&
    (input.tableId || input.diningSessionId)
  ) {
    return {
      error: "Pesanan bawa pulang tidak boleh memiliki meja atau sesi meja.",
    };
  }

  if (input.orderType === "DINE_IN" && input.diningSessionId) {
    const { data: session, error: sessionError } = await supabase
      .from("dining_sessions")
      .select("id, table_id")
      .eq("id", input.diningSessionId)
      .eq("status", "open")
      .maybeSingle();
    if (sessionError || !session || session.table_id !== input.tableId) {
      return {
        error:
          "Sesi meja aktif tidak valid. Muat ulang lalu pilih meja kembali.",
      };
    }
  }

  const items = (input.items ?? []).filter((item) => item.quantity > 0);
  if (items.length === 0) return { error: "Keranjang masih kosong." };
  for (const item of items) {
    if (
      !item.productId ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      return { error: "Item pesanan tidak valid." };
    }
    if (item.productVariantId && item.coffeeVariantId) {
      return { error: "Item hanya boleh memiliki satu jenis varian." };
    }
    for (const option of item.options ?? []) {
      // Which options a product requires, and whether a value belongs to it, is
      // decided by the RPC — this only rejects entries that are structurally
      // unusable before they reach the database.
      if (!option.optionId || !option.optionValueId) {
        return { error: "Pilihan produk tidak lengkap." };
      }
    }
  }

  const { data, error: rpcError } = await supabase.rpc("create_cashier_order", {
    p_idempotency_key: requestId,
    p_table_id: input.orderType === "DINE_IN" ? (input.tableId ?? null) : null,
    p_customer_name: input.customerName?.trim() || null,
    p_notes: input.notes?.trim() || null,
    p_fulfillment_type: input.orderType === "DINE_IN" ? "TABLE" : "PICKUP",
    p_dining_session_id:
      input.orderType === "DINE_IN" ? (input.diningSessionId ?? null) : null,
    p_items: items.map((item) => ({
      product_id: item.coffeeVariantId ? null : item.productId,
      variant_id: item.productVariantId ?? null,
      coffee_variant_id: item.coffeeVariantId ?? null,
      quantity: item.quantity,
      notes: item.notes?.trim() || null,
      options: (item.options ?? []).map((option) => ({
        option_id: option.optionId,
        option_value_id: option.optionValueId,
      })),
    })),
  });

  if (rpcError) {
    console.error("create_cashier_order error:", rpcError);
    return {
      error: actionableRpcError(rpcError) ?? "Gagal membuat pesanan kasir.",
    };
  }

  const failure = rpcFailure(data, "Pesanan kasir ditolak.");
  if (failure) return { error: failure };

  const result = (data ?? {}) as RpcResult;
  const orderId = result.order_id ?? result.orderId;
  const orderNumber = result.order_number ?? result.orderNumber;
  if (!orderId || !orderNumber) {
    return { error: "RPC tidak mengembalikan identitas pesanan." };
  }

  revalidateOperations(orderId);
  return { ok: true, orderId, orderNumber };
}

export async function confirmDiningSessionPayment(
  sessionId: string,
  input: CashierPaymentInput
): Promise<CashierPaymentResult> {
  const context = await getOperationalClient();
  const { supabase, role, error } = context;
  if (error) return { error };
  if (!role || !["admin", "owner", "staff"].includes(role)) {
    return {
      error:
        "Hanya kasir, admin, atau owner yang dapat mengonfirmasi pembayaran.",
    };
  }

  const validationError = validatePayment(input);
  if (validationError) return { error: validationError };

  const cashReceived =
    input.method === "CASH" ? Number(input.cashReceived) : null;
  const { data, error: rpcError } = await supabase.rpc(
    "confirm_cashier_payment",
    {
      p_idempotency_key: input.requestId,
      p_method: input.method,
      p_order_id: null,
      p_dining_session_id: sessionId,
      p_tendered_amount: input.method === "CASH" ? cashReceived : input.amount,
      p_cashier_metadata: {
        qrisAccepted:
          input.method === "QRIS" ? input.qrisAccepted === true : undefined,
        source: "admin_session_checkout",
      },
    }
  );

  if (rpcError) {
    console.error("confirm_cashier_payment session error:", rpcError);
    return { error: "Gagal mengonfirmasi pembayaran sesi meja." };
  }

  const failure = rpcFailure(data, "Pembayaran sesi ditolak.");
  if (failure) return { error: failure };

  revalidateOperations(undefined, sessionId);
  return paymentResult(data, (receiptId) => `/admin/receipts/${receiptId}`);
}

export async function completeDiningSession(
  sessionId: string,
  requestId: string
): Promise<{ ok?: boolean; error?: string }> {
  const context = await getOperationalClient();
  const { supabase, role, error } = context;
  if (error) return { error };
  if (!role || !["admin", "owner", "staff"].includes(role)) {
    return {
      error: "Hanya kasir, admin, atau owner yang dapat menyelesaikan sesi.",
    };
  }
  if (!requestId.trim())
    return { error: "ID permintaan penyelesaian sesi tidak valid." };

  const { data, error: rpcError } = await supabase.rpc(
    "complete_dining_session",
    {
      p_dining_session_id: sessionId,
      p_idempotency_key: requestId,
    }
  );

  if (rpcError) {
    console.error("complete_dining_session error:", rpcError);
    return { error: "Gagal menyelesaikan sesi meja." };
  }

  const failure = rpcFailure(data, "Sesi meja tidak dapat diselesaikan.");
  if (failure) return { error: failure };

  revalidateOperations(undefined, sessionId);
  return { ok: true };
}
