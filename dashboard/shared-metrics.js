// Shared across all pages (index.html, dashboard/research.html,
// dashboard/reports.html, dashboard/logs.html): pure aggregation helpers,
// the Calibration Lab apparatus, and the coupon-detail modal. Load this
// script before any page-specific script that calls into it.

function fmt(n, d = 2) { return Number(n).toFixed(d); }

// Report links differ depending on whether the current page lives at the
// repo root (index.html) or under dashboard/ (research.html, reports.html,
// logs.html) -- same detection approach as data.js's local-fetch fallback.
function reportsHref(date) {
    const base = location.pathname.includes('/dashboard/') ? 'reports.html' : 'dashboard/reports.html';
    return `${base}?date=${date}`;
}

// ===== Selection-level metrics engine =====
// Pure functions, no DOM/rendering side effects. All aggregation is
// computed live from betsData; nothing here hardcodes a count.

function normalizeMatchKey(date, match) {
    return `${date}|${(match || '').toLowerCase().trim().replace(/\s+/g, ' ')}`;
}

// Flattens every coupon selection into one list, joined with its prediction's
// `game` via (date, match). Match text is NOT always consistent between the
// bookmaker-sourced coupon selections and the predictions log (short names,
// reversed team order, aliases) — normalized comparison catches simple
// whitespace/case drift, but a genuine mismatch is left as game: null rather
// than guessed. null is a valid, expected value here.
function getAllSelections(betsData) {
    const predByKey = {};
    (betsData.predictions || []).forEach(p => {
        const key = normalizeMatchKey(p.date, p.match);
        if (!predByKey[key]) predByKey[key] = p;
    });

    const selections = [];
    (betsData.coupons || []).forEach(c => {
        (c.selections || []).forEach(s => {
            const pred = predByKey[normalizeMatchKey(c.date, s.match)];
            selections.push({
                couponId: c.id,
                couponDate: c.date,
                couponStatus: c.status,
                match: s.match,
                market: s.market,
                pick: s.pick,
                odds: s.odds,
                result: s.result,
                notes: s.notes,
                game: pred ? (pred.game || null) : null
            });
        });
    });
    return selections;
}

function selectionStats(selections) {
    const total = selections.length;
    const won = selections.filter(s => s.result === 'won').length;
    const lost = selections.filter(s => s.result === 'lost').length;
    const voided = selections.filter(s => s.result === 'void').length;
    const decided = won + lost;
    return { total, won, lost, void: voided, hitRate: decided > 0 ? won / decided : null };
}

const ODDS_BUCKETS = [
    { label: '< 1.30', min: 1, max: 1.30 },
    { label: '1.30–1.59', min: 1.30, max: 1.60 },
    { label: '1.60–1.99', min: 1.60, max: 2.00 },
    { label: '≥ 2.00', min: 2.00, max: Infinity }
];

function selectionsByOddsBucket(selections) {
    return ODDS_BUCKETS.map(b => {
        const inBucket = selections.filter(s => typeof s.odds === 'number' && s.odds >= b.min && s.odds < b.max);
        const stats = selectionStats(inBucket);
        const avgOdds = inBucket.length ? inBucket.reduce((sum, s) => sum + s.odds, 0) / inBucket.length : null;
        return { label: b.label, n: stats.total, won: stats.won, lost: stats.lost, hitRate: stats.hitRate, avgOdds };
    });
}

function groupSelectionsBy(selections, keyFn) {
    const groups = {};
    selections.forEach(s => {
        const key = keyFn(s);
        (groups[key] = groups[key] || []).push(s);
    });
    return Object.keys(groups).map(key => {
        const stats = selectionStats(groups[key]);
        return { label: key, n: stats.total, won: stats.won, lost: stats.lost, hitRate: stats.hitRate };
    });
}

function selectionsByGame(selections) { return groupSelectionsBy(selections, s => s.game || 'unknown'); }
function selectionsByMarket(selections) { return groupSelectionsBy(selections, s => s.market || 'unknown'); }

// BET vs PASS record. Interpretive note: a high PASS "hit rate" (the picked
// side would have won) is NOT evidence of a bad decision -- PASS is a verdict
// about price (no value at the offered odds), not about who wins. Treat this
// as contextual information only; see the Discipline Monitor's value-aware
// breakdown for the metric that actually evaluates the PASS threshold.
// TODO(agent-filter): once predictions carry multiple agents in volume, allow
// filtering decisionStats by betsData.predictions[].agent.
function decisionStats(predictions) {
    const stat = (list) => {
        const won = list.filter(p => p.result === 'won').length;
        const lost = list.filter(p => p.result === 'lost').length;
        const voided = list.filter(p => p.result === 'void').length;
        const pending = list.filter(p => p.result === 'pending').length;
        const decided = won + lost;
        return { n: list.length, won, lost, void: voided, pending, hitRate: decided > 0 ? won / decided : null };
    };
    return {
        bet: stat(predictions.filter(p => p.decision === 'BET')),
        pass: stat(predictions.filter(p => p.decision === 'PASS'))
    };
}

// Hypothetical result of staking 1u on every observed_passes entry that has
// a recorded odds (i.e. "what if we'd bet the ones we watched but skipped").
function observedPassStats(observedPasses, unitStake) {
    const withOdds = (observedPasses || []).filter(o => o.odds);
    const hypotheticalNet = withOdds.reduce((sum, o) => {
        return sum + (o.result === 'won' ? unitStake * (o.odds - 1) : -unitStake);
    }, 0);
    return { n: withOdds.length, hypotheticalNet };
}

function couponsByLegCount(coupons) {
    const groups = {};
    (coupons || []).forEach(c => {
        const legs = (c.selections || []).length;
        const g = groups[legs] = groups[legs] || { legs, coupons: 0, won: 0, lost: 0 };
        g.coupons++;
        if (c.status === 'won') g.won++;
        if (c.status === 'lost') g.lost++;
    });
    return Object.keys(groups).map(k => groups[k]).sort((a, b) => a.legs - b.legs);
}

// Splits coupons by how the bet came about: Edge's own BET recommendation
// vs. a bet the user placed on their own judgement. Coupons with a missing
// or unrecognized `source` are kept as their own "unknown" group rather
// than dropped, so every coupon is still accounted for somewhere.
function couponsBySource(coupons) {
    const groupOf = c => c.source === 'official_recommendation' ? 'edge'
        : c.source === 'user_bet' ? 'own'
        : 'unknown';
    const buckets = { edge: [], own: [], unknown: [] };
    (coupons || []).forEach(c => buckets[groupOf(c)].push(c));

    const agg = group => {
        const won = group.filter(c => c.status === 'won').length;
        const lost = group.filter(c => c.status === 'lost').length;
        const void_ = group.filter(c => c.status === 'void').length;
        const pending = group.filter(c => c.status === 'pending').length;
        const staked = group.reduce((s, c) => s + (c.stake_pln || 0), 0);
        const net = group.reduce((s, c) => s + (c.net_result_pln || 0), 0);
        return {
            n: group.length, won, lost, void: void_, pending, staked, net,
            roi: staked > 0 ? net / staked : null,
            hitRate: (won + lost) > 0 ? won / (won + lost) : null
        };
    };

    return { edge: agg(buckets.edge), own: agg(buckets.own), unknown: agg(buckets.unknown) };
}

// ===== Calibration Lab v2 =====
// Per protocol: Brier vs market only on the paired sample; verdicts only at
// pre-registered checkpoints (150 settled paired for Brier, 50 BET closing
// snapshots for CLV); CLV progress independent of settlement count;
// basic record validation; historical backfill surfaced, not hidden.

const CAL_T = { PRELIM: 50, EMERG: 100, VALID: 150, CLV_VALID: 50 };

function devig(oddsPick, oddsOpp) {
    if (!oddsPick || !oddsOpp) return null;
    const a = 1 / oddsPick, b = 1 / oddsOpp;
    return a / (a + b);
}

function validatePredictions(preds) {
    const seen = {}, invalid = [];
    preds.forEach(p => {
        const issues = [];
        if (!p.id) issues.push('missing id');
        else if (seen[p.id]) issues.push('duplicate id'); else seen[p.id] = 1;
        if (!['BET', 'PASS'].includes(p.decision)) issues.push('bad decision');
        if (!['won', 'lost', 'void', 'pending'].includes(p.result)) issues.push('bad result');
        if (p.estimated_probability != null && (p.estimated_probability <= 0 || p.estimated_probability >= 1)) issues.push('probability out of range');
        ['fair_odds', 'market_odds_at_analysis', 'market_odds_opponent', 'closing_odds'].forEach(k => {
            if (p[k] != null && p[k] <= 1) issues.push(k + ' <= 1');
        });
        if (p.estimated_probability != null && p.fair_odds != null &&
            Math.abs(p.estimated_probability - 1 / p.fair_odds) > 0.001) issues.push('probability != 1/fair_odds');
        if (issues.length) invalid.push({ id: p.id || '(no id)', issues });
    });
    return invalid;
}

function calibStage(n) {
    if (n < CAL_T.PRELIM) return { key: 'collection', label: 'Collection' };
    if (n < CAL_T.EMERG) return { key: 'prelim', label: 'Preliminary signal' };
    if (n < CAL_T.VALID) return { key: 'emerg', label: 'Emerging pattern' };
    return { key: 'valid', label: 'Validation checkpoint' };
}

const CALIB_INFO = {
    logged: ['Logged', 'Liczba wszystkich predykcji zapisanych w dzienniku (data/bets.json → predictions) — każdy w pełni przeanalizowany mecz, zarówno BET, jak i PASS. Logujemy też PASS-y, bo bez nich nie da się zmierzyć, czy szacunki agenta są trafne (patrzylibyśmy tylko na wybrane rodzynki).'],
    settled: ['Settled', 'Ile predykcji ma już wpisany wynik meczu (typ wygrał albo przegrał). Dwa progi z protokołu: od 50 pokazujemy wstępne metryki (preliminary), od 150 działa checkpoint walidacji dla Brier score. Poniżej 50 nie liczymy nic — przy małej próbce nawet rzut monetą wygląda raz jak geniusz, raz jak katastrofa.'],
    paired: ['Paired baseline', 'Liczba rozliczonych predykcji, które mają komplet: szacunek agenta ORAZ kursy na obie strony rynku. Tylko na tej wspólnej próbie wolno porównywać Brier agenta z rynkiem — porównanie na różnych zbiorach meczów byłoby metodologicznie nieważne. Dlatego pole market_odds_opponent jest obowiązkowe w nowych wpisach.'],
    snapshots: ['BET closing snapshots', 'Ile zakładów (BET) ma zapisany kurs tuż przed meczem. To licznik niezależny od rozliczeń — kurs zamknięcia znamy przed wynikiem. Od 50 snapshotów działa checkpoint walidacji CLV. To najszybszy sposób sprawdzenia, czy typy wyprzedzają rynek.'],
    quality: ['Data quality', 'Znane braki w danych: wpisy historyczne (backfill z raportów) nie mają kursu przeciwnika, dokładnego timestampu ani kursu zamknięcia — bo tych danych nie zapisano na czas i nie wolno ich odtwarzać z pamięci. Braki są oznaczone, nie ukryte: wpisy z flagami są wyłączane z metryk, których nie mogą uczciwie zasilić.'],
    brier: ['Brier score', 'Kara za pomyłki ważona pewnością siebie: (prognoza − wynik)². Dał 80% i wygrali → kara 0.04. Dał 80% i przegrali → kara 0.64. Średnia z kar = Brier; im niżej, tym lepiej. Punkt odniesienia: ktoś, kto zawsze mówi 50/50, ma równo 0.25. Porównanie z rynkiem liczone jest wyłącznie na próbie paired, a werdykt zapada dopiero przy 150 rozliczonych.'],
    buckets: ['Kalibracja', 'Czy „70%" znaczy 70%? Bierzemy wszystkie mecze z szacunkiem 70–80% i sprawdzamy, ile faktycznie wygrało. Kolumna gap pokazuje rozjazd: systematycznie ujemny = agent jest zbyt pewny siebie, co produkuje fałszywe „value" — kurs wygląda na okazję tylko dlatego, że szacunek jest napompowany.'],
    clv: ['CLV — Closing Line Value', 'Porównanie kursu wziętego rano z kursem tuż przed meczem: (kurs rano / kurs zamknięcia − 1). Linia zamknięcia to najlepiej poinformowana cena na rynku. Systematycznie dodatnie CLV = widzisz wartość, zanim rynek się skoryguje — najsilniejszy wczesny dowód przewagi, widoczny po ~50 zakładach. Ujemne CLV przy wygranych = wygrywasz szczęściem, nie metodą.'],
    stage: ['Etapy', 'Collection (0–49 rozliczonych): tylko zbieranie. Preliminary (50–99): wstępne sygnały, zero wniosków. Emerging (100–149): wzorce warte rozmowy. Validation checkpoint (150+): działa zapisany z góry warunek porażki dla Brier. Osobno: checkpoint CLV przy 50 closing snapshotach na BET-ach. Progi zapisano zanim znamy wyniki — żeby nie przesuwać bramek.'],
    selHitRate: ['Selection Hit Rate', 'Jaki procent pojedynczych typów (nóg) trafiasz. Liczone po nogach, nie po całych kuponach: kupon z 3 zdarzeń to 3 osobne nogi. Void nie liczy się do mianownika. To surowa trafność — mówi, jak często masz rację, ale NIE czy zarabiasz (do tego trzeba value i kursów).'],
    avgOdds: ['Avg Leg Odds', 'Średni kurs Twoich pojedynczych typów. Niski (bliżej 1.00) = grasz głównie faworytów. Wysoki = częściej sięgasz po niepewniaki. Sam w sobie nic nie ocenia — służy do czytania tabeli „wg zakresu kursu" obok: gdzie faktycznie masz wyczucie.'],
    bestWorst: ['Best / Worst Bucket', 'Automatyczne wskazanie przedziału kursu z najwyższą i najniższą trafnością (przy min. 2 zakładach). Skrót z tabeli obok: od razu widzisz swój najmocniejszy i najsłabszy rodzaj zakładu.'],
    oddsRange: ['Wg zakresu kursu', 'Twoje trafienia rozbite na przedziały kursu. Kluczowa diagnoza: może faworytów (kurs <1.30) trafiasz w 80%, ale niepewniaki (kurs ≥2.00) tylko w 30%. Pokazuje, w którym typie zakładów masz oko, a gdzie zgadujesz.'],
    byMarketTbl: ['Wg rynku', 'Trafienia w podziale na typ zakładu: zwycięzca meczu (moneyline), liczba map (over/under), handicap. Na razie prawie wszystko to moneyline, więc tabela ma jeden wiersz — rozrośnie się, gdy zaczniesz grać różne rynki.'],
    betPass: ['BET / PASS', 'Ile razy postawiłeś (BET) vs ile odpuściłeś (PASS). Duża przewaga PASS-ów to NIE lenistwo — to dyscyplina: stawiamy tylko, gdy jest przewaga (value), a nie na każdy mecz.'],
    betRecord: ['BET record', 'Bilans zakładów, które faktycznie postawiłeś: ile wygranych, ile przegranych. Twój realny wynik na tym, na co zdecydowałeś się zagrać — w odróżnieniu od PASS-ów, których nie ruszałeś.'],
    passDiscipline: ['PASS discipline', 'Najczęściej mylona metryka. PASS to werdykt o CENIE (brak value), nie o zwycięzcy. Dlatego rozbijamy pasy na dwie grupy: „słuszne" (kurs był za niski — trafienie tu to NIE strata) i „potencjalnie stracone" (był dodatni value, a typ wygrał — dopiero TO oznacza przeoczoną okazję). Tylko druga grupa może uzasadniać poluzowanie ostrożności. Sama liczba „ile pasów trafiłoby" jest myląca i celowo jej nie pokazujemy.'],
    byGame: ['By Game', 'Te same metryki w podziale na grę: CS2, LoL, Dota 2. Pokazuje, w której grze masz najlepsze wyczucie. CS2 to rynek główny projektu.'],
    sourceEdge: ['Edge recommendations', 'Kupony zagrane zgodnie z rekomendacją z raportu — czyli takie, gdzie metoda Edge oznaczyła zakład jako BET i został on faktycznie postawiony. Ta grupa mierzy, ile realnie zarabia (lub traci) sama metoda.'],
    sourceOwn: ['Own bets', 'Zakłady zagrane z własnej decyzji, niezależnie od tego, co mówił raport — także na mecze oznaczone jako PASS. Ta grupa mierzy Twoje własne typowanie. Rozdzielenie obu grup pozwoli po czasie zobaczyć, które decyzje wychodzą lepiej — ale dopiero przy sensownej liczbie kuponów, nie po kilku.'],
    netResult: ['Net Result', 'Suma wygranych minus suma przegranych, po wszystkich kuponach. Realny wynik w PLN przy stawkach faktycznie postawionych — to liczba, która ostatecznie się liczy, niezależnie od tego, jak wyglądały poszczególne zakłady po drodze.'],
    roi: ['ROI', 'Net Result podzielony przez sumę stawek. Pokazuje zwrot względem tego, ile realnie zaryzykowano — dwa identyczne Net Result przy różnych stawkach dają bardzo różne ROI. Liczone przy stałych stawkach 1u, więc porównanie między kuponami jest uczciwe.'],
    streak: ['Streak', 'Najdłuższa aktualna seria wygranych albo przegranych kuponów pod rząd, licząc od najnowszego. Void nie przerywa serii. To ciekawostka o formie, nie sygnał — krótkie serie w małej próbce są w dużej mierze losowe.']
};

function calibInfo(key) {
    const info = CALIB_INFO[key];
    if (!info) return;
    let ov = document.getElementById('calibModal');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'calibModal';
        ov.className = 'calib-modal-overlay';
        ov.innerHTML = '<div class="calib-modal"><div class="calib-modal-head"><span id="calibModalTitle"></span><button class="calib-modal-x" onclick="document.getElementById(\'calibModal\').style.display=\'none\'">&times;</button></div><div id="calibModalBody"></div></div>';
        ov.addEventListener('click', e => { if (e.target === ov) ov.style.display = 'none'; });
        document.body.appendChild(ov);
    }
    document.getElementById('calibModalTitle').textContent = info[0];
    document.getElementById('calibModalBody').textContent = info[1];
    ov.style.display = 'flex';
}

// Collapsed by default until the preliminary threshold is reached; click to
// expand/collapse. No persistence across reloads, per spec.
let calibExpanded = false;

function toggleCalibrationLab() {
    calibExpanded = !calibExpanded;
    applyCalibLabVisibility();
}

function applyCalibLabVisibility() {
    const compact = document.getElementById('calibCompact');
    const body = document.getElementById('calibBody');
    const arrow = document.getElementById('calibArrow');
    if (!compact || !body) return;
    compact.style.display = calibExpanded ? 'none' : '';
    body.style.display = calibExpanded ? '' : 'none';
    if (arrow) arrow.textContent = calibExpanded ? '−' : '+';
}

function renderCalibCompact(stageLabel, settledCount, threshold) {
    const el = document.getElementById('calibCompact');
    if (!el) return;
    const pct = Math.min(100, settledCount / threshold * 100);
    el.innerHTML = `
        <div class="calib-compact click" onclick="toggleCalibrationLab()">
            <div class="outcome-bar"><div class="outcome-seg" style="width:${pct}%;background:var(--edge);"></div></div>
        </div>`;
}

function renderCalibration() {
    const el = document.getElementById('calibBody');
    if (!el) return;
    const preds = betsData.predictions || [];
    const countEl = document.getElementById('calibCount');

    if (preds.length === 0) {
        if (countEl) countEl.textContent = '0 logged';
        el.innerHTML = '<div class="calib-note">No predictions logged yet.</div>';
        renderCalibCompact('collection', 0, CAL_T.PRELIM);
        calibExpanded = false;
        applyCalibLabVisibility();
        return;
    }

    const invalid = validatePredictions(preds);
    const invalidIds = {};
    invalid.forEach(x => invalidIds[x.id] = 1);
    const valid = preds.filter(p => !invalidIds[p.id]);

    const settled = valid.filter(p => p.result === 'won' || p.result === 'lost');
    const settledEst = settled.filter(p => typeof p.estimated_probability === 'number');
    const paired = settledEst.filter(p => p.market_odds_at_analysis && p.market_odds_opponent);
    const snapsBet = valid.filter(p => p.decision === 'BET' && p.closing_odds && p.market_odds_at_analysis);
    const stage = calibStage(settledEst.length);

    if (countEl) countEl.textContent = `${preds.length} logged · ${settledEst.length} settled`;

    const dq = {
        opp: valid.filter(p => p.market_odds_opponent == null).length,
        ts: valid.filter(p => p.odds_timestamp == null).length,
        close: valid.filter(p => p.closing_odds == null).length,
        inv: invalid.length
    };

    const progressPct = Math.min(100, settledEst.length / CAL_T.PRELIM * 100);
    let frame = `
        <div class="calib-grid">
            <div class="calib-cell click" onclick="calibInfo('logged')"><div class="cl">Logged</div><div class="cv">${preds.length}</div></div>
            <div class="calib-cell click" onclick="calibInfo('settled')"><div class="cl">Settled</div><div class="cv">${settledEst.length}<span class="cs">/ ${CAL_T.PRELIM} · / ${CAL_T.VALID}</span></div></div>
            <div class="calib-cell click" onclick="calibInfo('paired')"><div class="cl">Paired baseline</div><div class="cv">${paired.length}</div></div>
            <div class="calib-cell click" onclick="calibInfo('snapshots')"><div class="cl">BET closing snaps</div><div class="cv">${snapsBet.length}<span class="cs">/ ${CAL_T.CLV_VALID}</span></div></div>
        </div>
        <div class="panel">
            <div class="calib-sub" style="margin-top:0;">Settled Progress</div>
            <div class="outcome-bar"><div class="outcome-seg" style="width:${progressPct}%;background:var(--edge);"></div></div>
            <div class="outcome-legend">
                <div class="outcome-legend-item">
                    <span class="outcome-dot" style="background:var(--edge);"></span>
                    <span class="ol-label">Settled</span>
                    <span class="ol-count">${settledEst.length}</span>
                    <span class="ol-pct">/ ${CAL_T.PRELIM} prelim · / ${CAL_T.VALID} valid</span>
                </div>
            </div>
        </div>
        <div class="panel">
            <div class="calib-sub click" style="margin-top:0;" onclick="calibInfo('quality')">Data quality</div>
            <div class="dq-grid">
                <div class="dq-cell"><div class="dq-value">${dq.opp}</div><div class="dq-label">missing opponent odds</div></div>
                <div class="dq-cell"><div class="dq-value">${dq.ts}</div><div class="dq-label">unknown timestamps</div></div>
                <div class="dq-cell"><div class="dq-value">${dq.close}</div><div class="dq-label">missing closing</div></div>
                <div class="dq-cell"><div class="dq-value">${dq.inv}</div><div class="dq-label">invalid records</div></div>
            </div>
        </div>`;

    if (settledEst.length < CAL_T.PRELIM) {
        el.innerHTML = `<div class="charts">${frame}</div>`;
        renderCalibCompact(stage.label.toLowerCase(), settledEst.length, CAL_T.PRELIM);
        calibExpanded = settledEst.length >= CAL_T.PRELIM;
        applyCalibLabVisibility();
        return;
    }

    let html = `<div class="charts">${frame}</div>`;

    const out = p => p.result === 'won' ? 1 : 0;
    const brierEdge = settledEst.reduce((s, p) => s + Math.pow(p.estimated_probability - out(p), 2), 0) / settledEst.length;

    let pairBlock = '';
    if (paired.length > 0) {
        const be = paired.reduce((s, p) => s + Math.pow(p.estimated_probability - out(p), 2), 0) / paired.length;
        const bm = paired.reduce((s, p) => s + Math.pow(devig(p.market_odds_at_analysis, p.market_odds_opponent) - out(p), 2), 0) / paired.length;
        let verdict;
        if (paired.length >= CAL_T.VALID) {
            const better = be < bm;
            verdict = `<div class="calib-verdict ${better ? 'pos' : 'neg'}">${better
                ? 'Validation checkpoint: Edge estimates beat the de-vigged market baseline on the paired sample.'
                : 'Validation checkpoint failed: Edge estimates do not beat the market baseline — per pre-registered condition, fair odds should be anchored to the de-vigged market price.'}</div>`;
        } else {
            verdict = `<div class="calib-note">Paired comparison is ${stage.label.toLowerCase()} (n=${paired.length}). Verdict is rendered only at the validation checkpoint (${CAL_T.VALID} paired settled).</div>`;
        }
        pairBlock = `
        <div class="calib-grid" style="margin-top:14px;">
            <div class="calib-cell click" onclick="calibInfo('brier')"><div class="cl">Brier Edge (paired)</div><div class="cv">${be.toFixed(4)}</div></div>
            <div class="calib-cell click" onclick="calibInfo('brier')"><div class="cl">Brier Market (paired)</div><div class="cv">${bm.toFixed(4)}</div></div>
            <div class="calib-cell click" onclick="calibInfo('brier')"><div class="cl">Brier Edge (overall)</div><div class="cv">${brierEdge.toFixed(4)}</div></div>
            <div class="calib-cell click" onclick="calibInfo('paired')"><div class="cl">Paired n</div><div class="cv">${paired.length}</div></div>
        </div>${verdict}`;
    } else {
        pairBlock = `
        <div class="calib-grid" style="margin-top:14px;">
            <div class="calib-cell click" onclick="calibInfo('brier')"><div class="cl">Brier Edge (overall)</div><div class="cv">${brierEdge.toFixed(4)}</div></div>
        </div>
        <div class="calib-note">Market comparison unavailable — no settled entries with both market prices. It requires <span class="mono">market_odds_opponent</span> in new entries.</div>`;
    }

    const buckets = {};
    settledEst.forEach(p => {
        const lo = Math.min(90, Math.floor(p.estimated_probability * 10) * 10);
        const b = buckets[lo] = buckets[lo] || { n: 0, w: 0, sum: 0 };
        b.n++; b.w += out(p); b.sum += p.estimated_probability;
    });
    const rows = Object.keys(buckets).sort((a, b) => a - b).map(lo => {
        const b = buckets[lo];
        const pred = 100 * b.sum / b.n, act = 100 * b.w / b.n, gap = act - pred;
        return `<tr><td>${lo}–${Number(lo) + 10}%</td><td>${b.n}</td><td>${pred.toFixed(0)}%</td><td>${act.toFixed(0)}%</td><td class="${gap < 0 ? 'neg' : 'pos'}">${gap >= 0 ? '+' : ''}${gap.toFixed(0)} pp</td></tr>`;
    }).join('');
    html += pairBlock + `
        <table class="calib-table click" onclick="calibInfo('buckets')">
            <thead><tr><th>Estimated</th><th>n</th><th>Mean predicted</th><th>Actual</th><th>Gap</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;

    el.innerHTML = html;
    renderClv(el, snapsBet);
    renderCalibCompact(stage.label.toLowerCase(), settledEst.length, CAL_T.PRELIM);
    calibExpanded = settledEst.length >= CAL_T.PRELIM;
    applyCalibLabVisibility();
}

function renderClv(el, snapsBet) {
    const clv = e => (e.market_odds_at_analysis / e.closing_odds - 1) * 100;
    let block = '<div class="calib-sub click" onclick="calibInfo(\'clv\')">Closing Line Value</div>';
    if (snapsBet.length === 0) {
        block += '<div class="calib-note">No BET closing snapshots yet (independent of settlement count — snapshot before each BET match).</div>';
    } else {
        const vals = snapsBet.map(clv).sort((a, b) => a - b);
        const avg = vals.reduce((s, x) => s + x, 0) / vals.length;
        const med = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
        const beat = vals.filter(c => c > 0).length;
        block += `<div class="calib-note">n=${vals.length} · avg ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}% · median ${med >= 0 ? '+' : ''}${med.toFixed(2)}% · beat close: ${beat}/${vals.length}</div>`;
        if (snapsBet.length >= CAL_T.CLV_VALID) {
            block += `<div class="calib-verdict ${avg > 0 ? 'pos' : 'neg'}">${avg > 0
                ? 'CLV validation checkpoint: average CLV on BETs is positive.'
                : 'CLV validation checkpoint failed: average CLV on BETs is negative — per pre-registered condition, the selection method is not validated.'}</div>`;
        } else {
            block += `<div class="calib-note">CLV verdict at ${CAL_T.CLV_VALID} snapshots.</div>`;
        }
    }
    el.innerHTML += block;
}

// ===== Coupon detail modal =====

function showDetails(couponId) {
    const c = betsData.coupons.find(x => x.id === couponId);
    if (!c) return;

    document.getElementById('modalTitle').textContent = `${c.id} · ${c.date}`;

    let selectionsHTML = '';
    if (c.selections && Array.isArray(c.selections)) {
        selectionsHTML = c.selections.map(s => `
            <div class="selection">
                <div class="m">${s.match}</div>
                <div class="d">${s.market} — ${s.pick} @ ${s.odds}${s.final_score ? ` — ${s.final_score}` : ''} —
                    <span class="tag ${s.result}" style="padding:1px 5px;">${s.result}</span>
                </div>
                ${s.notes ? `<div class="note">${s.notes}</div>` : ''}
            </div>`).join('');
    }

    const reviewHTML = c.review ? `
        <div class="review-title">Review</div>
        <div class="review-box">
            <div class="kv"><span class="k">Decision quality</span><span class="v">${c.review.decision_quality}</span></div>
            <div style="margin-top:8px;"><span class="k">Lesson —</span> <span class="v">${c.review.main_lesson}</span></div>
        </div>` : '';

    document.getElementById('modalBody').innerHTML = `
        <div class="kv"><span class="k">Type</span><span class="v">${c.type}</span></div>
        <div class="kv"><span class="k">Source</span><span class="v">${c.source.replace('_', ' ')}</span></div>
        <div class="kv"><span class="k">Stake</span><span class="v">${fmt(c.stake_pln)} PLN</span></div>
        <div class="kv"><span class="k">Combined odds</span><span class="v">${c.combined_odds}</span></div>
        <div class="kv"><span class="k">Potential return</span><span class="v">${fmt(c.potential_return_pln, 2)} PLN</span></div>
        <div class="kv"><span class="k">Net result</span><span class="v">${fmt(c.net_result_pln, 2)} PLN</span></div>
        <div class="selections-title">Selections</div>
        ${selectionsHTML}
        ${reviewHTML}
        <div style="margin-top:16px;">
            <a href="${reportsHref(c.date)}" style="font-family:var(--font-mono);font-size:11px;color:var(--edge);text-decoration:none;">Pełny raport dnia →</a>
        </div>
    `;

    document.getElementById('modal').style.display = 'flex';
}

function setupModalHandlers() {
    const modal = document.getElementById('modal');
    const closeBtn = document.getElementById('closeModal');

    closeBtn.onclick = () => { modal.style.display = 'none'; };
    modal.addEventListener('click', (event) => {
        if (event.target === modal) modal.style.display = 'none';
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        modal.style.display = 'none';
        const calibModal = document.getElementById('calibModal');
        if (calibModal) calibModal.style.display = 'none';
    });
}
