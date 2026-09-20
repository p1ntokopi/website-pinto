import { describe, expect, it } from "vitest";
import {
  canDeleteOrder,
  isAdminRole,
  isCashierRole,
  isKitchenRole,
  isOperationalRole,
  isOwnerRole,
  roleLabel,
} from "@/lib/auth/roles";

describe("role predicates", () => {
  it("treats owner as the single privileged role", () => {
    expect(isOwnerRole("owner")).toBe(true);
    expect(isOwnerRole("admin")).toBe(false);
    expect(isOwnerRole("staff")).toBe(false);
    expect(isOwnerRole(null)).toBe(false);
  });

  it("mirrors the database is_admin() helper (admin or owner)", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("owner")).toBe(true);
    expect(isAdminRole("staff")).toBe(false);
    expect(isAdminRole("kitchen")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  it("keeps kitchen out of payment operations", () => {
    expect(isCashierRole("kitchen")).toBe(false);
    expect(isCashierRole("staff")).toBe(true);
    expect(isKitchenRole("kitchen")).toBe(true);
    expect(isKitchenRole("staff")).toBe(false);
  });

  it("lets every known role use the operational dashboard", () => {
    for (const role of ["admin", "staff", "kitchen", "owner"]) {
      expect(isOperationalRole(role)).toBe(true);
    }
    expect(isOperationalRole("guest")).toBe(false);
  });
});

describe("canDeleteOrder", () => {
  it("is owner-only", () => {
    expect(canDeleteOrder("owner")).toBe(true);
    expect(canDeleteOrder("admin")).toBe(false);
    expect(canDeleteOrder("staff")).toBe(false);
    expect(canDeleteOrder("kitchen")).toBe(false);
    expect(canDeleteOrder(null)).toBe(false);
  });
});

describe("roleLabel", () => {
  it("names owner correctly so it is never mistaken for staff", () => {
    expect(roleLabel("owner")).toBe("Owner");
    expect(roleLabel("admin")).toBe("Admin");
    expect(roleLabel("kitchen")).toBe("Dapur");
    expect(roleLabel("staff")).toBe("Staf");
    expect(roleLabel(null)).toBe("Staf");
  });
});