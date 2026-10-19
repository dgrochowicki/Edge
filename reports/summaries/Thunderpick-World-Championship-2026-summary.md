# Edge — Raport zbiorczy i audyt v2: Thunderpick World Championship 2026

**Turniej:** Thunderpick World Championship 2026, LAN, 8 drużyn — **jednorazowy, datowany wyjątek zakresu** zatwierdzony przez operatora 14.10 przed wyceną (`docs/PLAYBOOK.md` → Scope; seria Thunderpick domyślnie pozostaje poza zakresem)
**Format:** dwie grupy GSL (BO3, 14–16.10) → półfinały BO3 (17.10) → mecz o 3. miejsce BO3 i wielki finał BO5 (18.10)
**Zakres:** 2026-10-14 – 2026-10-18 (5 dni meczowych), **14 meczów, 14 predykcji** `P-2026-10-14-G1` … `P-2026-10-18-G2`
**Metoda:** v2.0 wycena + protokół oceny E2 (`docs/METHOD_V2.md`) · **Wykonawca:** gpt · **Audytor:** claude (§21) · **Rynek odniesienia:** STS
**Mistrz:** FURIA (3:2 z BETBOOM w finale, po 1:2) · **Status dokumentu:** opisowy + audyt wykonania, nie walidacyjny

Wszystkie liczby pochodzą z `data/bets.json` i `data/form/` po rozliczeniu finału (commit `4e3df22`), nie z raportów dziennych. Metryki referencyjne: `scripts/v2_metrics.py` (`--from 2026-10-14` dla turnieju, bez filtra dla całej próbki).

---

## 0. W skrócie

1. **Wykonanie metody jest czyste.** 14/14 predykcji przeliczonych od zera z surowych okien daje te same `p_market`, FreshMapScore, mnożniki próbki, korekty, `p_v2`, fair, value i pick. Wszystkie 28 map z Thunderpick zgodne z HLTV. Walidator: 0 błędów.
2. **Wynik turnieju: v2 minimalnie gorsze od rynku, w granicach szumu.** Brier 0.23258 vs rynek 0.23062, przewaga **−0.00196**, 95% CI [−0.00654, +0.00174]. Bezpiecznik §20 pkt 3: ok.
3. **β turnieju +1.39 (n=9), ale CI [−0.50, +3.64] i wynik wisi na jednym meczu.** Bez FURIA–BETBOOM z 14.10 β spada do +0.58. Cała próbka v2: **β = +0.40, 95% CI [−0.45, +1.23], n = 37/100** do K1.
4. **0 BET, najwyższe value −5.2%.** BET był arytmetycznie osiągalny tylko na 6 underdogach (potrzeba +3.9–4.6 pp w ich stronę); faktyczne korekty szły w drugą stronę.
5. **Do decyzji przed następnym turniejem (sekcja 5):** mapy z Thunderpick 2026 stanowiły od 15.10 nawet 69% wagi okien formy. Czy zostają w oknach v2 na kolejnych turniejach (do 30 dni, czyli mniej więcej do połowy listopada)? Dosłowny odczyt mówi „tak”, ale nikt tego nie zdecydował wprost.

## 1. Zakres i kompletność

14 meczów: 10 grupowych (5 na grupę GSL), 2 półfinały, mecz o 3. miejsce, finał. Wszystkie 14 są w księdze — pokrycie pełne.

**Wyniki końcowe:** 1. FURIA, 2. BETBOOM, 3. Aurora, 4. Falcons. Grupa A: Falcons (2:0 NiP, 2:1 9z), Aurora (przez dolną drabinkę: 2:0 NiP, 2:0 9z). Grupa B: FURIA (2:0 BETBOOM, 2:1 Legacy), BETBOOM (2:1 PARIVISION, 2:1 Legacy). Półfinały: FURIA 2:0 Aurora, BETBOOM 2:1 Falcons. 3. miejsce: Aurora 2:1 Falcons. Finał: FURIA 3:2 BETBOOM.

**Underdog rynkowy wygrał 5 z 14** (de-vig zakładał 4.8) — turniej w normie. Najgorszy dzień rynku: 17.10 (Brier 0.414 — Falcons przy 0.77 przegrali z BETBOOM). Trzy z pięciu niespodzianek to BETBOOM (z PARIVISION, Legacy i Falcons), pozostałe dwie: 9z z Aurorą 14.10 i Aurora z Falcons w meczu o 3. miejsce.

**Decyzje:** 14 × PASS, 0 BET. Pewność: 4 (9×), 5 (5×). Marża STS: 7.84–8.33%, średnio 8.16%.

Poza `predictions` w oknie turnieju księga ma 30 kuponów operatora (`EDGE-249` … `EDGE-278`). Zgodnie z praktyką z raportu EWC P&L operatora jest poza tym dokumentem — mierzy grę operatora, nie metodę.

## 2. Audyt wykonania (METHOD_V2 §21)

### Co sprawdziłem

Dla każdej z 14 predykcji, bez korzystania z liczb gpt jako wejścia:

- de-vig z obu kursów → `p_market` (4 miejsca);
- okna obu drużyn z `data/form/<dzień>.json`: wiek map ≤ 30 dni, kolejność od najnowszych, limit 8 serii / 20 map, `weight_recency` = 0.5^(dni/14), `weight_opponent` z tabeli §8, `weight_roster`, reguła pokrycia 80%, spójność wyniku mapy z rundami;
- FreshMapScore, mnożnik próbki (§6), `fresh_adjustment_pp`, kary rosterowe, cap, `p_v2`, fair, value obu stron i reguła picku E2 (§13), każdy krok z zaokrąglonej wartości poprzedniego;
- spójność wszystkich 96 unikalnych map w pięciu plikach dni (te same mapy w różnych plikach i z perspektywy obu drużyn) oraz pasm rankingowych tego samego przeciwnika;
- zewnętrznie: **wszystkie 28 map** z meczów Thunderpick, które weszły do okien (14–17.10), oraz składy, wobec stron meczów HLTV;
- `scripts/validate_bets.py`, `scripts/v2_metrics.py`.

### Wynik

| Kontrola | Wynik |
|---|---|
| `p_market` (14) | 14/14 zgodne |
| FreshMapScore (28 drużyno-dni) | 26/26 zgodne co do 0.0001; 2 brakujące okna — patrz T1 |
| Wagi, wiek, limity okien, reguła 80% | bez zastrzeżeń; wszystkie okna `round_diff`, pokrycie 100% |
| Mnożniki próbki (§6) | 14/14 zgodne (zerowanie: NiP 14 i 15.10, Legacy 14 i 15.10; ×0.5: Legacy 16.10) |
| `fresh_adjustment_pp`, `total_adjustment_pp`, `p_v2` | 14/14 zgodne |
| fair / value / pick / decyzja | 14/14 zgodne; dwa remisy value w granicy 0.1 pp rozstrzygnięte poprawnie (`10-14-G2`: korekta 0 → faworyt; `10-18-G1`: kierunek korekty) |
| Spójność 96 map między plikami | 0 rozjazdów |
| Pasma rankingowe | 0 rozjazdów między plikami; zewnętrznie niezweryfikowane (T4) |
| Mapy Thunderpick vs HLTV (28) | 28/28 zgodne |
| Legacy: arT jako IGL od 14.10 | potwierdzone — arT grał już 14.10 z PARIVISION |
| Walidator | 55 predykcji v2, 0 błędów, 5 znanych flag `pre_e2` z EPL |

Pierwszy turniej w pełni na konwencjach E2 (`p_v2`, reguła picku, precyzja 4 miejsc) — i każdy wpis da się odtworzyć z samej księgi, bez raportu. Tak to miało działać.

### Ustalenia

**T1. Brakujące okno zapisane jako 0.0 zamiast `null`.** W `P-2026-10-14-G2` (NiP) i `P-2026-10-14-G3` (Legacy) drużyna bez okna ma w księdze `fresh_map_score = 0.0`, a `fresh_diff` jest liczony z tego zera (0.33 i 1.4128), choć korekta jest poprawnie zerowa. W plikach `data/form/` te same okna mają `null`. Wpływ na `p_v2`: żaden. Ryzyko: ktoś, kto kiedyś policzy coś na `fresh_diff` z księgi, weźmie fikcyjne wartości. **Propozycja:** brak okna = `null` w `fresh_map_score_*` i `fresh_diff`; doprecyzowanie szablonu, bez zmiany metody.

**T2. Raport z 15.10 został w repo jako DRAFT, niezgodny z księgą co do czasu kursów.** `reports/2026-10-15-gpt.md` ma status „DRAFT — do uzupełnienia `odds_timestamp`”, w JSON `odds_timestamp: null`, a w nagłówku „po 08:02 CEST”. Księga ma `07:50` z commita `4fdb47c` („odds_timestamp confirmed 07:50 CEST”). Jedna z tych dwóch godzin jest nieprawdziwa. Wartość w księdze pochodzi od operatora, więc najpewniej poprawna — ale oficjalny raport dnia nigdy nie dostał statusu FINAL ani erraty. **Propozycja:** dopisać do raportu sekcję erraty (zgodnie z zasadą niezmienności) z potwierdzoną godziną i źródłem potwierdzenia.

**T3. Trzy identyczne zamknięcia jednego dnia.** 14.10 trzy z czterech meczów mają closing dokładnie **1.26 / 3.50** (`G1`, `G2`, `G4`), przy różnych otwarciach (1.28/3.35, 1.20/4.00, 1.36/2.90). STS ma gruby ladder kursów — w całej próbce v2 na 101 odczytów przypada tylko 41 różnych par, a 1.26/3.50 występuje łącznie 5 razy — więc to jest możliwe. Ale to jedyny taki przypadek w całej próbce, mecze 14.10 startowały z opóźnieniem, a `G4` ma największy ruch linii turnieju (+5.45 pp) i to on niesie β turnieju (sekcja 4). Nie mam jak tego sprawdzić z repo. **Propozycja:** operator potwierdza z pamięci lub screenów, że to trzy osobne odczyty; na przyszłość pole `closing_timestamp` w schemacie v2 (blind je miał, v2 nie ma). To zmiana zapisu, nie metody — a przy opóźnionych meczach (15-G3 i 15-G4 miały po dwa nadpisane closingi) mówi, który odczyt trafił do β.

**T4. Pasma rankingowe z dziedziczonego cache.** Wszystkie 14 wpisów ma flagę `historical_opponent_rank_bands_from_prior_edge_cache` / `..._from_edge_cache`. Pasma są spójne między plikami, ale niezweryfikowane zewnętrznie ani przez gpt, ani przeze mnie. Postawione poprawnie — flaga jest prawdziwa i zostaje aktualna.

**T5. Legacy 14.10 — obsługa rosteru poprawna ex post.** gpt miał sprzeczne źródła (zapowiedź powrotu arT vs bobz na karcie meczu), nie naliczył kary −2 pp i wyzerował okno po zmianie IGL. arT faktycznie zagrał, więc reset okna i brak kary to dokładnie to, co metoda wymagała. Przy okazji: korekta i tak była zerowa, bo okno Legacy po resecie było puste.

## 3. Kalibracja wobec rynku (§18.2, opisowo)

| Próbka | n | Brier v2 | Brier rynku | Przewaga (rynek − v2) |
|---|---:|---:|---:|---:|
| **Cały turniej** | 14 | 0.23258 | 0.23062 | **−0.00196** |
| Grupy | 10 | 0.19834 | 0.19683 | −0.00151 |
| Playoff | 4 | 0.31819 | 0.31512 | −0.00306 |
| Korekta ≠ 0 | 10 | 0.27262 | 0.26989 | −0.00274 |
| Korekta = 0 | 4 | 0.13247 | 0.13247 | 0 |
| **Cała próbka v2 (EPL + Thunderpick)** | 55 | 0.20035 | 0.20021 | **−0.00014** |

95% CI przewagi: turniej [−0.00654, +0.00174]; cała próbka [−0.00223, +0.00190]. Oba zawierają zero; żaden nie leży w całości poniżej zera (bezpiecznik §20 pkt 3 — ok).

**Rozbicie na dni:** 14.10 −0.0044, 15.10 −0.0008, 16.10 +0.0029, 17.10 −0.0082, 18.10 +0.0021. Znak zmienia się z dnia na dzień, jak w EPL i w v1.

**Kierunek korekty a wynik:** 5 z 10 meczów z niezerową korektą wygrała strona, w którą korekta przesunęła cenę. 8 z 10 korekt szło **w stronę faworyta rynku** — faworyci mieli w tym turnieju lepszą świeżą formę, więc v2 je dociskało. To odwrotnie niż w EPL, gdzie sygnał miał głównie ratować underdogów.

**Wielkość korekt** (wszystkie 14, z zerami): mediana |korekty| 0.70 pp, średnia 0.52 pp, maksimum 1.68 pp (`10-14-G1`), 4 korekty zerowe. Cap ±4 / ±5 pp nie zadziałał ani razu. Kubełki (n=14) — v2 i rynek różnią się w każdym o mniej niż 1 pp:

| Przedział | n | śr. v2 | śr. rynek | trafienia |
|---|---:|---:|---:|---:|
| 50–60% | 5 | 0.548 | 0.547 | 0.600 |
| 60–70% | 3 | 0.661 | 0.655 | 0.667 |
| 70–80% | 6 | 0.753 | 0.746 | 0.667 |

## 4. β i ruch linii (§18.1)

**Pokrycie zamknięciem: 13/14 (93%)** — lepiej niż w EPL (80%). Brakuje tylko `P-2026-10-15-G2` (9z–Falcons) — i to akurat mecz z największą korektą tego dnia, który raport z 15.10 wskazał jako priorytet. Zostaje `null` na stałe. Cała próbka: 46/55 (84%).

| | n obs. β | β | 95% CI |
|---|---:|---:|---|
| Thunderpick | 9 | **+1.39** | [−0.50, +3.64] |
| EPL S24 (dla porównania) | 28 | +0.10 | [−0.89, +0.99] |
| **Cała próbka v2** | **37** | **+0.40** | **[−0.45, +1.23]** |

**Odporność β turnieju:** usunięcie `P-2026-10-14-G4` (FURIA–BETBOOM, korekta +1.12 pp, ruch +5.45 pp) daje **+0.58**; usunięcie `P-2026-10-15-G3` daje +1.06. Pozostałe pojedyncze usunięcia trzymają 1.38–1.90. To jedna duża obserwacja, a nie wzór — i jest to ta sama obserwacja, której dotyczy T3.

**Pomocniczo (E1):** średni ruch w stronę korekty przy |korekta| ≥ 1 pp: +3.31 pp, n=2 (w całej próbce +0.74 pp, n=11, CI [−0.69, +2.24]). Przy ≥ 3 pp: n=0, jak w EPL.

Na 13 meczach z zamknięciem: Brier kursu otwarcia 0.24427, v2 0.24668, **kursu zamknięcia 0.24258**. Rynek przy zamknięciu znowu lepszy od obu. Średni bezwzględny ruch linii do zamknięcia: **2.09 pp**, czyli ok. czterech typowych korekt v2 — ta sama proporcja co w EPL.

**Licznik do K1: 37/100.** Thunderpick dodał 9 obserwacji z 14 predykcji; w całej próbce to 0.67 obserwacji na predykcję. Do K1 brakuje 63 obserwacji, czyli przy tym tempie ok. 95 predykcji. To rząd kilku turniejów tier-1, nie rok — tempo jest lepsze niż zakładała projekcja z EPL, bo pokrycie zamknięciem wzrosło.

## 5. Wyjątek zakresu a okna formy — do decyzji

Wyjątek z 14.10 mówi, że ta edycja jest „in scope”. METHOD_V2 §6 wyklucza z okna tylko mecze **poza zakresem**. Dosłownie czytane, mapy z Thunderpick 2026 są więc kwalifikującymi się danymi formy — i gpt tak je potraktował od 15.10 (zapis w `roster_note`: „Thunderpick 14 Oct maps included … under 2026 event exception”). Dla blind pilota decyzja z 14.10 mówiła o tym wprost; dla v2 nikt tego nie zapisał.

To nie jest kosmetyka. Udział map z Thunderpick w wadze okien:

| Dzień | zakres udziału (obie drużyny) |
|---|---|
| 15.10 | 13–29% (Legacy i NiP 100%, ale tam korekta = 0) |
| 16.10 | 24–48% |
| 17.10 | 35–61% |
| 18.10 | 47–69% |

Wykonanie oceniam jako poprawne — spójne z dosłownym brzmieniem i jawnie opisane w cache. Ale za tydzień pytanie wraca w ostrzejszej formie: **czy mapy z Thunderpick 2026 zostają w oknach v2 na kolejnych turniejach** (do 30 dni, czyli mniej więcej do połowy listopada), obok map z EPL, a obok nich nadal nie liczą się inne turnieje tier-2 tych samych drużyn (np. NiP: Stake Pulse Beat III, ROG Journey — wykluczone 14.10)?

Dwie spójne odpowiedzi:

- **Tak** — edycja jest w zakresie, więc jej mapy też; konsekwencja: przez ok. miesiąc FURIA, BETBOOM, Aurora, Falcons, 9z, Legacy, PARIVISION i NiP mają w oknach mapy z wydarzenia o innym poziomie niż reszta.
- **Nie, od następnego turnieju** — wyjątek dotyczył predykcji na tym wydarzeniu, a po nim wraca reguła domyślna.

Nie rekomenduję żadnej z nich na podstawie wyników — 14 meczów nic tu nie mówi. Rekomenduję tylko, żeby decyzja była **zapisana jednym zdaniem w `docs/decisions/` przed pierwszym raportem następnego turnieju**, żeby gpt nie rozstrzygał tego sam przy budowaniu cache. Parametry wyceny bez zmian w obu wariantach.

Przy okazji: 14 predykcji z Thunderpick są w tej samej próbce v2 co EPL, a księga nie ma pola wydarzenia. Analiza wrażliwości „bez wyjątku zakresu” wymaga dziś filtrowania po datach. Wystarczy to wiedzieć — nie proponuję zmiany schematu tylko dla tego.

## 6. Blind-first pilot v0 — notatka audytowa

Pilot zakończono 15.10 po pierwszym dniu (`docs/decisions/2026-10-14-blind-pilot.md` §9). Mój przewidziany audyt 5–10 locków jest bezprzedmiotowy; sprawdziłem tylko integralność tego, co zostało w repo.

- **Hashe zgodne.** SHA-256 `research/blind/2026-10-15-blind.md` = `ad063a9d…b4a5`, `data/blind/locks/2026-10-15.json` = `5a4b97d0…b127` — zgodne z commitem i z `reveals/2026-10-15.json`.
- **Lock był na GitHubie przed meczami.** Oba pliki wgrane 07:52 (`e0c6d91`) i 07:54 (`9f9c84a`), pod innymi ścieżkami (`reports/`, `data/form/`). Commit `94da17d` o 16:06 to czysta zmiana nazwy (100% podobieństwa) na ścieżki z protokołu.
- **Wiadomość commita `94da17d` jest błędna.** Twierdzi, że push nastąpił 16:05 i że warunek „push przed startem” nie jest spełniony dla trzech meczów. Historia gita mówi co innego: treść była na GitHubie od 07:52/07:54. Reveal (`lock_commit_sha: e0c6d91`) i §9 decyzji opisują to poprawnie. Commita nie da się poprawić — wystarczy, że ta notatka to odnotowuje, żeby nikt w przyszłości nie wyciągnął z niego wniosków.
- **Jedyna ważna obserwacja:** Aurora–NiP, blind 0.60 vs rynek 0.7236, Aurora wygrała 2:0, paired Brier −0.0836. Rank-only, `WATCH`. n=1 — bez interpretacji.

Zamknięcie pilotażu oceniam jako uzasadnione: kontaminacja przez wyniki wyszukiwania (2 z 4 par) to problem kanału, nie pojedynczej strony, a próg ≥90% poprawnych locków był przy niej nieosiągalny.

## 7. Pytania otwarte z `docs/audit/2026-10-04-epl-s24-obserwacje.md`

**O1 — kara za stand-ina:** 0 przypadków w tym turnieju (brak potwierdzonych stand-inów; powrót arT obsłużony resetem okna, nie karą). Bez nowych danych.

**O2 — dominacja jednej serii w krótkich oknach:** 1 z 10 predykcji z korektą miała serię > 50% wagi okna (`10-16-G2`, Legacy 65%, mnożnik 0.5, korekta 0.10 pp — wygrana). Bez nowych danych.

Obie zostają otwarte.

## 8. Status i następne kroki

- Dokument **opisowy**. Nie zmienia metody, parametrów ani żadnej predykcji. T1–T5 to notatki QA w rozumieniu §22; żadna predykcja nie jest wykluczana.
- **Licznik:** gpt × v2 = **55 rozliczonych** (etap 50–99, wstępny), **37/100 obserwacji β** do K1. claude × v2 = 0 z założenia. v1 zamrożone.
- Stan merytoryczny bez zmian względem EPL: v2.0 robi korekty o rząd mniejsze niż ruch rynku, więc 0 BET jest skutkiem konstrukcji, a jedynym pytaniem, na które ta wersja może odpowiedzieć, jest β przy K1.

**Do zrobienia przed następnym turniejem:**

1. **Operator — decyzja z sekcji 5** (mapy Thunderpick 2026 w oknach v2 po zakończeniu wydarzenia), jednym zdaniem w `docs/decisions/`.
2. **Operator — T3:** potwierdzić, że trzy closingi 1.26/3.50 z 14.10 to osobne odczyty.
3. **T2:** errata do `reports/2026-10-15-gpt.md` z potwierdzoną godziną kursów.
4. **T1 i T3 (zapis):** jeśli zatwierdzone — `null` dla brakującego okna oraz pole `closing_timestamp` w szablonie i schemacie. Bez wpływu na wycenę i na istniejące wpisy.
5. Zakres kolejnego turnieju (kandydaci z decyzji E2: PGL Masters Bucharest od 22.10, jeśli w zakresie, albo IEM Beijing 2–8.11) — sprawdzany jak zawsze przed pierwszym raportem.
6. Następny audyt: po kolejnym turnieju tier-1 albo przy n ≈ 75–85.
