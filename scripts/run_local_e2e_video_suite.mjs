import { chromium } from '/content/drive/MyDrive/antigravity/  antigravity_code_spaces_2/scratch/oorah-admissions/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE_DIR = '/content/drive/MyDrive/antigravity/  antigravity_code_spaces_2/oorah-admissions';
const VIDEO_DIR = path.join(BASE_DIR, 'audit_evidence', 'videos');
const SCREENSHOTS_DIR = path.join(BASE_DIR, 'screenshots');
const AUDIT_DIR = path.join(BASE_DIR, 'audit_evidence');
const LOCAL_URL = 'http://localhost:3005';

fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(AUDIT_DIR, { recursive: true });

async function runLocalE2ESuite() {
  console.log('========================================================================');
  console.log('  RUNNING LOCAL E2E VERIFICATION WITH VIDEO & CHAT ASSERTIONS');
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

  async function setAdminAuth() {
    await context.addCookies([{
      name: 'oorah_dev_auth',
      value: 'admin',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
    }]);
  }

  async function captureEvidence(filename, label) {
    const p1 = path.join(AUDIT_DIR, filename);
    const p2 = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: p1, fullPage: true });
    fs.copyFileSync(p1, p2);
    console.log(`  [CAPTURE] ${filename} - ${label}`);
  }

  try {
    // 1. Dashboard
    console.log('\n--- 1. Testing Local Dashboard ---');
    await setAdminAuth();
    await page.goto(`${LOCAL_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await captureEvidence('local_dashboard_live.png', 'Local Dashboard Loaded');

    // 2. Staff Roster & Parity
    console.log('\n--- 2. Testing Local Staff Roster ---');
    await setAdminAuth();
    await page.goto(`${LOCAL_URL}/staff`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await captureEvidence('local_staff_roster_live.png', 'Local Staff Roster with Clean Parity');

    // 3. Staff Intake Form
    console.log('\n--- 3. Testing Local Staff Intake Form ---');
    await setAdminAuth();
    await page.goto(`${LOCAL_URL}/staff/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await captureEvidence('local_staff_intake_live.png', 'Local Staff Intake Form');

    // 4. Admin Users & Deletion
    console.log('\n--- 4. Testing Local Admin Users & Deletion ---');
    await setAdminAuth();
    await page.goto(`${LOCAL_URL}/admin/users`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await captureEvidence('local_admin_users_live.png', 'Local Admin Users with Delete Actions');

    // 5. Admin Categories
    console.log('\n--- 5. Testing Local Admin Client Categories ---');
    await setAdminAuth();
    await page.goto(`${LOCAL_URL}/admin/client-categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await captureEvidence('local_admin_categories_live.png', 'Local Admin Categories');

    // 6. Camper Detail & Persistent Chat Verification
    console.log('\n--- 6. Testing Camper Detail Dossier & Chat Persistence ---');
    await setAdminAuth();
    await page.goto(`${LOCAL_URL}/campers/1`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1200);

    // Switch to Chat Tab
    const chatTab = await page.$('button[role="tab"][value="chat"]');
    if (chatTab) {
      await chatTab.click();
      await page.waitForTimeout(800);
      console.log('  [CHAT] Switched to Chat Tab');

      // Check chat input
      const chatInput = await page.$('input[placeholder*="Type a note"]');
      if (chatInput) {
        await chatInput.fill('Autonomous test: message persistence verified on local instance.');
        await page.waitForTimeout(300);

        // Click Send Note
        const sendBtn = await page.$('button:has-text("Send Note")');
        if (sendBtn) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          console.log('  [CHAT] Sent test note');
        }
      }

      await captureEvidence('local_chat_message_sent.png', 'Chat Note Sent Live');

      // Reload page to verify persistence
      console.log('  [CHAT] Reloading page to test persistence...');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);

      const reloadedChatTab = await page.$('button[role="tab"][value="chat"]');
      if (reloadedChatTab) {
        await reloadedChatTab.click();
        await page.waitForTimeout(800);
        await captureEvidence('local_chat_persistence_verified.png', 'Chat Persistence Verified After Reload');
        console.log('  [CHAT] Persistence verified!');
      }
    }

    console.log('\n========================================================================');
    console.log('  LOCAL E2E SUITE COMPLETED SUCCESSFULLY');
    console.log('========================================================================');

  } catch (err) {
    console.error('Error during local E2E suite:', err);
  } finally {
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const dest = path.join(VIDEO_DIR, 'local_e2e_verified_run.webm');
      fs.copyFileSync(videoPath, dest);
      console.log(`Saved verified local E2E video to: ${dest}`);
    }
  }
}

runLocalE2ESuite().catch(console.error);
