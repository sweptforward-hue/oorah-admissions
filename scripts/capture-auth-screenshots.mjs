import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const VERCEL_URL = 'https://oorah-admissions-bzfrontdesk.vercel.app';
const EVIDENCE_DIR = '/workspaces/oorah-admissions/audit_evidence';

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1280,800',
    'about:blank',
  ]);

  // Wait 1.5s for port to open
  await new Promise((r) => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await listRes.json();
    const wsUrl = pages[0].webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise((r) => (ws.onopen = r));

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(new Error(res.error.message));
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Network.enable');
    await sendCommand('Page.enable');

    // Set admin cookie for Vercel deployment
    await sendCommand('Network.setCookie', {
      name: 'oorah_dev_auth',
      value: 'admin',
      domain: '.vercel.app',
      path: '/',
      httpOnly: false,
      secure: true,
    });

    const routes = [
      { url: `${VERCEL_URL}/dashboard`, file: '03_dashboard_nav.png' },
      { url: `${VERCEL_URL}/campers`, file: '04_campers_roster.png' },
      { url: `${VERCEL_URL}/campers/new`, file: '05_campers_new_intake.png' },
      { url: `${VERCEL_URL}/admin/users`, file: '11_admin_users_simulated_oauth.png' },
      { url: `${VERCEL_URL}/admin/statuses`, file: '12a_admin_statuses.png' },
      { url: `${VERCEL_URL}/admin/custom-fields`, file: '12b_admin_custom_fields.png' },
      { url: `${VERCEL_URL}/admin/storage`, file: '13a_admin_storage.png' },
      { url: `${VERCEL_URL}/admin/audit-log`, file: '13c_admin_audit_log.png' },
    ];

    for (const item of routes) {
      console.log(`Capturing authenticated: ${item.file} from ${item.url}`);
      await sendCommand('Page.navigate', { url: item.url });
      await new Promise((r) => setTimeout(r, 2000)); // wait for render
      const { data } = await sendCommand('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(EVIDENCE_DIR, item.file), Buffer.from(data, 'base64'));
      console.log(`[PASS] Saved ${item.file}`);
    }

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch(console.error);
