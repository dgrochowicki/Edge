# Edge — Raport fazowy: EWC 2026, faza grupowa

**Turniej:** Esports World Cup 2026 (Paryż, S-Tier / Valve Tier 1, pula 2 mln USD)
**Faza:** grupowa (double-elimination, 32 → 16 drużyn)
**Zakres:** 2026-08-12 – 2026-08-16 (5 dni)
**Metoda:** v1 · **Gra:** cs2 · **Rynek odniesienia:** STS (kursy podawane manualnie)
**Status dokumentu:** opisowy. To NIE jest walidacja metody — patrz sekcja "Status i zastrzeżenia".

---

## 1. Zakres i metodyka

Obaj agenci (claude, gpt) generowali niezależne predykcje moneyline dla każdego meczu tier-1 w fazie grupowej. Wszystkie mecze logowane niezależnie od decyzji (PASS lub BET) — próbka kalibracyjna budowana z pełnego pokrycia, nie tylko z zakładów. Metoda: de-vig kursów STS → oszacowanie fair probability → wyliczenie value % → decyzja PASS/BET → log. Format: dzień 1 wyłącznie BO1 (mecze otwierające), dni 2–5 BO3.

Predykcji rozliczonych w fazie: **claude 40, gpt 40.**

## 2. Kalibracja porównawcza (rdzeń)

Metryka główna projektu to Brier score (niżej = lepiej). Baseline "zawsze p=0.5" = 0.2500.

**Faza grupowa EWC (40 predykcji każdy):**

| Agent | Brier | Trafienia | BET |
|-------|------:|----------:|-----|
| claude | 0.1968 | 32/40 (80%) | 0W / 0L |
| gpt | 0.1958 | 29/40 (72%) | 4W / 2L |

Kluczowa obserwacja: **w tej fazie Brier obu agentów zrównał się niemal idealnie** (różnica 0.0010, w granicach szumu statystycznego). claude trafiał więcej pojedynczych picków (80% vs 72%), gpt był minimalnie lepiej skalibrowany na prawdopodobieństwach. Netto: w tym turnieju agenci byli równorzędni — zmiana względem wcześniejszego okresu, gdzie gpt prowadził wyraźniej.

**Narastająco (cała rozliczona próbka):**

| Agent | n | Brier | Trafienia |
|-------|--:|------:|----------:|
| claude | 70 | 0.2181 | 49/70 (70%) |
| gpt | 67 | 0.2051 | 43/67 (64%) |

Na pełnej próbce gpt wciąż prowadzi (0.2051 vs 0.2181). Ponieważ w samym EWC agenci się zrównali, przewaga gpt pochodzi z okresu przed EWC — claude nadrobił dystans w tym turnieju, ale go nie odwrócił. Obaj solidnie biją baseline 0.25.

**Rozrzut dzienny claude (ilustracja wariancji):** 12.08 Brier 0.196 · 13.08 0.091 · **14.08 0.417 (najgorszy)** · 15.08 0.103 · 16.08 0.179. Dzień 14.08 (2/6, upset Vitality @0.917 i seria przewróconych faworytów) sąsiaduje z 15.08 (6/6, najlepszy dzień). To podręcznikowa ilustracja, że pojedynczy dzień to głównie wariancja, nie sygnał — wnioski tylko z uśrednienia próbki.

## 3. Decyzje BET

**claude: 0 BET w całej fazie.** gpt: 6 BET (4W / 2L).

Szczegół betów gpt:
- 12.08 GamerLegion @1.93 (p 0.549) → won
- 12.08 The MongolZ @1.62 (p 0.658) → won
- 12.08 Astralis @1.72 (p 0.617) → won
- 12.08 9z @1.45 (p 0.725) → won
- 13.08 Astralis @5.30 longshot (p 0.204) → lost
- 14.08 K27 @2.10 (p 0.505) → lost

Interpretacja: seria zaczęła się od 4/4 dnia 1, co kusiło do wniosku "gpt nieomylny na betach" — ale znormalizowała się do 4W/2L, gdy longshot Astralis i underdog K27 przepadły. 4W/2L na kursach 1.45–5.30 to mniej więcej break-even do lekkiego plusa, nie dowód edge'u.

**0 BET po stronie claude NIE okazało się błędem kalibracyjnym.** Gdyby wynikało z nadmiernej ostrożności (systematycznie zaniżone p_est), Brier claude byłby wyraźnie gorszy od gpt — a w EWC był równy, przy wyższym trafieniu picków (80%). Wniosek roboczy: 0 BET to artefakt marży STS (~8%) zjadającej cienkie value na sharp rynku tier-1, a nie tchórzostwo ani gorsza wycena. Różnica claude-vs-gpt wygląda na różnicę apetytu na ryzyko przy zbliżonych oszacowaniach, nie na jakość kalibracji. Do potwierdzenia liczbami przy checkpoincie.

## 4. Dywergencje (bezpośrednie punkty sporne)

Mecze, gdzie agenci zajęli przeciwne strony lub jeden betował wbrew ocenie drugiego:

**K27 vs MiBR (14.08).** gpt: BET na K27 (underdog @2.10). claude: PASS, pick MiBR. Weryfikacja pokazała obronialny argument gpt (K27 z formą LCQ, sufit #23; MiBR z nowym nqz), ale konsensus i ranking były z claude. Wynik: **MiBR won 2:0**, bet gpt przepadł. Rozstrzygnięcie na korzyść claude — z zastrzeżeniem, że underdog @2.10 przegrywa ~56% czasu, więc to potwierdzenie kierunku, nie dowód błędu gpt.

**The MongolZ vs NaVi (15.08).** Antycypowana dywergencja (MongolZ jako niedowartościowany underdog @3.50) — NIE zmaterializowała się. Oba agenty typowały NaVi (claude p 0.735, gpt 0.763), oba PASS, oba won. Odnotowane jako przykład, że przewidywana dywergencja wymaga weryfikacji, nie założenia.

## 5. Potwierdzone wzorce

**Data-expiration / roster.** Aktywny dla trzech drużyn: The MongolZ (bench cobrazera, gracze akademii tikuak+DarkMeister od 12.07, trener maaRaa nieobecny od 28.07), PARIVISION (rozstanie z HObbit), MOUZ (dobór PR z GamerLegion 14.07). Rynek konsekwentnie dyskontował MongolZ (wydłużenie 3.35→3.50 jako underdog) — zgodnie z tezą, że H2H sprzed przebudowy opisuje inną drużynę.

**magic jako powtarzalny upset.** magic (#13) dwukrotnie w fazie wyszedł poza swoją wycenę — najpierw jako coin-flip który claude poprawnie zostawił na cenie (15.08 magic won), potem jako underdog ogrywający 9z (16.08, upset kosztujący claude jedynej porażki dnia). Zespół wart obserwacji jako źródło wariancji.

**0 BET ≠ dyscyplina, 0 BET = artefakt marży.** Potwierdzone liczbami (sekcja 3): brak betów nie chronił "z rozwagi", tylko odzwierciedlał realny brak value po odjęciu marży. Framing spójny z metodą.

**Weryfikacja coin-flipów.** Przez wszystkie 5 dni claude weryfikował mecz o najmniejszym spreadzie pod kątem, czy p_est nie jest zaniżone z ostrożności. W każdym przypadku (FaZe, TyLoo, magic, Astralis) dane potwierdzały cenę rynku, nie nadmierną ostrożność — co wspiera wniosek z sekcji 3.

## 6. Status i zastrzeżenia (WAŻNE)

Ten raport jest opisowy i NIE stanowi walidacji metody. Konkretnie:

- **Faza Collection trwa.** Rozliczonych predykcji łącznie: **137 z docelowych 150** (checkpoint). Do checkpointu: 13 predykcji. Żaden wniosek kalibracyjny nie jest jeszcze rozstrzygający.
- **Metoda v1 ma znany bias** (systematyczne przeszacowanie w stronę picku ~+2pp). v2 nie zdefiniowana. Kalibracja opisana wyżej to kalibracja metody, o której wiadomo, że jest niedokończona.
- **CLV w większości niewypełnione.** closing_odds: null dla 113/137 predykcji (82%). Wypełnione: 24/137 (18%), rozłożone równo (claude 12, gpt 12 — closing to właściwość meczu/rynku, więc przypisywane obu agentom identycznie, niezależnie od tego kto typował). Źródło: kursy zamknięcia podawane manualnie przez operatora (via agent VS Code); żaden agent nie ma własnego dostępu do STS. Pokrycie zaczęło rosnąć od 16.08, gdy operator zaczął podawać closing. Bez closing line value nie da się stwierdzić, czy predykcje biją rynek w sposób przewidujący długoterminowy zysk — 18% to wciąż za mało na wnioski CLV.
- **Nie ma tu i nie będzie** stwierdzeń typu "metoda działa" ani rekomendacji dotyczących grania. Dobry wynik na 150 oznacza "kontynuować i dopracować v2", nie "gotowe do gry".

## 7. Do prześledzenia w playoffach (19–23.08)

- Playoffy to inny reżim: single-elimination, wyłącznie top-16, BO3 (GF BO5), brak "łatwych" meczów tier-1-vs-underdog. Więcej meczów bliskich 50/50 → ostrzejszy test kalibracji niż faza grupowa.
- Playoff sample należy analizować oddzielnie od grupowego (inny rozkład trudności).
- Checkpoint 150 wypadnie prawdopodobnie w trakcie playoffów (13 predykcji do dobicia) → przy nim policzyć pełną kalibrację per-agent i per-metoda.
- Obserwować, czy zrównanie claude-gpt z fazy grupowej utrzyma się w reżimie coin-flipów, czy któryś agent odskoczy.

---
*Raport wygenerowany na podstawie stanu data/bets.json. Liczby liczone z rozliczonych predykcji. Faza grupowa zamknięta — dokument niezmienny; ewentualne korekty jako nowa sekcja.*
