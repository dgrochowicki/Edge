# Edge — plan na dziś

**Data:** 26 lipca 2026  
**Aktywna wersja metody:** `v1`

## Cel dnia

Dziś nie przebudowujemy metody i nie wyciągamy dużych wniosków z małej próbki.

Głównym celem jest:

> **zebrać kolejne czyste, porównywalne dane dla metody v1.**

## Plan

1. Zapisujemy wszystkie dzisiejsze predykcje GPT i Claude’a.
2. Każda nowa predykcja otrzymuje:
   - `agent`;
   - `method_version: "v1"`;
   - estimated probability;
   - fair odds;
   - kurs rynkowy z momentu analizy;
   - decyzję `BET` lub `PASS`;
   - confidence;
   - stake, jeśli decyzja to `BET`.
3. Po zakończeniu meczów rozliczamy wyniki:
   - `won`;
   - `lost`;
   - `void`, jeśli dotyczy.
4. Nie zmieniamy po fakcie:
   - probability;
   - fair odds;
   - decyzji BET/PASS;
   - confidence;
   - uzasadnienia predykcji.
5. Closing odds zapisujemy tylko wtedy, gdy uda się je zebrać bez utrudniania całego procesu.
6. Nowe pomysły i obserwacje zapisujemy jako notatki lub hipotezy, ale nie zmieniamy jeszcze zasad metody v1.
7. Nie oceniamy skuteczności metody na podstawie jednego dnia ani pojedynczego wyniku.

## Czego dziś nie robimy

- nie przechodzimy na `v2`;
- nie zmieniamy progów BET/PASS;
- nie dopasowujemy probability do wcześniejszych wyników;
- nie poprawiamy starych predykcji po zobaczeniu rezultatów;
- nie ogłaszamy, że metoda działa lub nie działa;
- nie rozbudowujemy dashboardu kosztem jakości danych.

## Kryterium poprawnie zakończonego dnia

Dzień uznajemy za poprawnie zamknięty, gdy:

- wszystkie dzisiejsze predykcje są zapisane;
- każdy wpis ma poprawne `agent` i `method_version`;
- raporty pozostają niezmienne po publikacji;
- wyniki rozegranych meczów zostały uzupełnione;
- dane są gotowe do kolejnych analiz w Research.

## Najważniejsza zasada

> Dzisiejszym sukcesem nie jest wygrany kupon.  
> Dzisiejszym sukcesem jest kolejna wiarygodna obserwacja w próbce v1.
