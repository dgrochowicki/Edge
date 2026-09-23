# Method v1 — zamrożone archiwum

**Status:** metoda nieaktywna od freeze v2 (2026-09-23). Zamrożone na commicie `0042243c3f968a38b583fe58ba11b20d5d2bc444`.
**Nie edytować.** To jest zdjęcie reguł v1 w momencie zamrożenia, dla interpretowalności 313 wpisów `method_version: "v1"` w `data/bets.json`. Aktywna metoda: `docs/METHOD_V2.md`.

---

## 1. Zakres próbki

- **Okno:** 2026-07-21 – 2026-09-20.
- **claude:** 158 rozliczonych predykcji. **gpt:** 155 rozliczonych predykcji. **Razem: 313.**
- Wcześniejsze raporty (13–20.07) nie mają odpowiadających wpisów w `predictions` — te predykcje zostały przeniesione do `archived_predictions` przy sprzątaniu z 28.07 i nie są częścią tej próbki.
- Werdykt checkpointu 150 (pierwsze 150 rozliczonych na agenta, w kolejności `date` potem `id`) jest zapisany osobno w `reports/summaries/v1-checkpoint-150.md` i `docs/decisions/2026-09-19-v1-checkpoint-150.md`. Ten plik go nie powtarza.

## 2. Reguły estymacji prawdopodobieństwa

Źródło: `docs/PLAYBOOK.md` (Decision Framework, Market Review, Stand-In and Roster Changes, Confidence) i `docs/METODA.md` (de-vig, value, próg) w stanie na dzień freeze.

### Decision Framework (kolejność kroków)

1. Verify the event.
2. Verify the match format.
3. Verify expected rosters and known substitutions.
4. Review recent team level and opponent quality.
5. Review map pool or game-specific matchup factors.
6. Estimate win probability.
7. Convert probability into fair odds.
8. Compare fair odds with bookmaker odds.
9. Account for uncertainty and market margin.
10. Decide BET or PASS.
11. Record the decision before the match.
12. Review the decision after the match without rewriting the pre-match logic.

### De-vig i value (METODA.md)

```
p_est          = osąd analityka, punkt startowy = de-vig rynku
fair_odds      = 1 / p_est
de-vig strony A = (1/kurs_A) / (1/kurs_A + 1/kurs_B)
value          = (kurs_bukmachera / fair_odds - 1) x 100%
```

Zasada: zostań blisko de-vigu rynku, chyba że jest **konkretny, zaobserwowany powód** do odejścia (map pool, przebudowany skład, forma LAN vs online, kontuzja, niedoświadczony gracz na kluczowej roli). Nie odchodzić na podstawie przeczucia w trakcie meczu.

Próg BET: **value > ~8-10% i konkretny powód.** value 0-8% to PASS (przewaga mieści się w szumie niepewności oceny). value ujemne to zawsze PASS.

### Market Review — czynniki per rynek

- **Moneyline:** team strength, recent opponent quality, roster stability, map-pool compatibility, match format, motivation/tournament context, price sensitivity.
- **Over 2.5 Maps:** format BO3, realna przewaga mapowa każdej strony, struktura veto, prawdopodobieństwo jednostronnych map, częstość sweepów, niepewność rosterowa, czy obie strony mogą wygrać swój prawdopodobny pick.
- **Map Handicap:** konsystencja faworyta, podłoga mapowa underdoga, veto, prawdopodobieństwo dogrywki/bliskich porażek, różnica między match win probability a map-margin probability.

### Stand-In and Roster Changes

Nie fade'uj automatycznie drużyny ze stand-inem. Oceniaj: jakość gracza, dopasowanie do roli, obciążenie komunikacyjne, czas przygotowania, zmiany map poolu, czy stand-in grał wcześniej z rdzeniem składu, czy bukmacher już skorygował cenę. Zmiana rosteru to czynnik, nie samodzielna teza.

### Confidence

Skala 1-10, dotyczy pewności że **istnieje value**, nie pewności że pick wygra: 1-3 słaba teza (zwykle PASS), 4-5 niepewne (zwykle PASS), 6 mały możliwy edge, 7 rozsądne value, 8 mocne value z wiarygodną informacją, 9 wyjątkowy setup, 10 używane wyjątkowo rzadko. Confidence nigdy nie zastępuje probability ani fair odds.

## 3. Zakres analizowanych meczów (Scope)

CS2-only, tylko tier-1 (S-Tier / Valve Tier 1): Valve Majors, BLAST top events, IEM main events, ESL Pro League main events, PGL main events, Esports World Cup, StarLadder StarSeries *main events*. Wyraźnie poza zakresem: wszelkie kwalifikacje (także do eventów tier-1), tier-2/3 circuits (CCT, Thunderpick, NODWIN, Urban Riga, United21, ESL Challenger, ESEA Premier, regional IEM), akademie/B-teamy, wszystko poniżej S-Tier. Mecze poza zakresem nie dostają wyceny ani wpisu w ogóle (nie jako PASS).

## 4. Schemat wpisu (v1)

Pola wymagane: `id`, `date`, `report`, `agent`, `method_version: "v1"`, `game` (zawsze `"cs2"`), `match`, `market`, `pick`, `estimated_probability` (= `round(1/fair_odds, 4)`), `fair_odds`, `market_odds_at_analysis`, `market_odds_opponent`, `odds_timestamp`, `closing_odds` (null przy utworzeniu), `decision`, `confidence`, `result` (`pending` przy utworzeniu).

Pól v2 (`p_market`, `fresh_*`, `roster_penalty_*`, `closing_odds_opponent`, `data_quality`) v1 nie posiada — ich brak przy wpisach v1 jest poprawny, nie brakiem danych.

## 5. Metryki i progi walidacji

- **Brier score:** średnia `(estimated_probability - outcome)^2` po rozliczonych wpisach.
- **Market baseline:** de-vigowany kurs STS, liczony na tej samej parze meczów (paired sample).
- **CLV:** `(odds_at_analysis / closing_odds - 1) x 100` dla wpisów z kursem zamknięcia.
- **Checkpoint:** pierwsze 150 rozliczonych wpisów **per agent × method_version**, w kolejności `date` potem `id`. Nigdy nie przeliczany przy wyższym n.
- **Warunek porażki:** jeśli przy checkpoincie 150 Brier agenta nie jest lepszy od rynku, metoda tego agenta jest **niezwalidowana**. Jeśli przy 50 snapshotach zamknięcia na BET-ach średni CLV jest ujemny, metoda selekcji jest niezwalidowana.

## 6. Werdykt checkpointu 150 (streszczenie)

| Agent x wersja | Brier | Rynek (de-vig STS) | Różnica | Werdykt |
|---|---:|---:|---:|---|
| claude x v1 | 0.21523 | 0.21503 | +0.00020 | **niezwalidowana** |
| gpt x v1 | 0.20759 | 0.20793 | -0.00034 | **zwalidowana** |

Żadnej z różnic nie da się odróżnić od zera (95% CI ±0.0045 claude, ±0.006 gpt). Pełna analiza: `reports/summaries/v1-checkpoint-150.md`. Decyzje operatora: `docs/decisions/2026-09-19-v1-checkpoint-150.md`.

## 7. Znane odstępstwa i usterki danych

- **Zaokrąglenie `estimated_probability` vs `1/fair_odds`:** 23 wpisy (audyt 23.09 zliczył 26, rozjazd nie wyjaśniony — do weryfikacji), wszystkie w oknie 2026-07-21 – 2026-08-30, wszystkie agenta **claude** (nie 25 claude + 1 gpt jak wstępnie raportowano). Rozjazd maks. 0.0028, mediana ~0.0006 — pozostałość po wcześniejszej konwencji (najpierw zaokrąglone `p`, potem zaokrąglony `fair`). Wpisy pozostają niezmienione; wpływ na Brier claude'a przy checkpoincie: ok. -0.00003, czyli bez znaczenia dla werdyktu.
- **Kursy zamknięcia:** wypełnione w 116 z 313 wpisów (37%). Pole `closing_odds_opponent` nie istnieje w żadnym wpisie v1 — dotyczy tylko v2.
- **Brak wyników rundowych per mapa** — v1 nie zbierał `data/form/`, więc żadna analiza post-hoc na poziomie mapy nie jest możliwa dla tej próbki.
- Wcześniej ustalona populacja checkpointu (patrz `docs/decisions/2026-09-19-v1-checkpoint-150.md` i notatka z 23.09): **każda rozliczona predykcja z szacunkiem i obiema cenami**, niezależnie od rozjazdu zaokrągleń poniżej 0.005 — taki rozjazd jest flagą jakości danych, nie powodem wykluczenia z próbki.

## 8. Dlaczego v1 zakończone

Obaj agenci osiągnęli checkpoint 150 podczas StarLadder StarSeries Fall 2026 (17-20.09). claude niezwalidowany, gpt zwalidowany, ale żadna różnica nie jest odróżnialna od zera przy tej wielkości próbki — amplituda wyniku pojedynczego turnieju (do 0.007 w Brierze) jest większa niż cała różnica na próbce 150 (0.0002-0.0003). Operator zdecydował (23.09): v2 zastępuje v1, a nie działa równolegle z nim — v1 okazało się nieodróżnialne od rynku, więc "v2 vs v1" niosłoby tę samą informację co "v2 vs rynek", drożej. v1 zostaje jako archiwum i punkt odniesienia historycznego; nowe predykcje logowane są jako `method_version: "v2"`.
