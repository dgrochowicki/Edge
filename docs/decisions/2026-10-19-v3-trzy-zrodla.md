# Decyzja: v3 — ocena z trzech źródeł (własna analiza → konsensus rynku → STS)

**Data:** 2026-10-19 · **Status:** ZATWIERDZONY — oba punkty z sekcji 9 rozstrzygnięte przez operatora 2026-10-19
**Start:** pierwszy raport kolejnego turnieju w zakresie
**Autor projektu:** claude (audytor) · **Wykonawca dzienny:** gpt · **Operator:** Dom
**Kontekst:** `reports/summaries/Thunderpick-World-Championship-2026-summary.md`; rozmowa operatora z audytorem 2026-10-19

## 1. Po co

v2.0 koryguje kurs STS, który już zawiera wycenę bukmachera. Korekty są małe (mediana ok. 0.5 pp), w 55 predykcjach nie było ani jednej z dodatnim value, a BET jest praktycznie niemożliwy. v3 zmienia źródło przewagi. Gramy na STS tylko wtedy, gdy **STS odstaje od reszty rynku**, a **nasza własna, niezależna ocena wskazuje tę samą stronę**. Inni bukmacherzy są sprawdzianem naszej oceny, a nasza ocena jest sprawdzianem rozjazdu kursów.

## 2. Co się nie zmienia

- **v2 liczy się dalej równolegle, mechanicznie**, z tego samego odczytu STS i tego samego `data/form/`. Wpis `method_version: "v2"` powstaje jak dotąd, licznik β do K1 biegnie dalej. v2 nie wpływa na decyzje v3.
- Zakres turniejów, kalendarz, sposób podawania kursów STS przez operatora i zamknięcia — bez zmian.
- Gramy wyłącznie na STS. Kursy innych bukmacherów służą tylko jako punkt odniesienia.

## 3. Kolejność — obowiązkowa

**Krok 1 — własna ocena (`p_own`), przed jakimkolwiek kursem.**
gpt zapisuje w raporcie `p_own` dla każdej drużyny (4 miejsca) wraz z tabelą czynników, **zanim** otworzy jakąkolwiek stronę z kursami (w tym tabelę kursów na stronie meczu HLTV) i zanim poprosi operatora o STS.

Tabela czynników (każdy: która strona, ok. ile pp, jedno zdanie uzasadnienia):

| Czynnik | Co oceniamy | Orientacyjny zasięg |
|---|---|---|
| Siła ogólna | ranking HLTV, poziom drużyn | główny składnik |
| Mapy | map pool obu drużyn wobec prawdopodobnego veto | do ±8 pp |
| Forma | ostatnie 30 dni; `FreshMapScore` z `data/form/` jako punkt wyjścia | do ±6 pp |
| Skład | zmiany, stand-in, powroty, nieobecności | do ±8 pp |
| Kontekst | format BO1/BO3/BO5, LAN/online, stawka meczu, drugi mecz w dniu | do ±4 pp |

Zakres `p_own`: 0.10–0.90. Źródła z pełnymi URL. Jeśli podczas researchu pokazał się kurs, typ lub procent z sondażu dla tego meczu, gpt dodaje flagę `odds_seen_before_own` i `p_own` nie może być podstawą BET (pkt 5).

**Krok 2 — konsensus rynku (`p_cons`), po zapisaniu `p_own`.**
- Źródło: tabela kursów na stronie meczu HLTV (lub inne publiczne zestawienie kursów, jeśli HLTV jej nie pokazuje). **Bez STS.**
- Minimum **3 bukmacherów**. Dla każdego de-vig z obu kursów, `p_cons` = **mediana** de-vigów. Zapis: lista bukmacherów z kursami, `p_cons`, rozrzut (max − min de-vig), godzina odczytu.
- Mniej niż 3 bukmacherów → `p_cons = null`, flaga `consensus_missing`, brak BET.

**Krok 3 — STS.**
Operator podaje kursy STS z godziną odczytu, jak dotąd. Liczymy de-vig `p_sts` oraz:

```text
value_cons_X = kurs_STS_X × p_cons_X − 1      (value względem konsensusu)
value_own_X  = kurs_STS_X × p_own_X  − 1      (value względem własnej oceny)
gap_own_X    = p_own_X − p_cons_X             (w pp)
```

Liczymy dla obu stron. Odczyt konsensusu i odczyt STS nie mogą być od siebie oddalone o więcej niż **3 godziny**. Inaczej flaga `stale_consensus` i brak BET.

## 4. Reguła BET (ustalona z góry, bez zmian w trakcie)

**BET na stronę X**, jeśli spełnione są wszystkie warunki:

1. `value_cons_X ≥ +5%` — STS płaci wyraźnie więcej, niż wynika z reszty rynku;
2. `p_own_X ≥ p_cons_X` — nasza ocena daje stronie X co najmniej tyle, co rynek (zgadza się z kierunkiem albo idzie dalej);
3. `p_cons` z ≥ 3 bukmacherów, odczyty w oknie 3 h;
4. brak flag blokujących: `odds_seen_before_own`, `consensus_missing`, `stale_consensus`, `uncertain_roster` (sprzeczne źródła o składzie w dniu meczu);
5. przy kilku stronach spełniających warunki w jednym meczu — strona z wyższym `value_cons`.

Inaczej **PASS**. Dodatkowe etykiety do analizy (to nie są zakłady):

- `STS_OFF` — warunek 1 spełniony, warunek 2 nie (STS odstaje, my się nie zgadzamy);
- `OWN_DISAGREES` — `|gap_own| ≥ 8 pp` przy braku warunku 1 (mocno różnimy się od rynku).

**Stawka:** płaska **1u** na BET, bez skalowania pewnością. Maksymalnie 3 BET na dzień.
**Real czy papier** — decyzja operatora przy akceptacji (pkt 9).

## 5. Zapis w księdze

Osobny wpis na mecz z `method_version: "v3"`, `agent: "gpt"`, obok wpisu v2. Pola ponad standardowe (`id`, `date`, `report`, `match`, `pick`, `market_odds_at_analysis`, `market_odds_opponent`, `odds_timestamp`, `closing_odds`, `closing_odds_opponent`, `decision`, `result`, `data_quality`):

```text
p_own, p_own_opponent, own_timestamp,
p_cons, p_cons_opponent, cons_books (lista: nazwa + oba kursy), cons_spread_pp, cons_timestamp,
p_sts, value_cons_pct, value_own_pct, gap_own_pp,
label (BET / PASS / STS_OFF / OWN_DISAGREES), stake_u
```

`pick` = strona z wyższym `value_cons` (przy braku konsensusu: strona z wyższym `value_own`). Wszystkie prawdopodobieństwa do 4 miejsc, value i gap do 0.1. Repo agent dopisuje reguły do `scripts/validate_bets.py`. Dopóki ich nie ma, wpisy v3 przechodzą ręczną kontrolę operatora.

## 6. Raport dzienny

Nowe sekcje w `docs/REPORT_TEMPLATE.md`, **w tej kolejności w dokumencie**:

1. Ocena własna (tabela czynników + `p_own`, godzina zapisu) — pisana przed kursami;
2. Konsensus rynku (bukmacherzy, kursy, `p_cons`, rozrzut, godzina);
3. STS i decyzja v3 (value_cons, value_own, gap, etykieta, BET/PASS);
4. v2 mechanicznie (jak dotąd, skrócone).

Kolejność sekcji w pliku jest śladem kolejności pracy. Sekcja 1 nie jest poprawiana po kroku 2 lub 3. Błąd znaleziony później idzie do erraty.

## 7. Ocena

Raportowane co turniej (audytor):

- **Główne — CLV zakładów:** średnia `kurs_STS_przy_analizie / kurs_STS_zamknięcia − 1` dla BET. Dodatnie = bierzemy lepsze kursy niż rynek na końcu.
- Brier `p_own`, `p_cons`, `p_sts` na tych samych meczach — który z trzech najlepiej ocenia mecze.
- Wyniki osobno dla BET, `STS_OFF` i `OWN_DISAGREES` — czy nasza ocena dodaje coś ponad sam rozjazd kursów.
- Wynik finansowy BET (u i PLN) — opisowo.

**Przegląd po 30 BET lub 100 predykcjach v3** (co pierwsze): jeśli średnie CLV BET ≤ 0, a ROI < 0, wstrzymujemy stawki realne i wracamy do decyzji. Wcześniej żadnych zmian progów ani reguł na podstawie wyników.

## 8. Wdrożenie — kto i co przed startem

| Kto | Co |
|---|---|
| operator | akceptacja tego dokumentu (commit) + decyzja z pkt 9 |
| repo agent / operator | `REPORT_TEMPLATE.md` (sekcje z pkt 6), pola v3 w schemacie, reguły walidatora |
| gpt | od pierwszego raportu: krok 1 przed prośbą o kursy STS i przed otwarciem jakiejkolwiek tabeli kursów |
| operator | bez zmian: STS z godziną rano, zamknięcia STS przed meczami |
| claude | audyt po pierwszym turnieju v3 (kolejność, źródła, arytmetyka, CLV) |

## 9. Do decyzji operatora przy akceptacji

- [x] **BET v3 — real czy papier:** decyzja na żywo przy każdym BET (nie reguła blankietowa dla wszystkich sygnałów). Ocena metody (pkt 7) liczy **wszystkie** BET v3 niezależnie od tego, czy zostały faktycznie postawione realnie — więc CLV/Brier/ROI z pkt 7 to ocena sygnału, nie tylko tego, co Dom faktycznie zagrał. **Decyzja Doma (2026-10-19).**
- [x] **Próg `value_cons ≥ +5%`** — przyjęty bez zmian. **Decyzja Doma (2026-10-19).**
