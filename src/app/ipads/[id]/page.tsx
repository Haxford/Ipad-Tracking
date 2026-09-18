"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { actions, useStore } from "@/lib/store";
import {
  IpadStatusPill,
  PriorityPill,
  RequesterPill,
  StatusPill,
} from "@/components/Badges";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { isStaleLoan } from "@/lib/algo";
import type { IpadStatus, RequesterType } from "@/lib/types";

export default function IpadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ipads, tickets, bookings, settings, refresh } = useStore();

  const ipad = useMemo(() => ipads.find((i) => i.id === params.id), [ipads, params.id]);
  const linkedTickets = useMemo(
    () => tickets.filter((t) => t.ipadId === params.id),
    [tickets, params.id]
  );
  const linkedBookings = useMemo(
    () => bookings.filter((b) => b.ipadId === params.id),
    [bookings, params.id]
  );

  const [assignee, setAssignee] = useState("");
  const [assigneeType, setAssigneeType] = useState<RequesterType>("staff");
  const [notes, setNotes] = useState(ipad?.notes ?? "");
  const [location, setLocation] = useState(ipad?.location ?? "");
  const [busy, setBusy] = useState(false);

  if (!ipad) {
    return (
      <div className="surface p-6 text-center muted text-[13px]">
        iPad not found.{" "}
        <Link href="/ipads" className="link">Back to inventory</Link>
      </div>
    );
  }

  const stale = isStaleLoan(ipad, settings);

  const setStatus = async (s: IpadStatus) => {
    setBusy(true);
    const patch: Partial<typeof ipad> = { status: s };
    if (s === "loaned" && !ipad.assignedTo && assignee.trim()) {
      patch.assignedTo = assignee.trim();
      patch.assignedToType = assigneeType;
      patch.loanedSince = new Date().toISOString();
    }
    if (s === "in_stock") {
      patch.assignedTo = undefined;
      patch.assignedToType = undefined;
      patch.loanedSince = undefined;
    }
    await actions.updateIpad(ipad.id, patch);
    await refresh();
    setBusy(false);
  };
  const saveNotes = async () => {
    setBusy(true);
    await actions.updateIpad(ipad.id, { notes, location });
    await refresh();
    setBusy(false);
  };
  const quickLoan = async () => {
    if (!assignee.trim()) return;
    setBusy(true);
    await actions.updateIpad(ipad.id, {
      status: "loaned",
      assignedTo: assignee.trim(),
      assignedToType: assigneeType,
      loanedSince: new Date().toISOString(),
    });
    setAssignee("");
    await refresh();
    setBusy(false);
  };
  const openTicket = async () => {
    setBusy(true);
    const t = await actions.createTicket({
      title: `Issue with ${ipad.assetTag ?? ipad.serial}`,
      description: "",
      requester: "Walk-in",
      requesterType: "staff",
      priority: "normal",
      urgent: false,
      status: "open",
      ipadId: ipad.id,
    });
    router.push(`/tickets/${t.id}`);
  };
  const remove = async () => {
    if (!confirm("Delete this iPad from inventory?")) return;
    await actions.deleteIpad(ipad.id);
    router.push("/ipads");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
      <div className="space-y-3 min-w-0">
        <div className="flex items-center gap-2 text-[12px] muted">
          <Link href="/ipads" className="hover:text-[var(--accent)]">iPads</Link>
          <span>/</span>
          <span className="text-mono">{ipad.assetTag ?? ipad.serial}</span>
        </div>

        <div className="surface p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <IpadStatusPill s={ipad.status} />
            {stale && <span className="pill prio-high">stale loan</span>}
            <span className="pill">{ipad.year}</span>
            {ipad.color && <span className="pill">{ipad.color}</span>}
            {ipad.storageGb && <span className="pill">{ipad.storageGb} GB</span>}
            {ipad.mdmEnrolled && <span className="pill sla-met">MDM</span>}
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight">{ipad.model}</h1>
          <div className="mt-1 text-[12px] muted">
            S/N <span className="text-mono">{ipad.serial}</span>
            {ipad.assetTag && (<> · Asset <span className="text-mono">{ipad.assetTag}</span></>)}
            {" · added "}{formatRelative(ipad.createdAt)}
          </div>
          {ipad.notes && (
            <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap">{ipad.notes}</p>
          )}
        </div>

        <div className="surface">
          <div className="px-4 h-11 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-semibold text-[14px]">Tickets</h2>
            <button onClick={openTicket} className="btn btn-sm btn-primary">Open ticket</button>
          </div>
          {linkedTickets.length === 0 ? (
            <div className="p-6 text-center muted text-[13px]">No tickets on this device.</div>
          ) : (
            <ul>
              {linkedTickets.map((t) => (
                <li key={t.id} className="px-4 py-3 flex items-center gap-3 hover-row border-b border-[var(--border)] last:border-0">
                  <Link href={`/tickets/${t.id}`} className="text-mono text-[11px] muted hover:text-[var(--accent)] w-16 shrink-0">{t.id}</Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/tickets/${t.id}`} className="font-medium text-[13.5px] hover:text-[var(--accent)] truncate block">{t.title}</Link>
                    <div className="text-[11.5px] muted">{t.requester} · {formatRelative(t.updatedAt)}</div>
                  </div>
                  <StatusPill s={t.status} />
                  <PriorityPill p={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface">
          <div className="px-4 h-11 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[14px]">Booking history</h2>
          </div>
          {linkedBookings.length === 0 ? (
            <div className="p-6 text-center muted text-[13px]">No bookings yet.</div>
          ) : (
            <ul>
              {linkedBookings.map((b) => (
                <li key={b.id} className="px-4 py-3 flex items-center gap-3 hover-row border-b border-[var(--border)] last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13.5px] truncate">{b.requester}</div>
                    <div className="text-[11.5px] muted">
                      Needed by {formatDateTime(b.neededBy)}
                      {b.returnedAt && ` · returned ${formatRelative(b.returnedAt)}`}
                    </div>
                    {b.notes && <div className="text-[12px] mt-1 muted">{b.notes}</div>}
                  </div>
                  <RequesterPill t={b.requesterType} />
                  <span
                    className={`pill ${
                      b.status === "pending" ? "prio-high" : b.status === "checked_out" ? "tstat-in_progress" : b.status === "returned" ? "sla-met" : "prio-low"
                    }`}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                  {b.status === "checked_out" && (
                    <button
                      className="btn btn-sm"
                      onClick={async () => {
                        setBusy(true);
                        await actions.updateBooking(b.id, { status: "returned", returnedAt: new Date().toISOString() });
                        await actions.updateIpad(ipad.id, { status: "in_stock", assignedTo: undefined, assignedToType: undefined, loanedSince: undefined });
                        await refresh();
                        setBusy(false);
                      }}
                    >
                      Check in
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="surface p-3 space-y-3">
          <h3 className="font-semibold text-[13px]">Status</h3>
          <select
            className="select"
            value={ipad.status}
            disabled={busy}
            onChange={(e) => setStatus(e.target.value as IpadStatus)}
          >
            <option value="in_stock">In stock</option>
            <option value="needs_setup">Needs setup</option>
            <option value="loaned">Loaned out</option>
            <option value="broken">Broken</option>
            <option value="sent_for_repair">Sent for repair</option>
            <option value="retired">Retired</option>
          </select>
          {ipad.assignedTo ? (
            <div className="flex items-center gap-2">
              {ipad.assignedToType && <RequesterPill t={ipad.assignedToType} />}
              <span className="text-[13px]">{ipad.assignedTo}</span>
            </div>
          ) : (
            <div className="text-[12px] muted">No one.</div>
          )}
        </div>

        <div className="surface p-3 space-y-2">
          <h3 className="font-semibold text-[13px]">Quick loan</h3>
          <input className="input" placeholder="Person name" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
          <select className="select" value={assigneeType} onChange={(e) => setAssigneeType(e.target.value as RequesterType)}>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>
          <button className="btn btn-sm btn-primary w-full justify-center" onClick={quickLoan} disabled={busy || !assignee.trim()}>
            Mark loaned
          </button>
        </div>

        <div className="surface p-3 space-y-2">
          <h3 className="font-semibold text-[13px]">Notes & location</h3>
          <input className="input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
          <button className="btn btn-sm w-full justify-center" onClick={saveNotes} disabled={busy}>Save</button>
        </div>

        <div className="surface p-3">
          <button className="btn btn-danger w-full justify-center" onClick={remove}>Delete iPad</button>
        </div>
      </aside>
    </div>
  );
}
