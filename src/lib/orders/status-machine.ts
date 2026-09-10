export type CanonicalOrderStatus =
  "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
export type LegacyOrderStatus =
  "PENDING_PAYMENT" | "PENDING" | "CONFIRMED" | "COMPLETED";
export type OrderStatus = CanonicalOrderStatus | LegacyOrderStatus;
export type UserRole = "admin" | "staff" | "kitchen" | "owner";

const LEGACY_STATUS_MAP: Record<LegacyOrderStatus, CanonicalOrderStatus> = {
  PENDING_PAYMENT: "NEW",
  PENDING: "NEW",
  CONFIRMED: "NEW",
  COMPLETED: "SERVED",
};

const TRANSITIONS: Record<CanonicalOrderStatus, CanonicalOrderStatus[]> = {
  NEW: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: [],
  CANCELLED: [],
};

const ROLE_TARGETS: Record<UserRole, CanonicalOrderStatus[]> = {
  admin: ["PREPARING", "READY", "SERVED", "CANCELLED"],
  owner: ["PREPARING", "READY", "SERVED", "CANCELLED"],
  staff: ["PREPARING", "SERVED", "CANCELLED"],
  kitchen: ["PREPARING", "READY"],
};

export function normalizeOrderStatus(
  status: OrderStatus
): CanonicalOrderStatus {
  return (
    LEGACY_STATUS_MAP[status as LegacyOrderStatus] ??
    (status as CanonicalOrderStatus)
  );
}

export function canTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  role: UserRole
): boolean {
  const current = normalizeOrderStatus(currentStatus);
  const target = normalizeOrderStatus(targetStatus);

  if (current === target || !ROLE_TARGETS[role].includes(target)) return false;
  return TRANSITIONS[current].includes(target);
}

export function getAvailableTransitions(
  currentStatus: OrderStatus,
  role: UserRole
): CanonicalOrderStatus[] {
  const current = normalizeOrderStatus(currentStatus);
  return TRANSITIONS[current].filter((target) =>
    ROLE_TARGETS[role].includes(target)
  );
}
