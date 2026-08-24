# Edge — metoda wyceny (ściąga z przykładami)

Dokument do nauki i przypominania. Tłumaczy **jak** liczymy value, krok po kroku, z przykładami z prawdziwych meczów. Jak zapomnisz za miesiąc — wróć tu.

Cała metoda w jednym zdaniu: **nie obstawiasz drużyny, obstawiasz różnicę między swoją oceną a ceną bukmachera.** Ta sama drużyna może być świetnym zakładem przy jednym kursie i śmieciem przy innym.

---

## Trzy kroki, i tyle

### KROK 1 — oceń prawdopodobieństwo (p_est)

Ile procent szans dajesz drużynie? To jest **osąd, nie wzór.** Zaczynasz od tego, co mówi rynek (de-vig, patrz niżej), a potem pytasz: „czy widzę konkretny powód, żeby odejść od rynku?".

- Nie widzisz powodu → zostań blisko rynku.
- Widzisz twardy, zaobserwowany powód (map pool, przebudowany skład, kontuzja, forma na LAN) → przesuń o kilka punktów.

**Ważne: ta liczba jest z natury nieprecyzyjna.** „0.47" naprawdę znaczy „gdzieś 45–49%". Dlatego gramy tylko przy DUŻEJ przewadze — patrz krok 3.

### KROK 2 — zamień ocenę na fair odds (uczciwy kurs)

```
fair = 1 / p_est
```

To jest kurs, który *dokładnie* odpowiada Twojej ocenie — ani zysku, ani straty na dłuższą metę.

Przykład: oceniasz drużynę na 40% → fair = 1 / 0,40 = **2,50**.

### KROK 3 — porównaj fair z kursem bukmachera = value

```
value = (kurs_bukmachera / fair - 1) × 100%
```

- **value dodatnie** → bukmacher płaci więcej, niż uważasz za uczciwe → potencjalny BET
- **value ujemne** → kurs za krótki → PASS
- **value dodatnie ale małe (< ~5–8%)** → PASS (ginie w szumie Twojej niepewności)

---

## De-vig — skąd wiadomo, co „myśli rynek"

Bukmacher dolicza sobie marżę, więc kursy NIE sumują się do 100% prawdopodobieństwa. Żeby zobaczyć, co rynek naprawdę szacuje, zdejmujesz marżę:

```
implikowane surowe = 1 / kurs
de-vig strony A = (1/kurs_A) / (1/kurs_A + 1/kurs_B)
```

Przykład (FaZe 1.57 / MongolZ 2.41):
- surowe FaZe = 1/1.57 = 0,637
- surowe MongolZ = 1/2.41 = 0,415
- suma = 1,052 → marża bukmachera = 5,2%
- de-vig FaZe = 0,637 / 1,052 = **0,606** (rynek daje FaZe ~61%)
- de-vig MongolZ = 0,415 / 1,052 = **0,394** (rynek daje MongolZ ~39%)

De-vig to Twój **punkt wyjścia** w kroku 1. Odchodzisz od niego tylko z konkretnym powodem.

---

## Pełny przykład od zera — paiN vs Astralis (31.07)

**Kursy STS:** paiN 2,16 / Astralis 1,70

**De-vig:**
- surowe paiN = 1/2,16 = 0,463
- surowe Astralis = 1/1,70 = 0,588
- suma = 1,051 (marża 5,1%)
- de-vig paiN = 0,463/1,051 = **0,440** → rynek daje paiN 44%

**Krok 1 — ocena.** paiN ma tezę map-poolową (biguzera: „Astralis picuje Ancient, my nie gramy Ancient"). Konkretny powód → podnoszę paiN ponad rynek. Ale paiN jest #29, słabsze klasowo → nie za dużo. Ocena: **paiN 47%** (rynek 44% + ~3 pkt za map pool).

**Krok 2 — fair.** fair = 1/0,47 = **2,13**

**Krok 3 — value.** (2,16 / 2,13 − 1) × 100% = **+1,5%**

**Decyzja: PASS.** Value dodatnie, ale malutkie. +1,5% ginie w szumie mojej niepewności (paiN mogłoby być 0,45 zamiast 0,47 — wtedy value znika). Za mało, żeby grać.

---

## Ta sama drużyna, inny kurs — dlaczego to kluczowe

Weź paiN wyceniony na 47% (fair 2,13). Zobacz, jak decyzja zależy WYŁĄCZNIE od kursu:

| Kurs STS na paiN | value | decyzja |
|---:|---:|---|
| 2,16 | +1,5% | PASS (za mało) |
| 2,40 | +12,7% | BET (mocne) |
| 2,60 | +22,1% | BET (bardzo mocne) |
| 2,00 | −6,1% | PASS (kurs za krótki) |

**Ta sama ocena, ta sama drużyna, ten sam mecz — cztery różne decyzje.** Bo nie obstawiasz paiN. Obstawiasz to, czy cena jest za wysoka względem Twojej oceny.

To jest różnica między kibicem a typerem. Kibic pyta „kto wygra?". Typer pyta „jaka jest cena i czy za wysoka?".

---

## Kiedy BET, kiedy PASS — próg

Nie ma sztywnej granicy, ale rozsądna zasada:

- **value > ~8–10% + konkretny zaobserwowany powód** → BET
- **value 0–8%** → PASS (przewaga za mała, żeby przebić szum oceny)
- **value ujemne** → PASS zawsze

Dlaczego próg jest wysoki: bo Twoja ocena p_est jest niepewna o kilka punktów. Jeśli przewaga (value) jest mniejsza niż ta niepewność, to nie wiesz, czy value w ogóle istnieje, czy tylko Ci się wydaje. Grasz tylko wtedy, gdy przewaga jest tak duża, że przebija Twój własny błąd.

Przykłady z tego tygodnia:
- **3DMAX @4,84 (+11,3%)** → BET. Duża przewaga + konkretny powód (świadomy wybór map-poolowy). Przegrał, ale był dobrym zakładem.
- **paiN @2,16 (+1,5%)** → PASS. Ta sama struktura (underdog z tezą mapową), ale za cienkie.

**Dobry zakład ≠ wygrany zakład.** 3DMAX był dobry, choć przegrał — bo miałeś realną przewagę. Underdog @4,84 przegrywa 4 na 5 razy; to wliczone w cenę. Oceniamy jakość decyzji, nie wynik pojedynczego meczu.

---

## Skąd bierze się p_est — uczciwie

To najważniejsze i najtrudniejsze. p_est NIE wychodzi ze wzoru. To wykształcony osąd, oparty na trzech źródłach (w kolejności wiarygodności):

1. **Rynek (de-vig)** — punkt wyjścia. Zbiorcza mądrość tysięcy obstawiających, bardzo trudna do pobicia. Domyślnie zostajesz blisko.
2. **Konkretne zaobserwowane sygnały** — powód, by odejść od rynku: map pool, przebudowany skład, forma LAN vs online, kontuzja, nowy/niedoświadczony gracz na kluczowej roli (np. AWP). To jakościowe, ważysz w głowie, przesuwasz o kilka punktów.
3. **Baza wiedzy** — forma, H2H, ranking, styl. Tło kształtujące intuicję.

Uwaga na pułapkę: **odchodź od rynku tylko z twardym, zaobserwowanym powodem** — nie z przeczuciem na gorąco w trakcie meczu. „Widzę szansę" podczas oglądania to emocje, nie analiza. Prawdziwa przewaga jest policzona na zimno, przed meczem.

---

## Szybka checklista przy meczu

1. Weź kursy STS obu stron.
2. Policz de-vig → co myśli rynek.
3. Oceń p_est: zacznij od de-vig, przesuń tylko z konkretnym powodem.
4. fair = 1 / p_est.
5. value = (kurs / fair − 1) × 100%.
6. value duże (> ~8–10%) + powód → BET. Inaczej PASS.
7. Sprawdź: czy p_est zgadza się z 1/fair (spójność).

To wszystko. Reszta to wprawa w kroku 3 — ocenie prawdopodobieństwa — a to przychodzi z oglądania meczów i znajomości drużyn, którą już masz.
