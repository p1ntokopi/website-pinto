"use client";

import { Banknote, CheckCircle2, Info } from "lucide-react";

export type PaymentInfo = {
  status: string | null;
  payment_method: string | null;
  payment_channel: string | null;
  amount: number | null;
  paid_at: string | null;
  expired_at: string | null;
};

export function PaymentSection({
  total,
  paymentStatus,
  isSessionTotal = false,
}: {
  total: number;
  paymentStatus: string | null;
  isSessionTotal?: boolean;
}) {
  const isPaid = paymentStatus === "PAID";
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <section
      className="border border-border/60 bg-white p-4 sm:p-6"
      aria-labelledby="payment-heading"
    >
      <h2
        id="payment-heading"
        className="flex items-center gap-2 text-lg font-bold text-ink"
      >
        <Banknote className="h-5 w-5" aria-hidden="true" />
        Pembayaran di Kasir
      </h2>

      {isPaid ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg bg-success/10 p-4">
          <CheckCircle2
            className="mt-0.5 h-6 w-6 shrink-0 text-success"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-success">
              Tagihan meja sudah dibayar
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Pembayaran telah dikonfirmasi oleh kasir.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 border-y border-border/60 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {isSessionTotal ? "Total tagihan meja" : "Total pesanan ini"}
              </p>
              {!isSessionTotal && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Tagihan akhir meja dapat mencakup pesanan tambahan.
                </p>
              )}
            </div>
            <span className="font-display text-2xl font-semibold tabular-nums text-ink">
              {formatPrice(total)}
            </span>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-coffee/10 p-4 text-sm text-ink">
            <Info
              className="mt-0.5 h-5 w-5 shrink-0 text-coffee"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">
                Silakan lakukan pembayaran di kasir setelah selesai.
              </p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                Tidak perlu membayar lewat ponsel. Sebutkan nomor meja dan bayar
                seluruh tagihan dengan tunai atau QRIS.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
