"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { actions, useStore } from "@/lib/store";
import type { Priority, RequesterType, TicketCategory } from "@/lib/types";

function Inner() {
  const router = useRouter();
  const search = useSearchParams();
  const { templates, ipads } = useStore();
  const tplId = search?.get("template") ?? "";
  const tpl = templates.find((t) => t.id === tplId);

  const [title, setTitle] = useState(tpl?.title ?? "");
  const [description, setDescription] = useState(tpl?.description ?? "");
  const [requester, setRequester] = useState("");
  const [requesterType, setRequesterType] = useState<RequesterType>("staff");
  const [priority, setPriority] = useState<Priority>(tpl?.defaultPriority ?? "normal");
  const [category, setCategory] = useState<TicketCategory>(tpl?.category ?? "other");
  const [ipadId, setIpadId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requester.trim()) {
      setError("Title and requester are required.");
      return;
    }
    setSubmitting(true);
    const t = await actions.createTicket({
      title: title.trim(),
      description: description.trim(),
      requester: requester.trim(),
      requesterType,
      priority,
      urgent: priority === "urgent",
      status: "open",
      category,
      ipadId: ipadId || undefined,
    });
    router.push(`/tickets/${t.id}`);
  };

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex items-center gap-2 text-[12px] muted">
        <Link href="/tickets" className="hover:text-[var(--accent)]">Tickets</Link>
        <span>/</span>
        <span>New</span>
      </div>
      {/* Templates */}
      <div className="surface p-3">
        <div className="text-[11px] uppercase tracking-wider muted mb-2">
          Start from a template
        </div>
        <div className="flex flex-wrap gap-1.5">
          {templates.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/tickets/new?template=${tpl.id}`}
              className={`btn btn-sm ${tplId === tpl.id ? "btn-primary" : ""}`}
            >
              <span>{tpl.emoji}</span>
              <span>{tpl.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="surface p-4 space-y-3">
        <div>
          <input
            className="input text-[15px] font-medium"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ticket title"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="col-span-2">
            <label className="label">Requester</label>
            <input
              className="input"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              placeholder="Name"
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="select"
              value={requesterType}
              onChange={(e) => setRequesterType(e.target.value as RequesterType)}
            >
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Category</label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
            >
              <option value="screen">Screen</option>
              <option value="battery">Battery</option>
              <option value="mdm">MDM / Profile</option>
              <option value="network">Network</option>
              <option value="app">App</option>
              <option value="lost_stolen">Lost / stolen</option>
              <option value="setup">Setup</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Linked iPad</label>
            <select
              className="select"
              value={ipadId}
              onChange={(e) => setIpadId(e.target.value)}
            >
              <option value="">— none —</option>
              {ipads.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.assetTag ?? i.serial} · {i.model}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's wrong? Include any special instructions for the tech."
          />
        </div>
        {error && (
          <div className="text-xs text-[color:var(--danger)] bg-[color:var(--danger-soft)] border border-[color:var(--danger)]/20 rounded-md px-2 py-1.5">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Link href="/tickets" className="btn">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="muted text-[13px]">Loading…</div>}>
      <Inner />
    </Suspense>
  );
}
