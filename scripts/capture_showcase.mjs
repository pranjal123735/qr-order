import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.env.TEMP || 'C:\\TEMP', 'chrome_showcase_' + Date.now());
const PORT = 9223;

const OUT_DIR_PROJECT = 'C:\\Users\\Pranjal\\Desktop\\QR_Code\\public\\showcase';
const OUT_DIR_ARTIFACT = 'C:\\Users\\Pranjal\\.gemini\\antigravity\\brain\\e86ade8d-ff59-49e3-92fc-227d2cee3937\\showcase';

[OUT_DIR_PROJECT, OUT_DIR_ARTIFACT].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Starting headless Chrome on port ' + PORT + '...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  chromeProc.on('error', (err) => console.error('Chrome process error:', err));

  // Wait for debugging port
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://localhost:${PORT}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {}
  }

  if (!versionData) {
    console.error('Failed to connect to Chrome debugging port.');
    chromeProc.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome. Creating target page...');
  const newPageRes = await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const pageTarget = await newPageRes.json();
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('DOM.enable');
  await sendCommand('Runtime.enable');

  async function setDeviceMetrics(width, height, isMobile = false) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile
    });
    await sendCommand('Emulation.setVisibleSize', { width, height });
  }

  async function navigate(url) {
    await sendCommand('Page.navigate', { url });
    await sleep(2000);
  }

  async function evaluate(expression) {
    return await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
  }

  async function takeScreenshot(filename) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(OUT_DIR_PROJECT, filename), buffer);
    fs.writeFileSync(path.join(OUT_DIR_ARTIFACT, filename), buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  // Define Demo Owner credentials to inject into localStorage
  const authPayload = JSON.stringify({
    id: 'usr-rustic-owner',
    email: 'owner@rusticgrill.com',
    restaurant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    restaurant_slug: 'rustic-grill',
    restaurant_name: 'The Rustic Grill',
    created_at: new Date().toISOString()
  });

  try {
    // 1. Landing Page (Desktop)
    console.log('Capturing 01_landing_hero.png...');
    await setDeviceMetrics(1440, 900, false);
    await navigate('http://localhost:3000');
    await takeScreenshot('01_landing_hero.png');

    // 2. Landing Page (Mobile)
    console.log('Capturing 02_landing_mobile.png...');
    await setDeviceMetrics(390, 844, true);
    await navigate('http://localhost:3000');
    await takeScreenshot('02_landing_mobile.png');

    // 3. Manager Login Portal (Desktop)
    console.log('Capturing 03_admin_login.png...');
    await setDeviceMetrics(1440, 900, false);
    await navigate('http://localhost:3000/admin/login');
    await takeScreenshot('03_admin_login.png');

    // Now inject auth for manager views
    await evaluate(`
      localStorage.setItem('qr_auth_current_owner', '${authPayload}');
    `);

    // 4. Restaurant Owner Dashboard Hub (Desktop)
    console.log('Capturing 04_owner_dashboard.png...');
    await setDeviceMetrics(1440, 900, false);
    await navigate('http://localhost:3000/admin/rustic-grill/dashboard');
    await sleep(1500);
    await takeScreenshot('04_owner_dashboard.png');

    // 5. Kitchen Display System (KDS Live Orders)
    console.log('Capturing 05_kitchen_terminal.png...');
    await setDeviceMetrics(1440, 900, false);
    await navigate('http://localhost:3000/admin/rustic-grill/live-orders');
    await sleep(1500);
    await takeScreenshot('05_kitchen_terminal.png');

    // 6. Menu & Stock Manager
    console.log('Capturing 06_menu_stock_manager.png...');
    await setDeviceMetrics(1440, 900, false);
    await navigate('http://localhost:3000/admin/rustic-grill/menu');
    await sleep(1500);
    await takeScreenshot('06_menu_stock_manager.png');

    // 7. AI Menu Scanner Modal
    console.log('Capturing 07_ai_menu_scanner.png...');
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Scan Menu Card Now') || b.textContent.includes('AI Scan'));
      if (btn) btn.click();
    `);
    await sleep(1000);
    await takeScreenshot('07_ai_menu_scanner.png');

    // 8. Table QR Print Studio
    console.log('Capturing 08_table_qr_print.png...');
    await setDeviceMetrics(1440, 900, false);
    await navigate('http://localhost:3000/admin/rustic-grill/tables');
    await sleep(1500);
    await takeScreenshot('08_table_qr_print.png');

    // 9. Diner Mobile Menu View
    console.log('Capturing 09_diner_mobile_menu.png...');
    await setDeviceMetrics(390, 844, true);
    await navigate('http://localhost:3000/r/rustic-grill?table=4');
    await sleep(1500);
    await takeScreenshot('09_diner_mobile_menu.png');

    // 10. Diner Cart / Ordering Drawer
    console.log('Capturing 10_diner_cart_drawer.png...');
    await evaluate(`
      const addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Add'));
      if (addBtns.length > 0) addBtns[0].click();
      if (addBtns.length > 1) addBtns[1].click();
      const cartBtn = document.querySelector('button[aria-label="cart"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View Cart') || b.textContent.includes('Items'));
      if (cartBtn) cartBtn.click();
    `);
    await sleep(1000);
    await takeScreenshot('10_diner_cart_drawer.png');

    console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
