"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  getAvailableTransitions,
  type CanonicalOrderStatus,
  type OrderStatus,
  type UserRole,
} from "@/lib/orders/status-machine";
import { STATUS_CONFIG } from "@/lib/orders/status-config";
import { updateOrderStatus } from "@/app/admin/(dashboard)/orders/actions";
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

const ACTION_LABELS: Record<
  Exclude<CanonicalOrderStatus, "NEW" | "CANCELLED">,
  string
> = {
  PREPARING: "Mulai Siapkan",
  READY: "Tandai Siap",
  SERVED: "Tandai Disajikan",
};

export function OrderActions({
  orderId,
  currentStatus,
  userRole,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  userRole: UserRole;
}) {
  const [updatingTarget, setUpdatingTarget] =
    useState<CanonicalOrderStatus | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const availableTransitions = getAvailableTransitions(currentStatus, userRole);

  async function handleStatusChange(
    targetStatus: CanonicalOrderStatus,
    reason?: string
  ) {
    setUpdatingTarget(targetStatus);
    const result = await updateOrderStatus(orderId, targetStatus, reason);
    setUpdatingTarget(null);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Pembaruan Gagal",
        description: result.error,
      });
      router.refresh();
      return;
    }

    toast({
      title: "Pesanan Diperbarui",
      description: `Status diubah menjadi ${STATUS_CONFIG[targetStatus].label}.`,
    });
    setCancelDialogOpen(false);
    setCancelReason("");
    router.refresh();
  }

  if (availableTransitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {(["PREPARING", "READY", "SERVED"] as const).map((target) =>
        availableTransitions.includes(target) ? (
          <Button
            key={target}
            onClick={() => handleStatusChange(target)}
            disabled={updatingTarget !== null}
            variant={target === "SERVED" ? "outline" : "default"}
          >
            {updatingTarget === target && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {ACTION_LABELS[target]}
          </Button>
        ) : null
      )}

      {availableTransitions.includes("CANCELLED") && (
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogTrigger
            render={<Button variant="destructive">Batalkan Pesanan</Button>}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Batalkan Pesanan
              </DialogTitle>
              <DialogDescription>
                Pembatalan bersifat final dan wajib disertai alasan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <label htmlFor="cancel-reason" className="text-sm font-medium">
                Alasan pembatalan
              </label>
              <Textarea
                id="cancel-reason"
                required
                placeholder="Jelaskan alasan pesanan dibatalkan"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
                disabled={updatingTarget !== null}
              >
                Pertahankan Pesanan
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("CANCELLED", cancelReason)}
                disabled={updatingTarget !== null || !cancelReason.trim()}
              >
                {updatingTarget === "CANCELLED" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Konfirmasi Pembatalan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
