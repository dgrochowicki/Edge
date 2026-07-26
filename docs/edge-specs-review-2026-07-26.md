# Edge — przegląd speców (26.07.2026)

Ocena dwóch plików z `docs/` przygotowanych przez agenta analizującego Edge, na tle **faktycznego stanu repo** (nie tylko treści specu). Wniosek nadrzędny: instynkt „może na razie nic nie zmieniać" jest w dużej mierze słuszny — jeden spec jest nieaktualny jako plan, drugi częściowo się zdezaktualizował, bo repo poszło do przodu.

## Zweryfikowany stan danych (`data/bets.json`, 26.07)

- predictions: **115** (gpt 84, claude 31)
- results: won 64, lost 45, pending 4, void 2
- coupons: 22 → source: **user_bet 18, official_recommendation 2, recommendation_gpt 1, recommendation_claude 1**
- settled-z-estymatą per agent (definicja z Calibration Lab): **gpt 72/50, claude 30/50**
- observed_passes: 2

To istotne: konwencja `recommendation_<agent>` **już jest w danych**, a gpt **już przekroczył próg 50**.

---

## Plik 1: `edge-plan-na-dzis-2026-07-26.md`

**Charakter:** jednodniowa notatka-manifest o dyscyplinie (zbieramy czyste dane v1, nie przechodzimy na v2, nie zmieniamy progów, nie oceniamy metody po jednym dniu, nie poprawiamy predykcji po fakcie).

**Ocena:** zgodna z całą filozofią Edge. Nie jest to spec do wdrożenia — to zapis zasad.

**Problem:** datowana „na dziś" (26.07), więc jako *plan na dziś* już nieaktualna.

**Rekomendacja:** **nic nie wdrażać.** Opcjonalnie, dla porządku: przenieść trwałą treść (zasady dnia) do `PLAYBOOK.md` i usunąć datowaną kopię. Zero pilności. Plik jest nieszkodliwy jeśli zostanie.

---

## Plik 2: `edge-source-per-agent-spec-v3.md`

**Charakter:** techniczny spec dla agenta kodującego — 4 zmiany w dashboardzie (A: centralizacja klasyfikacji `source`; B: etykieta Outcome Split; C: liczniki postępu zamiast bannera; D: consistency pass).

**Jakość:** wysoka — analiza realnego repo, numery linii, kompatybilność wstecz, jawne „poza zakresem", świadome decyzje o tym, czego nie ruszać. Dobry warsztat.

**Kluczowy problem: spec rozjechał się z danymi.** Repo poszło do przodu, odkąd spec powstał:

| Spec zakłada | Realnie w repo |
|---|---|
| 2 kupony rekomendacji (`official_recommendation`) | 4 (2 stare + `recommendation_gpt` + `recommendation_claude`) |
| gpt 45/50, claude 19/50 | gpt **72/50**, claude **30/50** |
| konwencja `recommendation_<agent>` do wprowadzenia | **już obecna w danych** |
| gpt poniżej progu (placeholder „coming soon") | gpt **przekroczył próg 50** |

Skutek: **kryteria akceptacji specu są martwe** (sprawdzą się na fałsz mimo poprawnego kodu), a rama Zmiany C („jeszcze nie czas na per-agentową kalibrację") już nie obowiązuje.

### Ocena zmian

- **A — centralizacja klasyfikacji `source`.** Najlepsza część. Czysty refactor (6 rozproszonych porównań stringów → jedna funkcja), addytywny, nie dotyka metodologii. Warty zrobienia niezależnie od reszty. **Wymaga:** aktualizacji liczb weryfikacyjnych (4 kupony rekomendacji, net do przeliczenia).
- **B — etykieta „Outcome Split · all coupons".** Drobna, sensowna, tania. Decyzja „nie sprzęgać z togglem" słuszna. Może poczekać.
- **C — liczniki postępu zamiast bannera.** Koncepcyjnie dobra, ale **przeterminowana.** Miała liczyć „ile do progu 50"; teraz gpt=72, claude=30, więc sens się zmienił z „licznik do odblokowania" na „gpt gotowy, claude w drodze". To już nie zadanie kosmetyczne — to sygnał, że dojrzała **decyzja metodologiczna**: czy włączać per-agentową kalibrację, skoro gpt przekroczył próg. Ta decyzja była świadomie odkładana do czasu dojrzenia danych — dane dojrzały.
- **D — consistency pass.** Trywialna, robić tylko przy okazji A.

### Rekomendacja

1. **Nie wdrażać specu w obecnej formie** — martwe liczby wprowadzą agenta kodującego w błąd.
2. **Jeśli cokolwiek teraz, to tylko A (+ D przy okazji)** — po odświeżeniu liczb weryfikacyjnych.
3. **B odłożyć** — kosmetyka, bez pilności.
4. **C nie robić jako UI-taska** — najpierw decyzja: gpt przekroczył 50, włączamy per-agentową kalibrację czy nie? To osobna, spokojna rozmowa metodologiczna, nie doklejka do specu dashboardu.

**Podsumowanie:** spec jest dobry warsztatowo, ale opisuje repo sprzed kilku dni. Zanim wróci do kolejki, potrzebuje wersji `v4` z aktualnymi liczbami — a Zmiana C powinna wypaść ze specu UI i stać się pytaniem metodologicznym. Na teraz: A opcjonalnie, reszta czeka. Zgodne z „może na razie nie warto nic zmieniać".
