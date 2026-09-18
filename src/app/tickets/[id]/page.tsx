"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { actions, useStore } from "@/lib/store";
import {
  CategoryPill,
  IpadStatusPill,
  PriorityPill,
  RequesterPill,
  StatusPill,
} from "@/components/Badges";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { slaState } from "@/lib/algo";
import type { Priority, TicketStatus } from "@/lib/types";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tickets, ipads, refresh } = useStore();
  const ticket = useMemo(() => tickets.find((t) => t.id === params.id), [tickets, params.id]);
  const linkedIpad = useMemo(
    () => (ticket?.ipadId ? ipads.find((i) => i.id === ticket.ipadId) : undefined),
    [ticket, ipads]
  );

  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("IT Tech");
  const [busy, setBusy] = useState(false);

  if (!ticket) {
    return (
      <div className="surface p-6 text-center muted text-[13px]">
        Ticket not found.{" "}
        <Link href="/tickets" className="link">Back to tickets</Link>
      </div>
    );
  }

  const sla = slaState(ticket);

  const setStatus = async (s: TicketStatus) => {
    setBusy(true);
    await actions.updateTicket(ticket.id, { status: s }, author);
    await refresh();
    setBusy(false);
  };
  const setPriority = async (p: Priority) => {
    setBusy(true);
    await actions.updateTicket(ticket.id, { priority: p, urgent: p === "urgent" }, author);
    await refresh();
    setBusy(false);
  };
  const submitComment = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    await actions.addTicketComment(ticket.id, comment.trim(), author.trim() || "IT Tech");
    setComment("");
    await refresh();
    setBusy(false);
  };
  const sendToRepair = async () => {
    if (!linkedIpad) return;
    setBusy(true);
    await actions.updateIpad(linkedIpad.id, { status: "sent_for_repair" });
    await actions.updateTicket(ticket.id, { status: "in_progress" }, author);
    await actions.addTicketComment(
      ticket.id,
      `Sent for repair (${linkedIpad.assetTag ?? linkedIpad.serial}).`,
      author
    );
    await refresh();
    setBusy(false);
  };
  const markBroken = async () => {
    if (!linkedIpad) return;
    setBusy(true);
    await actions.updateIpad(linkedIpad.id, { status: "broken" });
    await refresh();
    setBusy(false);
  };
  const markFixed = async () => {
    if (!linkedIpad) return;
    setBusy(true);
    await actions.updateIpad(linkedIpad.id, { status: "in_stock" });
    await actions.updateTicket(ticket.id, { status: "resolved" }, author);
    await refresh();
    setBusy(false);
  };
  const remove = async () => {
    if (!confirm("Delete this ticket?")) return;
    await actions.deleteTicket(ticket.id);
    router.push("/tickets");
  };

  const timeline = [
    ...ticket.events.map((e) => ({ kind: "event" as const, ev: e })),
    ...ticket.comments.map((c) => ({ kind: "comment" as const, c })),
  ].sort((a, b) => {
    const ta = a.kind === "event" ? a.ev.at : a.c.createdAt;
    const tb = b.kind === "event" ? b.ev.at : b.c.createdAt;
    return new Date(ta).getTime() - new Date(tb).getTime();
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
      <div className="space-y-3 min-w-0">
        <div className="flex items-center gap-2 text-[12px] muted">
          <Link href="/tickets" className="hover:text-[var(--accent)]">Tickets</Link>
          <span>/</span>
          <span className="text-mono">{ticket.id}</span>
        </div>

        <div className="surface p-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <StatusPill s={ticket.status} />
            <PriorityPill p={ticket.priority} />
            {ticket.urgent && <span className="pill prio-urgent">urgent</span>}
            <span className={`pill sla-${sla.color}`}>{sla.label}</span>
            {ticket.category && <CategoryPill c={ticket.category} />}
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight">{ticket.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-[12px] muted flex-wrap">
            <RequesterPill t={ticket.requesterType} />
            <span>{ticket.requester}</span>
            <span>·</span>
            <span>opened {formatRelative(ticket.createdAt)}</span>
            {ticket.assignee && (
              <>
                <span>·</span>
                <span>assigned to {ticket.assignee}</span>
              </>
            )}
          </div>
          {ticket.description && (
            <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          )}
        </div>

        <div className="surface">
          <div className="px-4 h-11 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-semibold text-[14px]">Activity</h2>
            <span className="text-[11px] muted">
              {timeline.length} event{timeline.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="p-4 space-y-3">
            {timeline.map((item, i) => {
              if (item.kind === "comment") {
                const c = item.c;
                return (
                  <li key={c.id} className="flex gap-3">
                    <Avatar name={c.author} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] muted">
                        <span className="font-medium text-[var(--text)]">{c.author}</span>
                        {" · "}
                        {formatDateTime(c.createdAt)}
                      </div>
                      <div className="text-[13.5px] mt-0.5 whitespace-pre-wrap">{c.body}</div>
                    </div>
                  </li>
                );
              }
              const e = item.ev;
              return (
                <li key={e.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center text-[10px] font-medium uppercase">
                    {e.kind.replace("_", " ").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] muted">
                      <span className="font-medium text-[var(--text)]">{e.actor}</span>
                      {" · "}
                      {formatRelative(e.at)}
                    </div>
                    <div className="text-[13px] mt-0.5">
                      {describeEvent(e)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-[var(--border)] p-3 space-y-2">
            <div className="flex gap-2">
              <input
                className="input max-w-[180px]"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author"
              />
            </div>
            <textarea
              className="textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment, status update, or special instructions for the tech…"
            />
            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={submitComment} disabled={busy}>
                Add comment
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="surface p-3 space-y-3">
          <h3 className="font-semibold text-[13px]">Properties</h3>
          <div>
            <label className="label">Status</label>
            <select
              className="select"
              value={ticket.status}
              disabled={busy}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="waiting">Waiting</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="select"
              value={ticket.priority}
              disabled={busy}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label">SLA due</label>
            <div className="text-[13px] text-mono">{formatDateTime(ticket.slaDueAt)}</div>
            <div className="text-[11px] muted">{formatRelative(ticket.slaDueAt)}</div>
          </div>
          {ticket.resolvedAt && (
            <div>
              <label className="label">Resolved</label>
              <div className="text-[13px] text-mono">{formatDateTime(ticket.resolvedAt)}</div>
            </div>
          )}
        </div>

        {linkedIpad && (
          <div className="surface p-3 space-y-3">
            <h3 className="font-semibold text-[13px]">Linked iPad</h3>
            <div className="flex items-center justify-between">
              <Link href={`/ipads/${linkedIpad.id}`} className="text-mono text-[12px] link">
                {linkedIpad.assetTag ?? linkedIpad.serial}
              </Link>
              <IpadStatusPill s={linkedIpad.status} />
            </div>
            <div className="text-[13px]">{linkedIpad.model}</div>
            <div className="text-[12px] muted">
              S/N {linkedIpad.serial} · {linkedIpad.year}
              {linkedIpad.assignedTo ? ` · with ${linkedIpad.assignedTo}` : ""}
            </div>
            <div className="pt-2 border-t border-[var(--border)] flex flex-wrap gap-1.5">
              <button className="btn btn-sm" onClick={markBroken} disabled={busy}>
                Mark broken
              </button>
              <button className="btn btn-sm btn-primary" onClick={sendToRepair} disabled={busy}>
                Send to repair
              </button>
              {(linkedIpad.status === "broken" ||
                linkedIpad.status === "sent_for_repair") && (
                <button className="btn btn-sm" onClick={markFixed} disabled={busy}>
                  Mark fixed
                </button>
              )}
            </div>
          </div>
        )}

        <div className="surface p-3">
          <button className="btn btn-danger w-full justify-center" onClick={remove}>
            Delete ticket
          </button>
        </div>
      </aside>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px] font-medium">
      {initials || "·"}
    </div>
  );
}

function describeEvent(e: { kind: string; before?: string; after?: string; body?: string }) {
  switch (e.kind) {
    case "created":
      return <span>{e.body}</span>;
    case "status":
      return (
        <span>
          changed status <span className="text-mono">{e.before}</span> → <span className="text-mono">{e.after}</span>
        </span>
      );
    case "priority":
      return (
        <span>
          changed priority <span className="text-mono">{e.before}</span> → <span className="text-mono">{e.after}</span>
        </span>
      );
    case "assignee":
      return (
        <span>
          reassigned {e.before ? <><span className="text-mono">{e.before}</span> → </> : null}
          <span className="text-mono">{e.after || "unassigned"}</span>
        </span>
      );
    case "auto_routed":
      return <span>{e.body}</span>;
    default:
      return <span>{e.body ?? e.kind}</span>;
  }
}
