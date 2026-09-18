"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { actions } from "@/lib/store";
import type { IpadStatus, RequesterType } from "@/lib/types";

export default function NewIpadPage() {
  const router = useRouter();
  const [serial, setSerial] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [model, setModel] = useState("iPad (10th gen)");
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState("Space Grey");
  const [storageGb, setStorageGb] = useState(64);
  const [status, setStatus] = useState<IpadStatus>("in_stock");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedToType, setAssignedToType] = useState<RequesterType>("staff");
  const [location, setLocation] = useState("");
  const [mdmEnrolled, setMdmEnrolled] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim() || !model.trim()) {
      setError("Serial and model are required.");
      return;
    }
    setBusy(true);
    const i = await actions.createIpad({
      serial: serial.trim(),
      assetTag: assetTag.trim() || undefined,
      model: model.trim(),
      year: Number(year) || new Date().getFullYear(),
      color: color.trim() || undefined,
      storageGb: Number(storageGb) || undefined,
      status,
      assignedTo: assignedTo.trim() || undefined,
      assignedToType: assignedTo.trim() ? assignedToType : undefined,
      loanedSince: status === "loaned" ? new Date().toISOString() : undefined,
      location: location.trim() || undefined,
      mdmEnrolled,
      notes: notes.trim() || undefined,
    });
    router.push(`/ipads/${i.id}`);
  };

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center gap-2 text-[12px] muted">
        <Link href="/ipads" className="hover:text-[var(--accent)]">iPads</Link>
        <span>/</span>
        <span>New</span>
      </div>
      <form onSubmit={submit} className="surface p-4 space-y-3">
        <h1 className="text-[16px] font-semibold tracking-tight">Add iPad</h1>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Serial *</label>
            <input className="input text-mono" autoFocus value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="F2LXX9QPJG5W" />
          </div>
          <div>
            <label className="label">Asset tag</label>
            <input className="input text-mono" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} placeholder="IT-007" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="label">Model *</label>
            <input className="input" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div>
            <label className="label">Year</label>
            <input type="number" className="input" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">Colour</label>
            <input className="input" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div>
            <label className="label">Storage (GB)</label>
            <input type="number" className="input" value={storageGb} onChange={(e) => setStorageGb(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as IpadStatus)}>
              <option value="in_stock">In stock</option>
              <option value="needs_setup">Needs setup</option>
              <option value="loaned">Loaned out</option>
              <option value="broken">Broken</option>
              <option value="sent_for_repair">Sent for repair</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Assigned to</label>
            <input className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select" value={assignedToType} onChange={(e) => setAssignedToType(e.target.value as RequesterType)} disabled={!assignedTo.trim()}>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Location</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Office · Shelf A" />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={mdmEnrolled} onChange={(e) => setMdmEnrolled(e.target.checked)} />
              <span>MDM enrolled</span>
            </label>
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Case, accessories, special instructions…" />
        </div>
        {error && (
          <div className="text-xs text-[color:var(--danger)] bg-[color:var(--danger-soft)] border border-[color:var(--danger)]/20 rounded-md px-2 py-1.5">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Link href="/ipads" className="btn">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
