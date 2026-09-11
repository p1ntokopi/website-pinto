"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionToken, setSessionToken } from "@/lib/ordering/session";
import { redirect } from "next/navigation";

import type { ReceiptSnapshot } from "@/lib/receipt/receipt-types";

type CartOption = {
  option_id: unknown;
  option_value_id: unknown;
};

function isCartOption(value: unknown): value is CartOption {
  return typeof value === "object" && value !== null &&
    "option_id" in value && "option_value_id" in value;
}

export async function startOrResumeDiningSession(tableSlug: string) {
  const supabase = await createClient();

  // The cashier opens the table session. This path only ever resumes it, so
  // `p_create_if_missing` is passed explicitly rather than relying on the
  // database default.
  const { data, error } = await supabase.rpc("start_or_resume_dining_session", {
    p_table_slug: tableSlug,
    p_create_if_missing: false,
  });

  if (error) {
    console.error("Failed to start dining session:", error);
    return { error: "Tidak dapat membuka sesi meja. Silakan coba lagi." };
  }

  const result = data as {
    success?: boolean;
    code?: string;
    error?: string;
    session_token?: string;
  } | null;

  if (!result?.success) {
    if (result?.code === "NO_ACTIVE_SESSION") {
      return {
        error:
          result.error ||
          "Belum ada sesi meja aktif. Silakan melakukan pemesanan di kasir terlebih dahulu.",
      };
    }
    return {
      error:
        result?.error || "Tidak dapat membuka sesi meja. Silakan coba lagi.",
    };
  }

  if (!result.session_token) {
    return { error: "Tidak dapat membuka sesi meja. Silakan coba lagi." };
  }

  await setSessionToken(result.session_token);

  redirect(`/t/${tableSlug}/menu`);
}

export async function submitOrder(
  tableSlug: string,
  notes: string,
  cartItems: Record<string, unknown>[],
  requestId: string
) {
  const supabase = await createClient();
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    return {
      error: "Sesi Anda telah berakhir. Silakan pindai ulang kode QR meja.",
    };
  }

  // Basic validation on the server before hitting RPC
  if (!cartItems || cartItems.length === 0) {
    return { error: "Keranjang Anda kosong." };
  }

  if (
    !requestId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    return { error: "Permintaan tidak valid. Silakan coba lagi." };
  }

  // Format cart items for the RPC
  const formattedItems = cartItems.map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    quantity: Number(item.quantity),
    notes: item.notes || null,
    options: Array.isArray(item.options)
      ? item.options.filter(isCartOption).map((option) => ({
          option_id: option.option_id,
          option_value_id: option.option_value_id,
        }))
      : [],
  }));

  const { data, error } = await supabase.rpc("create_customer_order", {
    p_table_slug: tableSlug,
    p_session_token: sessionToken,
    p_request_id: requestId,
    p_notes: notes,
    p_items: formattedItems,
  });

  if (error) {
    console.error("Order creation RPC error:", error);
    return {
      error:
        "Gagal membuat pesanan. Silakan coba lagi atau minta bantuan staf.",
    };
  }

  if (data && data.success) {
    return { success: true, orderNumber: data.order_number };
  } else {
    console.error("Order creation RPC failed internally:", data);
    return {
      error:
        data?.error ||
        "Gagal membuat pesanan karena item atau harga tidak valid.",
    };
  }
}

type DiningSessionOrderSummary = {
  id?: string;
  order_number: string;
  status: string;
};

export type DiningSessionPaymentSummary = {
  status: string | null;
  method: string | null;
  channel: string | null;
  amount: number | null;
  paid_at: string | null;
};

export type DiningSessionReceipt = {
  receipt_number: string;
  issued_at?: string | null;
  snapshot: ReceiptSnapshot;
};

export type DiningSessionSummary = {
  session_status: string | null;
  total: number | null;
  payment: DiningSessionPaymentSummary | null;
  payment_status: string | null;
  orders: DiningSessionOrderSummary[];
  receipt: DiningSessionReceipt | null;
};

type DiningSessionPaymentCandidate = Partial<DiningSessionPaymentSummary> & {
  payment_status?: string | null;
  payment_method?: string | null;
  payment_channel?: string | null;
};

type DiningSessionSummaryRpcResult = {
  success?: boolean;
  error?: string;
  session?: {
    status?: string | null;
    total?: number | null;
    session_total?: number | null;
    payment?: DiningSessionPaymentCandidate | null;
    payment_status?: string | null;
    orders?: DiningSessionOrderSummary[] | null;
    receipt?: DiningSessionReceipt | null;
  } | null;
  session_status?: string | null;
  total?: number | null;
  session_total?: number | null;
  payment?: DiningSessionPaymentCandidate | null;
  payment_status?: string | null;
  orders?: DiningSessionOrderSummary[] | null;
  receipt?: DiningSessionReceipt | null;
};

function normalizeDiningSessionPayment(
  payment: DiningSessionPaymentCandidate | null | undefined,
  fallbackStatus: string | null | undefined
): DiningSessionPaymentSummary | null {
  if (!payment && !fallbackStatus) return null;

  return {
    status:
      payment?.status ?? payment?.payment_status ?? fallbackStatus ?? null,
    method: payment?.method ?? payment?.payment_method ?? null,
    channel: payment?.channel ?? payment?.payment_channel ?? null,
    amount: payment?.amount ?? null,
    paid_at: payment?.paid_at ?? null,
  };
}

/**
 * Reads only the current anonymous guest's dining session through the scoped
 * security-definer RPC. Do not replace this with an anonymous table subscription.
 */
export async function getDiningSessionSummary(
  tableSlug: string
): Promise<{ summary?: DiningSessionSummary; error?: string }> {
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    return {
      error: "Sesi Anda telah berakhir. Silakan pindai ulang kode QR meja.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dining_session_summary", {
    p_table_slug: tableSlug,
    p_session_token: sessionToken,
  });

  if (error) {
    console.error("Dining session summary RPC error:", error);
    return { error: "Status terbaru belum dapat dimuat." };
  }

  const result = data as DiningSessionSummaryRpcResult | null;
  if (!result || result.success === false) {
    return { error: result?.error || "Sesi meja tidak ditemukan." };
  }

  const paymentCandidate = result.payment ?? result.session?.payment;
  const fallbackPaymentStatus =
    result.payment_status ?? result.session?.payment_status ?? null;
  const payment = normalizeDiningSessionPayment(
    paymentCandidate,
    fallbackPaymentStatus
  );

  return {
    summary: {
      session_status: result.session_status ?? result.session?.status ?? null,
      total:
        result.session_total ??
        result.total ??
        result.session?.session_total ??
        result.session?.total ??
        null,
      payment,
      payment_status: payment?.status ?? fallbackPaymentStatus,
      orders: Array.isArray(result.orders)
        ? result.orders
        : Array.isArray(result.session?.orders)
          ? result.session.orders
          : [],
      receipt: result.receipt ?? result.session?.receipt ?? null,
    },
  };
}
