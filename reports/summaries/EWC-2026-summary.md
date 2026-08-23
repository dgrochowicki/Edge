# Edge — Raport zbiorczy: EWC 2026 (cały turniej)

**Turniej:** Esports World Cup 2026 (Paryż, S-Tier / Valve Tier 1, pula 2 mln USD)
**Zakres:** 2026-08-12 – 2026-08-23 (grupowa + playoffy + finał)
**Metoda:** v1 · **Gra:** cs2 · **Rynek:** STS
**Status:** opisowy. NIE walidacja metody — patrz sekcja "Status i zastrzeżenia".
**Mistrz EWC 2026:** Team Spirit (3:1 nad FUT w Grand Final BO5). 3. miejsce: Legacy (2:1 nad FURIA).

---

## 1. Zakres

Pełny turniej: faza grupowa (12-16.08, double-elim, BO1 otwierające + BO3), playoffy (19-22.08, single-elim, BO3) i finałowy dzień (23.08, Grand Final BO5 + mecz o 3. miejsce BO3). Obaj agenci (claude, gpt) generowali niezależne predykcje moneyline dla każdego meczu, wszystkie logowane niezależnie od decyzji PASS/BET.

Predykcji rozliczonych w EWC: **claude 56, gpt 56.**

## 2. Kalibracja — cały turniej

Metryka główna: Brier (niżej = lepiej). Baseline p=0.5 = 0.2500.

| Agent | Brier | Trafienia | BET |
|-------|------:|----------:|-----|
| claude | 0.1990 | 42/56 (75%) | 0W / 0L |
| gpt | 0.1973 | 39/56 (70%) | 6W / 3L |

Za cały EWC agenci praktycznie remisują w Brier (różnica 0.0017 — w granicach szumu). Utrwalony wzorzec: **claude trafia więcej picków (75% vs 70%), gpt lepiej kalibruje prawdopodobieństwa.** Obaj mocno biją baseline 0.25.

## 3. Kalibracja per faza

| Faza | claude Brier | gpt Brier | claude traf | gpt traf |
|------|------:|------:|----:|----:|
| Grupowa (40 pred.) | 0.1968 | 0.1958 | 80% | 72% |
| Playoff 19-22 (14) | 0.2038 | 0.1987 | 64% | 64% |
| Finał 23 (2) | 0.2091 | 0.2168 | 50% | 50% |

Obserwacje:
- Faza grupowa najłatwiejsza (dużo wyraźnych faworytów) — claude 80% trafień.
- Playoffy trudniejsze — upsety obniżyły trafialność claude o 16pp. gpt minimalnie lepszy Brier.
- Finał (mała próbka, 2 mecze): claude minimalnie lepszy — mecz o 3. miejsce (loteria motywacji) obaj przewidzieli źle, finał (Spirit) obaj dobrze.
- gpt prowadzi w Brier w grupowej i playoffach, claude w finale — netto gpt o włos.

## 4. Kalibracja narastająco (cała próbka projektu, nie tylko EWC)

| Agent | n | Brier | Trafienia |
|-------|--:|------:|----------:|
| claude | 86 | 0.2156 | 59/86 (69%) |
| gpt | 83 | 0.2043 | 53/83 (64%) |

Na pełnej próbce projektu gpt utrzymuje przewagę ~0.011 Brier — stabilnie przez cały turniej (grupowa 0.013, playoff 0.005, całość ~0.011). To najsilniejszy dotąd sygnał, że przewaga gpt jest strukturalna, nie szumowa. Rozliczonych łącznie w projekcie: 169 (sumaryczny checkpoint 150 przekroczony; per-agent 150 jeszcze nie — claude 86, gpt 83).

## 5. Decyzje BET

**claude: 0 BET przez CAŁY turniej** (0 BET / 56). gpt: 9 BET w EWC (6W/3L), łącznie w projekcie 7W/5L (n=12).

0 BET po stronie claude potwierdziło się jako artefakt marży STS (~8%), NIE nadmierna ostrożność: przy remisowym Brier i wyższej trafialności picków, brak betów odzwierciedla realny brak value po odjęciu marży, nie tchórzostwo. gpt akceptował cieńsze value (bety przy p≈0.49) i netto wyszedł na lekkim plusie w EWC — ale 12 betów to za mało na wniosek o edge.

## 6. Dywergencje (bezpośrednie punkty sporne)

Cały turniej dał 3 czyste dywergencje (wszystkie w playoffach):

| Mecz | claude | gpt | wynik | punkt |
|------|--------|-----|-------|-------|
| Vitality vs Spirit | PASS/Vitality (0.58) | BET/Spirit @2.20 | Spirit 2:1 | gpt |
| FUT vs MOUZ | PASS/MOUZ (0.60) | BET/FUT @2.29 | FUT 2:0 | gpt |
| Legacy vs Spirit | PASS/Spirit (0.70) | BET/Legacy @3.50 | Spirit 2:0 | claude |

**Bilans: gpt 2, claude 1.** Żaden nie zdominował — spójne z bliskim Brier. Uwaga: wpis FUT-MOUZ gpt miał flagę pick-direction (commit d102365); Brier niezmieniony (symetria), dotyczy tylko hit rate.

## 7. Kluczowe wzorce turnieju

**Słabość claude — niedoważanie sygnału formy underdoga.** Trzy upsety, gdzie underdog wcześniej dał sygnał, a claude go zdyskontował: FUT>MOUZ (dwukrotnie), Legacy>NaVi→Falcons, Spirit>Vitality mimo H2H 11-4. claude zakotwiczał się w rankingu/renomie/H2H. **To główny materiał do v2:** zmierzyć, jak radzą sobie zespoły po tym, jak jako underdog pobiły top-team — realny sygnał czy powrót do średniej.

**Ale claude NIE popadł w nadkorektę.** Przy Legacy-Spirit świadomie nie zagrał underdoga w "rewanżu" za wcześniejsze upsety — trafnie (Spirit wygrał). Słabość to konkretnie ignorowanie sygnału formy, nie ślepe trzymanie faworytów.

**Data-expiration / roster.** Przez cały turniej: MongolZ (przebudowa, academy, brak trenera), PARIVISION (HObbit out), FaZe (broky ławka), Aurora, MOUZ (PR z GL). Rynek konsekwentnie dyskontował drużyny po zmianach — zgodnie z tezą, że H2H sprzed roszad opisuje inną drużynę.

**Mylność wczesnych BO1.** Domknięcie narracji: Spirit przegrał BO1 dnia 1 z JiJieHao (#162), spadł do lower bracketu, spisany na straty — został MISTRZEM. Legacy, gorący underdog z runem na NaVi+Falcons, wygasło na Spircie i wzięło brąz. Wczesne wyniki BO1 (wysoka wariancja) słabo przewidują końcowy rezultat.

**Marża rośnie z wagą meczu.** Najmniejszy |value| całego turnieju był w finale (Spirit -1.6%, FURIA -2.5%) — najostrzejszy, najbardziej płynny rynek. Im ważniejszy mecz i większa uwaga bukmachera, tym mniejszy edge.

## 8. Status i zastrzeżenia (WAŻNE)

- **Collection trwa.** 169 rozliczonych łącznie. Sumaryczny checkpoint 150 przekroczony, ale per-agent (rekomendowany) jeszcze nie: claude 86, gpt 83.
- **v1 z biasem** — bez zmian. v2 niezdefiniowane; wzorzec z sekcji 7 to główny wkład do jego definicji.
- **CLV** — pokrycie closing_odds wciąż za niskie na wnioski.
- **Brak stwierdzeń "metoda działa".** gpt prowadzi stabilnie o ~0.01 Brier, obaj biją baseline. To sygnał "kontynuować + zdefiniować v2 + zebrać CLV", NIE walidacja ani zielone światło do grania.

## 9. Następne kroki

- Domknąć definicję checkpointu (per-agent vs sumaryczny) — agent VS Code liczy oba warianty.
- Dokończyć audyt pick-direction gpt (hit rate; Brier niezmieniony).
- Zdefiniować v2 — priorytet: mechanizm doważania sygnału formy underdoga (sekcja 7).
- Zwiększyć pokrycie CLV (closing_odds) w kolejnych turniejach.

---
*Wygenerowano ze stanu data/bets.json (finał EWC rozliczony). Turniej zamknięty — dokument niezmienny. Kalibracja liczona z rozliczonych predykcji. P&L operatora (kupony user_bet) celowo poza tym raportem — mierzy grę operatora, nie metodę; dostępny osobno na dashboardzie.*
