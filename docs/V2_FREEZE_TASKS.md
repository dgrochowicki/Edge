# Edge — zadania wdrożeniowe freeze v2 (dla agenta z dostępem do repo)

**Autor:** claude · **Data:** 2026-09-23
**Wejście:** `docs/METHOD_V2.md` (kandydat do freeze), `docs/decisions/2026-09-23-v2-freeze.md`
**Status:** lista do wykonania. **Ten plik usuwamy po wykonaniu** — trwałym zapisem jest PROJECT_MEMORY i log decyzji.

**Warunek wstępny:** operator zatwierdził `METHOD_V2.md`. Jeśli nie zatwierdził, wykonaj tylko zadania 1–2 i zatrzymaj się.

**Czego nie wolno w żadnym zadaniu:**
- usuwać ani przeliczać wpisów `method_version: v1` — zostają na zawsze jako archiwum,
- liczyć v2 wstecz na meczach v1,
- zmieniać parametrów metody (sekcja 23 METHOD_V2) — to wymaga bumpu wersji,
- uzupełniać kursów zamknięcia po znanym wyniku.

---

## 1. Zamrożenie definicji v1

v1 był opisany rozproszony po `PLAYBOOK.md` i `METODA.md`, a PLAYBOOK będzie teraz edytowany. Bez zamrożonego opisu wpisy v1 przestaną być interpretowalne.

**Utwórz `docs/archive/METHOD_V1.md`:**
- nagłówek: status „zamrożone archiwum, metoda nieaktywna od freeze v2", data, SHA commita, z którego wyciągnięto treść,
- treść: reguły estymacji probability v1 wyciągnięte z `PLAYBOOK.md` (Decision Framework, Fair Odds, Market Review, Stand-In and Roster Changes, Confidence) i `METODA.md` (de-vig, value, próg 8–10%),
- zakres próbki: daty pierwszej i ostatniej predykcji v1 oraz liczba wpisów per agent (policz z `data/bets.json`),
- odsyłacz do `reports/summaries/v1-checkpoint-150.md`.

To jedyny plik archiwalny, jaki tworzymy. Reszta historii żyje w gicie.

## 2. Usunięcie plików wchłoniętych przez METHOD_V2

```
git rm docs/METHOD_V2_GPT_DRAFT.md
git rm docs/METHOD_V2_CLAUDE_REVIEW.md
git rm docs/METHOD_V2_GPT_RESPONSE_TO_CLAUDE.md
git rm "docs/Edge — V2 Research & Rollout Specification.md"
git rm docs/PRE-V2.md
```

Commit osobno od reszty, z opisem „docs: fold v2 drafts into METHOD_V2.md". Przed usunięciem sprawdź, czy żaden zachowywany plik do nich nie linkuje:

```bash
grep -rn "PRE-V2\|METHOD_V2_GPT\|METHOD_V2_CLAUDE\|Rollout Specification" --include="*.md" --include="*.js" --include="*.html" .
```

Znalezione odnośniki przekieruj na `docs/METHOD_V2.md`.

## 3. PLAYBOOK.md — aktualizacja w miejscu

**Nie archiwizuj.** PLAYBOOK zawiera rzeczy, które przeżyły v1: scope, staking, dyscyplinę dzienną, checklistę przedpublikacyjną.

- Dodaj na początku sekcję **„Method versions"**: v1 zamrożone (odsyłacz do `docs/archive/METHOD_V1.md`), v2 aktywne (odsyłacz do `docs/METHOD_V2.md`), przy konflikcie dotyczącym estymacji probability wygrywa METHOD_V2.
- Sekcje opisujące estymację v1 (Decision Framework kroki 6–9, Fair Odds, Market Review, Stand-In and Roster Changes) oznacz jako **historyczne** jednym zdaniem na początku każdej, bez usuwania treści.
- W „Calibration & CLV Protocol": zachowaj, dopisz że warunki porażki i checkpoint dla v2 są w METHOD_V2 sekcje 19–20, a checkpoint liczy się na pierwszych 150 w kolejności `date`, potem `id`.
- „Current Lessons": dopisz lekcję z checkpointu — odejścia poniżej rynku były u claude głównym źródłem straty, a nie podnoszenie faworytów.
- Scope, Stake Rules, Coupon Rules, Pre-Publication Checklist: **bez zmian**.

## 4. REPORT_TEMPLATE.md — bump do v2.0

Aktualizuj w miejscu (stare wersje są w gicie).

- Jedna wycena na mecz, jeden agent wykonawczy (gpt), zgodnie z METHOD_V2 sekcja 21.
- Tabela sekcji 1: dodaj kolumny `p_market`, `fresh_adj`, `roster_adj`, zostaw `Kurs STS` w kolejności nazw meczu.
- Sekcja analizy: zamiast narracji — jawne wyliczenie (okno formy, FreshMapScore obu stron, FreshDiff, korekta, cap).
- Blok JSON: pełny zestaw pól z METHOD_V2 sekcja 16.
- Zadania otwarte: przypomnienie o kursach zamknięcia **po obu stronach**.
- Nagłówek wersji szablonu: `v2.0 (2026-__-__)`, z jednozdaniowym opisem zmiany.

## 5. ROADMAP.md — zamknięcie fazy v1

- Faza v1: zamknięta, werdykt i odsyłacz do raportu z checkpointu.
- Nowa faza: zbieranie v2 do 150, z metryką ruchu linii jako pierwszym odczytem przy n=100.
- Usuń „Method versioning path (v1 → v2)" opisujący shadow — ten model został odrzucony; zastąp jednym akapitem o modelu docelowym (v1 archiwum, v2 jedyna liczona, rynek benchmarkiem).

## 6. PROJECT_MEMORY.md — wpis trwały

Dopisz w „Calibration & Method Decisions", po wpisie z 2026-09-19:

- data freeze, SHA, pierwszy kwalifikujący się event,
- co zmienia v2 wobec v1 (mechaniczna korekta zamiast uznaniowej, jedna kanoniczna predykcja, role: gpt wykonuje, claude audytuje),
- cztery zastrzeżenia z review claude i jak zostały rozwiązane,
- że v1 nie jest kontynuowane i dlaczego,
- lista usuniętych plików z jednozdaniowym powodem.

## 7. Schemat `data/bets.json`

Dodaj pola **tylko dla nowych wpisów v2** (sekcja 16 METHOD_V2). **Nie migruj wpisów v1** — brak tych pól przy v1 jest poprawny i oczekiwany.

Nowe pola: `p_market`, `fresh_input_pick`, `fresh_input_opponent`, `fresh_map_score_pick`, `fresh_map_score_opponent`, `fresh_diff`, `fresh_adjustment_pp`, `roster_penalty_pick`, `roster_penalty_opponent`, `total_adjustment_pp`, `closing_odds_opponent`, `data_quality`.

**Walidator** (`scripts/validate_bets.py` albo równoważny) — musi sprawdzać:

```
wszystkie wpisy:  estimated_probability == round(1/fair_odds, 4)
                  market_odds_at_analysis i market_odds_opponent obecne
                  id unikalne, zgodne ze wzorcem
v2:               komplet pól z sekcji 16
                  abs(estimated_probability - p_market) <= 0.0501
                  fresh_adjustment_pp w [-4, 4]
                  fresh_input_* w {round_diff, map_result_fallback}
                  closing_odds i closing_odds_opponent razem albo oba null
```

Uruchom go na obecnym pliku i zgłoś, co nie przechodzi — spodziewane braki po stronie v1 wypisz osobno, nie naprawiaj.

## 8. Katalog `data/form/`

Utwórz z plikiem `README.md` opisującym format: jeden plik na dzień meczowy, per drużyna lista map (data, przeciwnik, pasmo rankingowe HLTV, mapa, wynik rundowy albo `null`, waga recency, waga przeciwnika), plus wyliczony `FreshMapScore` i `fresh_input`.

To jest jednocześnie cache i materiał do audytu — bez tego audyt nie ma czego przeliczać.

## 9. Dashboard

- Grupowanie metryk per `agent × method_version` (dziś liczy zbiorczo, `shared-metrics.js` ma TODO o filtrze agenta).
- Nowy panel: metryka ruchu linii (średni `move`, bootstrap CI, odsetek trafionych kierunków, pokrycie snapshotów), aktywna dopiero przy n≥100 — poniżej pokazuj wyłącznie licznik.
- Brier Advantage zawsze z przedziałem ufności, nigdy sam znak.
- v1 zostaje widoczne jako zamrożony baseline.

## 10. Kolejność i commity

```
1. archive METHOD_V1                     (zadanie 1)
2. docs: fold v2 drafts into METHOD_V2   (zadanie 2)
3. docs: PLAYBOOK/ROADMAP/REPORT_TEMPLATE for v2   (3–5)
4. data: v2 schema + validator           (7)
5. data: form window cache scaffold      (8)
6. dashboard: per-version metrics        (9)
7. docs: PROJECT_MEMORY freeze entry     (6)
8. usuń ten plik                          (V2_FREEZE_TASKS.md)
```

Wpis freeze w PROJECT_MEMORY na końcu, bo dopiero wtedy znasz SHA commitów. SHA freeze do wpisania w nagłówku `METHOD_V2.md` to commit z zadania 3.

## 11. Kryteria odbioru

- `grep -rn "PRE-V2\|Rollout Specification\|METHOD_V2_GPT"` nie zwraca nic poza PROJECT_MEMORY i logiem decyzji,
- walidator przechodzi na wszystkich wpisach v1 w zakresie reguł wspólnych,
- dashboard ładuje się bez błędów i pokazuje v1 osobno od v2 (v2 puste, n=0),
- `METHOD_V2.md` ma wypełniony blok freeze,
- nie ubyło ani nie przybyło żadnego wpisu w `predictions` (313 przed i po),
- `data/form/README.md` istnieje.
