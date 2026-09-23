# Edge — zadania wdrożeniowe freeze v2 (dla agenta z dostępem do repo)

**Autor:** claude · **Data:** 2026-09-23 · **Wersja:** 2 (po audycie repo)
**Wejście:** `docs/METHOD_V2.md` (kandydat do freeze), `docs/decisions/2026-09-19-v1-checkpoint-150.md`, notatka decyzyjna z 23.09
**Status:** lista do wykonania. **Ten plik usuwamy po wykonaniu** — trwałym zapisem jest PROJECT_MEMORY i log decyzji.

**Warunek wstępny:** operator zatwierdził `METHOD_V2.md`. Jeśli nie zatwierdził, wykonaj tylko zadania 0 i 1, potem zatrzymaj się.

**Czego nie wolno w żadnym zadaniu:**
- usuwać, edytować ani przeliczać wpisów `method_version: v1` — zostają na zawsze jako archiwum,
- liczyć v2 wstecz na meczach v1,
- zmieniać parametrów metody (sekcja 23 METHOD_V2) — to wymaga bumpu wersji,
- edytować opublikowanych raportów dziennych — są niezmienne, poprawki idą jako sekcja erratum,
- uzupełniać kursów zamknięcia po znanym wyniku.

---

## 0. Stan zastany i usterki wykryte w audycie 23.09

Audyt repo na commicie `7d21532`. Księga jest w dobrym stanie: **313 predykcji, zero duplikatów ID, zero braków ceny po obu stronach, zero wpisów `pending`, wszystkie pola `report` wskazują na istniejące pliki.** Poniżej to, co wymaga działania.

**0.1. Plik decyzji leży w złym katalogu.** `docs/2026-09-23-v2-freeze.md` → przenieś do `docs/decisions/2026-09-23-v2-freeze.md`. Tam leży już decyzja z 19.09.

**0.2. Trzy pliki robocze v2 zostały już usunięte** (`METHOD_V2_GPT_DRAFT`, `METHOD_V2_CLAUDE_REVIEW`, `METHOD_V2_GPT_RESPONSE_TO_CLAUDE`). Zostały jeszcze dwa do usunięcia — zadanie 2.

**0.3. 26 wpisów v1 łamie regułę `p_est == round(1/fair_odds, 4)`.** Wszystkie z okresu 21.07–30.08, 25 claude i 1 gpt, maksymalna rozbieżność 0.0028, mediana 0.0005. To pozostałość po wcześniejszej konwencji (najpierw okrągłe `p`, potem zaokrąglony `fair`). **Nie naprawiać** — wpisy są niezmienne. Wpływ na werdykt: −0.00003 w Brierze claude'a, czyli żaden.

**0.4. Dashboard po cichu wyklucza trzy z tych wpisów** (`P-2026-08-27-C1`, `P-2026-08-28-C4`, `P-2026-08-29-C1`), bo `validatePredictions` ma tolerancję 0.001, a `settledEstPredictions` odfiltrowuje wpisy nieważne. **Skutek: dashboard i raport z checkpointu liczą na różnych zbiorach.** Dla claude'a: raport 0.21523 wobec rynku 0.21503 (+0.00020), dashboard po filtrze 0.21117 wobec 0.21106 (+0.00011). Znak i werdykt ten sam, ale liczby inne, i za pół roku ktoś to zobaczy i nie będzie wiedział, która wersja obowiązuje.

**Do rozstrzygnięcia w zadaniu 3:** kanoniczną populacją checkpointu jest **każda rozliczona predykcja z szacunkiem i obiema cenami**, niezależnie od tolerancji zaokrągleń. Rozjazd `p_est` vs `1/fair_odds` poniżej 0.005 jest flagą data-quality, a nie powodem wykluczenia. Zapisz to w PLAYBOOK i dostosuj `validatePredictions` (tolerancja do 0.005 z osobną flagą `legacy_rounding`, zamiast wyrzucania wpisu z próbki).

**0.5. Kursy zamknięcia:** wypełnione w 116 z 313 wpisów, pole `closing_odds_opponent` nie istnieje w żadnym. To oczekiwane — nowe pole dotyczy tylko v2.

**0.6. Raporty z 13–20.07 nie mają wpisów w `predictions`.** To poprawne: te predykcje siedzą w `archived_predictions` po sprzątaniu z 28.07. Nie ruszać, nie „naprawiać".

---

## 1. Zamrożenie definicji v1

v1 nie ma własnego pliku — jego reguły są rozsiane po `PLAYBOOK.md` i `METODA.md`, a PLAYBOOK będzie teraz edytowany. Bez zamrożonego opisu 313 wpisów przestanie być interpretowalnych.

**Utwórz `docs/archive/METHOD_V1.md`:**
- nagłówek: „zamrożone archiwum, metoda nieaktywna od freeze v2", data, SHA commita, z którego wyciągnięto treść,
- reguły estymacji probability v1 z `PLAYBOOK.md` (Decision Framework, Fair Odds, Market Review, Stand-In and Roster Changes, Confidence) i `METODA.md` (de-vig, value, próg 8–10%),
- zakres próbki: 2026-07-21 – 2026-09-20, **claude 158, gpt 155, razem 313**,
- znane odstępstwa: usterka 0.3 powyżej, brak `closing_odds_opponent`, brak wyników rundowych,
- odsyłacz do `reports/summaries/v1-checkpoint-150.md`.

To jedyny plik archiwalny, jaki tworzymy. Reszta historii żyje w gicie.

## 2. Usunięcie plików wchłoniętych przez METHOD_V2

```
git rm "docs/Edge — V2 Research & Rollout Specification.md"
git rm docs/PRE-V2.md
```

Powód: pierwszy opisuje model „v1 active + v2 shadow", który został odrzucony; drugi był notatnikiem roboczym, którego zadanie skończyło się wraz z freeze. Pomysły niewykorzystane w v2.0 są w sekcji 24 METHOD_V2.

**Zanim usuniesz — przekieruj odnośniki, ale tylko w plikach żywych:**

```bash
grep -rln "PRE-V2\|Rollout Specification" --include="*.md" --include="*.js" --include="*.html" .
```

- `docs/ROADMAP.md` → przekieruj na `docs/METHOD_V2.md` (zadanie 5),
- **raporty dzienne i fazowe w `reports/` zostawiamy bez zmian.** Jest tam kilkanaście odwołań do PRE-V2 i one mają prawo zostać: raporty są niezmienne i opisują stan wiedzy z dnia publikacji. To nie są wiszące linki do naprawienia.

## 3. PLAYBOOK.md — aktualizacja w miejscu

**Nie archiwizuj.** PLAYBOOK zawiera rzeczy, które przeżyły v1: scope, staking, dyscyplinę dzienną, checklistę przedpublikacyjną.

- Nowa sekcja **„Method versions"** na początku: v1 zamrożone (→ `docs/archive/METHOD_V1.md`), v2 aktywne (→ `docs/METHOD_V2.md`), przy konflikcie o estymację probability wygrywa METHOD_V2.
- Sekcje opisujące estymację v1 (Decision Framework kroki 6–9, Fair Odds, Market Review, Stand-In and Roster Changes) oznacz jednym zdaniem jako historyczne, **bez usuwania treści**.
- „Calibration & CLV Protocol": dopisz, że checkpoint liczy się na **pierwszych 150 w kolejności `date`, potem `id`**, nigdy nie jest przeliczany przy wyższym n, a warunki dla v2 są w METHOD_V2 sekcje 19–20.
- **Dopisz definicję populacji checkpointu** zgodnie z ustaleniem 0.4.
- „Current Lessons": dopisz lekcję z checkpointu — u claude'a źródłem straty były odejścia **poniżej** rynku (n=40), a nie podnoszenie faworytów; obciążenie „+2 pp w stronę picku" należy do gpt.
- Scope, Stake Rules, Coupon Rules, Pre-Publication Checklist: **bez zmian**.

## 4. REPORT_TEMPLATE.md — bump do v2.0

- Jedna wycena na mecz, jeden agent wykonawczy (gpt) — METHOD_V2 sekcja 21.
- Tabela sekcji 1: dodaj `p_market`, `fresh_adj`, `roster_adj`; `Kurs STS` zostaje w kolejności nazw meczu.
- Sekcja analizy: zamiast narracji jawne wyliczenie — okno formy, FreshMapScore obu stron, FreshDiff, korekta, cap.
- Blok JSON: pełny zestaw pól z METHOD_V2 sekcja 16.
- Zadania otwarte: przypomnienie o kursach zamknięcia **po obu stronach, przy każdym meczu**.
- Nagłówek: `v2.0`, z jednozdaniowym opisem zmiany (dotychczasowa konwencja wersjonowania szablonu).

## 5. ROADMAP.md

- Faza v1: zamknięta, werdykt i odsyłacz do `reports/summaries/v1-checkpoint-150.md`.
- Usuń „Method versioning path (v1 → v2)" opisujący shadow — model odrzucony. Zastąp akapitem: v1 archiwum, v2 jedyna liczona metoda, rynek benchmarkiem.
- Nowa faza: zbieranie v2 do 150, pierwszy odczyt metryki ruchu linii przy n=100.

## 6. PROJECT_MEMORY.md — wpis trwały

W „Calibration & Method Decisions", po wpisie z 2026-09-19:
- data freeze, SHA, pierwszy kwalifikujący się event,
- co zmienia v2 (mechaniczna korekta zamiast uznaniowej, jedna kanoniczna predykcja, gpt wykonuje / claude audytuje),
- cztery zastrzeżenia z review claude i sposób ich rozwiązania,
- że v1 nie jest kontynuowane i dlaczego,
- ustalenie z 0.4 o populacji checkpointu,
- lista usuniętych plików z powodem.

## 7. Schemat `data/bets.json`

Nowe pola **tylko dla wpisów v2** (METHOD_V2 sekcja 16). **Nie migruj v1** — brak tych pól przy v1 jest poprawny.

`p_market`, `fresh_input_pick`, `fresh_input_opponent`, `fresh_map_score_pick`, `fresh_map_score_opponent`, `fresh_diff`, `fresh_adjustment_pp`, `roster_penalty_pick`, `roster_penalty_opponent`, `total_adjustment_pp`, `closing_odds_opponent`, `data_quality`.

**Walidator** (`scripts/validate_bets.py`):

```
wszystkie:  id unikalne; decision w {BET,PASS}; result w {won,lost,void,pending}
            0 < estimated_probability < 1; kursy > 1
            market_odds_at_analysis i market_odds_opponent obecne
            |estimated_probability - 1/fair_odds| <= 0.005
                 (> 0.0001 przy wpisach v1 z lipca/sierpnia = flaga legacy_rounding, nie błąd)
v2:         komplet pól powyżej
            |estimated_probability - p_market| <= 0.0501
            fresh_adjustment_pp w [-4, 4]; roster_penalty w {0, -2}
            fresh_input_* w {round_diff, map_result_fallback}
            closing_odds i closing_odds_opponent oba wypełnione albo oba null
```

Uruchom na obecnym pliku. Oczekiwany wynik: 26 flag `legacy_rounding`, zero błędów twardych.

## 8. Katalog `data/form/`

`data/form/README.md` z opisem formatu: jeden plik na dzień meczowy, per drużyna lista map (data, przeciwnik, pasmo rankingowe HLTV, mapa, wynik rundowy albo `null`, waga recency, waga przeciwnika), plus wyliczony `FreshMapScore` i `fresh_input`.

To jednocześnie cache (drużyna grająca trzy dni z rzędu liczona raz dziennie) i materiał do audytu — bez surowego okna audytor nie ma czego przeliczyć.

## 9. Dashboard — część blokująca (zrobić teraz)

Pliki: `dashboard/shared-metrics.js`, `dashboard/research.js`.

**9.1.** `renderCalibrationAgentSection(preds, agent, invalidIds)` grupuje dziś wyłącznie po agencie. Dodaj wymiar wersji — sekcja per `agent × method_version`. Po pierwszym wpisie v2 obecny kod pokazałby jedną liczbę zbudowaną z dwóch różnych metod; to wygląda jak wynik, a jest błędem.

**9.2.** `settledEstPredictions(preds, agent)` — dodaj opcjonalny parametr wersji i **przestań wykluczać wpisy z rozjazdem zaokrągleń** (ustalenie 0.4). Rozjazd ≤0.005 ma być flagą w sekcji data-quality, nie powodem usunięcia z próbki.

**9.3.** `validatePredictions` — tolerancja `probability != 1/fair_odds` z 0.001 na 0.005, z osobnym oznaczeniem zamiast twardego „invalid".

**9.4.** Brier Advantage: pokazuj z bootstrapowym przedziałem ufności, nigdy sam znak. Przy braku przedziału opis ma mówić „różnica nieodróżnialna od zera", jeśli CI zawiera zero.

**9.5.** Licznik postępu v2: `n / 150` obok istniejących progów v1.

**9.6.** v1 zostaje widoczne jako zamrożony baseline, z etykietą „archiwum".

## 10. Dashboard — część odroczona (przy pierwszych danych v2)

Panel metryki ruchu linii: średni `move`, bootstrap CI, odsetek trafionych kierunków, pokrycie snapshotów, osobna podpróbka ≥3 pp. **Aktywny dopiero przy n ≥ 100**, wcześniej sam licznik.

Powód odroczenia: przy freeze v2 ma n=0, a sto obserwacji z kursami zamknięcia po obu stronach to realnie listopad. Pisanie tego teraz to kod, którego nikt nie zobaczy przez półtora miesiąca.

## 11. Kolejność commitów

```
1. docs: move v2 freeze decision to decisions/        (0.1)
2. docs: archive METHOD_V1                            (1)
3. docs: fold remaining v2 drafts into METHOD_V2      (2)
4. docs: PLAYBOOK / ROADMAP / REPORT_TEMPLATE for v2  (3-5)
5. data: v2 schema + validator                        (7)
6. data: form window cache scaffold                   (8)
7. dashboard: per-version metrics, rounding tolerance  (9)
8. docs: PROJECT_MEMORY freeze entry                  (6)
9. usuń ten plik
```

SHA freeze do wpisania w nagłówku `METHOD_V2.md` to commit z kroku 4. Wpis w PROJECT_MEMORY na końcu, bo dopiero wtedy znasz wszystkie SHA.

## 12. Kryteria odbioru

- `predictions` ma **dokładnie 313 wpisów** przed i po całej operacji, wszystkie `method_version: v1`,
- walidator: 26 flag `legacy_rounding`, zero błędów twardych,
- `grep -rn "PRE-V2\|Rollout Specification"` zwraca wyłącznie trafienia w `reports/**` (niezmienne) oraz w PROJECT_MEMORY i logu decyzji — żadnego w `docs/PLAYBOOK.md`, `docs/ROADMAP.md`, `dashboard/`,
- dashboard ładuje się bez błędów, pokazuje v1 jako archiwum i pustą sekcję v2 (n=0), a trzy wpisy z 27–29.08 są z powrotem w próbce claude'a z flagą data-quality,
- `docs/METHOD_V2.md` ma wypełniony blok freeze (data, SHA, pierwszy event),
- `docs/archive/METHOD_V1.md` i `data/form/README.md` istnieją,
- `docs/decisions/` zawiera dwa pliki: z 19.09 i z 23.09.
