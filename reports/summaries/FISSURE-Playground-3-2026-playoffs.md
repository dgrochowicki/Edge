# Edge — Raport fazowy: FISSURE Playground #3, playoffy

**Turniej:** FISSURE Playground #3 (Suzhou, Chiny), S-Tier / Valve Tier 1, pula $1 000 000, 16 drużyn
**Faza:** playoffy (6 drużyn, single elimination, BO3; finał BO5)
**Zakres:** 2026-09-11 – 2026-09-13 (3 dni, 5 meczów)
**Metoda:** v1 · **Gra:** cs2 · **Rynek odniesienia:** STS
**Mistrz:** Legacy (3:0 z G2 w finale) · **Status dokumentu:** opisowy, nie walidacyjny

---

## 1. Zakres

Playoffy: ćwierćfinały 11.09 (MIBR–Alliance, FURIA–G2), półfinały 12.09 (Legacy–MIBR, BetBoom–G2), finał BO5 13.09 (Legacy–G2). Pięć meczów, obaj agenci wycenili wszystkie.

Rytm operacyjny wrócił do porannego, bo mecze startowały o 08:00, a nie 05:00. Jeden dzień (12.09) wyceniony wieczorem dnia poprzedniego, z ~12-godzinnym wyprzedzeniem.

Legacy przeszli playoffy nie tracąc serii, a finał wygrali 3:0. Drogę do tytułu zbudowali na czterech seriach i dziesięciu mapach, podczas gdy G2 przeszli przez sześć serii i szesnaście map z dolnej drabinki.

## 2. Kalibracja porównawcza (rdzeń)

**Playoffy (5 predykcji każdy):**

| Agent | Brier | vs rynek (0.1992) | Trafienia | BET |
|-------|------:|------:|----------:|-----|
| claude | 0.2077 | **+0.0085** | 4/5 | 0 |
| gpt | **0.1960** | **-0.0032** | 4/5 | 0 |

**To jest dokładne odwrócenie fazy grupowej** i najważniejsza obserwacja tego dokumentu. W grupach claude bił rynek (-0.0055), a gpt od niego odstawał (+0.0089). W playoffach jest odwrotnie: przy identycznej trafności 4/5 claude wypada gorzej od rynku, a gpt lepiej. Ta sama metoda, ten sam turniej, przeciwny wynik w odstępie trzech dni.

Wniosek nie brzmi „gpt jest lepszy w playoffach". Brzmi: **przy n=5 i n=24 te różnice nie mierzą niczego trwałego.** Przewagi rzędu ±0.008 przy takich próbkach są szumem i każda interpretacja kierunkowa jest nadinterpretacją. Gdyby ktoś czytał wyłącznie raport z fazy grupowej, wyszedłby z przekonaniem, że claude odnalazł przewagę nad rynkiem — trzy dni później to przekonanie byłoby fałszywe.

**Cały turniej (29 predykcji):**

| Agent | Brier | vs rynek (0.2627) | Trafienia | Bias vs de-vig |
|-------|------:|------:|----------:|---------------:|
| claude | 0.2596 | -0.0031 | 17/29 (59%) | +0.05 pp |
| gpt | 0.2696 | +0.0068 | 14/29 (48%) | +1.26 pp |

**Narastająco (cała rozliczona księga):**

| Agent × wersja | n | Brier | rynek | różnica | Trafienia | do 150 |
|---|--:|------:|------:|------:|----------:|--:|
| claude × v1 | 144 | 0.2151 | 0.2144 | **+0.0007** | 101 (70.1%) | 6 |
| gpt × v1 | 141 | 0.2093 | 0.2094 | **-0.0001** | 89 (63.1%) | 9 |

Bez zmian wobec wniosku z raportu grupowego: **oba tory pozostają nieodróżnialne od zde-vigowanej linii bukmachera.** Dwudziestodziewięciomeczowy turniej nie ruszył tych liczb w żadną stronę.

## 3. Nazwany błąd v1: przecenianie zmęczenia i bilansu turniejowego

Playoffy dostarczyły dwa przypadki tego samego schematu, oba sprostowane przez linię zamknięcia **i** przez wynik:

| Data | Mecz | Moja ocena | Rynek | Zamknięcie | Wynik |
|---|---|---:|---:|---|---|
| 11.09 | MIBR vs Alliance | MIBR 55.9% | 57.9% | 1.60 → **1.60** (bez ruchu) | MIBR 2:0 |
| 12.09 | BetBoom vs G2 | G2 52.1% | 57.0% | 1.62 → **1.50** (ruch na G2) | G2 2:1 |

W obu schodziłem **poniżej** rynku po stronie faworyta, opierając się na argumentach o wypoczynku i bilansie z bieżącego turnieju. Przy MIBR uznałem nocny ruch linii o +6.5 pp za nieuzasadniony informacyjnie — rynek utrzymał wycenę do zamknięcia i miał rację. Przy BetBoom–G2 zbudowałem najmocniejsze uzasadnienie całego turnieju (BetBoom niepokonani, trzy razy 2:0, VRS #9 vs #8, trzy mecze i dzień przerwy wobec pięciu meczów G2, łańcuch przez Astralis) — rynek poszedł jeszcze mocniej na G2 i znów miał rację. G2 wygrali szóstą serię w sześć dni.

**Wniosek do PRE-V2:** v1 przypisuje zbyt dużą wagę obciążeniu meczowemu i bilansowi z bieżącego turnieju względem siły bazowej drużyny. Dwa przypadki to za mało na regułę, ale wystarczy, żeby zapisać to jako hipotezę do sprawdzenia na pełnej próbce przy checkpoincie — tym bardziej, że ma ona dokładny, mierzalny kształt: porównać wyniki wpisów, w których `estimated_probability` odbiega w dół od de-vigu, z resztą.

**Korekta wcześniejszego wpisu.** W raporcie z fazy grupowej zapisałem wzorzec przeciwny: „wartość siedzi po stronie drużyny z najlepszym bilansem na samym turnieju" (5star, BetBoom). Playoffy tę tezę obaliły — BetBoom mieli najlepszy bilans turniejowy i odpadli, 5star również ostatecznie odpadli. Teza zostaje wycofana; w jej miejsce wchodzi hipoteza odwrotna, opisana wyżej.

## 4. Decyzje BET i CLV

**0 BET w playoffach po obu stronach. Bilans całego turnieju: 29 meczów, 0 BET claude, 2 BET gpt (oba przegrane, oba z dodatnim CLV).**

Marża STS w playoffach: 8.0%, 8.2%, 8.3% — **dziewiąty dzień z rzędu w przedziale 7.5–8.4%, aż po finał o $300 000.** Hipoteza z raportu grupowego („marża spadnie przy wyższym obrocie playoffowym i test na 0 BET wykona się sam") jest **obalona**. Marża na tym bukmacherze była w tym turnieju stała niezależnie od rangi meczu. To domyka wyjaśnienie zera zakładów: nie jest to artefakt fazy ani obrotu, lecz efekt zderzenia stałej marży ~8% z progiem +8-10%.

**Kursy zamknięcia w playoffach (claude, 4 z 5 meczów):**

| Mecz | Pick | Analiza | Zamknięcie | CLV | Wynik |
|---|---|---:|---:|---:|---|
| MIBR vs Alliance | MIBR | 1.60 | 1.60 | +0.0% | won |
| FURIA vs G2 | FURIA | 1.60 | 1.62 | -1.2% | lost |
| BetBoom vs G2 | G2 | 1.62 | 1.50 | +8.0% | won |
| Legacy vs G2 | Legacy | 1.77 | 1.82 | -2.7% | won |

Finał BO5 jest tu osobno wart uwagi: rynek odszedł od Legacy (1.77 → 1.82), czyli CLV był **ujemny**, a Legacy wygrali 3:0 bez straty mapy. To najmocniejszy pojedynczy przypadek w tej próbce, w którym ujemny CLV towarzyszył trafnej i to bezdyskusyjnie trafnej ocenie.

**CLV narastająco (claude, 47 obserwacji):**

| Grupa | n | Trafność | Średni CLV |
|---|--:|--:|--:|
| CLV dodatni | 19 | 12/19 (63%) | +3.9% |
| CLV ujemny | 19 | 13/19 (68%) | -3.9% |
| CLV zerowy | 9 | 6/9 (67%) | +0.0% |
| **Razem** | **47** | **31/47 (66%)** | **+0.01%** |

Wpisy z ujemnym CLV nadal trafiają częściej niż z dodatnim — teraz przy symetrycznej próbce 19/19. Przy tej wielkości to wciąż nie jest dowód, ale jest to już drugi odczyt pokazujący to samo, a nie pojedyncza anomalia. Średni CLV claude wynosi **+0.01%**, czyli zero, spójnie z Brierem siedzącym na rynku. Dwie niezależne metryki mówią to samo o v1.

**Pokrycie CLV:** 47 ze 144 wpisów, czyli 33%. Braki nie są losowe — mecze o 05:00 i 08:00 systematycznie ich nie mają, co koreluje z fazą turnieju. Każdy wniosek z tej próbki wymaga sprawdzenia pod kątem doboru.

## 5. Błąd operacyjny: niezgodność schematu JSON

Wpis **P-2026-09-13-C1 używa pola `market_odds` zamiast `market_odds_at_analysis`.** W księdze jest 284 wpisów z nazwą kanoniczną i **dokładnie ten jeden** z inną. Źródłem jest blok JSON generowany w raportach dziennych claude — nazwa była korygowana ręcznie przy scalaniu, a tym razem przeszła.

**Skutek jest niewidoczny i dotyczy rdzenia projektu.** `dashboard/shared-metrics.js` filtruje próbkę sparowaną po `market_odds_at_analysis` (linia 411) i tak samo liczy Brier rynku (linia 465); `dashboard/research.js` filtruje po tym polu analizę wartości (linia 74). Wpis bez tego pola jest **po cichu pomijany** — bez błędu i bez ostrzeżenia. Dashboard pokazuje więc próbkę sparowaną claude jako 143, nie 144, a benchmark rynkowy liczy na innym zbiorze meczów niż Brier agenta. Dokładnie ten rodzaj rozjazdu, przed którym ostrzega opis metryki `paired` w samym `shared-metrics.js`.

**Do naprawy:** zmienić nazwę pola w P-2026-09-13-C1 na `market_odds_at_analysis` oraz poprawić szablon bloku JSON w raportach dziennych claude, żeby emitował nazwę kanoniczną. Szablon `REPORT_TEMPLATE.md` nie wymienia tego pola wprost — warto go uzupełnić, bo to właśnie ta luka pozwoliła błędowi powstać.

**Do zrobienia przed checkpointem 150:** przelecieć całą księgę walidatorem schematu. Skoro jeden wpis przeszedł niezauważony, założenie o kompletności pozostałych wymaga sprawdzenia, a nie przyjęcia — analiza checkpointowa będzie liczona na tych danych.

## 6. Status i zastrzeżenia

- **To nie jest walidacja metody.** n=5 na fazę, n=29 na turniej. Odwrócenie znaku przewagi między fazami (sekcja 2) jest bezpośrednim dowodem, że przy tych próbkach nie należy wyciągać wniosków kierunkowych.
- **Checkpoint liczony per agent × wersja:** claude × v1 = **144/150**, gpt × v1 = **141/150**. Nie sumować torów.
- Brakujące predykcje przyjdą ze StarLadder StarSeries Fall od 17.09 — claude potrzebuje 6, gpt 9.
- Bilans BET-ów narastająco: claude 3 zakłady, 1 wygrany, **-0.46u**; gpt 17 zakładów, 8 wygranych, **-0.50u**. Oba tory na minusie; wcześniejsza przewaga gpt (+1.50u po 15 zakładach) wyparowała po dwóch przegranych w tym turnieju. To ilustracja tej samej lekcji co Brier: przy n=15-17 nic nie było ustalone.

## 7. Do checkpointu 150

Analiza checkpointowa została uzgodniona i obejmuje trzy pytania, wszystkie rozstrzygalne na zebranych danych:

1. **Czy próg +8-10% jest właściwy.** Kluczowe rozróżnienie: próg nie kompensuje marży (marża siedzi w kursie, a `value_pct` jest wprost wartością oczekiwaną) — jest buforem na błąd oceny agenta. Pytanie brzmi więc, jak duży jest ten błąd, i czy jest jednorodny.
2. **Czy przewaga istnieje na jakimś podzbiorze.** Brier mierzy średnią po wszystkim; możemy być równi rynkowi globalnie i lepsi na wycinku. Pociąć 144 wpisy po kursie, fazie turnieju, rankingu drużyn i wielkości odchylenia od de-vigu.
3. **Czy de-vig proporcjonalny jest właściwy.** Jeśli STS ładuje nieproporcjonalnie dużo marży na outsiderów, anchor jest przesunięty i wszystkie wartości przy wysokich kursach liczone są od złej podstawy. Sprawdzić Shin i model potęgowy na tej samej próbce. FISSURE, z marżą 8% i dużą liczbą skrajnych faworytów, jest do tego testu materiałem szczególnie dobrym.

Dodatkowo, wynikające z tego turnieju: **hipoteza o przecenianiu zmęczenia i bilansu turniejowego** (sekcja 3) ma mierzalny kształt i powinna wejść do tej samej analizy.
