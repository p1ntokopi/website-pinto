import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildReceiptFromSnapshot } from "@/lib/receipt/receipt-service";
import type { ReceiptSnapshot } from "@/lib/receipt/receipt-types";
import { ReceiptPrintView } from "@/components/admin/orders/receipt-print-view";

export const metadata: Metadata = {
  title: "Cetak Struk - Pinto",
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select(
      "id, order_id, dining_session_id, receipt_number, snapshot, issued_at"
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") notFound();
    console.error("[receipt detail]", error.code, error.message);
    throw new Error("Gagal memuat struk.");
  }
  if (!receipt) notFound();

  let receiptData;
  try {
    receiptData = buildReceiptFromSnapshot({
      receipt_number: receipt.receipt_number,
      issued_at: receipt.issued_at,
      snapshot: receipt.snapshot as unknown as ReceiptSnapshot,
    });
  } catch (snapshotError) {
    console.error("[receipt snapshot]", snapshotError);
    throw new Error("Snapshot struk tidak valid.");
  }

  if (!receipt.order_id && !receipt.dining_session_id) {
    console.error("[receipt target]", receipt.id);
    throw new Error("Struk tidak memiliki tujuan transaksi.");
  }

  const returnHref = receipt.dining_session_id
    ? `/admin/sessions/${receipt.dining_session_id}`
    : `/admin/orders/${receipt.order_id!}`;

  return (
    <ReceiptPrintView
      receiptId={receipt.id}
      returnHref={returnHref}
      receiptData={receiptData}
    />
  );
}
