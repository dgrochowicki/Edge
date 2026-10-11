# Edge — Raport zbiorczy i audyt v2: ESL Pro League Season 24

**Turniej:** ESL Pro League Season 24 (Katowice), S-Tier, 16 drużyn
**Format:** Swiss (5 rund, wszystko BO3, 3–7.10) → playoff single elimination dla 8 drużyn (9–11.10), mecz o 3. miejsce, wielki finał BO5
**Zakres:** 2026-10-03 – 2026-10-11 (8 dni meczowych, 8.10 wolne), **41 meczów, 41 predykcji** `P-2026-10-03-G1` … `P-2026-10-11-G2`
**Metoda:** v2.0 (frozen, `docs/METHOD_V2.md`) · **Wykonawca:** gpt · **Audytor:** claude (§21) · **Rynek odniesienia:** STS
**Mistrz:** Vitality (3:0 z MOUZ w finale) · **Status dokumentu:** opisowy + audyt wykonania, nie walidacyjny

To pierwszy turniej v2 i pierwszy audyt w roli z §21: nie liczę równoległej wyceny, tylko przeliczam od zera to, co policzył gpt, i liczę metryki z księgi. Wszystkie liczby pochodzą z `data/bets.json` i `data/form/` po rozliczeniu finału (commit `1fb158e`), nie z raportów dziennych.

---

## 0. W skrócie

1. **Wykonanie metody jest czyste.** 41/41 predykcji przeliczonych od surowych okien daje te same `p_market`, FreshMapScore, korekty, fair i value. Jeden rozjazd fair o 0.01 (bez wpływu na decyzję), jeden błędny wynik mapy w cache (bez wpływu na fair). Walidator: 0 błędów.
2. **Wynik: v2 minimalnie lepsze od rynku, w granicach szumu.** Brier 0.18927 vs rynek 0.18983, przewaga **+0.00056**, 95% CI [−0.00176, +0.00288].
3. **Cała ta przewaga pochodzi z czterech meczów Legacy z karą −2 pp za stand-ina**, nie z sygnału fresh-form. Sam fresh-form (32 mecze bez kary rosterowej): **−0.00049**, czyli gorzej od rynku. Przy n=41 to tylko opis.
4. **0 BET, najwyższe value w turnieju 0.0%.** Mediana korekty to 0.5 pp; BET wymagał średnio kilku punktów.
5. **Najważniejsze ustalenie audytu jest strukturalne, nie turniejowe (sekcja 6):** przy korektach tej wielkości kryterium Brierowe v2.0 nie ma praktycznie żadnej mocy, a reguła zatrzymania z §20 (moja propozycja) zadziała przy n=150 niemal na pewno, niezależnie od tego, czy sygnał istnieje. To wymaga decyzji operatora **przed** checkpointem.

## 1. Zakres i kompletność

Turniej miał 33 mecze Swiss (8+8+8+6+3) i 8 meczów playoff (4 ćwierćfinały, 2 półfinały, mecz o 3. miejsce, finał). Wszystkie 41 są w księdze — pokrycie kalendarza pełne, żadnego meczu poza zakresem. PGL Fall 2026, które przez chwilę kolidowało w kalendarzu, zostało odwołane (`docs/decisions/2026-09-23-v2-freeze.md`), więc nie było drugiego aktywnego turnieju tier-1 w tym oknie.

**Wyniki końcowe:** 1. Vitality, 2. MOUZ, 3. Aurora, 4. Spirit. Ćwierćfinały: Aurora 2:0 1win, Vitality 2:0 PARIVISION, MOUZ 2:0 FURIA, Spirit 2:0 Falcons. Półfinały: Vitality 2:1 Aurora, MOUZ 2:1 Spirit. Mecz o 3. miejsce wygrała Aurora, finał Vitality 3:0.

Turniej był nieprzewidywalny: **12 z 41 meczów wygrał underdog rynkowy** (de-vig zakładał ok. 13, więc w normie). Wyjątkiem był 6.10 — 5 z 6 meczów wygrał underdog, a Brier rynku tego dnia wyniósł 0.379.

**Decyzje:** 41 × PASS, 0 BET. Pewność: 3 (7×), 4 (9×), 5 (19×), 6 (6×). Marża STS: 7.54–8.93%, średnio 8.09%.

## 2. Audyt wykonania (METHOD_V2 §21)

### Co sprawdziłem

Dla każdej z 41 predykcji, bez korzystania z liczb gpt jako wejścia:

- de-vig z obu kursów → `p_market`;
- okno formy obu drużyn z `data/form/<dzień>.json`: wiek map ≤ 30 dni, kolejność od najnowszych, limit 8 serii / 20 map, `weight_recency` = 0.5^(dni/14), `weight_opponent` z tabeli §8, `weight_roster`, reguła pokrycia 80%, spójność wyniku mapy z rundami;
- FreshMapScore z surowego okna, mnożnik próbki (§6: 0.5 poniżej 3 serii / 6 map, 0 poniżej 2 / 4), `fresh_adjustment_pp`, kary rosterowe, cap ±5 pp, `p_v2`, fair, value, BET/PASS;
- spójność wszystkich 188 unikalnych map między plikami dni i między perspektywami obu drużyn (wynik A = odwrócony wynik B);
- pasma rankingowe tego samego przeciwnika na tę samą datę we wszystkich plikach;
- zewnętrznie: 13 map z ćwierćfinałów i półfinałów wobec opublikowanych wyników, oraz klasyfikacja rosterowa Legacy;
- `scripts/validate_bets.py`.

### Wynik

| Kontrola | Wynik |
|---|---|
| `p_market` (41) | 41/41 zgodne |
| FreshMapScore (82 drużyno-dni) | wszystkie zgodne co do 0.002 |
| Wagi, wiek, limity okien, reguła 80% | bez zastrzeżeń; wszystkie okna `round_diff` |
| `fresh_adjustment_pp`, mnożniki próbki, cap | 41/41 zgodne |
| fair / value / decyzja | 40/41 zgodne, 1 rozjazd fair o 0.01 (A3) |
| Spójność 188 map między plikami | 1 rozjazd (A4) |
| Pasma rankingowe | 0 rozjazdów |
| Mapy playoff vs źródło zewnętrzne (13) | 13/13 zgodne w `2026-10-10.json`; ta sama mapa błędnie w `2026-10-11.json` (A4) |
| Legacy: arT (IGL) nieobecny, analityk bobz jako stand-in | potwierdzone w źródłach |
| Walidator | 41 predykcji, 0 błędów, 0 `legacy_rounding` |

### Ustalenia

**A1. Zaokrąglenie fair do dwóch miejsc częściowo nadpisuje korektę metody.** §13 każe liczyć fair z `p_v2` do dwóch miejsc, a §16 wymaga `estimated_probability == round(1/fair, 4)`. Razem oznacza to, że w księdze nie ma `p_v2`, tylko jego zaokrąglony cień. Skala: średnio 0.09 pp, maksymalnie 0.28 pp — przy medianie korekty 0.5 pp to nie jest kosmetyka. W `P-2026-10-03-G1` korekta +0.2 pp zamieniła się w −0.03 pp (znak odwrócony), a w trzech meczach z zerową korektą (`10-03-G3`, `10-03-G4`, `10-04-G6`) `estimated_probability` różni się od rynku o −0.25, −0.13 i +0.11 pp, choć metoda nie zrobiła nic. Najsilniej działa przy krótkich faworytach, gdzie krok 0.01 w kursie to duży krok w prawdopodobieństwie.
Wpływ na wynik turnieju jest mały (przewaga +0.00056 na `estimated_probability`, +0.00048 na niezaokrąglonym `p_v2`), ale przy n=150 i korektach tej wielkości to jest ten sam rząd co sygnał, którego szukamy. Sprzeczność siedzi w samej zamrożonej specyfikacji, więc nie jest błędem gpt. **Propozycja do decyzji:** zapisywać `p_v2` jako osobne pole (4 miejsca) i liczyć metryki §18 na nim. To zmiana schematu i raportowania, nie parametru metody — każdy wpis da się odtworzyć wstecz z `p_market` i `total_adjustment_pp`.

**A2. Brak reguły wyboru picku.** Ani metoda, ani szablon nie mówią, którą stronę zapisać jako pick. W praktyce gpt brał stronę, w którą idzie korekta (35 z 36 meczów z korektą). Wyjątek: `P-2026-10-10-G1` — pick Aurora z value −14.5%, podczas gdy Vitality miało −5.6%. Na Brier i metrykę ruchu linii to nie wpływa (obie są symetryczne), ale może ukryć BET po drugiej stronie. **Propozycja:** pick = strona z wyższym value. To doprecyzowanie, nie zmiana parametru.

**A3. Precyzja `fresh_adjustment_pp` zmieniła się w trakcie turnieju.** Do 9.10 zapis do 0.1 pp, od 10.10 do czterech miejsc. W `P-2026-10-05-G3` fair 1.45 wynika z niezaokrąglonej korekty, a z zapisanej wychodzi 1.46. Wpływ na decyzję: żaden. **Propozycja:** jedna stała precyzja w szablonie (np. 4 miejsca jak dla prawdopodobieństw).

**A4. Błędny wynik mapy w cache.** FURIA–MOUZ, Nuke, 9.10: `2026-10-10.json` ma poprawnie 13:10 dla MOUZ, `2026-10-11.json` ma 13:11. Po poprawce FreshMapScore MOUZ w finale: 2.7978 zamiast 2.716, `p_v2` Vitality 0.6846 zamiast 0.6850, fair bez zmian (1.46). Zgodnie z §22 i `data/form/README.md` — tylko notatka QA, plik i predykcja zostają bez zmian.

**A5. Playoff liczony z odziedziczonego cache.** Raporty z 10.10 i 11.10 mówią wprost, że pasma rankingowe wzięto z wcześniejszego cache, a składów nie potwierdzono niezależnie; wpisy mają odpowiednie flagi `data_quality`. Pasma okazały się spójne z resztą cache. Składów playoffowych nie weryfikowałem osobno, więc flagi zostają aktualne. Postawione poprawnie — tak to ma wyglądać, gdy czegoś nie da się sprawdzić.

**Do O1 (podwójne liczenie Legacy) — uwaga interpretacyjna.** Nieobecność IGL-a ze stand-inem uruchomiła jednocześnie reset okna (§10, zmiana IGL) i karę −2 pp (§10, stand-in). Dosłownie czytana metoda wymaga obu, więc wykonanie jest poprawne. Ale zdanie z §10 „wszystko inne obsługują reguły okna, dodatkowa kara byłaby podwójnym liczeniem” sugeruje, że autorzy (w tym ja) nie przewidzieli przypadku, w którym jeden fakt trafia w obie reguły. Kandydat do doprecyzowania w v2.1, nie teraz.

## 3. Kalibracja wobec rynku (§18)

| Próbka | n | Brier v2 | Brier rynku | Przewaga (rynek − v2) |
|---|---:|---:|---:|---:|
| **Cały turniej** | 41 | 0.18927 | 0.18983 | **+0.00056** |
| Swiss | 33 | 0.19155 | 0.19127 | −0.00028 |
| Playoff | 8 | 0.17989 | 0.18391 | +0.00402 |
| \|korekta\| ≥ 1 pp | 12 | 0.20040 | 0.20593 | +0.00552 |
| \|korekta\| < 1 pp | 29 | 0.18467 | 0.18317 | −0.00150 |
| Z karą rosterową (Legacy) | 4 | 0.21818 | 0.22827 | +0.01009 |
| Bez kary rosterowej, z korektą fresh | 32 | — | — | −0.00049 |

95% CI przewagi (bootstrap, 20 000 losowań): **[−0.00176, +0.00288]**. Zawiera zero.

**Rozbicie na dni:** 3.10 +0.0007, 4.10 +0.0001, 5.10 +0.0005, 6.10 −0.0016, 7.10 −0.0034, 9.10 +0.0030, 10.10 +0.0108, 11.10 −0.0007. Znak zmienia się z dnia na dzień — ten sam obraz co przy v1.

**Odporność:** usunięcie dwóch najbardziej dodatnich obserwacji (`10-06-G6` i `10-03-G2`, oba to mecze Legacy z karą) odwraca znak przewagi na **−0.0004**. Przy kryterium 3 z §20 taki wynik nie przeszedłby testu — przy n=41 to tylko ilustracja.

**Kalibracja w kubełkach** (wszystko sprowadzone do strony faworyta):

| Przedział | n | śr. v2 | śr. rynek | trafienia |
|---|---:|---:|---:|---:|
| 50–60% | 12 | 0.563 | 0.565 | 0.500 |
| 60–70% | 13 | 0.650 | 0.647 | 0.769 |
| 70–80% | 6 | 0.732 | 0.731 | 0.667 |
| 80–90% | 8 | 0.841 | 0.833 | 0.875 |
| 90–100% | 2 | 0.909 | 0.911 | 1.000 |

v2 i rynek różnią się w każdym kubełku o mniej niż 1 pp. Średnie odchylenie od rynku: **0.67 pp**, mediana bezwzględnej korekty: **0.50 pp**, największa: 2.2 pp (`10-09-G2`). Cap ±5 pp ani cap fresh ±4 pp nie zadziałał ani razu.

**Kierunek korekty a wynik:** w 20 z 36 meczów z niezerową korektą wygrała strona, w którą korekta przesunęła cenę (56%).

## 4. Ruch linii i snapshoty zamknięcia (§17–18)

**Pokrycie zamknięciem po obu stronach: 33/41 (80%).** Brakuje: `10-03-G1`, `10-03-G2`, `10-04-G3`, `10-04-G4`, `10-06-G1`, `10-06-G2`, `10-09-G1`, `10-09-G2` — wszystkie `null` na stałe.

| Próbka główna §18 | n | Średni ruch w stronę korekty | 95% CI | w stronę / przeciw / bez ruchu |
|---|---:|---:|---|---|
| \|korekta\| ≥ 1 pp | 9 | +0.17 pp | [−1.22, +1.60] | 4 / 3 / 2 |
| \|korekta\| ≥ 3 pp | 0 | — | — | — |
| każda niezerowa korekta (pomocniczo) | 28 | −0.01 pp | [−0.76, +0.72] | 12 / 10 / 6 |

Poniżej n=100 metryka jest wyłącznie opisowa. Kontekst: rynek ruszał się do zamknięcia średnio o ok. 1.4 pp w jedną lub drugą stronę, czyli prawie trzy razy więcej niż typowa korekta v2.

Na 33 meczach z zamknięciem: Brier kursu otwarcia 0.18303, v2 0.18233, **kursu zamknięcia 0.18143**. Rynek przy zamknięciu był lepszy od v2 — tak jak powinien.

## 5. Pytania z `docs/audit/2026-10-04-epl-s24-obserwacje.md`

Obie hipotezy dostały w tym turnieju pierwsze dane. Żadna nie dostała odpowiedzi.

**O1 — kara za stand-ina.** Cztery przypadki, wszystkie Legacy (arT nieobecny przez cały turniej):

| Mecz | Kara idzie w stronę | Wynik | Ruch linii do zamknięcia |
|---|---|---|---|
| `10-03-G2` Legacy–PARIVISION | PARIVISION | trafiony | brak closingu |
| `10-04-G1` ShindeN–Legacy | ShindeN | nietrafiony | 0.0 pp |
| `10-05-G4` Legacy–1win | 1win | trafiony | +1.0 pp w stronę kary |
| `10-06-G6` Legacy–M80 | M80 | trafiony | +4.1 pp w stronę kary |

Kierunek kary 3/4, przewaga Brier na tej podpróbie +0.010, rynek dwa razy z trzech poszedł w stronę kary. To przeciwne do hipotezy „rynek już to wycenił, kara to szum” — ale cztery mecze jednej drużyny w jednym turnieju to jeden przypadek, nie cztery. Dwa z tych meczów Legacy przegrało jako faworyt rynku, więc część efektu to po prostu słaby turniej Legacy.

**O2 — dominacja jednej serii w krótkich oknach.** Podział predykcji z korektą fresh według maksymalnego udziału pojedynczej serii w wadze okna (pick lub przeciwnik):

| Grupa | n | Przewaga Brier | Ruch linii (n) |
|---|---:|---:|---|
| udział > 50% | 11 | +0.0012 | +0.68 pp (8) |
| udział ≤ 50% | 23 | +0.0002 | −0.30 pp (19) |

Kierunek przeciwny do hipotezy (krótkie okna wypadły lepiej), ale przy n=11 nic z tego nie wynika. Problem sam się rozwiązywał w trakcie turnieju: od 7.10 żadna drużyna nie miała już okna zdominowanego przez jedną serię, bo przybywało map z samego EPL.

Obie obserwacje zostają otwarte do kolejnego audytu.

## 6. Moc statystyczna v2.0 — ustalenie wymagające decyzji

To jest najważniejsza część raportu i nie zależy od wyników tego turnieju, tylko od wielkości korekt, które metoda faktycznie produkuje.

**Kryterium Brierowe.** Jeżeli `p_v2` byłoby dokładnie prawdziwym prawdopodobieństwem, oczekiwana przewaga Brier nad rynkiem równa się średniemu kwadratowi korekty. Przy korektach z EPL to **0.00008**. Odchylenie standardowe różnicy Brier na jeden mecz wynosi ok. 0.0076, więc przy n=150 połowa szerokości 95% CI to ok. **0.0012** — piętnaście razy więcej niż cały możliwy sygnał. Żeby CI wykluczyło zero przy idealnie trafnej metodzie, potrzeba rzędu **30 000 predykcji**. Nawet gdyby prawdziwy efekt był dwa razy większy niż korekta (współczynnik 0.5 za mały), potrzeba ok. 10 000.

**Reguła zatrzymania.** §20 mówi: jeśli przy checkpoincie CI zawiera zero, a jego połowa szerokości jest ≤ 0.003, ogłaszamy „brak wykrywalnej przewagi” i kończymy. Już przy n=41 połowa szerokości wynosi 0.0023. Przy n=150 będzie ok. 0.0012. **Ta reguła zadziała więc praktycznie na pewno, niezależnie od tego, czy sygnał fresh-form istnieje.** Zaproponowałem ją przy freezie, zakładając korekty bliższe capom ±4–5 pp. Rzeczywista mediana to 0.5 pp, bo FreshDiff między drużynami tier-1 to zwykle 0.5–2.3 rundy (mediana 1.0), a współczynnik 0.5 zmniejsza to o połowę. To był mój błąd w ocenie, nie wykonania gpt.

**Metryka ruchu linii jest jedyną z realną mocą.** Przy rozrzucie ruchów ok. 1.9 pp i n=100 błąd standardowy średniej to ok. 0.2 pp — wystarczy, żeby wykryć rynek idący w stronę korekty choćby o jej jedną trzecią. Problem jest w tempie: próbka główna (zamknięcie + |korekta| ≥ 1 pp) urosła w tym turnieju o **9**. Przy tym tempie n=100 to ok. 11 turniejów, czyli mniej więcej rok.

**BET.** W 17 z 41 meczów BET był arytmetycznie osiągalny w granicach capu ±5 pp (najtańszy: ShindeN przy 11.60, wystarczyło +1.3 pp). Faktyczne korekty nie zbliżyły się do żadnego z tych progów, a w kilku najtańszych przypadkach drużyna-underdog nie miała w ogóle okna w zakresie (§12 → korekta 0). 0 BET jest skutkiem konstrukcji, nie dyscypliny — zgodnie z tym, co §13 przewidywał.

**Czego tu nie proponuję:** zmiany współczynnika 0.5, capów ani jakiegokolwiek parametru na podstawie tych 41 wyników. To byłoby dopasowanie do danych.

**Co proponuję do decyzji operatora, przed kolejnym turniejem:**

1. **Uznać metrykę ruchu linii za rozstrzygającą dla v2.0**, a Brier za opisowy. Argument opiera się na mocy, policzonej z wielkości korekt — nie na tym, która metryka dziś wygląda lepiej (obie są w szumie). Wymaga to zmiany §20, więc formalnie v2.1 z tymi samymi parametrami wyceny.
2. **Zawiesić regułę zatrzymania z §20** albo przeformułować ją na metrykę ruchu linii — w obecnej postaci jest automatem do werdyktu „brak przewagi”.
3. **Pokrycie zamknięciem jest teraz wąskim gardłem całego projektu.** 80% to dobry wynik jak na best-effort, ale każdy brakujący snapshot przy |korekta| ≥ 1 pp to strata obserwacji z jedynej metryki, która może coś rozstrzygnąć. Jeżeli czas jest ograniczony, priorytet z decyzji z 23.09 (najpierw mecze z największą korektą) jest właściwy — warto go stosować ściśle.
4. **A1–A3** jako zmiany schematu i szablonu (pole `p_v2`, reguła picku, stała precyzja), bez zmiany wyceny.

Jeśli wolisz zostawić v2.0 bez zmian do checkpointu — to też jest spójna decyzja, tylko z góry wiadomo, jak skończy się Brier przy n=150.

## 7. Status i zastrzeżenia

- Dokument **opisowy**. Nie zmienia metody, parametrów ani żadnej predykcji. Ustalenia A1–A5 są notatkami QA w rozumieniu §22; żadna predykcja nie jest wykluczana.
- Przy n=41 żadna liczba z sekcji 3–5 nie jest podstawą do zmiany czegokolwiek. Sekcja 6 jest wyjątkiem, bo nie zależy od wyników meczów.
- Stan licznika: **gpt × v2 = 41 rozliczonych** (etap 0–49, zbieranie). claude × v2 = 0 z założenia (§21). v1 zamrożone bez zmian.

## 8. Następne kroki

1. **Decyzja operatora w sprawie sekcji 6** (metryka rozstrzygająca, reguła zatrzymania) — najlepiej przed następnym turniejem tier-1, żeby nie zapadała po obejrzeniu kolejnych wyników.
2. **A1–A3:** jeśli zatwierdzone, aktualizacja `REPORT_TEMPLATE.md` i schematu `data/bets.json` (pole `p_v2`; ewentualne uzupełnienie wstecz dla 41 wpisów jest deterministyczne i nie zmienia żadnej predykcji).
3. **A4:** notatka QA do `docs/audit/` albo dopisek do istniejącej notatki EPL.
4. **O1 i O2** zostają otwarte do następnego audytu (co turniej albo co 20–30 predykcji).
5. Następny audyt: po kolejnym turnieju tier-1 albo przy n ≈ 60–70.
