// Mahjong: la începutul partidei, jurnalul arată regulile active. Rulare: node tests/rezumat-reguli.test.mjs
import {launch, check, summary} from "./_lib.mjs";
const {browser, page, st} = await launch({reducedMotion: "reduce"});
await page.waitForTimeout(1000);
for (const [id, re] of [["riichi", /^Reguli active — Riichi · .*aka dora.*: Da/], ["hk", /^Reguli active — Hong Kong · .*Faan minim.*: 3/], ["sichuan", /^Reguli active — Sichuan · .*sânge.*: Da/]]) {
  await page.click("#tab-play");
  await page.click("#pick-" + id);
  await page.click("#btn-start");
  await page.waitForSelector("#tbl-feed li", {timeout: 5000});
  const first = await page.$eval("#tbl-feed", ol => [...ol.children].map(l => l.textContent).find(x => x.startsWith("Reguli active")) || "");
  check(id + ": rezumatul regulilor în jurnal", re.test(first), first);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /Meniu|Menu/.test(x.textContent)); if (b) b.click(); });
  await page.waitForTimeout(300);
}
check("fără erori", st.errs.length === 0, st.errs);
await browser.close(); summary();
