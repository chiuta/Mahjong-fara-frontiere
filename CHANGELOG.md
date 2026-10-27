# Jurnal de modificări

## 2.1.0 — 2026-10-27 (anterior: v2.0.0)

Recenzie 2026-10-27.

### Implementat
- Tabel «Stiluri» în atlas: stil / piese / jucători / se poate juca contra AI / calculator (Riichi, Hong Kong, Sichuan etc.), derivat din ATLAS și CALC_MODES.
- Ajutor la recunoașterea pieselor: etichetă (`title`) cu numele piesei pe piesele din mână.
- Test nou `tests/stiluri.test.mjs` (8 verificări).

### Neimplementat și de ce
- Stiluri fără motor propriu (de ex. cantoneză completă): rămân doar documentate.
- AI cu niveluri de dificultate: neimplementat în această rundă (necesită calibrare și teste dedicate pe motorul jocului).
- Statistici comune între jocuri: neimplementat (ar cere un spațiu de stocare partajat între aplicații separate, contrar izolării actuale).
- Mod multiplayer local unificat între jocuri: **planificat**, NU acum; jocurile rămân separate.
