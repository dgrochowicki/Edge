# Decyzja: zawieszenie aparatu metodologicznego, powrót do prostych opinii

**Data:** 2026-10-24 · **Status:** ZATWIERDZONY, efektywny natychmiast
**Operator:** Dom

## Co się zmienia

**v2, v3, E1/E2, checkpointy (K1/K2, β), konsensus rynku, własna ocena przed kursami — wszystko zawieszone.** Nie liczymy już `p_market`, `p_v2`, `p_own`, `p_cons`, nie zbieramy closingów pod metrykę, nie czekamy na 100 czy 200 obserwacji. Żaden z tych dokumentów (`docs/METHOD_V2.md`, `docs/decisions/2026-10-11-v2-ocena-e2.md`, `docs/decisions/2026-10-19-v3-trzy-zrodla.md`) nie jest już aktywną instrukcją — zostają jako historyczny zapis, nieusunięte.

**Powód.** Operator: "to było zawsze twoje pytanie [czy da się wykryć przewagę statystycznie], ja chcę na koniec analizy czy warto grać na kogoś czy nie, to jest mój cel, a nie prowadzenie statystyk." Po miesiącach pomiaru (v1, potem v2) żadna metoda nie wyprodukowała ani jednego realnego BET-a; aparat (checkpointy, protokoły oceny, wielostopniowe sekwencje jak w v3) narósł do punktu, w którym sam flow stał się ciężarem dla operatora, zamiast go odciążać.

## Co jest teraz

Codzienny raport (jeśli gpt go robi) to **krótka opinia per mecz**: "gram na X, bo [jedno zdanie]" albo "PASS, bo [jedno zdanie]". Bez wymogu liczenia prawdopodobieństw do czterech miejsc, bez listy czynników, bez flag jakości, bez protokołu. Luźna, subiektywna ocena — ma być użyteczna od razu, nie naukowo policzalna.

**Brak obowiązku logowania do `data/bets.json`** jako próbki metody. Jeśli operator chce zapisać swój własny zakład (`EDGE-XXX`, `coupons`), robimy to jak dotąd — to pozostaje, bo to zwykła księga jego własnych zakładów, niezależna od tego czy jakakolwiek metoda "działa".

## Czego nie robimy

- Nie usuwamy historycznych plików ani wpisów `predictions` (v1, v2, v3) — zostają jako zapis.
- Nie podejmujemy teraz decyzji "czy wracamy do v2/v3 kiedyś" — to osobna sprawa na przyszłość, jeśli operator będzie chciał.
- Nie każemy gpt dalej budować `data/form/`, konsensusu ani liczyć checkpointów.

## Dla gpt (następny raport)

Nie czytaj `docs/METHOD_V2.md` ani decyzji v3 jako instrukcji wykonania. Napisz krótko: mecze dnia, kursy STS (jeśli operator je poda), i Twoją opinię gram/pass z jednym zdaniem powodu. Nic więcej nie jest wymagane.
