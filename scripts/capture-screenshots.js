const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotsDir = path.join(__dirname, '..', 'docs', 'pinto', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('1. Capturing Homepage...');
  try {
    await page.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01_homepage.png'), fullPage: false });
  } catch (e) {
    console.warn('Homepage capture warning:', e.message);
  }

  console.log('2. Capturing Public Menu...');
  try {
    await page.goto('http://localhost:3005/menu', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '02_public_menu.png'), fullPage: false });
  } catch (e) {
    console.warn('Menu capture warning:', e.message);
  }

  console.log('3. Capturing Customer Table QR (No Active Session)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  try {
    await mobilePage.goto('http://localhost:3005/t/table-04', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({ path: path.join(screenshotsDir, '03_table_qr_no_session.png'), fullPage: false });
  } catch (e) {
    console.warn('Table QR capture warning:', e.message);
  }

  console.log('4. Capturing Admin Login...');
  try {
    await page.goto('http://localhost:3005/admin/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '04_admin_login.png'), fullPage: false });
  } catch (e) {
    console.warn('Admin login capture warning:', e.message);
  }

  await mobileContext.close();
  await context.close();
  await browser.close();
  console.log('Screenshots execution completed!');
}

capture().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
