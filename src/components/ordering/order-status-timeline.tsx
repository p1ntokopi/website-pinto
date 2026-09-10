"use client";

import {
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Package,
  TriangleAlert,
} from "lucide-react";

import type { DiningSessionSummary } from "@/app/t/[slug]/actions";
import { cn } from "@/lib/utils";

export type CustomerOrderStatus =
  | "NEW"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "PENDING_PAYMENT"
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

type DisplayStatus = "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

const STATUS_STEPS: {
  id: Exclude<DisplayStatus, "CANCELLED">;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "NEW",
    label: "Pesanan Diterima",
    description: "Pesanan masuk ke kasir.",
    icon: Clock,
  },
  {
    id: "PREPARING",
    label: "Sedang Dibuat",
    description: "Kasir menyiapkan pesanan.",
    icon: Coffee,
  },
  {
    id: "READY",
    label: "Siap Diantar",
    description: "Pesanan selesai dibuat.",
    icon: Package,
  },
  {
    id: "SERVED",
    label: "Sudah Diantar",
    description: "Pesanan telah sampai di meja.",
    icon: Check,
  },
];

export function normalizeCustomerOrderStatus(status: string): DisplayStatus {
  switch (status) {
    case "PENDING_PAYMENT":
    case "PENDING":
    case "CONFIRMED":
    case "NEW":
      return "NEW";
    case "PREPARING":
      return "PREPARING";
    case "READY":
      return "READY";
    case "COMPLETED":
    case "SERVED":
      return "SERVED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "NEW";
  }
}

export function OrderStatusTimeline({
  initialStatus,
  orderId,
  orderNumber,
  summary,
}: {
  initialStatus: CustomerOrderStatus;
  orderId: string;
  orderNumber: string;
  summary: DiningSessionSummary | null;
}) {
  const currentOrder = summary?.orders.find(
    (order) => order.order_number === orderNumber || order.id === orderId
  );
  const status = normalizeCustomerOrderStatus(
    currentOrder?.status ?? initialStatus
  );

  if (status === "CANCELLED") {
    return (
      <div
        className="rounded-lg bg-destructive/10 p-4 text-center text-destructive"
        role="status"
      >
        <TriangleAlert className="mx-auto mb-2 h-7 w-7" aria-hidden="true" />
        <p className="font-semibold">Pesanan Dibatalkan</p>
        <p className="mt-1 text-sm opacity-80">
          Hubungi kasir jika Anda memerlukan bantuan.
        </p>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex((step) => step.id === status);

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground" role="status">
        Status diperbarui otomatis saat halaman ini aktif.
      </p>
      <ol
        className="grid grid-cols-1 gap-3 text-left sm:grid-cols-4"
        aria-label="Status pesanan"
      >
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = isCompleted ? CheckCircle2 : step.icon;

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-lg border p-3 sm:block sm:min-h-32",
                isCurrent && "border-coffee/35 bg-coffee/10",
                isCompleted && "border-success/25 bg-success/5",
                !isCurrent &&
                  !isCompleted &&
                  "border-border/60 bg-muted/20 text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:mb-3",
                  isCurrent && "bg-coffee text-paper",
                  isCompleted && "bg-success text-white",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    (isCurrent || isCompleted) && "text-ink"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
