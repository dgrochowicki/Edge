# Edge — Dashboard Redesign Spec (v1)

Zadanie dla agenta kodującego. Repo: `dgrochowicki/Edge`, branch: `main` (lub feature branch + merge, wedle konwencji repo). Zakres: wyłącznie warstwa dashboardu. Wykonaj 3 commity opisane niżej, w tej kolejności. Po każdym commicie strona musi działać bez błędów w konsoli.

---

## Zasady nadrzędne (obowiązują we wszystkich commitach)

1. **NIE modyfikuj:** `data/bets.json`, `reports/`, `docs/`, `README.md`, logiki metodologicznej Calibration Lab (progi `CAL_T`, `devig`, `validatePredictions`, Brier, CLV — zostają bez zmian merytorycznych).
2. **Zachowaj estetykę** trading-terminal: istniejące zmienne CSS (`--bg`, `--panel`, `--line`, `--ink*`, `--pos`, `--neg`, `--void`, `--edge`), fonty Space Grotesk / JetBrains Mono, styl kart `.kpi`/`.calib-cell`, paneli `.panel`, tagów `.tag`. Nowe komponenty mają wyglądać, jakby były tam od zawsze. Żadnych nowych bibliotek poza tym, co wskazano (Chart.js już jest; dopuszczalny CDN adaptera dat — patrz Commit 3).
3. **Nie psuj** `dashboard/logs.html`, `dashboard/reports.html` ani ich skryptów — współdzielą `styles.css` i `data.js`, więc zmiany w tych plikach muszą być addytywne lub zweryfikowane na wszystkich trzech stronach.
4. **Puste stany:** każda nowa sekcja musi sensownie renderować się przy małej próbce (n=0, n=1) — krótka notka w stylu `.calib-note` zamiast pustej tabeli. Dane są małe (rząd wielkości: kilka kuponów, kilkadziesiąt predykcji) i takie pozostaną przez jakiś czas.
5. Kod i komentarze po angielsku, spójnie z resztą repo. Commit messages po angielsku, konwencja jak w historii repo.
6. Wszystkie nowe agregacje licz w JS z istniejącego `bets.json` — żadnych zmian formatu danych.
7. **Dane są żywe i rosną codziennie — ten spec NIE podaje konkretnych liczb.** Nie znajdziesz tu "35 predykcji" czy "12 nóg", bo takie wartości dezaktualizują się z każdym dniem. Zamiast tego: **na starcie pracy policz aktualny stan sam** (patrz "Baseline — policz przed kodowaniem" niżej) i to on jest Twoim punktem odniesienia. Kod i asserty liczą wszystko dynamicznie z `bets.json`; kryteria akceptacji sprawdzają relacje i spójność (np. `bet.n + pass.n === predictions.length`), nigdy konkretną liczbę.

---


---

## Baseline — policz przed kodowaniem

Zanim napiszesz jakikolwiek panel, uruchom w konsoli (lub jednorazowym skrypcie) poniższe agregacje na aktualnym `data/bets.json` i zanotuj wyniki dla siebie. To Twój punkt odniesienia na czas tej sesji — spec celowo ich nie podaje.

```js
const d = betsData;
const P = d.predictions, C = d.coupons || [], OP = d.observed_passes || [];

// predykcje
P.length;                                             // total
P.filter(p=>p.decision==='BET').length;               // BET
P.filter(p=>p.decision==='PASS').length;              // PASS
['won','lost','void','pending'].map(r=>[r,P.filter(p=>p.result===r).length]);
// per gra (null -> 'unknown')
[...new Set(P.map(p=>p.game||'unknown'))].map(g=>[g,P.filter(p=>(p.game||'unknown')===g).length]);
// settled w puli kalibracji (prob spójne z fair)
P.filter(p=>['won','lost'].includes(p.result) && typeof p.estimated_probability==='number'
            && Math.abs(p.estimated_probability-1/p.fair_odds)<=0.001).length;

// kupony i nogi
C.length;
const legs = C.flatMap(c=>c.selections||[]);
legs.length;                                          // suma nóg
['won','lost','void'].map(r=>[r,legs.filter(s=>s.result===r).length]);

// observed passes z kursem
OP.filter(o=>o.odds).length;
d.unit_value_pln;
```

Zweryfikuj też dwie **niezmienne relacje** (muszą zachodzić niezależnie od dnia) — jeśli któraś nie zachodzi, to błąd w danych albo w Twoim kodzie, zgłoś zanim ruszysz dalej:

- `BET + PASS === predictions.length`
- suma per-gra (łącznie z `unknown`) === `predictions.length`
- suma nóg === `Σ selections.length` po wszystkich kuponach
- `won + lost + void + pending === predictions.length`

## Commit 1 — `feat(dashboard): selection-level metrics engine + local data fallback`

Pliki: `dashboard/data.js`, `dashboard/dashboard.js` (tylko nowe funkcje, bez zmian w renderowaniu — render dochodzi w Commit 2).

### 1.1 Fallback lokalny w `data.js`

Obecnie `fetchBetsData()` zawsze pobiera z `raw.githubusercontent.com/main`, więc lokalny podgląd pokazuje wdrożone dane. Zmień na:

- Jeśli `location.hostname` ∈ {`localhost`, `127.0.0.1`} lub `location.protocol === 'file:'` → fetch ścieżki relatywnej. Uwaga na dwie lokalizacje stron: `index.html` w root (ścieżka `data/bets.json`) oraz `logs.html`/`reports.html` w `dashboard/` (ścieżka `../data/bets.json`). Wykryj po `location.pathname` (czy zawiera `/dashboard/`).
- W przeciwnym razie — GitHub raw jak dotychczas.
- Jeśli lokalny fetch rzuci błąd (np. otwarcie przez `file:` blokuje fetch), zrób fallback do GitHub raw w `catch`.

### 1.2 Silnik metryk selekcji — nowe czyste funkcje w `dashboard.js`

Dodaj funkcje (bez efektów ubocznych, przyjmują `betsData`):

**`getAllSelections(betsData)`** → spłaszczona lista wszystkich nóg ze wszystkich kuponów:
```
{ couponId, couponDate, couponStatus, match, market, pick, odds, result, notes, game }
```
Pole `game` uzupełnij przez join z `betsData.predictions` po kluczu `(date, match)`. **Uwaga:** nazwy meczów bywają NIESPÓJNE między źródłami — bukmacher skraca ("Ntigers", "Mocz"), a predykcje trzymają pełne nazwy ("Nuclear TigeRES", "MOUZ"), więc dosłowny join po stringu będzie czasem chybiał. Zastosuj znormalizowane porównanie (lowercase, trim, usuń wielokrotne spacje) i dopuść, że część nóg mimo to zostanie bez gry → `game: null`. Nie próbuj zgadywać gry heurystycznie — null jest poprawną wartością i renderuje się jako "unknown".

**`selectionStats(selections)`** → `{ total, won, lost, void, hitRate }` gdzie `hitRate = won / (won + lost)`, a `void` nie wchodzi do mianownika. Zwróć `hitRate: null` gdy mianownik = 0.

**`selectionsByOddsBucket(selections)`** → agregacja po przedziałach kursu nogi:
- Przedziały: `< 1.30`, `1.30–1.59`, `1.60–1.99`, `≥ 2.00` (granice: `[1, 1.30)`, `[1.30, 1.60)`, `[1.60, 2.00)`, `[2.00, ∞)`).
- Dla każdego kubełka: `{ label, n, won, lost, hitRate, avgOdds }`. Pomijaj kubełki z n=0 w renderze, ale funkcja może je zwracać.

**`selectionsByGame(selections)`** i **`selectionsByMarket(selections)`** → ta sama struktura co wyżej, klucz odpowiednio `game` (null → "unknown") i `market`.

**`decisionStats(predictions)`** → analiza BET vs PASS z `betsData.predictions`:
```
{
  bet:  { n, won, lost, void, pending, hitRate },
  pass: { n, won, lost, void, pending, hitRate },   // "won" = typ, którego NIE postawiono, wygrałby
}
```
Uwaga interpretacyjna (zostaw komentarz w kodzie): wysoki odsetek wygranych PASS-ów **nie** oznacza błędnej decyzji — PASS to werdykt o cenie (braku value), nie o zwycięzcy. To metryka kontekstowa, nie oceniająca.

**`observedPassStats(betsData.observed_passes)`** → dla wpisów z polem `odds`: symulowany wynik "gdyby postawić 1u": `{ n, hypotheticalNet }` przy stawce `betsData.unit_value_pln` (won → `stake*(odds-1)`, lost → `-stake`).

**`couponsByLegCount(coupons)`** → `{ legs: n, coupons, won, lost }` per liczba nóg (1 = single). Do panelu "anatomia kuponu" w Commit 2.

Nie podpinaj jeszcze niczego do UI. Sprawdź w konsoli (tymczasowy `console.assert` dopuszczalny, usuń przed commitem) wyłącznie **relacje**, nie konkretne liczby: `getAllSelections(betsData).length === Σ selections.length` po wszystkich kuponach, oraz `decisionStats.bet.n + decisionStats.pass.n === betsData.predictions.length`. Konkretne wartości weź z sekcji "Baseline" — nie wpisuj ich do asertów.

---

## Commit 2 — `feat(dashboard): selections, discipline and per-game panels; collapse calibration lab`

Pliki: `index.html`, `dashboard/dashboard.js`, `dashboard/styles.css`.

### 2.1 Nowa sekcja "Selections Performance" (nad "Recent Coupons")

Struktura:
- Nagłówek `.section-head`: **Selections Performance** + licznik w stylu `12 legs · 10 settled`.
- Rząd 4 kart (reuse `.kpi`/`.calib-grid`): **Selection Hit Rate** (z sub `xW – yL po nogach`), **Avg Leg Odds**, **Best Bucket** (kubełek kursowy z najwyższym hit rate przy n≥2; przy braku → "—"), **Worst Bucket** (analogicznie najniższy).
- Tabela w stylu `.calib-table`: **By odds range** — kolumny: Range / n / W–L / Hit rate. Wiersz z hit rate < 50% koloruj wartością `.neg`, ≥ 50% `.pos` (tylko kolumna hit rate).
- Druga tabela: **By market** — Market / n / W–L / Hit rate. Jeśli rynków jest tylko 1 (obecnie niemal wszystko to moneyline), pokaż tabelę i tak — z czasem się rozrośnie.

### 2.2 Nowa sekcja "Discipline Monitor" (pod Selections Performance)

- Nagłówek: **Discipline Monitor** + licznik w formacie `{N} predictions · {B} BET / {P} PASS` (wartości z danych).
- Poziomy pasek proporcji BET/PASS (reuse `.outcome-bar` + `.outcome-legend`; BET → `var(--edge)`, PASS → `var(--ink-faint)`).
- Dwie karty obok siebie: **BET record** (np. `4W – 4L`, sub: hit rate) i **PASS discipline**.
- **PASS discipline — WAŻNE, nie pokazuj samej trafności pasów.** Sama liczba "ile PASS-ów trafiłoby zwycięzcę" jest myląca i popycha do błędnego wniosku "za dużo pasujemy" — PASS to werdykt o CENIE (braku value), nie o zwycięzcy. Zamiast tego karta rozbija settled PASS-y na dwie grupy wg value (`value = market_odds_at_analysis / fair_odds − 1`):
  - **PASS przy value ≤ 0** (słuszne pasy — brak przewagi): pokaż `n` i ilu trafiło zwycięzcę. Trafienie tutaj to NIE strata — kurs był za niski.
  - **PASS przy value > 0** (potencjalnie stracone okazje): pokaż `n`, ilu trafiło, i sumaryczny hipotetyczny wynik "gdyby postawić 1u" (`won → stake*(odds−1)`, `lost → −stake`, stawka = `unit_value_pln`). **To jest jedyna liczba, która może uzasadniać poluzowanie progu PASS.**
  - Sub karty + `title` tooltip: "Trafiony PASS przy ujemnym value to dobra decyzja, nie strata. Tylko dodatnie value, które wygrywa, oznacza przeoczoną okazję."
  - Jeśli w danych nie ma jeszcze PASS-ów z dodatnim value: pokaż grupę value>0 jako `n=0` z notką "brak przeoczonych okazji — próg PASS działa".
- Jeśli `observed_passes` z kursami dają wynik: jedna linia `.calib-note`: `Observed passes with odds: n=X · hypothetical result at 1u: ±Y PLN · discipline {saved|cost} money` (znak i słowo wyliczone z danych, nie hardkoduj).

### 2.3 Nowa sekcja "By Game" (trzy mini-karty)

- Rząd 3 kart (grid jak `.kpi-row`, ale 3 kolumny; na mobile 1 kolumna): **CS2**, **LoL**, **Dota 2**.
- Każda karta: liczba predykcji, mix BET/PASS, rekord selekcji z `selectionsByGame` (jeśli dla danej gry brak selekcji z joinem — pokaż tylko predykcje). CS2 oznacz subtelnie jako rynek główny (np. sub `primary market` w kolorze `--edge`).

### 2.4 Calibration Lab — zwinięcie do paska postępu

- Domyślnie sekcja pokazuje TYLKO kompaktowy pasek: `Calibration Lab — collection phase · 26/50 settled` + pasek postępu (reuse `.outcome-bar`, segment `var(--edge)`) + strzałka/`+` do rozwinięcia.
- Klik rozwija pełną obecną zawartość (bez żadnych zmian w jej logice i treści). Ponowny klik zwija. Bez persystencji.
- Gdy `settledEst >= CAL_T.PRELIM` (50), sekcja domyślnie startuje rozwinięta.
- Liczby w pasku licz z danych (te same zmienne, których używa `renderCalibration`) — nie hardkoduj 26/50.

### 2.5 Kolejność sekcji na stronie (top → bottom)

1. Header, 2. KPI (na razie 2 rzędy — redukcja w Commit 3), 3. Charts (P&L + Outcome Split), 4. **Selections Performance**, 5. **Discipline Monitor**, 6. **By Game**, 7. Calibration Lab (zwinięty), 8. Recent Coupons.

---

## Commit 3 — `refactor(dashboard): consolidate KPIs, rebuild P&L chart, improve coupons table`

Pliki: `index.html`, `dashboard/dashboard.js`, `dashboard/styles.css`.

### 3.1 KPI — jeden rząd zamiast dwóch

- Usuń `#kpiRow2` i jego render. Zostaje jeden rząd: **Net Result** / **ROI** / **Selection Hit Rate** / **Streak**.
- **Net Result**: format 2 miejsca po przecinku (`fmt(x, 2)`), nie 3. Sub bez zmian.
- **ROI**: sub zmień z "vs. flat stake baseline" na `on 12.00 PLN staked · flat 1u stakes` (kwota z danych).
- **Selection Hit Rate** zastępuje dotychczasowy kuponowy Hit Rate: wartość = hit rate po nogach, sub = `coupons: 2W – 4L` (z danych). Kolor: `pos` ≥ 55%, brak koloru 45–55%, `neg` < 45%.
- **Streak** bez zmian (nadal liczony po kuponach — dodaj w sub słowo `coupons`, np. `2 losses in a row (coupons)`).
- W modalu szczegółów kuponu też popraw `fmt(...,3)` → `fmt(...,2)` dla PLN.

### 3.2 Wykres Cumulative P&L

- Oś X: **daty** zamiast ID kuponów. Preferencja: skala `time` (dodaj do `index.html` CDN `chartjs-adapter-date-fns`; jeśli z jakiegoś powodu nie działa — akceptowalny fallback: oś kategorii z etykietami `MM-DD`, duplikaty dat dozwolone). Przy skali czasowej kupony z tego samego dnia agreguj do jednego punktu (suma net z dnia, tooltip listuje ID kuponów).
- Dodaj punkt startowy `(pierwsza data − 1 dzień, 0)` żeby linia zaczynała od zera.
- Wyraźna linia zera: albo plugin adnotacji NIE — bez nowych pluginów; wystarczy `grid` z pogrubioną linią przy 0 (scriptable `color`/`lineWidth` w `scales.y.grid`).
- Wypełnienie zależne od znaku: `fill: { target: 'origin', above: 'rgba(94,194,106,.10)', below: 'rgba(255,92,77,.10)' }`. Kolor linii: scriptable per segment — nad zerem `var(--pos)`-owy odcień, pod zerem `--neg`; jeśli segmentowe kolorowanie komplikuje kod, dopuszczalne: linia stała `--edge`, samo wypełnienie above/below.
- Tooltip: data, dzienny net, skumulowany total, ID kuponów.
- Tytuł panelu: dopisz w `#plMeta` aktualny total, np. `total −3.59 PLN` (kolor pos/neg).

### 3.3 Tabela Recent Coupons

- Kolumny: `ID / Date / Type / Game / Stake / Odds / Return / Status / →` .
  - **Type**: `single` lub `acca · N` (N = liczba nóg).
  - **Game**: z joinu selekcji (jeśli wszystkie nogi z jednej gry → jej nazwa; mieszane → `multi`; brak danych → `—`). Obecnie wszystkie kupony to CS2.
  - **Usuń kolumnę ROI** (przy stałej stawce redundantna wobec Return).
- Return koloruj: > stake → `.pos`, 0 → `.neg` (tylko wartość, nie cały wiersz).
- Mobile (media query): przy < 768px ukryj kolumny Type i Odds (analogicznie do istniejącego wzorca `nth-child`); zweryfikuj, że obecna reguła `nth-child(4)` po zmianie kolumn ukrywa właściwą kolumnę — zaktualizuj indeksy.

### 3.4 Drobne

- `renderTable` licznik bez zmian. Sprawdź, że parametr `?open=EDGE-00x` nadal otwiera modal.
- Upewnij się, że strona przy szerokości 380px nie ma poziomego scrolla.

---

## Poza zakresem (NIE ruszaj teraz)

- Przełącznik per `agent` (gpt/claude) — dane jeszcze jednostronne; przewidziane na później. Możesz jedynie zostawić `// TODO(agent-filter)` przy `decisionStats`.
- Filtry dat / gry na poziomie całej strony.
- Jakiekolwiek zmiany w metodologii Calibration Lab.

## Kryteria akceptacji (sprawdź przed pushem)

1. `python3 -m http.server` w root repo → `index.html`, `dashboard/logs.html`, `dashboard/reports.html` działają bez błędów w konsoli, dane ładują się lokalnie (fallback z 1.1).
2. **Weryfikuj relacje, nie liczby.** Wartości bieżące masz z sekcji "Baseline"; kryteria sprawdzają, że panele odtwarzają je z danych i że zachodzą niezmienne relacje:
   - Selections Performance: wyświetlona liczba nóg === suma `selections` po wszystkich kuponach; hit rate === `won/(won+lost)` po nogach.
   - Discipline Monitor: `bet.n + pass.n` === `predictions.length`; pasek proporcji sumuje się do 100%.
   - By Game: suma liczników per-gra (łącznie z "unknown") === `predictions.length`.
   - Calibration Lab pasek: liczba settled === wartość policzona przez `renderCalibration` (obie muszą być identyczne — ta sama zmienna).
3. Calibration Lab domyślnie zwinięty, rozwija się i zwija klikiem, pełna zawartość identyczna jak przed zmianą.
4. Wykres P&L zaczyna od 0, ma oś dat, wypełnienie czerwone pod zerem.
5. Jeden rząd KPI; wszystkie kwoty PLN z 2 miejscami po przecinku.
6. Widok mobilny (380px): brak poziomego scrolla, karty w 2/1 kolumnach.
7. Trzy osobne commity zgodnie ze spec; każdy commit buduje działającą stronę.

---

## Zmiany względem v1 (wprowadzone po review)

1. **Zasada 7 + sekcja "Baseline"** — spec nie podaje żadnych konkretnych liczb (dezaktualizują się co dzień). Agent liczy aktualny stan sam na starcie wg gotowego snippetu i weryfikuje niezmienne relacje; kod i asserty liczą dynamicznie.
2. **Discipline Monitor (2.2)** — karta PASS przebudowana: zamiast mylącej "trafności pasów" rozbija PASS-y wg value (≤0 = słuszne, >0 = potencjalnie stracone). Tylko dodatnie value uzasadnia zmianę progu PASS. To zabezpiecza przed antywzorcem "trafność ≠ wartość".
3. **Join `game` (1.2)** — ostrzeżenie o niespójnych nazwach meczów (skróty bukmachera vs pełne nazwy) + wymóg znormalizowanego porównania.
4. **Kryteria akceptacji** — przepisane na weryfikację relacji (BET+PASS=total, suma nóg=Σselekcji itd.) zamiast konkretnych liczb.
