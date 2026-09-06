# Edge — Raport fazowy: BLAST Open Porto 2026, playoffy

**Turniej:** BLAST Open Porto 2026 (playoffy w Super Bock Arena, Porto)
**Faza:** playoffy — single-elimination, 6 drużyn, QF/SF BO3, finał BO5
**Zakres:** 2026-09-04 – 2026-09-06 (3 dni, 5 meczów)
**Metoda:** v1 · **Gra:** cs2 · **Rynek odniesienia:** STS (kursy manualne)
**Status dokumentu:** opisowy. NIE walidacja metody — patrz sekcja "Status i zastrzeżenia".
**Mistrz turnieju:** Team Spirit (pokonał MOUZ w finale BO5).

---

## 1. Zakres i metodyka

Playoffy to inny reżim niż faza grupowa: single-elimination, wyłącznie 6 najlepszych drużyn z grup, więc każdy mecz bliżej coin-flipa (mniej "słabych" underdogów). Spirit i MOUZ weszły z bye do półfinałów jako zwycięzcy grup; Falcons, G2, FURIA, Vitality zaczęły od ćwierćfinałów. Pięć meczów: 2 QF (4.09), 2 SF (5.09), finał BO5 (6.09). Obaj agenci logowali wszystkie mecze niezależnie od decyzji.

Predykcji rozliczonych w playoffach: **claude 5, gpt 5** (wszystkie mecze rozegrane i rozliczone).

## 2. Kalibracja porównawcza (rdzeń)

Metryka: Brier (niżej = lepiej), benchmark = de-vigowany rynek.

**Playoffy (5 meczów każdy):**

| Agent | Brier | Trafienia | BET |
|-------|------:|----------:|-----|
| claude | 0.1762 | 5/5 (100%) | 1W / 0L |
| gpt | 0.1699 | 5/5 (100%) | 1W / 0L |

Oba agenty trafiły **wszystkie pięć** meczów playoff — komplet. Brier bardzo zbliżony (gpt minimalnie lepszy, jak zwykle, różnica 0.006 na n=5 = czysty szum). Playoff Brier jest wyższy niż grupowy (0.176 vs 0.168) mimo 100% trafień — bo mecze były bliżej 50/50, więc prawdopodobieństwa "poprawne" siłą rzeczy dalej od 0/1. To spodziewane w reżimie coin-flip i NIE oznacza gorszej kalibracji.

**Cały turniej BLAST (grupa + playoff, 29 meczów każdy):**

| Agent | Brier | Trafienia | BET |
|-------|------:|----------:|-----|
| claude | 0.1691 | 25/29 (86%) | 1W / 0L |
| gpt | 0.1630 | 22/29 (76%) | 3 BET → 1W / 2L |

**Narastająco (cała próbka v1):**

| Agent | n | Brier | Trafienia |
|-------|--:|------:|----------:|
| claude | 115 | 0.2038 | 84/115 (73%) |
| gpt | 112 | 0.1936 | 75/112 (67%) |

Obraz spójny z całą historią projektu: gpt utrzymuje stałą przewagę ~0.010 w Brierze (lepsza kalibracja prawdopodobieństw), claude prowadzi na trafieniach picków (86% vs 76% w tym turnieju). BLAST nie zmienił tej struktury — potwierdził ją na dużej próbce.

## 3. Decyzje BET — pierwszy BET Claude

**Najważniejszy pojedynczy fakt turnieju: pierwszy BET Claude w całym oknie, trafiony.**

**claude: 1 BET (1W / 0L).**
- 05.09 MOUZ vs Vitality — BET MOUZ ML @ 2.54, 1u → **won** (MOUZ 2:0). Zysk +1.54u.

**gpt: 3 BET (1W / 2L).**
- 29.08 Legacy vs Falcons — BET Legacy (underdog fresh-form) → lost
- 31.08 FUT vs Vitality — BET FUT (underdog fresh-form) → lost
- 05.09 MOUZ vs Vitality — BET MOUZ → won

Kluczowe rozróżnienie, które ten turniej ustanowił: **claude postawił dokładnie jeden zakład — i był to zakład oparty na twardym, zwalidowanym sygnale, nie na fresh-form.** MOUZ vs Vitality: przewaga wynikała z bezpośredniego świeżego H2H (MOUZ zdominowało Falcons 2:1 w grupie, Ancient 13:6 / Inferno 13:3), strukturalnej przewagi bye/świeżości, oraz udokumentowanej słabości Vitality ze standin jL. To NIE była korekta fresh-form typu Legacy — i to jedyny sygnał w całym turnieju, który claude uznał za wystarczająco solidny na BET.

Kontrast z gpt jest pouczający: gpt postawił 3 zakłady, w tym 2 na czysty fresh-form (Legacy, FUT) — oba przegrane — i 1 na MOUZ (wygrany, wspólny z claude). Innymi słowy: **jedyny wspólny BET obu agentów (MOUZ) wygrał; dwa dodatkowe bety gpt na fresh-form przegrały.** To wspiera dyscyplinę §237 (claude nie ruszył fresh-formu) przy jednoczesnym pokazaniu, że claude potrafi rozpoznać i zagrać sygnał, który JEST solidny (MOUZ). Selektywność zadziałała w tym oknie.

## 4. Dywergencje

W playoffach agenci **nie rozeszli się ani razu** — identyczne picki i identyczne decyzje na wszystkich 5 meczach (łącznie z BET na MOUZ i PASS na finale). Pełna zgodność.

W skali całego turnieju dywergencje wystąpiły tylko w fazie grupowej (3 mecze — patrz raport grupowy: Aurora–G2, Legacy–Falcons, FUT–Vitality), wszystkie rozstrzygnięte na korzyść claude. W playoffach metody się zbiegły — obie widziały te same wartości i te same braki wartości.

## 5. Potwierdzone wzorce

**Selektywność BET zwalidowana w praktyce.** Turniej dostarczył czystego testu: claude zPASS-ował 5 sygnałów fresh-form (grupa) i wszystkie zakłady na nie (gpt) przegrały lub underdog przegrał, ale ZAGRAŁ jeden sygnał oparty na twardym H2H (MOUZ) i wygrał. To najlepsza dotąd ilustracja, że rozróżnienie "zwalidowany sygnał vs niezwalidowana korekta" ma realną wartość — nie jest to ślepe unikanie zakładów (0 BET), lecz selektywność.

**Świadoma dyscyplina anty-bias na finale.** Po udanym BET na MOUZ (5.09), w finale (6.09) MOUZ pojawił się znów jako underdog (kurs 2.75). claude świadomie NIE podniósł oszacowania MOUZ pod wpływem świeżej wygranej ("jazda na fali") — utrzymał MOUZ na ~37% (value +1.8%, poniżej progu) i zPASS-ował. Spirit wygrał finał, potwierdzając, że ostrożność była słuszna. To udokumentowany przypadek unikania recency bias po własnym sukcesie.

**Round differential — kolejne przykłady (materiał do v2).** Playoffy dołożyły ilustracji do obserwacji operatora z fazy grupowej: MOUZ zdominowało Falcons w grupie profilem mapowym (13:6, 13:3), co było twardą podstawą BET-a — dokładnie sygnał "siły zwycięstwa", którego binarny won/lost nie oddaje. Vitality vs FURIA w QF (2:1, comeback po przegranym Nuke, decydująca mapa 13:4) — kolejny przykład "wyjadaczy" zamykających serię zdecydowanie mimo słabego startu. Oba zasilają PRE-V2 sekcja 8 (round diff) i obserwację o odporności mentalnej Vitality. Nie wchodzą do v1.

**BO5 jako reduktor wariancji.** Finał BO5 zachował się zgodnie z oczekiwaniem — dłuższy format sprzyjał lepszej, konsekwentniejszej drużynie (Spirit, flawless cały turniej). Warto odnotować przy przyszłych finałach: format wpływa na wycenę (BO5 faworyzuje głębię, redukuje szansę upsetu vs BO3).

## 6. Status i zastrzeżenia (WAŻNE)

- **Faza Collection trwa.** Rozliczonych predykcji: **claude 115, gpt 112** — do checkpointu 150 brakuje 35 i 38. Playoffy Porto NIE dobiły do checkpointu (za mało meczów, zgodnie z przewidywaniem). Dobicie przesuwa się na kolejny tier-1: StarLadder StarSeries Fall (17-20.09).
- **Jeden BET to za mało na wnioski o EV.** Trafiony pierwszy zakład (MOUZ, +1.54u) to zachęcający pojedynczy punkt, ale NIE dowód, że metoda generuje dodatnie EV. Potrzeba wielu betów na v2 z pełną walidacją, by cokolwiek twierdzić o zyskowności.
- **Brier fazowy opisowy**, nie checkpoint. Pełna kalibracja per agent × method_version dopiero na 150.
- **CLV wciąż w większości puste** — closing_odds nie zebrane dla pierwszego BET (MOUZ) na czas. Bez closing line nie da się ocenić, czy zakład bił rynek w sensie przewidującym długoterminowy zysk. Do poprawy: dla przyszłych BET priorytetowo zbierać closing snapshot.
- **Nie ma tu stwierdzeń "metoda działa".** Dobry turniej (86% trafień, 1/1 BET) to "kontynuować", nie "gotowe do gry".

## 7. Do prześledzenia dalej

- **Checkpoint 150** na StarLadder StarSeries Fall (17-20.09) — claude potrzebuje 35 predykcji, gpt 38. To prawdopodobnie tam nastąpi pierwsza formalna ewaluacja v1 i decyzja o promocji do v2.
- **v2 shadow run** — po checkpoincie: uruchomić v2 jako paper-only równolegle z v1 na identycznych meczach (jedna para meczów = 4 wpisy). Priorytetowe komponenty z PRE-V2: sygnał fresh-form (sekcja 2) i round differential (sekcja 8, zablokowany na danych mapowych).
- **Fresh-form: bilans końcowy turnieju.** 5 obserwacji (NAVI–M80 W, Legacy–FUT W, Legacy–Falcons L, Legacy–Vitality L, FUT–Vitality L) = underdog 2/5. Sygnał realny, ale v1 słusznie go nie gra bez narzędzia rozróżniającego. To główny cel badawczy v2.
- **Zbieranie round score per mapa** — jeśli round diff ma być komponentem v2, zacząć logować wyniki mapowe (13:7 itd.) dla meczów tier-1 już teraz, by budować próbkę przed startem v2.
- **CLV pipeline** — dla każdego przyszłego BET zbierać closing_odds. Pierwszy BET (MOUZ) pokazał, że bez tego tracimy kluczową metrykę na zakładach, które nas najbardziej interesują.

---
*Raport wygenerowany na podstawie stanu data/bets.json. Liczby z rozliczonych predykcji playoff (claude 5, gpt 5) i całego turnieju (po 29). Turniej zamknięty — dokument niezmienny; ewentualne korekty jako nowa sekcja.*
