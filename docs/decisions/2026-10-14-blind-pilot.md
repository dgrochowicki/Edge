# Edge — decyzja/protokół proponowany: Blind-first Pilot v0

**Data opracowania:** 2026-10-14  
**Status:** **DRAFT / DO AUDYTU CLAUDE I AKCEPTACJI OPERATORA PRZED PIERWSZĄ LICZONĄ PROGNOZĄ**  
**Proponowany start:** 2026-10-15, Thunderpick World Championship 2026, pierwsze nowe pary z fazy grupowej po zatwierdzeniu protokołu  
**Identyfikator eksperymentu:** `blind_pilot_v0`  
**Dokumenty nadrzędne:** `docs/ROADMAP.md` → „Priority research proposal — independent blind-first pricing”, `docs/PLAYBOOK.md`, `docs/METHOD_V2.md`, `docs/REPORT_TEMPLATE.md`, `docs/decisions/2026-10-11-v2-ocena-e2.md`.

> **Decyzja do zatwierdzenia:** zbadamy, czy wycena meczu przygotowana i zablokowana **przed poznaniem kursów dla danego spotkania** wykrywa użyteczne odchylenia od cen STS. To oddzielny eksperyment *paper-only*, nie modyfikacja ani zastąpienie frozen V2. Ten plik jest kompletną propozycją operacyjną, nie potwierdzeniem, że eksperyment już wystartował.

## 1. Cel i rozdzielenie metod

- **V2 / E2** pozostaje aktywna i zamrożona: market prior STS → fresh-form i roster → `p_v2`; dotychczasowy raport `reports/YYYY-MM-DD-gpt.md`, cache `data/form/YYYY-MM-DD.json`, jedna kanoniczna predykcja i ledger `data/bets.json` pozostają bez zmian.
- **Blind-first** rozpoczyna od **danych sportowych bez cen**; przed odczytem STS zapisuje niezależne `p_A`, `p_B`, fair i uzasadnienie. Po ujawnieniu kursów liczy różnicę między modelem i rynkiem, ale nie zmienia zamkniętej prognozy.
- Dotychczasowe cztery mecze Thunderpick z **2026-10-14** są wykluczone z pilotażu, ponieważ kursy już były widziane. V1, V2 i blind mają **oddzielne próbki**; identyfikator `blind_pilot_v0` **nigdy** nie występuje w ledgerze jako `method_version: "v2"`.
- Pilot testuje sens i audytowalność nowej wyceny, a **nie** jej rentowność. Żadnych rekomendacji za realne pieniądze, zmian stawek ani przekładania progu V2 na blind.

## 2. Zakres i zasada kolejności

1. **Przed analizą** rejestrujemy wszystkie przyszłe kwalifikujące się mecze CS2 tier-1 / Valve Tier 1 z danego dnia — bez wybierania tylko „ciekawych” spotkań. Obecność Thunderpick 2026 w zakresie została zatwierdzona przez operatora 2026-10-14 jako wyjątek od listy wykluczeń w `PLAYBOOK.md`; osobne ujednolicenie tekstu PLAYBOOK należy do opiekuna repo.
2. Analiza obejmuje **wyłącznie pre-match moneyline** i poprawnie potwierdzony format BO3/BO5. Każdy mecz dostaje jeden wiersz/rekord, także przy braku wystarczających danych (z flagami jakości).
3. **Faza A — bez kursów.** Analityk może widzieć terminarz, składy, ranking HLTV, faktyczne wyniki map i rund, daty zmian rosterowych. Nie może widzieć kursów STS, innych bukmacherów, konsensusów prognostycznych, implied probabilities, wskazań „odds/prediction”, porównań linii lub bieżących spreadów. Nie korzysta z fragmentów wyszukiwania zawierających ceny.
4. **Faza B — lock.** Użytkownik dostaje plik prognozy z obydwoma prawdopodobieństwami, wyliczonymi fair, źródłami, znacznikami czasu i SHA-256; zapisuje go (optymalnie commituje) **przed ujawnieniem kursów**. Po zablokowaniu nie wolno edytować prognozy, także jeśli wyjdzie nieobecność zawodnika. Późniejszą poprawkę opisujemy tylko jako dodatkowy, osobno datowany komentarz QA, nie jako nowe `p` liczone do próby.
5. **Faza C — reveal.** Dopiero po locku operator podaje bieżącą **parę** kursów STS oraz faktyczny czas odczytu. Liczymy de-vig rynku i value obu stron; zamknięte `p_A`, `p_B` pozostają niezmienne. W razie niedostępności STS nie zastępujemy go kursem z innego serwisu.
6. **Faza D — monitoring.** Zbieramy closing po obu stronach przed startem, gdy jest dostępny; po meczu uzupełniamy wynik. Brak closingów zostaje `null`; nie rekonstruujemy ich po wyniku.

**Niezależność:** oddzielny, „bezcenowy” chat/workflow do Fazy A; chat do kursów i V2 jest oddzielny. Sam nowy chat nie gwarantuje braku wiedzy o wcześniejszych cenach. Jeżeli analityk znał **kurs konkretnej przyszłej pary** przed lockiem, oznaczamy `blindness_compromised` i **wykluczamy** z głównej próby. Wcześniejszą ekspozycję na kursy *tych samych drużyn w innych meczach* zapisujemy osobno jako `prior_team_price_exposure`; nie przedstawiamy tego jako idealnie ślepego eksperymentu. Źródła użyte przez analityka nie mogą zawierać cen nowej pary.

## 3. Proponowany estimator v0 — jawny, powtarzalny i bez kursów

**Istotne:** poniższe współczynniki to *przedrejestracja heurystyki, nie wyuczona kalibracja*. Claude ma ocenić je **przed pierwszym lockiem**; jeśli zostaną zmienione, zmiana następuje przed startem, a nie po obejrzeniu kursów lub rezultatów. Model świadomie prosty, by dało się go audytować; jego potencjalnie słaba kalibracja jest przedmiotem testu.

### 3.1. Siła z publicznego rankingu — bez VRS i bez cen

- Używamy ostatniego rankingu **HLTV opublikowanego przed datą/czasem locku**. Rankingi są wskaźnikiem formy sportowej, **nie ceną**. Zapisujemy datę i źródło.
- Punkty: miejsca **1–5 → 4**, **6–10 → 3**, **11–20 → 2**, **21–30 → 1**, **31+ → 0**.
- Brak wiarygodnego rankingu: `rank_score = 2` (neutralny zastępnik), flaga `missing_team_rank` i zakaz `PAPER_CANDIDATE` dla tej pary.

### 3.2. Fresh form — dane meczowe, nie rynek

- Reużywamy **wyłącznie surowe mapy** i reguły selekcji historycznych danych z `METHOD_V2.md` §6–10: obecny core, maks. 30 dni, 8 serii / 20 map, tier-1, recency `0.5 ** (days_ago/14)`, historyczny band rankingu przeciwnika / waga `1.2, 1.1, 1.0, 0.9, 0.8`, round differential na mapie przycięty do `[-8,8]`, reset/przedzmianowe mapy z wagą 0.5 według roster rules. **Nigdy nie przenosimy z V2 `p_market`, `p_v2`, value ani kursów.** Historyczny `data/form/` wolno użyć jako udokumentowanego źródła wyników, ale okno należy przeliczyć na dzień nowej prognozy i sprawdzić uzupełnienia.
- `FreshMapScore` to ważona średnia różnicy rundowej (`sum(capped_round_diff * total_weight) / sum(total_weight)`, 4 miejsca).
- Jeśli **którykolwiek** z zespołów ma mniej niż 2 serie / 4 mapy tier-1 w oknie albo poniżej 80% map z wynikami rund, **dla obu zespołów ustawiamy `form_component = 0`**, zapisujemy obydwa okna oraz flagę `insufficient_comparable_form`. Nie mieszamy skal round differential z fallback map-result w tej eksperymentalnej formule.
- Jeżeli oba okna są użyteczne, obliczamy `form_diff = round(FreshMapScore_A - FreshMapScore_B, 4)`. Jeśli przynajmniej jedna strona ma mniej niż 3 serie / 6 map, współczynnik próbki = **0.5**, inaczej **1.0**.

### 3.3. Skład i inne fakty

- Potwierdzony stand-in / absencja startera: binarna zmienna `standin_A/B = 1`, inaczej `0`. Nie potwierdzamy absencji na podstawie pogłoski; nierozstrzygnięty roster → `uncertain_roster`, wówczas bez `PAPER_CANDIDATE`.
- Zmiana IGL / AWP i częściowe zmiany składu już działają na selekcję historycznego okna; bez dodatkowej arbitralnej kary.
- **Veto, pool map, LAN oraz BO format** zawsze analizujemy opisowo i zapisujemy jako czynniki ryzyka. W pilocie v0 **nie mają osobnych, uznaniowych korekt punktowych**, żeby analityk nie mógł dopasować prognozy do reputacji czy wcześniej widzianych kursów. Jeśli po locku pojawi się veto, jest to nowa informacja — komentarz QA, bez przeliczenia pierwotnej wyceny.

### 3.4. Jedyny wzór prawdopodobieństwa dla obu stron

```python
rank_delta = rank_score_A - rank_score_B
if form_is_comparable:
    form_delta = max(-8.0, min(8.0, form_diff))
    form_multiplier = 0.5 if sample_small else 1.0
else:
    form_delta = 0.0
    form_multiplier = 0.0

p_A = round(max(0.15, min(0.85,
    0.50
    + 0.05 * rank_delta
    + 0.0125 * form_delta * form_multiplier
    + 0.03 * (standin_B - standin_A)
)), 4)
p_B = round(1 - p_A, 4)
fair_A = round(1 / p_A, 2)
fair_B = round(1 / p_B, 2)
```

- Zawsze przechowujemy `p_A/p_B` do 4 miejsc oraz ich składniki (`rank_delta`, `form_diff`, `form_multiplier`, `roster_delta`), a fair do 2 miejsc. Wszystkie liczby wejściowe z cache wyliczamy z precyzją wynikającą z reguł wag, a score zaokrąglamy do 4 miejsc przed użyciem we wzorze.
- **Nie ma żadnego wejścia zależnego od kursu**, ani dopasowania po jego zobaczeniu. Ranking to statystyczny proxy siły, nie cena; jego przydatność i ewentualne błędy też oceniamy na pilocie.
- Przedział niepewności (heurystyczny, nie 95% CI): przy kompletnym rankingu i porównywalnej formie `p_A ± 0.07` (przycięty do 0–1), przy brakach/niepewnym rosterze `p_A ± 0.12`. Dla B jest symetrycznie. Nie opisujemy tego jako statystycznie skalibrowanego przedziału.

## 4. Obliczenia wyłącznie po odsłonięciu STS

Dla kursów `odds_A`, `odds_B` zapisanych o `odds_timestamp`:

```text
p_market_A = (1/odds_A) / ((1/odds_A) + (1/odds_B))
p_market_B = 1 - p_market_A
value_A_pct = 100 * (odds_A * p_A - 1)
value_B_pct = 100 * (odds_B * p_B - 1)
gap_A_pp = 100 * (p_A - p_market_A)
gap_B_pp = -gap_A_pp
```

Wybieramy opisowo stronę z większym `value_pct` (przy remisie: `NO_SIGNAL`, bez sztucznego picku). Wartości procentowe pokazujemy do 1 miejsca, probabilities do 4, a kursy do 2. **W pilocie nie ma decyzji `BET` za realne pieniądze.** Oznaczenie badawcze:

- `PAPER_CANDIDATE` — **value ≥ +10%** po stronie wybranego picku, oba kursy i snapshot ważne, brak ostrzeżeń o jakości, brak ekspozycji na kurs konkretnej pary przed lockiem. Próg +10% jest ostrożną, z góry ustaloną *flagą do badania*, nie udowodnioną granicą opłacalności i nie regułą V2.
- `WATCH` — dodatnie value, ale nie spełniono warunków `PAPER_CANDIDATE`.
- `NO_SIGNAL` — obie strony mają niedodatnie value lub brak wiarygodnych kursów (przy braku ceny dodatkowo `market_data_missing`; value pozostaje `null`).

Rzeczywistej skuteczności nie utożsamiamy z liczbą kandydatów.

## 5. Pliki, niezmienność, odpowiedzialności

**Etap przed reveal (powstaje i zostaje zablokowany pierwszy):**

- `research/blind/YYYY-MM-DD-blind.md` — pełny raport blind, wszystkie pary, uzasadnienia, surowe dane i wyliczenia; bez kursów ani p_market.
- `data/blind/locks/YYYY-MM-DD.json` — ustrukturyzowane rekordy źródłowe prognoz i kroków estymatora; również **bez kursów**. Hash SHA-256 liczony z tego pliku; wpisujemy go w wiadomości z przekazaniem plików i — jeśli można — w commicie/operator logu przed reveal.

**Etap po reveal (nowy plik; nie edytuje wcześniej zablokowanych):**

- `data/blind/reveals/YYYY-MM-DD.json` — aktualne kursy STS, timestamps, p_market, gap, value, `PAPER_CANDIDATE/WATCH/NO_SIGNAL`, ewentualne closings/wynik aktualizowane oddzielnym workflow. Rozliczenia/closingi mogą wymagać kolejnych append-only rekordów z timestampem; nie ruszamy oryginalnego locku.
- Ewentualne `reports/YYYY-MM-DD-gpt.md`, `data/form/YYYY-MM-DD.json` i dane `data/bets.json` pozostają własnością standardowego workflow **V2**. Zakaz zastępowania pliku V2 raportem blind, jak również odwrotnie.

**Proponowane minimalne pola locku (na mecz):** `experiment_id`, `fixture_id`, `event`, `date`, `start_time_cest`, `format`, `team_A`, `team_B`, `analyst`, `forecast_timestamp`, `data_cutoff`, `roster_A/B`, `rank_A/B`, `rank_source_date`, `rank_score_A/B`, `rank_delta`, `form_window_ref_A/B`, `fresh_score_A/B`, `form_diff`, `form_multiplier`, `standin_A/B`, `p_A`, `p_B`, `fair_A`, `fair_B`, `uncertainty_low/high_A/B`, `sources`, `data_quality`, `odds_seen_before_lock`, `prior_team_price_exposure`.

**Proponowane minimalne pola reveal:** `experiment_id`, `fixture_id`, `lock_sha256`, `odds_A`, `odds_B`, `odds_timestamp`, `p_market_A/B`, `value_A/B_pct`, `gap_A/B_pp`, `paper_signal`, `closing_odds_A/B`, `result`, `revealed_at`, `exclusion_reason` (jeżeli dotyczy).

**Ważna techniczna zasada:** nie wpisujemy do oryginalnego JSON własnego hasha, bo zmieniłoby to zawartość i hash. Hash blokady trzymamy w protokole przekazania/reveal.

## 6. Próba, metryki i punkt kontrolny

- **Populacja:** pierwsze **40 kolejnych** kwalifikujących się spotkań po akceptacji protokołu, rejestrowane *przed* odczytem kursów. Obejmujemy również słabe próbki, tylko opisujemy braki. Jeśli startujemy 15.10, pierwsze cztery mecze to nowe pary wyłonione z pierwszego dnia Thunderpick — do potwierdzenia po wynikach. 40 to pilotaż procesu, nie wystarczający test zysku.
- **Próba główna:** spotkania z ważnym lockiem przed znajomością kursu **tej pary** oraz prawidłowo zapisanymi `p_A/B`; wyniki z `blindness_compromised`, lockiem po starcie lub po poznaniu wyniku są wyłączone z głównej próby, ale wymienione w rejestrze. Do *porównania z STS* potrzebne oba kursy z czasu pre-match. Dane z brakami formy/rosteru pozostają w ocenie predykcji, z rozbiciem wyników po jakości.
- **Metryka główna:** paired Brier advantage `Brier_market - Brier_blind` na **dokładnie tych samych** spotkaniach z wynikami i snapshotami obu kursów. Prawdopodobieństwo V0 bierze się z zamkniętego `p_A`, rynek z de-vig obu kursów; `+` oznacza lepszą średnią blind, `−` lepszy rynek.
- **Drugorzędne:** paired log loss (obie prognozy i jeden wynik), kalibracja na grupach prawdopodobieństw, rozkład `|gap_pp|`, liczba `PAPER_CANDIDATE`, hipotetyczne ROI/CLV tych selekcji, pokrycie closingów i braki. Raportujemy 95% CI przez bootstrap **10 000 losowań par meczów**, stałe ziarno RNG `20261014`, jako analizę eksploracyjną; bez dobierania metryk po obejrzeniu rezultatów.
- **Audyt procesu po 5–10 lockach:** Claude weryfikuje ekspozycję na ceny, czas, źródła, zgodność arytmetyki i niezmienność zapisów. Błąd metodologiczny skutkuje oznaczeniem/usunięciem z *próby głównej* na podstawie jawnej reguły, nigdy retroaktywnym poprawianiem `p`.
- **Review po 40 meczach:** raportujemy wszystkie wyniki niezależnie od ich znaku. Operacyjny minimalny standard: ≥90% planowanych kwalifikujących się meczów z poprawnym lockiem oraz ≥80% par kursów STS do porównania. Jeśli niespełniony — pilotaż nieważny/niekonkluzywny jakościowo, należy naprawić proces i zacząć **nową** próbę. Jeśli spełniony, ale przewaga Brier ≤0 albo rozbieżności z rynkiem są duże przy gorszym log loss — brak podstaw do dalszego promowania obecnej heurystyki. Jeśli Brier >0 i metryki wtórne nie wskazują oczywistej szkody — można rozważyć **osobny, większy test out-of-sample**, bez twierdzenia, że przewaga została udowodniona. W każdym scenariuszu **brak automatycznego przejścia na prawdziwe BET-y**.
- Żaden nowy eksperyment nie przejmuje checkpointów E2 `K1=100/K2=200` ani oceny β z V2. Dodatni wynik przy n=40 nie „waliduje” strategii.

## 7. Jutrzejsza procedura (15.10.2026, Europe/Warsaw)

1. Dziś: operator przekazuje ten DRAFT Claude do audytu i zatwierdza ostateczną treść przed startem. Przy poprawkach współczynników/progów konieczna nowa wersja dokumentu **przed** pierwszą prognozą; nie po ujawnieniu kursów.
2. Po zakończeniu meczów 14.10: ustalamy jutro komplet par i godziny. Grupy GSL: spotkania zwycięzców oraz eliminacyjne, wszystkie BO3. Nie wpisujemy nieznanych par z wyprzedzeniem.
3. **Rano najpierw Blind Phase A:** w osobnym czacie użytkownik prosi: „Edge blind-first: 15.10.2026; żadnych kursów, przygotuj i zablokuj blind report + locks JSON według zatwierdzonego protokołu”. Nie podaje cen STS w tej wiadomości ani tym czacie przed lockiem. Asystent nie korzysta z prognoz/cen V2 dla jutrzejszych par.
4. Dostarczenie obu rzeczywistych plików i ich hashów przed spotkaniami. Operator zapisuje/commituje je przed odsłonięciem STS.
5. **Dopiero teraz** operator podaje pary kursów STS wraz z godziną odczytu. Tworzymy `reveals` i podsumowanie z value / flagami badawczymi. Bez przeliczenia blind `p_A/B`.
6. Niezależnie może później zostać wykonany standardowy raport frozen V2 z tych samych STS — jego zapis nie jest prognozą blind. **Obecna automatyzacja 08:00 nie jest tym dokumentem zmieniana**, ale operator nie powinien podawać kursów ani publikować wycen jutrzejszych par w kontekście eksperymentu, zanim blind lock nie będzie gotowy. Jeśli system ujawni ceny przed lockiem, daną parę oznaczamy `blindness_compromised` zamiast udawać pełną niezależność.

**Kolejność jest ważniejsza niż godzina.** Jeśli nie uda się bezpiecznie zablokować prognozy przed meczem i przed ujawnieniem kursów, pomijamy dany mecz z podaniem powodu; **nie backfillujemy blind-prognoz**.

## 8. Checklista aprobaty i kryterium startu

- [ ] **Claude (audyt):** czy model v0 i każda jego stała są jednoznaczne, audytowalne i wolne od kursów? Czy scoring, próba i rozdzielenie plików są spójne z repo?
- [ ] **Operator:** akceptuje estimator, flagi papierowe, próbę 40 i zakaz realnych BET w pilocie.
- [ ] **Przed pierwszą prognozą:** dokument w repo z zatwierdzonym statusem, osobny chat bezcenowy, możliwy lock plików i hash.
- [ ] **Repo agent:** potwierdza, że `data/blind/*` nie miesza się z `data/bets.json`, V2 metrics ani dashboardem.

**Brak jednej aprobaty = można przeprowadzić demonstrację procesu, ale nie zalicza się jej do oficjalnej próby `blind_pilot_v0`.**

---

**Podsumowanie decyzji do zatwierdzenia:** od następnej, jeszcze nierozpoczętej fazy Thunderpick uruchamiamy **równoległą, odseparowaną, papierową próbę blind-first**; każda prognoza jest liczona i blokowana przed STS; dzienny raport V2 pozostaje bez zmian. Pierwsze dane zbieramy od 15.10 **tylko po akceptacji protokołu i przy zachowanej kolejności lock → reveal**.
