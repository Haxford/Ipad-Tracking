"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { fuzzyScore } from "@/lib/utils";

type Item = {
  kind: "page" | "create" | "ticket" | "ipad" | "template";
  label: string;
  sub?: string;
  href: string;
  score?: number;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { tickets, ipads, templates } = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      { kind: "page", label: "Go to Dashboard", sub: "Overview", href: "/" },
      { kind: "page", label: "Go to Inbox", sub: "Overdue & alerts", href: "/inbox" },
      { kind: "page", label: "Go to Tickets", sub: "All tickets", href: "/tickets" },
      { kind: "page", label: "Go to iPads", sub: "Inventory", href: "/ipads" },
      { kind: "page", label: "Go to Bookings", sub: "Reservations", href: "/bookings" },
      { kind: "page", label: "Go to Settings", sub: "Configure", href: "/settings" },
      { kind: "create", label: "Create ticket", sub: "Open a new IT ticket", href: "/tickets/new" },
      { kind: "create", label: "Add iPad to inventory", sub: "Register a new device", href: "/ipads/new" },
      { kind: "create", label: "New booking", sub: "Reserve an iPad", href: "/bookings/new" },
    ];
    const tItems: Item[] = tickets.slice(0, 50).map((t) => ({
      kind: "ticket",
      label: `${t.id} — ${t.title}`,
      sub: `${t.requester} · ${t.status.replace("_", " ")}`,
      href: `/tickets/${t.id}`,
    }));
    const iItems: Item[] = ipads.slice(0, 50).map((i) => ({
      kind: "ipad",
      label: `${i.assetTag ?? i.serial} — ${i.model}`,
      sub: `${i.year} · ${i.status.replace("_", " ")}${i.assignedTo ? ` · ${i.assignedTo}` : ""}`,
      href: `/ipads/${i.id}`,
    }));
    const tplItems: Item[] = templates.map((tpl) => ({
      kind: "template",
      label: `${tpl.emoji} New ticket: ${tpl.name}`,
      sub: tpl.description.slice(0, 60),
      href: `/tickets/new?template=${tpl.id}`,
    }));
    const all = [...base, ...tplItems, ...tItems, ...iItems];
    const needle = q.trim();
    if (!needle) return all;
    return all
      .map((it) => {
        const score = Math.max(
          fuzzyScore(it.label, needle),
          fuzzyScore(it.sub ?? "", needle) * 0.8
        );
        return { ...it, score };
      })
      .filter((it) => (it.score ?? 0) > 0.1)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [q, tickets, ipads, templates]);

  useEffect(() => setActive(0), [q]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) go(it.href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal max-w-xl p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 h-11 border-b border-[var(--border)]">
          <svg className="h-4 w-4 muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search tickets, iPads, run a command…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <span className="kbd">esc</span>
        </div>
        <ul className="max-h-[60vh] overflow-auto py-1">
          {items.length === 0 && (
            <li className="px-4 py-10 text-center text-[13px] muted">
              No results.
            </li>
          )}
          {items.map((it, i) => (
            <li
              key={`${it.kind}-${it.href}-${i}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(it.href)}
              className={`px-3 py-2 flex items-center gap-3 cursor-pointer text-[13px] ${
                i === active ? "bg-[var(--accent-soft)]" : ""
              }`}
            >
              <span
                className={`pill ${
                  it.kind === "create"
                    ? "prio-normal"
                    : it.kind === "ticket"
                    ? "prio-high"
                    : it.kind === "template"
                    ? "prio-low"
                    : it.kind === "ipad"
                    ? "status-in_stock"
                    : "prio-low"
                }`}
              >
                {it.kind === "create" ? "Create" : it.kind}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate">{it.label}</div>
                {it.sub && (
                  <div className="text-[11px] muted truncate">{it.sub}</div>
                )}
              </div>
              <span className="kbd">↵</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--border)] px-3 py-1.5 text-[11px] muted flex gap-3">
          <span><span className="kbd">↑</span><span className="kbd">↓</span> nav</span>
          <span><span className="kbd">↵</span> open</span>
          <span><span className="kbd">esc</span> close</span>
        </div>
      </div>
    </div>
  );
}
