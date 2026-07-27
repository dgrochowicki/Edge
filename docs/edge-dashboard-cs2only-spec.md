# Edge — Dashboard CS2-only migration spec

Zadanie dla agenta kodującego. Repo: `dgrochowicki/Edge`. Kontekst: projekt przeszedł na **CS2-only** (decyzja 2026-07-27, patrz `docs/PROJECT_MEMORY.md` i PLAYBOOK Scope). 25 wpisów nie-CS2 (LoL/Dota) jest usuwanych z `data/bets.json`. Panel obecnie zakłada trzy gry i ma dedykowaną sekcję „By Game" — po migracji trzeba go dostosować, żeby nie pokazywał martwych/pustych sekcji dla gier, których już nie ma.

## Kolejność względem czyszczenia danych

Ten spec zakłada, że **usunięcie 25 wpisów nie-CS2 z `bets.json` już nastąpiło** (wg `docs/cs2-cleanup-2026-07-27.md`). Jeśli jeszcze nie — najpierw dane, potem panel. Kod poniżej jest bezpieczny w obu kolejnościach (nie zakłada istnienia wpisów LoL/Dota), ale wizualnie sensowny dopiero po czyszczeniu.

## Zasady nadrzędne

1. **NIE zmieniaj** metodologii Calibration Lab, progów `CAL_T`, `settledEstPredictions`, wzorów Brier/CLV, logiki per-agent. Ten spec dotyczy tylko warstwy „gra".
2. Nie dotykaj `reports/`, `data/bets.json` (poza czyszczeniem wg osobnej listy), `README.md`.
3. Zmiany addytywne/upraszczające; zachowaj estetykę terminala i istniejące klasy CSS. Bez nowych bibliotek.
4. Kod, komentarze, commity po angielsku.

## Aktualny stan (zweryfikowany w kodzie)

Miejsca dotykające „gry":

- `shared-metrics.js` ~203: `BY_GAME_LIST` — taksonomia trzech gier (`cs2` primary, `lol`, `dota2`).
- `shared-metrics.js` ~95: `selectionsByGame(selections)` — grupowanie legów kuponów po grze.
- `shared-metrics.js` ~51: przypisanie `game` do selekcji z predykcji.
- `shared-metrics.js` ~283: tekst pomocy `byGame` („Te same metryki w podziale na grę: CS2, LoL, Dota 2…").
- `research.js` ~122 `renderByGame()`: sekcja „By Game" — renderuje kartę per pozycja `BY_GAME_LIST` (CS2 + dwie puste po migracji).
- `research.js` ~31: `disciplineBody`/`disciplineCount` — osobna sekcja, nie mylić (to PASS discipline, nie gra).
- `logs.js` ~82 `couponGameLabel()` + ~109/115: kolumna „gra" w tabeli kuponów.

## Zmiana A — sekcja „By Game" na Research

Po CS2-only sekcja „By Game" traci sens: pokazywałaby CS2 z liczbami i dwie puste karty (`LoL 0 / Dota 2 0`). Podział na gry przy jednej grze to pusty podział.

**Preferencja: usunąć sekcję „By Game" w całości.** Konkretnie:
- `research.js`: usuń `renderByGame()` i jej wywołanie; usuń kontener `#byGameBody` z `research.html` wraz z nagłówkiem sekcji.
- `shared-metrics.js`: usuń wpis pomocy `byGame` (~283) jeśli nigdzie indziej nie używany.
- `BY_GAME_LIST` (~203): jeśli po usunięciu `renderByGame` nie ma innych konsumentów — usuń. **Sprawdź najpierw**: używa jej też `couponGameLabel`? Z grep wynika, że taksonomia była współdzielona z kolumną gry w kuponach — jeśli tak, patrz Zmiana B, i wtedy `BY_GAME_LIST` może zostać zredukowana do samego CS2 zamiast usunięta.

**Alternatywa (jeśli wolisz zachować):** zamiast usuwać, zredukuj `BY_GAME_LIST` do samego `cs2` i pokaż sekcję jako pojedynczą kartę bez podziału. Gorsze — zostawia „podział", który nic nie dzieli. Rekomendacja: usunąć.

## Zmiana B — kolumna „gra" w Logs

`couponGameLabel()` (logs.js ~82) wyznacza etykietę gry dla kuponu z jego legów. Po CS2-only wszystkie legi to CS2, więc kolumna pokazywałaby wszędzie „CS2" — martwa kolumna, zero informacji.

**Preferencja: usunąć kolumnę „gra" z tabeli kuponów w Logs.**
- `logs.js`: usuń `couponGameLabel()` (jeśli nieużywana gdzie indziej), usuń `<td>${game}</td>` (~115) i odpowiedni nagłówek `<th>` kolumny.
- Sprawdź `logs.html` / generator nagłówków tabeli — usuń nagłówek kolumny gry, żeby liczba kolumn się zgadzała.

Jeśli `BY_GAME_LIST` była używana wyłącznie przez `renderByGame` i `couponGameLabel`, po Zmianach A+B usuń ją całkowicie z `shared-metrics.js`.

## Zmiana C — pole `game` w selekcjach/predykcjach

Nie usuwaj pola `game` z modelu danych ani z `bets.json` — pozostaje na wpisach jako `cs2` (jest w wymaganych polach playbooka). Chodzi tylko o to, że UI przestaje je prezentować jako wymiar podziału. `selectionsByGame` (~95): jeśli po Zmianach A/B nie ma konsumentów — usuń; jeśli ma (np. jakiś agregat) — zostaw, będzie zwracać jedną grupę `cs2`, co jest nieszkodliwe.

## Poza zakresem

- Metodologia kalibracji, per-agent, progi, Brier/CLV — bez zmian.
- Model danych `bets.json` (poza usunięciem 25 wpisów wg osobnej listy).
- Historyczne raporty gpt (.md) — nietknięte.
- Cokolwiek związanego z tier-2 (projekt pozostaje tier-1 CS2).

## Kryteria akceptacji

1. Po migracji Research nie pokazuje sekcji „By Game" (ani pustych kart LoL/Dota 2).
2. Logs nie ma martwej kolumny „gra" (wszędzie-CS2); liczba kolumn i nagłówków się zgadza.
3. Żadna strona nie odwołuje się do `lol`/`dota2` w warstwie prezentacji; brak błędów w konsoli.
4. Pole `game: cs2` pozostaje w danych i w wymaganych polach nowych wpisów — usunięto tylko prezentację podziału, nie samo pole.
5. Calibration Lab (per-agent) działa jak dotąd — ten spec go nie dotyka.
6. Mobile 380px: brak poziomego scrolla; tabela Logs mieści się po usunięciu kolumny.

## Uwaga

Jeśli którykolwiek helper (`BY_GAME_LIST`, `selectionsByGame`, `couponGameLabel`) ma konsumenta, którego ten spec nie przewidział, **nie usuwaj go na siłę** — zredukuj do CS2 i zostaw komentarz `// CS2-only since 2026-07-27`. Lepiej zostawić nieszkodliwy martwy helper niż złamać ukrytą zależność.
