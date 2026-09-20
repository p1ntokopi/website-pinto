"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteOrder } from "@/app/admin/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export type DeleteOrderTarget = {
  id: string;
  orderNumber: string;
  customerName?: string | null;
  tableLabel?: string | null;
  totalLabel: string;
};

/**
 * Owner-only order archival. The confirmation names the order so a destructive
 * click can never target the wrong row, and the RPC re-checks the owner role
 * regardless of what this dialog renders.
 */
export function DeleteOrderDialog({
  order,
  onDeleted,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  order: DeleteOrderTarget;
  onDeleted?: () => void;
  trigger?: React.ReactNode;
  /** Controlled mode — used when the trigger lives inside an overflow menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }

  async function handleDelete() {
    setPending(true);
    const result = await deleteOrder(order.id, reason);
    setPending(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Penghapusan Gagal",
        description: result.error,
      });
      return;
    }

    toast({
      title: "Pesanan Dihapus",
      description: `Pesanan ${order.orderNumber} dihapus dari daftar operasional.`,
    });
    setOpen(false);
    setReason("");
    onDeleted?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : controlledOpen === undefined ? (
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Hapus pesanan">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
        />
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus pesanan ini?</DialogTitle>
          <DialogDescription>
            Pesanan {order.orderNumber} akan dihapus dari daftar operasional.
            Riwayat pembayaran dan struk tetap tersimpan.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm bg-muted/40 px-4 py-3 text-sm">
          <dt className="text-muted-text">Nomor</dt>
          <dd className="text-right font-semibold text-ink">
            {order.orderNumber}
          </dd>
          <dt className="text-muted-text">Pelanggan</dt>
          <dd className="text-right font-medium text-ink">
            {order.customerName ?? "Tanpa nama"}
          </dd>
          <dt className="text-muted-text">Meja</dt>
          <dd className="text-right font-medium text-ink">
            {order.tableLabel ?? "Bawa pulang"}
          </dd>
          <dt className="text-muted-text">Total</dt>
          <dd className="text-right font-semibold text-ink">
            {order.totalLabel}
          </dd>
        </dl>
        <div className="space-y-2">
          <label htmlFor={`delete-reason-${order.id}`} className="text-sm font-medium">
            Alasan penghapusan
          </label>
          <Textarea
            id={`delete-reason-${order.id}`}
            required
            placeholder="Contoh: pesanan ganda, salah input meja"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={pending || !reason.trim()}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus Pesanan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}