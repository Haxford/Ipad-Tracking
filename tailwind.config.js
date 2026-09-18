/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "monospace",
        ],
      },
      colors: {
        // Light tokens (Linear-ish: cool neutrals, subtle violet accent)
        light: {
          bg: "#fbfbfc",
          surface: "#ffffff",
          surface2: "#f6f7f9",
          border: "#eceef2",
          text: "#0e1116",
          muted: "#6b7280",
          subtle: "#9aa3b2",
          accent: "#5e6ad2",
          accentSoft: "#eef0fb",
          danger: "#e5484d",
          warning: "#f5a524",
          success: "#30a46c",
        },
        // Dark tokens (Linear-style: near-black, hairline borders)
        dark: {
          bg: "#08090b",
          surface: "#0f1115",
          surface2: "#16181d",
          border: "#262932",
          text: "#e6e8ee",
          muted: "#8b94a7",
          subtle: "#5b6371",
          accent: "#8b95f5",
          accentSoft: "#1a1f3d",
          danger: "#ff6369",
          warning: "#ffb547",
          success: "#4cc38a",
        },
      },
      fontSize: {
        "2xs": ["10px", "14px"],
      },
      letterSpacing: {
        tightish: "-0.011em",
      },
    },
  },
  plugins: [],
};
