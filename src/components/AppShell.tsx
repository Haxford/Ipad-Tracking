"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StoreProvider, useStore, actions } from "@/lib/store";
import { ThemeSync } from "@/lib/theme";
import { SESSION_KEY } from "@/lib/seed";
import { CommandPalette } from "./CommandPalette";

function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  switch (name) {
    case "home":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
        </svg>
      );
    case "ticket":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
          <path d="M13 7v10" strokeDasharray="2 2" />
        </svg>
      );
    case "device":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M11 18h2" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      );
    case "cog":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      );
    case "search":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "logo":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="5" y="3" width="14" height="18" rx="2.5" />
          <path d="M11 18h2" />
          <rect x="9" y="6" width="6" height="8" rx="1" fill="currentColor" fillOpacity="0.18" />
          <circle cx="12" cy="10" r="1" fill="currentColor" />
        </svg>
      );
    case "moon":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      );
    case "sun":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case "logout":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      );
    case "bell":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
      );
    case "inbox":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M3 13h6l1.5 2h3L15 13h6" />
          <path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z" />
        </svg>
      );
    default:
      return null;
  }
}

function isAuthed() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "ok";
}

function LoginScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { settings } = useStore();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === settings.sharedPassword) {
      sessionStorage.setItem(SESSION_KEY, "ok");
      window.location.reload();
    } else {
      setError("Incorrect password.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="surface w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--accent)]">
            <Icon name="logo" className="h-5 w-5" />
          </span>
          <div>
            <div className="font-semibold tracking-tight">iPad Tracker</div>
            <div className="text-xs muted">{settings.orgName}</div>
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Enter shared password"
          />
          <p className="mt-2 text-xs muted">
            Default <span className="kbd">letmein</span> · change in Settings.
          </p>
        </div>
        {error && (
          <div className="text-xs text-[color:var(--danger)] bg-[color:var(--danger-soft)] border border-[color:var(--danger)]/20 rounded-md px-2 py-1.5">
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary w-full justify-center">
          Sign in
        </button>
      </form>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { settings, tickets, refresh } = useStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    setAuthed(isAuthed());
    setBootstrapped(true);
  }, []);

  // Global hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName;
      const inField =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (!inField && !meta && !authed) return;
      if (!inField && !meta) {
        if (e.key === "c") {
          router.push("/tickets/new");
        } else if (e.key === "g") {
          const handler = (window as any).__gpress;
          if (handler) clearTimeout(handler);
          (window as any).__gpress = setTimeout(() => {
            (window as any).__gpress = undefined;
          }, 900);
          (window as any).__gnext = (target: string) => router.push(target);
        } else if (
          (window as any).__gpress &&
          ["t", "i", "b", "d", "s", "h"].includes(e.key.toLowerCase())
        ) {
          clearTimeout((window as any).__gpress);
          (window as any).__gpress = undefined;
          const map: Record<string, string> = {
            t: "/tickets",
            i: "/ipads",
            b: "/bookings",
            d: "/",
            s: "/settings",
            h: "/",
          };
          router.push(map[e.key.toLowerCase()]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, authed]);

  if (!bootstrapped) return null;
  if (!authed) return <LoginScreen />;

  const nav = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/inbox", label: "Inbox", icon: "inbox" },
    { href: "/tickets", label: "Tickets", icon: "ticket" },
    { href: "/ipads", label: "iPads", icon: "device" },
    { href: "/bookings", label: "Bookings", icon: "calendar" },
  ];
  const bottomNav = [{ href: "/settings", label: "Settings", icon: "cog" }];

  const overdueCount = tickets.filter((t) => {
    if (t.status === "resolved" || t.status === "closed") return false;
    return new Date(t.slaDueAt).getTime() < Date.now();
  }).length;

  const toggleTheme = async () => {
    const next = settings.theme === "dark" ? "light" : "dark";
    await actions.updateSettings({ theme: next });
    refresh();
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:flex-col w-[228px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] sticky top-0 h-screen">
        <div className="px-4 h-12 flex items-center gap-2.5 border-b border-[var(--border)]">
          <span className="text-[var(--accent)]">
            <Icon name="logo" className="h-5 w-5" />
          </span>
          <div className="leading-tight min-w-0">
            <div className="text-[13px] font-semibold tracking-tight">iPad Tracker</div>
            <div className="text-[10px] muted truncate max-w-[140px]">{settings.orgName}</div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                <Icon name={n.icon} />
                <span className="flex-1">{n.label}</span>
                {n.href === "/inbox" && overdueCount > 0 && (
                  <span className="pill prio-urgent pill-dot">{overdueCount}</span>
                )}
              </Link>
            );
          })}
          <div className="pt-3 pb-1 px-2 text-[10px] uppercase tracking-wider muted">
            Workspace
          </div>
          {bottomNav.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`nav-link ${active ? "active" : ""}`}>
                <Icon name={n.icon} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[var(--border)] flex items-center gap-1">
          <button onClick={toggleTheme} className="nav-link flex-1" title="Toggle theme">
            <Icon name={settings.theme === "dark" ? "sun" : "moon"} />
            <span className="text-xs">{settings.theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button onClick={logout} className="nav-link" title="Sign out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-12 sticky top-0 z-30 bg-[var(--bg)]/85 backdrop-blur border-b border-[var(--border)]">
          <div className="h-full px-3 md:px-5 flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[12px] muted hover:border-[var(--accent)] transition w-full max-w-md"
            >
              <Icon name="search" />
              <span className="flex-1 text-left">Search or jump to…</span>
              <span className="kbd">⌘K</span>
            </button>
            <div className="flex-1" />
            <Link href="/tickets/new" className="btn btn-primary" title="New ticket (C)">
              <Icon name="plus" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New ticket</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 px-3 md:px-5 py-4 md:py-5 min-w-0">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeSync />
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
