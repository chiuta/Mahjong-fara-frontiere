// Test r9 (Mahjong fără frontiere): „Șterge statisticile” cere confirmare în dialogul inline al kitului (tradus), nu în window.confirm.
// Rulare: node tests/r9-confirm.test.mjs   (Playwright din /opt/node-tools; rețea blocată)
import {createRequire} from 'module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
let ok = 0, bad = 0;
const t = (n, c, x) => { if (c) { ok++; console.log('  ok  ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? ' :: ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
for (const L of ['ro-RO', 'en-US', 'de-DE', 'hu-HU']) {
  const ctx = await b.newContext({viewport: {width: 1000, height: 800}, locale: L});
  await ctx.route(/^https?:/, (r) => r.abort());
  const p = await ctx.newPage(); const errs = []; let native = 0;
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { native++; d.dismiss(); });
  await p.goto('file://' + path.join(HERE, '..', 'index.html')); await p.waitForTimeout(2000);
  await p.click('#tab-about'); const has = await p.evaluate(() => !!document.getElementById('stats-clear'));
  t(L + ': butonul „șterge statisticile” există', has === true, has);
  await p.evaluate(() => { 0; });
  await p.click('#stats-clear'); await p.waitForSelector('dialog.fff-dlg[open]', {timeout: 3000});
  const btns = await p.locator('dialog.fff-dlg[open] button').allTextContents();
  t(L + ': dialog inline cu 2 butoane', btns.length === 2, btns);
  await p.locator('dialog.fff-dlg[open] button').first().click(); await p.waitForTimeout(300);
  t(L + ': „Nu” nu șterge nimic (dialog închis)', (await p.locator('dialog.fff-dlg[open]').count()) === 0);
  await p.click('#stats-clear'); await p.waitForSelector('dialog.fff-dlg[open]');
  await p.locator('dialog.fff-dlg[open] button').last().click(); await p.waitForTimeout(400);
  t(L + ': „Da” închide dialogul fără erori', (await p.locator('dialog.fff-dlg[open]').count()) === 0 && errs.length === 0 && native === 0, {errs, native});
  await ctx.close();
}
await b.close(); console.log('\n' + ok + ' reușite, ' + bad + ' eșuate'); process.exit(bad ? 1 : 0);
