import { createClient } from "@/lib/supabase/server";
import { getSessionToken } from "@/lib/ordering/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Metadata } from "next";

import type { CustomerOrderStatus } from "@/components/ordering/order-status-timeline";
import type { PaymentInfo } from "@/components/ordering/payment-section";
import { OrderSessionDetails } from "@/components/ordering/order-session-details";
import { Button } from "@/components/ui/button";
import { OrderingHeader } from "@/components/ordering/ordering-header";

export const metadata: Metadata = {
  title: "Status Pesanan - Pinto",
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ slug: string; orderNumber: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const sessionToken = await getSessionToken();

  const { data: table } = await supabase
    .from("tables")
    .select("id, table_number")
    .eq("slug", resolvedParams.slug)
    .single();

  if (!table || !sessionToken) {
    redirect(`/t/${resolvedParams.slug}`);
  }

  const { data: result } = await supabase.rpc("get_order_tracking", {
    p_table_slug: resolvedParams.slug,
    p_session_token: sessionToken,
    p_order_number: resolvedParams.orderNumber,
  });

  if (!result || !result.success || !result.order) {
    notFound();
  }

  const order = result.order as {
    id: string;
    order_number: string;
    status: CustomerOrderStatus;
    total: number;
    payment: PaymentInfo | null;
  };

  return (
    <div className="min-h-dvh bg-background pb-24 sm:pb-12">
      <OrderingHeader
        backHref={`/t/${resolvedParams.slug}/menu`}
        title={`Pesanan #${order.order_number}`}
      />

      <main className="mx-auto w-full max-w-3xl space-y-5 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-8">
        <OrderSessionDetails
          tableSlug={resolvedParams.slug}
          orderId={order.id}
          orderNumber={order.order_number}
          initialStatus={order.status}
          initialTotal={order.total}
          initialPayment={order.payment}
        >
          <CheckCircle2
            className="mx-auto mb-3 h-11 w-11 text-success sm:h-12 sm:w-12"
            aria-hidden="true"
          />
          <h1 className="text-xl font-bold text-ink sm:text-2xl">
            Pesanan berhasil dikirim.
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Pesanan Anda sudah diterima. Status pembuatan akan diperbarui di
            halaman ini.
          </p>
          <div className="mt-4 inline-flex rounded-full bg-muted px-4 py-1.5 text-sm font-semibold">
            Meja {table.table_number}
          </div>
        </OrderSessionDetails>

        <div className="rounded-lg border border-coffee/20 bg-coffee/10 p-4 text-sm leading-relaxed text-ink sm:p-5">
          <p className="font-semibold">Masih ingin menambah pesanan?</p>
          <p className="mt-1 text-muted-foreground">
            Pesanan berikutnya tetap masuk ke tagihan meja yang sama selama sesi
            meja aktif.
          </p>
        </div>

        <Button
          render={<Link href={`/t/${resolvedParams.slug}/menu`} />}
          variant="outline"
          className="h-14 w-full text-base"
        >
          Tambah Pesanan
        </Button>
      </main>
    </div>
  );
}
