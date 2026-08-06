import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  address: Record<string, string>;
  phone: string | null;
  email: string | null;
  website: string | null;
  tax_number: string | null;
  tax_name: string | null;
  currency_code: string;
  invoice_prefix: string;
  invoice_next_number: number;
  estimate_prefix: string;
  estimate_next_number: number;
  credit_note_prefix: string;
  credit_note_next_number: number;
  payment_prefix: string;
  payment_terms: number;
  default_notes: string | null;
  default_terms: string | null;
  template_style: string;
  template_accent_color: string;
  template_font: string;
  template_show_logo: boolean;
  template_paper_size: string;
  gst_enabled: boolean;
  gst_number: string | null;
  show_client_gst: boolean;
  qr_code_enabled: boolean;
  upi_id: string | null;
  inventory_enabled: boolean;
  low_stock_threshold: number;
  weekly_offs: number[];
  daily_wages_enabled?: boolean;
}

interface BasicOrgInfo {
  id: string;
  name: string;
}

interface AppState {
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  // Multi-business support
  myOrganizations: BasicOrgInfo[];
  addMyOrganization: (org: BasicOrgInfo) => void;
  reset: () => void;
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      organization: null,
      setOrganization: (org) => {
        set({ organization: org });
        if (org) {
          get().addMyOrganization({ id: org.id, name: org.name });
        }
      },
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      myOrganizations: [],
      addMyOrganization: (org) => {
        const current = get().myOrganizations;
        if (!current.find((o) => o.id === org.id)) {
          set({ myOrganizations: [...current, org] });
        }
      },
      reset: () => {
        set({ organization: null, myOrganizations: [], userRole: null });
      },
      currentUserId: null,
      setCurrentUserId: (id) => {
        const current = get().currentUserId;
        if (current !== id) {
          // Forcefully clear organizations when user changes or on first load after fix
          set({ currentUserId: id, myOrganizations: [] });
        }
      },
      userRole: null,
      setUserRole: (role) => set({ userRole: role }),
    }),
    {
      name: "billflow-app-storage",
      partialize: (state) => ({ 
        myOrganizations: state.myOrganizations,
        currentUserId: state.currentUserId
      }),
    }
  )
);
