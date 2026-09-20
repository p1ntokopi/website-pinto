"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, MoreHorizontal, Trash2, XCircle } from "lucide-react";
import {
  getAvailableTransitions,
  type CanonicalOrderStatus,
  type OrderStatus,
  type UserRole,
} from "@/lib/orders/status-machine";
import { canDeleteOrder } from "@/lib/auth/roles";
import { STATUS_CONFIG } from "@/lib/orders/status-config";
import { updateOrderStatus } from "@/app/admin/(dashboard)/orders/actions";
import { DeleteOrderDialog } from "@/components/admin/orders/delete-order-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FORWARD_STATUSES = ["PREPARING", "READY", "SERVED"] as const;

const ACTION_LABELS: Record<(typeof FORWARD_STATUSES)[number], string> = {
  PREPARING: "Mulai Siapkan",
  READY: "Tandai Siap",
  SERVED: "Tandai Disajikan",
};

export type OrderActionSummary = {
  orderNumber: string;
  customerName?: string | null;
  tableLabel?: string | null;
  totalLabel: string;
};

/**
 * Status transitions and destructive actions for a single order.
 *
 * The forward workflow is the primary action; cancellation and deletion are
 * deliberately demoted into an overflow menu so a mis-tap beside "Tandai Siap"
 * cannot cancel or erase an order.
 */
export function OrderActions({
  orderId,
  currentStatus,
  userRole,
  order,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  userRole: UserRole;
  order: OrderActionSummary;
}) {
  const [updatingTarget, setUpdatingTarget] =
    useState<CanonicalOrderStatus | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const availableTransitions = getAvailableTransitions(currentStatus, userRole);
  const ownerCanDelete = canDeleteOrder(userRole);

  const forwardTransitions = FORWARD_STATUSES.filter((target) =>
    availableTransitions.includes(target)
  );
  const [primaryTransition, ...secondaryTransitions] = forwardTransitions;
  const canCancel = availableTransitions.includes("CANCELLED");
  const hasOverflowActions = canCancel || ownerCanDelete;

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      {primaryTransition && (
        <Button
          onClick={() => handleStatusChange(primaryTransition)}
          disabled={updatingTarget !== null}
          className="min-h-11"
        >
          {updatingTarget === primaryTransition && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {ACTION_LABELS[primaryTransition]}
        </Button>
      )}

      {secondaryTransitions.map((target) => (
        <Button
          key={target}
          onClick={() => handleStatusChange(target)}
          disabled={updatingTarget !== null}
          variant="outline"
          className="min-h-11"
        >
          {updatingTarget === target && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {ACTION_LABELS[target]}
        </Button>
      ))}

      {hasOverflowActions && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label="Aksi lainnya"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {canCancel && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="h-4 w-4" />
                Batalkan Pesanan
              </DropdownMenuItem>
            )}
            {ownerCanDelete && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Hapus Pesanan
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
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

      {ownerCanDelete && (
        <DeleteOrderDialog
          order={{
            id: orderId,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            tableLabel: order.tableLabel,
            totalLabel: order.totalLabel,
          }}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}
    </div>
  );
}