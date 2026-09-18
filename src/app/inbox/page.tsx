"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  CategoryPill,
  IpadStatusPill,
  PriorityPill,
  RequesterPill,
} from "@/components/Badges";
import { formatRelative } from "@/lib/utils";
import { slaState, isStaleLoan } from "@/lib/algo";

export default function InboxPage() {
  const { tickets, ipads, settings } = useStore();

  const overdue = tickets.filter(
    (t) => t.status !== "resolved" && t.status !== "closed" && slaState(t).color === "over"
  );
  const dueSoon = tickets.filter(
    (t) => t.status !== "resolved" && t.status !== "closed" && slaState(t).color === "warn"
  );
  const staleLoans = ipads.filter((i) => isStaleLoan(i, settings));
  const awaitingRepair = ipads.filter((i) => i.status === "sent_for_repair");
  const broken = ipads.filter((i) => i.status === "broken");

  const sections = [
    {
      title: "Overdue",
      tone: "danger" as const,
      items: overdue.map((t) => ({
        kind: "ticket" as const,
        t,
        ipad: ipads.find((i) => i.id === t.ipadId),
      })),
      empty: "No overdue tickets.",
    },
    {
      title: "Due soon",
      tone: "warning" as const,
      items: dueSoon.map((t) => ({
        kind: "ticket" as const,
        t,
        ipad: ipads.find((i) => i.id === t.ipadId),
      })),
      empty: "Nothing due in the next 6 hours.",
    },
    {
      title: "Stale loans",
      tone: "warning" as const,
      items: staleLoans.map((i) => ({ kind: "ipad" as const, ipad: i })),
      empty: "No loans over the stale threshold.",
    },
    {
      title: "Out for repair",
      tone: "neutral" as const,
      items: awaitingRepair.map((i) => ({ kind: "ipad" as const, ipad: i })),
      empty: "Nothing with the repair shop.",
    },
    {
      title: "Marked broken",
      tone: "danger" as const,
      items: broken.map((i) => ({ kind: "ipad" as const, ipad: i })),
      empty: "No devices marked broken.",
    },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight">Inbox</h1>
        <p className="text-[13px] muted">Things that need your attention right now.</p>
      </div>
      {sections.map((sec) => (
        <section key={sec.title} className="surface overflow-hidden">
          <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[14px]">{sec.title}</h2>
              <span
                className={`pill ${
                  sec.tone === "danger" ? "prio-urgent" : sec.tone === "warning" ? "prio-high" : "prio-low"
                }`}
              >
                {sec.items.length}
              </span>
            </div>
          </div>
          {sec.items.length === 0 ? (
            <div className="p-6 text-center text-[13px] muted">{sec.empty}</div>
          ) : (
            <ul>
              {sec.items.map((it, i) =>
                it.kind === "ticket" && it.t ? (
                  <li
                    key={it.t.id + i}
                    className="px-4 py-3 flex items-center gap-3 hover-row border-b border-[var(--border)] last:border-0"
                  >
                    <Link
                      href={`/tickets/${it.t.id}`}
                      className="text-mono text-[11px] muted hover:text-[var(--accent)] w-16 shrink-0"
                    >
                      {it.t.id}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/tickets/${it.t.id}`}
                        className="font-medium text-[13.5px] hover:text-[var(--accent)] truncate block"
                      >
                        {it.t.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-[11.5px] muted">
                        <RequesterPill t={it.t.requesterType} />
                        <span className="truncate">{it.t.requester}</span>
                        {it.ipad && (
                          <>
                            <span>·</span>
                            <span className="text-mono">{it.ipad.assetTag ?? it.ipad.serial}</span>
                          </>
                        )}
                        {it.t.category && (
                          <>
                            <span>·</span>
                            <CategoryPill c={it.t.category} />
                          </>
                        )}
                      </div>
                    </div>
                    <PriorityPill p={it.t.priority} />
                    <span className="muted text-[11px]">{formatRelative(it.t.slaDueAt)}</span>
                  </li>
                ) : it.ipad ? (
                  <li
                    key={it.ipad.id + i}
                    className="px-4 py-3 flex items-center gap-3 hover-row border-b border-[var(--border)] last:border-0"
                  >
                    <Link
                      href={`/ipads/${it.ipad.id}`}
                      className="text-mono text-[11px] hover:text-[var(--accent)] w-16 shrink-0"
                    >
                      {it.ipad.assetTag ?? it.ipad.serial}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/ipads/${it.ipad.id}`}
                        className="font-medium text-[13.5px] hover:text-[var(--accent)] truncate block"
                      >
                        {it.ipad.model}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-[11.5px] muted">
                        {it.ipad.assignedTo && (
                          <>
                            <RequesterPill t={it.ipad.assignedToType ?? "staff"} />
                            <span>{it.ipad.assignedTo}</span>
                          </>
                        )}
                        {it.ipad.loanedSince && (
                          <>
                            <span>·</span>
                            <span>loaned {formatRelative(it.ipad.loanedSince)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <IpadStatusPill s={it.ipad.status} />
                  </li>
                ) : null
              )}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
