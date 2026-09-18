# iPad Tracker

A professional iPad tracking system for IT teams. Linear-inspired interface with smart-queue scoring, auto-routing rules, SLA tracking, and templates.

## Features

- **Smart queue** — every ticket is scored from priority, SLA pressure, and staleness, surfacing "what should I work on next?" automatically.
- **Auto-routing rules** — when a ticket matches conditions, the system auto-assigns and updates priority (e.g. student → front desk, lost/stolen → urgent).
- **SLA tracking** — colour-coded breach/due-soon/on-track badges; live overdue count in sidebar and Inbox.
- **Stale loan detection** — iPads out for more than the configured number of days surface on the dashboard.
- **Booking conflict detection** — booking an iPad that's already out warns you before you save.
- **Quick-issue templates** — open a ticket in 5 seconds from a preset (cracked screen, MDM, lost device, etc.).
- **Activity timeline** — every state change is an event: who did what, when. Includes system events (auto-routed, sent for repair).
- **Command palette** — ⌘K / Ctrl+K jumps anywhere, fuzzy-searches tickets and iPads, and creates new records.
- **Keyboard shortcuts** — `c` for new ticket, `g` then `t/i/b/d/s/h` to jump pages.
- **CSV export** — export the whole inventory from the dashboard.
- **Dual storage** — localStorage by default (offline, single-browser), or cloud (file-backed JSON via API route, multi-user) — switchable in Settings.
- **Light, dark, and system** theme modes.
- **Shared password login**, changeable in Settings.

## Stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS 3 (custom token system, dark first)
- TypeScript
- localStorage by default; opt-in cloud backend at `/api/db`

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run typecheck    # type check
```

## Deploy

### Vercel (recommended)

1. Push to GitHub.
2. Import the repo in Vercel.
3. (Optional) set `CLOUD_TOKEN` env var to enable multi-user cloud backend. In Settings, switch the storage backend to "cloud" and enter the same token.

### GitHub Pages (static export)

For static-only export, change `next.config.ts` to add `output: "export"`, then run `npm run build` and publish the `out/` directory. Note: the cloud backend API route won't be available; you'll be on localStorage only.

## Layout

```
src/
  app/
    page.tsx               # Home / dashboard (smart queue + KPIs)
    inbox/page.tsx         # Overdue + alerts
    tickets/               # List / board / queue views
      [id]/page.tsx        # Ticket detail with timeline
      new/page.tsx         # Create with templates
    ipads/                 # Inventory + detail + new
    bookings/              # Bookings list + new (with conflict detection)
    settings/page.tsx      # Settings + routing rule editor
    api/db/route.ts        # Cloud backend (optional)
    layout.tsx             # Root layout (theme + AppShell)
  components/
    AppShell.tsx           # Sidebar + header + palette
    CommandPalette.tsx     # ⌘K palette
    Badges.tsx
    Modal.tsx
  lib/
    types.ts               # Domain types
    seed.ts                # Defaults
    db.ts                  # Data layer (local + cloud)
    algo.ts                # Smart-queue scoring + routing + conflicts
    store.tsx              # React context
    theme.tsx              # Theme application
    utils.ts               # Format helpers
```

## Notes

- Default password is `letmein`. Change it in Settings on first login.
- The first run auto-seeds demo iPads, tickets, bookings, and two routing rules.
- The data layer (`src/lib/db.ts`) is the only file that touches storage. To switch to SQLite or Postgres, replace its body with API calls; nothing else changes.
