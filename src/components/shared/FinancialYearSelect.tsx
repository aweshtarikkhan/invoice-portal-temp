import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFinancialYearsList, getCurrentFinancialYear, FinancialYear } from "@/lib/financial-year";
import { Calendar } from "lucide-react";

interface FinancialYearSelectProps {
  value: string;
  onValueChange: (value: string, fy?: FinancialYear) => void;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
}

export function FinancialYearSelect({
  value,
  onValueChange,
  includeAll = false,
  allLabel = "All Financial Years",
  className = "w-48",
}: FinancialYearSelectProps) {
  const fyList = useMemo(() => getFinancialYearsList(4, 1), []);

  const handleChange = (newVal: string) => {
    if (newVal === "all") {
      onValueChange("all", undefined);
    } else {
      const match = fyList.find((f) => f.key === newVal);
      onValueChange(newVal, match);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className={`h-9 text-xs font-medium bg-background ${className}`}>
          <div className="flex items-center gap-2 truncate">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select FY" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="all">{allLabel}</SelectItem>}
          {fyList.map((fy) => (
            <SelectItem key={fy.key} value={fy.key}>
              <span className="flex items-center gap-2">
                <span>{fy.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  (01 Apr {fy.startYear} – 31 Mar {fy.endYear})
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
