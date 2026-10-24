# Decyzja: Edge zatrzymany — zostaje tylko księga własnych kuponów

**Data:** 2026-10-24 · **Status:** ZATWIERDZONY wprost przez operatora, efektywny natychmiast
**Operator:** Dom

## Decyzja

**Dom: "stopuje na razie edge, zostaną tylko ew. kupony. Nie mam siły już na codzienne sprawdzanie i podawanie kursów + pilnowanie closingów."**

Codzienna rutyna Edge (raporty gpt, kursy STS, v2, v3, E1/E2, checkpointy, konsensus, cokolwiek wymagające od operatora codziennego podawania kursów i pilnowania closingów) **zatrzymana całkowicie, bez daty powrotu.** To nie jest uproszczenie formatu raportu — to zatrzymanie samej rutyny. Nikt nie ma obowiązku robić raportu dziennego, dopóki operator sam nie zdecyduje inaczej.

## Co zostaje

**Tylko księga własnych kuponów operatora** (`EDGE-XXX` w `data/bets.json` → `coupons`), jeśli i kiedy operator sam z siebie zechce coś zalogować — bez żadnej presji regularności. Repo agent nadal: scala, waliduje, rozlicza, commituje i pushuje te wpisy na żądanie, jak dotąd. To jedyna aktywna funkcja.

## Tło decyzji (dla przyszłego kontekstu)

Doszło do tego po serii zdarzeń 2026-10-24: pierwsza próba raportu V3 (PGL Masters Bucharest) wyszła niekompletna z winy wykonania gpt (nie dokończył V2 mimo kompletu kursów), co ujawniło szerszy problem — cały aparat metodologiczny (V1 → V2 → E1/E2 → blind-pilot → V3) narósł do punktu, w którym codzienna obsługa stała się ciężarem dla operatora, bez odpowiadającej wartości (0 realnych BET przez całą historię projektu, v1 i v2 nieodróżnialne statystycznie od rynku). Operator był jasny, że jego celem zawsze był prosty typ/opinia per mecz, nie program badawczy — ale po dalszej rozmowie zdecydował się na pełny stop, nie na uproszczony format dziennych typów.

**Wcześniejsza wersja tego dokumentu** (ta sama ścieżka pliku) proponowała zamiast stopu — uproszczony format "typ gram/pass, jedno zdanie" bez progu wartości. Operator tego wprost nie potwierdził; ten plik odzwierciedla jego faktyczną, wyraźnie potwierdzoną decyzję: pełny stop, nie uproszczenie.

## Czego nie robimy

- Nie usuwamy historycznych plików ani wpisów `predictions` (v1, v2, v3) — zostają jako zapis.
- Nie każemy gpt robić jakichkolwiek raportów, dopóki operator o to nie poprosi.
- Nie pingujemy operatora o kursy, closingi, decyzje metodologiczne ani nic związane z Edge-jako-metodą.
- Jeśli operator kiedyś zechce wrócić — to nowa decyzja w nowym dokumencie, nie automatyczne wznowienie tego.
