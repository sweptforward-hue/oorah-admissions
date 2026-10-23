import { chromium } from '/content/drive/MyDrive/antigravity/  antigravity_code_spaces_2/scratch/oorah-admissions/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE_DIR = '/content/drive/MyDrive/antigravity/  antigravity_code_spaces_2/oorah-admissions';
const VIDEO_DIR = path.join(BASE_DIR, 'audit_evidence', 'videos');
const SCREENSHOTS_VIDEO_DIR = path.join(BASE_DIR, 'screenshots', 'videos');
const VERCEL_URL = 'https://oorah-admissions-bzfrontdesk.vercel.app';

fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOTS_VIDEO_DIR, { recursive: true });

async function recordAutonomousRun() {
  console.log('========================================================================');
  console.log('  RECORDING FULL AUTONOMOUS BROWSER WORKFLOW VIDEO');
  console.log('========================================================================');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  page.on('dialog', async dialog => {
    console.log(`  [DIALOG] Auto-dismissed: ${dialog.message()}`);
    await dialog.dismiss().catch(() => {});
  });

  const domain = 'oorah-admissions-bzfrontdesk.vercel.app';

  async function setAdminAuth() {
    await context.addCookies([{
      name: 'oorah_dev_auth',
      value: 'admin',
      domain,
      path: '/',
      httpOnly: false,
      secure: true,
    }]);
  }

  async function clearAuth() {
    await context.clearCookies();
  }

  try {
    // 1. Login flow
    console.log('Recording: Login Page');
    await clearAuth();
    await page.goto(`${VERCEL_URL}/login`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);

    // 2. Dashboard
    console.log('Recording: Admin Dashboard');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/dashboard`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1500);

    // 3. Camper Roster
    console.log('Recording: Camper Roster');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/campers`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1500);

    // 4. Camper Intake
    console.log('Recording: Camper Intake Form');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/campers/new`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1500);

    // 5. Camper Dossier & Tabs
    console.log('Recording: Camper Dossier & Tab Cycling');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/campers/1`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const tabs = ['chat', 'documents', 'photos', 'voice', 'transcripts', 'vaad'];
    for (const t of tabs) {
      const tabEl = await page.$(`button[role="tab"][value="${t}"]`);
      if (tabEl) {
        await tabEl.click();
        await page.waitForTimeout(800);
      }
    }

    // 6. Staff Roster
    console.log('Recording: Staff Roster');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/staff`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 7. Staff Intake
    console.log('Recording: Staff Intake');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/staff/new`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 8. Admin Categories
    console.log('Recording: Admin Categories');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/admin/client-categories`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 9. Admin Users
    console.log('Recording: Admin Users');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/admin/users`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 10. Admin Years
    console.log('Recording: Admin Years');
    await setAdminAuth();
    await page.goto(`${VERCEL_URL}/admin/years`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

  } catch (err) {
    console.error('Recording error:', err);
  } finally {
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      console.log(`Video recorded successfully to: ${videoPath}`);
      const dest1 = path.join(VIDEO_DIR, 'autonomous_verification_run.webm');
      const dest2 = path.join(SCREENSHOTS_VIDEO_DIR, 'autonomous_verification_run.webm');
      fs.copyFileSync(videoPath, dest1);
      fs.copyFileSync(videoPath, dest2);
      console.log(`Dual-stored video in: ${dest1} and ${dest2}`);
    }
  }
}

recordAutonomousRun().catch(console.error);
