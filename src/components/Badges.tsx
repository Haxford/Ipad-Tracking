import {
  CATEGORY_LABELS,
  IPAD_STATUS_LABELS,
  PRIORITY_LABELS,
  REQUESTER_TYPE_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/types";
import type {
  IpadStatus,
  Priority,
  RequesterType,
  TicketCategory,
  TicketStatus,
} from "@/lib/types";

export function PriorityPill({ p }: { p: Priority }) {
  return <span className={`pill prio-${p}`}>{PRIORITY_LABELS[p]}</span>;
}

export function StatusPill({ s }: { s: TicketStatus }) {
  return <span className={`pill tstat-${s}`}>{TICKET_STATUS_LABELS[s]}</span>;
}

export function IpadStatusPill({ s }: { s: IpadStatus }) {
  return <span className={`pill status-${s}`}>{IPAD_STATUS_LABELS[s]}</span>;
}

export function RequesterPill({ t }: { t: RequesterType }) {
  const cls = t === "staff" ? "prio-normal" : "prio-low";
  return <span className={`pill ${cls}`}>{REQUESTER_TYPE_LABELS[t]}</span>;
}

export function CategoryPill({ c }: { c: TicketCategory }) {
  return <span className="pill prio-low">{CATEGORY_LABELS[c]}</span>;
}
