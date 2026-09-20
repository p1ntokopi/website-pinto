import {
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  CreditCard,
  Package,
  XCircle,
} from "lucide-react";

import type { OrderStatus } from "@/lib/orders/status-machine";

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  NEW: {
    label: "Baru",
    color: "bg-info/10 text-info border-info/25",
    icon: Clock,
  },
  PREPARING: {
    label: "Diproses",
    color: "bg-coffee/10 text-coffee border-coffee/25",
    icon: Coffee,
  },
  READY: {
    label: "Siap",
    color: "bg-success/10 text-success border-success/25",
    icon: Package,
  },
  SERVED: {
    label: "Disajikan",
    color: "bg-muted text-muted-foreground border-border",
    icon: Check,
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "bg-destructive/10 text-destructive border-destructive/25",
    icon: XCircle,
  },
  PENDING_PAYMENT: {
    label: "Baru",
    color: "bg-info/10 text-info border-info/25",
    icon: CreditCard,
  },
  PENDING: {
    label: "Baru",
    color: "bg-info/10 text-info border-info/25",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Baru",
    color: "bg-info/10 text-info border-info/25",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Disajikan",
    color: "bg-muted text-muted-foreground border-border",
    icon: Check,
  },
};
