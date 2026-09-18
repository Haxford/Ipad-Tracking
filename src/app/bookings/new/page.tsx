"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { actions, useStore } from "@/lib/store";
import { bookingConflict } from "@/lib/algo";
import type { RequesterType } from "@/lib/types";

export default function NewBookingPage() {
  const router = useRouter();
  const { ipads, bookings } = useStore();
  const available = useMemo(
    () => ipads.filter((i) => i.status !== "retired"),
    [ipads]
  );
  const [ipadId, setIpadId] = useState<string>(available[0]?.id ?? "");
  const [requester, setRequester] = useState("");
  const [requesterType, setRequesterType] = useState<RequesterType>("staff");
  const [neededBy, setNeededBy] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState("");
  const [checkOutNow, setCheckOutNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const conflict = useMemo(() => {
    if (!ipadId) return { conflict: false };
    return bookingConflict(
      ipadId,
      new Date(neededBy).toISOString(),
      bookings.map((b) => ({
        ipadId: b.ipadId,
        status: b.status,
        neededBy: b.neededBy,
        returnedAt: b.returnedAt,
        id: b.id,
      }))
    );
  }, [ipadId, neededBy, bookings]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipadId || !requester.trim()) {
      setError("Pick an iPad and enter a requester.");
      return;
    }
    if (conflict.conflict) {
      setError("This iPad is already booked or out for that date. Resolve the conflict first.");
      return;
    }
    setBusy(true);
    const b = await actions.createBooking({
      ipadId,
      requester: requester.trim(),
      requesterType,
      status: checkOutNow ? "checked_out" : "pending",
      neededBy: new Date(neededBy).toISOString(),
      notes: notes.trim() || undefined,
    });
    if (checkOutNow) {
      await actions.updateIpad(ipadId, {
        status: "loaned",
        assignedTo: requester.trim(),
        assignedToType: requesterType,
        loanedSince: new Date().toISOString(),
      });
    }
    router.push("/bookings");
  };

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center gap-2 text-[12px] muted">
        <Link href="/bookings" className="hover:text-[var(--accent)]">Bookings</Link>
        <span>/</span>
        <span>New</span>
      </div>
      <form onSubmit={submit} className="surface p-4 space-y-3">
        <h1 className="text-[16px] font-semibold tracking-tight">New booking</h1>
        <div>
          <label className="label">iPad</label>
          <select className="select" value={ipadId} onChange={(e) => setIpadId(e.target.value)}>
            {available.length === 0 && <option value="">No iPads available</option>}
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.assetTag ?? i.serial} · {i.model} · {i.status.replace("_", " ")}
              </option>
            ))}
          </select>
          {conflict.conflict && (
            <div className="mt-2 text-xs text-[color:var(--danger)] bg-[color:var(--danger-soft)] border border-[color:var(--danger)]/20 rounded-md px-2 py-1.5">
              Conflict: this iPad already has an active booking/checkout.
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Requester</label>
            <input className="input" value={requester} onChange={(e) => setRequester(e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select" value={requesterType} onChange={(e) => setRequesterType(e.target.value as RequesterType)}>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Needed by</label>
            <input type="datetime-local" className="input" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={checkOutNow} onChange={(e) => setCheckOutNow(e.target.checked)} />
              <span>Check out immediately</span>
            </label>
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Class set, special instructions…" />
        </div>
        {error && (
          <div className="text-xs text-[color:var(--danger)] bg-[color:var(--danger-soft)] border border-[color:var(--danger)]/20 rounded-md px-2 py-1.5">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Link href="/bookings" className="btn">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={busy || conflict.conflict}>
            {busy ? "Creating…" : "Create booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
