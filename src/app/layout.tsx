import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "iPad Tracker — IT Operations",
  description:
    "Professional iPad inventory, ticketing, and booking system for IT teams.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#08090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Default theme class set quickly to avoid light flash on dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var raw = localStorage.getItem('ipad-tracking:db:v2');
                  var s = raw ? JSON.parse(raw).settings : null;
                  var t = (s && s.theme) || 'system';
                  if (t === 'system') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.add(t);
                } catch (e) { document.documentElement.classList.add('light'); }
              })();
            `,
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
