// Data access layer.
//
// Backends: `local` (browser localStorage) and `cloud` (REST API).
// All UI code talks to this module only; the rest of the app doesn't care
// which backend is active.

import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES, STORAGE_KEY } from "./seed";
import { applyRouting } from "./algo";
import type {
  AppSettings,
  Booking,
  DB,
  Ipad,
  Ticket,
  TicketComment,
  TicketEvent,
  TicketTemplate,
} from "./types";

const isBrowser = typeof window !== "undefined";

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyDb(): DB {
  return {
    ipads: [],
    tickets: [],
    bookings: [],
    techs: [],
    rules: [],
    templates: DEFAULT_TEMPLATES,
    settings: { ...DEFAULT_SETTINGS },
  };
}

// ---------------- local backend ----------------
function readLocal(): DB {
  if (!isBrowser) return emptyDb();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      ...emptyDb(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      templates: parsed.templates?.length ? parsed.templates : DEFAULT_TEMPLATES,
    };
  } catch {
    return emptyDb();
  }
}

function writeLocal(db: DB) {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// ---------------- cloud backend ----------------
async function cloud<T>(path: string, init?: RequestInit): Promise<T> {
  const settings = readLocal().settings;
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(settings.cloudToken ? { "x-auth": settings.cloudToken } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---------------- public API ----------------
async function getDb(): Promise<DB> {
  const settings = readLocal().settings;
  if (settings.storage === "cloud") {
    try {
      return await cloud<DB>("/db");
    } catch {
      // fall back to local so the UI never breaks
      return readLocal();
    }
  }
  return readLocal();
}

async function setDb(updater: (db: DB) => DB): Promise<DB> {
  const settings = readLocal().settings;
  const current = settings.storage === "cloud" ? await getDb() : readLocal();
  const next = updater(current);
  if (settings.storage === "cloud") {
    await cloud("/db", { method: "POST", body: JSON.stringify(next) });
  } else {
    writeLocal(next);
  }
  return next;
}

// ----- Settings -----
export async function getSettings(): Promise<AppSettings> {
  return (await getDb()).settings;
}
export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = await setDb((db) => ({ ...db, settings: { ...db.settings, ...patch } }));
  return next.settings;
}

// ----- iPads -----
export async function listIpads(): Promise<Ipad[]> {
  return (await getDb()).ipads;
}
export async function getIpad(id: string): Promise<Ipad | undefined> {
  return (await getDb()).ipads.find((i) => i.id === id);
}
export async function createIpad(
  input: Omit<Ipad, "id" | "createdAt" | "updatedAt">
): Promise<Ipad> {
  const ipad: Ipad = { ...input, id: uid("ipad"), createdAt: nowIso(), updatedAt: nowIso() };
  await setDb((db) => ({ ...db, ipads: [ipad, ...db.ipads] }));
  return ipad;
}
export async function updateIpad(id: string, patch: Partial<Ipad>): Promise<Ipad | undefined> {
  let updated: Ipad | undefined;
  await setDb((db) => {
    const idx = db.ipads.findIndex((i) => i.id === id);
    if (idx < 0) return db;
    updated = { ...db.ipads[idx], ...patch, updatedAt: nowIso() };
    const ipads = [...db.ipads];
    ipads[idx] = updated;
    return { ...db, ipads };
  });
  return updated;
}
export async function deleteIpad(id: string): Promise<boolean> {
  let ok = false;
  await setDb((db) => {
    const before = db.ipads.length;
    const ipads = db.ipads.filter((i) => i.id !== id);
    ok = ipads.length < before;
    return { ...db, ipads };
  });
  return ok;
}

// ----- Tickets -----
function nextTicketId(db: DB): string {
  const max = db.tickets.reduce((acc, t) => {
    const m = /^IT-(\d+)/.exec(t.id);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);
  return `IT-${String(max + 1).padStart(3, "0")}`;
}

export async function listTickets(): Promise<Ticket[]> {
  return (await getDb()).tickets;
}
export async function getTicket(id: string): Promise<Ticket | undefined> {
  return (await getDb()).tickets.find((t) => t.id === id);
}
export async function createTicket(
  input: Omit<
    Ticket,
    "id" | "createdAt" | "updatedAt" | "comments" | "events" | "slaDueAt"
  > & { slaDueAt?: string }
): Promise<Ticket> {
  const db = await getDb();
  const created = nowIso();
  const sla =
    input.slaDueAt ||
    new Date(db.settings.slaHours[input.priority] * 60 * 60 * 1000 + Date.now()).toISOString();
  const ticket: Ticket = {
    ...input,
    id: nextTicketId(db),
    createdAt: created,
    updatedAt: created,
    slaDueAt: sla,
    comments: [],
    events: [
      {
        id: uid("ev"),
        at: created,
        actor: "system",
        kind: "created",
        body: `Ticket opened by ${input.requester}`,
      } as TicketEvent,
    ],
  };
  // Auto-routing
  const { rule, patch } = applyRouting(ticket, db.rules);
  const finalTicket: Ticket = { ...ticket, ...patch };
  if (rule) {
    finalTicket.events.push({
      id: uid("ev"),
      at: created,
      actor: "system",
      kind: "auto_routed",
      body: `Matched rule: ${rule.name}${patch.assignee ? ` → ${patch.assignee}` : ""}`,
    });
  }
  await setDb((d) => ({ ...d, tickets: [finalTicket, ...d.tickets] }));
  return finalTicket;
}
export async function updateTicket(
  id: string,
  patch: Partial<Ticket>,
  actor = "IT Tech"
): Promise<Ticket | undefined> {
  let updated: Ticket | undefined;
  await setDb((db) => {
    const idx = db.tickets.findIndex((t) => t.id === id);
    if (idx < 0) return db;
    const before = db.tickets[idx];
    const next: Ticket = { ...before, ...patch, updatedAt: nowIso() };
    if (patch.priority && !patch.slaDueAt) {
      const created = new Date(next.createdAt).getTime();
      next.slaDueAt = new Date(
        created + db.settings.slaHours[next.priority] * 60 * 60 * 1000
      ).toISOString();
    }
    if (patch.status === "resolved" && !next.resolvedAt) {
      next.resolvedAt = nowIso();
    }
    const events = [...next.events];
    if (patch.status && patch.status !== before.status) {
      events.push({
        id: uid("ev"),
        at: nowIso(),
        actor,
        kind: "status",
        before: before.status,
        after: patch.status,
      });
    }
    if (patch.priority && patch.priority !== before.priority) {
      events.push({
        id: uid("ev"),
        at: nowIso(),
        actor,
        kind: "priority",
        before: before.priority,
        after: patch.priority,
      });
    }
    if (patch.assignee !== undefined && patch.assignee !== before.assignee) {
      events.push({
        id: uid("ev"),
        at: nowIso(),
        actor,
        kind: "assignee",
        before: before.assignee,
        after: patch.assignee,
      });
    }
    next.events = events;
    updated = next;
    const tickets = [...db.tickets];
    tickets[idx] = next;
    return { ...db, tickets };
  });
  return updated;
}
export async function addTicketComment(
  ticketId: string,
  body: string,
  author: string
): Promise<Ticket | undefined> {
  let updated: Ticket | undefined;
  await setDb((db) => {
    const idx = db.tickets.findIndex((t) => t.id === ticketId);
    if (idx < 0) return db;
    const comment: TicketComment = {
      id: uid("c"),
      author,
      body,
      createdAt: nowIso(),
    };
    const next: Ticket = {
      ...db.tickets[idx],
      comments: [...db.tickets[idx].comments, comment],
      events: [
        ...db.tickets[idx].events,
        { id: uid("ev"), at: nowIso(), actor: author, kind: "comment", body },
      ],
      updatedAt: nowIso(),
    };
    updated = next;
    const tickets = [...db.tickets];
    tickets[idx] = next;
    return { ...db, tickets };
  });
  return updated;
}
export async function deleteTicket(id: string): Promise<boolean> {
  let ok = false;
  await setDb((db) => {
    const before = db.tickets.length;
    const tickets = db.tickets.filter((t) => t.id !== id);
    ok = tickets.length < before;
    return { ...db, tickets };
  });
  return ok;
}

// ----- Bookings -----
export async function listBookings(): Promise<Booking[]> {
  return (await getDb()).bookings;
}
export async function getBooking(id: string): Promise<Booking | undefined> {
  return (await getDb()).bookings.find((b) => b.id === id);
}
export async function createBooking(
  input: Omit<Booking, "id" | "createdAt" | "updatedAt">
): Promise<Booking> {
  const b: Booking = { ...input, id: uid("bk"), createdAt: nowIso(), updatedAt: nowIso() };
  await setDb((db) => ({ ...db, bookings: [b, ...db.bookings] }));
  return b;
}
export async function updateBooking(
  id: string,
  patch: Partial<Booking>
): Promise<Booking | undefined> {
  let updated: Booking | undefined;
  await setDb((db) => {
    const idx = db.bookings.findIndex((b) => b.id === id);
    if (idx < 0) return db;
    updated = { ...db.bookings[idx], ...patch, updatedAt: nowIso() };
    const bookings = [...db.bookings];
    bookings[idx] = updated;
    return { ...db, bookings };
  });
  return updated;
}
export async function deleteBooking(id: string): Promise<boolean> {
  let ok = false;
  await setDb((db) => {
    const before = db.bookings.length;
    const bookings = db.bookings.filter((b) => b.id !== id);
    ok = bookings.length < before;
    return { ...db, bookings };
  });
  return ok;
}

// ----- Rules & templates -----
export async function listRules() {
  return (await getDb()).rules;
}
export async function listTemplates(): Promise<TicketTemplate[]> {
  return (await getDb()).templates;
}
export async function upsertRule(rule: AppSettings extends never ? never : any) {
  // simple upsert by id
  await setDb((db) => {
    const idx = db.rules.findIndex((r) => r.id === rule.id);
    const rules = [...db.rules];
    if (idx >= 0) rules[idx] = rule;
    else rules.unshift(rule);
    return { ...db, rules };
  });
}
export async function deleteRule(id: string) {
  await setDb((db) => ({ ...db, rules: db.rules.filter((r) => r.id !== id) }));
}

// ----- Reset -----
export async function resetDb(): Promise<void> {
  const fresh = emptyDb();
  if (isBrowser) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
}

// ----- Seed (for first run / demo) -----
export async function seedDemoIfEmpty(): Promise<void> {
  const db = await getDb();
  if (db.ipads.length || db.tickets.length || db.bookings.length) return;
  const i1 = await createIpad({
    serial: "F2LXX9QPJG5W",
    assetTag: "IT-001",
    model: "iPad (10th gen)",
    year: 2023,
    color: "Silver",
    storageGb: 64,
    status: "in_stock",
    location: "Office · Shelf A",
    notes: "Includes Logitech Rugged Case. MDM enrolled.",
    mdmEnrolled: true,
  });
  const i2 = await createIpad({
    serial: "DMPQ3L4Y9GHK",
    assetTag: "IT-002",
    model: "iPad Air",
    year: 2022,
    color: "Space Grey",
    storageGb: 256,
    status: "loaned",
    assignedTo: "Ms. Patel",
    assignedToType: "staff",
    location: "Library",
    loanedSince: new Date(Date.now() - 9 * 86_400_000).toISOString(),
  });
  const i3 = await createIpad({
    serial: "C02ZN3M9Q6L7",
    assetTag: "IT-003",
    model: "iPad Pro 11\"",
    year: 2024,
    color: "Space Black",
    storageGb: 512,
    status: "broken",
    location: "Office · Repair shelf",
    notes: "Cracked screen, top-right corner.",
  });
  const i4 = await createIpad({
    serial: "G9XT7KQ4P2MN",
    assetTag: "IT-004",
    model: "iPad (9th gen)",
    year: 2021,
    color: "Space Grey",
    storageGb: 64,
    status: "needs_setup",
    location: "Office · Setup bench",
    notes: "Awaiting MDM enrolment.",
  });
  await createTicket({
    title: "Screen flickering on iPad Pro",
    description:
      "Device assigned to Mr. Davies. Flickers when on battery, fine on charger.",
    requester: "Mr. Davies",
    requesterType: "staff",
    priority: "high",
    urgent: true,
    status: "open",
    ipadId: i3.id,
    category: "screen",
  });
  await createTicket({
    title: "Need new iPad for student",
    description: "Replacement for damaged unit. Needs MDM enrolled before pickup.",
    requester: "Head of Year 9",
    requesterType: "staff",
    priority: "normal",
    urgent: false,
    status: "in_progress",
    ipadId: i1.id,
    category: "setup",
  });
  await createTicket({
    title: "Won't charge past 20%",
    description: "Charge port looks clean, swapped cable, same issue.",
    requester: "Year 8 student",
    requesterType: "student",
    priority: "normal",
    urgent: false,
    status: "open",
    category: "battery",
  });
  await createBooking({
    ipadId: i1.id,
    requester: "Year 10 — Mr. Singh",
    requesterType: "staff",
    status: "pending",
    neededBy: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    notes: "Class set of 5 for media studies",
  });
  // Demo routing rules
  await upsertRule({
    id: "rule_lost",
    name: "Lost/stolen → urgent, escalate",
    enabled: true,
    conditions: { category: "lost_stolen" },
    setPriority: "urgent",
    setStatus: "open",
  });
  await upsertRule({
    id: "rule_student",
    name: "Student tickets → front desk",
    enabled: true,
    conditions: { requesterType: "student" },
    assignTo: "Front Desk",
  });
}
