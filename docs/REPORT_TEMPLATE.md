# Edge Daily Report Template

Current version: v3.0 (2026-10-19)
Status: obowiązuje od pierwszego raportu turnieju po Thunderpick World Championship 2026 (`docs/decisions/2026-10-19-v3-trzy-zrodla.md`)

Zmiana w v3.0: nowy, drugi tor oceny obok v2 — **v3: własna ocena → konsensus rynku → STS**. v2 liczy się dalej równolegle, mechanicznie, bez zmian w wycenie; v3 nie zastępuje v2, dochodzi obok niego jako osobny wpis w księdze (`method_version: "v3"`). Kolejność pracy w raporcie **musi** odzwierciedlać kolejność decyzji: najpierw własna ocena bez żadnego kursu, potem konsensus innych bukmacherów, dopiero na końcu STS. Sekcja własnej oceny nie jest poprawiana po zobaczeniu konsensusu czy STS — błąd znaleziony później idzie do erraty, nie do przepisania sekcji 1.

Zmiana w v2.1 (decyzja `docs/decisions/2026-10-11-v2-ocena-e2.md`): pole `p_v2` w JSON i w tabeli, reguła wyboru picku (strona z wyższym value), stała precyzja 4 miejsc dla prawdopodobieństw i korekt. Wycena v2 bez zmian.

Zmiana w v2.0: szablon przechodzi na jedną kanoniczną wycenę na mecz zamiast dwóch niezależnych ocen (claude, gpt). Powód: METHOD_V2 §21 — dwóch wykonawców liczących ten sam deterministyczny wzór to nie dwie niezależne obserwacje, próbka rośnie o jeden wpis na mecz, nie o dwa. **gpt jest głównym analitykiem dziennym** i pisze ten raport (obie metody, v3 i v2); **claude jest okresowym audytorem** (co turniej albo co 20–30 predykcji), nie pisze równoległego raportu dziennego. Poprzednia wersja (v1.7, dwie niezależne wyceny) jest zarchiwizowana wraz z metodą w `docs/archive/METHOD_V1.md`.

Każdy raport dzienny ma nazwę `reports/RRRR-MM-DD-gpt.md` (małe litery; sufiks agenta zostaje w nazwie pliku dla spójności z historią, nawet gdy wykonawca jest jeden) i składa się z poniższych sekcji w tej kolejności. Sekcję 6 pomijamy tylko wtedy, gdy nie ma treści. Raport jest dokumentem niezmiennym: opisuje wyłącznie stan sprzed meczów i po publikacji nie wolno go edytować. Rozliczenia wyników nie trafiają do raportów — jedynym miejscem rozliczeń jest data/bets.json (księga główna), a ich widokiem dashboard. Wartości liczbowe: kursy z dwoma miejscami po przecinku, prawdopodobieństwa (`p_own`, `p_cons`, `p_market`, `p_v2`) z czterema, value i gap z jednym.

**Format Value i Ryzyko (wymagany, nie tylko przykładowy — dashboard koloruje po tym wzorcu):**
- `Value` zawsze ze znakiem, nawet przy zerze: `+5.6%`, `-4.1%`, `+0.0%`. Bez znaku dashboard nie rozpozna, czy kolorować na zielono czy czerwono.
- `Ryzyko` wyłącznie jedną z wartości: `Niskie`, `Średnie`, `Wysokie`, `Średnio-wysokie`, `Bardzo wysokie` (dowolna wielkość liter). Inne sformułowanie (np. "Umiarkowane", "High") nie zostanie pokolorowane.

---

# Edge Daily Report — RRRR-MM-DD

**Agent:** gpt (v3 + v2 primary analyst — METHOD_V2 §21, decyzja v3 2026-10-19)
**Godzina zapisu własnej oceny:** HH:MM (przed jakimkolwiek kursem)
**Godzina konsensusu:** HH:MM
**Godzina kursów STS:** HH:MM, podane przez operatora
**Źródło kalendarza:** (np. wyszukiwanie web + weryfikacja w ofercie STS)

## 1. Ocena własna (p_own) — przed jakimkolwiek kursem

Pisana **zanim** otworzy się jakąkolwiek stronę z kursami (w tym tabelę kursów na stronie meczu HLTV) i zanim poprosi się operatora o STS. Jeśli podczas researchu (ranking, mapy, skład) przypadkiem pokazał się kurs, typ lub procent z sondażu dla tego meczu — flaga `odds_seen_before_own`, `p_own` nie może być podstawą BET.

Jeden blok na mecz, tabela czynników:

| Czynnik | Która strona / ile pp | Uzasadnienie (jedno zdanie) |
|---|---|---|
| Siła ogólna (główny składnik) | | ranking HLTV, poziom drużyn |
| Mapy (do ±8pp) | | map pool obu drużyn wobec prawdopodobnego veto |
| Forma (do ±6pp) | | ostatnie 30 dni, `FreshMapScore` z `data/form/` jako punkt wyjścia |
| Skład (do ±8pp) | | zmiany, stand-in, powroty, nieobecności |
| Kontekst (do ±4pp) | | BO1/BO3/BO5, LAN/online, stawka meczu, drugi mecz w dniu |

`p_own` (0.10–0.90), `p_own_opponent` = 1 − `p_own`, `own_timestamp`. Źródła z pełnymi URL.

## 2. Konsensus rynku (p_cons) — bez STS

Po zapisaniu `p_own`. Źródło: tabela kursów na stronie meczu HLTV (albo inne publiczne zestawienie, jeśli HLTV jej nie pokazuje) — **nigdy STS**. Minimum **3 bukmacherów**; dla każdego de-vig z obu kursów, `p_cons` = mediana de-vigów.

| Bukmacher | Kurs A | Kurs B | de-vig A |
|---|---:|---:|---:|
| ... | | | |

`p_cons`, `p_cons_opponent`, `cons_spread_pp` (max − min de-vig), `cons_timestamp`. Mniej niż 3 bukmacherów → `p_cons = null`, flaga `consensus_missing`, brak BET.

## 3. STS i decyzja v3

Operator podaje kursy STS z godziną odczytu. Odczyt konsensusu i odczyt STS nie mogą być oddalone o więcej niż **3 godziny** — inaczej flaga `stale_consensus`, brak BET.

```text
p_sts (de-vig STS)
value_cons_X = kurs_STS_X × p_cons_X − 1
value_own_X  = kurs_STS_X × p_own_X  − 1
gap_own_X    = p_own_X − p_cons_X   (pp)
```

**BET na stronę X**, jeśli wszystkie warunki: `value_cons_X ≥ +5.0%`; `p_own_X ≥ p_cons_X`; `p_cons` z ≥3 bukmacherów w oknie 3h; brak flag blokujących (`odds_seen_before_own`, `consensus_missing`, `stale_consensus`, `uncertain_roster`); przy kilku stronach spełniających warunki — wyższe `value_cons`. Inaczej **PASS**, z dodatkową etykietą opisową: `STS_OFF` (warunek 1 tak, warunek 2 nie) albo `OWN_DISAGREES` (`|gap_own| ≥ 8pp` bez warunku 1). Stawka BET: płaska **1u**, max 3 BET/dzień.

**Real czy papier — decyzja operatora na żywo, przy każdym BET osobno** (`docs/decisions/2026-10-19-v3-trzy-zrodla.md` §4). BET v3 jest rekomendacją, nie automatycznym zakładem. Jeśli operator faktycznie stawia, zakład idzie do `coupons` jak dotąd (`source: "user_bet"`), z notatką odwołującą się do `id` predykcji v3 (np. "Same prediction as P-RRRR-MM-DD-V2"). Ocena metody (§7 decyzji) zawsze liczy **wszystkie** BET v3 po kursie z analizy, postawione i niepostawione — wybór operatora nie zmienia wyniku metody, gra operatora jest raportowana osobno.

| Mecz | Gram na | `value_cons` | `value_own` | `gap_own` | Etykieta | Stawka |
|---|---|---:|---:|---:|---|---:|

## 4. v2 mechanicznie (skrócone)

v2 liczy się równolegle, niezależnie od v3, z tego samego odczytu STS i tego samego `data/form/`. Jedna tabela + wyliczenie na mecz, bez zmian względem v2.1:

| Godz. | Mecz | Gram na | Kurs STS | p_market | fresh_adj | roster_adj | p_v2 | Fair | Value | Ryzyko | Decyzja | Pewność | Stawka |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---:|

`p_market` = de-vig STS (METHOD_V2 §5). `fresh_adj`/`roster_adj` w pp, zastosowane do `p_market` → `p_v2` (§11). Pick = wyższe value (remis <0.1pp → kierunek korekty; korekta zerowa → faworyt rynku, §13). BET wymaga value ≥ +8% i kompletnego snapshotu i braku `data_quality` blokującego — w praktyce od zamrożenia v2 systematycznie PASS (mediana korekty ~0.5pp).

`data_quality`: braki, jeśli są. Meczów odrzuconych na filtrze NIE logujemy w żadnej z metod — pod tabelą sekcji 1 krótka lista odsianych, jedna linia na mecz, z powodem:

**Poza analizą:** 16:00 C vs D (CCT EU) — tier 3, akademia · 10:00 E vs F — poza ofertą STS

## 5. Wpisy do dziennika (Calibration & CLV Protocol)

**Dwa osobne bloki JSON — v3 i v2 — każdy mecz dostaje jeden wpis w każdym, jeśli przeszedł filtr zakresu.**

### 5.1 v3

```text
id, date, report, game, match, market, pick,
p_own, p_own_opponent, own_timestamp, own_sources,
p_cons, p_cons_opponent, cons_books, cons_spread_pp, cons_timestamp,
market_odds_at_analysis, market_odds_opponent, odds_timestamp,
p_sts, value_cons_pct, value_own_pct, gap_own_pp,
label, decision, stake_u,
closing_odds, closing_odds_opponent,
result, data_quality,
agent, method_version: "v3"
```

- `id`: `P-RRRR-MM-DD-V1`, `V2`, ... (prefiks `V`, odróżnia od `G` v2, numeracja per dzień)
- `label`: `BET` / `PASS` / `STS_OFF` / `OWN_DISAGREES`; `decision`: `BET` tylko gdy `label: "BET"`, inaczej `PASS`
- `cons_books`: lista obiektów `{bukmacher, odds_pick, odds_opponent}`, min. 3
- `own_sources`: lista pełnych URL użytych w ocenie własnej
- Reguły walidatora dla v3: `scripts/validate_bets.py` (sekcja v3). Dopóki ich nie ma dla nowego pola — ręczna kontrola operatora.

### 5.2 v2 (bez zmian względem v2.1)

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

Zasady (bez zmian): `id` = `P-RRRR-MM-DD-G1`, `G2`, ...; `agent: "gpt"` obowiązkowe; `method_version: "v2"` bumpuje się tylko przy zmianie parametrów wyceny METHOD_V2 §23; `odds_timestamp` to faktyczny czas odczytu, nie czas raportu; `market_odds_at_analysis` (nie `market_odds` — inna nazwa = ciche pominięcie wpisu); `p_v2` = `round(clamp(p_market + total_adjustment_pp/100, p_market ± 0.05), 4)`; `estimated_probability` = `round(1/fair_odds, 4)` tylko do wyświetlania; `closing_odds`/`closing_odds_opponent` oba `null` na starcie albo oba wypełnione; `fresh_input_*` = `"round_diff"` albo `"map_result_fallback"`; `data_quality` zawsze tablica, nigdy pomijane.

Agenci nie modyfikują `data/bets.json` bezpośrednio — plik ma jednego opiekuna, który scala, waliduje i commituje wpisy z raportów (oba bloki, v3 i v2).

## 6. Zadania otwarte

Krótka lista rzeczy wiszących: predykcje (v3 i v2) czekające na rozliczenie w bets.json (sama lista ID, bez wyników), niespójności do wyjaśnienia. **Kurs zamknięcia po obu stronach, przy każdym meczu** (obie metody) — jeśli operator nie zdąży złapać wszystkich: priorytet najpierw BET v3, potem mecze v2 z największym |`total_adjustment_pp`|.

---

## Zasady ogólne

- gpt pisze raport dzienny: najpierw v3 (własna ocena → konsensus → STS/decyzja), potem v2 mechanicznie. Kolejność sekcji w pliku to ślad kolejności pracy, nie tylko struktura dokumentu. claude audytuje okresowo (nie codziennie) i publikuje ustalenia audytu jako osobny dokument, nie jako poprawkę tego raportu.
- Wszystkie reguły decyzyjne v2 mają źródło w `docs/METHOD_V2.md`; reguły v3 w `docs/decisions/2026-10-19-v3-trzy-zrodla.md`; scope/staking/proces wspólne dla obu w `docs/PLAYBOOK.md`. Raport może się na nie powoływać, ale nie może ich tworzyć ani zmieniać.
- Braki danych zapisujemy jako braki (`data_quality`, „STS nie oferuje", „brak odczytu", `consensus_missing`, `stale_consensus`), nigdy jako wartości założone.
