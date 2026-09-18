import type { AppSettings, TicketTemplate } from "./types";

export const DEFAULT_SETTINGS: AppSettings = {
  orgName: "IT Department",
  sharedPassword: "letmein",
  slaHours: { urgent: 4, high: 24, normal: 72, low: 168 },
  theme: "system",
  storage: "local",
  staleLoanDays: 14,
  priorityWeights: { urgent: 100, high: 60, normal: 30, low: 10 },
  stalenessWeightPerDay: 2,
};

export const DEFAULT_TEMPLATES: TicketTemplate[] = [
  {
    id: "tpl_cracked",
    name: "Cracked screen",
    emoji: "💥",
    title: "Cracked screen",
    description:
      "Screen damage reported. Please confirm impact location and check digitizer response before booking repair.",
    category: "screen",
    defaultPriority: "high",
  },
  {
    id: "tpl_battery",
    name: "Battery / charging",
    emoji: "🔋",
    title: "Won't hold charge",
    description:
      "Battery drains quickly or won't charge. Confirm cable, port, then assess battery health.",
    category: "battery",
    defaultPriority: "normal",
  },
  {
    id: "tpl_mdm",
    name: "MDM / profile issue",
    emoji: "🔒",
    title: "MDM profile issue",
    description:
      "Device not managed / supervised correctly. Re-enrol in MDM, verify profile installed.",
    category: "mdm",
    defaultPriority: "normal",
  },
  {
    id: "tpl_app",
    name: "App not working",
    emoji: "📱",
    title: "App crash / not working",
    description:
      "Specific app misbehaving. Note app name, version, and steps to reproduce.",
    category: "app",
    defaultPriority: "low",
  },
  {
    id: "tpl_setup",
    name: "New device setup",
    emoji: "✨",
    title: "New device setup",
    description:
      "Setup new iPad: update iOS, enrol in MDM, install required apps, sign into Managed Apple ID.",
    category: "setup",
    defaultPriority: "normal",
  },
  {
    id: "tpl_lost",
    name: "Lost / stolen",
    emoji: "🚨",
    title: "Device lost or stolen",
    description:
      "URGENT: Activate Lost Mode in MDM, file incident log, update asset register.",
    category: "lost_stolen",
    defaultPriority: "urgent",
  },
  {
    id: "tpl_network",
    name: "Wi-Fi / network",
    emoji: "📶",
    title: "Network / Wi-Fi issue",
    description: "Device won't connect to Wi-Fi or network resources. Try forget/rejoin.",
    category: "network",
    defaultPriority: "normal",
  },
];

export const STORAGE_KEY = "ipad-tracking:db:v2";
export const SESSION_KEY = "ipad-tracking:session:v2";
