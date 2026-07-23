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

function renderResearch() {
    renderCalibration();
    // Calibration Lab is this page's reason to exist -- it always starts
    // expanded here, regardless of the settled-count threshold that governs
    // the collapsed default everywhere else renderCalibration() might run.
    calibExpanded = true;
    applyCalibLabVisibility();

    renderDisciplineMonitor();
    renderByGame();
}

// ===== Discipline Monitor =====

function renderDisciplineMonitor() {
    const el = document.getElementById('disciplineBody');
    const countEl = document.getElementById('disciplineCount');
    if (!el) return;

    const preds = betsData.predictions || [];
    if (preds.length === 0) {
        if (countEl) countEl.textContent = '0 predictions';
        el.innerHTML = '<div class="calib-note">No predictions logged yet.</div>';
        return;
    }

    const ds = decisionStats(preds);
    if (countEl) countEl.textContent = `${preds.length} predictions · ${ds.bet.n} BET / ${ds.pass.n} PASS`;

    const total = ds.bet.n + ds.pass.n;
    const betPct = total > 0 ? (ds.bet.n / total) * 100 : 0;
    const passPct = total > 0 ? (ds.pass.n / total) * 100 : 0;

    const barHTML = `
        <div class="calib-sub click" onclick="calibInfo('betPass')">BET / PASS split</div>
        <div class="outcome-bar">
            ${ds.bet.n > 0 ? `<div class="outcome-seg" style="width:${betPct}%;background:var(--edge);" title="BET: ${ds.bet.n} (${betPct.toFixed(0)}%)"></div>` : ''}
            ${ds.pass.n > 0 ? `<div class="outcome-seg" style="width:${passPct}%;background:var(--line-soft);" title="PASS: ${ds.pass.n} (${passPct.toFixed(0)}%)"></div>` : ''}
        </div>
        <div class="outcome-legend">
            <div class="outcome-legend-item"><span class="outcome-dot" style="background:var(--edge);"></span><span class="ol-label">BET</span><span class="ol-count">${ds.bet.n}</span><span class="ol-pct">${betPct.toFixed(0)}%</span></div>
            <div class="outcome-legend-item"><span class="outcome-dot" style="background:var(--ink-faint);"></span><span class="ol-label">PASS</span><span class="ol-count">${ds.pass.n}</span><span class="ol-pct">${passPct.toFixed(0)}%</span></div>
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

    el.innerHTML = `${barHTML}<div class="kpi-row" style="margin-top:20px;">${betCard}${passCard}${missedCard}${obsCard}</div>`;
}

// ===== By Game =====
// BY_GAME_LIST itself lives in shared-metrics.js -- dashboard.js's coupon
// table (couponGameLabel) needs it too, not just this page's render function.

function renderByGame() {
    const el = document.getElementById('byGameBody');
    if (!el) return;

    const preds = betsData.predictions || [];
    const selections = getAllSelections(betsData);
    const gameSelStats = {};
    selectionsByGame(selections).forEach(g => { gameSelStats[g.label] = g; });

    const cards = BY_GAME_LIST.map(g => {
        const gamePreds = preds.filter(p => (p.game || 'unknown') === g.key);
        const bet = gamePreds.filter(p => p.decision === 'BET').length;
        const pass = gamePreds.filter(p => p.decision === 'PASS').length;
        const selStat = gameSelStats[g.key];
        const selSub = selStat && selStat.n > 0
            ? `${selStat.won}W – ${selStat.lost}L on legs`
            : 'no joined legs yet';
        return `
            <div class="kpi">
                <div class="kpi-label">${g.label}${g.primary ? ' <span style="color:var(--edge);">primary market</span>' : ''}</div>
                <div class="kpi-value">${gamePreds.length}</div>
                <div class="kpi-sub">${bet} BET / ${pass} PASS</div>
                <div class="kpi-sub">${selSub}</div>
            </div>`;
    }).join('');

    el.innerHTML = `<div class="kpi-row cols-3">${cards}</div>`;
}
