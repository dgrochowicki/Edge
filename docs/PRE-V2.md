# Pre-v2 — notatnik roboczy do definicji metody v2

**Status:** ROBOCZY. To NIE jest aktywna metoda. Wszystkie predykcje wciąż niosą `method_version: v1`.
Ten dokument zbiera hipotezy do przyszłego v2. Nie zmienia żadnej reguły v1 i nie uruchamia v2.
Dokumentem wiążącym pozostaje `PLAYBOOK.md` (v1). v2 powstaje z tego pliku dopiero jako osobna, świadoma zmiana.

**Zasada nadrzędna (z PLAYBOOK.md → Method versioning):**
v2 projektujemy na papierze *zanim* zobaczymy, jak wypadłby na danych EWC. Definiowanie reguł po obejrzeniu, które BET-y wygrały, to overfitting — dopasowanie do szumu rozegranych już meczów. EWC jest zamrożoną próbką v1; służy do postawienia hipotez, nie do ich strojenia. v2 dostanie własną, świeżą próbkę 150/50 i będzie oceniany wyłącznie na niej.

---

## 1. Po co v2 — jedno zdanie

EWC pokazał konkretny obszar, w którym agenci różnią się **informacyjnie**: jak szybko ufać świeżej zmianie siły zespołu względem zakotwiczenia w ratingu / H2H / cenie rynkowej. To jest materiał na v2.

## 2. Główna hipoteza: mierzalny sygnał świeżej formy (fresh-form signal)

**Obserwacja z v1 (opisowa, EWC):** claude systematycznie niedoważał sygnał formy underdoga i zakotwiczał się w rankingu/renomie/H2H. Trzy widoczne dywergencje:

| Mecz | Strona agresywna | Wynik | Lekcja |
|------|------------------|-------|--------|
| Spirit vs Vitality | gpt (Spirit @2.20) | Spirit 2:1 | świeża forma > H2H 11-4 |
| FUT vs MOUZ | gpt (FUT @2.29) | FUT 2:0 | świeża forma / matchup > renoma |
| Legacy vs Spirit | gpt (Legacy @3.50) | Spirit 2:0 | **pułapka nadkorekty** — świeży run przeważony |

**Czego NIE robimy:** nie wpisujemy reguły „gorący underdog = podnieś probability". Legacy pokazuje drugą stronę tej samej monety — trzy mecze to trzy anegdoty, nie sygnał. claude świadomie opisał ryzyko nadkorekty przy Legacy i miał rację.

**Co robimy:** definiujemy *mierzalny* sygnał świeżej formy i testujemy, czy FUT/Spirit/Legacy były przejawem wspólnego, kwantyfikowalnego sygnału, czy trzema głośnymi historiami. Kandydaci na komponenty sygnału (do operacjonalizacji):

- jakość ostatnich rywali (nie sam wynik, ale przeciw komu),
- wyniki po zmianie składu / roszadzie rostera (osobno licząc mecze przed i po),
- recency decay — ważenie meczów świeżością, z jawnym parametrem rozpadu,
- wyniki map vs top-tier (czy zespół wygrywa mapy z faworytami, nie tylko całe mecze),
- stabilność rosteru (czas gry obecnego składu razem, standy-iny, brak trenera).

**Kryterium sukcesu hipotezy:** sygnał musi być policzalny z góry, bez wiedzy o wyniku, i musi poprawiać Brier vs de-vigged market na świeżej próbce v2 — nie na EWC.

## 3. Powiązana kwestia: próg konwersji probability → BET

v1 (claude) trzyma wycenę blisko de-vigged market, więc przy marży STS ~8% niemal wszystko kończy się PASS. Otwarte pytanie: czy to optymalna ostrożność, czy zbyt mocne zakotwiczenie do rynku. **Nie rozstrzygać Brierem** — rozstrzygną CLV i większa próbka BET. v2 może (ale nie musi) rewidować próg konwersji; decyzja czeka na dane CLV, nie na tę notatkę.

## 4. Benchmark, względem którego oceniamy v2

Nie 0.25. **Brier de-vigged market na sparowanej próbce.** v2 „dodaje informację" tylko jeśli bije ten benchmark na własnych świeżych 150 (per agent). To wprost z PLAYBOOK.md → Failure conditions.

## 5. Czego v2 NA PEWNO nie robi na tym etapie

- Nie zmienia v1 wstecz. EWC zostaje zamrożone jako próbka v1.
- Nie uruchamia się, dopóki definicja nie jest zamknięta na papierze.
- Nie miesza próbek — pierwszy wpis `method_version: v2` startuje licznik od zera (per agent × version).
- Nie jest strojony pod wyniki EWC.

## 6. Otwarte pytania do rozstrzygnięcia przed zamknięciem definicji

- Jak dokładnie operacjonalizować każdy komponent z sekcji 2 (definicje, okna czasowe, parametry).
- Czy fresh-form signal wchodzi jako korekta probability, czy jako osobny gate na BET.
- Czy v2 dotyka progu konwersji z sekcji 3, czy zostawia go v1-owym (czeka na CLV).
- Jak dashboard rozdziela metryki v1 vs v2 (Calibration Lab liczy per method_version — placeholder „v1" już dyskutowany).
- Zdarzenie wyzwalające bump: który turniej tier-1 jest pierwszą świeżą próbką v2.

---

## Następny krok

Zbierać dane dalej pod v1 przez najbliższy tier-1 (EWC zamrożone). Równolegle rozwijać sekcję 2 tego pliku do pełnych, policzalnych definicji. Gdy definicje są zamknięte i otwarte pytania z sekcji 6 rozstrzygnięte — przenieść zatwierdzoną metodę do PLAYBOOK.md jako v2, odnotować bump w PROJECT_MEMORY (co, dlaczego, jaki werdykt go wyzwolił) i dopiero wtedy pierwszy wpis `method_version: v2`.
