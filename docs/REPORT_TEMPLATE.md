# Edge Daily Report Template

Current version: v1.5 (2026-07-22)
Status: obowiązuje obu agentów (claude, gpt)

Każdy raport dzienny ma nazwę `reports/RRRR-MM-DD-{claude|gpt}.md` (małe litery) i składa się z poniższych sekcji w tej kolejności. Sekcję 5 pomijamy tylko wtedy, gdy nie ma treści. Raport jest dokumentem niezmiennym: opisuje wyłącznie stan sprzed meczów i po publikacji nie wolno go edytować. Rozliczenia wyników nie trafiają do raportów — jedynym miejscem rozliczeń jest data/bets.json (księga główna), a ich widokiem dashboard. Wartości liczbowe: kursy z dwoma miejscami po przecinku, value z jednym, probability z czterema.

**Format Value i Ryzyko (wymagany, nie tylko przykładowy — dashboard koloruje po tym wzorcu):**
- `Value` zawsze ze znakiem, nawet przy zerze: `+5.6%`, `-4.1%`, `+0.0%`. Bez znaku dashboard nie rozpozna, czy kolorować na zielono czy czerwono.
- `Ryzyko` wyłącznie jedną z wartości: `Niskie`, `Średnie`, `Wysokie`, `Średnio-wysokie`, `Bardzo wysokie` (dowolna wielkość liter). Inne sformułowanie (np. "Umiarkowane", "High") nie zostanie pokolorowane.

---

# Edge Daily Report — RRRR-MM-DD

**Agent:** claude | gpt
**Godzina analizy:** HH:MM
**Źródło kalendarza:** (np. wyszukiwanie web + weryfikacja w ofercie STS)
**Źródło kursów:** kursy STS podane przez użytkownika o HH:MM

## 1. Mecze dnia

Jedna tabela z meczami po pełnej analizie — kolumny jak niżej, decyzja wyłącznie **BET** albo **PASS**, stawka w jednostkach (u) przy BET, myślnik przy PASS:

| Godz. | Mecz | Gram na | Kurs STS | Fair | Value | Ryzyko | Decyzja | Pewność | Stawka |
|---:|---|---|---:|---:|---:|---|---|---|---:|
| 12:30 | A vs B | B ML | 1.70 | 1.61 | +5.6% | Średnie | **PASS** | 6/10 | — |
| 14:00 | G vs H | H ML | 1.95 | 2.10 | +7.7% | Średnie | **BET** | 7/10 | 1u |

Pod tabelą krótka lista meczów odsianych na filtrze (bez wyceny) — jedna linia na mecz, z powodem:

**Poza analizą:** 16:00 C vs D (CCT EU) — tier 3, akademia · 10:00 E vs F — poza ofertą STS

## 2. Analizy

Jeden blok na każdy mecz z decyzją BET lub PASS (odrzuconych nie analizujemy):

### A vs B

**Przewidywany zwycięzca:** B
**Kursy STS:** A 2.04 / B 1.70 · **Fair kurs B:** 1.61 · **Value:** +5.6% · **Ryzyko:** średnie

Uzasadnienie: 2–5 zdań — forma, składy, kontekst meczu, główne czynniki i główne niepewności. Bez narracji ponad to, co wiadomo; braki danych nazywamy wprost.

**Decyzja:** BET / PASS (z jednozdaniowym powodem, jeśli decyzja nie wynika wprost z value — np. próg kursu wejścia, jakość danych).

## 3. Podsumowanie dnia

**X BET / Y PASS.** Jedno–trzy zdania: co było najbliżej zakładu i dlaczego ostatecznie tak, a nie inaczej. Dzień bez kwalifikujących się meczów opisujemy jako „NO QUALIFYING MATCHES" — to pełnoprawny wynik.

## 4. Wpisy do dziennika (Calibration & CLV Protocol)

Blok JSON ze wszystkimi wpisami z sekcji 2 (BET **i** PASS). Zasady:

- `id`: `P-RRRR-MM-DD-C1` (claude) / `P-RRRR-MM-DD-G1` (gpt), numeracja per agent per dzień
- `agent`: `"claude"` / `"gpt"` — pole obowiązkowe
- `report`: ścieżka z sufiksem agenta, np. `"reports/2026-07-20-gpt.md"`
- `odds_timestamp`: faktyczny czas odczytu kursów (godzina podania ich przez użytkownika), nie czas raportu ani wartość okrągła z założenia
- `estimated_probability` = 1 / fair_odds (4 miejsca), `market_odds_opponent` obowiązkowe, `closing_odds: null`, `result: "pending"`
- `method_version: "v1"` — wersja metody szacowania fair kursów. Bumpuje się tylko przy zmianie sposobu liczenia (patrz „Method versioning" w PLAYBOOK.md); raport nigdy nie zmienia wersji z własnej inicjatywy.
- Meczów odrzuconych na filtrze NIE logujemy

Agenci nie modyfikują `data/bets.json` bezpośrednio — plik ma jednego opiekuna, który scala, waliduje i commituje wpisy z raportów.

## 5. Zadania otwarte

Krótka lista rzeczy wiszących: predykcje czekające na rozliczenie w bets.json (sama lista ID, bez wyników), snapshoty closing do zrobienia przed meczami BET, niespójności do wyjaśnienia.

---

## Zasady ogólne

- Format jest wspólny; różnice między agentami mają być widoczne w treści analiz, nie w strukturze dokumentu.
- Wszystkie reguły decyzyjne (progi value, próg kursu wejścia, kryteria tier) muszą mieć źródło w PLAYBOOK.md — raport może się na nie powoływać, ale nie może ich tworzyć.
- Braki danych zapisujemy jako braki („STS nie oferuje", „brak odczytu"), nigdy jako wartości założone.
