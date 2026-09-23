export type PlanType = 'free' | 'accounting' | 'hr' | 'crm' | 'promotion' | 'suite';
export type ModuleType = 'accounting' | 'hr' | 'crm' | 'promotion' | 'admin' | 'outreach';

export const PLAN_NAMES: Record<string, string> = {
  free: 'Business Starter',
  plan_1: 'Business Starter',
  accounting: 'Business Accounting',
  plan_2: 'Business Accounting',
  hr: 'Business HR',
  plan_4: 'Business HR',
  crm: 'Business CRM',
  plan_5: 'Business CRM',
  promotion: 'Business Promotion',
  plan_6: 'Business Promotion',
  suite: 'Business Suite',
  plan_3: 'Business Suite',
};

export function normalizePlanKey(plan: string = ''): string {
  const p = String(plan || '').toLowerCase().trim();
  if (p.includes('suite') || p.includes('plan_3') || p.includes('flagship') || p.includes('enterprise')) return 'suite';
  if (p.includes('hr') || p.includes('plan_4') || p.includes('people')) return 'hr';
  if (p.includes('accounting') || p.includes('plan_2') || p.includes('sales')) return 'accounting';
  if (p.includes('crm') || p.includes('plan_5')) return 'crm';
  if (p.includes('promotion') || p.includes('marketing') || p.includes('plan_6')) return 'promotion';
  if (p.includes('free') || p.includes('plan_1') || p.includes('starter')) return 'free';
  return p || 'free';
}

export function getPlanDisplayName(plan: string = 'free', employeeLimit?: number | null): string {
  const p = normalizePlanKey(plan);
  if (p === 'free') {
    if (typeof employeeLimit === 'number' && employeeLimit > 10) {
      return 'Business Suite';
    }
    if (typeof employeeLimit === 'number' && employeeLimit > 3) {
      return 'Business Accounting';
    }
    return 'Business Starter';
  }
  return PLAN_NAMES[p] || 'Business Suite';
}

/**
 * Check if the given plan has full access to a specific module.
 */
export function hasModuleAccess(plan: string = 'free', module: ModuleType): boolean {
  const p = normalizePlanKey(plan);
  if (p === 'suite') return true;
  if (p === module) return true;

  switch (module) {
    case 'accounting':
      return true; // Accounting & Invoices is visible to all plans, limits apply on free plan
    case 'hr':
      return true; // HR is visible to all plans, limits apply instead
    case 'crm':
      return true; // CRM is visible to all plans, limits apply instead
    case 'promotion':
      return true; // Promotion is visible to all plans
    case 'outreach':
      return true; // Outreach is visible to all plans
    case 'admin':
      return p !== 'free';
    default:
      return true;
  }
}

/**
 * Calculates the exact employee limit for a given plan configuration.
 * 
 * Rules:
 * 1. Base Plan Limits:
 *    - Business Starter (Free): 3 employees
 *    - Business Accounting: 3 employees
 *    - Business CRM: 3 employees
 *    - Business Promotion: 3 employees
 *    - Business HR: 25 employees (expandable via add-on)
 *    - Business Suite: 25 employees (expandable via add-on)
 * 
 * 2. No Accidental Summing:
 *    Even if multiple plans are active (or Business Suite is active),
 *    limits are NOT summed up (e.g. 3 + 25 = 28 is never done).
 *    The highest base limit among active tiers applies (25 for Suite/HR).
 * 
 * 3. Dynamic Capacity Expansion:
 *    Extra employee capacity (+₹29 each) can ONLY be purchased/applied
 *    for Business HR or Business Suite. Other plans (Accounting, Free, CRM, Promotion)
 *    are strictly capped at 3 employees.
 *    If an upgraded business was temporarily marked 'free' in DB, purchasedLimit > 10
 *    automatically preserves its Business Suite/HR scale.
 */
export function calculateEmployeeLimit(planStr: string = 'free', purchasedLimit?: number | null): number {
  const p = normalizePlanKey(planStr);

  // Base employee limits:
  // Business Suite: 25 base employees (expandable if additional purchased)
  // Business HR, Business Accounting, Starter, CRM, Promotion: 3 base employees (expandable if additional purchased)
  let baseLimit = 3;
  if (p === 'suite') {
    baseLimit = 25;
  } else {
    baseLimit = 3;
  }

  // Self-heal: If plan was marked 'free' but has purchased capacity (>10), it's Suite scale
  if (p === 'free' && typeof purchasedLimit === 'number' && purchasedLimit > 10) {
    baseLimit = 25;
  }

  // Extra employee capacity add-ons or purchased limits:
  if (typeof purchasedLimit === 'number' && purchasedLimit > baseLimit) {
    return purchasedLimit;
  }

  return baseLimit;
}

/**
 * Limits for the Free Plan
 */
export const FREE_PLAN_LIMITS = {
  invoices: 100,
  employees: 3,
  leads: 50,
  outreach_messages: 100,
};

export const PAID_PLAN_LIMITS = {
  employees: 25,
  outreach_messages: 500,
};

/**
 * Check if the current plan or active modular plans include Business Suite or Business CRM.
 * - Business Suite & Business CRM: Unlimited Leads
 * - Other plans (Starter/Free, Accounting, HR, Promotion): 50 leads maximum
 */
export function hasUnlimitedLeads(planStr: string = '', activePlans: string[] = []): boolean {
  if (Array.isArray(activePlans) && activePlans.length > 0) {
    const hasActiveCrmOrSuite = activePlans.some(p => {
      const norm = normalizePlanKey(p);
      return norm === 'suite' || norm === 'crm';
    });
    if (hasActiveCrmOrSuite) return true;
  }
  const p = String(planStr || '').toLowerCase();
  return (
    p.includes('suite') ||
    p.includes('crm') ||
    p.includes('plan_3') ||
    p.includes('plan_5') ||
    p.includes('flagship') ||
    p.includes('enterprise')
  );
}

export function getLeadLimit(planStr: string = '', activePlans: string[] = []): number {
  return hasUnlimitedLeads(planStr, activePlans) ? Infinity : 50;
}

/**
 * Check if the current plan or active modular plans include Business Suite or Business Accounting.
 * - Business Suite & Business Accounting: Unlimited Invoices
 * - Other plans (Starter/Free, HR, CRM, Promotion): 100 invoices maximum
 */
export function hasUnlimitedInvoices(planStr: string = '', activePlans: string[] = []): boolean {
  if (Array.isArray(activePlans) && activePlans.length > 0) {
    const hasActiveAccountingOrSuite = activePlans.some(p => {
      const norm = normalizePlanKey(p);
      return norm === 'suite' || norm === 'accounting';
    });
    if (hasActiveAccountingOrSuite) return true;
  }
  const p = String(planStr || '').toLowerCase();
  return (
    p.includes('suite') ||
    p.includes('accounting') ||
    p.includes('plan_2') ||
    p.includes('plan_3') ||
    p.includes('flagship') ||
    p.includes('enterprise')
  );
}

export function getInvoiceLimit(planStr: string = '', activePlans: string[] = []): number {
  return hasUnlimitedInvoices(planStr, activePlans) ? Infinity : 100;
}
