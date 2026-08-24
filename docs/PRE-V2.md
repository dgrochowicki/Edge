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
- **Kształt pola `mode` — do rozstrzygnięcia przy freeze v2, nie teraz.** Spec gpt (sekcja 15) wprowadza `mode: active` / `mode: shadow` na wpisie. Problem: `active` to stan zależny od tego, która wersja jest aktualnie oficjalna — przy ewentualnej promocji v2 → active trzeba by przepisać wszystkie historyczne wpisy v1, co łamie niezmienność księgi. Do rozważenia rozdzielenie na dwie rzeczy: (a) trwały fakt o wpisie — czy poszły na to realne pieniądze (`paper` / `real`), ustawiany raz i nigdy nie zmieniany; (b) osobne, rootowe pole `active_version` na poziomie bets.json, mówiące która wersja jest teraz oficjalna — promocja to zmiana jednej linijki, zero migracji wpisów. Shadow v2 rozpoznaje się wtedy po `method_version: v2` + `paper`, nie po `mode`. Alternatywa: zostać przy jednym `mode`, ale z semantyką „raz ustawione, nigdy nie zmieniane" — prostsze, gorzej skaluje się na 3+ wersje. Decyzja należy do opiekuna księgi; implementację (nowe pole + backfill 169 istniejących wpisów) wykonuje agent VS Code z pushem, z notą o backwards-compatibility. **Nie jest potrzebne, dopóki nie ruszamy shadow — a shadow czeka na freeze. Zostawione świadomie otwarte.**

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

## Następny krok

Zbierać dane dalej pod v1 przez najbliższy tier-1 (EWC zamrożone), aż każdy agent dobije własną próbkę do 150. Równolegle rozwijać sekcję 2 tego pliku do pełnych, policzalnych definicji i rozstrzygać otwarte pytania z sekcji 6. Gdy definicje są zamknięte — przenieść zatwierdzoną metodę do PLAYBOOK.md jako v2, odnotować bump w PROJECT_MEMORY (co, dlaczego, jaki werdykt go wyzwolił) i w `docs/decisions/`, i dopiero wtedy uruchomić pierwszy wpis `method_version: v2` — domyślnie jako shadow run z sekcji 7, potwierdzony przy checkpoincie 150 v1. Decyzja, czy v2 awansuje z shadow na metodę oficjalną, zapada osobno: gdy v1 ma swój werdykt z 150, a v2 dość sparowanych danych shadow, by go ocenić.
