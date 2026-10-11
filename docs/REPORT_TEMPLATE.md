# Edge Daily Report Template

Current version: v2.1 (2026-10-11)
Status: obowiązuje od następnego turnieju po EPL S24 (`docs/METHOD_V2.md`, protokół oceny E2)

Zmiana w v2.1 (decyzja `docs/decisions/2026-10-11-v2-ocena-e2.md`): nowe pole `p_v2` w JSON i w tabeli, reguła wyboru picku (strona z wyższym value), stała precyzja 4 miejsc dla prawdopodobieństw i korekt. Wycena bez zmian.

Zmiana w v2.0: szablon przechodzi na jedną kanoniczną wycenę na mecz zamiast dwóch niezależnych ocen (claude, gpt). Powód: METHOD_V2 §21 — dwóch wykonawców liczących ten sam deterministyczny wzór to nie dwie niezależne obserwacje, próbka rośnie o jeden wpis na mecz, nie o dwa. **gpt jest głównym analitykiem dziennym** i pisze ten raport; **claude jest okresowym audytorem** (co turniej albo co 20–30 predykcji), nie pisze równoległego raportu dziennego. Sekcja 1 dostaje trzy nowe kolumny (`p_market`, `fresh_adj`, `roster_adj`), sekcja 2 zamienia narrację na jawne wyliczenie kroków metody, a blok JSON w sekcji 4 rośnie do pełnego zestawu pól z METHOD_V2 §16. Poprzednia wersja (v1.7, dwie niezależne wyceny) jest zarchiwizowana wraz z metodą w `docs/archive/METHOD_V1.md`.

Każdy raport dzienny ma nazwę `reports/RRRR-MM-DD-gpt.md` (małe litery; sufiks agenta zostaje w nazwie pliku dla spójności z historią, nawet gdy wykonawca jest jeden) i składa się z poniższych sekcji w tej kolejności. Sekcję 5 pomijamy tylko wtedy, gdy nie ma treści. Raport jest dokumentem niezmiennym: opisuje wyłącznie stan sprzed meczów i po publikacji nie wolno go edytować. Rozliczenia wyników nie trafiają do raportów — jedynym miejscem rozliczeń jest data/bets.json (księga główna), a ich widokiem dashboard. Wartości liczbowe: kursy z dwoma miejscami po przecinku, value z jednym, probability z czterema. W tabeli sekcji 1 korekty (`fresh_adj`, `roster_adj`) można pokazać z jednym miejscem po przecinku, ale **w sekcji 2 i w JSON zawsze z czterema** — `fresh_adjustment_pp`, `total_adjustment_pp`, `p_market`, `p_v2`, `fresh_map_score_*`, `fresh_diff` (METHOD_V2 §13: każdy krok liczony z zapisanej, zaokrąglonej wartości poprzedniego).

**Format Value i Ryzyko (wymagany, nie tylko przykładowy — dashboard koloruje po tym wzorcu):**
- `Value` zawsze ze znakiem, nawet przy zerze: `+5.6%`, `-4.1%`, `+0.0%`. Bez znaku dashboard nie rozpozna, czy kolorować na zielono czy czerwono.
- `Ryzyko` wyłącznie jedną z wartości: `Niskie`, `Średnie`, `Wysokie`, `Średnio-wysokie`, `Bardzo wysokie` (dowolna wielkość liter). Inne sformułowanie (np. "Umiarkowane", "High") nie zostanie pokolorowane.

---

# Edge Daily Report — RRRR-MM-DD

**Agent:** gpt (v2 primary analyst — patrz METHOD_V2 §21)
**Godzina analizy:** HH:MM
**Źródło kalendarza:** (np. wyszukiwanie web + weryfikacja w ofercie STS)
**Źródło kursów:** kursy STS podane przez użytkownika o HH:MM

## 1. Mecze dnia

Jedna tabela z meczami po pełnej analizie — kolumny jak niżej, decyzja wyłącznie **BET** albo **PASS**, stawka w jednostkach (u) przy BET, myślnik przy PASS. `p_market` to de-vigowane prawdopodobieństwo picku (METHOD_V2 §5), `fresh_adj` i `roster_adj` to korekty w punktach procentowych zastosowane do `p_market`, żeby dostać `p_v2` (§11) — obie widoczne osobno, nie tylko jako suma, żeby dało się zobaczyć skąd wzięła się decyzja bez czytania sekcji 2.

| Godz. | Mecz | Gram na | Kurs STS | p_market | fresh_adj | roster_adj | p_v2 | Fair | Value | Ryzyko | Decyzja | Pewność | Stawka |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---:|
| 12:30 | A vs B | B ML | 2.04 / 1.70 | 54.5% | +1.5pp | 0pp | 56.0% | 1.78 | -4.5% | Średnie | **PASS** | 5 | — |
| 14:00 | G vs H | G ML | 2.60 / 1.48 | 36.3% | +3.0pp | +2pp | 41.3% | 2.42 | +7.4% | Średnie | **PASS** | 6 | — |

**Gram na (pick):** strona z wyższym value (value drugiej strony liczone z `1 − p_v2` i jej kursu). Przy remisie co do 0.1 pp — strona, w którą idzie `total_adjustment_pp`; przy zerowej korekcie — faworyt rynku (METHOD_V2 §13). Zwykle wychodzi strona, w którą idzie korekta, ale nie zawsze — sprawdź obie.

Kolumna „Kurs STS": oba kursy w kolejności zgodnej z nazwą meczu — pierwsza liczba to kurs drużyny wymienionej jako pierwsza, druga to kurs drugiej (np. „A vs B" → „kurs A / kurs B"). Dzięki temu para kursów czyta się w tym samym porządku co nazwa meczu, a zestawienie z kolumną „Gram na" od razu pokazuje, czy pick jest faworytem rynku (niższy kurs) czy underdogiem.

Pod tabelą krótka lista meczów odsianych na filtrze (bez wyceny) — jedna linia na mecz, z powodem:

**Poza analizą:** 16:00 C vs D (CCT EU) — tier 3, akademia · 10:00 E vs F — poza ofertą STS

## 2. Analizy

Jeden blok na każdy mecz z decyzją BET lub PASS (odrzuconych nie analizujemy). Zamiast narracji — jawne wyliczenie kroków METHOD_V2, w tej kolejności:

### A vs B

**Kursy STS:** A 2.04 / B 1.70 → `p_market` B = 58.8% (marża X.X%)

**Okno formy — B:** N serii / M map w oknie 30 dni (min. 3 serii / 6 map dla pełnej korekty), pokrycie wyników rundowych X% (round_diff / map_result_fallback), FreshMapScore = X.XX
**Okno formy — A:** analogicznie, FreshMapScore = X.XX

`FreshDiff` = FreshMapScore(B) − FreshMapScore(A) = X.XX → `fresh_adjustment_pp` = clamp(0.5 × FreshDiff, −4, +4) = +X.X pp

**Roster:** stand-in / potwierdzona nieobecność podstawowego gracza po stronie ___ → `roster_penalty` = −2pp / 0pp po każdej stronie. Reset okna / waga 50% jeśli dotyczy (METHOD_V2 §10).

`p_v2` = round(clamp(p_market + total_adjustment_pp/100, p_market − 0.05, p_market + 0.05), 4) = **0.XXXX** → fair = round(1/p_v2, 2) = **1.61** → value = kurs/fair − 1

Value drugiej strony: fair = round(1/(1 − p_v2), 2), value = kurs drugiej strony/fair − 1. Pick = wyższe z dwóch.

`data_quality`: braki, jeśli są (np. brak rankingu przeciwnika, poniżej progu 2 serii/4 map → `fresh_adjustment_pp = 0`).

**Decyzja:** BET / PASS. BET wymaga value ≥ +8% **i** kompletnego snapshotu **i** wystarczającej jakości okna formy **i** braku ostrzeżenia `data_quality` (METHOD_V2 §13). Jednozdaniowy powód, jeśli decyzja nie wynika wprost z samego value.

## 3. Podsumowanie dnia

**X BET / Y PASS.** Jedno–trzy zdania: co było najbliżej zakładu i dlaczego ostatecznie tak, a nie inaczej. Dzień bez kwalifikujących się meczów opisujemy jako „NO QUALIFYING MATCHES" — to pełnoprawny wynik.

## 4. Wpisy do dziennika (Calibration & CLV Protocol)

Blok JSON ze wszystkimi wpisami z sekcji 2 (BET **i** PASS), z pełnym zestawem pól METHOD_V2 §16:

```text
id, date, report, game, match, market, pick,
market_odds_at_analysis, market_odds_opponent, odds_timestamp,
p_market,
fresh_input_pick, fresh_input_opponent,
fresh_map_score_pick, fresh_map_score_opponent, fresh_diff,
fresh_adjustment_pp, roster_penalty_pick, roster_penalty_opponent, total_adjustment_pp,
p_v2, estimated_probability, fair_odds, value_pct, decision, confidence,
closing_odds, closing_odds_opponent,
result, data_quality,
agent, method_version: "v2"
```

Zasady:

- `id`: `P-RRRR-MM-DD-G1`, `G2`, ... — numeracja per dzień (jedna kanoniczna predykcja na mecz, więc bez sufiksu C/G rozróżniającego agenta)
- `agent: "gpt"` — pole obowiązkowe, nawet gdy jest jeden wykonawca (schemat zostaje spójny z historią v1)
- `report`: ścieżka z sufiksem agenta, np. `"reports/2026-07-20-gpt.md"`
- `method_version: "v2"` — bumpuje się tylko przy zmianie parametrów wyceny z METHOD_V2 §23, nigdy z inicjatywy raportu. Zmiana protokołu oceny (E1 → E2) nie zmienia `method_version`
- `odds_timestamp`: faktyczny czas odczytu kursów, nie czas raportu ani wartość okrągła z założenia
- Kurs picku w momencie analizy: klucz **`market_odds_at_analysis`** — nazwa kanoniczna, nie `market_odds`. `dashboard/shared-metrics.js` filtruje po dokładnie tej nazwie; inna nazwa = ciche pominięcie wpisu bez błędu (precedens: P-2026-09-13-C1 pod v1).
- `p_v2` = `round(clamp(p_market + total_adjustment_pp/100, p_market − 0.05, p_market + 0.05), 4)` — to jest prawdopodobieństwo metody, na nim liczone są wszystkie metryki. `estimated_probability` = `round(1 / fair_odds, 4)` zostaje tylko do wyświetlania i zgodności (różni się od `p_v2` o zaokrąglenie fair, do ~0.3 pp przy krótkich faworytach), `market_odds_opponent` obowiązkowe, `closing_odds` i `closing_odds_opponent` oba `null` przy utworzeniu (albo oba wypełnione — nigdy tylko jedno), `result: "pending"`
- `fresh_input_pick` / `fresh_input_opponent`: `"round_diff"` albo `"map_result_fallback"` (reguła pokrycia 80%, METHOD_V2 §9.2)
- `data_quality`: tablica nazwanych braków (np. `["missing_opponent_ranking"]`), pusta tablica jeśli brak braków — nigdy pomijane pole
- Meczów odrzuconych na filtrze NIE logujemy

Agenci nie modyfikują `data/bets.json` bezpośrednio — plik ma jednego opiekuna, który scala, waliduje i commituje wpisy z raportów.

## 5. Zadania otwarte

Krótka lista rzeczy wiszących: predykcje czekające na rozliczenie w bets.json (sama lista ID, bez wyników), niespójności do wyjaśnienia. **Kurs zamknięcia po obu stronach, przy każdym meczu** (nie tylko BET-ach) — jedyna zmiana w rutynie operatora przy v2 (METHOD_V2 §17); zaznacz priorytet, jeśli operator nie zdąży złapać wszystkich: **najpierw mecze z największym |`total_adjustment_pp`|** (METHOD_V2 §17; best-effort, patrz `docs/decisions/2026-09-23-v2-freeze.md`).

---

## Zasady ogólne

- gpt pisze raport dzienny i liczy `p_v2` mechanicznie z METHOD_V2 — bez osądu, bez odchyleń poza wzorem. claude audytuje okresowo (nie codziennie) i publikuje ustalenia audytu jako osobny dokument, nie jako poprawkę tego raportu.
- Wszystkie reguły decyzyjne (progi value, parametry okna formy, kryteria tier) muszą mieć źródło w `docs/METHOD_V2.md` (probability) albo `docs/PLAYBOOK.md` (scope, staking, proces) — raport może się na nie powoływać, ale nie może ich tworzyć ani zmieniać.
- Braki danych zapisujemy jako braki (`data_quality`, „STS nie oferuje", „brak odczytu"), nigdy jako wartości założone.
