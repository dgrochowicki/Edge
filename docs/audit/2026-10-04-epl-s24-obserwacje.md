# Obserwacje do audytu v2 — ESL Pro League S24, 2026-10-03/04

**Status:** OTWARTE — hipotezy do sprawdzenia w okresowym audycie claude (METHOD_V2 §21–22), **nie** zmiana metody.
**Zgłosił:** operator (Dom) 2026-10-04, spisał opiekun księgi.
**Dotyczy:** `P-2026-10-03-G1…G8`, `P-2026-10-04-G1…G8`, `data/form/2026-10-03.json`, `data/form/2026-10-04.json`.

## Co zostało sprawdzone i jest w porządku

Rachunek jest poprawny. Opiekun księgi przeliczył niezależnie, z surowych okien w `data/form/`, FreshMapScore wszystkich 32 drużyno-dni oraz `p_market`, korekty, `p_v2`, fair i value wszystkich 16 predykcji — wszystko zgadza się z księgą i raportami gpt. Poniższe punkty dotyczą **konstrukcji metody i jej wejść**, nie błędu wykonania.

Zgodnie z §22 żadna predykcja nie jest przepisywana ani wykluczana na podstawie tej notatki. Zmiana któregokolwiek parametru wymaga v2.1 (§23).

## O1. Kara za stand-ina może podwójnie liczyć informację już obecną w cenie

**Obserwacja.** W `P-2026-10-03-G2` (Legacy–PARIVISION) i `P-2026-10-04-G1` (ShindeN–Legacy) cała różnica `p_v2 − p_market` pochodzi z kary −2 pp dla Legacy (arT, IGL, nieobecny; bobz jako stand-in). Okno formy Legacy zostało jednocześnie zresetowane (zmiana IGL, §10), więc ten sam fakt rosterowy działa dwa razy: reset okna + kara bezpośrednia. Nieobecność arT była publicznie znana przed meczami, więc rynek STS prawdopodobnie już ją wycenił.

**Hipoteza.** Kara −2 pp dodaje szum zamiast informacji, gdy brak zawodnika jest ogłoszony z wyprzedzeniem.

**Jak sprawdzić w audycie.** Na wszystkich predykcjach z `roster_penalty_pick` ≠ 0 lub `roster_penalty_opponent` ≠ 0:
- ruch linii (§18 pkt 2) w kierunku korekty — czy rynek do zamknięcia idzie za karą, czy przeciw niej;
- Brier v2 vs Brier rynku na tej podpróbie.

Mała próbka — wniosek możliwy dopiero po zebraniu kilkunastu przypadków; do tego czasu tylko opis.

**Dane z tych dwóch dni (opisowo, bez wniosku):** G2 10-03 — brak closingu; PARIVISION wygrało 2:1 (kierunek kary trafny). G1 10-04 — closing bez ruchu (3.80 / 1.22); Legacy wygrało 2:0 (kierunek kary nietrafny).

## O2. Pojedyncza najświeższa seria dominuje FreshMapScore przy krótkich oknach

**Obserwacja.** Przy `weight_recency = 0.5 ** (days_ago / 14)` mapa z wczoraj waży ~0.95, a mapa sprzed 4 tygodni ~0.25. Drużyny z małą liczbą map tier-1 w oknie mają przez to ocenę formy wyznaczoną głównie przez jedno BO3. Udział map z 2026-10-03 w łącznej wadze okna w `data/form/2026-10-04.json`:

| Drużyna | Map w oknie | Udział serii z 10-03 |
|---|---:|---:|
| Legacy, ShindeN, 1win, M80 | 2–3 | 100% |
| PARIVISION | 9 | 78% |
| Falcons, TYLOO | 6–8 | 59% |
| Spirit | 9 | 56% |
| 9z | 9 | 52% |
| BETBOOM | 11 | 46% |
| Natus Vincere | 7 | 45% |
| G2 Esports | 20 | 27% |
| Aurora | 13 | 25% |
| MOUZ | 17 | 22% |
| FURIA | 18 | 20% |
| Vitality | 20 | 15% |

Skutek widoczny dzień do dnia: BETBOOM 1.755 → −1.3186, Falcons 0.6933 → 2.636, PARIVISION −1.4258 → 0.7329 po jednej serii.

**Hipoteza.** Przy oknach < ~10 map korekta fresh-form mierzy głównie wynik ostatniego meczu, nie formę — i może być gorsza niż brak korekty.

**Jak sprawdzić w audycie.** Podzielić predykcje z `fresh_adjustment_pp` ≠ 0 według maksymalnego udziału pojedynczej serii w wadze okna (pick lub opponent, z `data/form/`): np. > 50% vs ≤ 50%. Dla każdej grupy: ruch linii (§18) i Brier v2 vs rynek. Jeżeli grupa > 50% wypada wyraźnie gorzej — kandydat do v2.1 (np. dłuższy half-life albo limit wagi jednej serii), estymowany na danych v2, nie dobrany ręcznie (§11, nota o współczynniku 0.5).

## Czego ta notatka nie robi

- Nie zmienia parametrów v2.0 ani nie wyklucza żadnej predykcji.
- Nie wyciąga wniosków z 16 wyników — to próbka, na której każdy wzór wyglądałby przypadkowo.
- Nie jest wynikiem audytu; jest listą pytań, które audyt ma rozstrzygnąć na danych.
