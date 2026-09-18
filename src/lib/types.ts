// Core domain types — v2

export type RequesterType = "staff" | "student";
export type Priority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type IpadStatus =
  | "in_stock"
  | "loaned"
  | "needs_setup"
  | "broken"
  | "sent_for_repair"
  | "retired";
export type BookingStatus = "pending" | "checked_out" | "returned" | "cancelled";

export interface Ipad {
  id: string;
  serial: string;
  assetTag?: string;
  model: string;
  year: number;
  color?: string;
  storageGb?: number;
  status: IpadStatus;
  assignedTo?: string;
  assignedToType?: RequesterType;
  location?: string; // e.g. "Office", "Library", "Mr Davies — R12"
  notes?: string;
  loanedSince?: string; // ISO date
  mdmEnrolled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  system?: boolean;
}

export interface TicketEvent {
  id: string;
  at: string;
  actor: string;
  kind: string; // e.g. "status", "priority", "comment", "linked_ipad", "auto_routed"
  before?: string;
  after?: string;
  body?: string;
}

export interface Ticket {
  id: string; // IT-###
  title: string;
  description: string;
  requester: string;
  requesterType: RequesterType;
  priority: Priority;
  urgent: boolean;
  status: TicketStatus;
  ipadId?: string;
  bookingId?: string;
  assignee?: string;
  category?: TicketCategory;
  templateId?: string;
  slaDueAt: string;
  resolvedAt?: string;
  comments: TicketComment[];
  events: TicketEvent[];
  createdAt: string;
  updatedAt: string;
}

export type TicketCategory =
  | "screen"
  | "battery"
  | "mdm"
  | "network"
  | "app"
  | "lost_stolen"
  | "setup"
  | "other";

export interface Booking {
  id: string;
  ipadId: string;
  requester: string;
  requesterType: RequesterType;
  status: BookingStatus;
  neededBy: string;
  returnedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tech {
  id: string;
  name: string;
  role: "lead" | "tech" | "front_desk";
  active: boolean;
}

// Auto-routing rule: when a ticket matches all conditions, suggest/assign.
export interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    requesterType?: RequesterType;
    priority?: Priority;
    category?: TicketCategory;
  };
  assignTo?: string; // tech name
  setStatus?: TicketStatus;
  setPriority?: Priority;
}

// Quick ticket template
export interface TicketTemplate {
  id: string;
  name: string;
  emoji: string;
  title: string;
  description: string;
  category: TicketCategory;
  defaultPriority: Priority;
}

export type StorageBackend = "local" | "cloud";

export interface AppSettings {
  orgName: string;
  sharedPassword: string;
  slaHours: Record<Priority, number>;
  theme: "light" | "dark" | "system";
  storage: StorageBackend;
  cloudToken?: string; // simple shared secret for the cloud API
  staleLoanDays: number;
  // Algorithm knobs
  priorityWeights: Record<Priority, number>;
  stalenessWeightPerDay: number;
  defaultAssignee?: string;
}

export interface DB {
  ipads: Ipad[];
  tickets: Ticket[];
  bookings: Booking[];
  techs: Tech[];
  rules: RoutingRule[];
  templates: TicketTemplate[];
  settings: AppSettings;
}

// ----- Display maps -----

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

export const IPAD_STATUS_LABELS: Record<IpadStatus, string> = {
  in_stock: "In stock",
  loaned: "Loaned out",
  needs_setup: "Needs setup",
  broken: "Broken",
  sent_for_repair: "Sent for repair",
  retired: "Retired",
};

export const REQUESTER_TYPE_LABELS: Record<RequesterType, string> = {
  staff: "Staff",
  student: "Student",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  screen: "Screen",
  battery: "Battery",
  mdm: "MDM / Profile",
  network: "Network",
  app: "App / Software",
  lost_stolen: "Lost / stolen",
  setup: "Setup",
  other: "Other",
};

export const TECH_ROLE_LABELS: Record<Tech["role"], string> = {
  lead: "Lead",
  tech: "Tech",
  front_desk: "Front desk",
};
