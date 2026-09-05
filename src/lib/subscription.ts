export type PlanType = 'free' | 'accounting' | 'hr' | 'crm' | 'promotion' | 'suite';
export type ModuleType = 'accounting' | 'hr' | 'crm' | 'promotion' | 'admin';

export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Business Starter',
  accounting: 'Business Accounting',
  hr: 'Business HR',
  crm: 'Business CRM',
  promotion: 'Business Promotion',
  suite: 'Business Suite',
};

/**
 * Check if the given plan has full access to a specific module.
 */
export function hasModuleAccess(plan: PlanType = 'free', module: ModuleType): boolean {
  if (plan === 'suite') return true;

  switch (module) {
    case 'accounting':
      return plan === 'free' || plan === 'accounting';
    case 'hr':
      return true; // HR is visible to all plans, limits apply instead
    case 'crm':
      return plan === 'free' || plan === 'crm';
    case 'promotion':
      return plan === 'free' || plan === 'promotion';
    case 'admin':
      return plan !== 'free'; // Any paid plan has some admin access, but 'free' has none.
    default:
      return false;
  }
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
  employees: 10,
  outreach_messages: 500,
};
