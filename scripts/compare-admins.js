const { chromium } = require('playwright');

const ORIG_URL = 'http://localhost:8000/index.php/admin/login/index.html';
const ORIG_USER = 'admin';
const ORIG_PASS = 'yuhao8912';

const REF_URL = 'http://localhost:6005/admin/login';
const REF_USER = 'superadmin';
const REF_PASS = 'admin123456';

async function login(page, url, userSel, passSel, submitSel, username, password, extra = {}) {
  await page.goto(url, { waitUntil: 'networkidle' });
  if (extra.waitForSelector) await page.waitForSelector(extra.waitForSelector);
  await page.fill(userSel, username);
  await page.fill(passSel, password);
  await page.click(submitSel);
  await page.waitForTimeout(1500);
}

async function extractMenu(page, selectors) {
  await page.waitForTimeout(1000);
  const items = await page.$$eval(selectors.item, (nodes, sel) => nodes.map(n => ({
    label: (n.querySelector(sel.label)?.innerText || n.innerText || '').trim(),
    hasChildren: !!n.querySelector(sel.childrenToggle)
  })), selectors);
  return items;
}

async function collectStructure(page, selectors) {
  await page.waitForTimeout(500);
  const paths = [];
  async function walk(level, parentLabels) {
    const items = await page.$$(selectors[level].item);
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const label = (await item.$eval(selectors[level].label, n => n.innerText.trim())).replace(/\s+/g,' ');
      const path = [...parentLabels, label];
      const toggle = await item.$(selectors[level].toggle || null);
      if (toggle) {
        await toggle.click();
        await page.waitForTimeout(300);
        await walk(level + 1, path);
        await toggle.click();
        await page.waitForTimeout(200);
      } else {
        paths.push(path);
      }
    }
  }
  await walk(0, []);
  return paths;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Reference (refactored)
  await login(page, REF_URL, 'input[name="username"]', 'input[name="password"]', 'button[type="submit"]', REF_USER, REF_PASS);
  const refPaths = await collectStructure(page, [
    { item: 'aside .menu-item', label: '.menu-title, .ant-menu-title-content, span', toggle: '.ant-menu-submenu-expand-icon, .submenu-toggle' },
    { item: '.ant-menu-submenu .ant-menu-item, .submenu .menu-item', label: 'span', toggle: '.ant-menu-submenu-expand-icon' },
    { item: '.ant-menu-item', label: 'span', toggle: null }
  ]);

  // Original
  const page2 = await context.newPage();
  await login(page2, ORIG_URL, '#loginForm input[name="username"]', '#loginForm input[name="password"]', '#loginForm button[type="submit"]', ORIG_USER, ORIG_PASS, { waitForSelector: '#loginForm' });
  const origPaths = await collectStructure(page2, [
    { item: '#sidebar-menu li', label: 'a span, a', toggle: 'a .fa-angle-down' },
    { item: 'ul.nav.child_menu > li', label: 'a', toggle: null }
  ]);

  console.log('REF PATHS');
  refPaths.forEach(p => console.log('- ' + p.join(' > ')));
  console.log('---');
  console.log('ORIG PATHS');
  origPaths.forEach(p => console.log('- ' + p.join(' > ')));

  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
