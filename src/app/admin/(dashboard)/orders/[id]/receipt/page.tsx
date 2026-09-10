import { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import { buildReceiptFromOrder } from "@/lib/receipt/receipt-service";
import type {
  ReceiptOrderInput,
  ReceiptPayment,
} from "@/lib/receipt/receipt-types";
import { normalizeOrderStatus } from "@/lib/orders/status-machine";
import { ReceiptPrintView } from "@/components/admin/orders/receipt-print-view";

export const metadata: Metadata = {
  title: "Cetak Struk - Pinto",
};

export default async function OrderReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: receipt } = await supabase
    .from("receipts")
    .select("id")
    .eq("order_id", resolvedParams.id)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (receipt) redirect(`/admin/receipts/${receipt.id}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      order_number, order_type, status, subtotal, tax, discount, total, notes, created_at,
      table:tables(table_number),
      items:order_items(
        quantity, product_name_snapshot, variant_name_snapshot, unit_price, subtotal, notes,
        options:order_item_options(option_value_snapshot, price_adjustment)
      )
    `
    )
    .eq("id", resolvedParams.id)
    .single();

  if (!order) notFound();

  // Receipts may only be printed once the order is completed.
  if (normalizeOrderStatus(order.status) !== "SERVED") {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 pt-10">
        <h1 className="font-display text-2xl font-bold text-ink">
          Struk belum bisa dicetak
        </h1>
        <p className="text-sm text-muted-text">
          Struk hanya dapat dicetak setelah pesanan berstatus{" "}
          <strong>Selesai</strong>. Tandai pesanan selesai terlebih dahulu, lalu
          kembali ke halaman ini.
        </p>
        <Link
          href={`/admin/orders/${resolvedParams.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-coffee hover:text-ink"
        >
          ← Kembali ke Detail Pesanan
        </Link>
      </div>
    );
  }

  const settings = await getAppSettings();
  const business = {
    name: settings.businessName,
    tagline: settings.tagline,
    address: settings.address,
    website: settings.website,
    wifiName: settings.wifiName,
    wifiPassword: settings.wifiPassword,
    footerMessage: settings.footerMessage,
  };

  const { data: paymentRow } = await supabase
    .from("payments")
    .select("status, payment_method, payment_channel")
    .eq("order_id", resolvedParams.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payment: ReceiptPayment | null = paymentRow
    ? {
        method: paymentRow.payment_method,
        channel: paymentRow.payment_channel,
        status: paymentRow.status,
      }
    : null;

  const table = Array.isArray(order.table)
    ? (order.table[0] ?? null)
    : order.table;

  const receiptData = buildReceiptFromOrder(
    {
      order_number: order.order_number,
      subtotal: order.subtotal,
      tax: order.tax ?? 0,
      discount: order.discount ?? 0,
      total: order.total,
      notes: order.notes ?? null,
      created_at: order.created_at,
      table: table ? { table_number: table.table_number } : null,
      items: (order.items || []).map((item) => ({
        quantity: item.quantity,
        product_name_snapshot: item.product_name_snapshot,
        variant_name_snapshot: item.variant_name_snapshot ?? null,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        notes: item.notes ?? null,
        options: (item.options || []).map((opt) => ({
          option_value_snapshot: opt.option_value_snapshot,
          price_adjustment: opt.price_adjustment,
        })),
      })),
    } as ReceiptOrderInput,
    payment,
    business
  );

  return (
    <ReceiptPrintView
      returnHref={`/admin/orders/${resolvedParams.id}`}
      receiptData={receiptData}
    />
  );
}
