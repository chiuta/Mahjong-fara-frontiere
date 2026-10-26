// MAHJONG — teste pentru calculatorul de masă și ghidul pe regiuni (v2). Rulare: node tests/fff-v2.test.mjs
import {launch, check, summary, hOverflow, axeRun} from "./_lib.mjs";

const tab = async (page) => { await page.click("#tab-calc"); await page.waitForSelector("#calc-tbl"); };
const deltas = (page) => page.$$eval("#calc-tbl .calc-d", els => els.map(e => e.textContent.replace("−", "-")));
const pick = async (page, id, v) => { await page.selectOption("#" + id, String(v)); };
const num = async (page, id, v) => { await page.fill("#" + id, String(v)); await page.dispatchEvent("#" + id, "change"); };

console.log("1. calculator: formule pe cele 4 reguli");
{
  const {browser, page, st} = await launch();
  await page.waitForTimeout(600);
  check("0 erori la pornire", st.errs.length === 0, st.errs);
  check("0 cereri de rețea", st.net.length === 0, st.net);
  check("fila Calculator există", (await page.locator("#tab-calc").count()) === 1);
  await tab(page);
  // riichi: dealer (0) câștigă tsumo 3 han 30 fu → 2000 all = +6000
  await pick(page, "calc-how", "tsumo"); await pick(page, "calc-han", 3); await pick(page, "calc-fu", 30);
  check("riichi: dealer tsumo 3 han 30 fu = 2000 all (+6000)", JSON.stringify(await deltas(page)) === JSON.stringify(["+6000", "-2000", "-2000", "-2000"]), await deltas(page));
  // non-dealer ron 1 han 30 fu = 1000
  await pick(page, "calc-how", "ron"); await pick(page, "calc-winner", 2); await pick(page, "calc-loser", 3); await pick(page, "calc-han", 1);
  check("riichi: ron non-dealer 1 han 30 fu = 1000", JSON.stringify(await deltas(page)) === JSON.stringify(["+0", "+0", "+1000", "-1000"]).replace("+0", "0").replace("+0", "0"), await deltas(page));
  // honba 2 → +600
  await num(page, "calc-honba", 2);
  check("riichi: honba 2 la ron adaugă 600", (await deltas(page))[2] === "+1600", await deltas(page));
  // mangan 5 han, bețe riichi
  await num(page, "calc-honba", 0); await pick(page, "calc-han", 5); await num(page, "calc-sticks", 2);
  check("riichi: mangan non-dealer ron = 8000 + 2000 de bețe", (await deltas(page))[2] === "+10000" && (await deltas(page))[3] === "-8000", await deltas(page));
  check("riichi: limita afișată", /mangan/i.test(await page.textContent("#calc-info")), await page.textContent("#calc-info"));
  // yakuman dealer tsumo 16000 all
  await num(page, "calc-sticks", 0); await pick(page, "calc-winner", 0); await pick(page, "calc-how", "tsumo"); await pick(page, "calc-yaku", 1);
  check("riichi: yakuman dealer tsumo = 16000 all (+48000)", (await deltas(page))[0] === "+48000", await deltas(page));
  // avertizare fu
  await pick(page, "calc-yaku", 0); await pick(page, "calc-how", "ron"); await pick(page, "calc-winner", 1); await pick(page, "calc-loser", 2); await pick(page, "calc-han", 2); await pick(page, "calc-fu", 20);
  check("riichi: avertizare 20 fu la ron", (await page.locator(".calc-res .note").count()) >= 1);

  // Hong Kong
  await pick(page, "calc-rule", "hk"); await page.waitForSelector("#calc-faan");
  await pick(page, "calc-how", "tsumo"); await pick(page, "calc-winner", 0); await pick(page, "calc-faan", 3);
  check("HK: 3 faan tsumo → 8 puncte; fiecare plătește 4", JSON.stringify(await deltas(page)) === JSON.stringify(["+12", "-4", "-4", "-4"]), await deltas(page));
  await pick(page, "calc-how", "ron"); await pick(page, "calc-loser", 1);
  check("HK: 3 faan ron (aruncătorul plătește tot) = 8", JSON.stringify(await deltas(page)) === JSON.stringify(["+8", "-8", "0", "0"]), await deltas(page));
  await pick(page, "calc-pm", "shared");
  check("HK: plată împărțită 4 / 2 / 2", JSON.stringify(await deltas(page)) === JSON.stringify(["+8", "-4", "-2", "-2"]), await deltas(page));

  // MCR
  await pick(page, "calc-rule", "mcr"); await page.waitForSelector("#calc-points");
  await num(page, "calc-points", 12); await pick(page, "calc-how", "ron"); await pick(page, "calc-winner", 0); await pick(page, "calc-loser", 1);
  check("MCR: 12 puncte ron → aruncător 20, ceilalți 8 (+36)", JSON.stringify(await deltas(page)) === JSON.stringify(["+36", "-20", "-8", "-8"]), await deltas(page));
  await pick(page, "calc-how", "tsumo");
  check("MCR: 12 puncte tsumo → 20 de la fiecare (+60)", (await deltas(page))[0] === "+60", await deltas(page));
  await num(page, "calc-points", 5);
  check("MCR: sub 8 puncte → avertizare", (await page.locator(".calc-res .note").count()) === 1);

  // Sichuan
  await pick(page, "calc-rule", "sichuan"); await page.waitForSelector("#calc-fan");
  await num(page, "calc-fan", 2); await pick(page, "calc-how", "ron"); await pick(page, "calc-loser", 1);
  check("Sichuan: 2 fan ron = 4", JSON.stringify(await deltas(page)) === JSON.stringify(["+4", "-4", "0", "0"]), await deltas(page));
  await pick(page, "calc-how", "tsumo");
  check("Sichuan: 2 fan tsumo = 5 de la fiecare (+15)", (await deltas(page))[0] === "+15", await deltas(page));
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("2. totaluri, istoric, anulare, reset, persistență");
{
  const {browser, page, st} = await launch();
  await page.waitForTimeout(600);
  await tab(page);
  await pick(page, "calc-rule", "mcr");
  await num(page, "calc-points", 10); await pick(page, "calc-how", "ron"); await pick(page, "calc-loser", 1);
  await page.click("#calc-add");
  let tot = await page.$$eval("#calc-totals .calc-tot", e => e.map(x => x.textContent));
  check("după o mână: totaluri +34 / -18 / -8 / -8 (suma 0)", JSON.stringify(tot) === JSON.stringify(["34", "-18", "-8", "-8"]), tot);
  check("istoric cu 1 intrare", (await page.locator("#calc-hist li").count()) === 1);
  await page.click("#calc-add");
  tot = await page.$$eval("#calc-totals .calc-tot", e => e.map(x => x.textContent));
  check("după două mâini: 68", tot[0] === "68", tot);
  // nume
  await page.click(".calc-names summary"); await page.fill("#calc-name0", "Ana"); await page.dispatchEvent("#calc-name0", "change");
  check("numele jucătorului apare în tabel", /Ana/.test(await page.textContent("#calc-tbl")));
  // persistență
  await page.reload(); await page.waitForTimeout(600); await tab(page); await pick(page, "calc-rule", "mcr");
  tot = await page.$$eval("#calc-totals .calc-tot", e => e.map(x => x.textContent));
  check("totalurile și numele supraviețuiesc reîncărcării", tot[0] === "68" && /Ana/.test(await page.textContent("#calc-totals")), tot);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  check("stocare cu prefixul mahjong.", keys.includes("mahjong.calc"), keys);
  // anulare
  await page.click("#calc-undo");
  tot = await page.$$eval("#calc-totals .calc-tot", e => e.map(x => x.textContent));
  check("anulare: revine la 34", tot[0] === "34", tot);
  // riichi pornește de la 25000 și avansează dealer-ul
  await pick(page, "calc-rule", "riichi");
  tot = await page.$$eval("#calc-totals .calc-tot", e => e.map(x => x.textContent));
  check("riichi: totalurile pornesc de la 25000", tot.every(x => x === "25000"), tot);
  await pick(page, "calc-winner", 1); await pick(page, "calc-loser", 2); await page.click("#calc-add");
  check("după câștigul altcuiva, dealer-ul trece la jucătorul 2", (await page.inputValue("#calc-dealer")) === "1");
  // reset în două apăsări, fără dialog nativ
  let dialogs = 0; page.on("dialog", d => { dialogs++; d.dismiss(); });
  await page.click("#calc-reset");
  check("prima apăsare cere confirmare", /încă o dată|again/i.test(await page.textContent("#calc-reset")) && (await page.locator("#calc-hist li").count()) === 1);
  await page.click("#calc-reset");
  check("a doua apăsare șterge istoricul regulii", (await page.locator("#calc-hist").count()) === 0 && dialogs === 0);
  check("0 erori", st.errs.length === 0, st.errs);
  check("0 violări CSP", (await page.evaluate(() => window.__csp)).length === 0);
  await browser.close();
}

console.log("3. ghid pe regiuni, accesibilitate, mobil");
{
  const {browser, page, st} = await launch({w: 390, h: 844});
  await page.waitForTimeout(600);
  await tab(page);
  check("tabel comparativ cu 5 regiuni", (await page.locator("#calc-guide thead th").count()) === 6);
  check("cardul american apare fără calculator (marcat nereprezentat)", /NMJL/.test(await page.textContent("#calc-guide")));
  await page.click('#calc-guide [data-atlas="mcr"]');
  check("butonul „Fișa” deschide fișa din atlas", await page.locator("#dlg[open]").count() === 1 && /8/.test(await page.textContent("#dlg-body")));
  await page.keyboard.press("Escape");
  check("fără depășire orizontală pe 390 px", (await hOverflow(page)) <= 0);
  // alte limbi: toate cheile noi definite
  const miss = await page.evaluate(() => { const r = []; for (const l of ["ro","en","fr","it","es","pt","de","hu"]) { document.getElementById("sel-lang").value = l; document.getElementById("sel-lang").dispatchEvent(new Event("change")); if (/^calc\./.test(document.getElementById("tab-calc").textContent)) r.push(l); } return r; });
  check("fila Calculator tradusă în toate cele 8 limbi", miss.length === 0, miss);
  await page.selectOption("#sel-lang", "ro");
  await page.waitForTimeout(200);
  const ax = await (async () => { const b2 = await launch({bypassCSP: true}); await b2.page.waitForTimeout(600); await b2.page.click("#tab-calc"); await b2.page.waitForSelector("#calc-tbl"); const r = await axeRun(b2.page); await b2.browser.close(); return r; })();
  check("axe: fără încălcări în fila Calculator", ax === null || ax.length === 0, ax);
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}
summary();
