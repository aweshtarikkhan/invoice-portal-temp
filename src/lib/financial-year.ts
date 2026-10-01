/**
 * Indian Financial Year (FY) Utilities
 * Financial Year runs from April 1 to March 31.
 * e.g., FY 2026-27 is 01-Apr-2026 to 31-Mar-2027.
 */

export interface FinancialYear {
  key: string;            // "2026-27"
  label: string;          // "FY 2026-27"
  shortLabel: string;     // "2026-27"
  startYear: number;      // 2026
  endYear: number;        // 2027
  startDate: string;      // "2026-04-01"
  endDate: string;        // "2027-03-31"
  isCurrent: boolean;
}

export interface FYQuarter {
  key: string;            // "Q1", "Q2", "Q3", "Q4"
  label: string;          // "Q1 (Apr - Jun)"
  quarterNum: number;     // 1, 2, 3, 4
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
}

export interface FYMonth {
  key: string;            // "04", "05", ..., "03"
  label: string;          // "Apr 2026"
  shortMonth: string;     // "Apr"
  monthNum: number;       // 1-12 calendar month
  year: number;           // calendar year
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
}

/**
 * Returns the current Indian Financial Year based on reference date (default: now).
 */
export function getCurrentFinancialYear(refDate: Date = new Date()): FinancialYear {
  const month = refDate.getMonth(); // 0 = Jan, 3 = Apr
  const year = refDate.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  const key = `${startYear}-${String(endYear).slice(-2)}`;

  return {
    key,
    label: `FY ${key}`,
    shortLabel: key,
    startYear,
    endYear,
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
    isCurrent: true,
  };
}

/**
 * Build a FinancialYear object from a key like "2026-27" or startYear number.
 */
export function getFinancialYearByKey(keyOrStartYear: string | number): FinancialYear {
  let startYear: number;
  if (typeof keyOrStartYear === "number") {
    startYear = keyOrStartYear;
  } else {
    const parts = keyOrStartYear.split("-");
    startYear = parseInt(parts[0], 10);
  }

  const endYear = startYear + 1;
  const key = `${startYear}-${String(endYear).slice(-2)}`;
  const currentFY = getCurrentFinancialYear();

  return {
    key,
    label: `FY ${key}`,
    shortLabel: key,
    startYear,
    endYear,
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
    isCurrent: key === currentFY.key,
  };
}

/**
 * Returns a list of Financial Years (past, current, and future).
 */
export function getFinancialYearsList(pastCount: number = 4, futureCount: number = 1): FinancialYear[] {
  const current = getCurrentFinancialYear();
  const list: FinancialYear[] = [];

  for (let offset = futureCount; offset >= -pastCount; offset--) {
    const startYear = current.startYear + offset;
    const endYear = startYear + 1;
    const key = `${startYear}-${String(endYear).slice(-2)}`;
    list.push({
      key,
      label: `FY ${key}${offset === 0 ? " (Current)" : ""}`,
      shortLabel: key,
      startYear,
      endYear,
      startDate: `${startYear}-04-01`,
      endDate: `${endYear}-03-31`,
      isCurrent: offset === 0,
    });
  }

  return list;
}

/**
 * Returns the 4 quarters of a Financial Year (Apr-Jun, Jul-Sep, Oct-Dec, Jan-Mar).
 */
export function getFinancialYearQuarters(fyKey: string): FYQuarter[] {
  const fy = getFinancialYearByKey(fyKey);
  const sY = fy.startYear;
  const eY = fy.endYear;

  return [
    { key: "Q1", label: "Q1 (Apr – Jun)", quarterNum: 1, startDate: `${sY}-04-01`, endDate: `${sY}-06-30` },
    { key: "Q2", label: "Q2 (Jul – Sep)", quarterNum: 2, startDate: `${sY}-07-01`, endDate: `${sY}-09-30` },
    { key: "Q3", label: "Q3 (Oct – Dec)", quarterNum: 3, startDate: `${sY}-10-01`, endDate: `${sY}-12-31` },
    { key: "Q4", label: "Q4 (Jan – Mar)", quarterNum: 4, startDate: `${eY}-01-01`, endDate: `${eY}-03-31` },
  ];
}

/**
 * Returns the 12 months of a Financial Year in chronological order (Apr to Mar).
 */
export function getFinancialYearMonths(fyKey: string): FYMonth[] {
  const fy = getFinancialYearByKey(fyKey);
  const sY = fy.startYear;
  const eY = fy.endYear;

  const monthConfigs = [
    { name: "Apr", num: 4, year: sY, lastDay: 30 },
    { name: "May", num: 5, year: sY, lastDay: 31 },
    { name: "Jun", num: 6, year: sY, lastDay: 30 },
    { name: "Jul", num: 7, year: sY, lastDay: 31 },
    { name: "Aug", num: 8, year: sY, lastDay: 31 },
    { name: "Sep", num: 9, year: sY, lastDay: 30 },
    { name: "Oct", num: 10, year: sY, lastDay: 31 },
    { name: "Nov", num: 11, year: sY, lastDay: 30 },
    { name: "Dec", num: 12, year: sY, lastDay: 31 },
    { name: "Jan", num: 1, year: eY, lastDay: 31 },
    { name: "Feb", num: 2, year: eY, lastDay: (eY % 4 === 0 && (eY % 100 !== 0 || eY % 400 === 0)) ? 29 : 28 },
    { name: "Mar", num: 3, year: eY, lastDay: 31 },
  ];

  return monthConfigs.map((m) => {
    const padNum = String(m.num).padStart(2, "0");
    return {
      key: `${m.year}-${padNum}`,
      label: `${m.name} ${m.year}`,
      shortMonth: m.name,
      monthNum: m.num,
      year: m.year,
      startDate: `${m.year}-${padNum}-01`,
      endDate: `${m.year}-${padNum}-${String(m.lastDay).padStart(2, "0")}`,
    };
  });
}

/**
 * Checks if a date string/Date falls within a given Financial Year.
 */
export function isDateInFinancialYear(dateVal: string | Date | null | undefined, fyKey: string): boolean {
  if (!dateVal) return false;
  const d = typeof dateVal === "string" ? new Date(dateVal.slice(0, 10)) : dateVal;
  if (isNaN(d.getTime())) return false;
  const fy = getFinancialYearByKey(fyKey);
  const start = new Date(`${fy.startDate}T00:00:00`);
  const end = new Date(`${fy.endDate}T23:59:59`);
  return d >= start && d <= end;
}

/**
 * Returns the FinancialYear that contains the given date.
 */
export function getFinancialYearForDate(dateVal: string | Date): FinancialYear {
  const d = typeof dateVal === "string" ? new Date(dateVal.slice(0, 10)) : dateVal;
  return getCurrentFinancialYear(d);
}
