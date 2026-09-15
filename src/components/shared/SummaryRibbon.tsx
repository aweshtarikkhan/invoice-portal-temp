import { ReactNode } from "react";
import { AutoFitNumber } from "@/components/shared/AutoFitNumber";

interface SummaryItem {
  label: string;
  value: ReactNode;
  accent?: "default" | "success" | "warning" | "danger" | "info";
  hint?: string;
  onClick?: () => void;
}

interface SummaryRibbonProps {
  label: string;
  items: SummaryItem[];
}

const accentClass: Record<NonNullable<SummaryItem["accent"]>, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-orange-600 dark:text-orange-400",
  danger: "text-rose-600 dark:text-rose-400",
  info: "text-blue-600 dark:text-blue-400",
};

export function SummaryRibbon({ label, items }: SummaryRibbonProps) {
  const cols =
    items.length <= 2 ? "sm:grid-cols-2" :
    items.length === 3 ? "sm:grid-cols-3" :
    items.length === 4 ? "grid-cols-2 lg:grid-cols-4" :
    "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5";
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className={`grid ${cols} gap-3 sm:gap-4`}>
        {items.map((it, i) => {
          const content = (
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 truncate" title={it.label}>
                {it.label}
              </p>
              <div className={`leading-tight min-w-0 ${accentClass[it.accent || "default"]}`}>
                <AutoFitNumber value={it.value} maxSize="3xl" />
              </div>
              {it.hint && <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate" title={it.hint}>{it.hint}</p>}
            </div>
          );
          
          return it.onClick ? (
            <button
              key={i}
              onClick={it.onClick}
              className="rounded-2xl bg-card border border-border/60 shadow-sm px-4 py-3.5 sm:px-5 sm:py-4 xl:px-4 xl:py-4 2xl:px-6 2xl:py-5 transition-all hover:shadow-md hover:-translate-y-0.5 text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-w-0 overflow-hidden"
            >
              {content}
            </button>
          ) : (
            <div
              key={i}
              className="rounded-2xl bg-card border border-border/60 shadow-sm px-4 py-3.5 sm:px-5 sm:py-4 xl:px-4 xl:py-4 2xl:px-6 2xl:py-5 transition-all hover:shadow-md hover:-translate-y-0.5 min-w-0 overflow-hidden"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
