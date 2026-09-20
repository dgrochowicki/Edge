# Edge — Raport checkpointu: metoda v1 po 150 predykcjach

**Zakres:** 2026-07-21 – 2026-09-19 · **Metoda:** v1 · **Gra:** cs2 · **Rynek odniesienia:** STS (de-vig z kursów w momencie analizy)
**Agenci:** claude, gpt — oceniani osobno, zgodnie z PLAYBOOK → Verdict staging
**Autor:** claude · **Data:** 2026-09-19 · **Status dokumentu:** walidacyjny — to jest pre-rejestrowany werdykt z PLAYBOOK → Failure conditions

---

## 1. Zakres i metodyka

**Co liczymy.** Brier agenta wobec Briera de-vigowanego rynku STS na tej samej, sparowanej próbce. Rynek liczymy z kursów zapisanych w chwili analizy (`market_odds_at_analysis`, `market_odds_opponent`), a nie z kursów zamknięcia. Benchmarkiem jest de-vig, a nie 0.25.

**Które 150.** PLAYBOOK mówi „po 150 rozliczonych predykcjach”, ale nie mówi, których. Kolejność rozliczenia nie jest zapisywana w `bets.json`, więc przyjmuję **pierwsze 150 w kolejności `date`, potem `id`**. Jest to deterministyczne i niezależne od wyników. Werdyktem jest liczba z n=150. Bieżący stan (claude 156, gpt 153) podaję obok jako informację.

- claude: próbka 21.07 – 18.09, ostatni wpis w próbce `P-2026-09-18-C2`
- gpt: próbka 21.07 – 19.09, ostatni wpis w próbce `P-2026-09-19-G1`

Wszystkie wpisy mają `method_version: v1`, `game: cs2` i obie ceny rynkowe. Nie ma wpisów archiwalnych ani w trybie shadow.

## 2. Werdykt formalny

| Agent | n | Brier | Rynek | Różnica | Werdykt wg PLAYBOOK |
|---|---:|---:|---:|---:|---|
| claude | 150 | 0.21523 | 0.21503 | **+0.00020** | **niezwalidowana** |
| gpt | 150 | 0.20759 | 0.20793 | **−0.00034** | **zwalidowana** |
| *claude (stan bieżący)* | *156* | *0.21535* | *0.21484* | *+0.00050* | *—* |
| *gpt (stan bieżący)* | *153* | *0.20953* | *0.21022* | *−0.00069* | *—* |

Werdykt formalny jest ten, który wynika z pre-rejestrowanej reguły, i nie zmieniamy go. Sekcja 3 pokazuje jednak, że **ta reguła przy n=150 nie potrafi odróżnić żadnego z agentów od rynku**, i to jest ważniejsze ustalenie tego raportu.

## 3. Werdykt statystyczny: żadnej różnicy nie da się wykryć

Dla każdej predykcji liczę różnicę `Brier agenta − Brier rynku`, a potem jej średnią, błąd standardowy i przedział bootstrapowy (20 000 losowań).

| Agent | Różnica | SE | 95% CI | P(agent lepszy od rynku) |
|---|---:|---:|---|---:|
| claude | +0.00020 | 0.00234 | [−0.00436, +0.00474] | 0.47 |
| gpt | −0.00034 | 0.00305 | [−0.00631, +0.00552] | 0.54 |

**Obie różnice są mniej więcej dziesięć razy mniejsze od własnego błędu standardowego.** Prawdopodobieństwo, że agent jest lepszy od rynku, wynosi 0.47 i 0.54, czyli tyle co rzut monetą. „Asymetria” werdyktów (claude nie przechodzi, gpt przechodzi) istnieje formalnie, ale nie da się jej odróżnić od szumu.

**Oba werdykty zależą od pojedynczych meczów:**

- claude: jeden mecz — **FURIA vs DENDELE, 24.07** (p 0.926 wobec rynku 0.858, przegrany) — to +0.1220 w sumie różnic. Bez niego claude ma **−0.00062** i przechodzi checkpoint.
- gpt: jeden mecz — **3DMAX vs FUT, 26.07** (gpt wycenił FUT na 0.599 wobec rynkowych 0.735, FUT przegrali) — to −0.1821. Bez niego gpt ma **+0.00088** i nie przechodzi.

**Ile predykcji trzeba, żeby cokolwiek rozstrzygnąć.** Przy obecnym rozrzucie różnic, żeby przewaga była dwa błędy standardowe od zera:

| Prawdziwa przewaga nad rynkiem | claude | gpt |
|---:|---:|---:|
| 0.005 | ~130 | ~220 |
| 0.002 | ~820 | ~1 390 |
| 0.001 | ~3 280 | ~5 570 |

Przewaga 0.005 w Brierze to bardzo dużo, więcej niż ktokolwiek realnie osiąga na tier-1 moneyline. Realistyczne 0.001–0.002 wymaga **od kilkuset do kilku tysięcy predykcji na agenta**. Przy obecnym tempie (ok. 75 predykcji miesięcznie na agenta) to rok albo więcej.

**Wniosek:** Brier na n=150 był za mało czułym testem do tego pytania. Nie wiedzieliśmy tego przy pre-rejestracji, bo nie znaliśmy rozrzutu. Teraz go znamy. To jest najważniejsza informacja dla projektu v2, zob. sekcja 9.

## 4. claude — skąd bierze się wynik

| | n | Trafienia | Średni ruch vs de-vig |
|---|---:|---:|---:|
| cała próbka | 150 | 106 (70.7%) | **+0.28 pp** (średni \|ruch\| 2.02 pp) |
| pick = faworyt rynku | 141 (94%) | 71% | **−0.03 pp** |
| pick = underdog | 9 | 67% | +5.15 pp |

**Rozkład wyniku według kierunku odejścia od rynku:**

| Kierunek | n | Wkład w sumę różnic | Średnio na predykcję |
|---|---:|---:|---:|
| powyżej rynku (> +0.5 pp) | 62 | **−0.1140** (pomaga) | −0.00184 |
| poniżej rynku (< −0.5 pp) | 40 | **+0.1535** (szkodzi) | +0.00384 |
| na rynku (±0.5 pp) | 48 | −0.0089 | −0.00019 |

**To odwraca diagnozę, którą powtarzałem w raportach dziennych.** Pisałem, że moim systematycznym obciążeniem jest „ok. +2 pp w stronę picku, w górę na faworytach”. Na 150 predykcjach średni ruch na faworytach wynosi **−0.03 pp**, czyli zero. Odejścia w górę średnio **pomagały**. Traciłem na odejściach **w dół**: 40 predykcji, w których oceniałem pick niżej niż rynek, dało więcej straty niż wszystko inne razem.

To zgadza się z błędem nazwanym w raporcie fazowym playoffów FISSURE (przecenianie zmęczenia i bilansu turniejowego jako powodu, żeby zejść poniżej rynku na faworycie) i uogólnia go. **Nazwany błąd v1 dla claude'a to schodzenie poniżej rynku, a nie podnoszenie faworytów.**

Dziewięć picków na underdoga dało −0.2766, czyli dużą poprawę. To jednak tylko dziewięć przypadków, a najlepszy z nich (MOUZ nad Vitality, 05.09) sam daje −0.1357.

## 5. gpt — skąd bierze się wynik

| | n | Trafienia | Średni ruch vs de-vig |
|---|---:|---:|---:|
| cała próbka | 150 | 94 (62.7%) | **+2.17 pp** (średni \|ruch\| 3.29 pp) |
| pick = faworyt rynku | 122 (81%) | 70% | +1.43 pp |
| pick = underdog | 28 | **29%** | +5.40 pp |

| Kierunek | n | Wkład w sumę różnic | Średnio |
|---|---:|---:|---:|
| powyżej rynku | 111 | −0.0154 | −0.00014 |
| poniżej rynku | 27 | −0.0540 | −0.00200 |
| na rynku | 12 | +0.0182 | +0.00151 |

Obciążenie „+2 pp w stronę picku”, które w projekcie przypisywaliśmy claude'owi, **w danych należy do gpt**. gpt odchodzi od rynku dalej i częściej: średni |ruch| 3.29 pp wobec moich 2.02 pp.

Profil jest odwrotny do mojego. gpt zyskuje na faworytach (−0.1921) i traci na underdogach (+0.1408): 28 picków, z czego trafione tylko 29%. Ja zyskiwałem na underdogach, a traciłem na faworytach. Przy n=9 i n=28 to hipoteza, nie wzorzec.

## 6. Porównanie sparowane

Obaj agenci wycenili te same **141 mecze** (ta sama data i ten sam mecz; liczone na pełnych próbkach).

| | Brier na wspólnych 141 |
|---|---:|
| gpt | **0.19997** |
| claude | 0.20094 |
| rynek | 0.20130 |

**Na wspólnych meczach obaj agenci są minimalnie lepsi od rynku.** Porażka claude'a na checkpoincie bierze się z 15 predykcji w jego pierwszych 150, których gpt nie ma w swoich pierwszych 150. Średnio dają +0.00864 na predykcję, z czego FURIA–DENDELE to niemal całość. Po stronie gpt analogiczne 15 daje +0.00632. **Na tych samych meczach różnica między agentami wynosi 0.001 w Brierze, a przedział ufności jest ponad czterokrotnie szerszy.**

Różne picki: w 25 meczach agenci wskazali różnych zwycięzców, z czego 21 mieści się w obu pierwszych 150. W tych 21 claude trafił częściej (19 razy wskazał faworyta rynku), a Brier wyszedł: claude 0.1708, gpt 0.1788, **rynek 0.1654**. W sporach żaden z agentów nie był lepszy od rynku.

## 7. Kalibracja w kubełkach (po stronie picku)

| Kubełek p_est | claude n | claude: p_est / rynek / faktycznie | gpt n | gpt: p_est / rynek / faktycznie |
|---|---:|---|---:|---|
| 20–40% | 1 | 23.0 / 19.6 / 0.0 | 13 | 30.7 / 26.0 / **0.0** |
| 40–50% | 4 | 45.0 / 38.4 / 50.0 | 8 | 45.3 / 38.7 / 62.5 |
| 50–60% | 43 | 55.6 / 56.2 / **67.4** | 28 | 55.4 / 54.2 / 50.0 |
| 60–70% | 36 | 65.2 / 65.3 / 66.7 | 37 | 64.6 / 62.8 / 73.0 |
| 70–80% | 27 | 74.2 / 74.6 / 85.2 | 30 | 74.3 / 73.1 / 80.0 |
| 80–90% | 26 | 84.4 / 83.3 / 76.9 | 19 | 84.3 / 82.9 / 68.4 |
| 90–100% | 13 | 92.3 / 90.3 / **61.5** | 15 | 92.9 / 89.7 / **73.3** |

Dwie rzeczy są widoczne u obu agentów **i u rynku**:

- **Najmocniejsi faworyci (90%+) przegrywali znacznie częściej, niż wyceniano.** claude 5 porażek na 13, gpt 4 na 15, a rynek wyceniał te mecze na ok. 90%. Obciążenie należy do rynku, agenci je tylko przejęli.
- **Faworyci w przedziale 50–60% u claude'a wygrywali częściej, niż wyceniano** (67% wobec 56%).

Liczebności 13–15 w skrajnych kubełkach to za mało, żeby z tego robić regułę. To hipoteza do przetestowania w v2 na świeżej próbce, bez strojenia na tej.

## 8. Test niezależny od wyniku: czy linia zamknięcia szła w stronę agenta

Kursy zamknięcia są zapisane dla 56 predykcji każdego agenta, tylko po stronie picku. Sprawdziłem, czy między analizą a zamknięciem implikowane prawdopodobieństwo picku ruszyło się w tę samą stronę, w którą agent odszedł od rynku.

| Agent | Odejścia > 0.5 pp z ruchem linii | Linia poszła w stronę agenta | Przy odejściach ≥ 3 pp |
|---|---:|---:|---:|
| claude | 34 | 16 (47%) | 5/12 |
| gpt | 38 | 21 (55%) | 9/15 |

Obaj na poziomie rzutu monetą. Ten test nie zależy od tego, kto wygrał mecz, więc jest dużo mniej zaszumiony niż Brier. Mówi to samo: **żaden z agentów nie przewiduje, dokąd pójdzie rynek.** Próbka jest mała, ale test warto rozwinąć (zob. sekcja 9).

## 9. BET, CLV, wynik finansowy

| Agent | BET | Wynik flat | CLV na BET-ach | Flat 1u na każdy pick |
|---|---:|---:|---|---:|
| claude | 3 | −0.46u | +5.83% (n=1) | −3.3u (ROI −2.2%) |
| gpt | 17 | −0.50u | +4.72% (n=8) | −17.1u (ROI −11.4%) |

Checkpoint CLV (50 snapshotów na BET-ach) **nie zapadł i nie zapadnie w rozsądnym czasie** przy obecnym tempie BET-ów: claude ma jeden snapshot, gpt osiem.

„Flat na każdy pick” nie jest strategią projektu. Pokazuje tylko, ile kosztuje marża przy trafianiu razem z rynkiem: 70.7% trafień u claude'a i mimo to wynik ujemny.

## 10. Korekty wcześniejszych twierdzeń

Te zdania padały w raportach dziennych i w rozmowie, a dane na 150 ich nie potwierdzają:

1. **„Systematyczne obciążenie claude'a to ok. +2 pp w stronę picku.”** Na 150 średni ruch to +0.28 pp, a na faworytach −0.03 pp. Obciążenie +2 pp należy do gpt (+2.17 pp).
2. **„Cztery picki, cztery razy powyżej rynku — dokładnie to obciążenie, które dziś dostaje werdykt”** (raport 2026-09-18, sekcja 1 i 3). Nieprawda: odejścia w górę średnio pomagały, szkodziły odejścia w dół.
3. **„Asymetryczny werdykt jest ciekawszym rezultatem niż dwie porażki”** (raport 2026-09-19, sekcja 0). Formalnie asymetria jest, ale statystycznie różnicy między agentami nie ma. Każdy werdykt odwraca jeden mecz.
4. **„gpt wygrywa, bo częściej bierze underdogów”** (hipoteza z raportu 2026-09-19, sekcja 5). Jest odwrotnie: gpt traci na underdogach, a zyskuje na faworytach.

Raporty dzienne są niezmienne, więc korekty trafiają tutaj, a nie do tamtych plików.

## 11. Konsekwencje według zasad projektu

Według PLAYBOOK → Failure conditions i specyfikacji v2 §23:

- **claude × v1 niezwalidowana:** koniec zakładów za prawdziwe pieniądze na podstawie tej metody. v1 działa dalej jako papierowa linia bazowa. W praktyce zmienia to niewiele, bo claude ma trzy BET-y w całej historii.
- **gpt × v1 zwalidowana formalnie:** reguły dopuszczają dalsze granie. Sekcja 3 pokazuje jednak, że ten werdykt wisi na jednym meczu. Decyzja, czy z niego korzystać, należy do operatora i jest opisana w `docs/decisions/2026-09-19-v1-checkpoint-150.md`.
- **v2 nie dostaje automatycznego awansu** z powodu werdyktu v1 (spec §23). v2 rusza dopiero po zamrożeniu definicji na papierze, domyślnie w trybie shadow.

## 12. Co z tego wynika dla projektowania v2 (wnioski, nie reguły)

1. **Sam Brier nie oceni v2 w rozsądnym czasie.** Jeśli v2 będzie oceniane tak jak v1, za 150 predykcji dostaniemy ten sam brak odpowiedzi. Główną miarę trzeba zmienić przed startem v2.
2. **Najczulszy dostępny test nie zależy od wyniku meczu:** czy linia zamknięcia idzie w stronę odejścia agenta od rynku (sekcja 8). Wymaga zapisywania kursu zamknięcia po **obu stronach** i dla **wszystkich** predykcji, a nie tylko po stronie picku przy BET-ach. Dziś `closing_odds_opponent` nie istnieje w schemacie.
3. **Kierunek szkody u claude'a jest konkretny:** odejścia poniżej rynku (n=40). To kandydat na jawne ograniczenie w v2, a nie na strojenie na tej próbce.
4. **Skrajni faworyci (90%+) przeszacowani przez rynek i obu agentów** — hipoteza do sprawdzenia na świeżych danych.
5. **Wszystko powyżej to wnioski z próbki v1.** Zgodnie z zasadą PRE-V2 nie wolno z nich budować reguł i sprawdzać tych reguł na tych samych 150 predykcjach.
