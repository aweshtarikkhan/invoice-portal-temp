/**
 * High-contrast, vibrant, and visually distinct color palette for charts and reports.
 * Engineered so that adjacent and low-index entries never share similar hues or shades.
 * 
 * Order:
 * 1. Royal Blue    (#2563EB)
 * 2. Emerald Green (#10B981)
 * 3. Golden Amber  (#F59E0B)
 * 4. Crimson Red   (#EF4444)
 * 5. Vivid Purple  (#8B5CF6)
 * 6. Bright Cyan   (#06B6D4)
 * 7. Hot Pink      (#EC4899)
 * 8. Tangerine     (#F97316)
 * 9. Slate Grey    (#64748B)
 * 10. Lime Green   (#84CC16)
 */
export const DISTINCT_CHART_COLORS = [
  "#2563eb", // Royal Blue
  "#10b981", // Emerald Green
  "#f59e0b", // Golden Amber
  "#ef4444", // Crimson Red
  "#8b5cf6", // Vivid Purple
  "#06b6d4", // Bright Cyan
  "#ec4899", // Hot Pink
  "#f97316", // Tangerine Orange
  "#64748b", // Slate Grey
  "#84cc16", // Lime Green
  "#14b8a6", // Teal
  "#6366f1", // Indigo
];

/**
 * High-contrast semantic mapping for invoice and document statuses
 */
export const STATUS_PIE_COLORS: Record<string, string> = {
  paid: "#10b981",       // Vibrant Green
  unpaid: "#2563eb",     // Royal Blue
  overdue: "#ef4444",    // Crimson Red
  partial: "#f59e0b",    // Golden Amber
  sent: "#8b5cf6",       // Vivid Purple
  viewed: "#06b6d4",     // Bright Cyan
  draft: "#64748b",      // Slate Grey
  accepted: "#10b981",   // Emerald Green
  converted: "#10b981",  // Emerald Green
  declined: "#ef4444",   // Red
  expired: "#f59e0b",    // Amber
  void: "#94a3b8",       // Light Grey
  cancelled: "#94a3b8",  // Light Grey
};
