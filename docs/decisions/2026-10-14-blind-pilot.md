# Edge — decyzja i protokół: Blind-first Pilot v0

**Data opracowania i decyzji operatora:** 2026-10-14  
**Status:** **ZAKOŃCZONY 2026-10-15, po dniu 1 — patrz sekcja 9.** Był zatwierdzony i uruchomiony 2026-10-14 (B1–B5 z audytu Claude), ale zamknięty następnego dnia po stwierdzeniu strukturalnej kontaminacji źródeł (50% par skażonych przez wyniki wyszukiwania). Treść sekcji 1–8 poniżej to historyczny zapis protokołu, nie aktywna instrukcja.  
**Planowany start:** 2026-10-15, kolejne nierozpoczęte spotkania Thunderpick World Championship 2026, tylko po spełnieniu warunków locku.  
**Identyfikator eksperymentu:** `blind_pilot_v0`  
**Zmiana względem DRAFT:** B1–B5 oraz pomocnicze N1–N9; bez zmian współczynników estymatora.  
**Audyt:** `docs/audit/2026-10-14-blind-pilot-audyt.md` (repo @ `0c8fb7e`).  
**Dokumenty odniesienia:** `docs/ROADMAP.md` (blind-first), `docs/PLAYBOOK.md`, `docs/METHOD_V2.md`, `docs/REPORT_TEMPLATE.md`, `docs/decisions/2026-10-11-v2-ocena-e2.md`.

> **Zatwierdzona decyzja:** Sprawdzamy na nowych meczach, czy samodzielna, bezcenowa wycena wykonana i zablokowana **przed ujawnieniem kursów konkretnego spotkania** wnosi informację ponad rynek STS. To wyłącznie osobny eksperyment paper-only. Frozen V2 / E2 **pozostaje bez zmian**. Samo większe odchylenie od rynku, więcej kandydatów albo trafienie pojedynczego meczu **nie stanowi dowodu edge**.

## 1. Cel i rozdzielenie metod

- **V2 / E2:** nadal aktywna, frozen: STS prior → mechaniczna korekta formy i rosteru → `p_v2`; raport `reports/YYYY-MM-DD-gpt.md`, cache `data/form/YYYY-MM-DD.json`, ledger `data/bets.json`, próba oraz K1/K2 pozostają niezależne.
- **Blind-first v0:** estimator bez kursów → `p_A`, `p_B` i fair → niezmienny lock → dopiero potem kursy STS i value. Oddzielna próba, oddzielne pliki, **bez wpisów do `data/bets.json`**, również bez mechanizmu `mode: "shadow"` z PLAYBOOK.
- **Dzień 2026-10-14:** cztery rozegrane/analizowane pary Thunderpick nie wchodzą do blind pilot, bo ich kursy były już ujawnione. Wcześniejsze kursy tych samych drużyn w *innych* parach dokumentujemy jako `prior_team_price_exposure`; sam ten fakt **nie blokuje** próby, o ile analityk w nowym kontekście nie poznał kursu *ocenianej* pary.
- **Żadnych realnych zakładów z blind v0.** `PAPER_CANDIDATE` jest etykietą badawczą, nie rekomendacją stawki. Nie przenosimy progów, capów, metryki β ani checkpointów V2 do tego eksperymentu.

## 2. Zakres, role i separacja informacji (B2, B4)

1. Rejestrujemy **wszystkie kolejne** kwalifikujące się mecze pre-match CS2 tier-1 / S-Tier moneyline (BO3/BO5 po sprawdzeniu formatu), bez wybierania atrakcyjnych par. Wyjątek operatora dla **Thunderpick World Championship 2026 main event** został zatwierdzony 2026-10-14 i obejmuje predykcje **oraz mapy tego turnieju jako kwalifikujące się dane formy** dla blind. Qualifiery i mecze tier-2/3 nie wchodzą do okna. Repo agent powinien później ujednolicić tekst `PLAYBOOK.md`, który nadal jawnie wymienia Thunderpick w wykluczeniach; to **nie** upoważnia do zmiany zamrożonej V2 przez niniejszy dokument.
2. **Analityk Fazy A: GPT** — tylko w **ChatGPT Temporary Chat / czacie tymczasowym bez pamięci, poza Projektem Edge**, w którym nie ma wcześniejszych wiadomości z kursami lub raportami tych spotkań. **Claude: niezależny audytor** locków i procesu (pierwsze 5–10 locków oraz przegląd pilotażu). Operator (użytkownik): rejestracja fixture pool, upload/commit locków, późniejszy reveal STS; standardowy V2 wykonywany w zwykłej rozmowie dopiero po locku blind.
3. **Allowlista repo dla Fazy A:** zatwierdzony protokół `docs/decisions/2026-10-14-blind-pilot.md`, instrukcje bezcenowe w `docs/` **z wyłączeniem `docs/audit/` i wszelkich dokumentów/fragmentów zawierających ceny analizowanej pary**, oraz surowe mapy w `data/form/*.json` (po sprawdzeniu, czy odczytywany plik nie zawiera kursów). `odds_source` jako etykieta źródła w cache nie jest ceną, ale nie wolno przepisywać żadnego pola cenowego. Wszelkie inne ścieżki repo wymagają jawnego sprawdzenia, że nie zawierają danych cenowych. **Zabronione przed lockiem:** `reports/`, `data/bets.json`, `data/blind/reveals/`, materiały z dziennymi kursami, podsumowania V2 dla przyszłych par i dokumenty audytowe zdradzające ceny.
4. **Allowlista internetu w Fazie A:** terminarz, format, zgłoszone składy z Liquipedii **bez kursów**; z HLTV tylko ranking i zakończone mecze / wyniki / statystyki map. **Strony HLTV nadchodzącego meczu są zakazane**, ponieważ mogą wyświetlać kursy. Nie wolno czytać snippets z odds, rekomendacji bukmacherskich, implied probabilities, konsensusu prognoz ani ruchu linii. Każde źródło faktycznie wykorzystane do prognozy zapisujemy jako **pełny URL** w `sources`. Jeśli dane wejściowe przypadkowo odsłonią cenę przyszłej pary, nie kontynuujemy „ślepej” predykcji: `blindness_compromised`, wyłączenie z próby głównej.
5. **Kolejność:** Faza A (research + wycena bez cen) → Faza B (zapis MD + JSON, SHA-256 obu, push do GitHub przed reveal) → Faza C (operator ujawnia obie ceny STS z timestampem; liczymy wartość) → Faza D (standardowy V2, closingi, settlement). Faza A nie otwiera plików ani czatów z V2 z tego dnia. Normalny harmonogram V2 może pozostać aktywny, ale **nie może spowodować przekazania kursów do Fazy A przed lockiem**; w razie konfliktu kolejność ma pierwszeństwo przed godziną.
6. Sam tryb Temporary Chat nie dowodzi automatycznie braku ekspozycji: sprawdzamy źródła, treść promptu i używane narzędzia. `analyst_context` musi mieć wartość `temporary_chat_no_memory_outside_project`; przy niespełnieniu wymagania brak kwalifikacji do próby głównej.

## 3. Estymator v0 — zamrożony na pilotaż (B1, B3, B4)

**Status estymatora:** świadomie przyjmujemy oryginalną skalę i wszystkie współczynniki **bez strojenia**. To niezkalibrowana heurystyka. Przewidujemy, że jej ściśnięcie do okolic 50% może sztucznie pokazywać dodatnie value na underdogach. **Przy tej skali oczekujemy raczej ujemnej przewagi paired Brier względem STS**; dodatnia byłaby zaskoczeniem, nie gwarancją sukcesu. Badamy to jawnie za pomocą ablacji i warstw. Zmiana współczynników jest możliwa dopiero jako **nowa wersja metody na nowej próbce**, nie po obejrzeniu wyników v0.

### 3.1. Ranking HLTV

- Bierzemy ostatni publiczny ranking **HLTV opublikowany przed lockiem** (zapis daty i URL; bez kursów, bez VRS).
- `rank_score`: miejsca **1–5 = 4**, **6–10 = 3**, **11–20 = 2**, **21–30 = 1**, **31+ = 0**.
- Brak wiarygodnego rankingu → `rank_score = 2`, `missing_team_rank`, zakaz `PAPER_CANDIDATE`.

### 3.2. Fresh form — okno i roster

- Z `METHOD_V2.md` §6–10 przenosimy **wyłącznie zasady danych sportowych**: current core, okno **30 dni**, maks. **8 najnowszych serii / 20 map**, ważenie daty `0.5 ** (days_ago / 14)`, historyczny band HLTV przeciwnika i wagi **1.2 / 1.1 / 1.0 / 0.9 / 0.8** (unknown: 1.0 + flaga), `rounds_won - rounds_lost` ograniczone do **[-8, +8]**, ważona średnia do czterech miejsc. Nie wolno przenosić `p_market`, `p_v2`, odds, value ani oceny V2.
- **Zasady rosterów dokładnie wg V2 §10:** zmiana **2+ starterów, IGL albo primary AWP → reset okna**, stare mapy mają wagę **0**; **jedna zmiana zwykłego zawodnika** (nie IGL/AWP) → historyczne mapy sprzed zmiany mają wagę **0.5**; zmiana trenera sama nie wpływa na okno. Potwierdzony stand-in/nieobecność startera wchodzi oddzielnie do §3.3.
- **Thunderpick World Championship 2026 main event** (w tym zakończone mapy z 14.10) **wchodzi do okna** na kolejne dni jako jawny wyjątek zatwierdzony przez operatora. Po locku nie używamy map rozgrywanych w przyszłości ani w trakcie. Surowe mapy z `data/form/` można ponownie przeliczać, lecz muszą być poprawione o nowe mecze i faktyczny skład na datę locku.
- Każde okno zapisujemy z listą map, datą, przeciwnikiem, historycznym bandem rankingu, wynikiem rund, mnożnikami recency/opponent/roster; liczymy `FreshMapScore = round(sum(clamp(RD,-8,8) * weights) / sum(weights), 4)` tylko przy poprawnym pokryciu.
- **Warunek braku porównywalnej formy:** jeśli **dla którejkolwiek drużyny** zachodzi `series < 2 OR maps < 4 OR round_score_coverage < 0.80` (lub okna nie da się wiarygodnie odtworzyć), to `form_is_comparable = false`, `form_component = 0` **dla obu stron**, `form_multiplier = 0`, flaga `insufficient_comparable_form`, **zakaz `PAPER_CANDIDATE`**. Wciąż zapisujemy prognozę rank-only z rosterem i flagą do oceny Brier.
- Gdy obie strony spełniają minimum i mają pokrycie ≥80%, liczymy `form_diff = round(score_A - score_B, 4)` oraz `form_delta = clamp(form_diff,-8,+8)`. **Jeżeli dla którejkolwiek drużyny** `series < 3 OR maps < 6`, mnożnik próbki to `0.5`; w przeciwnym razie `1.0`.
- W przeciwieństwie do `METHOD_V2.md` §9.2 **świadomie nie stosujemy fallback map-result**: jeżeli *choć jedna* drużyna ma pokrycie rund <80%, oba komponenty formy wyłączamy, ponieważ nie wolno porównywać różnych skal. To różnica **tylko w blind v0**, a nie zmiana V2.

### 3.3. Roster i informacje jakościowe

- `standin_A/B = 1` wyłącznie przy **potwierdzonej** absencji startera/stand-in; w pozostałych wypadkach 0. Niepewność rosteru → `uncertain_roster`, bez `PAPER_CANDIDATE`. Nie zgadujemy absencji.
- `roster_delta = 0.03 * (standin_B - standin_A)`. Nie dodajemy uznaniowych kar poza wzorem.
- Veto, map pool, LAN, format BO i kontekst zapisujemy **opisowo** jako czynniki ryzyka, **bez punktowych zmian prawdopodobieństwa**. Veto po locku = jedynie osobna uwaga QA.

### 3.4. Jedyny wzór v0 (bez kursów)

```python
rank_delta = rank_score_A - rank_score_B
if form_is_comparable:
    form_delta = max(-8.0, min(8.0, form_diff))
    form_multiplier = 0.5 if sample_small else 1.0
else:
    form_delta = 0.0
    form_multiplier = 0.0
roster_delta = 0.03 * (standin_B - standin_A)

p_A = round(max(0.15, min(0.85,
    0.50 + 0.05 * rank_delta
         + 0.0125 * form_delta * form_multiplier
         + roster_delta
)), 4)
p_B = round(1 - p_A, 4)
fair_A = round(1 / p_A, 2)
fair_B = round(1 / p_B, 2)
```

- Zapis pól wejściowych i pośrednich: `rank_delta`, `form_diff` (null, gdy forma nieporównywalna), `form_delta`, `form_multiplier`, `roster_delta`, scores do czterech miejsc, p do czterech, fair do dwóch. Wynik liczymy z wartości uprzednio zapisanych/zaokrąglonych.
- Nie ma market prior i nie ma żadnej ręcznej korekty po zobaczeniu kursów lub wyników.
- Niepewność jest **opisowa, nienaukowa** (nie 95% CI): `p_A ± 0.07` przy pełnych danych; `p_A ± 0.12` przy brakach lub niepewnym rosterze, z clamp do [0,1], analogicznie dla B. Nie wykorzystujemy jej w statystykach ani do pozorowania kalibracji.

### 3.5. Ablacja rank-only — dodatkowy forecaster (B1)

**Z góry rejestrujemy** alternatywę liczoną dla **każdej** pary z tych samych pól locku, **bez jakichkolwiek dodatkowych źródeł lub modyfikacji**:

```python
p_rank_only_A = round(max(0.15, min(0.85,
    0.50 + 0.05 * rank_delta + roster_delta
)), 4)
p_rank_only_B = round(1 - p_rank_only_A, 4)
```

- Jest to v0 z **`form_multiplier = 0`**, przy zachowaniu rankingu i rosteru. Lock zapisuje `p_rank_only_A/B` **przed reveal**, również kiedy główny v0 jest rank-only z powodu braku formy (wtedy prognozy się pokrywają).
- W raporcie końcowym porównujemy paired Brier i paired log loss **v0 vs rank-only na identycznych meczach**, osobno dla grupy `form_is_comparable=true`, a także na całej próbie. Ocenę wartości dodanej formy traktujemy jako **drugorzędną**, nie zmieniamy według niej skali w pilocie.

## 4. Reveal STS i etykiety papierowe (B1, B5)

### 4.1. Jednoznaczność pary oraz czasów

- `team_A` = drużyna **pierwsza na potwierdzonej liście meczu Liquipedii**, `team_B` = druga; zachowujemy tę orientację przez lock, reveal, scoring i V2 cross-check. Alternatywne wyświetlenie w STS nie zmienia A/B.
- `fixture_id = YYYYMMDD-<teamA>-<teamB>`, gdzie nazwy slugifikujemy do małych liter ASCII z łącznikami (np. `20261015-furia-betboom`); data to **oryginalna data zaplanowanego startu w Europe/Warsaw**. Jeżeli dwie pary tych samych drużyn wystąpią tego samego dnia, dodajemy kolejny deterministyczny sufiks `-2` i rejestrujemy kolizję. Po przesunięciu meczu nie zmieniamy ID istniejącego locku.
- Każdy rekord zawiera `scheduled_start` w ISO 8601 z poprawnym offsetem Europe/Warsaw, a także `forecast_timestamp`, `data_cutoff`, `odds_timestamp`, `revealed_at`. Ważność: **`forecast_timestamp < scheduled_start` oraz `odds_timestamp < faktyczny start meczu`**, a sam reveal po zakończonym pushu locku i przed startem. Jeżeli brak wiarygodnego timestampu, oznaczamy exclusion; czasu nie domyślamy się.
- `odds_team_A` i `odds_team_B` są **jawnymi nazwami**, odpowiadającymi `odds_A` i `odds_B` w STS; każdą odwrotną kolejność wejścia mapujemy po nazwie, nie po pozycji w tekście.
- **Główny baseline rynku** = para kursów z **pierwszego ważnego reveal po locku** (`odds_timestamp`) — nie closing. **Sensitivity** = para closing STS (obie strony), jeśli została zapisana **przed** startem. Zabroniony wybór korzystniejszego snapshotu po wyniku.
- `overround = (1/odds_A + 1/odds_B - 1)` (udział w skali 1, np. 0.07 = 7%).

### 4.2. Obliczenia (po locku, nigdy w Fazie A)

```text
p_market_A = (1/odds_A) / ((1/odds_A) + (1/odds_B))
p_market_B = 1 - p_market_A
overround = 1/odds_A + 1/odds_B - 1
value_A_pct = 100 * (odds_A * p_A - 1)
value_B_pct = 100 * (odds_B * p_B - 1)
gap_A_pp = 100 * (p_A - p_market_A)
gap_B_pp = -gap_A_pp
```

- `p_market_A/B` do 4 miejsc, `overround` co najmniej do 4, value/gap do 1, kursy do 2. Oba kursy obowiązkowo są przypisane do nazw drużyn; żadnego odwracania orientacji.
- Strona z większym value jest opisowym `paper_pick`; przy remisie `NO_SIGNAL`. Nie ma żadnych prawdziwych `BET`.
- **Blokująca lista flag dla `PAPER_CANDIDATE` (zamknięta):** `missing_team_rank`, `uncertain_roster`, `insufficient_comparable_form`, `blindness_compromised`, `market_data_missing`, `invalid_timestamps`, `invalid_lock`, `invalid_market_snapshot`, `fixture_excluded`. Każde inne **istotne** ostrzeżenie o wiarygodności wejść, które uniemożliwia odtworzenie p, należy zaklasyfikować jako `invalid_lock` **przed** przyznaniem kandydata, nie interpretować uznaniowo.
- `prior_team_price_exposure` (kursy *innych* par tych drużyn wcześniej znane) — **rejestrować, ale samodzielnie nie blokuje** `PAPER_CANDIDATE` ani próby głównej. Kurs tej **samej przyszłej pary** znany przed lockiem zawsze oznacza `blindness_compromised`, wyłączenie z próby głównej i blokadę kandydata.
- `PAPER_CANDIDATE`: `value_pick_pct >= +10.0%`, oba aktualne kursy STS, ważny pre-match reveal i lock, brak flag blokujących.
- `WATCH`: `value_pick_pct > 0`, ale próg/warunki kandydata niespełnione; w tym rank-only z `insufficient_comparable_form` nawet przy wysokim value. `WATCH` nie jest zakładem.
- `NO_SIGNAL`: brak dodatniego value po obu stronach albo brak użytecznej pary STS (wtedy value i pick `null`, flaga `market_data_missing`).

### 4.3. Wykluczenia ze scoringu głównego (B5)

- **Walkover, forfeit, mecz nierozegrany lub anulowany**: `exclusion_reason = "walkover_or_forfeit"` lub `"not_played"` / `"cancelled"` — poza próbą wynikową; wpis o próbie locku pozostaje.
- **Przesunięcie startu o więcej niż 24 godziny po locku:** `exclusion_reason = "post_lock_reschedule_gt_24h"`, poza próbą główną, nawet przy późniejszym wyniku; stary lock zostaje bez zmian. Mniejsza zmiana czasu jest odnotowywana.
- **Nieprawidłowe czasy, ujawnienie kursu tej pary przed lockiem lub brak zachowanego locku:** `exclusion_reason` odpowiednio `"lock_or_reveal_not_prematch"`, `"blindness_compromised"`, `"invalid_lock"` — poza główną próbą blind. Brak pre-match pary STS uniemożliwia **paired scoring względem rynku**, choć poprawny i rozegrany lock może nadal wejść do opisowej oceny samej prognozy; brak ceny pozostaje `null`.
- Wykluczeń nie usuwamy ani nie nadpisujemy prognozy; przechowujemy komplet rejestru, powód oraz podstawę czasową i liczymy wskaźnik pokrycia.

## 5. Pliki, SHA-256 i odpowiedzialności (B2, B5, N2)

**Faza A/B — pliki przed pierwszą ceną:**

- `research/blind/YYYY-MM-DD-blind.md`: prognoza, źródła URL, przesłanki, okna formy, ryzyka i wszystkie kwalifikujące się spotkania **bez kursów**.
- `data/blind/locks/YYYY-MM-DD.json`: ustrukturyzowane parametry i predykcje bez kursów. Obejmuje główny `p_A/B` oraz ablację rank-only `p_rank_only_A/B`.
- Wyliczamy **SHA-256 obu plików** i przekazujemy operatorowi przed reveal. `sha256_md` może znajdować się w JSON, jeśli został obliczony przed finalizacją JSON; **nie wpisujemy SHA JSON do niego samego**. Hash finalnych bajtów MD i JSON zapisujemy zewnętrznie (np. komunikat operatora, metadane w osobnym manifeście lub w repo commit message) i w późniejszym reveal.
- **Lock jest skuteczny dopiero, gdy oba pliki zostały wypchnięte (push) do GitHub przed ujawnieniem STS**. Sama lokalna data commita ani godzina tekstowa w pliku nie dowodzą pre-reveal locku. Zapisujemy identyfikator commita, SHA obu plików i obserwowalną kolejność GitHub push → reveal. GPT nie commituje ani nie pushuje: robi to operator / repo agent.

**Faza C — tylko po zweryfikowanym locku:**

- `data/blind/reveals/YYYY-MM-DD.json`: `fixture_id`, wskazanie commita i obu hashy locku, jawne nazwy `odds_team_A/B`, `odds_A/B`, `odds_timestamp`, `overround`, `p_market_A/B`, `value_A/B_pct`, `gap_A/B_pp`, `paper_pick`, `paper_signal`, pre-match closingi (jeśli są), wynik i wyłączenia. Zmiany settlement / closing przechodzą oddzielnym, datowanym append-only workflow, nie zmieniają locku.
- Standardowy V2 nadal tworzy `reports/YYYY-MM-DD-gpt.md`, `data/form/YYYY-MM-DD.json` i wpisy `data/bets.json`; blind **nie używa** V2 `mode: "shadow"`, nie miesza metryk, nie zmienia `docs/REPORT_TEMPLATE.md` v2.1.

**Minimalny rekord locku per fixture:**

```text
experiment_id, fixture_id, event, date, scheduled_start, format,
team_A, team_B, analyst: "gpt", analyst_context:
"temporary_chat_no_memory_outside_project",
forecast_timestamp, data_cutoff, rank_A, rank_B, rank_source_date,
rank_source_url, rank_score_A, rank_score_B, rank_delta,
roster_A, roster_B, form_window_ref_A, form_window_ref_B,
form_window_A, form_window_B, series_A, series_B, maps_A, maps_B,
round_coverage_A, round_coverage_B, fresh_score_A, fresh_score_B,
form_is_comparable, form_diff, form_delta, form_multiplier,
standin_A, standin_B, roster_delta,
p_A, p_B, fair_A, fair_B, p_rank_only_A, p_rank_only_B,
uncertainty_low_A, uncertainty_high_A, uncertainty_low_B,
uncertainty_high_B, sources: [URL...], data_quality: [],
odds_seen_before_lock: false, prior_team_price_exposure: bool
```

**Minimalny rekord reveal per fixture:**

```text
experiment_id, fixture_id, lock_commit_sha, lock_md_sha256,
lock_json_sha256, odds_team_A, odds_team_B, odds_A, odds_B,
odds_timestamp, revealed_at, scheduled_start, actual_start,
overround, p_market_A, p_market_B, value_A_pct, value_B_pct,
gap_A_pp, gap_B_pp, paper_pick, paper_signal,
closing_odds_A, closing_odds_B, closing_timestamp,
result, exclusion_reason, excluded_from_primary_sample,
data_quality
```

## 6. Próba, ocena i punkty kontrolne (B1, B5, N6/N7)

- **Populacja:** pierwszych **40 kolejnych** uprawnionych meczów od startu pilotażu, także słabe próbki. Rejestrujemy pełną listę fixture IDs i każdy brak locku / cen, nie wybieramy meczów po wynikach. **Pilot przechodzi na kolejne turnieje tier-1, jeśli 40 nie uzbiera się podczas Thunderpick**; parametry pozostają te same.
- **Próba scoringu głównego paired:** rozegrane mecze z poprawnym pre-match lockiem i skuteczną ślepotą, wynikiem, pierwszą ważną pre-match parą STS z reveal, bez wykluczeń §4.3. Braki formy i rankingu nie wyrzucają automatycznie z metryki Brier, lecz blokują sygnał kandydacki i wymagają segmentacji. Wynik bez rzetelnego locku nie kwalifikuje się.
- **Główna metryka:** `paired_brier_advantage = Brier(STS_de_vig_at_reveal) - Brier(blind_v0)` na identycznych spotkaniach. Dodatni znak = lepszy blind. Metryki liczymy z oryginalnego, zamkniętego p i pary STS z pierwszego reveal, nie z closingów.
- **Drugorzędne:** analogiczna różnica paired log loss (market minus blind), kalibracja, liczebność i udział kandydatów, `abs(gap_pp)`, hipotetyczny paper ROI/CLV (wyłącznie przy wiarygodnych danych), pokrycie closingów. **Sensitivity**: paired Brier i log loss z **closing** STS, jeśli oba kursy są dostępne.
- **Z góry zarejestrowane warstwy B1:** (a) `form_is_comparable=true` kontra `insufficient_comparable_form` / rank-only; (b) `paper_pick` jako **faworyt rynku** kontra **underdog** z pierwszego reveal (równe kursy jako osobna neutralna grupa); (c) ich przecięcie, jeżeli n pozwala. Raportujemy wielkość próby, Brier i log loss blind/market, advantage, kandydatów, pokrycie/CLV/ROI dla każdego segmentu, a także wynik ablacji `v0` vs `rank-only` na tych samych meczach. Faworyt zdefiniowany jako strona z **niższym kursem STS reveal**, nie strona z wyższym p blind. Przy `NO_SIGNAL` bez paper_pick segment picku nie ma zastosowania; metryki ogólne obejmują mecz.
- **Przedrejestrowane CI:** paired bootstrap **10 000 replikacji**, seed `20261014`, losowanie par meczów; przedstawiamy 95% CI dla paired Brier i paired log loss, z wyraźnym ostrzeżeniem o szerokości niepewności przy n=40. Późniejsza analiza nie stroi wyboru progów ani skali po wynikach.
- **Audyt po 5–10 lockach:** Claude sprawdza chronologię, allowlistę źródeł, kompletność i ważność obu hashy, arytmetykę, brak cen w plikach locku, spójność ranking/form/roster oraz powody wykluczeń. Wykryty błąd nie poprawia istniejącego p; zapis QA i ewentualne wyłączenie z primary.
- **Przegląd 40 meczów:** minimalna jakość procesu: ≥90% kwalifikujących się spotkań z poprawnym lockiem **i** ≥80% ważnych par STS do paired porównania. Gdy nieosiągnięte: proces niekonkluzywny, naprawa prospektywna i nowa próbka.
- Gdy jakość jest wystarczająca, **ewentualne skierowanie do większej, świeżej próby** można rozważyć dopiero jeśli jednocześnie `paired_brier_advantage > 0` **i** `paired_log_loss_advantage > 0` oraz przewaga **nie pochodzi wyłącznie z pojedynczej grupy** (`rank-only` lub `paper_pick=underdog`). Warunki te są ostrożnym **filtrem eksploracyjnym**, nie testem istotności ani dowodem dodatniego ROI; dodatni wynik n=40 nie waliduje przewagi.
- Przy ujemnym Brier i/lub log loss bądź nierównomiernym źródle wyniku: brak podstaw do promocji v0; zapisujemy to bez dorabiania nowych parametrów. Real-money **nigdy nie włączają się automatycznie**.

## 7. Procedura pierwszego dnia — 2026-10-15 (Europe/Warsaw)

1. **Przed pierwszym lockiem:** operator umieszcza **tę poprawioną wersję** w `docs/decisions/2026-10-14-blind-pilot.md`; jeśli Claude potwierdza poprawki, zapisujemy to jako follow-up audytu. Nie czekamy na kolejny turniej, ale nie uruchamiamy oficjalnej próby na niezatwierdzonym DRAFT.
2. Z wyników 14.10 i bezcenowego terminarza Liquipedii ustalamy wszystkie nowe pary z 15.10, ich orientację A/B i dokładne godziny. Bez ślepego zgadywania drabinki. Operator tworzy **Temporary Chat poza projektem i bez pamięci**. Nie podaje tam kursów ani nie załącza raportów V2 / `data/bets.json`.
3. W tamtym czacie prompt może brzmieć: **„Edge blind-first — 2026-10-15. Przeczytaj wyłącznie zatwierdzony `docs/decisions/2026-10-14-blind-pilot.md` i dozwolone dane sportowe (patrz §2 allowlista). Nie czytaj kursów ani raportów V2. Sprawdź wszystkie nowe mecze Thunderpick, wykonaj Fazę A i wygeneruj `research/blind/2026-10-15-blind.md` oraz `data/blind/locks/2026-10-15.json`; żadnych kursów przed lockiem.”** Jeśli Temporary Chat nie ma bezpiecznego dostępu do dokumentu, operator przekazuje **tylko sam zatwierdzony protokół**, nie cały kontekst projektu.
4. GPT dostarcza **oba rzeczywiste pliki** oraz SHA-256 obu. Operator sprawdza i **pushuje** je na GitHub **przed ujawnieniem STS i przed początkiem meczu**. Jeżeli nie zdążymy z meczem, zapisujemy pominięcie — bez post-hoc locku.
5. Dopiero po potwierdzonym pushu operator przesyła pary STS wraz z faktycznym timestampem do **osobnego kontekstu z cenami** (nie do Temporary Chat przygotowującego Faza A); ten kontekst generuje `data/blind/reveals/2026-10-15.json` oraz opis value, flag papierowych i później closingu. Prawdopodobieństwa v0 są niezmienne.
6. **Następnie** w zwykłym czacie Edge robimy standardowy poranny raport **frozen V2 / E2**, korzystając z STS, `data/form/` i bieżących zasad; jak dotąd tworzymy `reports/2026-10-15-gpt.md` oraz `data/form/2026-10-15.json`. **Nie przed blind lockiem.** Jeżeli zaplanowany poranny skan 08:00 uruchomi się wcześniej, służy tylko przygotowaniu terminarza i danych **bez publikowania kursów/wycen dla nowych par przed blind lockiem**. Niniejszy dokument nie modyfikuje automatyzacji, którą trzeba osobno dostosować, jeżeli przeszkadza kolejności.
7. Wszystkie wyniki, closingi i audyty zapisujemy osobno; nie przepisujemy później historycznych prognoz. Brak locku przed meczem oznacza brak prognozy zaliczonej do próby.

**Najważniejsza zasada: `BLIND LOCK (push)` → `STS REVEAL` → `V2 REPORT`. Kolejność ma pierwszeństwo przed godziną 08:00/08:05.**

## 8. Checklista gotowości i decyzje

- [x] **B1 — operator:** start v0 bez zmian współczynników; `insufficient_comparable_form` blokuje `PAPER_CANDIDATE`; rank-only ablation i rozbicie faworyt/underdog w metrykach, oczekiwana słabość kalibracji jawnie zapisana.
- [x] **B2 — operator:** GPT robi Fazę A w Temporary Chat bez pamięci poza Edge; Claude audytuje; allowlista źródeł i blokada repo przecieków.
- [x] **B3 — poprawiono:** reset 0 vs 0.5 zgodnie z V2 §10, minimum próby z OR, świadomy brak map fallback w blind.
- [x] **B4 — operator:** mapy z Thunderpick 2026 main event liczą się do świeżej formy blind.
- [x] **B5 — poprawiono:** baseline reveal, closing sensitivity, orientacja A/B, fixture ID, timestampy, overround i wykluczenia.
- [x] **Oddzielenie od V2:** bez zmiany frozen METHOD_V2, E2, standardowych raportów i ledgera, bez V2 `shadow`.
- [x] **Operator — działanie techniczne:** dokument umieszczony w repo (`b3d8c7b`+).
- [ ] **Operator/repo agent:** utworzyć i zablokować oba pliki locku push przed reveal, zapisać oba SHA-256 oraz commit.
- [x] **Claude:** kontrolny review naniesienia B1–B5 wykonany 2026-10-14, przed startem — odhaczone, brak nowych blokujących błędów. Zob. follow-up w `docs/audit/2026-10-14-blind-pilot-audyt.md`. Obowiązkowy audyt 5–10 locków zostaje po rozpoczęciu.
- [x] **Repo agent:** wyjątek Thunderpick ujednolicony w `PLAYBOOK.md` (sekcja Scope + nowa sekcja „Blind-first pilot — operational handoff"), bez naruszania frozen V2.

**Rozstrzygnięcie:** decyzje operatora z 2026-10-14 przyjęte; po wgraniu dokumentu i spełnieniu warunków izolacji/locku można rozpocząć `blind_pilot_v0` od kolejnych kwalifikujących się, nierozpoczętych spotkań. To nadal **papierowy eksperyment**, nie nowa oficjalna metoda obstawiania.

## 9. Zamknięcie pilotażu — 2026-10-15

**Status: ZAKOŃCZONY po dniu 1, bez kontynuacji.** Decyzja operatora po przeglądzie wyniku pierwszego dnia: "Pewnie tak zróbmy" (akceptacja rekomendacji zamknięcia).

**Co wyszło z dnia 1 (`data/blind/reveals/2026-10-15.json`):** z 4 par kwalifikujących się 15.10, tylko **1 miała ważny, nieskażony lock** (Aurora–Ninjas in Pyjamas). Pozostałe 3: jedna wykluczona z powodu realnej ekspozycji na kurs (`blindness_compromised`, dynamiczny nagłówek strony rankingu HLTV), dwie oznaczone `invalid_lock` z powodu przypadkowej ekspozycji na procentowe głosowanie/konsensus społeczności w **wynikach ogólnego wyszukiwania** (nie na stronie konkretnego meczu) podczas dozwolonego researchu rankingu/formy.

**Dlaczego to kończy pilotaż, a nie tylko dzień 1.** Kontaminacja przez wyniki wyszukiwania (2 z 4 par, 50%) nie jest incydentem jednej strony czy jednego URL-a do zbanowania — to efekt ogólnego wyszukiwania w ogóle, które nieprzewidywalnie podciąga fragmenty z cen/prognoz z całego indeksu. Przy takim tempie kontaminacji próg jakości z sekcji 6 (**≥90% poprawnych locków** na przeglądzie 40 meczów) jest nieosiągalny w rozsądnym czasie — próba byłaby strukturalnie skazana na "proces niekonkluzywny" zanim jeszcze dotrze do 40 obserwacji. Do tego doszedł osobny, operacyjny problem z dnia 1: push locka wymaga obecności opiekuna księgi, a opiekun księgi nie jest dostępny rano, co samo w sobie ryzykowało naruszenie kolejności "push przed startem meczu" (w tym konkretnym dniu push zdążył — 07:52 przed 10:30 — ale to był przypadek, nie gwarancja).

**Co zostaje.** `research/blind/`, `data/blind/locks/`, `data/blind/reveals/` pozostają w repo jako kompletny, niezmieniony zapis — zgodnie z zasadą projektu, że nic się nie usuwa ani nie przepisuje wstecz. Pojedyncza ważna obserwacja (Aurora-NiP) jest opisowa, nie jest podstawą do żadnego wniosku o `blind_pilot_v0` jako metodzie (n=1). `method_version` V2 i E2 pozostają całkowicie niezmienione — ten eksperyment nigdy nie dotykał `data/bets.json`.

**Gdyby ktoś chciał to wznowić w przyszłości:** najpierw naprawić kanał kontaminacji (zakaz ogólnego wyszukiwania w Fazie A, tylko zamknięta lista zatwierdzonych URL-i — Liquipedia terminarz/składy, konkretne strony HLTV rankingu i zakończonych meczów, nic poza tym) **i** rozwiązać problem dostępności opiekuna księgi rano, zanim ruszy kolejna próba. To nowa decyzja, nie automatyczne wznowienie tej.
