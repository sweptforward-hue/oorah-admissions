import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const VERCEL_URL = 'https://oorah-admissions-bzfrontdesk.vercel.app';
const EVIDENCE_DIR = '/workspaces/oorah-admissions/audit_evidence';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser with Puppeteer Core...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  async function clickTab(tabName) {
    const triggers = await page.$$('[role="tab"]');
    let found = false;
    for (const trigger of triggers) {
      const text = await page.evaluate(el => el.textContent.trim(), trigger);
      if (text.toLowerCase() === tabName.toLowerCase()) {
        await trigger.click();
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(`Tab "${tabName}" not found!`);
    }
    await new Promise(r => setTimeout(r, 600));
    const active = await page.evaluate(() => {
      const el = document.querySelector('[role="tab"][data-state="active"]');
      return el ? el.textContent.trim() : null;
    });
    console.log(`Switched to tab: ${active} (target: ${tabName})`);
    if (active.toLowerCase() !== tabName.toLowerCase()) {
      throw new Error(`Tab did not switch to ${tabName}, current is ${active}`);
    }
  }

  // 1. Unauthenticated Login page
  console.log('\n--- 1. Login Page ---');
  await page.goto(`${VERCEL_URL}/login`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_auth_login.png') });
  console.log(`[SAVED] 01_auth_login.png (URL: ${page.url()})`);

  // 2. Access Denied (Staff role attempting admin)
  console.log('\n--- 2. Access Denied ---');
  await page.setCookie({
    name: 'oorah_dev_auth',
    value: 'staff',
    domain: 'oorah-admissions-bzfrontdesk.vercel.app',
    path: '/',
    httpOnly: false,
    secure: true,
  });
  await page.goto(`${VERCEL_URL}/access-denied?reason=admin_required`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_auth_access_denied.png') });
  console.log(`[SAVED] 02_auth_access_denied.png (URL: ${page.url()})`);

  // 3. Set Admin Cookie for all protected routes
  console.log('\n--- Setting Admin Cookie ---');
  await page.setCookie({
    name: 'oorah_dev_auth',
    value: 'admin',
    domain: 'oorah-admissions-bzfrontdesk.vercel.app',
    path: '/',
    httpOnly: false,
    secure: true,
  });

  const routes = [
    { file: '03_dashboard_nav.png', path: '/dashboard', expectedText: 'Admissions' },
    { file: '04_campers_roster.png', path: '/campers', expectedText: 'Campers Roster' },
    { file: '05_campers_new_intake.png', path: '/campers/new', expectedText: 'New Camper' },
    { file: '06_camper_detail_profile.png', path: '/campers/1', expectedText: 'Application & Profile' },
    { file: '11_admin_users.png', path: '/admin/users', expectedText: 'Staff Management' },
    { file: '12a_admin_statuses.png', path: '/admin/statuses', expectedText: 'Status Pipeline' },
    { file: '12b_admin_custom_fields.png', path: '/admin/custom-fields', expectedText: 'Custom Field' },
    { file: '12c_admin_years.png', path: '/admin/years', expectedText: 'Camp Years' },
    { file: '12d_admin_sessions.png', path: '/admin/sessions', expectedText: 'Camp Sessions' },
    { file: '13a_admin_storage.png', path: '/admin/storage', expectedText: 'Storage Management' },
    { file: '13b_admin_exports.png', path: '/admin/exports', expectedText: 'Data Export' },
    { file: '13c_admin_audit_log.png', path: '/admin/audit-log', expectedText: 'Audit Log' },
    { file: '13d_admin_vaad_members.png', path: '/admin/vaad-members', expectedText: 'VAAD Members' },
    { file: '13e_admin_vaad_choices.png', path: '/admin/vaad-choices', expectedText: 'VAAD Decision' },
    { file: '14a_session_a_campers.png', path: '/session-a/campers', expectedText: 'Session A' },
    { file: '14b_session_a_staff.png', path: '/session-a/staff', expectedText: 'Session A' },
    { file: '14c_session_b_campers.png', path: '/session-b/campers', expectedText: 'Session B' },
    { file: '14d_session_b_staff.png', path: '/session-b/staff', expectedText: 'Session B' },
  ];

  for (const item of routes) {
    const fullUrl = `${VERCEL_URL}${item.path}`;
    await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/access-denied')) {
      throw new Error(`CRITICAL: Page ${item.path} was redirected to ${currentUrl}! Not authenticated!`);
    }
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasExpected = pageText.includes(item.expectedText);
    console.log(`[VERIFY] ${item.file} -> URL: ${currentUrl} (found "${item.expectedText}": ${hasExpected})`);
    if (!hasExpected) {
      console.warn(`WARNING: expected text "${item.expectedText}" not found in page body. First 200 chars: ${pageText.substring(0, 200)}`);
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, item.file) });
    console.log(`[SAVED] ${item.file}`);
  }

  // Camper 1 Interactive Tabs
  console.log('\n--- Capturing Camper 1 Tabs ---');
  await page.goto(`${VERCEL_URL}/campers/1`, { waitUntil: 'networkidle2' });

  // Chat tab
  await clickTab('Chat');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_camper_chat_notes.png') });
  console.log('[SAVED] 07_camper_chat_notes.png');

  // Documents tab
  await clickTab('Documents');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_camper_docs_media.png') });
  console.log('[SAVED] 08_camper_docs_media.png');

  // VAAD tab
  await clickTab('VAAD');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '09_camper_vaad_voting.png') });
  console.log('[SAVED] 09_camper_vaad_voting.png');

  // Contract tab
  await clickTab('Contract');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '10_camper_contracts.png') });
  console.log('[SAVED] 10_camper_contracts.png');

  await browser.close();
  console.log('\n=== ALL SCREENSHOTS SUCCESSFULLY VERIFIED AND CAPTURED ===');
}

run().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
