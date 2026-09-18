// Algorithms: smart queue scoring, routing, automation helpers.

import type { AppSettings, Ipad, RoutingRule, Ticket } from "./types";

/**
 * Smart queue score:
 *   score = priorityWeight
 *         + (sla pressure × 40)
 *         + (days since update × stalenessWeight)
 *         + (urgent ? 25 : 0)
 *
 * Higher = pick me first.
 */
export function ticketScore(t: Ticket, settings: AppSettings): number {
  const now = Date.now();
  const priorityWeight = settings.priorityWeights[t.priority] ?? 10;
  const due = new Date(t.slaDueAt).getTime();
  const hoursToDue = (due - now) / 36e5;
  // SLA pressure: 0 when >=24h to spare, up to 40 if overdue 48h+
  const slaPressure = Math.max(0, Math.min(40, (24 - hoursToDue) * 1.2));
  const daysSinceUpdate = (now - new Date(t.updatedAt).getTime()) / 86_400_000;
  const staleness = daysSinceUpdate * settings.stalenessWeightPerDay;
  const urgentBoost = t.urgent ? 25 : 0;
  return priorityWeight + slaPressure + staleness + urgentBoost;
}

export function slaState(t: Ticket): {
  label: string;
  color: "ok" | "warn" | "over" | "met";
  hoursToDue: number;
} {
  if (t.resolvedAt) {
    const due = new Date(t.slaDueAt).getTime();
    const res = new Date(t.resolvedAt).getTime();
    return {
      label: res <= due ? "SLA met" : "SLA missed",
      color: res <= due ? "met" : "over",
      hoursToDue: (due - res) / 36e5,
    };
  }
  const due = new Date(t.slaDueAt).getTime();
  const hoursToDue = (due - Date.now()) / 36e5;
  if (hoursToDue < 0) return { label: "Overdue", color: "over", hoursToDue };
  if (hoursToDue < 6) return { label: "Due soon", color: "warn", hoursToDue };
  return { label: "On track", color: "ok", hoursToDue };
}

export function isStaleLoan(i: Ipad, settings: AppSettings): boolean {
  if (i.status !== "loaned" || !i.loanedSince) return false;
  const days = (Date.now() - new Date(i.loanedSince).getTime()) / 86_400_000;
  return days > settings.staleLoanDays;
}

/**
 * Auto-routing: given a draft ticket, return the highest-priority rule that
 * matches and any suggested changes.
 */
export function applyRouting(
  ticket: Pick<
    Ticket,
    "requesterType" | "priority" | "category" | "ipadId" | "status"
  >,
  rules: RoutingRule[]
): { rule: RoutingRule | null; patch: Partial<Ticket> } {
  const enabled = rules.filter((r) => r.enabled);
  for (const rule of enabled) {
    const c = rule.conditions || {};
    if (c.requesterType && c.requesterType !== ticket.requesterType) continue;
    if (c.priority && c.priority !== ticket.priority) continue;
    if (c.category && c.category !== ticket.category) continue;
    const patch: Partial<Ticket> = {};
    if (rule.assignTo) patch.assignee = rule.assignTo;
    if (rule.setStatus) patch.status = rule.setStatus;
    if (rule.setPriority) patch.priority = rule.setPriority;
    return { rule, patch };
  }
  return { rule: null, patch: {} };
}

/**
 * Booking conflict: is this iPad already booked or out on overlapping dates?
 */
export function bookingConflict(
  ipadId: string,
  neededByIso: string,
  bookings: { ipadId: string; status: string; neededBy: string; returnedAt?: string; id: string }[],
  ignoreId?: string
): { conflict: boolean; withId?: string } {
  const t = new Date(neededByIso).getTime();
  for (const b of bookings) {
    if (b.ipadId !== ipadId) continue;
    if (b.id === ignoreId) continue;
    if (b.status === "cancelled" || b.status === "returned") continue;
    if (b.status === "checked_out") return { conflict: true, withId: b.id };
    const start = new Date(b.neededBy).getTime();
    const end = b.returnedAt ? new Date(b.returnedAt).getTime() : start + 7 * 86_400_000;
    if (t >= start && t <= end) return { conflict: true, withId: b.id };
  }
  return { conflict: false };
}
