// Teste funcții noi (runda 8, 14 octombrie 2026) — Playwright, Chromium headless, rețea blocată.
// Rulare: node tests/fff-r8.test.mjs   (cere /opt/node-tools cu playwright și /opt/pw-browsers/chromium; axe-core opțional prin AXE_PATH)
import {createRequire} from 'module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'index.html');
const URL_APP = 'file://' + INDEX;
const AXE = process.env.AXE_PATH || '/tmp/claude-0/-home-claude/78529928-3825-51c3-b9bd-0e81655ab6bc/scratchpad/sweep/node_modules/axe-core/axe.min.js';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (cond, name, info) => { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (info === undefined ? '' : ' ' + JSON.stringify(info).slice(0, 500))); } };
const FLAGS = ['--no-sandbox', '--allow-loopback-in-peer-connection', '--disable-features=WebRtcHideLocalIpsWithMdns'];
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: FLAGS});
const net = [], errs = [];
async function mk(o = {}) {
  const ctx = await browser.newContext({viewport: {width: o.w || 1280, height: o.h || 800}, acceptDownloads: true, colorScheme: o.scheme || 'dark', reducedMotion: o.reduced ? 'reduce' : 'no-preference', locale: o.locale || 'ro-RO', bypassCSP: !!o.bypassCSP});
  await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
  if (o.init) await ctx.addInitScript(o.init);
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' || /Content Security Policy|Refused to/i.test(t)) errs.push('console: ' + t); });
  if (o.goto !== false) await page.goto(o.url || URL_APP);
  return {ctx, page};
}
async function axeRun(page, sel) {
  if (!(await page.evaluate(() => !!window.axe))) await page.evaluate(fs.readFileSync(AXE, 'utf8') + '\n;0');
  return page.evaluate(async s => { const r = await window.axe.run(s ? document.querySelector(s) : document, {resultTypes: ['violations']}); return r.violations.map(v => v.id + ':' + v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')); }, sel || null);
}
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
// sintetizator vocal fals: înregistrează textele „citite”
const TTS_MOCK = () => {
  window.__spoken = [];
  class U { constructor(t) { this.text = t; this.voice = null; this.lang = ''; this.rate = 1; } }
  const V = [{name: 'Test RO', lang: 'ro-RO', voiceURI: 'ro', localService: true, default: true}, {name: 'Test EN', lang: 'en-US', voiceURI: 'en', localService: true, default: false}];
  const synth = {getVoices: () => V, speaking: false, addEventListener() {}, removeEventListener() {}, pause() {}, resume() {},
    cancel() { synth.speaking = false; }, speak(u) { synth.speaking = true; setTimeout(() => { window.__spoken.push({text: u.text, lang: u.lang}); synth.speaking = false; if (u.onstart) u.onstart({}); if (u.onend) u.onend({}); }, 5); }};
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {value: U, configurable: true}); Object.defineProperty(window, 'speechSynthesis', {value: synth, configurable: true});
};
console.log('Mahjong fără frontiere — teste funcții noi (duel de solitaire pe rețea, citire fișe cu voce, kit)');
for (const [w, h] of [[1280, 800], [360, 740]]) {
  const {ctx, page} = await mk({w, h});
  await page.waitForTimeout(3600);
  ok(await page.evaluate(() => !!(window.FFF && FFF.p2p && FFF.tts && FFF.bundle && FFF.label)), `kit încărcat (${w}x${h})`);
  ok(await noHScroll(page), `fără depășire orizontală ${w}x${h}`);
  const ax = await axeRun(page); ok(ax.length === 0, `axe 0 violări (atlas) ${w}x${h}`, ax);
  await page.locator('#tab-play').click(); await page.waitForTimeout(200);
  ok(await page.locator('#btn-duel').count() === 1, `buton duel în meniul Joacă ${w}x${h}`);
  const ax2 = await axeRun(page); ok(ax2.length === 0, `axe 0 violări (meniu Joacă) ${w}x${h}`, ax2);
  await ctx.close();
}
ok(errs.length === 0, 'fără pageerror/CSP la pornire', errs); ok(net.length === 0, '0 cereri de rețea', net);
// ---------- citirea fișelor din atlas ----------
{
  const {ctx, page} = await mk({init: TTS_MOCK});
  await page.getByRole('button', {name: 'Fișa'}).first().click();
  await page.locator('#atlas-tts').click(); await page.waitForTimeout(400);
  const sp = await page.evaluate(() => window.__spoken);
  const title = await page.locator('#dlg-title').innerText();
  ok(sp.length > 2 && sp[0].text.includes(title.split(' ')[0]), 'titlul și regulile fișei sunt citite', sp.slice(0, 2));
  ok(sp.every(x => x.lang === 'ro-RO'), 'voce ro-RO');
  await page.locator('#dlg-close').click();
  await page.evaluate(() => { const s = document.getElementById('sel-lang'); s.value = 'en'; s.dispatchEvent(new Event('change')); });
  await page.getByRole('button', {name: 'Details'}).first().click();
  await page.evaluate(() => { window.__spoken.length = 0; });
  await page.locator('#atlas-tts').click(); await page.waitForTimeout(400);
  ok((await page.evaluate(() => window.__spoken)).length > 2 && (await page.evaluate(() => window.__spoken)).every(x => x.lang === 'en-US'), 'în EN: voce en-US');
  await ctx.close();
  const c2 = await mk({init: () => { Object.defineProperty(window, 'speechSynthesis', {value: undefined, configurable: true}); }});
  await c2.page.getByRole('button', {name: 'Fișa'}).first().click(); await c2.page.locator('#atlas-tts').click(); await c2.page.waitForTimeout(300);
  ok((await c2.page.locator('#dlg-body [role=status]').first().innerText()).length > 3, 'fără sintetizator: mesaj grațios');
  await c2.ctx.close();
}
const MJ_HOOK = () => { Object.defineProperty(window, 'SOL', {get: () => window.__mjt && __mjt.sol(), configurable: true}); window.solPick = i => __mjt.pick(i); };
// ---------- duel de solitaire ----------
const D = (p, r) => p.locator('[data-role=' + r + ']');
async function connect(A, B) {
  for (const p of [A, B]) { await p.locator('#tab-play').click(); await p.locator('#pick-solitaire').check(); }
  await A.locator('#o-seed').fill('duel-test'); await A.locator('#o-layout').selectOption('pyramid').catch(() => {});
  await A.locator('#btn-duel').click(); await D(A, 'optin').check(); await D(A, 'mode-host').click(); await D(A, 'gen-offer').click();
  await D(A, 'offer-out').waitFor(); const offer = await D(A, 'offer-out').inputValue();
  await B.locator('#btn-duel').click(); await D(B, 'optin').check(); await D(B, 'mode-join').click();
  await D(B, 'offer-in').fill(offer); await D(B, 'gen-answer').click(); await D(B, 'answer-out').waitFor();
  const answer = await D(B, 'answer-out').inputValue();
  await D(A, 'answer-in').fill(answer); await D(A, 'connect').click();
  await Promise.all([A, B].map(p => p.waitForFunction(() => window.SOL && SOL.duel && SOL.S, null, {timeout: 25000})));
}
const sol = p => p.evaluate(() => ({layout: SOL.layout, seed: SOL.seed, face: SOL.S.face.join(','), left: MJ.solRemaining(SOL.S), moves: SOL.S.moves, hintDisabled: document.getElementById('sol-hint').disabled, newDisabled: document.getElementById('sol-new').disabled, duel: document.getElementById('sol-duel').textContent, solved: MJ.solWon(SOL.S)}));
const playPairs = (p, from, to) => p.evaluate(([a, b]) => { const sol = SOL.S.solution; for (let i = a; i < Math.min(b, sol.length); i++) { solPick(sol[i][0]); solPick(sol[i][1]); } return MJ.solRemaining(SOL.S); }, [from, to]);
{
  const a = await mk({w: 1200, h: 900, init: MJ_HOOK}), b = await mk({w: 1200, h: 900, init: MJ_HOOK}); const A = a.page, B = b.page;
  await connect(A, B);
  const sa = await sol(A), sb = await sol(B);
  ok(sa.layout === sb.layout && sa.seed === sb.seed && sa.face === sb.face, 'aceeași tablă la ambii (aranjament, seed, plăci)', [sa.layout, sb.layout, sa.seed, sb.seed]);
  ok(sa.layout === 'pyramid', 'aranjamentul ales de gazdă este folosit', sa.layout);
  ok(sa.hintDisabled && sb.hintDisabled && sa.newDisabled, 'sugestia și „altă tablă” sunt oprite în duel');
  ok((await axeRun(A)).length === 0, 'axe 0 violări în duel (gazdă)', await axeRun(A));
  ok((await axeRun(B)).length === 0, 'axe 0 violări în duel (oaspete)', await axeRun(B));
  await playPairs(A, 0, 5); await B.waitForTimeout(500);
  const l0 = sa.left;
  ok(/rămase/.test((await sol(B)).duel) && (await sol(B)).duel.includes(String(l0 - 10)), 'oaspetele vede progresul gazdei (rămase ' + (l0 - 10) + ')', (await sol(B)).duel);
  await playPairs(B, 0, 3); await A.waitForTimeout(500);
  ok((await sol(A)).duel.includes(String(l0 - 6)), 'gazda vede progresul oaspetelui (rămase ' + (l0 - 6) + ')', (await sol(A)).duel);
  await A.evaluate(() => { const sol = SOL.S.solution; for (let i = 5; i < sol.length; i++) { solPick(sol[i][0]); solPick(sol[i][1]); } });
  await B.waitForTimeout(600);
  const fa = await sol(A), fb = await sol(B);
  ok(fa.solved && /Ai golit tabla/.test(fa.duel) && /Aștepți/.test(fa.duel), 'gazda: terminat, așteaptă adversarul', fa.duel);
  ok(/Adversarul a golit tabla/.test(fb.duel) && /mai rapid/.test(fb.duel), 'oaspetele: știe că adversarul a terminat primul', fb.duel);
  await B.evaluate(() => { const sol = SOL.S.solution; for (let i = 3; i < sol.length; i++) { solPick(sol[i][0]); solPick(sol[i][1]); } });
  await A.waitForTimeout(600);
  const ga = await sol(A), gb = await sol(B);
  ok(/Ai câștigat duelul/.test(ga.duel) && /mai rapid/.test(gb.duel), 'rezultat final consecvent la ambii', [ga.duel, gb.duel]);
  // pierderea conexiunii
  await b.page.close();
  await A.waitForFunction(() => /întrerupt/.test(document.getElementById('sol-duel').textContent), null, {timeout: 25000}).catch(() => {});
  ok(/întrerupt/.test((await sol(A)).duel), 'conexiune pierdută: mesaj, tabla rămâne jucabilă', (await sol(A)).duel);
  await a.ctx.close();
}
// ---------- regresii: solitaire singur, salvare, statistici, bundle ----------
{
  const {ctx, page} = await mk({init: MJ_HOOK});
  await page.locator('#tab-play').click(); await page.locator('#o-seed').fill('regres'); await page.locator('#btn-start').click();
  const st = await page.evaluate(() => ({duel: SOL.duel, hint: document.getElementById('sol-hint').disabled, again: document.getElementById('sol-again').disabled}));
  ok(st.duel === null && !st.hint && !st.again, 'solitaire singur: butoanele rămân active, fără duel');
  await page.evaluate(() => { const s = SOL.S.solution; solPick(s[0][0]); solPick(s[0][1]); });
  const saved = await page.evaluate(() => localStorage.getItem('mahjong.solsave'));
  ok(saved && JSON.parse(saved).seed === await page.evaluate(() => SOL.seed), 'partida singură se salvează automat');
  await page.locator('#sol-hint').click(); await page.waitForTimeout(200);
  ok(await page.locator('#sol-svg .st.hint').count() >= 2, 'sugestia merge în solitaire singur');
  const bundle = await page.evaluate(() => FFF.bundle.build());
  ok(bundle && bundle.app === 'mahjong' && bundle.data['mahjong.solsave'] && bundle.data['mahjong.solstats'], 'exportul .fff.json conține salvarea și statisticile', bundle && Object.keys(bundle.data));
  await ctx.close();
}
ok(errs.length === 0, 'fără pageerror/CSP în tot setul', errs.slice(0, 5)); ok(net.length === 0, '0 cereri de rețea în tot setul', net.slice(0, 3));
await browser.close(); console.log(`\n${pass} ok, ${fail} eșuate`); process.exit(fail ? 1 : 0);
