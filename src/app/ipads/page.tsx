"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { IpadStatusPill, RequesterPill } from "@/components/Badges";
import { formatRelative } from "@/lib/utils";
import { isStaleLoan } from "@/lib/algo";

const ALL_STATUSES = [
  "in_stock",
  "loaned",
  "needs_setup",
  "broken",
  "sent_for_repair",
  "retired",
] as const;

function Inner() {
  const { ipads, tickets, settings } = useStore();
  const search = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(search?.get("status") ?? "all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ipads.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (!needle) return true;
      return [
        i.serial,
        i.assetTag ?? "",
        i.model,
        String(i.year),
        i.assignedTo ?? "",
        i.location ?? "",
        i.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [ipads, q, status]);

  const openTicketsFor = (id: string) =>
    tickets.filter((t) => t.ipadId === id && t.status !== "closed" && t.status !== "resolved").length;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">iPads</h1>
          <p className="text-[13px] muted">
            {filtered.length} device{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/ipads/new" className="btn btn-primary">Add iPad</Link>
      </div>

      <div className="surface p-2 flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search serial, asset, model…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="surface overflow-hidden">
        <table className="tbl">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Model</th>
              <th>Year</th>
              <th>Status</th>
              <th>With</th>
              <th>Location</th>
              <th>Tickets</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 muted">No iPads match.</td></tr>
            )}
            {filtered.map((i) => {
              const stale = isStaleLoan(i, settings);
              return (
                <tr key={i.id}>
                  <td>
                    <Link href={`/ipads/${i.id}`} className="text-mono text-[12px] link">
                      {i.assetTag ?? i.serial}
                    </Link>
                    <div className="text-[11px] muted text-mono">{i.serial}</div>
                  </td>
                  <td>{i.model}</td>
                  <td className="text-mono text-[12px]">{i.year}</td>
                  <td className="flex items-center gap-1">
                    <IpadStatusPill s={i.status} />
                    {stale && <span className="pill prio-high" title="Loaned beyond stale threshold">stale</span>}
                  </td>
                  <td>
                    {i.assignedTo ? (
                      <div className="flex items-center gap-2">
                        {i.assignedToType && <RequesterPill t={i.assignedToType} />}
                        <span>{i.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="text-[12px] muted">{i.location ?? "—"}</td>
                  <td>
                    {openTicketsFor(i.id) > 0 ? (
                      <span className="pill prio-high">{openTicketsFor(i.id)} open</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="muted">{formatRelative(i.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IpadsPage() {
  return (
    <Suspense fallback={<div className="muted text-[13px]">Loading…</div>}>
      <Inner />
    </Suspense>
  );
}
