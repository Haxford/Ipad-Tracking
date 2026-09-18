"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  deleteBooking,
  deleteIpad,
  deleteRule,
  deleteTicket,
  getSettings,
  listBookings,
  listIpads,
  listRules,
  listTemplates,
  listTickets,
  resetDb,
  seedDemoIfEmpty,
  updateBooking,
  updateIpad,
  updateSettings,
  updateTicket,
  upsertRule,
  addTicketComment,
  createBooking,
  createIpad,
  createTicket,
} from "./db";
import type {
  AppSettings,
  Booking,
  Ipad,
  Ticket,
  TicketTemplate,
  RoutingRule,
} from "./types";

type State = {
  ready: boolean;
  ipads: Ipad[];
  tickets: Ticket[];
  bookings: Booking[];
  rules: RoutingRule[];
  templates: TicketTemplate[];
  settings: AppSettings;
  refresh: () => Promise<void>;
};

const Ctx = createContext<State | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ipads, setIpads] = useState<Ipad[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const refresh = useCallback(async () => {
    await seedDemoIfEmpty();
    const [ipads, tickets, bookings, rules, templates, settings] = await Promise.all([
      listIpads(),
      listTickets(),
      listBookings(),
      listRules(),
      listTemplates(),
      getSettings(),
    ]);
    setIpads(ipads);
    setTickets(tickets);
    setBookings(bookings);
    setRules(rules);
    setTemplates(templates);
    setSettings(settings);
    setReady(true);
  }, []);

  const initialMount = useRef(true);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<State>(
    () => ({
      ready,
      ipads,
      tickets,
      bookings,
      rules,
      templates,
      settings: settings!,
      refresh,
    }),
    [ready, ipads, tickets, bookings, rules, templates, settings, refresh]
  );

  if (!ready || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--muted)] text-sm">
        Loading…
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

// Action helpers — wrap the async db functions so components can stay terse.
export const actions = {
  createIpad,
  updateIpad,
  deleteIpad,
  createTicket,
  updateTicket,
  addTicketComment,
  deleteTicket,
  createBooking,
  updateBooking,
  deleteBooking,
  upsertRule,
  deleteRule,
  updateSettings,
  resetDb,
};
