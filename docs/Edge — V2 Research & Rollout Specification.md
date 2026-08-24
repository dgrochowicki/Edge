# Edge — V2 Research & Rollout Specification

**Status:** DRAFT / dokument kierunkowy  
**Dotyczy:** rozwoju projektu Edge z metody `v1` do przyszłej `v2`  
**Gra:** CS2  
**Zakres:** wyłącznie mecze zgodne z aktualnym scope projektu  
**Dokument wiążący dla aktywnej metody:** `docs/PLAYBOOK.md`  
**Dokument roboczy v2:** `docs/PRE-V2.md`

---

## 1. Cel dokumentu

Ten dokument opisuje, **jak projekt Edge ma przejść z v1 do v2**, bez niszczenia trwającego eksperymentu v1 i bez dopasowywania nowej metody do wyników, które już znamy.

Dokument ma umożliwić każdej nowej instancji / agentowi zrozumienie:

- czym jest obecne v1,
- czym ma być v2,
- dlaczego v2 powstaje,
- jak v1 i v2 mają działać równolegle,
- jak mają powstawać raporty,
- jak dane mają być logowane,
- jak dashboard ma liczyć jakość metod,
- kiedy v2 może zostać uznane za lepsze,
- kiedy v2 może zostać promowane z `shadow` do `active`,
- czego agentowi NIE wolno zmieniać samodzielnie.

---

# 2. Stan projektu

Aktualnie aktywna jest:

`method_version: v1`

v1 jest trwającym eksperymentem i **nie wolno go porzucić przed jego własnym checkpointem**, tylko dlatego, że projektowane jest v2.

Checkpointy są liczone osobno dla:

`agent × method_version`

Przykłady:

- `gpt × v1`
- `claude × v1`
- przyszłe `gpt × v2`
- przyszłe `claude × v2`

Próbek nie wolno łączyć.

---

# 3. Dlaczego powstaje v2

EWC 2026 ujawnił potencjalną różnicę informacyjną pomiędzy sposobami wyceny:

> Jak szybko zmieniać ocenę siły zespołu pod wpływem świeżych informacji, zamiast nadmiernie opierać się na rankingu, reputacji, historycznym H2H lub aktualnej wycenie rynku.

Widoczne przypadki EWC obejmowały m.in.:

- FUT przeciw MOUZ,
- Spirit przeciw Vitality,
- Legacy przeciw Spirit.

Pierwsze dwa pokazały potencjalną wartość szybszego reagowania na świeżą formę.

Trzeci pokazał niebezpieczeństwo przeciwne:

> nadmierną korektę po kilku spektakularnych wynikach.

Dlatego v2 **NIE jest metodą „graj gorącego underdoga”**.

EWC generuje jedynie hipotezę.

Nie może zostać użyte do dobrania takich parametrów v2, które wstecznie dałyby najlepszy wynik na EWC.

---

# 4. Fundamentalna zasada rozwoju

## v1 i v2 są osobnymi eksperymentami

v1 ma własną próbkę.

v2 rozpocznie własną próbkę od zera.

Historyczne dane v1 mogą służyć do:

- znalezienia problemu,
- postawienia hipotezy,
- zaprojektowania sposobu testu.

Nie mogą służyć do:

- strojenia parametrów v2 aż wyniki historyczne wyglądają dobrze,
- wybierania wag na podstawie wyniku EWC,
- ponownego przeliczania EWC jako „wyniku v2”,
- przedstawiania backtestu v2 na danych, które zainspirowały v2, jako dowodu jakości metody.

---

# 5. Docelowy model: ACTIVE v1 + SHADOW v2

Po zamrożeniu definicji v2 obie metody mają przez pewien okres działać równolegle.

## v1

`mode: active`

- oficjalna aktywna metoda,
- tworzy probability,
- tworzy fair odds,
- podejmuje BET / PASS,
- może wpływać na realne decyzje operatora,
- kontynuuje własną próbkę aż do checkpointu.

## v2

`mode: shadow`

- analizuje dokładnie te same kwalifikujące się mecze,
- tworzy własne probability,
- tworzy własne fair odds,
- może generować teoretyczne BET / PASS,
- **nie wolno grać realnych zakładów na podstawie v2**,
- służy wyłącznie do zbierania świeżej próbki badawczej.

---

# 6. Jeden factual snapshot dla obu metod

Nie należy wykonywać dwóch całkowicie niezależnych researchów meczu.

Dla każdego dnia najpierw tworzony jest wspólny **factual snapshot**.

Może zawierać m.in.:

- mecze dnia,
- etap turnieju,
- BO1 / BO3 / BO5,
- roster,
- stand-iny,
- zmiany składu,
- ostatnie wyniki,
- ranking,
- przeciwników,
- map pool,
- dane kontekstowe,
- kurs STS,
- timestamp kursu.

Ten zestaw faktów jest wspólny dla v1 oraz v2.

### Bardzo ważne

Wspólne są **fakty**.

Nie są wspólne:

- probability,
- fair odds,
- interpretacja value,
- BET/PASS,
- confidence.

V1 i v2 muszą dokonać tych ocen zgodnie z własnymi zasadami.

---

# 7. Izolacja predykcji

Aby ograniczyć wzajemne kotwiczenie modeli:

### v1 nie powinno znać:

- probability v2,
- fair odds v2,
- decyzji v2.

### v2 nie powinno znać:

- probability v1,
- fair odds v1,
- decyzji v1.

V2 dostaje:

> factual snapshot + specyfikację v2

a nie:

> raport v1 + polecenie „przelicz go według v2”.

To pozwala później uczciwiej porównywać obie metody.

---

# 8. Kierunek metodologiczny v2

V2 ma przede wszystkim zmienić **sposób estymacji probability**, a nie równocześnie przebudować cały system BET/PASS.

To pozwala później odpowiedzieć na pytanie:

> Czy nowy sposób wyceny prawdopodobieństwa jest rzeczywiście lepszy?

bez mieszania tego z równoczesną zmianą stakingu, thresholdów i innych mechanizmów.

---

# 9. Market jako anchor v2

Planowanym punktem wyjścia v2 jest:

**de-vigged market probability**

Nie oznacza to kopiowania rynku.

Rynek stanowi anchor / prior.

Analiza odpowiada następnie:

> Jakie informacje, których rynek może nie wycenić w pełni, uzasadniają odejście od tej wartości?

Przykład:

`de-vig market = 43%`

Następnie v2 może uznać:

`p_v2 = 48%`

ale musi istnieć jawna przyczyna tej korekty.

Im większe odejście od rynku, tym silniejszego zestawu informacji powinno wymagać.

---

# 10. Fresh-form signal

Głównym nowym elementem v2 ma być **mierzalny fresh-form signal**.

Nie może być definiowany jako:

- „team wygląda dobrze”,
- „ma momentum”,
- „wygrał ostatni mecz”,
- „underdogi są teraz mocne”.

Docelowo powinien wykorzystywać policzalne komponenty.

Kandydaci:

### A. Recent opponent quality

Nie tylko wynik, ale poziom przeciwnika.

Wygrana nad top-5 musi mieć inną wagę niż wygrana nad tier-2.

### B. Top-tier map performance

Ocena nie tylko całych serii, ale zdolności do:

- wygrywania map przeciw tier-1,
- utrzymywania konkurencyjności przeciw mocniejszym drużynom.

### C. Current-roster performance

Po istotnej zmianie rosteru stare dane nie powinny mieć takiej samej wagi jak dane obecnego składu.

### D. Recency decay

Nowsze mecze powinny wpływać mocniej niż starsze.

Kierunkowa propozycja:

- główne okno: około 30 dni,
- największa waga: około 14 ostatnich dni.

Dokładna funkcja rozpadu musi zostać zdefiniowana **przed freeze v2**.

### E. Roster stability

Uwzględnić m.in.:

- liczbę spotkań obecnego składu,
- czas gry razem,
- stand-in,
- zmianę IGL,
- zmianę trenera,
- duże przesunięcia ról.

---

# 11. Czego fresh-form signal NIE robi

Fresh-form signal:

**wpływa na probability.**

Nie powinien bezpośrednio oznaczać:

`fresh form detected → BET`

Proces pozostaje:

`market anchor`
→ `analysis`
→ `fresh-form adjustment`
→ `p_v2`
→ `fair odds`
→ `value`
→ `BET/PASS`

Pozwala to osobno ocenić jakość probability oraz jakość selekcji BET.

---

# 12. BET threshold w pierwszej wersji v2

Przy uruchomieniu v2 nie należy jednocześnie radykalnie zmieniać:

- probability modelu,
- BET thresholdu,
- stakingu,
- scope.

Pierwszy test v2 powinien przede wszystkim odpowiadać:

> Czy nowa estymacja probability jest lepsza?

Dlatego mechanizm konwersji:

`probability → fair odds → BET/PASS`

powinien pozostać możliwie zgodny z v1.

Jeżeli później CLV pokaże problem z selekcją BET, może to być osobny przedmiot kolejnej rewizji metody.

---

# 13. Ograniczenie nadmiernego odejścia od rynku

V2 powinno posiadać mechanizm ograniczający duże korekty probability wynikające z małej liczby świeżych obserwacji.

Przykład problemu:

`market = 43%`

Nie powinno być możliwe swobodne przejście do:

`model = 60%`

wyłącznie dlatego, że underdog wygrał dwa ostatnie mecze.

Przed freeze v2 należy zdefiniować:

- maksymalną standardową korektę,
- warunki pozwalające przekroczyć ten limit,
- minimalną ilość danych wymaganą do silnej korekty.

**Dokładne wartości nie są jeszcze ustalone.**

Nie wolno ich dobierać poprzez optymalizację na EWC.

---

# 14. Raportowanie

Po uruchomieniu shadow v2 rekomendowana struktura:

### Active

`reports/YYYY-MM-DD-gpt.md`

`reports/YYYY-MM-DD-claude.md`

### Shadow

`reports/shadow/YYYY-MM-DD-gpt-v2.md`

`reports/shadow/YYYY-MM-DD-claude-v2.md`

Shadow report może być krótszy od raportu active.

Nie musi ponownie opisywać całego factual research.

Musi jednak zawierać minimum:

- match,
- market,
- market odds,
- market de-vig probability,
- `p_v2`,
- fair odds v2,
- value,
- theoretical BET/PASS,
- najważniejszą korektę względem market anchor,
- JSON prediction record.

---

# 15. Ledger

Każda predykcja powinna jednoznacznie określać:

```text
agent
method_version
mode
```

Przykład active:

```text
agent: gpt
method_version: v1
mode: active
```

Przykład shadow:

```text
agent: gpt
method_version: v2
mode: shadow
```

Shadow predictions są normalnymi obserwacjami badawczymi.

Po meczu otrzymują:

`won / lost / void`

tak samo jak active predictions.

---

# 16. Kursy dla porównania v1 vs v2

Jeżeli v1 i v2 oceniają ten sam mecz, powinny wykorzystywać **ten sam snapshot kursów**.

To kluczowe.

Nie wolno porównywać:

`v1 @ 08:00`

z:

`v2 @ 12:00`

i traktować tego jako czystego testu modeli.

Celem jest:

> ten sam mecz + te same informacje czasowe + ta sama cena → różna metoda.

---

# 17. Dashboard — podstawowa jednostka jakości

Dashboard nie powinien pokazywać jednej globalnej wartości:

`GPT quality`

Powinien liczyć jakość na poziomie:

`agent × method_version`

Przykład:

- GPT v1
- GPT v2
- Claude v1
- Claude v2

Każda kombinacja ma własne:

- `n`,
- Brier,
- market Brier,
- Brier advantage,
- hit rate,
- BET count,
- BET W/L,
- CLV,
- etap eksperymentu.

---

# 18. Główna metryka jakości

Najbardziej intuicyjną metryką dashboardu powinno być:

## Brier Advantage vs Market

```text
market_brier - method_brier
```

Interpretacja:

`> 0` → metoda lepsza od rynku  
`= 0` → metoda nie dodaje informacji  
`< 0` → rynek lepszy

Przykład:

```text
Market Brier: 0.211
v2 Brier:     0.196
Advantage:   +0.015
```

---

# 19. Paired Comparison: v1 vs v2

Najważniejszym nowym ekranem dashboardu ma być:

## v1 vs v2 — Shared Matches Only

Porównanie wykorzystuje **wyłącznie mecze ocenione równolegle przez obie wersje**.

Przykład:

| Metric | v1 | v2 | Market |
|---|---:|---:|---:|
| Shared n | 64 | 64 | 64 |
| Brier | 0.205 | 0.192 | 0.207 |
| Advantage vs market | +0.002 | +0.015 | — |
| Hit rate | 69% | 72% | — |

Dodatkowo:

```text
v2 improvement vs v1 = v1_brier - v2_brier
```

To jest czystszy test niż porównywanie metod działających w różnych okresach.

---

# 20. Dywergencje między metodami

Dashboard / research layer powinien również zapisywać sytuacje:

```text
v1 pick ≠ v2 pick
```

oraz przypadki:

```text
v1 PASS / v2 BET
v1 BET / v2 PASS
```

To będą najbardziej informacyjne obserwacje pozwalające zrozumieć, **co faktycznie zmienia v2**.

Nie należy jednak oceniać metody wyłącznie po tych efektownych przypadkach.

Główną metryką pozostaje pełny Brier na całej próbce.

---

# 21. Etapy oceny

Liczone osobno dla każdego:

`agent × method_version`

### 0–49

Collection.

Brak wniosków.

### 50–99

Preliminary signal.

Można obserwować kierunek.

Nie wolno deklarować przewagi.

### 100–149

Emerging pattern.

Można dyskutować o powtarzających się wzorcach.

### 150+

Validation checkpoint.

Formalne porównanie:

`method Brier vs de-vigged market Brier`

na sparowanej próbce.

---

# 22. CLV

Brier testuje probability.

CLV testuje jakość selekcji ceny.

Dla BET-ów nadal obowiązuje osobny checkpoint:

**50 closing snapshots BET**

Metryka jest liczona osobno per:

`agent × method_version`

Shadow BET v2 może być oceniany pod kątem hipotetycznego CLV nawet jeśli nie został realnie postawiony.

---

# 23. Co dzieje się z v1 po osiągnięciu 150

## Jeżeli v1 zostaje validated

v1 może pozostać `active`, podczas gdy v2 nadal zbiera shadow sample.

Nie ma obowiązku przechodzenia na v2.

## Jeżeli v1 zostaje not validated

Zgodnie z Playbookiem należy zatrzymać real-money betting na podstawie tej metody.

V1 może nadal działać jako paper / research baseline.

V2 nadal pozostaje shadow do momentu spełnienia własnych kryteriów.

Nie wolno automatycznie promować v2 tylko dlatego, że v1 nie przeszło checkpointu.

---

# 24. Warunki promocji v2

Warunki promocji powinny zostać zamrożone **przed rozpoczęciem shadow testu**.

Rekomendowany zestaw:

V2 może przejść:

`shadow → active`

dopiero jeśli:

1. osiągnie własny wymagany sample checkpoint,
2. jej Brier będzie lepszy od de-vigged market na sparowanej próbce,
3. na shared matches będzie lepsza od v1,
4. poprawa nie będzie wynikała wyłącznie z kilku pojedynczych upsetów,
5. calibration buckets nie ujawnią poważnej systematycznej overconfidence / underconfidence,
6. jeśli liczba BET snapshots osiągnie odpowiedni próg — CLV nie będzie negatywne,
7. nie będzie istotnych problemów data-quality.

Samo:

`więcej trafionych picków`

nie wystarcza.

Samo:

`dodatni P&L`

nie wystarcza.

---

# 25. Freeze v2

Przed pierwszą shadow prediction musi powstać jednoznaczna wersja:

`METHOD_V2.md`

lub równoważna zamrożona sekcja Playbooka.

Freeze powinien zawierać:

- definicję inputs,
- dokładny fresh-form calculation,
- okna czasu,
- recency decay,
- roster rules,
- sposób anchorowania do market,
- limit korekty probability,
- zasady exceptional adjustment,
- BET/PASS rules,
- wszystkie wymagane pola ledgeru,
- zasady oceny,
- promotion criteria.

Następnie należy zapisać:

- datę freeze,
- commit SHA,
- pierwszy event / match należący do v2 sample.

---

# 26. Zmiany po freeze

Po rozpoczęciu zbierania v2 nie wolno zmieniać zasad v2 i dalej wrzucać wyników do tej samej próbki.

Każda zmiana wpływająca na probability wymaga nowej wersji.

Przykładowa konwencja:

- `v2`
- `v2.1`
- `v3`

Każda taka wersja rozpoczyna własną próbkę.

Kosmetyczne zmiany raportowania nie wymagają bumpu.

---

# 27. Czego agentowi NIE wolno robić

Agent nie może samodzielnie:

- przełączyć projektu z v1 na v2,
- używać v2 do realnego BET zanim zostanie promowane,
- zmieniać parametrów fresh-form po zobaczeniu wyników,
- backtestować EWC i na tej podstawie dobierać najlepsze wagi,
- mieszać v1 i v2 w jednej statystyce Brier,
- liczyć checkpointu wspólnie dla agentów,
- liczyć checkpointu wspólnie dla wersji,
- zmieniać market snapshot między v1 i v2 w paired test,
- przedstawiać shadow P&L jako realny P&L projektu,
- uznać v2 za lepsze na podstawie kilku spektakularnych dywergencji.

---

# 28. Otwarte elementy przed freeze

Na obecnym etapie **nie są jeszcze zdefiniowane** i wymagają dalszej pracy:

1. dokładna matematyczna definicja fresh-form signal,
2. dokładna funkcja recency decay,
3. dokładne zasady current-roster weighting,
4. sposób ilościowego uwzględnienia opponent quality,
5. maksymalna normalna korekta względem market anchor,
6. warunki przekroczenia tego limitu,
7. minimalna liczba świeżych obserwacji potrzebnych do silnej korekty,
8. finalna definicja theoretical BET/PASS v2,
9. dokładne promotion criteria wraz z minimalnym paired sample.

Dopóki te elementy nie są zapisane i zamrożone:

**v2 NIE istnieje jako aktywna ani testowa metoda.**

Istnieje wyłącznie jako projekt.

---

# 29. Docelowy lifecycle projektu

```text
v1 ACTIVE
   │
   ├── dalsze zbieranie do checkpointu
   │
   └── obserwacje → hipotezy dla v2

PRE-V2 DESIGN
   │
   └── definicja wszystkich parametrów

V2 FREEZE
   │
   ├── v1 ACTIVE
   └── v2 SHADOW

PAIRED COLLECTION
   │
   ├── v1 vs market
   ├── v2 vs market
   └── v2 vs v1 on shared matches

V1 CHECKPOINT
   │
   ├── validated → może zostać active
   └── not validated → real betting stop / paper baseline

V2 CHECKPOINT
   │
   ├── not validated → pozostaje research / revise
   └── validated + beats v1 → candidate for promotion

PROMOTION DECISION
   │
   └── v2 SHADOW → v2 ACTIVE
```

---

# 30. Najważniejsza zasada dla przyszłych agentów

Celem Edge nie jest stworzenie v2, które wygląda lepiej od v1 na starych danych.

Celem jest stworzenie **z góry określonej alternatywy dla v1**, a następnie pozwolenie nowym meczom odpowiedzieć na pytanie:

> Czy v2 rzeczywiście przewiduje lepiej od rynku i lepiej od v1?

Jeżeli odpowiedź będzie „nie”, v2 zostaje odrzucone.

To jest poprawny wynik eksperymentu.

---

## Aktualny następny krok

Nie uruchamiać jeszcze v2.

Kontynuować v1.

Równolegle dopracować `PRE-V2.md`, koncentrując się teraz wyłącznie na otwartych elementach z sekcji 28.

Gdy wszystkie będą jednoznacznie zdefiniowane:

1. utworzyć finalną specyfikację metody,
2. zamrozić ją w Git,
3. zapisać commit SHA,
4. wybrać pierwszy kwalifikujący się mecz po freeze,
5. rozpocząć `v2 shadow`.