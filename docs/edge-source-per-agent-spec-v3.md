# Edge — Source-per-Agent + UI Fixes Spec (v3)

Zadanie dla agenta kodującego. Repo: `dgrochowicki/Edge`. Cztery drobne, powiązane zmiany w jednym spójnym zestawie. Kolejność: **A najpierw** (zmienia model danych + kod, reszta na nim bazuje), potem B, C, D w dowolnej kolejności. Każdą zmianę można zrobić osobnym commitem albo całość jednym — do uznania, byle po całości wszystkie 4 strony działały bez błędów w konsoli.

Kontekst: rozdzielamy trzy pojęcia, które wcześniej się zlewały — **predykcja** (ocena meczu przez agenta, BET/PASS, warstwa metody, żyje na Research), **rekomendacja** (predykcja z werdyktem BET), **kupon** (realnie postawiony zakład, ma `source`). Kupon z rekomendacji agenta ma być odróżnialny od własnej decyzji użytkownika — i ma nieść informację, *którego* agenta rekomendacja.

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

### A.1 Nowa konwencja wartości `source`

Docelowe wartości pola `coupon.source`:
- `user_bet` — własna decyzja użytkownika (bez zmian).
- `recommendation_<agent>` — kupon postawiony z rekomendacji agenta, gdzie `<agent>` to małe litery nazwy agenta spójnej z `prediction.agent` (np. `recommendation_gpt`, `recommendation_claude`).

**Kompatybilność wstecz:** w danych istnieją 2 kupony z dotychczasową wartością `official_recommendation` (bez agenta). Kod MUSI nadal je rozpoznawać jako rekomendacje. Nie zmieniaj `data/bets.json` w tym commicie — poprawka jest w kodzie, dane migrują naturalnie przy dodawaniu nowych kuponów. (Jeśli zdecydujesz się zmigrować 2 istniejące wpisy, zrób to świadomie osobnym commitem i ustaw agenta tylko jeśli jest znany z raportu — inaczej zostaw `official_recommendation`.)

### A.2 Jedna funkcja klasyfikująca, reszta przez nią

Obecnie klasyfikacja źródła jest rozproszona po 6 miejscach z płytkim porównaniem stringów. Scentralizuj to w `shared-metrics.js`:

Dodaj helpery (nazwy przykładowe):
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
- `shared-metrics.js` `couponsBySource` linia ~164 (`groupOf`) → użyj `sourceGroup`.
- `dashboard.js` `couponsForSource` linia ~110 (`src === 'real' ? 'user_bet' : 'official_recommendation'` + `c.source === key`) → filtr przez `isUserBet`/`isRecommendation` zależnie od `src`.
- `logs.js` `couponsForSource` linia ~28 (identyczny wzorzec) → to samo.
- `logs.js` `sourceTag` linie ~92–95 → `real` gdy `isUserBet`, `rec` gdy `isRecommendation`, inaczej `—`. Rozważ dopisanie agenta w tagu rec (patrz A.3).
- `shared-metrics.js` `showDetails` linia ~474 (`c.source.replace('_',' ')`) → wyświetl czytelnie: dla rekomendacji `recommendation gpt` → `Edge rec · gpt` (albo `recommendation (gpt)`); dla `official_recommendation` → `Edge rec`; dla `user_bet` → `own bet`. Nie pokazuj surowego stringa z podkreśleniem.

### A.3 Ekspozycja agenta w UI (drobna, tam gdzie tania)

- **Logs, kolumna Source:** dla kuponów `recommendation_<agent>` pokaż tag `rec` z dopiskiem agenta, np. `rec · gpt` (mały, w stylu istniejącego `.source-tag.rec`). Dla `official_recommendation` (agent nieznany) samo `rec`. Dla `user_bet` — `real`.
- **Modal szczegółów** (`showDetails`): w wierszu Source pokaż agenta jak wyżej.
- Nie dodawaj nigdzie indziej — to ma być subtelne, nie nowy panel.

### A.4 Weryfikacja A

- Dwa istniejące kupony `official_recommendation` nadal liczą się do grupy „Edge recommendations" w Bet Source i do filtra `Recommended` na wykresie (dziś: 2 kupony, 0W–2L, net −4.00).
- Filtr `Recommended` na P&L i na Logs nadal działa (łapie stary i nowy format).
- Ręcznie dodany testowy kupon `recommendation_gpt` (możesz go tymczasowo dopisać w konsoli/pamięci, NIE commituj do JSON) klasyfikuje się jako Edge i pokazuje `rec · gpt`.

---

## Zmiana B — `fix(dashboard): label Outcome Split as all-coupons scope`

Problem: przełącznik P&L filtruje wykres po źródle (All/Real/Recommended), ale Outcome Split obok czyta `betsData.summary` (globalne liczby wszystkich kuponów) i się nie zmienia. Dwa moduły obok siebie sugerują ten sam zakres, choć go nie mają.

**Rozwiązanie — etykieta, NIE sprzęganie z togglem.** (Świadoma decyzja: sprzęgnięcie odtworzyłoby pustkę małej próbki — „Recommended" to 2 kupony, dałoby pasek „Lost 100%", wizualnie bezużyteczny. Outcome Split ma pozostać migawką całości; jego wartością jest pełny obraz obok filtrowanego wykresu.)

- Zmień tytuł panelu Outcome Split z `Outcome Split` na `Outcome Split · all coupons` (w `index.html` linia ~47, `<div class="panel-title">`).
- Gdy przełącznik P&L jest na `real` lub `rec` (nie `all`), pokaż pod przełącznikiem albo w obszarze Outcome Split dyskretny dopisek w stylu `.pnl-source-caption`: `chart filtered · outcome split shows all coupons`. Gdy `all` — bez dopisku. Podepnij tę logikę do `setPnlSource`/`renderCharts`, które już zarządzają stanem przełącznika.
- `renderOutcomeBar` bez zmian merytorycznych — nadal liczy z `summary` (całość). To celowe.

---

## Zmiana C — `feat(research): agent progress counters replace static banner`

Obecnie na Research (`research.html` linia ~31) jest statyczny placeholder: „Comparing gpt vs claude — coming once each agent has enough settled predictions on its own." Zamień go na **żywe liczniki postępu** do progu odblokowania per-agentowej kalibracji.

### C.1 Licznik — DOKŁADNIE ta sama definicja co Calibration Lab

Licz **rozliczone predykcje z estymatą prawdopodobieństwa, po odfiltrowaniu niepoprawnych** — spójnie z `settledEst` w `renderCalibration` (`shared-metrics.js` ~308–314):
```
valid = predictions po odfiltrowaniu validatePredictions()  // te same invalidIds
settledEst(agent) = valid.filter(p => p.agent === agent
                                   && (p.result === 'won' || p.result === 'lost')
                                   && typeof p.estimated_probability === 'number').length
```
Próg = `CAL_T.PRELIM` (50). **NIE licz wszystkich predykcji agenta** — to dałoby mylące liczby (gpt ma 54 predykcji, ale rozliczonych-z-estymatą 45; pokazanie 54/50 sugerowałoby gotowość, której nie ma). Licznik ma zgadzać się co do sztuki z tym, co Calibration Lab uznaje za „settled".

Wyekstrahuj wspólną funkcję (np. `settledEstCount(preds, agent)` w `shared-metrics.js`), żeby Calibration Lab i licznik używały tego samego kodu, nie dwóch kopii.

### C.2 Render

- Dla każdego agenta obecnego w danych (`[...new Set(predictions.map(p => p.agent))]`, pomiń null): wiersz `AGENT  n / 50` + cienki pasek postępu (reuse `.outcome-bar`/segment jak w `renderCalibCompact`, wypełnienie `--edge`, `min(100, n/50*100)%`).
- Aktualne wartości do weryfikacji (z danych): `gpt 45 / 50`, `claude 19 / 50`. Nie hardkoduj — licz.
- Nagłówek sekcji: krótki, np. `Per-agent calibration — unlocks at 50 settled` + zachowaj komentarz `<!-- TODO(agent-tabs) -->` (struktura pod przyszłe klikalne taby zostaje).
- Gdy agent osiągnie próg (n ≥ 50), oznacz wiersz jako gotowy (np. `--pos`, ptaszek/`ready`) — ale NIE implementuj jeszcze samych tabów porównania. To nadal placeholder, tyle że informacyjny.
- Umieść to w `research.js` (nowa funkcja `renderAgentProgress()`, wołana z `renderResearch()`), wstrzyknij do kontenera, który zastąpi obecny statyczny `.calib-note`.

---

## Zmiana D — `chore: consistency pass`

Drobiazgi wychwycone przy okazji, tylko jeśli szybkie:
- Upewnij się, że po Zmianie A żadne miejsce nie renderuje surowego `official_recommendation`/`recommendation_gpt` z podkreśleniem do użytkownika — wszędzie czytelna forma.
- `research.html` tagline jest po angielsku przy `lang="pl"` — zostaw, ale zweryfikuj że reszta nowych etykiet na Research trzyma jeden język (EN dla etykiet technicznych, spójnie z resztą UI).

---

## Poza zakresem

- Klikalne taby porównania agentów gpt vs claude (nadal tylko placeholder + liczniki).
- Sprzęganie Outcome Split z przełącznikiem źródła (świadomie odrzucone — patrz B).
- Osobne wykresy P&L per źródło/agent.
- Migracja 2 istniejących `official_recommendation` do formatu z agentem (opcjonalna, tylko jeśli agent znany z raportu).

## Kryteria akceptacji

1. Wszystkie 4 strony ładują się bez błędów w konsoli; dane lokalnie (fallback `data.js`); sidebar i linki działają.
2. **A:** żaden surowy `=== 'official_recommendation'` nie został w kodzie — cała klasyfikacja przez helpery `isRecommendation`/`sourceGroup`/`recAgent`. Dwa istniejące kupony rekomendacji nadal liczą się jako Edge (Bet Source: 2 kupony; filtr Recommended na P&L pokazuje notkę „2 settled · 0W–2L · net −4.00"). Kupon `recommendation_gpt` (test) klasyfikuje się jako Edge i pokazuje `rec · gpt`.
3. **B:** tytuł „Outcome Split · all coupons"; przy filtrze Real/Recommended widoczny dopisek o zakresie; sam pasek Outcome nadal pokazuje całość.
4. **C:** statyczny banner zastąpiony licznikami; `gpt 45/50`, `claude 19/50` (policzone, nie hardkod); definicja liczenia identyczna z `settledEst` Calibration Lab (wspólna funkcja, nie kopia); paski postępu renderują się; próg 50 oznacza gotowość bez włączania tabów.
5. Modal i `?open=` działają na Logs; Source w modalu czytelny, z agentem dla rekomendacji.
6. Mobile 380px: brak poziomego scrolla na żadnej z 4 stron.
