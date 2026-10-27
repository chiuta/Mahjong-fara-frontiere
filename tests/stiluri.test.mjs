// MAHJONG FĂRĂ FRONTIERE 2.1.0 — tabelul „Ce stil de mahjong?” (stiluri, jucabil / calculator) + denumirea pieselor la trecerea cursorului.
// Rulare: node tests/stiluri.test.mjs
import {readFileSync} from "node:fs";
import {launch, check, summary, INDEX} from "./_lib.mjs";

const {browser, page, st} = await launch({reducedMotion: "reduce"});
await page.waitForTimeout(1200);
console.log("1. tabelul de stiluri din Atlas");
const rows = await page.$$eval("#styles-tbl tbody tr", trs => trs.map(tr => ({id: tr.dataset.style, cells: [...tr.children].map(c => c.textContent.trim())})));
check("8 rânduri (toate intrările din atlas)", rows.length === 8, rows.map(r => r.id));
const by = Object.fromEntries(rows.map(r => [r.id, r.cells]));
check("jucabile contra AI: solitaire, riichi, Hong Kong, Sichuan", ["solitaire", "riichi", "hk", "sichuan"].every(i => by[i][3] === "Da") && ["mcr", "taiwan", "american", "sanma"].every(i => by[i][3] === "Nu"), by);
check("calculator de masă: riichi, Hong Kong, MCR, Sichuan", ["riichi", "hk", "mcr", "sichuan"].every(i => by[i][4] === "Da") && ["solitaire", "taiwan", "american", "sanma"].every(i => by[i][4] === "Nu"), by);
const note = await page.textContent("#panel-atlas details.styles > p");
check("nota precizează riichi (Japonia), Hong Kong (stil cantonez), Sichuan, MCR", /riichi \(Japonia\)/.test(note) && /stil cantonez/.test(note) && /Sichuan/.test(note) && /MCR/.test(note), note);
const calcModes = JSON.parse((readFileSync(INDEX, "utf8").match(/var CALC_MODES = (\[[^\]]*\]);/) || [, "[]"])[1].replace(/'/g, '"'));
check("tabelul e în acord cu CALC_MODES din cod", JSON.stringify(calcModes) === JSON.stringify(["riichi", "hk", "mcr", "sichuan"]), calcModes);
await page.selectOption("#sel-lang", "en");
await page.waitForTimeout(400);
const noteEn = await page.textContent("#panel-atlas details.styles > p").catch(() => "");
check("în engleză: nota e tradusă (Cantonese style)", /Cantonese style/.test(noteEn), noteEn);
console.log("2. denumirea pieselor (title) în mână");
await page.click("#tab-play");
await page.click("#pick-riichi");
await page.click("#btn-start");
await page.waitForSelector("button.ht", {timeout: 15000});
const tiles = await page.$$eval("button.ht", bs => bs.map(b => ({t: b.getAttribute("title"), a: b.getAttribute("aria-label")})));
check("fiecare piesă din mână are title = aria-label (nume lizibil)", tiles.length >= 13 && tiles.every(x => x.t && x.t === x.a.replace(/ \*$/, "")), tiles.slice(0, 3));
check("0 erori de pagină/CSP și 0 cereri de rețea", st.errs.length === 0 && st.net.length === 0, [st.errs, st.net]);
await browser.close();
summary();
