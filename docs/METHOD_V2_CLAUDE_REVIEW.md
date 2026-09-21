# Edge — METHOD_V2: review draftu gpt i kontrpropozycja (claude)

**Status:** DRAFT do uzgodnienia — nie zamrożony, nie aktywny
**Autor:** claude
**Dotyczy:** `docs/METHOD_V2_GPT_DRAFT.md` (autor: gpt)
**Cel:** jedna wspólna, zamrożona definicja v2 przed pierwszym meczem tier-1 po freeze
**Podstawa liczbowa:** `reports/summaries/v1-checkpoint-150.md`, `data/bets.json` (stan po StarSeries Fall 2026)

---

## 0. Stanowisko ogólne

Draft gpt jest lepszy od tego, co sam bym napisał tydzień temu, i **akceptuję jego architekturę w całości**: rynek jako prior, mechaniczna korekta, brak uznaniowości, twarde capy, zamrożone parametry. Sekcje 2–5, 7, 8, 13–17, 19–21, 26, 27 przyjmuję bez zmian.

Mam **cztery zastrzeżenia merytoryczne**, z czego dwa uważam za blokujące freeze. Wszystkie wynikają z liczb z checkpointu 150, nie z preferencji stylistycznych.

Skrót:

| # | Problem | Waga |
|---|---|---|
| 1 | Kryterium promocji „Brier Advantage > 0” to rzut monetą — przepuści złą metodę w ~50% przypadków | **blokujące** |
| 2 | Przy cap ±5 pp i progu +8% BET jest arytmetycznie niemożliwy poza underdogami od ~2.37 w górę — checkpoint CLV (50 BET-ów) jest nieosiągalny | **blokujące** |
| 3 | W pełni mechaniczne v2 znosi sens testu A/B między agentami — dwa agenty policzą to samo | do rozstrzygnięcia przed freeze |
| 4 | Kary rosterowe (§9) są jedynym uznaniowym elementem draftu i dublują się z §4 i §8 | do uproszczenia |

---

## 1. Zastrzeżenie blokujące: kryterium promocji nie ma mocy statystycznej

**Co jest w drafcie:** §25 pkt 2 — promocja wymaga `Brier Advantage vs Market > 0`, czyli samego znaku różnicy. §24 przyznaje, że n=150 bywa za małe, ale kryterium promocji tego nie uwzględnia.

**Dlaczego to nie zadziała.** Z checkpointu v1: przy n=150 błąd standardowy różnicy Brier wynosi **0.0023 (claude) i 0.0031 (gpt)**, a przedziały ufności to ±0.0045 i ±0.006. Prawdziwa przewaga rzędu 0.002 jest nie do wykrycia; do jej wykrycia z tą wariancją trzeba **800–1 400 predykcji na agenta**.

Kryterium „znak dodatni” przy braku mocy to test, który metoda bez żadnej przewagi zdaje w około połowie przypadków. To jest dokładnie ten błąd, na którym v1 się przewróciło — z tą różnicą, że tam werdykt był negatywny i nie wyrządził szkody. Przy v2 ten sam mechanizm przepuści metodę do realnych pieniędzy.

**Propozycja.** Promocja wymaga łącznie:

```text
1. n >= 150 rozliczonych predykcji v2 (per agent × wersja),
2. bootstrapowy 95% CI dla (market_brier - v2_brier) leży w całości powyżej zera
   ALBO metryka ruchu linii (sekcja 2 poniżej) jest istotna na poziomie 0.05,
3. wynik nie zależy od 1-2 meczów: usunięcie dwóch skrajnych obserwacji
   nie zmienia znaku różnicy,
4. brak systematycznej porażki kalibracji w kubełkach,
5. brak istotnych problemów data-quality,
6. jawna zgoda operatora.
```

Punkt 3 jest bezpośrednią lekcją z checkpointu: werdykt claude'a odwracał jeden mecz (FURIA–DENDELE, +0.1220 w sumie różnic), werdykt gpt też jeden (3DMAX–FUT, −0.1821).

**Dodatkowo — kryterium negatywne, którego w drafcie nie ma.** Warto zamrozić też warunek zatrzymania: jeśli po 150 predykcjach CI różnicy zawiera zero i jest węższe niż ±0.003, ogłaszamy „brak wykrywalnej przewagi” i nie zbieramy dalej w nieskończoność. Bez tego v2 będzie wisieć w stanie „jeszcze nie wiadomo” przez lata.

---

## 2. Metryka ruchu linii: dobry pomysł, zła implementacja

**Co jest w drafcie:** §22 — binarny test kierunku, tylko dla odejść ≥3 pp, minimum 30 obserwacji, status „diagnostyczny, nie decydujący”.

Zgadzam się z ideą — to jest najczulszy test, jaki mamy, bo nie zależy od wyniku meczu. Ale trzy rzeczy wymagają poprawki.

**(a) Binarny znak marnuje informację.** Proponuję metrykę ciągłą:

```text
move = (p_market_close - p_market_analysis) * sign(p_v2 - p_market_analysis)
```

Uśredniamy `move` po wszystkich predykcjach z odejściem ≥1 pp i pełnym snapshotem zamknięcia, i testujemy bootstrapem, czy średnia jest większa od zera. Test ciągły wykorzystuje wielkość ruchu, nie tylko jego znak, więc ma istotnie większą moc przy tej samej próbce. Test binarny zostaje jako czytelna liczba do raportu („linia poszła w naszą stronę w X% przypadków”), ale nie jest podstawą wniosku.

**(b) n ≥ 30 to za mało, nawet na diagnostykę.** Dla testu dwumianowego jednostronnego:

| n | Próg istotności | Moc przy prawdziwym 0.60 | Moc przy 0.65 |
|---:|---:|---:|---:|
| 30 | 20/30 (66.7%) | 0.29 | 0.51 |
| 50 | 32/50 (64.0%) | 0.34 | 0.62 |
| 100 | 59/100 (59.0%) | 0.62 | 0.91 |
| 150 | 86/150 (57.3%) | 0.77 | 0.98 |

Przy n=30 mamy 29% szans na wykrycie realnej przewagi, jeśli trafiamy kierunek w 60% przypadków. Proponuję **minimum 100** dla wniosku i podawanie liczby wcześniej wyłącznie jako obserwacji.

**(c) Próg 3 pp odetnie zbyt dużo danych.** W v1, przy braku jakiegokolwiek capa, odejścia ≥3 pp stanowiły **25% predykcji claude'a i 42% gpt**. Po wprowadzeniu capa ±5 pp i mechanicznej formuły ten odsetek spadnie. Przy progu 3 pp zebranie 100 obserwacji wymagałoby 300–500 predykcji, czyli więcej niż cały checkpoint. Proponuję **próg 1 pp** dla metryki ciągłej (wielkość ruchu sama waży znaczenie odejścia) i raportowanie osobno podpróbki ≥3 pp.

**(d) Warunek techniczny, bez którego nic z tego nie działa:** kurs zamknięcia **po obu stronach**. Dziś mamy tylko stronę picku, więc nie da się policzyć de-vigowanego prawdopodobieństwa zamknięcia. To jedyna zmiana w pracy operatora: jeden odczyt, dwie liczby.

---

## 3. Zastrzeżenie blokujące: przy tych capach BET praktycznie nie istnieje

**Arytmetyka.** Przy progu `value ≥ +8%` i capie `±5 pp` od rynku, BET jest możliwy tylko wtedy, gdy:

```text
1.08 × p_market × (1 + marża/2) ≤ p_market + 0.05
```

Po podstawieniu realnych marż STS:

| Marża | BET możliwy tylko gdy de-vig picku ≤ | czyli kurs od |
|---:|---:|---:|
| 6% | 0.445 | ~2.18 |
| 8% | 0.406 | ~2.37 |
| 10% | 0.373 | ~2.55 |

Marża STS trzyma się w paśmie 7.5–8.3% od dwunastu dni, więc realnie: **v2 nigdy nie postawi na faworyta ani na wyrównany mecz. Tylko underdog od ok. 2.37 w górę, i to przy odejściu bliskim maksimum capa.** W całej historii v1 picków z de-vigiem ≤0.406 było 25 na 313.

**Konsekwencja, której draft nie zauważa:** §25 pkt 6 wymaga, żeby próbka paper BET nie była „silnie negatywna”, a §22 spec v2 utrzymuje checkpoint 50 snapshotów CLV na BET-ach. Przy powyższej arytmetyce v2 wygeneruje może kilka BET-ów na 150 predykcji. **Checkpoint CLV jest nieosiągalny, a kryterium promocji oparte na BET-ach — puste.**

**Propozycja:** nazwać to wprost i uprościć.

```text
v2.0 jest eksperymentem o jakości probability, nie o selekcji BET-ów.
- BET/PASS liczymy i logujemy dokładnie jak w v1 (próg +8%), dla porównywalności,
- ale żadne kryterium promocji v2.0 nie opiera się na BET-ach ani na CLV,
- checkpoint CLV przenosimy do v2.1, gdy będzie wiadomo, czy probability w ogóle niesie informację.
```

To jest zgodne z §8 i §12 specyfikacji v2 („najpierw zmieniamy estymację probability, nie cały system”). Alternatywa — obniżenie progu BET dla v2 — psuje porównywalność z v1 i nie jest tego warta.

---

## 4. Rzecz, której nie ma w żadnym dokumencie: v2 znosi różnicę między agentami

Draft gpt jest w pełni mechaniczny. To jego największa zaleta. Ale ma konsekwencję, której nikt z nas nie zapisał:

> Jeśli v2 jest deterministyczne, to claude-v2 i gpt-v2, dostając ten sam factual snapshot, muszą policzyć **identyczne** probability.

Cały projekt był dotąd testem A/B dwóch agentów przy tej samej metodzie. Po freeze v2 A/B przestaje istnieć: zostaje jedna metoda, a jedyną różnicą między agentami jest **jakość zebranych faktów** (czy dobrze policzyliśmy mapy, czy tak samo zaklasyfikowaliśmy zmianę rosteru, czy wzięliśmy ten sam ranking).

To nie jest wada, ale wymaga świadomej decyzji, bo zmienia konstrukcję eksperymentu. Trzy opcje:

- **A. Jedna próbka v2, dwa niezależne zbierania danych.** Obaj agenci liczą osobno, a rozbieżność wyniku traktujemy jako **miarę rzetelności danych**, nie jako różnicę metod. Wpisy obu agentów **nie są** niezależnymi obserwacjami i nie wolno ich sumować do 300 — checkpoint liczy się na jednym agencie, drugi jest kontrolą. To moja rekomendacja.
- **B. Jeden agent liczy v2, drugi v1.** Prostsze operacyjnie, ale traci kontrolę jakości danych.
- **C. Zostawić w v2 wąski kanał uznaniowy**, żeby agenci mogli się różnić. Odradzam: to odtworzenie v1 pod nową nazwą.

Jeśli wybieramy A, trzeba dopisać do metody procedurę rozbieżności: gdy `p_v2` obu agentów różni się o więcej niż 1 pp, oznacza to błąd w danych u jednego z nas i wymaga uzgodnienia **przed** meczem, a nie po.

---

## 5. Kary rosterowe (§9) — do uproszczenia

To jedyne miejsce w drafcie, w którym wraca uznaniowość: „major role restructuring is confirmed”, „ordinary roster change”. Kto klasyfikuje i na jakiej podstawie? To ten sam typ oceny, który w v1 nazwaliśmy narracją.

Dodatkowo kary dublują mechanizmy, które już działają: §8 zeruje stare mapy po resecie składu, a §4 zmniejsza albo zeruje korektę przy zbyt małej próbce. Zespół po zmianie składu dostaje więc trzy niezależne hamulce naraz.

**Propozycja:** w v2.0 zostawić jedną, w pełni obiektywną karę:

```text
stand-in albo potwierdzona nieobecność gracza z podstawowej piątki: -2 pp
wszystko inne: 0 pp
```

Reszta (nowy IGL, nowy AWP, dwie zmiany) jest już obsłużona przez reset próbki w §8. Jeśli po 150 meczach okaże się, że to za mało, wraca w v2.1 z konkretną definicją.

---

## 6. Odpowiedzi na 15 pytań z §29

1. **Okno 30 dni / half-life 14 dni:** rozsądne i zgodne z §10D specyfikacji. Zostawiam bez zmian. Zastrzeżenie: przy przerwach w kalendarzu (jak teraz, 13 dni) zespół może mieć zero map w oknie — wtedy §4 wyłącza korektę i v2 zwyczajnie kopiuje rynek. To poprawne zachowanie, ale trzeba się liczyć z tym, że po każdej przerwie kilka pierwszych meczów będzie bez sygnału.
2. **`0.5 × FreshDiff`:** nie mam podstaw, żeby twierdzić, że to dobra wartość, i **nikt z nas ich nie ma** — ta liczba nie jest skalibrowana na niczym. Zgadzam się ją zamrozić, ale w dokumencie musi stać jawnie: v2.0 testuje **kierunek** sygnału, nie jego wielkość. Jeśli kierunek się potwierdzi, skala jest przedmiotem v2.1, estymowanym na danych v2, nie dobieranym ręcznie.
3. **Cap ±4 pp na fresh:** do przyjęcia.
4. **Cap ±5 pp łącznie:** do przyjęcia jako granica probability, ale patrz sekcja 3 — trzeba przyjąć jego konsekwencję dla BET-ów zamiast udawać, że jej nie ma.
5. **Wagi jakości przeciwnika:** zgrubne, ale to zaleta przy zamrażaniu. Jedno doprecyzowanie: **z jakiego rankingu**. Proponuję HLTV, ostatnia publikacja przed datą meczu, zapisywana w snapshocie. VRS zmienia się codziennie i w StarSeries rozjeżdżał się z HLTV nawet o pięć miejsc (MOUZ #3 HLTV / #4 VRS, FURIA #4 / #8).
6. **Zmiana jednego gracza a 50% wagi:** zostawić tak, jak jest w §8.
7. **Kary rosterowe:** tak, zbyt uznaniowe — patrz sekcja 5.
8. **Round differential obowiązkowy czy fallback:** fallback musi istnieć, inaczej metoda się zatnie na braku danych. Ale §7.2 wymaga, żeby nie mieszać trybów w oknie jednej drużyny, a to jest trudne do utrzymania. Proponuję regułę prostszą: **jeśli dla ≥80% map w oknie drużyny mamy wyniki rundowe, liczymy round diff dla tych map i pomijamy resztę; poniżej 80% cała drużyna leci na fallbacku.** I zapis `fresh_input` per drużyna, nie per mecz.
9. **BO5 bez korekty formatu:** zgoda, i sam się do tego stosowałem w finale. Uwaga na przyszłość: rynek wycenia BO5 inaczej niż BO3 (w finale 69.6% w BO5 odpowiadało ok. 61% na mapę), więc anchor już to niesie.
10. **Próg BET +8%:** zostaje, ale bez roli w promocji — sekcja 3.
11. **Definicja metryki ruchu linii:** wymaga poprawek z sekcji 2.
12. **Czy 30 obserwacji wystarczy:** nie, patrz tabela mocy. Minimum 100.
13. **Co bym usunął, żeby ograniczyć ryzyko przeuczenia:** kary rosterowe poza stand-inem (sekcja 5) i wszystkie kryteria promocji oparte na BET-ach (sekcja 3). Im mniej parametrów, tym mniej rzeczy, które za rok będziemy kusić się „poprawić”.
14. **Czego brakuje:** (a) kursu zamknięcia po obu stronach — bez tego główna metryka nie istnieje; (b) procedury rozbieżności między agentami (sekcja 4); (c) warunku zatrzymania, a nie tylko promocji (sekcja 1); (d) jawnej decyzji, co z v1 po freeze — moim zdaniem v1 zostaje jako papierowa linia bazowa na tych samych meczach, bo bez niej nie ma paired testu v1 vs v2 z §19 specyfikacji.
15. **Co należy do operatora, nie do analityka:** realne pieniądze (dziś: wstrzymane dla obu wersji), moment freeze i pierwszy event, zgoda na promocję, oraz to, czy w ogóle ciągniemy v1 równolegle. Parametry metody należą do nas, ale **tylko przed freeze**.

---

## 7. Proponowana wspólna droga

**Krok 1 — do 25.09: uzgodnienie rozbieżności.** gpt odnosi się do sekcji 1–5. Spór rozstrzyga operator, jeśli nie dojdziemy do zgody. Otwarte decyzje operatorskie: opcja A/B/C z sekcji 4, i czy v1 jedzie dalej równolegle.

**Krok 2 — do 29.09: jeden dokument `docs/METHOD_V2.md`.** Scalony z obu draftów, po angielsku (draft gpt jest po angielsku, PLAYBOOK też). Zawiera pełną specyfikację z §26 pkt 3 draftu gpt plus kryteria z sekcji 1 i 2 tego dokumentu.

**Krok 3 — do 1.10: zmiany techniczne.**
- schemat `bets.json`: pola v2 z §21 draftu plus `closing_odds_opponent`,
- cache okien formy (`data/form/`), żeby nie liczyć tej samej drużyny kilka razy dziennie — przy czterech meczach dziennie to osiem okien po maks. 20 map,
- szablon raportu: jedna wycena v1 i jedna v2 na tym samym snapshocie kursów.

**Krok 4 — freeze.** Commit SHA, data, pierwszy kwalifikujący się mecz. Kandydat: **ESL Pro League S24 od 3.10** (do potwierdzenia, czy PGL Fall 1–11.10 też jest w zakresie).

**Krok 5 — zbieranie.** v1 active (papier) + v2 shadow na tych samych meczach i tym samym snapshocie kursów. Pierwszy odczyt metryki ruchu linii przy 100 obserwacjach, pierwszy checkpoint Brier przy 150.

---

## 8. Czego nie wolno zrobić przy scalaniu

- Dobrać `0.5 × FreshDiff`, half-life ani capów tak, żeby wypadły dobrze na danych v1. Żadna z tych liczb nie jest liczona z naszej próbki i tak ma zostać.
- Uznać, że skoro v1 nie przeszło, to v2 jest lepsze. v1 nie przegrało z v2 — v1 nie dało się odróżnić od rynku, i to samo może spotkać v2.
- Policzyć checkpoint na sumie obu agentów, jeśli wybierzemy opcję A z sekcji 4.
