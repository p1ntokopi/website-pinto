import { describe, expect, it } from "vitest";
import {
  canTransition,
  getAvailableTransitions,
  normalizeOrderStatus,
} from "@/lib/orders/status-machine";

describe("status-machine", () => {
  it("follows NEW -> PREPARING -> READY -> SERVED without skipping", () => {
    expect(canTransition("NEW", "PREPARING", "admin")).toBe(true);
    expect(canTransition("PREPARING", "READY", "kitchen")).toBe(true);
    expect(canTransition("READY", "SERVED", "staff")).toBe(true);
    expect(canTransition("NEW", "READY", "admin")).toBe(false);
    expect(canTransition("PREPARING", "SERVED", "admin")).toBe(false);
    expect(canTransition("SERVED", "NEW", "admin")).toBe(false);
  });

  it("rejects same-status transitions", () => {
    expect(canTransition("NEW", "NEW", "admin")).toBe(false);
    expect(canTransition("READY", "READY", "staff")).toBe(false);
  });

  it("limits operational targets by role", () => {
    expect(canTransition("NEW", "PREPARING", "staff")).toBe(true);
    expect(canTransition("NEW", "PREPARING", "kitchen")).toBe(true);
    expect(canTransition("PREPARING", "READY", "staff")).toBe(false);
    expect(canTransition("READY", "SERVED", "kitchen")).toBe(false);
    expect(canTransition("READY", "SERVED", "owner")).toBe(true);
  });

  it("permits cancellation only before a terminal status", () => {
    expect(canTransition("NEW", "CANCELLED", "admin")).toBe(true);
    expect(canTransition("PREPARING", "CANCELLED", "staff")).toBe(true);
    expect(canTransition("READY", "CANCELLED", "admin")).toBe(true);
    expect(canTransition("SERVED", "CANCELLED", "admin")).toBe(false);
    expect(canTransition("CANCELLED", "NEW", "admin")).toBe(false);
    expect(canTransition("NEW", "CANCELLED", "kitchen")).toBe(false);
  });

  it("normalizes legacy database statuses for read compatibility", () => {
    expect(normalizeOrderStatus("PENDING_PAYMENT")).toBe("NEW");
    expect(normalizeOrderStatus("PENDING")).toBe("NEW");
    expect(normalizeOrderStatus("CONFIRMED")).toBe("NEW");
    expect(normalizeOrderStatus("COMPLETED")).toBe("SERVED");
    expect(canTransition("CONFIRMED", "PREPARING", "kitchen")).toBe(true);
    expect(getAvailableTransitions("COMPLETED", "admin")).toEqual([]);
  });

  it("lists actionable canonical next steps", () => {
    expect(getAvailableTransitions("NEW", "admin")).toEqual([
      "PREPARING",
      "CANCELLED",
    ]);
    expect(getAvailableTransitions("PREPARING", "kitchen")).toEqual(["READY"]);
    expect(getAvailableTransitions("READY", "staff")).toEqual([
      "SERVED",
      "CANCELLED",
    ]);
  });
});
