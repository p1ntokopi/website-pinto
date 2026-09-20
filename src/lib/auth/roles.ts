/**
 * Pure role predicates. Kept free of server imports so they can run in client
 * components and in unit tests.
 *
 * The database enum still carries the legacy `staff` and `kitchen` labels, but
 * the shop operates on two practical roles: `admin` (doubles as cashier and
 * kitchen) and `owner`.
 */
export type UserRole = "admin" | "staff" | "kitchen" | "owner";

/** Anyone who may use the operational dashboard. */
export const OPERATIONAL_ROLES: readonly UserRole[] = [
  "admin",
  "staff",
  "kitchen",
  "owner",
];

/** Anyone who may take payment or build an order. Kitchen is excluded. */
export const CASHIER_ROLES: readonly UserRole[] = [
  "admin",
  "staff",
  "owner",
];

/** Catalog, table, and upload administration. Mirrors the DB `is_admin()`. */
export const ADMIN_ROLES: readonly UserRole[] = ["admin", "owner"];

/** Anyone who may see the kitchen display and advance cooking states. */
export const KITCHEN_ROLES: readonly UserRole[] = [
  "admin",
  "kitchen",
  "owner",
];

export function isOwnerRole(role: string | null | undefined): boolean {
  return role === "owner";
}

export function isOperationalRole(role: string | null | undefined): boolean {
  return OPERATIONAL_ROLES.includes(role as UserRole);
}

export function isCashierRole(role: string | null | undefined): boolean {
  return CASHIER_ROLES.includes(role as UserRole);
}

export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

export function isKitchenRole(role: string | null | undefined): boolean {
  return KITCHEN_ROLES.includes(role as UserRole);
}

/**
 * Archiving an order is destructive and owner-only. This mirrors the
 * `admin_delete_order` RPC, which is the real enforcement point — the UI check
 * only decides whether the action is offered at all.
 */
export function canDeleteOrder(role: string | null | undefined): boolean {
  return role === "owner";
}

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "kitchen":
      return "Dapur";
    default:
      return "Staf";
  }
}