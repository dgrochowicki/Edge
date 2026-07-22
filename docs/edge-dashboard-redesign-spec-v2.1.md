# Edge — Dashboard Redesign Spec v2 (polish pass)

Zadanie dla agenta kodującego. Repo: `dgrochowicki/Edge`, branch: `main` (lub feature branch + merge wedle konwencji). Zakres: **wyłącznie warstwa prezentacji dashboardu** — czytelność i spójność interakcji. Żadnych zmian w logice metryk, danych ani metodologii. Jeden commit.

Kontekst: poprzedni redesign (Selections Performance, Discipline Monitor, By Game, zwinięty Calibration Lab) jest już wdrożony i działa. Ten spec go tylko dopieszcza.

---

## Zasady nadrzędne

1. **NIE modyfikuj:** `data/bets.json`, `reports/`, `docs/`, logiki liczącej (`getAllSelections`, `selectionStats`, `selectionsByOddsBucket`, `selectionsByMarket`, `decisionStats`, `observedPassStats`, `devig`, `validatePredictions`, Brier/CLV, progi `CAL_T`). Ten commit dotyka wyłącznie warstwy renderującej (HTML tworzone w JS + CSS).
2. **Zachowaj estetykę** trading-terminal: istniejące zmienne CSS (`--bg`, `--panel`, `--panel-2`, `--line`, `--line-soft`, `--ink`, `--ink-dim`, `--ink-faint`, `--pos`, `--neg`, `--void`, `--edge`), fonty (`--font-display`, `--font-mono`). Nowe elementy mają wyglądać, jakby były tam od zawsze. Żadnych nowych bibliotek.
3. **Wykorzystaj istniejący system modali.** W `dashboard.js` jest już `calibInfo(key)` + słownik `CALIB_INFO` oraz style `.calib-modal*`. Rozszerzamy TEN system — nie tworzymy drugiego.
4. **Puste stany** bez zmian — muszą nadal działać przy n=0/n=1 (krótka notka `.calib-note`).
5. Kod i komentarze po angielsku. Commit message po angielsku, konwencja jak w repo.
6. Po commicie: `index.html`, `dashboard/logs.html`, `dashboard/reports.html` działają bez błędów w konsoli, brak poziomego scrolla przy 380px.

---

## Zmiana 1 — Klikalne wyjaśnienia w całym dashboardzie (spójność z Calibration Lab)

W Calibration Lab kliknięcie w labelkę metryki otwiera modal z wyjaśnieniem po polsku. Nowe sekcje (Selections Performance, Discipline Monitor, By Game) tej możliwości nie mają — trzeba ją dodać, korzystając z tego samego mechanizmu.

### 1.1 Rozszerz słownik `CALIB_INFO`

Dodaj poniższe wpisy do istniejącego obiektu `CALIB_INFO` (format: `key: ['Tytuł', 'Treść po polsku']`). Treść ma być prosta, bez żargonu, w tym samym duchu co obecne wpisy:

```js
selHitRate: ['Selection Hit Rate', 'Jaki procent pojedynczych typów (nóg) trafiasz. Liczone po nogach, nie po całych kuponach: kupon z 3 zdarzeń to 3 osobne nogi. Void nie liczy się do mianownika. To surowa trafność — mówi, jak często masz rację, ale NIE czy zarabiasz (do tego trzeba value i kursów).'],
avgOdds: ['Avg Leg Odds', 'Średni kurs Twoich pojedynczych typów. Niski (bliżej 1.00) = grasz głównie faworytów. Wysoki = częściej sięgasz po niepewniaki. Sam w sobie nic nie ocenia — służy do czytania tabeli „wg zakresu kursu" obok: gdzie faktycznie masz wyczucie.'],
bestWorst: ['Best / Worst Bucket', 'Automatyczne wskazanie przedziału kursu z najwyższą i najniższą trafnością (przy min. 2 zakładach). Skrót z tabeli obok: od razu widzisz swój najmocniejszy i najsłabszy rodzaj zakładu.'],
oddsRange: ['Wg zakresu kursu', 'Twoje trafienia rozbite na przedziały kursu. Kluczowa diagnoza: może faworytów (kurs <1.30) trafiasz w 80%, ale niepewniaki (kurs ≥2.00) tylko w 30%. Pokazuje, w którym typie zakładów masz oko, a gdzie zgadujesz.'],
byMarketTbl: ['Wg rynku', 'Trafienia w podziale na typ zakładu: zwycięzca meczu (moneyline), liczba map (over/under), handicap. Na razie prawie wszystko to moneyline, więc tabela ma jeden wiersz — rozrośnie się, gdy zaczniesz grać różne rynki.'],
betPass: ['BET / PASS', 'Ile razy postawiłeś (BET) vs ile odpuściłeś (PASS). Duża przewaga PASS-ów to NIE lenistwo — to dyscyplina: stawiamy tylko, gdy jest przewaga (value), a nie na każdy mecz.'],
betRecord: ['BET record', 'Bilans zakładów, które faktycznie postawiłeś: ile wygranych, ile przegranych. Twój realny wynik na tym, na co zdecydowałeś się zagrać — w odróżnieniu od PASS-ów, których nie ruszałeś.'],
passDiscipline: ['PASS discipline', 'Najczęściej mylona metryka. PASS to werdykt o CENIE (brak value), nie o zwycięzcy. Dlatego rozbijamy pasy na dwie grupy: „słuszne" (kurs był za niski — trafienie tu to NIE strata) i „potencjalnie stracone" (był dodatni value, a typ wygrał — dopiero TO oznacza przeoczoną okazję). Tylko druga grupa może uzasadniać poluzowanie ostrożności. Sama liczba „ile pasów trafiłoby" jest myląca i celowo jej nie pokazujemy.'],
byGame: ['By Game', 'Te same metryki w podziale na grę: CS2, LoL, Dota 2. Pokazuje, w której grze masz najlepsze wyczucie. CS2 to rynek główny projektu.']
```

### 1.2 Uczyń labelki klikalne

W `renderSelectionsPerformance`, `renderDisciplineMonitor` i `renderByGame`:

- Do każdej karty (`.kpi-label`) i nagłówka podsekcji (`.calib-sub`) dodaj `class="click"` (istnieje reguła `.calib-cell.click`/`.calib-sub.click{cursor:pointer;}` — dodaj analogiczną dla `.kpi-label.click`) oraz `onclick="calibInfo('KLUCZ')"` z odpowiednim kluczem ze słownika.
- Mapowanie: karta "Selection Hit Rate"→`selHitRate`, "Avg Leg Odds"→`avgOdds`, "Best Bucket"/"Worst Bucket"→`bestWorst`, nagłówek "By odds range"→`oddsRange`, "By market"→`byMarketTbl`, pasek/nagłówek BET-PASS→`betPass`, karta "BET record"→`betRecord`, karta "PASS discipline"→`passDiscipline`, nagłówek sekcji By Game→`byGame`.
- **Wskazówka wizualna:** obok klikalnej labelki dodaj mały znak informacyjny — subtelny, np. `<span class="info-dot">i</span>` w kolorze `--ink-faint`, rozjaśniający się do `--ink-dim` na hover. Ma sygnalizować „kliknij po wyjaśnienie", nie krzyczeć. Zastosuj też do istniejących labelek w Calibration Lab, żeby afordancja była spójna na całej stronie.

### 1.3 Drobna poprawka modala

Obecny `calibInfo` wstawia treść przez `textContent`. Zostaw tak (bezpieczne). Jeśli tytuł sekcji ma być czytelny, upewnij się, że modal jest wyśrodkowany i zamyka się (klik w tło, przycisk ×, oraz — dodaj — klawisz Escape).

---

## Zmiana 2 — Selections Performance: mniej rozciągnięte tabele

Problem: dwie pełnowymiarowe tabele („By odds range", „By market") jedna pod drugą zajmują dużo pionu, a „By market" ma zwykle jeden wiersz. **Zostają jako dwie osobne tabele** (nie łączyć), ale zwarte i lżejsze wizualnie:

- Umieść obie tabele **obok siebie w dwóch kolumnach** na szerokości desktopowej (grid 2×, gap jak między kartami). Na mobile (<768px) — jedna pod drugą.
- „By market", jako że zwykle wąska, może zajmować węższą kolumnę (np. grid `1.4fr 1fr` albo `minmax`). Dobierz proporcje tak, by „By odds range" (4 wiersze) i „By market" (1–2 wiersze) wyglądały zrównoważona parą, nie dwoma osobnymi blokami.
- Zmniejsz pionowy padding wierszy tabel w tej sekcji (zwarte wiersze) — cel to gęstszy, „terminalowy" wygląd. Nie zmniejszaj czcionki poniżej obecnej `.calib-table` (czytelność).
- Nagłówki podsekcji („By odds range", „By market") zostają jako `.calib-sub`, teraz klikalne (Zmiana 1).
- Rząd 4 kart KPI nad tabelami — bez zmian układu, tylko labelki klikalne.

Puste stany: jeśli brak nóg z kursem → w miejsce tabeli krótka `.calib-note` („No graded legs yet"), jak dotąd.

---

## Zmiana 3 — Discipline Monitor: czytelniejsze dwa kafelki

Problem: karty „BET record" i „PASS discipline" gubią hierarchię — zwłaszcza PASS, gdzie dużo tekstu upchane w kafelku zaciera, co jest nagłówkiem, a co szczegółem. **Zostają dwa osobne kafelki obok siebie** (`kpi-row cols-2`), ale uporządkowane:

### 3.1 Wspólna struktura obu kafli

Każdy kafel ma czytelną hierarchię: **labelka (klikalna, z info-dot) → główna liczba (duża) → szczegóły (mniejsze, pod spodem)**. Nie mieszać poziomów.

### 3.2 BET record

- Labelka: „BET record" (klik → `betRecord`).
- Główna wartość (duża, `.kpi-value`): `{won}W – {lost}L`, kolor `pos`/`neg` wg hit rate (≥50% pos).
- Sub: `{hitRate}% hit rate` albo „no settled BETs yet".

### 3.3 PASS discipline — hierarchia zamiast ściany tekstu

Zamiast dwóch linijek tekstu w jednym `.kpi-sub`, rozbij na czytelny mini-układ w obrębie kafla:

- Labelka: „PASS discipline" (klik → `passDiscipline`, z info-dot).
- **Główna wartość (duża):** liczba PASS-ów przy value ≤ 0 (słuszne) — bo to zwykle większość i to jest „dyscyplina działa". Pod nią mały podpis: `correct passes (price too low)`.
- **Poniżej, wyraźnie oddzielone** (cienka linia `--line-soft` albo odstęp): grupa value > 0. Jeśli n=0 → zielona/neutralna linijka „no missed opportunities — threshold working". Jeśli n>0 → `{n} at value >0 · {won}/{n} would’ve won · hypothetical {±X} PLN` (kolor kwoty pos/neg). To jedyna liczba, która sygnalizuje realne przeoczenie — ma się wyróżniać, ale nie dominować.
- Zachowaj `title` (tooltip) na kaflu bez zmian.

Cel: rzut oka ma dać „ile słusznych pasów", a dopiero doczytanie — „czy coś przeoczyliśmy". Teraz oba poziomy są równorzędne i to myli.

### 3.4 Pasek BET/PASS i nota observed_passes

- Pasek proporcji (`.outcome-bar`) i legenda — bez zmian, tylko nagłówek/legenda klikalne (`betPass`).
- Linia `observed_passes` (jeśli jest) — bez zmian.

---

## Poza zakresem (NIE ruszaj)

- Logika metryk, dane, metodologia, progi.
- Wykres P&L, KPI górne, Recent Coupons (dopieszczone w poprzednim commicie).
- Przełącznik per agent i per method_version — na później (zostaw `// TODO`).

## Kryteria akceptacji

1. Kliknięcie w każdą labelkę w Selections Performance, Discipline Monitor, By Game oraz Calibration Lab otwiera modal z wyjaśnieniem po polsku; modal zamyka się klikiem w tło, przyciskiem × i klawiszem Escape.
2. Info-dot widoczny przy klikalnych labelkach, subtelny, spójny na całej stronie.
3. Selections Performance: „By odds range" i „By market" leżą obok siebie na desktopie, jedna pod drugą na mobile; wiersze zwarte; brak nadmiaru pionu.
4. Discipline Monitor: dwa kafle obok siebie z wyraźną hierarchią labelka → liczba → szczegóły; w PASS discipline grupa „słuszne" jest wizualnie główną wartością, grupa „stracone" wyraźnie oddzielona.
5. Brak zmian w wartościach liczbowych względem stanu sprzed commita (to samo liczenie, inny tylko układ). Zweryfikuj, porównując liczby przed/po.
6. Brak błędów w konsoli na wszystkich trzech stronach; brak poziomego scrolla przy 380px.
