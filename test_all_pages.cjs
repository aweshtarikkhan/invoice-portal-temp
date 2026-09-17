const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:8081';

// Every single page / route in the system
const routesToTest = [
  // Public & Marketing Pages
  '/',
  '/login',
  '/register',
  '/brochure',
  '/pamphlet',
  '/launch-posts',
  '/privacy',
  '/terms',
  '/refund',
  '/partner',
  '/hr',
  '/crm',
  '/marketing',

  // Core Management
  '/dashboard',
  '/clients',
  '/invoices',
  '/invoices/new',
  '/tally-sync',
  '/estimates',
  '/estimates/new',
  '/payments',
  '/credit-notes',
  '/credit-notes/new',
  '/recurring-invoices',
  '/statements',
  '/emails',
  '/chats',

  // Inventory & Catalog
  '/items',
  '/inventory',
  '/warehouses',
  '/inventory-valuation',
  '/delivery-challans',
  '/delivery-challans/new',

  // Purchases & Vendors
  '/vendors',
  '/bills',
  '/bills/new',
  '/purchase-orders',
  '/purchase-orders/new',
  '/grns',
  '/grns/new',
  '/expenses',

  // Accounting & Banking
  '/accounts',
  '/journal',
  '/branches',
  '/tds',
  '/accounting-reports',
  '/bank-accounts',
  '/cash-flow',

  // Reports
  '/reports',
  '/sales-reports',
  '/inventory-reports',
  '/purchase-accounting-reports',
  '/hr-reports',
  '/crm-marketing-reports',
  '/business-report',
  '/aging-details',
  '/profit-loss',
  '/gst-returns',

  // People & HR
  '/employees',
  '/attendance',
  '/shifts',
  '/leaves',
  '/payroll',
  '/employee-documents',

  // Business CRM
  '/crm-dashboard',
  '/crm/automations',
  '/calendar',
  '/crm/integrations',
  '/leads',
  '/pipeline',
  '/activities',

  // Business Promotion
  '/marketing/posters',
  '/marketing/templates',
  '/campaigns',
  '/journeys',
  '/message-logs',

  // Settings & Administration
  '/templates',
  '/templates/customize',
  '/audit-logs',
  '/custom-fields',
  '/settings',
  '/support',
  '/admin',
  '/tickets',
  '/platform-admin'
];

(async () => {
  console.log('Launching Chromium for full site audit...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const issues = [];
  const visited = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore routine benign warnings / assets
      if (
        text.startsWith('Warning:') ||
        text.includes('favicon') || 
        text.includes('WebSocket') || 
        text.includes('net::ERR_') ||
        (text.includes('404') && (text.includes('.png') || text.includes('.jpg') || text.includes('.svg')))
      ) return;

      console.log(`[CONSOLE ERROR] on ${page.url()}:`, text.slice(0, 200));
      issues.push({
        url: page.url(),
        type: 'CONSOLE_ERROR',
        message: text,
      });
    }
  });

  page.on('pageerror', err => {
    console.log(`❌ [PAGE EXCEPTION] on ${page.url()}:`, err.message);
    issues.push({
      url: page.url(),
      type: 'PAGE_ERROR',
      message: err.message,
      stack: err.stack,
    });
  });

  try {
    // 1. Log in
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.fill('awesh.etpl@gmail.com');
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        await passInput.fill('123456@Ak');
      }
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      }
      await page.waitForTimeout(4000);
    }

    // Set local storage to 'ae' org to guarantee all pages load with active 'ae' business
    await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('billflow-app-storage');
        const parsed = raw ? JSON.parse(raw) : { state: {} };
        parsed.state = parsed.state || {};
        parsed.state.organization = {
          id: '9f0a2f91-dc22-478c-9e6c-01bc50afd4ea',
          name: 'ae',
          subscription_plan: 'suite'
        };
        localStorage.setItem('billflow-app-storage', JSON.stringify(parsed));
      } catch(e) {}
    });

    console.log(`\n======================================================`);
    console.log(`Testing ${routesToTest.length} total pages.`);
    console.log(`Hold duration: 5 seconds per page + interactive testing`);
    console.log(`======================================================\n`);

    for (let i = 0; i < routesToTest.length; i++) {
      const route = routesToTest[i];
      const targetUrl = `${BASE_URL}${route}`;
      const startIndex = issues.length;

      console.log(`[${i + 1}/${routesToTest.length}] Testing: ${route}`);

      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      } catch (err) {
        console.error(`  Navigation timeout / error on ${route}:`, err.message);
        issues.push({
          url: targetUrl,
          type: 'NAVIGATION_ERROR',
          message: err.message
        });
      }

      // HOLD FOR 5 SECONDS as explicitly instructed by user
      await page.waitForTimeout(5000);

      // Check for ReferenceError or crash in page content
      try {
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        const isBlank = bodyText.trim().length === 0;
        const lower = bodyText.toLowerCase();
        const hasRefError = lower.includes('referenceerror') || lower.includes('is not defined');
        const hasCrash = lower.includes('something went wrong') || lower.includes('error loading') || hasRefError;

        if (isBlank) {
          issues.push({
            url: targetUrl,
            type: 'BLANK_PAGE',
            message: 'Page is completely empty / white screen'
          });
        }
        if (hasCrash) {
          issues.push({
            url: targetUrl,
            type: hasRefError ? 'REFERENCE_ERROR' : 'CRASH_SCREEN',
            message: bodyText.slice(0, 300)
          });
        }
      } catch(e) {}

      // Interactive test: click on tab or filter or button
      try {
        const button = await page.$('main button:not([disabled]):not(:has-text("Delete")):not(:has-text("Remove")):not(:has-text("Logout")), main [role="tab"]');
        if (button) {
          const role = await button.getAttribute('role');
          if (role === 'tab') {
            await button.click().catch(() => {});
          } else {
            await button.hover().catch(() => {});
          }
        }
      } catch(e) {}

      // Brief settlement
      await page.waitForTimeout(1000);

      const routeIssues = issues.slice(startIndex);
      if (routeIssues.length > 0) {
        console.log(`  ❌ ${routeIssues.length} issue(s) detected on ${route}:`);
        routeIssues.forEach(iss => console.log(`     - [${iss.type}] ${iss.message.slice(0, 120)}`));
        visited.push({ route, status: 'FAIL', issues: routeIssues });
      } else {
        console.log(`  ✅ ${route} passed (0 errors)`);
        visited.push({ route, status: 'PASS', issues: [] });
      }
    }

  } catch (err) {
    console.error('Test suite failed:', err);
  } finally {
    await browser.close();
  }

  const resultSummary = {
    totalRoutes: visited.length,
    passedCount: visited.filter(v => v.status === 'PASS').length,
    failedCount: visited.filter(v => v.status === 'FAIL').length,
    failures: visited.filter(v => v.status === 'FAIL'),
    allIssues: issues
  };

  fs.writeFileSync('audit_report.json', JSON.stringify(resultSummary, null, 2));
  console.log('\n======================================================');
  console.log(`AUDIT FINISHED`);
  console.log(`Passed: ${resultSummary.passedCount} / ${resultSummary.totalRoutes}`);
  console.log(`Failed: ${resultSummary.failedCount} / ${resultSummary.totalRoutes}`);
  console.log('Results saved to audit_report.json');
  console.log('======================================================\n');
})();
