# Edge — Raport zbiorczy: StarLadder StarSeries Fall 2026

**Turniej:** StarLadder StarSeries Fall 2026 (Barcelona), S-Tier, pula $500 000, 8 drużyn
**Format:** bez fazy grupowej — drabinka podwójnej eliminacji, wszystko BO3, wielki finał BO5
**Zakres:** 2026-09-17 – 2026-09-20 (4 dni, 14 meczów)
**Metoda:** v1 · **Gra:** cs2 · **Rynek odniesienia:** STS
**Mistrz:** Vitality (3:1 z Aurorą w finale) · **Status dokumentu:** opisowy, nie walidacyjny

---

## 1. Zakres

Czternaście meczów, obaj agenci wycenili wszystkie. Cztery ćwierćfinały (17.09), dwa mecze dolnej drabinki i dwa półfinały (18.09), dwa mecze eliminacyjne, finał górnej i finał dolnej drabinki (19.09), finał konsolidacyjny i wielki finał (20.09).

Rytm był poranny: kursy STS przychodziły między 07:30 a 09:10, mecze startowały o 12:00. Dwa mecze, których pary rozstrzygały się w trakcie dnia (finał dolnej drabinki 19.09 i wielki finał 20.09), wyceniono w raportach uzupełniających `2026-09-19b` i `2026-09-20b` — zgodnie z precedensem z 10.09.

**Wyniki końcowe:** 1. Vitality, 2. Aurora, 3. FURIA, 4. MIBR. Vitality przegrali finał górnej drabinki z Aurorą 1:2, po czym wygrali finał konsolidacyjny z FURIĄ 2:0 i wielki finał 3:1 (Anubis 13:4, Inferno 11:13, Mirage 13:4; czwartej mapy nie udało się zweryfikować w źródłach w chwili pisania). ZywOo skończył finał z ratingiem 1.50, w tym 2.85 na Mirage.

Turniej dał też dwie sensacje: NRG (#50 HLTV) wygrali z MOUZ 2:1 na otwarcie, a Aurora wyeliminowała NAVI 2:0 i doszła do pierwszego finału w nowym składzie.

## 2. Kalibracja porównawcza (rdzeń)

| Agent | n | Trafienia | Brier | Rynek | Różnica | Średni ruch vs de-vig | Pick = faworyt |
|---|---:|---:|---:|---:|---:|---:|---:|
| claude | 14 | 11 (79%) | 0.2004 | 0.2014 | **−0.0010** | +1.29 pp | 13/14 |
| gpt | 14 | 9 (64%) | **0.1969** | 0.2014 | **−0.0045** | +2.67 pp | 7/14 |

**Obaj agenci wypadli lepiej od rynku, gpt wyraźniej.** I od razu zastrzeżenie, które w tym projekcie powtarza się co turniej: przy n=14 różnice rzędu 0.001–0.005 nie znaczą nic. Raport z checkpointu 150 pokazał, że nawet przy n=150 błąd standardowy różnicy wynosi ok. 0.0023, czyli dwa razy więcej niż cała przewaga gpt z tego turnieju.

**Rozbicie na dni** pokazuje tę zmienność wprost:

| Dzień | claude Brier / rynek | gpt Brier / rynek |
|---|---|---|
| 17.09 (ćwierćfinały) | 0.2792 / 0.2871 | 0.2829 / 0.2871 |
| 18.09 | 0.0849 / 0.0960 | 0.0874 / 0.0960 |
| 19.09 | 0.2914 / **0.2766** | 0.2680 / 0.2766 |
| 20.09 (finały) | 0.0919 / **0.0907** | 0.1017 / **0.0907** |

Trzy dni na plus, jeden na minus u claude'a; u gpt odwrotny układ w ostatnim dniu. Gdyby turniej skończył się po 18.09, obaj wyglądaliby dużo lepiej.

**Gałąź drabinki** (mecze górnej drabinki wobec dolnej i finałów):

| Agent | Górna (n=8) | Dolna / eliminacyjne (n=6) |
|---|---|---|
| claude | 0.2378 / rynek 0.2420 | 0.1506 / rynek **0.1474** |
| gpt | 0.2400 / rynek 0.2420 | 0.1394 / rynek 0.1474 |

Mecze na wylot były łatwiejsze do wyceny dla obu (niższy Brier po obu stronach), bo miały bardziej jednoznacznych faworytów. Nie widać tu żadnego wzorca „mecze eliminacyjne wyceniam inaczej”.

## 3. Dywergencje — sześć meczów, w których agenci wskazali różnych zwycięzców

| Data | Mecz | claude | gpt | Kto miał rację |
|---|---|---|---|---|
| 17.09 | FURIA vs MIBR | FURIA | MIBR | **claude** |
| 18.09 | NRG vs Aurora | Aurora | NRG | **claude** |
| 19.09 | MIBR vs NRG | MIBR | NRG | **claude** |
| 19.09 | MOUZ vs FURIA | MOUZ | FURIA | **gpt** |
| 19.09 | Aurora vs Vitality | Vitality | Aurora | **gpt** |
| 20.09 | Aurora vs Vitality | Vitality | Aurora | **claude** |

**claude 4:2 w bezpośrednich sporach, a mimo to gorszy Brier.** To nie jest paradoks, tylko konsekwencja tego, jak liczy się Brier: gpt brał underdogów przy ocenach bliskich 50%, więc jego pomyłki były tanie, a trafienia drogie. claude brał faworytów (13 picków na 14) i płacił pełną cenę za każdą pomyłkę. Ten sam mechanizm opisuje sekcja 5 raportu z checkpointu.

Obaj postawili na Aurorę przed meczem z NAVI 17.09 — i to była moja największa dywergencja z rynkiem w całym projekcie (+5.0 pp). Aurora wygrała 2:0. Ale kurs zamknięcia poszedł w drugą stronę (2.04 → 2.08), więc rynek do końca nie potwierdził tej oceny.

## 4. BET, CLV i snapshoty

**0 BET u obu agentów przez cały turniej.** Czternaście meczów, żadnej wartości powyżej progu. Najbliżej było przy MOUZ–FURIA 19.09: **−0.6%**, czyli praktycznie cena fair, ale nadal poniżej zera.

Snapshoty kursów zamknięcia: **11 z 14 meczów** u obu agentów. Brakuje trzech: MOUZ–NRG i Vitality–magic z 17.09 oraz MIBR–FURIA z 19.09. Zgodnie z zasadą zostają `null` na stałe.

| Agent | Średni CLV picku | Linia poszła w stronę odejścia agenta |
|---|---:|---|
| claude | −0.07% | 1 z 3 |
| gpt | −0.13% | 2 z 6 |

Średni CLV praktycznie zerowy u obu. Marża STS trzymała się w paśmie **7.5–8.3%** przez wszystkie cztery dni, tak samo jak przez cały FISSURE — to już dwunasty dzień z rzędu w tym przedziale i przestaje być obserwacją turniejową, a staje się stałą tego bukmachera.

## 5. Wzorce turnieju

1. **Pierwsze odejście claude'a w stronę underdoga o +5 pp trafiło, ale nie zostało potwierdzone przez linię.** Aurora wygrała z NAVI, a kurs zamknięcia poszedł przeciwnie. Wynik i CLV rozjechały się — dowód, że jedno nie zastępuje drugiego.
2. **Rynek szybko i poprawnie przetrawił sensację NRG.** Po wygranej z MOUZ (#50 pokonuje #3) NRG z 13.1% przeciw MOUZ skoczyli na 24.9% przeciw Aurorze. Po rozbiciu na czynniki większość tego skoku tłumaczy zmiana przeciwnika, a nie przeszacowanie formy. Kolejne dwa mecze NRG przegrali — rynek miał rację.
3. **Statystyka map z trzech miesięcy zawiodła na Anubisie.** Vitality mieli tam 20% wygranych w oknie trzymiesięcznym, a w tym turnieju wygrali na Anubisie dwa razy w dwa dni (z FURIĄ 13:8 i w finale 13:4), po tym jak wcześniej przegrali go z Aurorą. Próbka pięciu map nie opisuje przygotowania zespołu na konkretny turniej.
4. **Trzy z czterech ostatnich wycen claude'a stanęły dokładnie na de-vigu** (ruchy 0.0, +4.2, −0.2, −0.2 pp — odejście tylko przy MOUZ–FURIA, gdzie rozjazd map poolu i VRS dało się policzyć). To zmiana zachowania w trakcie turnieju, po diagnozie z checkpointu: odchodzić od rynku tylko przy policzalnym rozjeździe. Konsekwencja jest jednak jasna — kto kopiuje rynek, ten go nie pobije.

## 6. Błędy operacyjne

1. **Błędny opis drabinki w `2026-09-19b-claude.md`.** Napisałem, że zwycięzca finału dolnej drabinki wchodzi prosto do wielkiego finału, a przegrany kończy na 3. miejscu. W rzeczywistości był jeszcze finał konsolidacyjny, a MIBR skończyli czwarci. Poprawione sekcją erratum na końcu tamtego pliku; wycena P-2026-09-19-C4 bez zmian.
2. **Trzy brakujące snapshoty zamknięcia** — dwa z pierwszego dnia i jeden z wieczornego meczu 19.09.
3. **Kursy porównawcze z HLTV: zerowy wynik.** Nowy krok wprowadzony 19.09 nie dał ani jednego odczytu — tabela na stronie meczu była pusta albo pokazywała jednego dostawcę bez kursów. Do rozstrzygnięcia, czy ten krok ma sens, czy go wycofać.

## 7. v1 per turniej — cała historia metody

Ta sekcja nie dotyczy tylko StarSeries; pokazuje, jak wynik v1 zachowywał się turniej po turnieju. Liczby to Brier agenta wobec de-vigowanego rynku na tej samej próbce.

| Turniej | n | claude | rynek | różnica | gpt | rynek | różnica |
|---|---:|---:|---:|---:|---:|---:|---:|
| BLAST Bounty S2 (21.07–02.08) | 30 / 27 | 0.2464 | 0.2405 | **+0.0060** | 0.2189 | 0.2173 | **+0.0016** |
| EWC 2026 (12–23.08) | 56 / 56 | 0.1990 | 0.2007 | −0.0017 | 0.1973 | 0.2006 | −0.0033 |
| BLAST Open Porto (26.08–06.09) | 29 / 29 | 0.1691 | 0.1657 | **+0.0034** | 0.1630 | 0.1657 | −0.0027 |
| FISSURE Playground 3 (08–13.09) | 29 / 29 | 0.2596 | 0.2627 | −0.0031 | 0.2696 | 0.2627 | **+0.0068** |
| StarSeries Fall (17–20.09) | 14 / 14 | 0.2004 | 0.2014 | −0.0010 | 0.1969 | 0.2014 | −0.0045 |

**Znak różnicy zmienia się z turnieju na turniej u obu agentów.** claude: +, −, +, −, −. gpt: +, −, −, +, −. Nie ma turnieju, po którym dałoby się powiedzieć „od tego momentu metoda działa”, ani takiego, po którym można by powiedzieć, że nie działa. Amplituda pojedynczego turnieju (do 0.007) jest przy tym większa niż cała różnica na próbce 150 (0.0002–0.0003), co jest najprostszym możliwym obrazem tego, dlaczego checkpoint niczego nie rozstrzygnął.

Uwaga do odczytu: różnice per turniej liczone są na wszystkich rozliczonych predykcjach z danego okna, więc próbka claude'a (158) jest tu większa niż 150 użyte do werdyktu. Werdykt pozostaje ten z pierwszych 150 i nie jest przeliczany.

## 8. Status i zastrzeżenia

- To dokument **opisowy**. Nie zmienia metody, progów ani wersji. Werdykt v1 zapadł osobno w `reports/summaries/v1-checkpoint-150.md`.
- Wszystkie liczby pochodzą z `data/bets.json` po rozliczeniu turnieju, nie z raportów dziennych.
- Przy n=14 żadna liczba z sekcji 2 i 3 nie jest podstawą do zmiany czegokolwiek.
- Stan licznika po turnieju: **claude × v1 = 158 rozliczonych, gpt × v1 = 155.**

## 9. Następne kroki

1. **Przerwa w kalendarzu tier-1 do ok. 3.10** (ESL Pro League S24, Katowice). Do sprawdzenia, czy PGL Fall (1–11.10) mieści się w zakresie.
2. **Decyzje operatora** z `docs/decisions/2026-09-19-v1-checkpoint-150.md`: realne pieniądze dla gpt, kierunek (v2 shadow albo zamknięcie), miara główna v2.
3. **Jeśli v2:** przeczytanie specyfikacji v2, zamrożenie definicji na papierze przed 3.10, dodanie `closing_odds_opponent` do schematu i zmiana szablonu raportu na dwie wyceny na tych samych kursach.
4. **Do rozstrzygnięcia:** czy utrzymujemy krok z kursami porównawczymi z HLTV (na razie zero odczytów).
