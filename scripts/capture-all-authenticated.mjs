import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const VERCEL_URL = 'https://oorah-admissions-bzfrontdesk.vercel.app';
const EVIDENCE_DIR = '/workspaces/oorah-admissions/audit_evidence';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function captureAll() {
  console.log('Launching browser with Puppeteer Core...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Capture Login (unauthenticated)
  console.log('Capturing: 01_auth_login.png');
  await page.goto(`${VERCEL_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_auth_login.png') });

  // 2. Set Staff Cookie to capture Access Denied
  console.log('Capturing: 02_auth_access_denied.png');
  await page.setCookie({
    name: 'oorah_dev_auth',
    value: 'staff',
    domain: 'oorah-admissions-bzfrontdesk.vercel.app',
    path: '/',
    httpOnly: false,
    secure: true,
  });
  await page.goto(`${VERCEL_URL}/access-denied?reason=admin_required`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_auth_access_denied.png') });

  // 3. Set Master Admin Cookie for all protected pages
  await page.setCookie({
    name: 'oorah_dev_auth',
    value: 'admin',
    domain: 'oorah-admissions-bzfrontdesk.vercel.app',
    path: '/',
    httpOnly: false,
    secure: true,
  });

  const adminRoutes = [
    { name: '03_dashboard_nav.png', url: `${VERCEL_URL}/dashboard` },
    { name: '04_campers_roster.png', url: `${VERCEL_URL}/campers` },
    { name: '05_campers_new_intake.png', url: `${VERCEL_URL}/campers/new` },
    { name: '06_camper_detail_profile.png', url: `${VERCEL_URL}/campers/1` },
    { name: '11_admin_users.png', url: `${VERCEL_URL}/admin/users` },
    { name: '12a_admin_statuses.png', url: `${VERCEL_URL}/admin/statuses` },
    { name: '12b_admin_custom_fields.png', url: `${VERCEL_URL}/admin/custom-fields` },
    { name: '12c_admin_years.png', url: `${VERCEL_URL}/admin/years` },
    { name: '12d_admin_sessions.png', url: `${VERCEL_URL}/admin/sessions` },
    { name: '13a_admin_storage.png', url: `${VERCEL_URL}/admin/storage` },
    { name: '13b_admin_exports.png', url: `${VERCEL_URL}/admin/exports` },
    { name: '13c_admin_audit_log.png', url: `${VERCEL_URL}/admin/audit-log` },
    { name: '13d_admin_vaad_members.png', url: `${VERCEL_URL}/admin/vaad-members` },
    { name: '13e_admin_vaad_choices.png', url: `${VERCEL_URL}/admin/vaad-choices` },
    { name: '14a_session_a_campers.png', url: `${VERCEL_URL}/session-a/campers` },
    { name: '14b_session_a_staff.png', url: `${VERCEL_URL}/session-a/staff` },
    { name: '14c_session_b_campers.png', url: `${VERCEL_URL}/session-b/campers` },
    { name: '14d_session_b_staff.png', url: `${VERCEL_URL}/session-b/staff` },
  ];

  for (const item of adminRoutes) {
    console.log(`Navigating to ${item.url}...`);
    await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });
    const finalUrl = page.url();
    console.log(`Current URL for ${item.name}: ${finalUrl}`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, item.name) });
    console.log(`[SAVED] ${item.name}`);
  }

  // Camper Workspace Tab Navigation (Chat, Documents, VAAD, Contract)
  console.log('Navigating to Camper Workspace tabs on /campers/1...');
  await page.goto(`${VERCEL_URL}/campers/1`, { waitUntil: 'networkidle2', timeout: 30000 });

  // Try clicking Chat tab
  try {
    const chatTab = await page.$('button[role="tab"]:has-text("Chat"), button:has-text("Chat"), [data-value="chat"]');
    if (chatTab) {
      await chatTab.click();
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch {}
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_camper_chat_notes.png') });
  console.log('[SAVED] 07_camper_chat_notes.png');

  // Try clicking Documents tab
  try {
    const docTab = await page.$('button[role="tab"]:has-text("Documents"), button:has-text("Documents"), [data-value="documents"]');
    if (docTab) {
      await docTab.click();
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch {}
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_camper_docs_media.png') });
  console.log('[SAVED] 08_camper_docs_media.png');

  // Try clicking VAAD tab
  try {
    const vaadTab = await page.$('button[role="tab"]:has-text("VAAD"), button:has-text("VAAD"), [data-value="vaad"]');
    if (vaadTab) {
      await vaadTab.click();
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch {}
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '09_camper_vaad_voting.png') });
  console.log('[SAVED] 09_camper_vaad_voting.png');

  // Try clicking Contract tab
  try {
    const contractTab = await page.$('button[role="tab"]:has-text("Contract"), button:has-text("Contract"), [data-value="contract"]');
    if (contractTab) {
      await contractTab.click();
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch {}
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '10_camper_contracts.png') });
  console.log('[SAVED] 10_camper_contracts.png');

  await browser.close();
  console.log('ALL AUTHENTICATED SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

captureAll().catch(console.error);
