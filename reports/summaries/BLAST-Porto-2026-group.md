# Edge — Raport fazowy: BLAST Open Porto 2026, faza grupowa

**Turniej:** BLAST Open Porto 2026 (faza grupowa w studiu BLAST, Kopenhaga; playoffy w Porto)
**Faza:** grupowa (dwie grupy A i B, każda double-elimination 8 drużyn, wszystkie mecze BO3)
**Zakres:** 2026-08-26 – 2026-08-31 (6 dni)
**Metoda:** v1 · **Gra:** cs2 · **Rynek odniesienia:** STS (kursy podawane manualnie)
**Status dokumentu:** opisowy. To NIE jest walidacja metody — patrz sekcja "Status i zastrzeżenia".

---

## 1. Zakres i metodyka

Obaj agenci (claude, gpt) generowali niezależne predykcje moneyline dla każdego meczu tier-1 fazy grupowej. Wszystkie mecze logowane niezależnie od decyzji (PASS lub BET) — próbka kalibracyjna budowana z pełnego pokrycia, nie tylko z zakładów. Metoda: de-vig kursów STS → oszacowanie fair probability → wyliczenie value % → decyzja PASS/BET → log. Wszystkie mecze BO3 (brak dnia BO1, inaczej niż w EWC).

Struktura fazy: dwie grupy po 8 drużyn w double-elimination. Dni 26–27.08 to Upper Bracket QF obu grup, 28–29.08 UB SF + LB, 30–31.08 LB decydujące oraz finały UB/LB grup wyłaniające 6 drużyn do playoffów w Porto (4–6.09).

Predykcji rozliczonych w fazie: **claude 24, gpt 24.**

## 2. Kalibracja porównawcza (rdzeń)

Metryka główna projektu to Brier score (niżej = lepiej). Właściwy benchmark to Brier de-vigowanego rynku, nie naiwne 0.25.

**Faza grupowa BLAST (24 predykcje każdy):**

| Agent | Brier | Trafienia | BET |
|-------|------:|----------:|-----|
| claude | 0.1676 | 20/24 (83%) | 0W / 0L |
| gpt | 0.1616 | 17/24 (71%) | 0W / 2L |

Kluczowa obserwacja: w tej fazie **gpt ma minimalnie lepszy Brier** (różnica 0.0060, w granicach szumu na n=24), mimo że claude trafiał wyraźnie więcej pojedynczych picków (83% vs 71%). To ta sama struktura co w EWC — claude lepszy na trafieniach, gpt ciut lepiej skalibrowany na prawdopodobieństwach — ale różnica Briera jest tu na tyle mała, że nie należy jej nadinterpretować. Oba agenty solidnie biją baseline.

Istotna różnica w BET: **claude 0 BET, gpt 2 BET — oba przegrane** (patrz sekcja 3). To odwrócenie obrazu z EWC (gdzie gpt miał 4W/2L). W BLAST oba zakłady gpt padły, i oba były na dokładnie ten sam wzorzec (underdog fresh-form), który claude świadomie zPASS-ował.

**Narastająco (cała rozliczona próbka v1):**

| Agent | n | Brier | Trafienia |
|-------|--:|------:|----------:|
| claude | 110 | 0.2051 | 79/110 (72%) |
| gpt | 107 | 0.1947 | 70/107 (65%) |

Na pełnej próbce gpt wciąż prowadzi (0.1947 vs 0.2051, różnica ~0.010) — spójnie z całą historią projektu. BLAST tego nie odwrócił, ale też nie pogłębił: przewaga gpt utrzymuje się na stałym poziomie ~0.01. claude nadrabia trafieniami picków, gpt kalibracją prawdopodobieństw.

**Rozrzut dzienny claude (ilustracja wariancji):** 26.08 Brier 0.239 (3/4) · 27.08 0.286 (2/4, najgorszy) · 28.08 0.061 (4/4) · 29.08 0.098 (4/4) · 30.08 0.133 (4/4) · 31.08 0.189 (3/4). Trzy dni środkowe (28–30.08) to komplet trafień z niskim Brierem; skrajne dni (upsety Inner Circle i Legacy 27.08, MOUZ 31.08) podnoszą wariancję. Kolejna ilustracja, że pojedynczy dzień to głównie szum — wnioski tylko z uśrednienia.

## 3. Decyzje BET

**claude: 0 BET w całej fazie.** gpt: 2 BET (0W / 2L).

Szczegół betów gpt:
- 29.08 Legacy vs Falcons — BET na Legacy (underdog) → **lost** (Falcons won)
- 31.08 FUT vs Vitality — BET na FUT (underdog) → **lost** (Vitality won)

Interpretacja: oba zakłady gpt to ten sam profil — underdog ze świeżą formą, wyceniony przez metodę wyżej niż przez rynek, konwertowany na BET. Oba przepadły. To najczystszy dotąd sygnał, że konwersja fresh-form value na realny zakład w tym oknie **nie opłaciła się** — dokładnie sytuacja, przed którą chroni dyscyplina §237 (patrz sekcja 5).

**0 BET po stronie claude ponownie NIE okazało się błędem.** Przeciwnie niż mogłaby sugerować "0 BET = nadmierna ostrożność": w BLAST claude PASS-ował wszystkie sygnały fresh-form, na których gpt przegrał realne stawki. Przy równym Brierze i wyższym trafieniu picków, 0 BET wygląda tu na trafną powściągliwość wobec value, które nie było prawdziwym edge'em (marża STS ~8% + niezwalidowany sygnał), a nie na tchórzostwo. Do potwierdzenia liczbami przy checkpoincie 150.

## 4. Dywergencje (bezpośrednie punkty sporne)

W całej fazie grupowej agenci rozjechali się na **trzech** meczach — reszta (21/24) to identyczne picki:

**Aurora vs G2 (26.08).** claude: pick G2 (PASS). gpt: pick Aurora (PASS). Mecz de facto 50/50 na starcie turnieju; claude dał G2 lekką przewagę na podstawie świeżego H2H z EWC. Wynik: **G2 won** — rozstrzygnięcie na korzyść claude. Bez BET po żadnej stronie, więc różnica czysto kalibracyjna.

**Legacy vs Falcons (29.08).** claude: pick Falcons (PASS). gpt: pick Legacy, **BET** (underdog). To pierwsza dywergencja BET/PASS na fresh-form: claude widział +19% value na Legacy, ale zPASS-ował jako niezwalidowaną korektę (§237); gpt zagrał. Wynik: **Falcons won** — bet gpt przepadł, PASS claude słuszny.

**FUT vs Vitality (31.08).** claude: pick Vitality (PASS). gpt: pick FUT, **BET** (underdog). Powtórka tego samego wzorca: claude +17.8% value na FUT, PASS; gpt BET. Wynik: **Vitality won** — drugi przegrany bet gpt, drugi słuszny PASS claude.

Wszystkie trzy dywergencje rozstrzygnęły się na korzyść claude. Z zastrzeżeniem statystycznym: underdogi na tych kursach (2.2–3.1) i tak przegrywają większość czasu, więc to potwierdzenie kierunku dyscypliny, nie dowód, że gpt się myli systematycznie — trzy mecze to za mało na taki wniosek.

## 5. Potwierdzone wzorce

**Fresh-form: pięć obserwacji, dyscyplina §237 potwierdzona.** Faza grupowa BLAST dostarczyła wyjątkowo gęstej serii wzorca fresh-form (underdog ze świeżą formą, na którym v1 widzi duży nominalny value, ale PASS-uje jako niezwalidowaną korektę). Przypadki: NAVI–M80 (26.08, underdog M80 wygrał), Legacy–FUT (27.08, underdog Legacy wygrał), Legacy–Falcons (29.08, underdog przegrał), Legacy–Vitality (30.08, underdog przegrał), FUT–Vitality (31.08, underdog przegrał). Bilans underdoga: **2 wygrane / 3 przegrane.** Kluczowe: w dwóch przypadkach, gdzie value przekonwertowano na realny BET (gpt: Legacy 29.08, FUT 31.08), **oba zakłady przepadły**. To wspiera obecną dyscyplinę v1 — ale mieszany bilans underdoga (2/5 wygranych) pokazuje, że sygnał fresh-form NIE jest bezwartościowy; jest realny, tylko v1 nie ma narzędzia, by odróżnić przypadki, gdzie underdog faktycznie wygra. Dokładnie luka dla v2.

**Round differential jako sygnał (obserwacja operatora, materiał do v2).** W trakcie fazy Dom wskazał, że wynik serii (won/lost) gubi informację o sile zwycięstwa — 13:3 vs 13:11 to różne sygnały. Przykłady z fazy: Aurora zdemolowała M80 13:3, 13:5 (skrajna dominacja), a Aurora–G2 dała profil skrajnej wariancji (13:7, 16:19 OT, 1:13) pokazujący, że surowy round diff sam potrafi wprowadzać w błąd — mapa w OT niesie znacznie mniej sygnału niż różnica rund sugeruje. Zapisane jako kandydat na komponent v2 (PRE-V2 sekcja 8), zablokowany na dostępności danych mapowych. Nie wchodzi do v1.

**Comeback / wariancja wewnątrzmapowa (obserwacja operatora).** Vitality odrobiło deficyt 0:8 przeciw Legacy (30.08) i wygrało mapę — sygnał odporności mentalnej, którego wynik serii nie oddaje. Kontrsygnał wobec korekty fresh-form (v1 zaniżał Vitality za standin/niestabilność, a drużyna pokazała zdolność do comebacków). Kandydat do v2 obok round diff, wymaga tych samych danych na poziomie mapy.

**0 BET spójne z reżimem tier-1.** Podobnie jak w EWC, brak betów claude odzwierciedla realny brak value po marży na sharp rynku, wzmocniony w BLAST o świadome PASS-owanie niezwalidowanego fresh-formu. Framing spójny z metodą.

## 6. Status i zastrzeżenia (WAŻNE)

Ten raport jest opisowy i NIE stanowi walidacji metody. Konkretnie:

- **Faza Collection trwa.** Rozliczonych predykcji: **claude 110, gpt 107** — do checkpointu 150 brakuje odpowiednio 40 i 43. Żaden wniosek kalibracyjny nie jest jeszcze rozstrzygający. Brier fazowy (sekcja 2) liczony opisowo per faza — NIE jest to checkpoint ani per-turniejowa walidacja; pełna kalibracja dopiero na 150 per agent × method_version.
- **Metoda v1 ma znany bias** (systematyczne przeszacowanie w stronę picku ~+2pp). v2 nie zdefiniowana (PRE-V2 to notatnik roboczy). Kalibracja opisana wyżej to kalibracja metody, o której wiadomo, że jest niedokończona.
- **CLV w większości niewypełnione.** closing_odds wypełnione dla 52/217 rozliczonych predykcji (~24%). Bez closing line value nie da się stwierdzić, czy predykcje biją rynek w sposób przewidujący długoterminowy zysk. 24% to wciąż za mało na wnioski CLV, choć pokrycie rośnie.
- **Nie ma tu i nie będzie** stwierdzeń typu "metoda działa" ani rekomendacji dotyczących grania. Dobry wynik na 150 oznacza "kontynuować i dopracować v2", nie "gotowe do gry".

## 7. Do prześledzenia w playoffach (4–6.09, Porto)

- Playoffy to inny reżim: single-elimination, wyłącznie 6 najlepszych drużyn z grup, BO3 (finał BO5). Zwycięzcy UB Final grup (Spirit, wyłoniony z A; zwycięzca B) wchodzą od półfinałów; reszta od ćwierćfinałów. Więcej meczów bliskich 50/50 → ostrzejszy test kalibracji niż faza grupowa.
- Playoff sample analizować oddzielnie od grupowego (inny rozkład trudności).
- Checkpoint 150 NIE wypadnie w tych playoffach (brakuje 40+ predykcji, a playoffy to ~5–7 meczów) — dobicie do 150 przesuwa się na kolejny turniej. Odnotować przy planowaniu.
- Śledzić dalej wzorzec fresh-form: czy w reżimie playoff (silniejsze drużyny, mniej "słabych" underdogów) sygnał zachowuje się inaczej. Dywergencje BET/PASS claude-gpt na tym wzorcu to najciekawszy punkt obserwacji.
- Obserwować, czy stała przewaga gpt ~0.01 w Brierze utrzyma się, czy któryś agent odskoczy w reżimie coin-flipów.

---
*Raport wygenerowany na podstawie stanu data/bets.json. Liczby liczone z rozliczonych predykcji fazy grupowej (claude 24, gpt 24). Faza grupowa zamknięta — dokument niezmienny; ewentualne korekty jako nowa sekcja.*
