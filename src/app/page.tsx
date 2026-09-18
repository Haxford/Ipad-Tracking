"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { actions } from "@/lib/store";
import {
  CategoryPill,
  IpadStatusPill,
  PriorityPill,
  RequesterPill,
  StatusPill,
} from "@/components/Badges";
import { slaState, ticketScore, isStaleLoan } from "@/lib/algo";
import { downloadCsv, formatRelative } from "@/lib/utils";

export default function DashboardPage() {
  const { ipads, tickets, bookings, settings } = useStore();

  const openTickets = tickets.filter(
    (t) => t.status !== "closed" && t.status !== "resolved"
  );
  const overdue = openTickets.filter(
    (t) => slaState(t).color === "over"
  );
  const todaysQueue = useMemo(
    () =>
      [...openTickets]
        .sort((a, b) => ticketScore(b, settings) - ticketScore(a, settings))
        .slice(0, 8),
    [openTickets, settings]
  );
  const inStock = ipads.filter((i) => i.status === "in_stock").length;
  const loaned = ipads.filter((i) => i.status === "loaned").length;
  const broken = ipads.filter((i) => i.status === "broken").length;
  const inRepair = ipads.filter((i) => i.status === "sent_for_repair").length;
  const setup = ipads.filter((i) => i.status === "needs_setup").length;
  const staleLoans = ipads.filter((i) => isStaleLoan(i, settings));
  const pendingBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "checked_out"
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Home</h1>
          <p className="text-[13px] muted">
            Smart queue sorted by priority, SLA pressure, and staleness.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn"
            onClick={() => {
              const rows = [
                ["Asset", "Serial", "Model", "Year", "Status", "Assigned to", "Location", "Notes"],
                ...ipads.map((i) => [
                  i.assetTag ?? "",
                  i.serial,
                  i.model,
                  String(i.year),
                  i.status,
                  i.assignedTo ?? "",
                  i.location ?? "",
                  (i.notes ?? "").replace(/\n/g, " "),
                ]),
              ];
              downloadCsv("ipads.csv", rows);
            }}
          >
            Export inventory
          </button>
          <Link href="/tickets/new" className="btn btn-primary">New ticket</Link>
        </div>
      </div>

      {/* KPI row */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Kpi label="Open" value={openTickets.length} sub={`${overdue.length} overdue`} tone={overdue.length ? "danger" : "neutral"} />
        <Kpi label="In stock" value={inStock} sub={`${loaned} loaned`} />
        <Kpi label="Needs setup" value={setup} tone={setup ? "warning" : "neutral"} />
        <Kpi label="Broken" value={broken} tone={broken ? "danger" : "neutral"} />
        <Kpi label="In repair" value={inRepair} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Smart queue */}
        <div className="surface lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[14px]">Today's work</h2>
              <span className="pill prio-low">Smart queue</span>
            </div>
            <Link href="/tickets" className="text-[12px] link">All tickets →</Link>
          </div>
          {todaysQueue.length === 0 ? (
            <div className="p-8 text-center text-[13px] muted">
              All clear. Nothing to do right now.
            </div>
          ) : (
            <ul>
              {todaysQueue.map((t) => {
                const sla = slaState(t);
                const ipad = ipads.find((i) => i.id === t.ipadId);
                return (
                  <li
                    key={t.id}
                    className="px-4 py-3 flex items-center gap-3 hover-row border-b border-[var(--border)] last:border-0"
                  >
                    <Link
                      href={`/tickets/${t.id}`}
                      className="text-mono text-[11px] muted hover:text-[var(--accent)] w-16 shrink-0"
                    >
                      {t.id}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="font-medium text-[13.5px] hover:text-[var(--accent)] truncate block"
                      >
                        {t.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-[11.5px] muted">
                        <RequesterPill t={t.requesterType} />
                        <span className="truncate">{t.requester}</span>
                        {ipad && (
                          <>
                            <span>·</span>
                            <Link
                              href={`/ipads/${ipad.id}`}
                              className="text-mono hover:text-[var(--accent)]"
                            >
                              {ipad.assetTag ?? ipad.serial}
                            </Link>
                          </>
                        )}
                        {t.category && (
                          <>
                            <span>·</span>
                            <CategoryPill c={t.category} />
                          </>
                        )}
                      </div>
                    </div>
                    <PriorityPill p={t.priority} />
                    <span className={`pill sla-${sla.color}`}>{sla.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* Inventory breakdown */}
          <div className="surface">
            <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[14px]">iPad inventory</h2>
              <Link href="/ipads" className="text-[12px] link">All →</Link>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                ["in_stock", inStock],
                ["loaned", loaned],
                ["needs_setup", setup],
                ["broken", broken],
                ["sent_for_repair", inRepair],
              ].map(([s, n]) => (
                <Link
                  key={s as string}
                  href={`/ipads?status=${s}`}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md hover-row"
                >
                  <IpadStatusPill s={s as any} />
                  <span className="text-mono text-[12px] muted">{n}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Stale loans */}
          {staleLoans.length > 0 && (
            <div className="surface">
              <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[14px]">Stale loans</h2>
                <span className="pill prio-high">{staleLoans.length}</span>
              </div>
              <ul className="p-3 space-y-1.5">
                {staleLoans.slice(0, 5).map((i) => (
                  <li key={i.id} className="flex items-center gap-2 text-[13px]">
                    <Link
                      href={`/ipads/${i.id}`}
                      className="text-mono text-[12px] hover:text-[var(--accent)]"
                    >
                      {i.assetTag ?? i.serial}
                    </Link>
                    <span className="flex-1 truncate">{i.assignedTo}</span>
                    <span className="muted text-[11px]">
                      {i.loanedSince && formatRelative(i.loanedSince)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upcoming bookings */}
          <div className="surface">
            <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[14px]">Upcoming bookings</h2>
              <Link href="/bookings" className="text-[12px] link">All →</Link>
            </div>
            {pendingBookings.length === 0 ? (
              <div className="p-6 text-center text-[13px] muted">No bookings.</div>
            ) : (
              <ul className="p-3 space-y-1.5">
                {pendingBookings.slice(0, 5).map((b) => {
                  const ipad = ipads.find((i) => i.id === b.ipadId);
                  return (
                    <li key={b.id} className="flex items-center gap-2 text-[13px]">
                      <span
                        className={`pill ${
                          b.status === "pending" ? "prio-high" : "tstat-in_progress"
                        }`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                      <span className="flex-1 truncate">{b.requester}</span>
                      <span className="text-mono text-[11px] muted">
                        {ipad?.assetTag ?? "—"}
                      </span>
                      <span className="muted text-[11px]">
                        {formatRelative(b.neededBy)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const c =
    tone === "danger"
      ? "text-[color:var(--danger)]"
      : tone === "warning"
      ? "text-[color:var(--warning)]"
      : "";
  return (
    <div className="surface px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider muted">{label}</div>
      <div className={`mt-1 text-[22px] font-semibold leading-none ${c}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] muted">{sub}</div>}
    </div>
  );
}
