"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/finance/format";
import {
  completeDiningSession,
  confirmDiningSessionPayment,
  type ManualPaymentMethod,
} from "@/app/admin/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function createRequestId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SessionCheckoutClient({
  sessionId,
  amount,
  isPaid,
  canComplete,
  receiptPath,
}: {
  sessionId: string;
  amount: number;
  isPaid: boolean;
  canComplete: boolean;
  receiptPath?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const paymentRequestId = useRef(createRequestId("session-payment"));
  const completionRequestId = useRef(createRequestId("session-complete"));
  const [method, setMethod] = useState<ManualPaymentMethod>("CASH");
  const [cashReceived, setCashReceived] = useState(String(amount));
  const [qrisAccepted, setQrisAccepted] = useState(false);
  const [submitting, setSubmitting] = useState<"payment" | "completion" | null>(
    null
  );

  const cashValue = Number(cashReceived || 0);
  const change = useMemo(
    () => Math.max(0, cashValue - amount),
    [cashValue, amount]
  );
  const invalidAmount = !Number.isFinite(amount) || amount <= 0;
  const invalidCash =
    method === "CASH" &&
    (invalidAmount || !Number.isFinite(cashValue) || cashValue < amount);
  const invalidQris = method === "QRIS" && (invalidAmount || !qrisAccepted);

  async function confirmPayment() {
    if (invalidCash || invalidQris) return;
    setSubmitting("payment");
    const result = await confirmDiningSessionPayment(sessionId, {
      method,
      amount,
      requestId: paymentRequestId.current,
      cashReceived: method === "CASH" ? cashValue : null,
      qrisAccepted: method === "QRIS" ? qrisAccepted : false,
    });
    setSubmitting(null);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Pembayaran Gagal",
        description: result.error,
      });
      return;
    }

    toast({
      title: "Pembayaran Sesi Dikonfirmasi",
      description: result.receiptNumber
        ? `${method === "CASH" ? `Kembalian ${formatIDR(result.change ?? change)}. ` : ""}Struk ${result.receiptNumber} siap dicetak.`
        : method === "CASH"
          ? `Kembalian ${formatIDR(result.change ?? change)}.`
          : "Penerimaan QRIS dicatat.",
    });
    if (result.receiptPath) {
      router.push(result.receiptPath);
      return;
    }
    router.refresh();
  }

  async function finishSession() {
    setSubmitting("completion");
    const result = await completeDiningSession(
      sessionId,
      completionRequestId.current
    );
    setSubmitting(null);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Sesi Belum Dapat Diselesaikan",
        description: result.error,
      });
      return;
    }

    toast({
      title: "Sesi Selesai",
      description: "Meja telah ditutup dan siap digunakan kembali.",
    });
    router.push("/admin/tables/live");
    router.refresh();
  }

  if (isPaid) {
    return (
      <div className="space-y-3 rounded-sm border border-success/30 bg-success/5 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold text-ink">
              Pembayaran sesi sudah lunas
            </p>
            <p className="mt-0.5 text-xs text-muted-text">
              Selesaikan sesi setelah semua pesanan disajikan atau dibatalkan.
            </p>
          </div>
        </div>
        {receiptPath && (
          <Button
            variant="outline"
            render={<Link href={receiptPath} />}
            className="w-full"
          >
            Cetak Struk Sesi
          </Button>
        )}
        <Button
          onClick={finishSession}
          disabled={!canComplete || submitting !== null}
          className="w-full"
        >
          {submitting === "completion" && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Selesai dan Tutup Meja
        </Button>
        {!canComplete && (
          <p className="text-xs font-medium text-warning">
            Masih ada pesanan yang belum berstatus Disajikan.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-sm border border-border-custom bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-ink">Pembayaran Sesi</p>
        <p className="mt-1 text-xs text-muted-text">
          RPC menghitung ulang tagihan. Nominal layar hanya membantu kasir
          menghitung tender.
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        aria-label="Metode pembayaran sesi"
      >
        {(
          [
            { value: "CASH", label: "Cash", icon: Banknote },
            { value: "QRIS", label: "QRIS", icon: QrCode },
          ] as const
        ).map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={method === option.value}
              onClick={() => setMethod(option.value)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-sm border px-3 text-sm font-semibold",
                method === option.value
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

      {method === "CASH" ? (
        <div className="space-y-2">
          <label className="block space-y-1 text-xs font-semibold text-muted-text">
            Uang diterima
            <Input
              type="number"
              min={amount}
              step="1000"
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
              aria-invalid={invalidCash}
            />
          </label>
          <div className="flex justify-between rounded-sm bg-muted/60 px-3 py-2 text-sm">
            <span className="text-muted-text">Kembalian</span>
            <strong className="text-ink">{formatIDR(change)}</strong>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border-custom p-3">
          <input
            type="checkbox"
            checked={qrisAccepted}
            onChange={(event) => setQrisAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-coffee"
          />
          <span className="text-sm font-semibold text-ink">
            Dana QRIS sudah diverifikasi masuk
          </span>
        </label>
      )}

      {invalidAmount && (
        <p className="text-xs font-medium text-warning">
          Tambahkan setidaknya satu pesanan aktif sebelum pembayaran.
        </p>
      )}
      <Button
        onClick={confirmPayment}
        disabled={submitting !== null || invalidCash || invalidQris}
        className="w-full"
      >
        {submitting === "payment" && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        Konfirmasi Pembayaran {method}
      </Button>
    </div>
  );
}
