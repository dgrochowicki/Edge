# Edge — decyzja: ostatni test (line shopping)

**Data:** 2026-10-14 · **Decyzja operatora:** Dom · **Status:** AKTYWNA od 2026-10-15
**Koniec testu:** 2026-10-28 albo koniec Thunderpick World Championship 2026 — co nastąpi później.

## Dlaczego

- v1 (n=150): brak przewagi nad rynkiem u obu agentów.
- V2: z konstrukcji (±5 pp od ceny STS, próg +8%) daje prawie wyłącznie PASS-y.
- Wniosek: nie wyceniamy tier-1 CS2 lepiej niż bukmacher. Przestajemy próbować.

Ostatni test sprawdza coś innego: czy **STS bywa wyraźnie gorzej wyceniony niż ostry rynek**. Bez modelu, bez analizy formy.

## Co zawieszamy

- Dzienne raporty V2 — zawieszone na czas testu. Dane zostają w repo jako archiwum.
- Blind pilot v0 — **nie startuje**.

## Reguła (jedna)

Dla każdego meczu tier-1 / Thunderpick, moneyline:

1. Kursy STS na obie strony + kursy referencyjne na obie strony, odczytane w tym samym czasie.
   - Referencja: **Pinnacle**. Jeśli niedostępny — średnia z agregatora (np. OddsPortal), zapisana jako `ref_source`.
2. `p_ref` = de-vig referencji (obie strony).
3. `edge = kurs_STS × p_ref − 1` dla każdej strony.
4. **BET 1u, jeśli edge ≥ +3%.** Inaczej PASS.
5. Boosty/promocje STS na CS2 liczymy tak samo (kurs po boście).
6. Przed meczem: kurs zamknięcia Pinnacle/referencji dla obstawionej strony → CLV.

## Kryterium końca (ustalone teraz, nie po fakcie)

- **Mniej niż 5 okazji z edge ≥ +3% w całym teście → zamykamy projekt.**
- 5 lub więcej okazji i średni CLV dodatni → projekt zostaje w tej formie (line shopping), V2 i blind archiwizujemy na stałe.
- 5 lub więcej okazji, ale CLV ≤ 0 → zamykamy (referencja była nieaktualna lub zła).

Wynik finansowy z 2 tygodni nie jest kryterium — za mało meczów. Liczy się liczba okazji i CLV.

## Zapis

`data/line_test.json` — jeden rekord na mecz: data, mecz, czas odczytu, kursy STS A/B, kursy ref A/B, `ref_source`, `p_ref`, edge A/B, decyzja, kurs zamknięcia ref, wynik. Poza `data/bets.json`.
