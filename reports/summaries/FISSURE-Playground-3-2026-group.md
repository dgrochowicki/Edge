# Edge — Raport fazowy: FISSURE Playground #3, faza grupowa

**Turniej:** FISSURE Playground #3 (Suzhou, Chiny), S-Tier / Valve Tier 1, pula $1 000 000, 16 drużyn
**Faza:** grupowa (dwie grupy GSL po 8 drużyn, double-elimination, wszystkie mecze BO3)
**Zakres:** 2026-09-08 – 2026-09-10 (3 dni)
**Metoda:** v1 · **Gra:** cs2 · **Rynek odniesienia:** STS (kursy podawane manualnie)
**Status dokumentu:** opisowy. To NIE jest walidacja metody — patrz sekcja „Status i zastrzeżenia".

---

## 1. Zakres i metodyka

Obaj agenci generowali niezależne predykcje moneyline dla każdego meczu tier-1 fazy grupowej. Wszystkie mecze logowane niezależnie od decyzji (PASS lub BET). Metoda: de-vig kursów STS → oszacowanie fair probability → value % → decyzja PASS/BET → log.

Struktura fazy: dwie grupy po 8 drużyn, GSL double-elimination, po trzy awansujące. 08.09 runda otwarcia górnych drabinek, 09.09 druga runda górnych i pierwsza dolnych, 10.09 druga runda dolnych, finały górnych i finały dolnych. Do playoffów weszli BetBoom i Legacy (zwycięzcy grup), MIBR i FURIA (drudzy), G2 i Alliance (trzeci).

**Zmiana rytmu operacyjnego.** Dzień meczowy startował o 05:00, więc raporty powstawały wieczorem dnia poprzedniego, a nie rano dnia meczowego. `odds_timestamp` pozostał godziną odczytu kursów, a nie czasem raportu. Konsekwencja: dla wszystkich meczów o 05:00 i 08:00 snapshot kursu zamknięcia był poza zasięgiem — w tej fazie nie zebrano ani jednego `closing_odds` po stronie claude.

Predykcji rozliczonych w fazie: **claude 24, gpt 24.**

## 2. Kalibracja porównawcza (rdzeń)

Benchmark to Brier zde-vigowanego rynku na sparowanej próbce, nie 0.25.

**Faza grupowa FISSURE (24 predykcje każdy):**

| Agent | Brier | vs rynek (0.2760) | Trafienia | BET |
|-------|------:|------:|----------:|-----|
| claude | **0.2705** | **-0.0055** | 13/24 (54%) | 0W / 0L |
| gpt | 0.2849 | +0.0089 | 10/24 (42%) | 0W / 2L |

Pierwszy turniej w historii projektu, w którym **claude ma lepszy Brier od gpt** — i to nie minimalnie (0.0144). Jednocześnie pierwszy, w którym claude bije zde-vigowany rynek na pełnej fazie, a gpt wyraźnie od niego odstaje.

**Rozbicie dzienne:**

| Dzień | claude | gpt | rynek | trafienia claude |
|---|---:|---:|---:|---:|
| 08.09 | 0.2259 | 0.2276 | 0.2353 | 5/8 |
| 09.09 | 0.2808 | 0.3013 | 0.2803 | 5/8 |
| 10.09 | 0.3048 | 0.3257 | 0.3123 | 3/8 |

claude bije rynek w dniach 1 i 3, remisuje w dniu 2. gpt przegrywa z rynkiem w dniach 2 i 3.

**Kontekst, bez którego te liczby wprowadzają w błąd: 11 z 24 meczów (46%) skończyło się porażką faworyta rynku**, w tym dwa przy faworycie powyżej 90% (5star pokonali The MongolZ przy 90.2% i Astralis przy 91.1%). Trafność 54% to najniższy wynik claude w historii księgi i wynika z kształtu turnieju, nie z pogorszenia metody. Brier 0.2705 przy rynku 0.2760 mówi znacznie więcej niż 13/24.

**Mechanizm przewagi.** Przewaga claude nad rynkiem w tej fazie pochodzi niemal wyłącznie z systematycznie niższej pewności faworytów. Średni bias wobec de-vigu po stronie picku: claude **+0.24 pp**, gpt **+1.85 pp**. Na turnieju z 46% niespodzianek mniejsza pewność faworyta opłaca się mechanicznie. To nie jest umiejętność wyceny — to przesunięcie kalibracji, które trafiło w kształt turnieju, i na turnieju chalkowym ta sama liczba pokazałaby claude gorzej.

**Sygnał ostrzegawczy — niestabilność biasu w czasie.** Bias claude po dniach: **+0.83 pp → +1.36 pp → -1.47 pp**. Odwrócenie znaku między dniem 2 a 3 nastąpiło po dniu z trzema niespodziankami i zostało zgłoszone w raporcie dziennym z 09.09 **przed** poznaniem wyników dnia 3 — jako podejrzenie reagowania na świeże wyniki, nie jako metoda. To, że akurat zarobiło, nie zmienia diagnozy: metoda, której kalibracja przeskakuje o 2.8 pp z dnia na dzień, nie jest stabilna, a jej wynik na krótkim oknie jest nieodróżnialny od szczęścia.

**Narastająco (cała rozliczona próbka, per agent × method_version):**

| Agent × wersja | n | Brier | rynek | różnica | Trafienia |
|---|--:|------:|------:|------:|----------:|
| claude × v1 | 139 | 0.2153 | 0.2150 | **+0.0004** | 97/139 (69.8%) |
| gpt × v1 | 136 | 0.2097 | 0.2098 | **-0.0000** | 85/136 (62.5%) |

**To jest najważniejsza liczba w tym dokumencie.** Trzydniowa przewaga claude nad rynkiem zniknęła w całości próbki. Po 139 i 136 predykcjach **oba tory są nieodróżnialne od zwykłego przepisywania zde-vigowanej linii bukmachera** — różnice rzędu 0.0004 i 0.0000 przy tej wielkości próbki nie oznaczają nic. Pytanie do checkpointu nie brzmi już „który agent jest lepszy", tylko „czy v1 dodaje cokolwiek ponad rynek".

Warto też odnotować, że FISSURE to 24 ze 139 predykcji claude, czyli **17% całej próbki z jednego turnieju** o nietypowej charakterystyce (marża 8%, 46% niespodzianek, dwa faworyty 90%+ przegrane). Przy checkpointcie należy sprawdzić, czy wynik zbiorczy nie jest zniekształcony przez ten jeden event.

## 3. Decyzje BET

**claude: 0 BET w całej fazie (24 mecze). gpt: 2 BET, 0W/2L.**

Zakłady gpt, oba z 09.09, oba na underdoga:

| Mecz | Pick | Kurs | Closing | CLV | Wynik |
|---|---|---:|---:|---:|---|
| Legacy vs Alliance | Alliance | 3.70 | 3.50 | +5.7% | lost |
| PARIVISION vs FURIA | PARIVISION | 2.90 | 2.80 | +3.6% | lost |

Oba z **dodatnim CLV** i oba przegrane — pierwszy dzień 0-for-2 w historii księgi. Na czterech dotychczasowych BET-ach gpt z dodatnim CLV bilans wynikowy to 1W/3L; na całej księdze (oba tory) pięć takich BET-ów, 2W/3L. Przy n=4 i n=5 nie da się z tego wnioskować w żadną stronę — ani że CLV działa, ani że nie.

Odnotowana hipoteza alternatywna, do sprawdzenia na większej próbce: oba zakłady dotyczyły underdogów będących „historią dnia" po poprzedniej rundzie (Alliance po 2:0 z FaZe, PARIVISION po wygranej z TYLOO). Skrócenie ich ceny w retail booku może odzwierciedlać pieniądz rekreacyjny goniący świeżą formę, a nie informację ostrą — w takim przypadku dodatni CLV **nie** jest sygnałem przewagi. Zweryfikowanie tego wymaga porównania wyników BET-ów z dodatnim i ujemnym CLV, a mamy na to 9 obserwacji.

**BET wycofany przed publikacją (claude, 10.09).** Pozycja 5star @ 10.50 przeciw Astralis została policzona jako BET 1u (fair 8.00, value +31.2%), a następnie zmieniona na PASS przed commitem, po uzupełnieniu danych. Teza pierwotna stała na dwóch planach i oba okazały się nieprawdziwe: nie sprawdzono wyniku 5star–9z (porażka 3-13 i 4-13, siedem rund na dwóch mapach), a założenie „Astralis są istotnie słabsi od 9z" opierało się na VRS, podczas gdy formą na tym turnieju Astralis byli wyżej. Po korekcie ocena wyniosła 9.09% wobec breakevenu 9.52%.

5star wygrali. Zakład zarobiłby 9.5u (19 PLN). Odnotowanie tego wymaga dyscypliny w obie strony:

- Pojedyncza obserwacja przy kursie 10.50 nie rozstrzyga, czy 9.09% było dobrą oceną. Ta sama zasada obowiązuje tu, co przy CLV gpt.
- Liczba pierwotna (12.5%) była bliższa prawdy niż zrewidowana (9.09%), ale została uzyskana z fałszywych przesłanek. Poprawny proces przy prawdopodobnie przestrzelonej korekcie — nie sukces i nie porażka.
- Mocniejszy dowód niż wynik dał rynek: przeciw Astralis (#20 VRS) 5star szli po de-vigu 8.85%, następnego dnia przeciw G2 (**#8 VRS**, mocniejszemu) już 10.90%. Po skorygowaniu o siłę rywala to znacząca przecena w górę. Linia nie ruszyła przed meczem z Astralis — ruszyła po nim. To potwierdza niedowartościowanie 5star niezależnie od wyniku pojedynczego meczu.
- Utrzymanie BET-u dałoby także niższą stratę Brier na tym wpisie (0.7656 zamiast 0.8265).

**Wniosek procesowy, wdrożony:** przed oznaczeniem czegokolwiek jako BET wymagany jest komplet wyników obu zespołów z bieżącego turnieju **wraz z wynikami map**. Błąd nie leżał w progu ani w metodzie, tylko w niedokończonym researchu przed decyzją o realnych pieniądzach.

## 4. Dywergencje (bezpośrednie punkty sporne)

Agenci rozjechali się na **trzech** meczach z 24 — pozostałe 21 to identyczne picki. Wszystkie trzy dywergencje z 09.09 i wszystkie trzy rozstrzygnięte na korzyść claude:

| Mecz | claude | gpt | Zwycięzca |
|---|---|---|---|
| Legacy vs Alliance | Legacy ✓ | Alliance ✗ (BET) | Legacy |
| BetBoom vs Astralis | BetBoom ✓ | Astralis ✗ | BetBoom |
| PARIVISION vs FURIA | FURIA ✓ | PARIVISION ✗ (BET) | FURIA |

3/3 to za mało, żeby cokolwiek znaczyło, ale kierunek jest spójny z resztą fazy: gpt konsekwentnie przesuwał się mocniej w stronę underdoga (bias +1.85 pp vs +0.24 pp claude) i na tym turnieju kosztowało go to zarówno picki, jak i dwa zakłady.

**Dywergencja przy identycznych pickach.** Dzień 3 dostarczył czystszy dowód niż powyższa trójka: w wszystkich ośmiu meczach obaj agenci mieli **identyczne picki i identyczne wyniki**, a Brier różnił się o 0.0209 (claude 0.3048, gpt 0.3257). Cała różnica siedzi w pewności przypisanej faworytom, nie w typowaniu. To najlepszy dotąd izolowany pomiar tego, że tory rozjeżdżają się na kalibracji, a nie na wyborze strony.

## 5. Potwierdzone wzorce

- **Marża jako główny hamulec BET-ów.** Średnia marża STS w tej fazie: **7.94%** (zakres 7.5–8.4%) wobec 5–6% typowych dla okna BLAST Porto. Przy progu +8–10% oznacza to konieczność znalezienia ~16-18 punktów przewagi nad ceną surową. To wystarcza, by wytłumaczyć 0 BET w 24 meczach bez odwoływania się do ostrożności agenta.
- **Próg jako funkcja kursu (nowe).** Przy kursie 10.50 próg +8% odpowiada przesunięciu oceny o **1.5 pp**; przy kursie 1.60 to samo +8% wymaga **4.3 pp**. Stały próg procentowy jest więc strukturalnie łatwiejszy do przekroczenia na longshotach i sam generuje bias w stronę wysokich kursów, niezależnie od jakości ocen.
- **Opóźnienie wyceny (nowe).** Przy wieczornym rytmie wycena powstaje 10-18 godzin przed meczem. W dwóch przypadkach 10.09 wartość istniała przy pierwszym odczycie i zniknęła przed decyzją: Alliance przy 2.90 o 10:45 było praktycznie fair (-0.7%), przy 2.65 o 12:25 już -9.2%. To trzecia, niezależna oś problemu progu.
- **Brak CLV w tym oknie.** Zero zebranych `closing_odds` po stronie claude — konsekwencja meczów o 05:00 i 08:00. Zgodnie z protokołem pozostają `null` bez backfillu. Każda analiza CLV z tego turnieju opiera się wyłącznie na dwóch zakładach gpt.

## 6. Status i zastrzeżenia (WAŻNE)

- **To nie jest walidacja metody.** n=24 na fazę; przewaga claude nad rynkiem (-0.0055) mieści się w szumie tej wielkości próbki.
- **Checkpoint liczony per agent × wersja:** claude × v1 = **139/150**, gpt × v1 = **136/150**. Nie sumować torów.
- Playoffy FISSURE (11-13.09) to sześć drużyn, czyli pięć meczów — dowiozą claude do 144, gpt do 141. **Checkpoint 150 nie zostanie osiągnięty w tym turnieju**; brakujące predykcje przyjdą najwcześniej ze StarLadder StarSeries Fall od 17.09.
- Przewaga claude w tej fazie pochodzi z niższej pewności faworytów na turnieju z 46% niespodzianek. Bez potwierdzenia na turnieju o normalnym rozkładzie wyników nie należy jej traktować jako sygnału metodologicznego.
- **Błąd operacyjny fazy: kompletność kalendarza.** Raport dzienny na 10.09 objął sześć meczów zamiast ośmiu — finały dolnych drabinek obu grup miały pary rozstrzygające się w trakcie dnia i nie zostały odnotowane jako pozycje „para TBD". Uzupełnione osobnym dokumentem `reports/2026-09-10b-claude.md` z predykcjami przedmeczowymi (C7, C8). Reguła wdrożona do playbooka: przy formatach drabinkowych raport dzienny wymienia również mecze o parach nieustalonych, z zapowiedzią jednego dokumentu uzupełniającego na dzień. Zmiana procesu, nie metody — `method_version` bez zmian.

## 7. Do prześledzenia w playoffach (11-13.09)

- Czy przewaga claude nad rynkiem utrzyma się przy innym rozkładzie wyników. Playoffy sześciu drużyn z tej samej stawki powinny mieć mniej skrajnych faworytów niż faza grupowa.
- Czy bias claude ustabilizuje się, czy dalej będzie przeskakiwał znak z dnia na dzień. Wartość diagnostyczna ma sama stabilność, niezależnie od kierunku.
- Czy marża STS spadnie na meczach playoffowych o wyższym obrocie. Jeśli tak, próg +8-10% staje się osiągalny i test na „0 BET to artefakt marży" wykonuje się sam.
- Czy da się zebrać choć jeden `closing_odds`. Playoffy mają mniej meczów i prawdopodobnie późniejsze godziny.
- 5star odpadli, więc wątek ich niedowartościowania zamyka się na obserwacji z sekcji 3; nie będzie kolejnych danych w tym turnieju.
