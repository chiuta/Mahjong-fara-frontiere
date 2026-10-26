// Mahjong fără frontiere — simulare de motor: mese cu 4 AI pe cele 3 reguli (riichi, Hong Kong, Sichuan) până la final, fără excepții, fără blocaje,
// scoruri conservate; solitaire: fiecare tablă generată are soluția verificată prin replay. (Sichuan arunca ReferenceError: LT în evalSichuan.)
// Rulare: node tests/engine-sim.test.mjs   (Playwright din /opt/node-tools; rețea blocată)
import {createRequire} from 'module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.NODE_PW || '/opt/node-tools/package.json');
const {chromium} = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (c, m, i) => { if (c) { pass++; console.log('  ok   ' + m); } else { fail++; console.log('  FAIL ' + m + (i === undefined ? '' : ' ' + JSON.stringify(i).slice(0, 400))); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || process.env.CHROME || undefined, args: ['--no-sandbox']});
const ctx = await b.newContext({serviceWorkers: 'block'}); await ctx.route(/^https?:/, r => r.abort());
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('file://' + path.resolve(here, '..', 'index.html')); await p.waitForTimeout(1200);
const r = await p.evaluate(() => {
  const res = {};
  for (const rule of ['riichi', 'hk', 'sichuan']) {
    let games = 0, hands = 0, thrown = [], stuck = 0, sumBad = [];
    for (let seed = 1; seed <= 12; seed++) {
      const T = MJ.newTable({rule, seed, humans: [false, false, false, false]}), rng = MJ.makeSeeded(seed * 77); let steps = 0;
      while (!T.over && steps < 20000) {
        steps++;
        if (T.h.result) {
          const tot = T.scores.reduce((a, c) => a + c, 0) + (rule === 'riichi' ? T.sticks * 1000 : 0);
          if (tot !== (rule === 'riichi' ? 100000 : 0)) sumBad.push({seed, tot});
          hands++; MJ.nextHand(T); continue;
        }
        const seats = MJ.needSeats(T);
        if (!seats.length) { stuck++; break; }
        for (const q of seats) { try { MJ.act(T, q, MJ.aiDecide(MJ.viewFor(T, q), {rng, kanProb: 0.25})); } catch (e) { thrown.push(String(e).slice(0, 100)); steps = 1e9; } if (T.h.result) break; }
      }
      if (steps >= 20000) stuck++;
      games++;
    }
    res[rule] = {games, hands, thrown: thrown.slice(0, 3), stuck, sumBad: sumBad.slice(0, 3)};
  }
  const bad = [];
  for (const d of MJ.LAYOUT_DEFS) for (let s = 1; s <= 15; s++) { const S = MJ.solNew(d.id, s * 7919); if (!MJ.solReplay(S, S.solution)) bad.push(d.id + ':' + s); }
  res.solitaire = bad;
  return res;
});
for (const rule of ['riichi', 'hk', 'sichuan']) { const x = r[rule]; ok(x.games === 12 && x.hands > 0 && !x.thrown.length && !x.stuck && !x.sumBad.length, rule + ': 12 jocuri complete, fără excepții/blocaje, scoruri conservate', x); }
ok(r.solitaire.length === 0, 'solitaire: toate tablele au soluție verificată', r.solitaire);
ok(errs.length === 0, 'fără erori JS', errs);
await b.close(); console.log('\n' + pass + ' reușite, ' + fail + ' eșuate'); process.exit(fail ? 1 : 0);
