# Pre-v2 — notatnik roboczy do definicji metody v2

**Status:** ROBOCZY. To NIE jest aktywna metoda. Wszystkie predykcje wciąż niosą `method_version: v1`.
Ten dokument zbiera hipotezy do przyszłego v2. Nie zmienia żadnej reguły v1 i nie uruchamia v2.
Dokumentem wiążącym pozostaje `PLAYBOOK.md` (v1). v2 powstaje z tego pliku dopiero jako osobna, świadoma zmiana.

**Zasada nadrzędna (z PLAYBOOK.md → Method versioning):**
v2 projektujemy na papierze *zanim* zobaczymy, jak wypadłby na danych EWC. Definiowanie reguł po obejrzeniu, które BET-y wygrały, to overfitting — dopasowanie do szumu rozegranych już meczów. EWC jest zamrożoną próbką v1; służy do postawienia hipotez, nie do ich strojenia. v2 dostanie własną, świeżą próbkę 150/50 i będzie oceniany wyłącznie na niej.

---

## 1. Po co v2 — jedno zdanie

EWC pokazał konkretny obszar, w którym agenci różnią się **informacyjnie**: jak szybko ufać świeżej zmianie siły zespołu względem zakotwiczenia w ratingu / H2H / cenie rynkowej. To jest materiał na v2.

## 2. Główna hipoteza: mierzalny sygnał świeżej formy (fresh-form signal)

**Obserwacja z v1 (opisowa, EWC):** claude systematycznie niedoważał sygnał formy underdoga i zakotwiczał się w rankingu/renomie/H2H. Trzy widoczne dywergencje:

| Mecz | Strona agresywna | Wynik | Lekcja |
|------|------------------|-------|--------|
| Spirit vs Vitality | gpt (Spirit @2.20) | Spirit 2:1 | świeża forma > H2H 11-4 |
| FUT vs MOUZ | gpt (FUT @2.29) | FUT 2:0 | świeża forma / matchup > renoma |
| Legacy vs Spirit | gpt (Legacy @3.50) | Spirit 2:0 | **pułapka nadkorekty** — świeży run przeważony |

**Czego NIE robimy:** nie wpisujemy reguły „gorący underdog = podnieś probability". Legacy pokazuje drugą stronę tej samej monety — trzy mecze to trzy anegdoty, nie sygnał. claude świadomie opisał ryzyko nadkorekty przy Legacy i miał rację.

**Co robimy:** definiujemy *mierzalny* sygnał świeżej formy i testujemy, czy FUT/Spirit/Legacy były przejawem wspólnego, kwantyfikowalnego sygnału, czy trzema głośnymi historiami. Kandydaci na komponenty sygnału (do operacjonalizacji):

- jakość ostatnich rywali (nie sam wynik, ale przeciw komu),
- wyniki po zmianie składu / roszadzie rostera (osobno licząc mecze przed i po),
- recency decay — ważenie meczów świeżością, z jawnym parametrem rozpadu,
- wyniki map vs top-tier (czy zespół wygrywa mapy z faworytami, nie tylko całe mecze),
- stabilność rosteru (czas gry obecnego składu razem, standy-iny, brak trenera).

**Kryterium sukcesu hipotezy:** sygnał musi być policzalny z góry, bez wiedzy o wyniku, i musi poprawiać Brier vs de-vigged market na świeżej próbce v2 — nie na EWC.

## 3. Powiązana kwestia: próg konwersji probability → BET

v1 (claude) trzyma wycenę blisko de-vigged market, więc przy marży STS ~8% niemal wszystko kończy się PASS. Otwarte pytanie: czy to optymalna ostrożność, czy zbyt mocne zakotwiczenie do rynku. **Nie rozstrzygać Brierem** — rozstrzygną CLV i większa próbka BET. v2 może (ale nie musi) rewidować próg konwersji; decyzja czeka na dane CLV, nie na tę notatkę.

## 4. Benchmark, względem którego oceniamy v2

Nie 0.25. **Brier de-vigged market na sparowanej próbce.** v2 „dodaje informację" tylko jeśli bije ten benchmark na własnych świeżych 150 (per agent). To wprost z PLAYBOOK.md → Failure conditions.

## 5. Czego v2 NA PEWNO nie robi na tym etapie

- Nie zmienia v1 wstecz. EWC zostaje zamrożone jako próbka v1.
- Nie uruchamia się, dopóki definicja nie jest zamknięta na papierze.
- Nie miesza próbek — pierwszy wpis `method_version: v2` startuje licznik od zera (per agent × version).
- Nie jest strojony pod wyniki EWC.

## 6. Otwarte pytania do rozstrzygnięcia przed zamknięciem definicji

- Jak dokładnie operacjonalizować każdy komponent z sekcji 2 (definicje, okna czasowe, parametry).
- Czy fresh-form signal wchodzi jako korekta probability, czy jako osobny gate na BET.
- Czy v2 dotyka progu konwersji z sekcji 3, czy zostawia go v1-owym (czeka na CLV).
- Jak dashboard rozdziela metryki v1 vs v2 (Calibration Lab liczy per method_version — placeholder „v1" już dyskutowany).
- Zdarzenie wyzwalające bump: który turniej tier-1 jest pierwszą świeżą próbką v2.
- **Pole `mode` — ROZSTRZYGNIĘTE: niepotrzebne.** Spec gpt (sekcja 15) proponował `mode: active` / `mode: shadow` na wpisie predykcji. Po sprawdzeniu realnej struktury danych i kodu dashboardu okazało się, że pole jest zbędne, bo architektura już rozdziela to, co `mode` miał rozdzielać:
  - **Liczenie v1 vs v2 osobno** robi samo `method_version`. Jeden mecz ma osobny wpis na każdą kombinację `agent × method_version` — tak jak dziś ma osobny wpis dla claude i osobny dla gpt. W okresie shadow ten sam mecz dostaje wpisy `v1` (claude, gpt) i wpisy `v2` (claude, gpt); dashboard grupuje per `agent × method_version` i zestawia je na wspólnych meczach. `v1` i `v2` to już dwie różne wartości — to wystarcza do paired testu, nic dokładać nie trzeba.
  - **Ochrona realnego P&L przed wpisami shadow** wynika z rozdziału `predictions` vs `coupons`. P&L, ROI, net liczą się WYŁĄCZNIE z `coupons`, nigdy z `predictions`. Shadow v2 to predykcje bez kuponów (nie gramy na nie realnie), więc fizycznie nie mogą dotknąć P&L — bez żadnej flagi.
  - **Status „to była faza shadow"** nie wymaga pola na wpisie: wynika z tego, że wpis `method_version: v2` powstał przed datą promocji (freeze + `active_version` zapisane w projekcie). Gdyby kiedyś zaczęto księgować hipotetyczne kupony shadow dla teoretycznego CLV v2 (spec gpt sekcja 22), jedyne potrzebne pole to opcjonalna flaga `paper: true` na tych kuponach — dotyczy garstki przyszłych kuponów, nie 169 istniejących wpisów, nie predykcji. Domyślnie brak flagi = realny.
  - **Konsekwencja operacyjna:** shadow = dzienny research rozszerzony o drugą, niezależną wycenę z tego samego factual snapshotu (v2 nie widzi liczb v1 — izolacja predykcji, spec gpt sekcja 7). Zero nowych pól na predykcjach, zero migracji istniejących wpisów.
  - **Promocja v2 → active** (gdy v2 okaże się lepsze): v1 NIE jest usuwane — zostaje zamrożonym baseline i dowodem, że przejście było uzasadnione (paired test żyje w danych v1). Zmienia się tylko rootowe `active_version` (jedna linijka) i to, że nowe kupony powstają na v2. Struktura skaluje się tak na dowolną liczbę wersji (v1 baseline → v2 active + v3 shadow → …), bez kasowania czegokolwiek.

---

## 7. Sposób uruchomienia v2: shadow / paper run równolegle z v1

**To jest rekomendowana ścieżka domyślna, a nie klasyczne przełączenie v1 → v2.** Potwierdzamy ją przy checkpoincie 150 v1 — nie przesądzamy z góry — ale tak to na dziś projektujemy.

Kiedy specyfikacja v2 jest zamknięta na papierze, v2 NIE zastępuje od razu v1. Zamiast tego v2 rusza jako **shadow model** wyceniający te same mecze co v1:

- **v1 = raport oficjalny**, jak teraz. Normalny BET/PASS, może wpływać na realne zagrania, dalej dobija własną próbkę per agent do 150 — czyli dojeżdża do swojego pre-registered werdyktu, zamiast zostać porzucony w połowie (~100 obserwacji).
- **v2 = shadow report**, druga wycena tych samych meczów według reguł v2. Wyłącznie badawcza. Zero realnej gry na jej podstawie.
- Obie wersje dostają **jeden wspólny factual snapshot** (mecze, format, rostery, forma, te same kursy STS o tym samym `odds_timestamp`) i niezależnie wyceniają probability. Research robimy raz; dublujemy tylko wycenę.

**Po co shadow, a nie czyste przełączenie.** Przełączenie zostawiłoby v1 na ~100 obserwacjach i już nigdy nie odpowiedzielibyśmy, czy v1 pobiło rynek na checkpoincie 150. Dodatkowo porównywalibyśmy v1 i v2 w różnych okresach, na innych składach i innej fazie mety — różnica metody zmieszałaby się z różnicą kalendarza. Shadow to eliminuje: v1 i v2 oceniają identyczne mecze i identyczny rynek, więc jedyną zmienną jest metoda. Pytanie rośnie z „czy v2 bije market?" do także „czy v2 bije v1 na tej samej sparowanej próbce?" — to prawdziwy A/B i mocniejszy dowód. A ponieważ reguły v2 zamrożono wcześniej na papierze, wpisy shadow są genuinely out-of-sample od pierwszego dnia.

**Liczenie próbki się nie zmienia.** v2 i tak potrzebuje **własnych** 150 settled i 50 BET-snapshotów, per agent × version. NIE dziedziczy próbki v1 tylko dlatego, że dzieli mecze. Dzieli mecze, ale liczy od zera.

**Kształt danych i raportów (spec dla agenta z pushem — agenci-analitycy tego nie implementują):**

- Każdy wpis shadow niesie `method_version: "v2"` **oraz** flagę trybu (np. `mode: "shadow"`), żeby dashboard nigdy nie policzył shadow-BET-a jako realnej gry ani nie zmieszał go z P&L operatora czy wspólną pulą CLV.
- Wpisy sparowane muszą być łączalne: ten sam `match` + `date` + identyczny `odds_timestamp` i snapshot kursów w wierszu v1 i v2 — inaczej „v2 vs v1 na sparowanej próbce" nie da się policzyć.
- Raport pozostaje chudy, nie zdublowany: v1 to pełny raport oficjalny (`reports/2026-xx-xx-{agent}.md`); v2 to celowo cienki plik shadow (`reports/shadow/2026-xx-xx-{agent}-v2.md`) — tylko tabela wycen, decyzje i blok JSON, korzystający z prozy, kalendarza i weryfikacji rosterów z raportu v1, bez powtarzania ich.

Przykład wartościowego przypadku, którego szukamy (ten sam mecz, ten sam kurs, dwie metody):

| | v1 | v2 shadow |
|---|---|---|
| FUT win prob. | 52% | 58% |
| Fair | 1.92 | 1.72 |
| STS | 2.10 | 2.10 |
| Decyzja | PASS | BET |
| Realna gra | — | nie |

Po 50–100 wspólnych meczach takie rozjazdy pozwalają powiedzieć „v2 realnie poprawia probability względem v1", zamiast zestawiać dwie metody działające w różnych okresach i na innych zespołach.

**Kolejność jest nienegocjowalna.** Shadow rusza dopiero PO zamknięciu specyfikacji v2 na papierze. Dopóki reguły v2 nie są zamrożone, nie ma czego uruchamiać w cieniu — a pokusa dostrajania v2 pod to, jak radzi sobie shadow na żywo, to dokładnie overfitting, przed którym się bronimy. Shadow to miejsce na testowanie v2, nie na jego projektowanie.

---

## 8. Kandydat na komponent: dominacja mapowa / round differential (nie tylko wynik serii)

**Obserwacja (Dom, 30.08.2026):** v1 czyta mecz binarnie — kto wygrał serię (won/lost) — i ignoruje *jak*. Ale seria 2:1, w której przegrane mapy szły 13:11, mówi coś zupełnie innego niż 2:1 z mapami przegranymi 13:3. Pierwsza drużyna była realnie równorzędna i miała pecha/drobny deficyt; druga została rozjechana i tylko urwała jedną mapę. Binarny wynik traktuje oba przypadki identycznie. Round differential (różnica rund na mapie) niesie informację o *sile* zwycięstwa/porażki, której v1 wyrzuca.

To rozszerza istniejący w sekcji 2 komponent „wyniki map vs top-tier" — ale jest konkretniejsze: nie tylko *czy* zespół wygrywa mapy, ale *jak zdecydowanie*. Jest też naturalnym, mierzalnym proxy dla „świeżej formy", bo dominacja mapowa jest trudniejsza do podrobienia niż sam wynik serii (można wygrać 2:1 słabo grając, trudniej wygrać dwie mapy po 13:4 bez realnej przewagi).

**Dlaczego to może działać jako sygnał:** wynik serii jest zaszumiony przez format BO3 (jedna mapa różnicy potrafi odwrócić serię), a różnica rund uśrednia się gładziej i jest bliższa „prawdziwej" różnicy sił. Dwa zespoły z bilansem 2:1 mogą mieć skrajnie różny profil rundowy — round diff to ujawnia, a rynek moneyline (kto wygra całą serię) tego wprost nie wycenia.

**Propozycja operacjonalizacji (do przetestowania, nie ostateczna):**

1. **Metryka bazowa — Round Differential per mapa (RD):** dla każdej rozegranej mapy `RD = rundy_zdobyte − rundy_stracone` z perspektywy danego zespołu (np. wygrana 13:7 → +6; przegrana 3:13 → −10). Neutralna wobec tego, kto wygrał serię.

2. **Agregacja — Average Round Differential (ARD):** średni RD zespołu z ostatnich **N map** (kandydaci: N=6, N=10 — do zestrojenia). Liczony **per mapa, nie per mecz**, żeby BO3 2:0 ważył podwójnie względem forfeit/BO1. Wariant odporny: mediana RD zamiast średniej, żeby jeden pogrom (np. −11 vs superteam) nie zaburzał obrazu.

3. **Ważenie jakością rywala (opcjonalne, łączy z sekcją 2):** surowy ARD premiuje bicie słabych. Korekta: RD skalowany różnicą VRS/rankingu rywala — +6 przeciw #3 waży więcej niż +6 przeciw #40. Prosty wariant: liczyć ARD tylko z map przeciw top-20, żeby odfiltrować „farmienie" underdogów.

4. **Recency (spójnie z sekcją 2):** te same N map z jawnym rozpadem świeżości — ostatnie mapy ważą więcej. Jeden wspólny parametr rozpadu dla całego sygnału fresh-form, nie osobny.

5. **Wejście do modelu — differential dwóch zespołów:** sygnał predykcyjny to `ARD_A − ARD_B` (przewaga dominacji A nad B). Testujemy, czy dodanie tego do oszacowania probability (jako korekta wobec kotwicy rynkowej) poprawia Brier vs de-vigged market. Kierunek i siła korekty **estymowane z danych** (regresja / kalibracja), nie wpisane ręcznie — inaczej wpadamy w tę samą pułapkę „ręcznego podnoszenia probability", przed którą ostrzega sekcja 2.

**Otwarte pytania / ograniczenia (uczciwie):**

- **Źródło danych rundowych.** Wynik serii mamy w bets.json, ale RD per mapa wymaga wyników mapowych (13:7 itd.). To dane z HLTV/dust2 per mecz — trzeba je zbierać osobno i konsekwentnie. Dopóki ich nie logujemy strukturalnie, ARD jest niepoliczalny z samego repo. **To jest warunek konieczny** — bez pipeline'u danych mapowych ten komponent zostaje hipotezą.
- **N i parametr rozpadu** to hiperparametry — muszą być zamrożone *przed* patrzeniem na wyniki v2, inaczej overfitting (Phase 3).
- **Kolinearność z rynkiem.** Rynek prawdopodobnie już częściowo wycenia dominację. Pytanie brzmi nie „czy ARD przewiduje wynik" (pewnie tak), ale „czy ARD niesie informację *ponad* to, co już jest w de-vigged odds". Testujemy przyrost względem rynku, nie samą korelację z wynikiem.
- **Mapy a meta.** RD na jednej mapie (np. pistolety, przewagi CT/T) bywa zaszumiony przez veto i side. Ewentualne rozszerzenie: normalizacja per mapa/side — ale to już dużo później, najpierw surowy ARD.

**Status:** kandydat na komponent v2, mierzalny w zasadzie, ale **zablokowany na dostępności danych mapowych** — wymaga strukturalnego zbierania wyników per mapa (round score), czego dziś nie robimy. Pierwszy krok operacyjny (jeśli zdecydujemy iść w tę stronę): dopisać do pipeline'u zbieranie round score per mapa dla meczów tier-1, równolegle do obecnych predykcji, żeby zacząć budować próbkę ARD zanim v2 wystartuje.

## Następny krok

Zbierać dane dalej pod v1 przez najbliższy tier-1 (EWC zamrożone), aż każdy agent dobije własną próbkę do 150. Równolegle rozwijać sekcję 2 tego pliku do pełnych, policzalnych definicji i rozstrzygać otwarte pytania z sekcji 6. Gdy definicje są zamknięte — przenieść zatwierdzoną metodę do PLAYBOOK.md jako v2, odnotować bump w PROJECT_MEMORY (co, dlaczego, jaki werdykt go wyzwolił) i w `docs/decisions/`, i dopiero wtedy uruchomić pierwszy wpis `method_version: v2` — domyślnie jako shadow run z sekcji 7, potwierdzony przy checkpoincie 150 v1. Decyzja, czy v2 awansuje z shadow na metodę oficjalną, zapada osobno: gdy v1 ma swój werdykt z 150, a v2 dość sparowanych danych shadow, by go ocenić.
