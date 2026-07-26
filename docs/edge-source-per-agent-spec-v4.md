# Edge — Source-per-Agent + UI Fixes Spec (v4)

Zadanie dla agenta kodującego. Repo: `dgrochowicki/Edge`. Odświeżenie spec v3 na aktualny stan repo (26.07.2026) — **liczby weryfikacyjne v3 były nieaktualne** i sprawdzałyby się na fałsz mimo poprawnego kodu. v4 zawiera żywe liczby policzone z `data/bets.json` oraz przeramowuje Zmianę C (patrz niżej — częściowo zdezaktualizowana przez postęp danych).

Kolejność: **A najpierw** (zmienia model danych + kod, reszta na nim bazuje), potem B, D w dowolnej kolejności. **C wymaga decyzji użytkownika przed implementacją — patrz sekcja C.**

Kontekst: rozdzielamy trzy pojęcia, które wcześniej się zlewały — **predykcja** (ocena meczu przez agenta, BET/PASS, warstwa metody, żyje na Research), **rekomendacja** (predykcja z werdyktem BET), **kupon** (realnie postawiony zakład, ma `source`). Kupon z rekomendacji agenta ma być odróżnialny od własnej decyzji użytkownika — i ma nieść informację, *którego* agenta rekomendacja.

---

## Aktualny stan danych (zweryfikowany 26.07.2026)

Policzone z `data/bets.json` — **używać tych liczb w kryteriach akceptacji, nie liczb z v3:**

- **predictions:** 115 (gpt 84, claude 31); results: won 64, lost 45, pending 4, void 2.
- **coupons:** 22 — source: `user_bet` 18, `official_recommendation` 2, `recommendation_gpt` 1, `recommendation_claude` 1.
- **Kupony rekomendacji (4 łącznie):**
  - `official_recommendation` EDGE-001 — lost, net −2.00
  - `official_recommendation` EDGE-002 — lost, net −2.00
  - `recommendation_gpt` EDGE-016 — won, net +2.66
  - `recommendation_claude` EDGE-018 — lost, net −2.00
  - **Razem: 1W–3L, net −3.34 PLN.**
- **settled-z-estymatą per agent** (definicja z Calibration Lab `settledEst`): **gpt 72/50, claude 30/50.**

> Uwaga strukturalna: kupony używają pól `status` (`won`/`lost`) i `net_result_pln`, **nie** `result`/`pnl`. Predykcje używają `result` (`won`/`lost`/`pending`/`void`). Nie mylić tych dwóch modeli.

> Uwaga krytyczna: konwencja `recommendation_<agent>` **już istnieje w danych** (EDGE-016, EDGE-018). Zmiana A nie wprowadza jej od zera — ona utrwala w kodzie klasyfikację, która już jest w danych, i zapewnia, że stary format (`official_recommendation`) nadal działa.

---

## Zasady nadrzędne

1. **NIE zmieniaj** metodologii Calibration Lab, progów `CAL_T`, `validatePredictions`, Brier/CLV. Nie dotykaj `reports/`, `docs/`, `README.md`.
2. Zachowaj estetykę terminala i istniejące klasy CSS. Bez nowych bibliotek.
3. `shared-metrics.js`, `data.js`, `sidebar.js` są współdzielone przez wszystkie strony — zmiany addytywne, zweryfikowane wszędzie.
4. Puste/małe stany renderują notkę, nie pusty/mylący element.
5. Kod, komentarze, commity po angielsku.

---

## Zmiana A — `feat(data): source convention carries recommending agent`

Cel: `source` na kuponie ma odróżniać własny zakład od rekomendacji **oraz** nieść nazwę agenta, którego rekomendację postawiono.

### A.1 Konwencja wartości `source`

Wartości pola `coupon.source`:
- `user_bet` — własna decyzja użytkownika.
- `recommendation_<agent>` — kupon z rekomendacji agenta, `<agent>` małymi literami spójnie z `prediction.agent` (`recommendation_gpt`, `recommendation_claude`).
- `official_recommendation` — **legacy**, 2 istniejące kupony (EDGE-001, EDGE-002), agent nieznany. Kod MUSI nadal je rozpoznawać jako rekomendacje.

**Kompatybilność wstecz:** nie zmieniaj `data/bets.json` w tym commicie. Klasyfikacja jest w kodzie; dane migrują naturalnie przy dodawaniu nowych kuponów. (Migracja 2 legacy wpisów jest opcjonalna, osobnym commitem, tylko jeśli agent znany z raportu — inaczej zostaw `official_recommendation`.)

### A.2 Jedna funkcja klasyfikująca, reszta przez nią

Scentralizuj klasyfikację źródła w `shared-metrics.js` (obecnie rozproszona po ~6 miejscach z płytkim porównaniem stringów):

```
function isRecommendation(source) {
    return source === 'official_recommendation' || (typeof source === 'string' && source.startsWith('recommendation'));
}
function isUserBet(source) { return source === 'user_bet'; }
function recAgent(source) {
    // 'recommendation_gpt' -> 'gpt'; 'official_recommendation' -> null (agent unknown)
    if (typeof source !== 'string' || !source.startsWith('recommendation_')) return null;
    return source.slice('recommendation_'.length) || null;
}
function sourceGroup(source) { // 'edge' | 'own' | 'unknown'
    if (isRecommendation(source)) return 'edge';
    if (isUserBet(source)) return 'own';
    return 'unknown';
}
```

Przepnij WSZYSTKIE istniejące miejsca na te helpery — nie zostawiaj żadnego surowego `=== 'official_recommendation'`:
- `shared-metrics.js` `couponsBySource` (`groupOf`) → `sourceGroup`.
- `dashboard.js` `couponsForSource` (`src === 'real' ? 'user_bet' : 'official_recommendation'` + `c.source === key`) → filtr przez `isUserBet`/`isRecommendation` zależnie od `src`.
- `logs.js` `couponsForSource` (identyczny wzorzec) → to samo.
- `logs.js` `sourceTag` → `real` gdy `isUserBet`, `rec` gdy `isRecommendation`, inaczej `—`. Dopisanie agenta w tagu rec: patrz A.3.
- `shared-metrics.js` `showDetails` (`c.source.replace('_',' ')`) → czytelnie: rekomendacja z agentem `recommendation_gpt` → `Edge rec · gpt`; `official_recommendation` → `Edge rec`; `user_bet` → `own bet`. Nie pokazuj surowego stringa z podkreśleniem.

> Numery linii z v3 mogły się przesunąć — lokalizuj po nazwach funkcji/wzorcach, nie po numerach.

### A.3 Ekspozycja agenta w UI (drobna, tania)

- **Logs, kolumna Source:** `recommendation_<agent>` → tag `rec · <agent>` (np. `rec · gpt`, styl istniejącego `.source-tag.rec`). `official_recommendation` → samo `rec`. `user_bet` → `real`.
- **Modal szczegółów** (`showDetails`): w wierszu Source pokaż agenta jak wyżej.
- Nie dodawaj nic więcej — subtelne, nie nowy panel.

### A.4 Weryfikacja A (ŻYWE LICZBY)

- Wszystkie **4** kupony rekomendacji (2× `official_recommendation` + `recommendation_gpt` + `recommendation_claude`) liczą się do grupy „Edge recommendations" w Bet Source i do filtra `Recommended`.
- Filtr `Recommended` na P&L i Logs łapie oba formaty (stary i nowy).
- Bet Source / filtr Recommended pokazuje: **4 kupony, 1W–3L, net −3.34 PLN.** (v3 podawał błędnie „2 kupony, 0W–2L, net −4.00" — to była nieaktualna migawka.)
- Kupon `recommendation_gpt` (EDGE-016) klasyfikuje się jako Edge i pokazuje `rec · gpt`; `recommendation_claude` (EDGE-018) → `rec · claude`.

---

## Zmiana B — `fix(dashboard): label Outcome Split as all-coupons scope`

Problem: przełącznik P&L filtruje wykres po źródle (All/Real/Recommended), ale Outcome Split obok czyta `betsData.summary` (globalne liczby) i się nie zmienia. Dwa moduły obok siebie sugerują ten sam zakres, choć go nie mają.

**Rozwiązanie — etykieta, NIE sprzęganie z togglem.** (Świadoma decyzja: sprzęgnięcie odtworzyłoby pustkę małej próbki — „Recommended" to 4 kupony, dałoby wizualnie bezużyteczny pasek. Outcome Split ma pozostać migawką całości.)

- Zmień tytuł panelu Outcome Split z `Outcome Split` na `Outcome Split · all coupons` (`index.html`, `<div class="panel-title">`).
- Gdy przełącznik P&L na `real`/`rec` (nie `all`), pokaż dyskretny dopisek (`.pnl-source-caption`): `chart filtered · outcome split shows all coupons`. Gdy `all` — bez dopisku. Podepnij do `setPnlSource`/`renderCharts`.
- `renderOutcomeBar` bez zmian merytorycznych — nadal liczy z `summary` (całość). Celowe.

---

## Zmiana C — `feat(research): per-agent calibration status` — **WYMAGA DECYZJI PRZED KODOWANIEM**

> **To jest miejsce, gdzie v3 się zdezaktualizował najmocniej i gdzie NIE należy kodować na ślepo.**

v3 zakładał, że oba agenty są **poniżej** progu 50 (gpt 45/50, claude 19/50) i proponował „liczniki postępu do odblokowania" jako informacyjny placeholder. Realnie: **gpt ma 72/50 settled-z-estymatą — już przekroczył próg.** claude ma 30/50.

Sens zadania się zmienił. To nie jest już „licznik do odblokowania" — bo dla gpt kalibracja per-agentowa jest technicznie odblokowana. Powstaje **decyzja metodologiczna, nie kosmetyczna:**

> gpt przekroczył próg `CAL_T.PRELIM` (50). Czy włączamy per-agentową kalibrację/werdykty dla gpt teraz, czy czekamy aż oba agenty przekroczą próg, czy trzymamy się progu 150 (validation checkpoint) zanim cokolwiek się „odblokowuje"?

To jest dokładnie ten typ decyzji, który playbook każe podejmować, gdy dane dojrzeją — a nie doklejać do zadania UI. **Do rozstrzygnięcia przez użytkownika przed implementacją C.**

Warianty implementacyjne (do wyboru PO decyzji):
- **C-wait:** zostaw statyczny banner, ale zaktualizuj jego treść na prawdziwy stan („gpt past preliminary threshold; claude collecting — per-agent comparison held until [kryterium]"). Minimalna zmiana, zero logiki. Rekomendowane jeśli decyzja brzmi „czekamy".
- **C-counters:** liczniki postępu jak w v3, ale próg i semantyka wg decyzji. Dla gpt (≥50) wiersz oznaczony jako „preliminary reached", dla claude pasek n/50. Wspólna funkcja `settledEstCount(preds, agent)` w `shared-metrics.js` (nie kopia definicji `settledEst`). Żywe wartości do weryfikacji: **gpt 72, claude 30** — liczone, nie hardkodowane.
- **C-unlock:** faktyczne włączenie per-agentowej kalibracji gpt. **Najdalej idące — dotyka warstwy metody, nie tylko UI. Nie robić bez wyraźnej, osobnej zgody i najpewniej osobnego specu.**

Do czasu decyzji: **C poza zakresem tego wdrożenia.** A, B, D są od C niezależne i można je zrobić bez niej.

---

## Zmiana D — `chore: consistency pass`

Tylko jeśli szybkie:
- Po Zmianie A żadne miejsce nie renderuje surowego `official_recommendation`/`recommendation_gpt` z podkreśleniem — wszędzie czytelna forma.
- Spójność języka etykiet na Research (EN dla etykiet technicznych, spójnie z resztą UI).

---

## Poza zakresem

- Zmiana C w wariancie C-counters/C-unlock do czasu decyzji użytkownika (patrz C).
- Klikalne taby porównania agentów gpt vs claude.
- Sprzęganie Outcome Split z przełącznikiem źródła (świadomie odrzucone — patrz B).
- Osobne wykresy P&L per źródło/agent.
- Migracja 2 legacy `official_recommendation` do formatu z agentem (opcjonalna).

## Kryteria akceptacji

1. Wszystkie strony ładują się bez błędów w konsoli; dane lokalnie (fallback `data.js`); sidebar i linki działają.
2. **A:** żaden surowy `=== 'official_recommendation'` nie został w kodzie — cała klasyfikacja przez helpery. **4** kupony rekomendacji liczą się jako Edge; Bet Source / filtr Recommended pokazuje **4 kupony, 1W–3L, net −3.34 PLN**. `recommendation_gpt` → `rec · gpt`, `recommendation_claude` → `rec · claude`, `official_recommendation` → `rec`.
3. **B:** tytuł „Outcome Split · all coupons"; przy filtrze Real/Recommended widoczny dopisek o zakresie; sam pasek Outcome nadal pokazuje całość.
4. **C:** **nie implementowane bez decyzji użytkownika.** Jeśli decyzja = C-wait: banner zaktualizowany na prawdziwy stan (gpt past preliminary, claude collecting). Jeśli C-counters: liczniki `gpt 72`, `claude 30` policzone (nie hardkod), wspólna funkcja z Calibration Lab.
5. Modal i `?open=` działają na Logs; Source w modalu czytelny, z agentem dla rekomendacji.
6. Mobile 380px: brak poziomego scrolla na żadnej ze stron.

---

## Zmiany względem v3 (changelog)

- Liczby weryfikacyjne odświeżone na stan 26.07: 4 kupony rekomendacji (było 2), net −3.34 (było −4.00), 1W–3L (było 0W–2L).
- Dodano sekcję „Aktualny stan danych" z żywymi liczbami i uwagą o polach `status`/`net_result_pln` vs `result`.
- Zmiana C przeramowana: z „liczniki do progu" (nieaktualne, gpt już przekroczył 50) na **decyzję metodologiczną wymagającą wyboru użytkownika** przed kodowaniem; dodano warianty C-wait / C-counters / C-unlock.
- Usunięto numery linii jako wiążące — lokalizacja po nazwach funkcji (kod się przesunął).
