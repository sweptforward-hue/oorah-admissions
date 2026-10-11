import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
const EVIDENCE_DIR = path.join(process.cwd(), 'audit_evidence');

[SCREENSHOTS_DIR, EVIDENCE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function main() {
  console.log('Launching Puppeteer Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Unauthenticated Login Page
  console.log('Capturing Login Page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login_page.png') });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_auth_login.png') });

  // Set dev auth cookie for admin access
  await page.setCookie({
    name: 'oorah_dev_auth',
    value: 'admin',
    domain: 'localhost',
    path: '/',
  });

  const routes = [
    { route: '/dashboard', screenshotName: 'dashboard.png', evidenceName: '03_dashboard_nav.png' },
    { route: '/campers', screenshotName: 'campers.png', evidenceName: '04_campers_roster.png' },
    { route: '/campers/new', screenshotName: 'campers_new.png', evidenceName: '05_campers_new_intake.png' },
    { route: '/admin/users', screenshotName: 'admin_users.png', evidenceName: '11_admin_users.png' },
    { route: '/admin/storage', screenshotName: 'admin_storage.png', evidenceName: '13a_admin_storage.png' },
    { route: '/admin/statuses', screenshotName: 'admin_statuses.png', evidenceName: '12a_admin_statuses.png' },
    { route: '/admin/vaad-members', screenshotName: 'admin_vaad_members.png', evidenceName: '13d_admin_vaad_members.png' },
    { route: '/admin/vaad-choices', screenshotName: 'admin_vaad_choices.png', evidenceName: '13e_admin_vaad_choices.png' },
    { route: '/admin/audit-log', screenshotName: 'admin_audit_log.png', evidenceName: '13c_admin_audit_log.png' },
    { route: '/admin/custom-fields', screenshotName: 'admin_custom_fields.png', evidenceName: '12b_admin_custom_fields.png' },
  ];

  for (const item of routes) {
    console.log(`Capturing ${item.route}...`);
    await page.goto(`${BASE_URL}${item.route}`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, item.screenshotName) });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, item.evidenceName) });
    console.log(`[PASS] Saved ${item.screenshotName}`);
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
