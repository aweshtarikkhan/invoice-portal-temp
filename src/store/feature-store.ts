import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

// All feature groups with their items
export interface FeatureItem {
  key: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  url: string;
}

export interface FeatureGroup {
  key: string;
  label: string;
  icon: string;
  description: string;
  items: FeatureItem[];
}

export interface TeamMember {
  email: string;
  role: string;
  permissions: string[]; // Keys of FeatureGroups they can access
}

// Default features (now empty as all modules are toggleable)
export const DEFAULT_FEATURE_GROUPS: FeatureGroup[] = [];

// Admin-controlled feature groups
export const ADMIN_FEATURE_GROUPS: FeatureGroup[] = [
  {
    key: "sales",
    label: "Sales",
    icon: "FileText",
    description: "Invoices, Estimates, Credit Notes & more",
    items: [
      { key: "invoices", title: "Invoices", description: "Create & manage invoices", icon: "FileText", url: "/invoices" },
      { key: "estimates", title: "Estimates", description: "Send quotes to clients", icon: "ClipboardList", url: "/estimates" },
      { key: "clients", title: "Clients", description: "Manage your customers", icon: "Users", url: "/clients" },
      { key: "credit-notes", title: "Credit Notes", description: "Issue credit notes", icon: "FileMinus2", url: "/credit-notes" },
      { key: "payments", title: "Payments Received", description: "Track all payments", icon: "CreditCard", url: "/payments" },
      { key: "delivery-challans", title: "Delivery Challans", description: "Manage delivery challans", icon: "Truck", url: "/delivery-challans" },
      { key: "recurring", title: "Recurring Invoices", description: "Set up recurring billing", icon: "RefreshCw", url: "/recurring-invoices" },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    icon: "Package",
    description: "Items & Inventory management",
    items: [
      { key: "items", title: "Items", description: "Products & services catalog", icon: "Package", url: "/items" },
      { key: "inventory", title: "Inventory", description: "Stock management", icon: "Boxes", url: "/inventory" },
      { key: "warehouses", title: "Warehouses", description: "Multi-warehouse locations", icon: "Warehouse", url: "/warehouses" },
    ],
  },
  {
    key: "purchases",
    label: "Purchases",
    icon: "ShoppingCart",
    description: "Vendors, Purchase Orders, Bills & Expenses",
    items: [
      { key: "vendors", title: "Vendors", description: "Manage vendors & suppliers", icon: "Truck", url: "/vendors" },
      { key: "purchase-orders", title: "Purchase Orders", description: "Create purchase orders", icon: "ClipboardList", url: "/purchase-orders" },
      { key: "grns", title: "Goods Receipt (GRN)", description: "Track received goods", icon: "PackageCheck", url: "/grns" },
      { key: "bills", title: "Bills", description: "Manage vendor bills", icon: "Receipt", url: "/bills" },
      { key: "expenses", title: "Expenses", description: "Track business expenses", icon: "Coins", url: "/expenses" },
    ],
  },
  {
    key: "accounting",
    label: "Accounting",
    icon: "Calculator",
    description: "Chart of Accounts, Journal Entries & Banking",
    items: [
      { key: "accounts", title: "Chart of Accounts", description: "Manage accounts", icon: "BookOpen", url: "/accounts" },
      { key: "journal", title: "Journal Entries", description: "Record journal entries", icon: "Calculator", url: "/journal" },
      { key: "bank-accounts", title: "Bank & Cash", description: "Bank account management", icon: "Landmark", url: "/bank-accounts" },
      { key: "cash-flow", title: "Cash Flow", description: "Cash flow analysis", icon: "PieChart", url: "/cash-flow" },
      { key: "branches", title: "Branches", description: "Multi-branch management", icon: "Building2", url: "/branches" },
      { key: "warehouses", title: "Warehouses", description: "Warehouse locations", icon: "Warehouse", url: "/warehouses" },
      { key: "tds", title: "TDS", description: "Tax deducted at source", icon: "Percent", url: "/tds" },
      { key: "accounting-reports", title: "Accounting Reports", description: "Financial reports", icon: "Landmark", url: "/accounting-reports" },
    ],
  },
  {
    key: "people",
    label: "People & HR",
    icon: "UserCog",
    description: "Employees, Attendance, Payroll & Leaves",
    items: [
      { key: "employees", title: "Employees", description: "Manage employees", icon: "UserCog", url: "/employees" },
      { key: "attendance", title: "Attendance", description: "Track attendance", icon: "CalendarCheck", url: "/attendance" },
      { key: "leaves", title: "Leaves", description: "Leave management", icon: "ClipboardList", url: "/leaves" },
      { key: "shifts", title: "Shifts", description: "Shift scheduling", icon: "CalendarCheck", url: "/shifts" },
      { key: "employee-documents", title: "Documents", description: "Employee documents", icon: "ScrollText", url: "/employee-documents" },
      { key: "payroll", title: "Payroll", description: "Payroll processing", icon: "Calculator", url: "/payroll" },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    icon: "Users",
    description: "Leads, Pipeline & Sales Activities",
    items: [
      { key: "leads", title: "Leads", description: "Manage sales leads", icon: "Users", url: "/leads" },
      { key: "pipeline", title: "Pipeline", description: "Sales pipeline view", icon: "BarChart3", url: "/pipeline" },
      { key: "activities", title: "Activities", description: "Track CRM activities", icon: "ClipboardList", url: "/activities" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: "Send",
    description: "Campaigns, Templates & Automations",
    items: [
      { key: "campaigns", title: "Campaigns", description: "Email & SMS campaigns", icon: "Send", url: "/campaigns" },
      { key: "marketing-templates", title: "Templates", description: "Marketing templates", icon: "MessageSquare", url: "/marketing/templates" },
      { key: "journeys", title: "Journeys", description: "Customer journeys", icon: "Workflow", url: "/journeys" },
      { key: "message-logs", title: "Message Logs", description: "View sent messages", icon: "ScrollText", url: "/message-logs" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: "BarChart3",
    description: "Statements, P&L, GST & Inventory Reports",
    items: [
      { key: "statements", title: "Statements", description: "Customer statements", icon: "FileSpreadsheet", url: "/statements" },
      { key: "reports", title: "Reports", description: "All business reports", icon: "BarChart3", url: "/reports" },
      { key: "profit-loss", title: "Profit & Loss", description: "P&L statements", icon: "PieChart", url: "/profit-loss" },
      { key: "gst-returns", title: "GST Returns", description: "GST filing reports", icon: "FileBarChart2", url: "/gst-returns" },
      { key: "inventory-valuation", title: "Inventory Valuation", description: "Stock valuation reports", icon: "Boxes", url: "/inventory-valuation" },
    ],
  },
];

// Settings features (shown under settings gear icon)
export const SETTINGS_FEATURES: FeatureItem[] = [
  { key: "templates", title: "Templates", description: "Invoice templates", icon: "Layout", url: "/templates" },
  { key: "custom-fields", title: "Custom Fields", description: "Add custom data fields", icon: "SlidersHorizontal", url: "/custom-fields" },
  { key: "audit-logs", title: "Audit Logs", description: "Activity history", icon: "ScrollText", url: "/audit-logs" },
  { key: "settings", title: "Settings", description: "Organization settings", icon: "Settings", url: "/settings" },
];

// All groups combined for dashboard tiles
export const ALL_FEATURE_GROUPS: FeatureGroup[] = [
  ...DEFAULT_FEATURE_GROUPS,
  ...ADMIN_FEATURE_GROUPS,
  {
    key: "system",
    label: "System & Settings",
    icon: "Settings",
    description: "Templates, Custom Fields & Configuration",
    items: SETTINGS_FEATURES,
  },
];

const FEATURES_STORAGE_KEY = "billflow-enabled-features";
const ORG_FEATURES_STORAGE_KEY = "billflow-org-features";
const ADMINS_STORAGE_KEY = "billflow-admin-users";
const TEAM_MEMBERS_STORAGE_KEY = "billflow-team-members";

// Default super admin email
const DEFAULT_SUPER_ADMIN_EMAIL = "awesh.etpl@gmail.com";

interface FeatureState {
  currentOrgId: string | null;
  enabledGroups: string[];
  orgFeatures: Record<string, string[]>;
  adminEmails: string[];
  
  // Org features actions
  setOrgFeatures: (orgId: string, features: string[]) => void;
  initOrgFeatures: (orgId: string) => void;
  toggleGroup: (groupKey: string, orgId?: string) => Promise<void>;
  enableGroup: (groupKey: string, orgId?: string) => Promise<void>;
  disableGroup: (groupKey: string, orgId?: string) => Promise<void>;
  isGroupEnabled: (groupKey: string) => boolean;

  // Platform features & general
  platformFeatures: string[];
  setPlatformFeatures: (features: string[]) => void;
  setFeatures: (features: string[]) => void;

  // Admin management
  isSuperAdmin: (email: string | null | undefined) => boolean;
  isAdmin: (email: string | null | undefined) => boolean;
  addAdmin: (email: string) => void;
  removeAdmin: (email: string) => void;
  getAdminEmails: () => string[];
  
  // Team Management (Organization users)
  teamMembers: Record<string, TeamMember[]>; // org_id -> TeamMember array
  addTeamMember: (orgId: string, member: TeamMember) => void;
  removeTeamMember: (orgId: string, email: string) => void;
}

const loadAdminEmails = (): string[] => {
  try {
    const stored = localStorage.getItem(ADMINS_STORAGE_KEY);
    if (stored) {
      const emails: string[] = JSON.parse(stored);
      if (!emails.includes(DEFAULT_SUPER_ADMIN_EMAIL)) {
        emails.push(DEFAULT_SUPER_ADMIN_EMAIL);
      }
      return emails;
    }
  } catch {}
  return [DEFAULT_SUPER_ADMIN_EMAIL];
};

const loadTeamMembers = (): Record<string, TeamMember[]> => {
  try {
    const stored = localStorage.getItem(TEAM_MEMBERS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
};

const loadOrgFeatures = (): Record<string, string[]> => {
  try {
    const stored = localStorage.getItem(ORG_FEATURES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
};

const loadEnabledGroups = (): string[] => {
  try {
    const stored = localStorage.getItem(FEATURES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ADMIN_FEATURE_GROUPS.map(g => g.key);
};

export const useFeatureStore = create<FeatureState>((set, get) => ({
  currentOrgId: null,
  enabledGroups: loadEnabledGroups(),
  orgFeatures: loadOrgFeatures(),
  platformFeatures: ADMIN_FEATURE_GROUPS.map(g => g.key),
  adminEmails: loadAdminEmails(),
  teamMembers: loadTeamMembers(),

  setOrgFeatures: (orgId: string, features: string[]) => {
    const newOrgFeatures = { ...get().orgFeatures, [orgId]: features };
    try {
      localStorage.setItem(ORG_FEATURES_STORAGE_KEY, JSON.stringify(newOrgFeatures));
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features));
    } catch {}
    set({
      currentOrgId: orgId,
      orgFeatures: newOrgFeatures,
      enabledGroups: features,
    });
  },

  initOrgFeatures: (orgId: string) => {
    const existing = get().orgFeatures[orgId];
    const features = existing || ADMIN_FEATURE_GROUPS.map(g => g.key);
    get().setOrgFeatures(orgId, features);
  },

  setPlatformFeatures: (features: string[]) => {
    set({ platformFeatures: features });
  },

  setFeatures: (features: string[]) => {
    try {
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features));
    } catch {}
    set({ enabledGroups: features });
  },

  toggleGroup: async (groupKey: string, orgId?: string) => {
    const targetOrgId = orgId || get().currentOrgId || "default";
    const currentList = get().orgFeatures[targetOrgId] || get().enabledGroups || ADMIN_FEATURE_GROUPS.map(g => g.key);
    const updated = currentList.includes(groupKey)
      ? currentList.filter((k) => k !== groupKey)
      : [...currentList, groupKey];

    const newOrgFeatures = { ...get().orgFeatures, [targetOrgId]: updated };
    try {
      localStorage.setItem(ORG_FEATURES_STORAGE_KEY, JSON.stringify(newOrgFeatures));
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    set({
      orgFeatures: newOrgFeatures,
      enabledGroups: updated,
    });

    // Sync to Supabase organizations table for this specific business
    if (targetOrgId && targetOrgId !== "default") {
      try {
        await supabase
          .from("organizations")
          .update({ enabled_features: updated as any })
          .eq("id", targetOrgId);
      } catch (err) {
        console.error("Failed to update organization enabled_features in Supabase:", err);
      }
    }
  },

  enableGroup: async (groupKey: string, orgId?: string) => {
    const targetOrgId = orgId || get().currentOrgId || "default";
    const currentList = get().orgFeatures[targetOrgId] || get().enabledGroups || ADMIN_FEATURE_GROUPS.map(g => g.key);
    if (!currentList.includes(groupKey)) {
      const updated = [...currentList, groupKey];
      const newOrgFeatures = { ...get().orgFeatures, [targetOrgId]: updated };
      try {
        localStorage.setItem(ORG_FEATURES_STORAGE_KEY, JSON.stringify(newOrgFeatures));
        localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      set({ orgFeatures: newOrgFeatures, enabledGroups: updated });

      if (targetOrgId && targetOrgId !== "default") {
        try {
          await supabase.from("organizations").update({ enabled_features: updated as any }).eq("id", targetOrgId);
        } catch {}
      }
    }
  },

  disableGroup: async (groupKey: string, orgId?: string) => {
    const targetOrgId = orgId || get().currentOrgId || "default";
    const currentList = get().orgFeatures[targetOrgId] || get().enabledGroups || ADMIN_FEATURE_GROUPS.map(g => g.key);
    const updated = currentList.filter((k) => k !== groupKey);
    const newOrgFeatures = { ...get().orgFeatures, [targetOrgId]: updated };
    try {
      localStorage.setItem(ORG_FEATURES_STORAGE_KEY, JSON.stringify(newOrgFeatures));
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ orgFeatures: newOrgFeatures, enabledGroups: updated });

    if (targetOrgId && targetOrgId !== "default") {
      try {
        await supabase.from("organizations").update({ enabled_features: updated as any }).eq("id", targetOrgId);
      } catch {}
    }
  },

  isGroupEnabled: (groupKey: string) => {
    const state = get();
    // It must be enabled for this business AND allowed by the platform
    return state.enabledGroups.includes(groupKey) && state.platformFeatures.includes(groupKey);
  },

  // Admin management
  isSuperAdmin: (email: string | null | undefined) => {
    if (!email) return false;
    return email.toLowerCase().trim() === DEFAULT_SUPER_ADMIN_EMAIL;
  },

  isAdmin: (email: string | null | undefined) => {
    if (!email) return false;
    const isSuper = get().isSuperAdmin(email);
    if (isSuper) return true;
    return get().adminEmails.includes(email.toLowerCase().trim());
  },

  addAdmin: (email: string) => {
    const current = get().adminEmails;
    const normalized = email.toLowerCase().trim();
    if (!current.includes(normalized)) {
      const updated = [...current, normalized];
      try {
        localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      set({ adminEmails: updated });
    }
  },

  removeAdmin: (email: string) => {
    const normalized = email.toLowerCase().trim();
    if (normalized === DEFAULT_SUPER_ADMIN_EMAIL) return;
    const current = get().adminEmails;
    const updated = current.filter((e) => e !== normalized);
    try {
      localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ adminEmails: updated });
  },

  getAdminEmails: () => {
    return get().adminEmails;
  },

  // Team Management
  addTeamMember: (orgId: string, member: TeamMember) => {
    const current = get().teamMembers;
    const orgMembers = current[orgId] || [];
    const normalizedEmail = member.email.toLowerCase().trim();
    
    if (orgMembers.some(m => m.email === normalizedEmail)) return;
    
    const newMember = { ...member, email: normalizedEmail };
    const updated = { ...current, [orgId]: [...orgMembers, newMember] };
    try {
      localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ teamMembers: updated });
  },
  
  removeTeamMember: (orgId: string, email: string) => {
    const current = get().teamMembers;
    const orgMembers = current[orgId] || [];
    const normalized = email.toLowerCase().trim();
    
    const updated = { 
      ...current, 
      [orgId]: orgMembers.filter(e => e.email !== normalized) 
    };
    
    try {
      localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ teamMembers: updated });
  },
}));
