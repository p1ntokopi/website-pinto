"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";

import {
  getDiningSessionSummary,
  type DiningSessionSummary,
} from "@/app/t/[slug]/actions";
import {
  OrderStatusTimeline,
  type CustomerOrderStatus,
} from "@/components/ordering/order-status-timeline";
import {
  PaymentSection,
  type PaymentInfo,
} from "@/components/ordering/payment-section";
import {
  buildReceiptFromSnapshot,
  formatReceiptText,
} from "@/lib/receipt/receipt-service";

const POLL_INTERVAL_MS = 10_000;

export function OrderSessionDetails({
  tableSlug,
  orderId,
  orderNumber,
  initialStatus,
  initialTotal,
  initialPayment,
  children,
}: {
  tableSlug: string;
  orderId: string;
  orderNumber: string;
  initialStatus: CustomerOrderStatus;
  initialTotal: number;
  initialPayment: PaymentInfo | null;
  children: React.ReactNode;
}) {
  const [summary, setSummary] = useState<DiningSessionSummary | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;
    let requestInFlight = false;

    const refresh = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const result = await getDiningSessionSummary(tableSlug);
        if (cancelled) return;
        if (result.summary) {
          setSummary(result.summary);
          setRefreshError(null);
        } else if (result.error) {
          setRefreshError(result.error);
        }
      } catch (error) {
        console.error("Unable to refresh dining session summary:", error);
        if (!cancelled) {
          setRefreshError(
            "Status terbaru belum tersedia. Mencoba menghubungkan ulang."
          );
        }
      } finally {
        requestInFlight = false;
      }
    };

    const startPolling = () => {
      if (intervalId !== null) return;
      void refresh();
      intervalId = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };
    const syncPolling = () => {
      if (document.visibilityState === "visible") startPolling();
      else stopPolling();
    };

    syncPolling();
    document.addEventListener("visibilitychange", syncPolling);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", syncPolling);
      window.removeEventListener("focus", refresh);
    };
  }, [tableSlug]);

  const paymentStatus =
    summary?.payment?.status ??
    summary?.payment_status ??
    initialPayment?.status ??
    null;
  const paidReceipt =
    paymentStatus === "PAID" ? (summary?.receipt ?? null) : null;
  const receiptText = useMemo(() => {
    if (!paidReceipt) return null;
    try {
      const receiptData = buildReceiptFromSnapshot(paidReceipt);
      return receiptData.payment.status === "PAID"
        ? formatReceiptText(receiptData)
        : null;
    } catch (error) {
      console.error("Unable to render paid receipt snapshot:", error);
      return null;
    }
  }, [paidReceipt]);

  return (
    <>
      <section className="border border-border/60 bg-white p-4 text-center sm:p-6">
        {children}
        <div className="mt-6 border-t border-border/60 pt-5">
          <OrderStatusTimeline
            initialStatus={initialStatus}
            orderId={orderId}
            orderNumber={orderNumber}
            summary={summary}
          />
        </div>
      </section>

      <PaymentSection
        total={summary?.total ?? initialTotal}
        paymentStatus={paymentStatus}
        isSessionTotal={summary?.total != null}
      />

      {refreshError && (
        <p
          role="status"
          className="border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {refreshError} Data terakhir tetap ditampilkan; sistem akan mencoba lagi.
        </p>
      )}

      {receiptText && (
        <section
          className="border border-border/60 bg-white p-4 sm:p-6"
          aria-labelledby="paid-receipt-heading"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-success" aria-hidden="true" />
            <h2
              id="paid-receipt-heading"
              className="text-lg font-bold text-ink"
            >
              Struk Pembayaran
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Struk ini diterbitkan setelah pembayaran dikonfirmasi oleh kasir.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border/60 bg-paper p-4">
            <pre className="mx-auto w-fit whitespace-pre font-mono text-xs leading-5 text-ink sm:text-sm">
              {receiptText}
            </pre>
          </div>
        </section>
      )}
    </>
  );
}
