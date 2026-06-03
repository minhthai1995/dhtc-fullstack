/**
 * DHTC Meta App Review — Automated Demo Script
 *
 * Scenes:
 *   1. Landing page (dhtcdanang.com)
 *   2. Facebook Messenger → chatbot demo
 *   3. Data Deletion page (compliance)
 *
 * Usage:
 *   FB_PAGE_USERNAME=chodemnightmarket node demo.mjs
 */

import { chromium } from 'playwright';

// ── Config ────────────────────────────────────────────────────────────────────

const CFG = {
  pageUsername: process.env.FB_PAGE_USERNAME || '',   // e.g. "chodemnightmarket"
  messengerMsg: process.env.DEMO_MESSAGE || 'Xin chào! Chợ đêm Sơn Trà mở cửa lúc mấy giờ vậy?',
  width: 1440,
  height: 900,
  slowMo: 60,          // ms between each Playwright action
  typingDelay: 75,     // ms between each keypress (human-like)
  mouseSteps: 25,      // intermediate points for smooth cursor movement
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const wait = (ms) => new Promise(r => setTimeout(r, ms));

/** Smooth cursor movement with intermediate points */
async function moveTo(page, x, y) {
  const cur = await page.evaluate(() => ({ x: window.lastX || 0, y: window.lastY || 0 }));
  const steps = CFG.mouseSteps;
  for (let i = 1; i <= steps; i++) {
    const nx = cur.x + (x - cur.x) * (i / steps);
    const ny = cur.y + (y - cur.y) * (i / steps);
    await page.mouse.move(nx, ny);
    await wait(8);
  }
  await page.evaluate(({ x, y }) => { window.lastX = x; window.lastY = y; }, { x, y });
}

/** Hover then click with smooth movement */
async function clickAt(page, selector) {
  const el = await page.locator(selector).first();
  const box = await el.boundingBox();
  if (!box) throw new Error(`Element not visible: ${selector}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await moveTo(page, x, y);
  await wait(200);
  await page.mouse.click(x, y);
}

/** Smooth scroll by pixels */
async function scrollBy(page, dy, durationMs = 800) {
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await wait(durationMs / steps);
  }
}

/** Inject gold cursor ring that follows the real cursor in-browser */
async function injectCursorRing(page) {
  await page.addStyleTag({
    content: `
      #__dhtc_ring__ {
        position: fixed !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        width: 30px; height: 30px;
        border-radius: 50%;
        border: 2.5px solid rgba(201,169,97,0.92);
        box-shadow: 0 0 6px rgba(201,169,97,0.4);
        transform: translate(-50%,-50%);
        transition: left 55ms linear, top 55ms linear;
        mix-blend-mode: difference;
      }
    `,
  });
  await page.evaluate(() => {
    if (document.getElementById('__dhtc_ring__')) return;
    const ring = document.createElement('div');
    ring.id = '__dhtc_ring__';
    document.documentElement.appendChild(ring);
    document.addEventListener('mousemove', e => {
      ring.style.left = e.clientX + 'px';
      ring.style.top  = e.clientY + 'px';
    }, { passive: true });
  });
}

/** Print progress to terminal so the ffmpeg timeline is annotated */
function log(scene, msg) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] SCENE ${scene} — ${msg}`);
}

// ── Scene 1 — Landing page ────────────────────────────────────────────────────

async function sceneLanding(page) {
  log(1, 'Navigate to dhtcdanang.com');
  await page.goto('https://dhtcdanang.com', { waitUntil: 'networkidle' });
  await injectCursorRing(page);
  await wait(2000);

  log(1, 'Scroll hero section');
  await moveTo(page, CFG.width / 2, 300);
  await wait(600);
  await scrollBy(page, 400, 1200);
  await wait(1000);

  log(1, 'Scroll to features / about section');
  await scrollBy(page, 500, 1200);
  await wait(1500);

  log(1, 'Show Privacy Policy link');
  await scrollBy(page, 800, 1200);
  await wait(1000);

  log(1, 'Scroll back to top');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(1500);
}

// ── Scene 2 — Facebook Messenger chatbot ─────────────────────────────────────

async function sceneMessenger(page) {
  if (!CFG.pageUsername) {
    console.warn('\n⚠️  FB_PAGE_USERNAME not set — skipping Messenger scene.\n');
    console.warn('   Run with: FB_PAGE_USERNAME=yourpage node demo.mjs\n');
    return;
  }

  const messengerUrl = `https://www.messenger.com/t/${CFG.pageUsername}`;
  log(2, `Navigate to ${messengerUrl}`);
  await page.goto(messengerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await injectCursorRing(page);
  await wait(2000);

  // Detect if logged out
  const isLoggedOut = await page.locator('input[name="email"], input[type="email"]').count() > 0;

  if (isLoggedOut) {
    log(2, '⏸  NOT LOGGED IN — waiting for manual Facebook login (60s)...');
    console.log('\n' + '─'.repeat(60));
    console.log('  Facebook is not logged in.');
    console.log('  Please log in with your Test User account NOW.');
    console.log('  You have 60 seconds. Script will auto-continue.');
    console.log('─'.repeat(60) + '\n');

    // Wait up to 60s for the login to complete
    try {
      await page.waitForURL(/messenger\.com\/(?!login)/, { timeout: 60000 });
    } catch {
      console.warn('  Login timeout — messenger scene skipped.');
      return;
    }
    await wait(2000);
  }

  log(2, 'Navigate to Page conversation');
  // If we landed on the page's thread, good. Otherwise navigate directly.
  if (!page.url().includes(CFG.pageUsername)) {
    await page.goto(messengerUrl, { waitUntil: 'networkidle', timeout: 20000 });
  }
  await injectCursorRing(page);
  await wait(1500);

  log(2, 'Find message input and type');
  const inputSelector = '[contenteditable][role="textbox"], textarea[placeholder], input[type="text"][placeholder]';
  await page.waitForSelector(inputSelector, { timeout: 15000 });
  await clickAt(page, inputSelector);
  await wait(500);

  log(2, `Typing: "${CFG.messengerMsg}"`);
  for (const char of CFG.messengerMsg) {
    await page.keyboard.type(char, { delay: CFG.typingDelay });
  }
  await wait(1000);

  log(2, 'Send message');
  await page.keyboard.press('Enter');
  await wait(500);

  log(2, 'Waiting for chatbot reply (up to 15s)...');
  // Move cursor away so we can see the reply bubble
  await moveTo(page, CFG.width / 2, CFG.height / 2);
  await wait(15000);  // Bot typically replies in 3-8s

  log(2, 'Show reply — hovering over response');
  await moveTo(page, CFG.width / 2, CFG.height * 0.7);
  await wait(2000);
}

// ── Scene 3 — Data Deletion (compliance) ─────────────────────────────────────

async function sceneDataDeletion(page) {
  log(3, 'Navigate to dhtcdanang.com/data-deletion');
  await page.goto('https://dhtcdanang.com/data-deletion', { waitUntil: 'networkidle' });
  await injectCursorRing(page);
  await wait(2000);

  log(3, 'Scroll through deletion instructions');
  await moveTo(page, CFG.width / 2, 400);
  await scrollBy(page, 600, 1400);
  await wait(1200);
  await scrollBy(page, 600, 1400);
  await wait(1200);
  await scrollBy(page, 600, 1400);
  await wait(2000);

  log(3, 'Highlight Data Deletion Callback note (Method 3 section)');
  // Hover near section 3 which describes automatic Facebook data deletion
  await moveTo(page, CFG.width / 2, CFG.height / 2);
  await wait(2500);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎬  DHTC Demo Recording — Playwright automation started');
  console.log(`    FB_PAGE_USERNAME : ${CFG.pageUsername || '(not set — Messenger scene skipped)'}`);
  console.log(`    Viewport         : ${CFG.width}×${CFG.height}`);
  console.log('    Scenes           : Landing → Messenger → Data Deletion\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: CFG.slowMo,
    args: [
      `--window-size=${CFG.width},${CFG.height}`,
      '--window-position=0,0',
      '--disable-blink-features=AutomationControlled',  // avoid FB bot detection
      '--start-maximized',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: CFG.width, height: CFG.height },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    // Inject cursor ring on every navigation automatically
    ...(await (async () => ({}))()),
  });

  // Inject cursor ring on every page navigation
  await context.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('__dhtc_ring__')) return;
      const style = document.createElement('style');
      style.textContent = `
        #__dhtc_ring__ {
          position: fixed !important;
          pointer-events: none !important;
          z-index: 2147483647 !important;
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 2.5px solid rgba(201,169,97,0.92);
          box-shadow: 0 0 6px rgba(201,169,97,0.4);
          transform: translate(-50%,-50%);
          transition: left 55ms linear, top 55ms linear;
        }
      `;
      document.head.appendChild(style);
      const ring = document.createElement('div');
      ring.id = '__dhtc_ring__';
      document.documentElement.appendChild(ring);
      document.addEventListener('mousemove', e => {
        ring.style.left = e.clientX + 'px';
        ring.style.top  = e.clientY + 'px';
      }, { passive: true });
    });
  });

  const page = await context.newPage();

  try {
    // ── Countdown before recording ──
    for (let i = 3; i > 0; i--) {
      process.stdout.write(`\r  Starting in ${i}s...  `);
      await wait(1000);
    }
    console.log('\r  🔴 Recording started!         \n');

    await sceneLanding(page);
    await wait(1000);

    await sceneMessenger(page);
    await wait(1000);

    await sceneDataDeletion(page);
    await wait(2000);

    console.log('\n✅  All scenes complete — recording will stop in 3s...');
    await wait(3000);
  } finally {
    await browser.close();
    console.log('🎬  Browser closed. Waiting for ffmpeg to finalize...\n');
  }
}

main().catch(err => {
  console.error('Demo script error:', err.message);
  process.exit(1);
});
