"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  CategoryPill,
  PriorityPill,
  RequesterPill,
  StatusPill,
} from "@/components/Badges";
import { formatRelative } from "@/lib/utils";
import { slaState, ticketScore } from "@/lib/algo";

type View = "list" | "board" | "queue";
const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;

export default function TicketsPage() {
  const { tickets, ipads, settings } = useStore();
  const [view, setView] = useState<View>("queue");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (typeFilter !== "all" && t.requesterType !== typeFilter) return false;
      if (!showResolved && (t.status === "resolved" || t.status === "closed")) return false;
      if (!needle) return true;
      const ipad = ipads.find((i) => i.id === t.ipadId);
      const hay = [
        t.id,
        t.title,
        t.description,
        t.requester,
        t.assignee ?? "",
        ipad?.serial ?? "",
        ipad?.assetTag ?? "",
        t.category ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [tickets, ipads, q, statusFilter, priorityFilter, typeFilter, showResolved]);

  const queue = useMemo(
    () => [...filtered].sort((a, b) => ticketScore(b, settings) - ticketScore(a, settings)),
    [filtered, settings]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Tickets</h1>
          <p className="text-[13px] muted">
            {filtered.length} ticket{filtered.length === 1 ? "" : "s"}
            {filtered.length !== tickets.length && ` of ${tickets.length}`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="surface p-0.5 flex">
            {(["queue", "list", "board"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`btn btn-sm btn-ghost ${view === v ? "bg-[var(--accent-soft)] text-[var(--accent)]" : ""}`}
              >
                {v === "queue" ? "Smart queue" : v === "list" ? "List" : "Board"}
              </button>
            ))}
          </div>
          <Link href="/tickets/new" className="btn btn-primary">New ticket</Link>
        </div>
      </div>

      <div className="surface p-2 flex flex-wrap gap-2 items-center">
        <input
          className="input max-w-xs"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select className="select w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select className="select w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All requesters</option>
          <option value="staff">Staff</option>
          <option value="student">Student</option>
        </select>
        <label className="inline-flex items-center gap-2 text-[12px] muted ml-auto">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          Show resolved/closed
        </label>
      </div>

      {view === "queue" && <Queue tickets={queue} ipads={ipads} />}
      {view === "list" && <List tickets={filtered} ipads={ipads} />}
      {view === "board" && <Board tickets={filtered} ipads={ipads} />}
    </div>
  );
}

function Queue({ tickets, ipads }: { tickets: any[]; ipads: any[] }) {
  if (tickets.length === 0) {
    return <div className="surface p-10 text-center muted text-[13px]">No tickets match.</div>;
  }
  return (
    <div className="surface overflow-hidden">
      <ul>
        {tickets.map((t) => {
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
                  className="font-medium text-[14px] hover:text-[var(--accent)] truncate block"
                >
                  {t.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5 text-[11.5px] muted">
                  <RequesterPill t={t.requesterType} />
                  <span className="truncate">{t.requester}</span>
                  {ipad && (
                    <>
                      <span>·</span>
                      <span className="text-mono">{ipad.assetTag ?? ipad.serial}</span>
                    </>
                  )}
                  {t.category && (
                    <>
                      <span>·</span>
                      <CategoryPill c={t.category} />
                    </>
                  )}
                  <span>·</span>
                  <span>updated {formatRelative(t.updatedAt)}</span>
                </div>
              </div>
              <PriorityPill p={t.priority} />
              <StatusPill s={t.status} />
              <span className={`pill sla-${sla.color}`}>{sla.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function List({ tickets, ipads }: { tickets: any[]; ipads: any[] }) {
  return (
    <div className="surface overflow-hidden">
      <table className="tbl">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Requester</th>
            <th>iPad</th>
            <th>Priority</th>
            <th>Status</th>
            <th>SLA</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-10 muted">No tickets match.</td>
            </tr>
          )}
          {tickets.map((t) => {
            const sla = slaState(t);
            const ipad = ipads.find((i) => i.id === t.ipadId);
            return (
              <tr key={t.id}>
                <td>
                  <Link href={`/tickets/${t.id}`} className="text-mono text-[12px] link">
                    {t.id}
                  </Link>
                </td>
                <td>
                  <Link href={`/tickets/${t.id}`} className="font-medium hover:text-[var(--accent)]">
                    {t.title}
                  </Link>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <RequesterPill t={t.requesterType} />
                    <span>{t.requester}</span>
                  </div>
                </td>
                <td>
                  {ipad ? (
                    <Link href={`/ipads/${ipad.id}`} className="text-mono text-[12px] hover:text-[var(--accent)]">
                      {ipad.assetTag ?? ipad.serial}
                    </Link>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td><PriorityPill p={t.priority} /></td>
                <td><StatusPill s={t.status} /></td>
                <td><span className={`pill sla-${sla.color}`}>{sla.label}</span></td>
                <td className="muted">{formatRelative(t.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Board({ tickets, ipads }: { tickets: any[]; ipads: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {STATUSES.map((s) => {
        const list = tickets
          .filter((t) => t.status === s)
          .sort((a, b) => ticketScore(b, { priorityWeights: { urgent: 100, high: 60, normal: 30, low: 10 }, stalenessWeightPerDay: 2 } as any) - ticketScore(a, { priorityWeights: { urgent: 100, high: 60, normal: 30, low: 10 }, stalenessWeightPerDay: 2 } as any));
        return (
          <div key={s} className="surface p-2 min-h-[200px]">
            <div className="flex items-center justify-between px-1 pb-2">
              <StatusPill s={s} />
              <span className="text-[11px] muted">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.length === 0 && <div className="text-[11px] muted text-center py-4">Empty</div>}
              {list.map((t) => {
                const sla = slaState(t);
                const ipad = ipads.find((i) => i.id === t.ipadId);
                return (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="block surface p-2.5 hover:border-[var(--accent)] transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-mono text-[10px] muted">{t.id}</span>
                      <PriorityPill p={t.priority} />
                    </div>
                    <div className="text-[13px] font-medium leading-snug line-clamp-2">{t.title}</div>
                    <div className="mt-1.5 flex items-center justify-between text-[10.5px] muted">
                      <span className="truncate">{t.requester}</span>
                      <span className={`pill sla-${sla.color}`}>{sla.label}</span>
                    </div>
                    {ipad && (
                      <div className="mt-1 text-[10px] text-mono muted">
                        {ipad.assetTag ?? ipad.serial}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
