"use client";

import { useState } from "react";
import { actions, useStore } from "@/lib/store";
import type { Priority, RequesterType, TicketCategory, TicketStatus } from "@/lib/types";

export default function SettingsPage() {
  const { settings, rules } = useStore();
  const [orgName, setOrgName] = useState(settings.orgName);
  const [password, setPassword] = useState(settings.sharedPassword);
  const [sla, setSla] = useState({ ...settings.slaHours });
  const [theme, setTheme] = useState(settings.theme);
  const [staleDays, setStaleDays] = useState(settings.staleLoanDays);
  const [prioWeights, setPrioWeights] = useState({ ...settings.priorityWeights });
  const [stalenessWeight, setStalenessWeight] = useState(settings.stalenessWeightPerDay);
  const [saved, setSaved] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await actions.updateSettings({
      orgName,
      sharedPassword: password,
      slaHours: sla,
      theme,
      staleLoanDays: Math.max(1, Number(staleDays) || 14),
      priorityWeights: prioWeights,
      stalenessWeightPerDay: Math.max(0, Number(stalenessWeight)),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const reset = async () => {
    if (!confirm("Wipe all data?")) return;
    await actions.resetDb();
    window.location.reload();
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] muted">Org, login, SLAs, themes, and algorithm weights.</p>
      </div>

      <form onSubmit={save} className="surface p-4 space-y-4">
        <Section title="Organisation">
          <Field label="Organisation name">
            <input className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </Field>
          <Field label="Shared password">
            <input className="input text-mono" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </Section>

        <Section title="Theme">
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`btn ${theme === t ? "btn-primary" : ""}`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </Section>

        <Section title="SLA hours by priority">
          <div className="grid grid-cols-2 gap-2">
            {(["urgent", "high", "normal", "low"] as Priority[]).map((p) => (
              <div key={p} className="flex items-center gap-2">
                <span className={`pill prio-${p} w-20 justify-center`}>{p}</span>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={sla[p]}
                  onChange={(e) => setSla((s) => ({ ...s, [p]: Math.max(1, Number(e.target.value)) }))}
                />
                <span className="text-[12px] muted">hrs</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Smart queue weights">
          <p className="text-[12px] muted mb-2">
            These drive "Today's work" sorting on the Home page.
            <br />
            score = priority weight + SLA pressure (0–40) + days stale × staleness weight + 25 if urgent.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["urgent", "high", "normal", "low"] as Priority[]).map((p) => (
              <div key={p} className="flex items-center gap-2">
                <span className={`pill prio-${p} w-20 justify-center`}>{p}</span>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={prioWeights[p]}
                  onChange={(e) => setPrioWeights((w) => ({ ...w, [p]: Math.max(0, Number(e.target.value)) }))}
                />
                <span className="text-[12px] muted">pts</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="pill prio-low w-20 justify-center">stale</span>
            <input
              type="number"
              min={0}
              step="0.5"
              className="input"
              value={stalenessWeight}
              onChange={(e) => setStalenessWeight(Math.max(0, Number(e.target.value)))}
            />
            <span className="text-[12px] muted">pts / day idle</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="pill prio-low w-20 justify-center">loans</span>
            <input
              type="number"
              min={1}
              className="input"
              value={staleDays}
              onChange={(e) => setStaleDays(Math.max(1, Number(e.target.value)))}
            />
            <span className="text-[12px] muted">days before "stale"</span>
          </div>
        </Section>

        <div className="flex justify-end items-center gap-2 pt-1">
          {saved && <span className="text-[12px] text-[color:var(--success)]">Saved.</span>}
          <button type="submit" className="btn btn-primary">Save settings</button>
        </div>
      </form>

      <RoutingRules />

      <div className="surface p-4">
        <h2 className="font-semibold text-[14px] mb-2 text-[color:var(--danger)]">Danger zone</h2>
        <p className="text-[12px] muted mb-3">Wipe all iPads, tickets, bookings, rules, templates, and settings.</p>
        <button className="btn btn-danger" onClick={reset}>Reset all data</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider muted mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function RoutingRules() {
  const { rules, refresh } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    enabled: true,
    requesterType: "" as RequesterType | "",
    priority: "" as Priority | "",
    category: "" as TicketCategory | "",
    assignTo: "",
    setStatus: "" as TicketStatus | "",
    setPriority: "" as Priority | "",
  });

  const startAdd = () => {
    setAdding(true);
    setEditing(null);
    setDraft({
      name: "",
      enabled: true,
      requesterType: "",
      priority: "",
      category: "",
      assignTo: "",
      setStatus: "",
      setPriority: "",
    });
  };
  const startEdit = (id: string) => {
    const r = rules.find((x) => x.id === id);
    if (!r) return;
    setAdding(false);
    setEditing(id);
    setDraft({
      name: r.name,
      enabled: r.enabled,
      requesterType: (r.conditions.requesterType ?? "") as any,
      priority: (r.conditions.priority ?? "") as any,
      category: (r.conditions.category ?? "") as any,
      assignTo: r.assignTo ?? "",
      setStatus: (r.setStatus ?? "") as any,
      setPriority: (r.setPriority ?? "") as any,
    });
  };
  const save = async () => {
    const conditions: any = {};
    if (draft.requesterType) conditions.requesterType = draft.requesterType;
    if (draft.priority) conditions.priority = draft.priority;
    if (draft.category) conditions.category = draft.category;
    const rule = {
      id: editing ?? `rule_${Math.random().toString(36).slice(2, 8)}`,
      name: draft.name.trim() || "Untitled rule",
      enabled: draft.enabled,
      conditions,
      assignTo: draft.assignTo.trim() || undefined,
      setStatus: (draft.setStatus || undefined) as TicketStatus | undefined,
      setPriority: (draft.setPriority || undefined) as Priority | undefined,
    };
    await actions.upsertRule(rule);
    setAdding(false);
    setEditing(null);
    await refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    await actions.deleteRule(id);
    await refresh();
  };

  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[14px]">Auto-routing rules</h2>
          <p className="text-[12px] muted">
            When a new ticket matches all conditions, the listed changes are applied automatically.
          </p>
        </div>
        {!adding && !editing && (
          <button className="btn btn-sm btn-primary" onClick={startAdd}>Add rule</button>
        )}
      </div>

      {(adding || editing) && (
        <div className="border border-[var(--border)] rounded-md p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))} />
                <span>Enabled</span>
              </label>
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-wider muted pt-1">If all of these match</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Requester</label>
              <select className="select" value={draft.requesterType} onChange={(e) => setDraft((d) => ({ ...d, requesterType: e.target.value as any }))}>
                <option value="">Any</option>
                <option value="staff">Staff</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="select" value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as any }))}>
                <option value="">Any</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="select" value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as any }))}>
                <option value="">Any</option>
                <option value="screen">Screen</option>
                <option value="battery">Battery</option>
                <option value="mdm">MDM</option>
                <option value="network">Network</option>
                <option value="app">App</option>
                <option value="lost_stolen">Lost/stolen</option>
                <option value="setup">Setup</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-wider muted pt-1">Then apply</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Assign to</label>
              <input className="input" value={draft.assignTo} onChange={(e) => setDraft((d) => ({ ...d, assignTo: e.target.value }))} placeholder="Tech name" />
            </div>
            <div>
              <label className="label">Set status</label>
              <select className="select" value={draft.setStatus} onChange={(e) => setDraft((d) => ({ ...d, setStatus: e.target.value as any }))}>
                <option value="">—</option>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="waiting">Waiting</option>
              </select>
            </div>
            <div>
              <label className="label">Set priority</label>
              <select className="select" value={draft.setPriority} onChange={(e) => setDraft((d) => ({ ...d, setPriority: e.target.value as any }))}>
                <option value="">—</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn btn-sm" onClick={() => { setAdding(false); setEditing(null); }}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={save}>Save rule</button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-[var(--border)]">
        {rules.length === 0 && (
          <li className="py-6 text-center muted text-[13px]">No rules yet.</li>
        )}
        {rules.map((r) => (
          <li key={r.id} className="py-2.5 flex items-center gap-3">
            <span className={`pill ${r.enabled ? "sla-ok" : "prio-low"}`}>
              {r.enabled ? "on" : "off"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[13.5px]">{r.name}</div>
              <div className="text-[11.5px] muted truncate">
                {[
                  r.conditions.requesterType && `requester=${r.conditions.requesterType}`,
                  r.conditions.priority && `priority=${r.conditions.priority}`,
                  r.conditions.category && `category=${r.conditions.category}`,
                ]
                  .filter(Boolean)
                  .join(" · ") || "no conditions"}
                {" → "}
                {[
                  r.assignTo && `assign ${r.assignTo}`,
                  r.setStatus && `status=${r.setStatus}`,
                  r.setPriority && `priority=${r.setPriority}`,
                ]
                  .filter(Boolean)
                  .join(" · ") || "no action"}
              </div>
            </div>
            <button className="btn btn-sm" onClick={() => startEdit(r.id)}>Edit</button>
            <button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
