"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { actions, useStore } from "@/lib/store";
import { RequesterPill } from "@/components/Badges";
import { formatDateTime, formatRelative } from "@/lib/utils";

const STATUSES = ["pending", "checked_out", "returned", "cancelled"] as const;

export default function BookingsPage() {
  const { bookings, ipads, refresh } = useStore();
  const [status, setStatus] = useState<string>("all");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      bookings
        .filter((b) => (status === "all" ? true : b.status === status))
        .sort((a, b) => new Date(a.neededBy).getTime() - new Date(b.neededBy).getTime()),
    [bookings, status]
  );

  const checkOut = async (id: string) => {
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    setBusy(true);
    await actions.updateBooking(id, { status: "checked_out" });
    const ipad = ipads.find((i) => i.id === b.ipadId);
    if (ipad) {
      await actions.updateIpad(ipad.id, {
        status: "loaned",
        assignedTo: b.requester,
        assignedToType: b.requesterType,
        loanedSince: new Date().toISOString(),
      });
    }
    await refresh();
    setBusy(false);
  };
  const checkIn = async (id: string) => {
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    setBusy(true);
    await actions.updateBooking(id, { status: "returned", returnedAt: new Date().toISOString() });
    const ipad = ipads.find((i) => i.id === b.ipadId);
    if (ipad) {
      await actions.updateIpad(ipad.id, {
        status: "in_stock",
        assignedTo: undefined,
        assignedToType: undefined,
        loanedSince: undefined,
      });
    }
    await refresh();
    setBusy(false);
  };
  const cancel = async (id: string) => {
    setBusy(true);
    await actions.updateBooking(id, { status: "cancelled" });
    await refresh();
    setBusy(false);
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    setBusy(true);
    await actions.deleteBooking(id);
    await refresh();
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Bookings</h1>
          <p className="text-[13px] muted">
            {filtered.length} booking{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/bookings/new" className="btn btn-primary">New booking</Link>
      </div>

      <div className="surface p-2 flex flex-wrap items-center gap-2">
        <select className="select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="surface overflow-hidden">
        <table className="tbl">
          <thead>
            <tr>
              <th>iPad</th>
              <th>Requester</th>
              <th>Needed by</th>
              <th>Status</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 muted">No bookings.</td></tr>
            )}
            {filtered.map((b) => {
              const ipad = ipads.find((i) => i.id === b.ipadId);
              return (
                <tr key={b.id}>
                  <td>
                    {ipad ? (
                      <Link href={`/ipads/${ipad.id}`} className="text-mono text-[12px] link">
                        {ipad.assetTag ?? ipad.serial}
                      </Link>
                    ) : (
                      <span className="muted">—</span>
                    )}
                    <div className="text-[11px] muted">{ipad?.model}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <RequesterPill t={b.requesterType} />
                      <span>{b.requester}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-[13px]">{formatDateTime(b.neededBy)}</div>
                    <div className="text-[11px] muted">{formatRelative(b.neededBy)}</div>
                  </td>
                  <td>
                    <span
                      className={`pill ${
                        b.status === "pending" ? "prio-high" : b.status === "checked_out" ? "tstat-in_progress" : b.status === "returned" ? "sla-met" : "prio-low"
                      }`}
                    >
                      {b.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="max-w-[260px] truncate muted">{b.notes ?? "—"}</td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      {b.status === "pending" && (
                        <button className="btn btn-sm btn-primary" onClick={() => checkOut(b.id)} disabled={busy}>Check out</button>
                      )}
                      {b.status === "checked_out" && (
                        <button className="btn btn-sm" onClick={() => checkIn(b.id)} disabled={busy}>Check in</button>
                      )}
                      {(b.status === "pending" || b.status === "checked_out") && (
                        <button className="btn btn-sm" onClick={() => cancel(b.id)} disabled={busy}>Cancel</button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => remove(b.id)} disabled={busy}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
