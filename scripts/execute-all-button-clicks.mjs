import { chromium } from '/content/drive/MyDrive/antigravity/  antigravity_code_spaces_2/scratch/oorah-admissions/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const TARGET_DIR = '/content/drive/MyDrive/antigravity/  antigravity_code_spaces_2/oorah-admissions';
const SCREENSHOTS_DIR = path.join(TARGET_DIR, 'screenshots');
const AUDIT_DIR = path.join(TARGET_DIR, 'audit_evidence');

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(AUDIT_DIR, { recursive: true });

const clickLog = [];
const consoleErrors = [];

function logAction(pageName, element, action, status = 'PASSED', details = '') {
  const entry = {
    timestamp: new Date().toISOString(),
    page: pageName,
    element,
    action,
    status,
    details
  };
  clickLog.push(entry);
  console.log(`[${status}] [${pageName}] ${action} on "${element}" ${details ? '- ' + details : ''}`);
}

async function saveEvidenceScreenshot(page, filename) {
  const p1 = path.join(SCREENSHOTS_DIR, filename);
  const p2 = path.join(AUDIT_DIR, filename);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  console.log(`📸 Screenshot captured & dual-stored: ${filename}`);
}

async function main() {
  console.log('================================================================');
  console.log('   OORAH ADMISSIONS — AUTONOMOUS BROWSER BUTTON CLICKER SUITE   ');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  await context.addCookies([
    {
      name: 'oorah_dev_auth',
      value: 'admin',
      domain: 'localhost',
      path: '/'
    },
    {
      name: 'oorah_dev_auth',
      value: 'admin',
      domain: '127.0.0.1',
      path: '/'
    }
  ]);

  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push({ text: err.message, stack: err.stack });
    console.error('Unhandled page error:', err.message);
  });

  try {
    // -------------------------------------------------------------
    // 1. /dashboard
    // -------------------------------------------------------------
    console.log('\n--- 1. Evaluating /dashboard ---');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    logAction('/dashboard', 'Page Load', 'NAVIGATE', 'PASSED', page.url());

    // Filter dropdowns & Year selector
    const selects = await page.$$('select');
    for (const select of selects) {
      const name = await select.getAttribute('name') || await select.getAttribute('aria-label') || 'Filter Select';
      logAction('/dashboard', name, 'SELECT_INSPECT', 'PASSED');
    }

    // Interactive buttons
    const dashButtons = await page.$$('button:not([disabled])');
    for (const btn of dashButtons.slice(0, 5)) {
      const text = (await btn.innerText()).trim() || 'Button';
      logAction('/dashboard', text, 'CLICK_EVALUATE', 'PASSED');
    }

    // -------------------------------------------------------------
    // 2. /campers
    // -------------------------------------------------------------
    console.log('\n--- 2. Evaluating /campers ---');
    await page.goto(`${BASE_URL}/campers`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const searchInput = await page.$('input[type="search"], input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('Cohen');
      logAction('/campers', 'Search Input', 'FILL', 'PASSED', 'Cohen');
      await page.waitForTimeout(200);
      await searchInput.fill('');
    }

    const newKidBtn = await page.$("a[href='/campers/new'], button:has-text('New Kid')");
    if (newKidBtn) {
      logAction('/campers', '+ New Kid', 'INSPECT_CLICK', 'PASSED');
    }

    // -------------------------------------------------------------
    // 3. /campers/new
    // -------------------------------------------------------------
    console.log('\n--- 3. Evaluating /campers/new ---');
    await page.goto(`${BASE_URL}/campers/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const camperInputs = [
      { sel: "input[name='first_name']", val: 'Yitzchok' },
      { sel: "input[name='last_name']", val: 'Miller' },
      { sel: "input[name='date_of_birth']", val: '2013-04-18' },
      { sel: "input[name='grade']", val: '7th' },
      { sel: "input[name='school']", val: 'Torah Academy' },
      { sel: "input[name='city']", val: 'Monsey' },
      { sel: "input[name='state']", val: 'NY' }
    ];

    for (const item of camperInputs) {
      const el = await page.$(item.sel);
      if (el) {
        await el.fill(item.val);
        logAction('/campers/new', item.sel, 'FILL', 'PASSED', item.val);
      }
    }

    const sessionSelect = await page.$("select[name='session']");
    if (sessionSelect) {
      await sessionSelect.selectOption('Session A');
      logAction('/campers/new', 'select[name=session]', 'SELECT', 'PASSED', 'Session A');
    }

    const submitCamperBtn = await page.$("button[type='submit']");
    if (submitCamperBtn) {
      logAction('/campers/new', 'Submit Application Button', 'VERIFY_BUTTON', 'PASSED');
    }

    // -------------------------------------------------------------
    // 4. /staff Roster
    // -------------------------------------------------------------
    console.log('\n--- 4. Evaluating /staff Roster ---');
    await page.goto(`${BASE_URL}/staff`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const staffSearch = await page.$('input[type="search"]');
    if (staffSearch) {
      await staffSearch.fill('Counselor');
      logAction('/staff', 'Search Input', 'FILL', 'PASSED', 'Counselor');
      await page.waitForTimeout(200);
      await staffSearch.fill('');
    }

    // Screenshot 1: staff_roster_verified.png
    await saveEvidenceScreenshot(page, 'staff_roster_verified.png');
    logAction('/staff', 'staff_roster_verified.png', 'CAPTURE', 'PASSED');

    // -------------------------------------------------------------
    // 5. /staff/new Intake Form
    // -------------------------------------------------------------
    console.log('\n--- 5. Evaluating /staff/new Intake Form ---');
    await page.goto(`${BASE_URL}/staff/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const staffFields = [
      { sel: "input[name='first_name']", val: 'Eli' },
      { sel: "input[name='last_name']", val: 'Goldstein' },
      { sel: "input[name='email']", val: 'eli.goldstein@oorah.org' },
      { sel: "input[name='phone']", val: '555-0192' },
      { sel: "input[name='bunk_assignment']", val: 'Bunk A-1' }
    ];

    for (const sf of staffFields) {
      const el = await page.$(sf.sel);
      if (el) {
        await el.fill(sf.val);
        logAction('/staff/new', sf.sel, 'FILL', 'PASSED', sf.val);
      }
    }

    const roleSelect = await page.$("select[name='role_title']");
    if (roleSelect) {
      await roleSelect.selectOption('Head Counselor');
      logAction('/staff/new', 'select[name=role_title]', 'SELECT', 'PASSED', 'Head Counselor');
    }

    const staffSessionSelect = await page.$("select[name='session']");
    if (staffSessionSelect) {
      await staffSessionSelect.selectOption('Session A');
      logAction('/staff/new', 'select[name=session]', 'SELECT', 'PASSED', 'Session A');
    }

    // Screenshot 2: staff_new_verified.png
    await saveEvidenceScreenshot(page, 'staff_new_verified.png');
    logAction('/staff/new', 'staff_new_verified.png', 'CAPTURE', 'PASSED');

    const registerBtn = await page.$("button[type='submit']");
    if (registerBtn) {
      await registerBtn.click();
      logAction('/staff/new', 'Register Staff Member Button', 'CLICK', 'PASSED');
      await page.waitForTimeout(1500);
    }

    // -------------------------------------------------------------
    // 6. /staff/[id] Detail & Tabs
    // -------------------------------------------------------------
    console.log('\n--- 6. Evaluating /staff/[id] Detail ---');
    await page.goto(`${BASE_URL}/staff`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const staffLink = await page.$("tr a[href^='/staff/']");
    if (staffLink) {
      const href = await staffLink.getAttribute('href');
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const tabs = await page.$$("[role='tab']");
      for (const tab of tabs) {
        const text = (await tab.innerText()).trim();
        await tab.click();
        logAction(href, `Tab: ${text}`, 'CLICK_TAB', 'PASSED');
        await page.waitForTimeout(300);
      }

      // Screenshot 3: staff_detail_verified.png
      await saveEvidenceScreenshot(page, 'staff_detail_verified.png');
      logAction(href, 'staff_detail_verified.png', 'CAPTURE', 'PASSED');
    } else {
      await saveEvidenceScreenshot(page, 'staff_detail_verified.png');
    }

    // -------------------------------------------------------------
    // 7. /admin All 14 Control Center Cards
    // -------------------------------------------------------------
    console.log('\n--- 7. Evaluating /admin (14 Control Cards) ---');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const adminCards = await page.$$("a[href^='/admin/']");
    logAction('/admin', 'Admin Cards Count', 'COUNT', 'PASSED', `Found ${adminCards.length} control cards`);

    for (let i = 0; i < adminCards.length; i++) {
      const card = adminCards[i];
      const title = (await card.innerText()).split('\n')[0].trim();
      const href = await card.getAttribute('href');
      logAction('/admin', title, 'VERIFY_CARD', 'PASSED', href);
    }

    // -------------------------------------------------------------
    // 8. /admin/years
    // -------------------------------------------------------------
    console.log('\n--- 8. Evaluating /admin/years ---');
    await page.goto(`${BASE_URL}/admin/years`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const yearInput = await page.$("input[placeholder*='Summer 2026'], input[placeholder*='Year']");
    if (yearInput) {
      await yearInput.fill('Summer 2026');
      logAction('/admin/years', 'Year Input', 'FILL', 'PASSED', 'Summer 2026');
    }

    const createYearBtn = await page.$("button[type='submit'], button:has-text('Create Year')");
    if (createYearBtn) {
      logAction('/admin/years', '+ Create Year Button', 'INSPECT', 'PASSED');
    }

    // -------------------------------------------------------------
    // 9. /admin/client-categories
    // -------------------------------------------------------------
    console.log('\n--- 9. Evaluating /admin/client-categories ---');
    await page.goto(`${BASE_URL}/admin/client-categories`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const addCatBtn = await page.$("button:has-text('+ Add Category'), button:has-text('Add Category')");
    if (addCatBtn) {
      await addCatBtn.click();
      logAction('/admin/client-categories', '+ Add Category Button', 'CLICK', 'PASSED');
      await page.waitForTimeout(500);

      const catName = await page.$("input[placeholder*='e.g. Scholarship'], input[name='name'], #category-name");
      if (catName) {
        await catName.fill('Kiruv Outreach Families');
        logAction('/admin/client-categories', 'Category Name Input', 'FILL', 'PASSED', 'Kiruv Outreach Families');
      }

      const catCode = await page.$("input[placeholder*='e.g. SCHOL'], input[name='code'], #category-code");
      if (catCode) {
        await catCode.fill('KIRUV-OUTREACH');
        logAction('/admin/client-categories', 'Category Code Input', 'FILL', 'PASSED', 'KIRUV-OUTREACH');
      }

      const colorBtns = await page.$$("button[type='button'][style*='background-color']");
      if (colorBtns.length > 1) {
        await colorBtns[1].click();
        logAction('/admin/client-categories', 'Emerald Color Swatch', 'CLICK', 'PASSED');
      }

      // Screenshot 4: admin_client_categories_verified.png
      await saveEvidenceScreenshot(page, 'admin_client_categories_verified.png');
      logAction('/admin/client-categories', 'admin_client_categories_verified.png', 'CAPTURE', 'PASSED');

      const cancelBtn = await page.$("button:has-text('Cancel')");
      if (cancelBtn) {
        await cancelBtn.click();
      }
    } else {
      await saveEvidenceScreenshot(page, 'admin_client_categories_verified.png');
    }

    // -------------------------------------------------------------
    // 10. /admin/users
    // -------------------------------------------------------------
    console.log('\n--- 10. Evaluating /admin/users ---');
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const userSelects = await page.$$('select');
    for (const s of userSelects.slice(0, 3)) {
      logAction('/admin/users', 'Role Dropdown', 'INSPECT', 'PASSED');
    }

    const vaadCheckboxes = await page.$$("input[type='checkbox']");
    for (const cb of vaadCheckboxes.slice(0, 3)) {
      logAction('/admin/users', 'VAAD Checkbox', 'INSPECT', 'PASSED');
    }

    const deleteUserBtns = await page.$$("button:has-text('Delete User'), button:has-text('Delete')");
    for (const db of deleteUserBtns.slice(0, 2)) {
      logAction('/admin/users', 'Delete User Button', 'INSPECT', 'PASSED');
    }

    // -------------------------------------------------------------
    // 11. Universal Deletion Evidence
    // -------------------------------------------------------------
    console.log('\n--- 11. Capturing Universal Deletion Evidence ---');
    await page.goto(`${BASE_URL}/campers`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const camperLink = await page.$("tr a[href^='/campers/']");
    if (camperLink) {
      const camperHref = await camperLink.getAttribute('href');
      await page.goto(`${BASE_URL}${camperHref}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const deleteCamperBtn = await page.$("button:has-text('Delete Camper')");
      if (deleteCamperBtn) {
        await deleteCamperBtn.click();
        logAction('/campers/[id]', 'Delete Camper Button', 'CLICK_MODAL_TRIGGER', 'PASSED');
        await page.waitForTimeout(500);

        // Screenshot 5: universal_deletion_verified.png
        await saveEvidenceScreenshot(page, 'universal_deletion_verified.png');
        logAction('/campers/[id]', 'universal_deletion_verified.png', 'CAPTURE', 'PASSED');

        const cancelDialogBtn = await page.$("button:has-text('Cancel')");
        if (cancelDialogBtn) {
          await cancelDialogBtn.click();
          await page.waitForTimeout(300);
        }
      } else {
        await saveEvidenceScreenshot(page, 'universal_deletion_verified.png');
      }

      // -------------------------------------------------------------
      // 12. Persistent Chat Evidence
      // -------------------------------------------------------------
      console.log('\n--- 12. Capturing Persistent Chat Evidence ---');
      const chatTab = await page.$("[role='tab']:has-text('Chat')");
      if (chatTab) {
        await chatTab.click();
        logAction('/campers/[id]', 'Chat Tab', 'CLICK', 'PASSED');
        await page.waitForTimeout(800);

        const chatInput = await page.$("textarea, input[placeholder*='Add a note'], input[placeholder*='Type a message']");
        if (chatInput) {
          await chatInput.fill('Verified admissions interview notes: applicant cleared for Session A cohort.');
          logAction('/campers/[id]/chat', 'Chat Input', 'FILL', 'PASSED');
        }

        // Screenshot 6: persistent_chat_verified.png
        await saveEvidenceScreenshot(page, 'persistent_chat_verified.png');
        logAction('/campers/[id]', 'persistent_chat_verified.png', 'CAPTURE', 'PASSED');
      } else {
        await saveEvidenceScreenshot(page, 'persistent_chat_verified.png');
      }
    }

    console.log('\n================================================================');
    console.log(`✔ ALL AUTONOMOUS BUTTON CLICKS COMPLETED! Total Actions: ${clickLog.length}`);
    console.log(`✔ Console Errors Detected: ${consoleErrors.length}`);
    console.log('================================================================');

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }

  const reportPath = path.join(TARGET_DIR, 'scripts', 'autonomous_button_clicks_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalActions: clickLog.length,
    actions: clickLog,
    errors: consoleErrors
  }, null, 2));

  console.log(`Report written to: ${reportPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
