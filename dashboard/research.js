let betsData = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBets();
});

async function loadBets() {
    try {
        betsData = await fetchBetsData();
        renderResearch();
    } catch (error) {
        console.error('Error loading bets:', error);
    }
}

// Version tabs, same pattern as the claude/gpt tabs in the reports view.
// v1 and v2 are separate experiments (PLAYBOOK.md -> Method versioning), so
// the whole page -- Calibration Lab and Discipline Monitor -- is scoped to
// one version at a time. v2 is the active method and the default tab;
// #v1 in the URL opens the archive directly.
const RESEARCH_VERSIONS = [
    { key: 'v2', label: 'V2 · active' },
    { key: 'v1', label: 'V1 · archived' }
];
let researchVersion = location.hash === '#v1' ? 'v1' : 'v2';

function switchResearchVersion(v) {
    researchVersion = v;
    history.replaceState(null, '', v === 'v2' ? location.pathname : '#v1');
    renderResearch();
}

function renderVersionTabs() {
    const el = document.getElementById('versionTabs');
    if (!el) return;
    el.innerHTML = RESEARCH_VERSIONS.map(v =>
        `<span class="report-tab ${v.key === researchVersion ? 'active' : ''}" onclick="switchResearchVersion('${v.key}')">${v.label}</span>`
    ).join('');
}

function renderResearch() {
    renderVersionTabs();
    if (researchVersion === 'v2') renderCalibrationV2();
    else renderCalibration('v1');
    // Calibration Lab is this page's reason to exist -- it always starts
    // expanded here, regardless of the settled-count threshold that governs
    // the collapsed default everywhere else renderCalibration() might run.
    calibExpanded = true;
    applyCalibLabVisibility();

    renderDisciplineMonitor();
}

// ===== Calibration Lab — v2 =====
// Metrics exactly as METHOD_V2 §18-20 define them, per agent, v2 entries
// only. Nothing here feeds back into the method; it only reads the ledger.

Object.assign(CALIB_INFO, {
    v2move: ['Ruch linii (główna metryka wczesna)', 'Czy rynek do zamknięcia idzie w stronę naszej korekty? move = (p_market na zamknięciu − p_market przy analizie) × znak(p_v2 − p_market). Dodatni = rynek poszedł za korektą. Liczone tylko dla wpisów z closingiem po obu stronach i korektą ≥ 1 pp (osobno ≥ 3 pp). Poniżej n = 100 wyłącznie opisowo (METHOD_V2 §18) — przy mniejszej próbce test nie ma mocy.'],
    v2mad: ['Średnie odchylenie od rynku', 'Średnia |p_v2 − p_market| w punktach procentowych. Mówi, jak mocno metoda w ogóle odchodzi od ceny rynkowej. Nie zależy od wyników meczów, więc liczy się od pierwszego wpisu. Limit metody to ±5 pp.'],
    v2coverage: ['Pokrycie closingiem', 'Ile predykcji ma closing po obu stronach (valid_closing_snapshots / all_predictions). Zawsze raportowane jawnie (§18): niskie pokrycie osłabia metrykę ruchu linii, ale jej nie unieważnia. Brak odczytu zostaje null na zawsze.'],
    v2brier: ['Brier v2 vs rynek', 'Kara za pomyłki (prognoza − wynik)² dla p_v2 i dla de-vigowanego rynku, na tych samych meczach. advantage = Brier rynku − Brier v2; dodatni = v2 lepsze od rynku. Zawsze z 95% przedziałem ufności z bootstrapu. Pokazujemy od 50 rozliczonych; werdykt tylko na checkpoincie 150 (pierwsze 150 wg daty, potem id — nigdy nieprzeliczany później).'],
    v2buckets: ['Kalibracja vs wyniki i vs rynek', 'Mecze pogrupowane wg p_v2 co 10 pp. Dla każdej grupy: średnie p_v2, średnie p_market i faktyczny odsetek wygranych. Jeśli „Actual" jest bliżej rynku niż v2, korekty szkodzą.'],
    v2bets: ['BET-y v2 (paper)', 'Wszystkie BET-y v2 są papierowe w czasie walidacji. Liczba, paper ROI przy 1u i paper CLV są czysto opisowe — przy progu +8% i marży STS BET-ów będzie mało i prawie same underdogi (§13), więc nie są bramką promocji.'],
    v2checkpoint: ['Checkpoint 150', 'Liczony raz, na pierwszych 150 rozliczonych predykcjach v2 posortowanych po dacie, potem id. Bezpiecznik: Brier rynku − Brier v2 < 0 → brak promocji niezależnie od ruchu linii. Reguła stopu: przedział ufności zawiera zero i jego połowa ≤ 0.003 → „brak wykrywalnej przewagi", zbieranie v2 się kończy (§20).']
});

// p_v2 from the ledger's own fields rather than estimated_probability:
// estimated_probability = round(1/fair_odds, 4) after fair_odds was rounded
// to 2 decimals, which can flip the sign of a zero adjustment (e.g.
// P-2026-10-03-G3: adjustment 0, p_market 0.9199, estimated 0.9174). The
// direction the method moved is the sign of total_adjustment_pp.
function v2PV2(p) {
    const adj = Math.max(-5, Math.min(5, p.total_adjustment_pp || 0));
    return p.p_market + adj / 100;
}

// Both ends de-vigged from the raw odds: the ledger's p_market is rounded to
// 4 decimals, which would show an unchanged price (e.g. 3.80/1.22 -> 3.80/1.22)
// as a ±0.003 pp "move".
function v2Move(p) {
    const close = devig(p.closing_odds, p.closing_odds_opponent);
    const open = devig(p.market_odds_at_analysis, p.market_odds_opponent);
    const dir = Math.sign(p.total_adjustment_pp || 0);
    if (close == null || open == null || dir === 0) return null;
    return (close - open) * dir * 100; // pp
}

function bootstrapMeanCI(xs, nBoot = 2000) {
    const n = xs.length;
    if (n < 2) return null;
    const means = new Array(nBoot);
    for (let b = 0; b < nBoot; b++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += xs[Math.floor(Math.random() * n)];
        means[b] = s / n;
    }
    means.sort((a, b) => a - b);
    return { lo: means[Math.floor(0.025 * nBoot)], hi: means[Math.min(nBoot - 1, Math.floor(0.975 * nBoot))] };
}

const sgn = (x, d) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;

function v2MoveBlock(entries, minAdj) {
    const sample = entries.filter(p => Math.abs(p.total_adjustment_pp || 0) >= minAdj)
        .map(v2Move).filter(m => m != null);
    if (sample.length === 0) return `<div class="calib-note">|adj| ≥ ${minAdj} pp: no entries with a two-sided closing yet.</div>`;
    const mean = sample.reduce((s, x) => s + x, 0) / sample.length;
    const ci = bootstrapMeanCI(sample);
    const EPS = 1e-9;
    const followed = sample.filter(m => m > EPS).length, against = sample.filter(m => m < -EPS).length;
    return `<div class="calib-note">|adj| ≥ ${minAdj} pp · n=${sample.length} · mean move ${sgn(mean, 2)} pp${ci ? ` · 95% CI [${sgn(ci.lo, 2)}, ${sgn(ci.hi, 2)}]` : ''} · market with / against / flat: ${followed} / ${against} / ${sample.length - followed - against}${sample.length < 100 ? ' · <b>descriptive only (n &lt; 100)</b>' : ''}</div>`;
}

function renderCalibrationV2Agent(all, agent, invalidIds) {
    const preds = all.filter(p => p.agent === agent);
    const valid = preds.filter(p => !invalidIds[p.id]);
    const settled = settledEstPredictions(all, agent, 'v2')
        .slice().sort((a, b) => a.date === b.date ? (a.id < b.id ? -1 : 1) : (a.date < b.date ? -1 : 1));
    const paired = settled.filter(p => p.market_odds_at_analysis && p.market_odds_opponent);
    const withClose = valid.filter(p => p.closing_odds != null && p.closing_odds_opponent != null);
    const stage = calibStage(settled.length);
    const bets = valid.filter(p => p.decision === 'BET');
    const mad = valid.length ? valid.reduce((s, p) => s + Math.abs(v2PV2(p) - p.p_market), 0) / valid.length * 100 : 0;
    const dqFlagged = valid.filter(p => Array.isArray(p.data_quality) && p.data_quality.length > 0).length;
    const covPct = valid.length ? withClose.length / valid.length * 100 : 0;

    const header = `<div class="calib-sub" style="margin-top:0;font-size:12px;color:var(--ink);">${agent.toUpperCase()} × V2 · ${stage.label}</div>`;

    let html = `${header}<div class="charts">
        <div class="calib-grid">
            <div class="calib-cell click" onclick="calibInfo('logged')"><div class="cl">Logged</div><div class="cv">${preds.length}</div></div>
            <div class="calib-cell click" onclick="calibInfo('settled')"><div class="cl">Settled</div><div class="cv">${settled.length}<span class="cs">/ ${CAL_T.PRELIM} · / ${CAL_T.VALID}</span></div></div>
            <div class="calib-cell click" onclick="calibInfo('v2coverage')"><div class="cl">Closing coverage</div><div class="cv">${withClose.length}<span class="cs">/ ${valid.length} · ${covPct.toFixed(0)}%</span></div></div>
            <div class="calib-cell click" onclick="calibInfo('v2mad')"><div class="cl">Mean |p_v2 − market|</div><div class="cv">${mad.toFixed(2)}<span class="cs"> pp</span></div></div>
        </div>
        <div class="panel">
            <div class="calib-sub" style="margin-top:0;">Settled Progress</div>
            <div class="progress-scaled">${renderScaledProgressBar(settled.length, [CAL_T.PRELIM, CAL_T.EMERG, CAL_T.VALID])}</div>
            <div class="outcome-legend"><div class="outcome-legend-item">
                <span class="outcome-dot" style="background:var(--edge);"></span><span class="ol-label">Settled</span>
                <span class="ol-count">${settled.length}</span><span class="ol-pct">/ ${CAL_T.PRELIM} prelim · / ${CAL_T.EMERG} emerging · / ${CAL_T.VALID} checkpoint</span>
            </div></div>
        </div>
        <div class="panel">
            <div class="calib-sub click" style="margin-top:0;" onclick="calibInfo('quality')">Data quality</div>
            <div class="dq-grid">
                <div class="dq-cell"><div class="dq-value">${valid.length - withClose.length}</div><div class="dq-label">missing closing</div></div>
                <div class="dq-cell"><div class="dq-value">${dqFlagged}</div><div class="dq-label">with data_quality flags</div></div>
                <div class="dq-cell"><div class="dq-value">${preds.length - valid.length}</div><div class="dq-label">invalid records</div></div>
            </div>
        </div>
    </div>`;

    // Closing-line movement: not outcome-based, so shown from the first entry.
    html += `<div class="calib-sub click" onclick="calibInfo('v2move')">Closing-line movement</div>`;
    html += v2MoveBlock(valid, 1) + v2MoveBlock(valid, 3);

    // Outcome-based metrics stay locked below the preliminary threshold,
    // same rule as v1: at small n any Brier number is noise.
    const out = p => p.result === 'won' ? 1 : 0;
    if (settled.length < CAL_T.PRELIM) {
        html += `<div class="calib-sub click" onclick="calibInfo('v2brier')">Brier v2 vs market</div>
            <div class="calib-note">Unlocks at ${CAL_T.PRELIM} settled (now ${settled.length}). Collection stage — no outcome-based numbers yet.</div>`;
    } else {
        const brier = (xs, f) => xs.reduce((s, p) => s + Math.pow(f(p) - out(p), 2), 0) / xs.length;
        const mkt = p => devig(p.market_odds_at_analysis, p.market_odds_opponent);
        const be = brier(paired, p => p.estimated_probability), bm = brier(paired, mkt);
        const ci = bootstrapBrierAdvantageCI(paired);
        html += `<div class="calib-sub click" onclick="calibInfo('v2brier')">Brier v2 vs market</div>
            <div class="calib-grid">
                <div class="calib-cell"><div class="cl">Brier v2</div><div class="cv">${be.toFixed(4)}</div></div>
                <div class="calib-cell"><div class="cl">Brier market</div><div class="cv">${bm.toFixed(4)}</div></div>
                <div class="calib-cell"><div class="cl">Advantage</div><div class="cv">${sgn(bm - be, 4)}</div></div>
                <div class="calib-cell"><div class="cl">Paired n</div><div class="cv">${paired.length}</div></div>
            </div>
            ${ci ? `<div class="calib-note">95% CI [${sgn(ci.lo, 4)}, ${sgn(ci.hi, 4)}]${ci.containsZero ? ' — contains zero' : ''}</div>` : ''}`;

        if (paired.length >= CAL_T.VALID) {
            const cp = paired.slice(0, CAL_T.VALID);
            const cbe = brier(cp, p => p.estimated_probability), cbm = brier(cp, mkt);
            const cci = bootstrapBrierAdvantageCI(cp);
            const adv = cbm - cbe;
            let verdict;
            if (adv < 0) verdict = 'Negative safety rule: market Brier beats v2 at the checkpoint — v2 is not promoted, regardless of line movement.';
            else if (cci.containsZero && cci.halfWidth <= 0.003) verdict = 'Stop rule: CI contains zero with half-width ≤ 0.003 — recorded as "no detectable edge"; v2 collection stops.';
            else if (cci.containsZero) verdict = 'Advantage positive but CI contains zero — Brier condition met, strong-evidence condition not met by Brier.';
            else verdict = 'Advantage positive and CI excludes zero — strong-evidence condition met by Brier. Promotion still needs the other §20 conditions and operator approval.';
            html += `<div class="calib-verdict ${adv < 0 ? 'neg' : (!cci.containsZero ? 'pos' : '')}">
                <div class="click" onclick="calibInfo('v2checkpoint')">Checkpoint (first ${CAL_T.VALID} by date, id): advantage ${sgn(adv, 4)} · 95% CI [${sgn(cci.lo, 4)}, ${sgn(cci.hi, 4)}]</div>
                <div>${verdict}</div></div>`;
        } else {
            html += `<div class="calib-note">Verdict only at the checkpoint (${CAL_T.VALID} settled, computed once on the first ${CAL_T.VALID} by date, id).</div>`;
        }

        const buckets = {};
        paired.forEach(p => {
            const lo = Math.min(90, Math.floor(v2PV2(p) * 10) * 10);
            const b = buckets[lo] = buckets[lo] || { n: 0, w: 0, v2: 0, m: 0 };
            b.n++; b.w += out(p); b.v2 += v2PV2(p); b.m += mkt(p);
        });
        const rows = Object.keys(buckets).sort((a, b) => a - b).map(lo => {
            const b = buckets[lo];
            return `<tr><td>${lo}–${Number(lo) + 10}%</td><td>${b.n}</td><td>${(100 * b.v2 / b.n).toFixed(0)}%</td><td>${(100 * b.m / b.n).toFixed(0)}%</td><td>${(100 * b.w / b.n).toFixed(0)}%</td></tr>`;
        }).join('');
        html += `<table class="calib-table click" onclick="calibInfo('v2buckets')">
            <thead><tr><th>p_v2</th><th>n</th><th>Mean p_v2</th><th>Mean market</th><th>Actual</th></tr></thead>
            <tbody>${rows}</tbody></table>`;
    }

    // Paper BETs: descriptive only (§13, §18 item 5).
    const settledBets = bets.filter(p => p.result === 'won' || p.result === 'lost');
    const paperNet = settledBets.reduce((s, p) => s + (p.result === 'won' ? p.market_odds_at_analysis - 1 : -1), 0);
    const betClv = bets.filter(p => p.closing_odds).map(p => (p.market_odds_at_analysis / p.closing_odds - 1) * 100);
    html += `<div class="calib-sub click" onclick="calibInfo('v2bets')">Paper BETs</div>
        <div class="calib-note">${bets.length === 0
            ? 'No v2 BETs yet — expected: a BET needs value ≥ +8%, reachable only around odds ≥ 2.37 (§13).'
            : `n=${bets.length} · settled ${settledBets.length}${settledBets.length ? ` · paper ROI ${sgn(paperNet / settledBets.length * 100, 1)}%` : ''}${betClv.length ? ` · paper CLV avg ${sgn(betClv.reduce((s, x) => s + x, 0) / betClv.length, 2)}% (n=${betClv.length})` : ''} · descriptive only`}</div>`;

    return { logged: preds.length, settledCount: settled.length, html };
}

function renderCalibrationV2() {
    const el = document.getElementById('calibBody');
    const countEl = document.getElementById('calibCount');
    if (!el) return;
    const all = (betsData.predictions || []).filter(p => p.method_version === 'v2');
    if (all.length === 0) {
        if (countEl) countEl.textContent = 'v2: 0 logged';
        el.innerHTML = '<div class="calib-note">Frozen 2026-09-23 (<span class="mono">docs/METHOD_V2.md</span>) — collection not started yet.</div>';
        renderCalibCompact(0);
        return;
    }
    const invalidIds = {};
    validatePredictions(all).forEach(x => invalidIds[x.id] = 1);
    const agents = [...new Set(all.map(p => p.agent).filter(Boolean))].sort();
    const sections = agents.map((agent, i) => {
        const s = renderCalibrationV2Agent(all, agent, invalidIds);
        const border = i === 0 ? '' : 'margin-top:28px;padding-top:20px;border-top:1px solid var(--line);';
        return { ...s, agent, wrapped: `<div style="${border}">${s.html}</div>` };
    });
    if (countEl) countEl.textContent = sections.map(s => `${s.agent} × v2: ${s.logged} logged · ${s.settledCount} settled`).join(' · ');
    el.innerHTML = sections.map(s => s.wrapped).join('');
    renderCalibCompact(Math.max(...sections.map(s => s.settledCount)));
}

// ===== Discipline Monitor =====

function renderDisciplineMonitor() {
    const el = document.getElementById('disciplineBody');
    const countEl = document.getElementById('disciplineCount');
    if (!el) return;

    const preds = (betsData.predictions || []).filter(p => p.method_version === researchVersion);
    if (preds.length === 0) {
        if (countEl) countEl.textContent = `${researchVersion}: 0 predictions`;
        el.innerHTML = '<div class="calib-note">No predictions logged yet.</div>';
        return;
    }

    const ds = decisionStats(preds);
    if (countEl) countEl.textContent = `${preds.length} predictions · ${ds.bet.n} BET / ${ds.pass.n} PASS`;

    const total = ds.bet.n + ds.pass.n;
    const betPct = total > 0 ? (ds.bet.n / total) * 100 : 0;
    const passPct = total > 0 ? (ds.pass.n / total) * 100 : 0;

    const barHTML = `
        <div class="panel">
            <div class="calib-sub click" style="margin-top:0;" onclick="calibInfo('betPass')">BET / PASS split</div>
            <div class="outcome-bar">
                ${ds.bet.n > 0 ? `<div class="outcome-seg" style="width:${betPct}%;background:var(--edge);" title="BET: ${ds.bet.n} (${betPct.toFixed(0)}%)"></div>` : ''}
                ${ds.pass.n > 0 ? `<div class="outcome-seg" style="width:${passPct}%;background:var(--line-soft);" title="PASS: ${ds.pass.n} (${passPct.toFixed(0)}%)"></div>` : ''}
            </div>
            <div class="outcome-legend">
                <div class="outcome-legend-item"><span class="outcome-dot" style="background:var(--edge);"></span><span class="ol-label">BET</span><span class="ol-count">${ds.bet.n}</span><span class="ol-pct">${betPct.toFixed(0)}%</span></div>
                <div class="outcome-legend-item"><span class="outcome-dot" style="background:var(--ink-faint);"></span><span class="ol-label">PASS</span><span class="ol-count">${ds.pass.n}</span><span class="ol-pct">${passPct.toFixed(0)}%</span></div>
            </div>
        </div>`;

    const betCard = `
        <div class="kpi">
            <div class="kpi-label click" onclick="calibInfo('betRecord')">BET record</div>
            <div class="kpi-value ${ds.bet.hitRate == null ? '' : (ds.bet.hitRate >= 0.55 ? 'pos' : ds.bet.hitRate < 0.45 ? 'neg' : '')}">${ds.bet.won}W – ${ds.bet.lost}L</div>
            <div class="kpi-sub">${ds.bet.hitRate != null ? (ds.bet.hitRate * 100).toFixed(0) + '% hit rate' : 'no settled BETs yet'}</div>
        </div>`;

    // PASS discipline: split settled PASS-es by value, not by whether the pick would
    // have won. A correct PASS (value <= 0) winning is NOT a loss -- the price just
    // didn't compensate for the risk. Only value > 0 PASS-es that would have won are
    // genuinely missed opportunities.
    const settledPass = preds.filter(p => p.decision === 'PASS' && (p.result === 'won' || p.result === 'lost'));
    const withValue = settledPass
        .filter(p => typeof p.market_odds_at_analysis === 'number' && typeof p.fair_odds === 'number')
        .map(p => ({ p, value: p.market_odds_at_analysis / p.fair_odds - 1 }));

    const correctPasses = withValue.filter(x => x.value <= 0);
    const missedPasses = withValue.filter(x => x.value > 0);
    const correctWon = correctPasses.filter(x => x.p.result === 'won').length;
    const missedWon = missedPasses.filter(x => x.p.result === 'won').length;
    const unitStake = betsData.unit_value_pln;
    const missedHypothetical = missedPasses.reduce((sum, x) => {
        return sum + (x.p.result === 'won' ? unitStake * (x.p.market_odds_at_analysis - 1) : -unitStake);
    }, 0);

    const obs = observedPassStats(betsData.observed_passes, unitStake);

    const passCard = `
        <div class="kpi">
            <div class="kpi-label click" onclick="calibInfo('passDiscipline')">PASS discipline</div>
            <div class="kpi-value">${correctPasses.length}</div>
            <div class="kpi-sub">correct passes (price too low) · ${correctWon}/${correctPasses.length} would've won (not a loss)</div>
        </div>`;

    const missedCard = `
        <div class="kpi" title="Trafiony PASS przy ujemnym value to dobra decyzja, nie strata. Tylko dodatnie value, które wygrywa, oznacza przeoczoną okazję.">
            <div class="kpi-label click" onclick="calibInfo('passDiscipline')">Missed value</div>
            <div class="kpi-value ${missedPasses.length > 0 ? (missedHypothetical >= 0 ? 'pos' : 'neg') : ''}">${missedPasses.length}</div>
            <div class="kpi-sub">${missedPasses.length > 0
                ? `at value &gt; 0 · ${missedWon}/${missedPasses.length} would've won · hypothetical ${missedHypothetical >= 0 ? '+' : ''}${missedHypothetical.toFixed(2)} PLN`
                : 'no missed opportunities — threshold working'}</div>
        </div>`;

    const obsCard = `
        <div class="kpi">
            <div class="kpi-label">Observed passes</div>
            <div class="kpi-value ${obs.n > 0 ? (obs.hypotheticalNet >= 0 ? 'pos' : 'neg') : ''}">${obs.n}</div>
            <div class="kpi-sub">${obs.n > 0
                ? `hypothetical at 1u: ${obs.hypotheticalNet >= 0 ? '+' : ''}${obs.hypotheticalNet.toFixed(2)} PLN · discipline ${obs.hypotheticalNet >= 0 ? 'cost' : 'saved'} money`
                : 'no observed passes with odds logged yet'}</div>
        </div>`;

    el.innerHTML = `<div class="charts"><div class="kpi-row">${betCard}${passCard}${missedCard}${obsCard}</div>${barHTML}</div>`;
}
