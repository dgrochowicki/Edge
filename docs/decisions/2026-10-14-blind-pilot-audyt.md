# Audyt — Blind-first Pilot v0 (`docs/decisions/2026-10-14-blind-pilot.md`)

**Audytor:** claude · **Data:** 2026-10-14 · **Stan repo:** `0c8fb7e`
**Zakres:** pkt 8 checklisty — jednoznaczność i audytowalność estymatora v0, brak wejść cenowych, spójność scoringu, próby i plików z repo (`METHOD_V2.md` §6–12, `ROADMAP.md` → blind-first, `PLAYBOOK.md`, `data/form/`, `data/bets.json`).

## Werdykt

**Zatwierdzić z poprawkami — nie w obecnej wersji.** Konstrukcja eksperymentu jest dobra: kolejność lock → reveal, append-only, oddzielne pliki i próba, zakaz realnych BET-ów, paired Brier jako metryka główna, jawne kryteria nieważności. Estymator jest w pełni deterministyczny i nie ma wejścia cenowego.

Jest jednak pięć rzeczy do zamknięcia **przed pierwszym lockiem** (B1–B5). Najważniejsza (B1): przy obecnej skali modelu flaga `PAPER_CANDIDATE` będzie w praktyce systematycznie wskazywać underdogów — to artefakt konstrukcji, przewidywalny już dziś, a nie odkrycie, które pilot ma zrobić.

---

## Blokujące (przed 1. lockiem)

### B1. Skala modelu jest ściśnięta → strukturalny „value” na underdogach

Zasięg składników: ranking ±0.20, forma ±0.10, stand-in ±0.03. Żeby model dał faworytowi 0.70, potrzeba różnicy 4 kubełków (top-5 vs 31+) albo 3 kubełków plus mocnej formy. Typowy mecz top-10 vs top-10 ma `rank_delta` 0–1 → 0.50–0.55 plus forma.

Rynek w naszych danych (`data/bets.json`, 211 unikalnych meczów z obiema cenami):

| de-vig faworyta > | 0.60 | 0.65 | 0.70 | 0.75 | 0.80 |
|---|---:|---:|---:|---:|---:|
| udział meczów | 74% | 58% | 45% | 33% | 24% |

Mediana p faworyta = **0.67**. Kalibracja rynku w kubełkach wygląda przyzwoicie (0.6–0.7 → faworyt wygrał 66%, 0.7–0.8 → 80%).

Przykłady przy typowym marginesie STS:
- #4 vs #12, forma neutralna → `p_A = 0.60`. Rynek 1.40 / 2.80 → `p_market_A ≈ 0.667`. `value_B = 2.80 × 0.40 − 1 = +12%` → **PAPER_CANDIDATE na underdoga**.
- #2 vs #35, brak porównywalnej formy → `p_A = 0.70`. Rynek 1.12 / 5.50 → `p_market_A ≈ 0.83`. `value_B ≈ +65%` → PAPER_CANDIDATE, bo `insufficient_comparable_form` **nie blokuje** flagi (blokują tylko `missing_team_rank` i `uncertain_roster`).

Skutek: kandydaci będą głównie underdogami, a to dokładnie strona, na której bukmacherzy historycznie trzymają większą marżę (favourite–longshot bias). Hipotetyczne ROI/CLV kandydatów będzie więc mierzyć głównie tę konstrukcję, a nie informację w modelu.

**Rekomendacja (bez ręcznego strojenia współczynników):**
1. `insufficient_comparable_form` → zakaz `PAPER_CANDIDATE` (dopisać do listy w §4; patrz też N1).
2. Przedrejestrować teraz analizy warstwowe: wszystkie metryki osobno dla (a) forma porównywalna vs rank-only, (b) pick = faworyt rynku vs underdog.
3. Przedrejestrować **ablację rank-only** (`form_multiplier = 0`) jako drugorzędny forecaster — liczy się z pól locku bez żadnej dodatkowej pracy i odpowiada na pytanie, czy forma cokolwiek dodaje.
4. W §6 zapisać wprost oczekiwanie: przy tej skali spodziewamy się ujemnego paired Brier; wynik dodatni byłby zaskoczeniem.

Zmiana skali (np. większe współczynniki) jest możliwa, ale to decyzja operatora i musi zapaść przed startem. Nie rekomenduję strojenia „na oko” — byłoby tak samo nieskalibrowane. Jeśli skala ma być lepsza, uczciwa droga to dopasować współczynnik rankingu do wyników historycznych meczów (bez cen) w wersji v0.1 — to jednak opóźnia start.

### B2. Kto jest analitykiem i jak naprawdę odciąć ceny

Dokument nie wskazuje, **który agent** robi Fazę A. To trzeba ustalić, bo:

- **Rola:** wg `METHOD_V2` §21 claude jest audytorem. Jeśli claude robi też Fazę A, audyt 5–10 locków jest samo-audytem tego samego modelu. Akceptowalne przy jawnym oznaczeniu, ale lepiej, żeby Fazę A robił inny agent niż audytor procesu.
- **Pamięć:** czat w Projekcie Edge (claude) i czat z włączoną pamięcią (gpt) mogą zawierać kursy z poprzednich dni i raporty V2. „Nowy chat” to za mało. Wymóg: **Faza A w czacie bez pamięci i poza Projektem** (incognito / temporary chat). Dodać pole `analyst_context` (np. `incognito_no_memory`).
- **Repo jako źródło przecieku:** `reports/*-gpt.md`, `data/bets.json` i `docs/audit/` zawierają ceny; poranny run V2 może zcommitować raport z kursami tych samych par przed blind lockiem. Proponuję **allowlistę** dla Fazy A: tylko `docs/` (bez `docs/audit/`) i `data/form/*.json` (sprawdziłem — jedyne pole cenowe to tekstowe `odds_source` na górze pliku z 14.10; samych kursów tam nie ma). Zakaz otwierania `reports/`, `data/bets.json`, `data/blind/reveals/`.
- **HLTV pokazuje kursy na stronach meczów** (sekcja z kursami bukmacherów na stronie nadchodzącego meczu i na liście meczów). Doc słusznie zakazuje stron z cenami, ale trzeba to przełożyć na regułę: terminarz, format i składy z **Liquipedii**; z HLTV tylko ranking, strony wyników i statystyk map **zakończonych** meczów. Strony nadchodzącego meczu = zakazane. Każde źródło w `sources` z URL.

### B3. Błędy i niejednoznaczności w regułach formy (§3.2)

- **Roster rules przekręcone.** Doc: „reset/przedzmianowe mapy z wagą 0.5”. `METHOD_V2` §10: **reset → waga 0** (2+ starterów, IGL, AWP); **0.5** tylko przy jednej zwykłej zmianie. Poprawić zapis na dokładne odwołanie do §10.
- **„mniej niż 2 serie / 4 mapy”** i **„mniej niż 3 serie / 6 map”** — trzeba zapisać logikę: proponuję `series < 2 OR maps < 4` → brak formy; `series < 3 OR maps < 6` → mnożnik 0.5.
- **„Któregokolwiek” + 80% pokrycia** — OK jako świadoma różnica wobec V2 §9.2 (tam fallback per drużyna). Zostawić, ale dopisać jednym zdaniem, że to celowe odejście od V2.

### B4. Czy mapy z samego Thunderpick wchodzą do okna formy?

`METHOD_V2` §6 bierze do okna tylko tier-1, a `PLAYBOOK.md` wprost wymienia Thunderpick World Championship jako tier-2. Operator zrobił wyjątek dla zakresu prognoz, ale doc nie mówi, czy mapy z fazy grupowej Thunderpick (np. z 14.10) liczą się do okien na 15.10+. To realnie zmienia wynik, bo to najświeższe dane.

Skład pola pokazuje skalę problemu: w `data/form/2026-10-14.json` Legacy i NiP mają **0 map** w oknie, BETBOOM 9, 9z 10. Bez decyzji duża część pilotażu będzie rank-only.

**Rekomendacja:** liczyć mapy z wydarzeń objętych zakresem pilotu, czyli również Thunderpick main event. Skoro turniej jest dość dobry do prognozowania, jest dość dobry jako źródło formy. To jest różnica wobec V2, dopuszczalna, bo blind to osobna metoda — ale trzeba ją zapisać.

### B5. Doprecyzowania danych, bez których reveal i scoring są niejednoznaczne

- **Który snapshot rynku jest metryką główną?** Proponuję: główna = snapshot z reveal (`odds_timestamp`), drugorzędna (sensitivity) = closing, gdy dostępny dla obu stron. Bez tego „rynek z de-vig” można dobrać po fakcie.
- **Orientacja A/B i `fixture_id`:** zdefiniować, np. `fixture_id = YYYYMMDD-<teamA>-<teamB>`, A = drużyna wymieniona pierwsza na Liquipedii. Reveal musi zawierać jawne `odds_team_A`, `odds_team_B` z nazwami, żeby nie odwrócić stron.
- **Overround:** ROADMAP wymienia go w reveal, doc nie. Dodać `overround`.
- **Wyłączenia:** walkover / forfeit / mecz nierozegrany → `exclusion_reason`, poza próbą. Przesunięcie meczu po locku o > 24 h → poza próbą główną (lock oparty na nieaktualnych danych).
- **Lock deadline:** lock i reveal przed startem meczu (`forecast_timestamp < start_time` i `odds_timestamp < start_time`), inaczej poza próbą.

---

## Nieblokujące (warto poprawić przy okazji)

- **N1. Lista flag blokujących `PAPER_CANDIDATE`.** „Brak ostrzeżeń o jakości” jest za luźne. Wypisać zamkniętą listę: `missing_team_rank`, `uncertain_roster`, `insufficient_comparable_form`, `blindness_compromised`, `prior_team_price_exposure`?, `market_data_missing`. Rozstrzygnąć `prior_team_price_exposure` — przy obecnym procesie dotyczy praktycznie każdej drużyny, więc chyba tylko raportować, nie blokować.
- **N2. Hash.** Liczyć SHA-256 **obu** plików locku (JSON i md); w JSON można wpisać hash md (to nie jest samoodwołanie). Operator weryfikuje `sha256sum` lokalnie. Dowodem czasu jest **push na GitHub** przed reveal, nie lokalna data commita (tę da się ustawić dowolnie).
- **N3. `roster_delta`** jest wymienione w polach, ale nie ma wzoru. Dopisać: `roster_delta = 0.03 × (standin_B − standin_A)`.
- **N4. Remis value** jest praktycznie niemożliwy: przy marży > 0 obie strony nie mogą mieć jednocześnie dodatniego value, więc reguła „przy remisie NO_SIGNAL” jest martwa. Nie szkodzi.
- **N5. Przedział niepewności** jest dekoracyjny — nie wchodzi do żadnej metryki. OK, tylko nie interpretować go później.
- **N6. Moc przy n = 40.** W v1 paired CI przy n = 150 wynosił ok. ±0.0045–0.006, a predykcje trzymały się blisko rynku. Tutaj n = 40 i różnice od rynku będą dużo większe, więc CI dla paired Brier rzędu ±0.02 lub szerzej. Dlatego reguła „Brier > 0 → rozważyć większy test” to praktycznie rzut monetą. Proponuję warunek: Brier > 0 **i** log loss > 0 **i** przewaga nie pochodzi wyłącznie z jednej warstwy (rank-only / underdog). Bez zmiany „nic nie jest walidowane”.
- **N7. 40 meczów to więcej niż jedna faza Thunderpick.** Dopisać, że pilotaż przechodzi na kolejne turnieje w zakresie, z tym samym protokołem.
- **N8. PLAYBOOK.** Tekst nadal wyklucza Thunderpick (l. 321, 338). Wyjątek operatora dotyczy tego eksperymentu i dzisiejszego V2 — repo agent powinien to ujednolicić, żeby kolejny agent nie uznał pilotu za poza zakresem.
- **N9. Shadow runs.** `PLAYBOOK` ma mechanizm `mode: "shadow"` w ledgerze. Blind świadomie go **nie** używa (zgodnie z ROADMAP: poza `bets.json`). Warto dopisać jedno zdanie, żeby repo agent nie podpiął blind pod shadow.

## Co sprawdziłem i jest OK

- Wzór §3.4: deterministyczny, każdy składnik zapisany w locku, brak wejścia cenowego. Clamp [0.15, 0.85] spójny z zasięgiem składników.
- Formy z V2 (recency `0.5 ** (d/14)`, wagi przeciwnika 1.2…0.8, cap RD ±8, 30 dni / 8 serii / 20 map) przeniesione zgodnie z `METHOD_V2` §6–9.
- Wzory §4 (de-vig, value, gap) poprawne i zgodne z konwencją repo; znak paired Brier (`+` = blind lepszy) spójny.
- Rozdzielenie plików: `research/blind/`, `data/blind/locks/`, `data/blind/reveals/` nie dotykają `bets.json`, `data/form/`, raportów V2 ani E2 (K1/K2, β). Zgodne z ROADMAP.
- Wykluczenie 4 meczów z 14.10 — poprawne; w `bets.json` nie ma jeszcze wpisów z tej daty.
- `data/form/*.json` nie zawiera kursów (sprawdzone wszystkie pliki), więc może być źródłem dla Fazy A.

## Do decyzji operatora przed startem

1. B1: przyjąć skalę v0 świadomie (z blokadą rank-only, ablacją i warstwami) **czy** odłożyć start na v0.1 z dopasowanym współczynnikiem rankingu?
2. B2: który agent robi Fazę A (rekomendacja: nie ten, który audytuje; zawsze czat bez pamięci, poza Projektem).
3. B4: mapy z Thunderpick w oknie formy — tak (rekomendacja) czy nie?

Po naniesieniu B1–B5 jako nowej wersji dokumentu (status → ZATWIERDZONY, z datą) z mojej strony checklista „Claude (audyt)” jest odhaczona.
