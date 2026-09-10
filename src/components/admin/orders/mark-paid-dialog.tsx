"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  confirmCashierPayment,
  type ManualPaymentMethod,
} from "@/app/admin/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `payment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

/** Cashier-observed manual payment; it never invokes an external payment provider. */
export function MarkPaidDialog({
  orderId,
  amount,
}: {
  orderId: string;
  amount: number;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<ManualPaymentMethod>("CASH");
  const [cashReceived, setCashReceived] = useState(String(amount));
  const [qrisAccepted, setQrisAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef(createRequestId());
  const router = useRouter();
  const { toast } = useToast();

  const cashValue = Number(cashReceived || 0);
  const change = useMemo(
    () => Math.max(0, cashValue - amount),
    [cashValue, amount]
  );
  const invalidCash =
    method === "CASH" && (!Number.isFinite(cashValue) || cashValue < amount);
  const invalidQris = method === "QRIS" && !qrisAccepted;

  async function submit() {
    if (invalidCash || invalidQris) return;
    setSubmitting(true);
    const result = await confirmCashierPayment(orderId, {
      method,
      amount,
      requestId: requestIdRef.current,
      cashReceived: method === "CASH" ? cashValue : null,
      qrisAccepted: method === "QRIS" ? qrisAccepted : false,
    });
    setSubmitting(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: result.error,
      });
      return;
    }

    toast({
      title: "Pembayaran Dikonfirmasi",
      description: result.receiptNumber
        ? `${method === "CASH" ? `Kembalian ${formatIDR(result.change ?? change)}. ` : ""}Struk ${result.receiptNumber} siap dicetak.`
        : method === "CASH"
          ? `Kembalian ${formatIDR(result.change ?? change)}.`
          : "Penerimaan QRIS dicatat.",
    });
    setOpen(false);
    if (result.receiptPath) {
      router.push(result.receiptPath);
      return;
    }
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="border-success/30 bg-success/5 text-success hover:bg-success/10 hover:text-success"
          >
            <Banknote className="h-4 w-4" />
            Konfirmasi Pembayaran
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Konfirmasi Pembayaran Manual
          </DialogTitle>
          <DialogDescription>
            Pastikan dana benar-benar sudah diterima. Total tagihan{" "}
            {formatIDR(amount)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label="Metode pembayaran"
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
                    "flex min-h-12 items-center justify-center gap-2 rounded-sm border px-4 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
                    method === option.value
                      ? "border-coffee bg-coffee text-paper"
                      : "border-border-custom bg-paper text-muted-text hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          {method === "CASH" ? (
            <div className="space-y-3">
              <label className="block space-y-1.5 text-sm font-semibold text-ink">
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
              <div className="flex items-center justify-between rounded-sm bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-text">Kembalian</span>
                <strong className="text-ink">{formatIDR(change)}</strong>
              </div>
              {invalidCash && (
                <p className="text-xs font-medium text-destructive">
                  Uang diterima kurang dari total.
                </p>
              )}
            </div>
          ) : (
            <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border-custom p-3">
              <input
                type="checkbox"
                checked={qrisAccepted}
                onChange={(event) => setQrisAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-coffee"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  Dana QRIS sudah diterima
                </span>
                <span className="mt-0.5 block text-xs text-muted-text">
                  Saya sudah memverifikasi pembayaran pada perangkat/aplikasi
                  merchant.
                </span>
              </span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || invalidCash || invalidQris}
          >
            {submitting && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Konfirmasi {method}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
