const RECENT_LIMIT = 6;

let betsData = null;
let roiChart = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBets();
    setupModalHandlers();
});

async function loadBets() {
    try {
        betsData = await fetchBetsData();
        renderDashboard();
    } catch (error) {
        console.error('Error loading bets:', error);
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="8">Error loading data</td></tr>';
    }
}

function renderDashboard() {
    buildKPIs();
    renderCharts();
    renderSelectionsPerformance();
    renderDisciplineMonitor();
    renderByGame();
    renderCalibration();
    renderBetSource();
    renderTable();

    const params = new URLSearchParams(window.location.search);
    const openId = params.get('open');
    if (openId && betsData.coupons.some(c => c.id === openId)) {
        showDetails(openId);
    }
}

// Longest run of consecutive won/lost coupons, most recent first (voids don't break it).
function computeStreak(coupons) {
    const settled = [...coupons].reverse().filter(c => c.status === 'won' || c.status === 'lost');
    if (settled.length === 0) return { count: 0, type: null };
    const type = settled[0].status;
    let count = 0;
    for (const c of settled) {
        if (c.status !== type) break;
        count++;
    }
    return { count, type };
}

function buildKPIs() {
    const s = betsData.summary;
    const roi = (s.roi * 100).toFixed(1);

    const streak = computeStreak(betsData.coupons);
    const streakCls = streak.type === 'won' ? 'pos' : streak.type === 'lost' ? 'neg' : '';
    const streakValue = streak.count > 0 ? `${streak.count}${streak.type === 'won' ? 'W' : 'L'}` : '—';
    const streakNoun = streak.type === 'won'
        ? (streak.count === 1 ? 'win' : 'wins')
        : (streak.count === 1 ? 'loss' : 'losses');
    const streakSub = streak.count > 0 ? `${streak.count} ${streakNoun} in a row (coupons)` : 'no settled coupons yet';

    const selStats = selectionStats(getAllSelections(betsData));
    const selHitCls = selStats.hitRate == null ? '' : (selStats.hitRate >= 0.55 ? 'pos' : selStats.hitRate < 0.45 ? 'neg' : '');

    const kpis = [
        { label: 'Net Result', info: 'netResult', value: `${s.net_result_pln >= 0 ? '+' : ''}${fmt(s.net_result_pln, 2)} PLN`, cls: s.net_result_pln < 0 ? 'neg' : 'pos', sub: `${fmt(s.total_staked_pln, 2)} PLN staked` },
        { label: 'ROI', info: 'roi', value: `${roi >= 0 ? '+' : ''}${roi}%`, cls: roi < 0 ? 'neg' : 'pos', sub: `on ${fmt(s.total_staked_pln, 2)} PLN staked · flat 1u stakes` },
        { label: 'Selection Hit Rate', info: 'selHitRate', value: selStats.hitRate != null ? `${(selStats.hitRate * 100).toFixed(0)}%` : '—', cls: selHitCls, sub: `coupons: ${s.won}W – ${s.lost}L` },
        { label: 'Streak', info: 'streak', value: streakValue, cls: streakCls, sub: streakSub }
    ];

    document.getElementById('kpiRow').innerHTML = kpis.map(k => `
        <div class="kpi ${k.cls}">
            <div class="kpi-label click" onclick="calibInfo('${k.info}')">${k.label}</div>
            <div class="kpi-value ${k.cls}">${k.value}</div>
            <div class="kpi-sub">${k.sub}</div>
        </div>`).join('');
}

function parseISODate(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}
function formatISODate(date) { return date.toISOString().slice(0, 10); }

// One point per calendar day (coupons settled the same day are summed into
// one point, tooltip lists their IDs), plus a synthetic (first day - 1, 0)
// point so the line always starts at zero.
function buildPnlSeries(coupons) {
    const settled = coupons.filter(c => c.status !== 'pending');
    const byDate = {};
    settled.forEach(c => {
        const day = byDate[c.date] = byDate[c.date] || { date: c.date, net: 0, ids: [] };
        day.net += c.net_result_pln;
        day.ids.push(c.id);
    });
    const days = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

    let cumulative = 0;
    const points = days.map(d => {
        cumulative += d.net;
        return { x: d.date, y: cumulative, dayNet: d.net, ids: d.ids };
    });

    if (points.length > 0) {
        const start = parseISODate(points[0].x);
        start.setUTCDate(start.getUTCDate() - 1);
        points.unshift({ x: formatISODate(start), y: 0, dayNet: 0, ids: [] });
    }
    return points;
}

function renderCharts() {
    const roiCtx = document.getElementById('roiChart').getContext('2d');
    const points = buildPnlSeries(betsData.coupons);

    if (roiChart) roiChart.destroy();
    roiChart = new Chart(roiCtx, {
        type: 'line',
        data: {
            datasets: [{
                data: points,
                borderColor: '#ff9f1c',
                borderWidth: 2,
                tension: 0.25,
                fill: { target: 'origin', above: 'rgba(94,194,106,0.12)', below: 'rgba(255,92,77,0.12)' },
                pointBackgroundColor: '#ff9f1c',
                pointBorderColor: '#0a0b0d',
                pointRadius: ctx => (ctx.raw && ctx.raw.ids && ctx.raw.ids.length ? 4 : 0),
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: items => items[0].raw.x,
                        label: item => {
                            const r = item.raw;
                            const lines = [
                                `Daily net: ${r.dayNet >= 0 ? '+' : ''}${r.dayNet.toFixed(2)} PLN`,
                                `Cumulative: ${r.y >= 0 ? '+' : ''}${r.y.toFixed(2)} PLN`
                            ];
                            if (r.ids && r.ids.length) lines.push(`Coupons: ${r.ids.join(', ')}`);
                            return lines;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#a8abb3', font: { family: 'JetBrains Mono', size: 10 } },
                    grid: {
                        color: ctx => ctx.tick.value === 0 ? 'rgba(242,240,235,0.3)' : '#1c1e23',
                        lineWidth: ctx => ctx.tick.value === 0 ? 2 : 1
                    }
                },
                x: {
                    type: 'time',
                    time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd', displayFormats: { day: 'MM-dd' } },
                    ticks: { color: '#a8abb3', font: { family: 'JetBrains Mono', size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });

    const plMeta = document.getElementById('plMeta');
    if (plMeta) {
        const total = betsData.summary.net_result_pln;
        plMeta.textContent = `total ${total >= 0 ? '+' : ''}${total.toFixed(2)} PLN`;
        plMeta.className = total >= 0 ? 'pos' : 'neg';
    }

    renderOutcomeBar();
}

function renderOutcomeBar() {
    const s = betsData.summary;
    const total = s.coupons || 1;

    const segments = [
        { label: 'Won', count: s.won, color: 'var(--pos)' },
        { label: 'Lost', count: s.lost, color: 'var(--neg)' },
        { label: 'Void', count: s.voided, color: 'var(--void)' },
        { label: 'Pending', count: s.pending, color: 'var(--ink-faint)' }
    ].filter(seg => seg.count > 0);

    document.getElementById('outcomeBar').innerHTML = segments.map(seg => {
        const pct = (seg.count / total) * 100;
        return `<div class="outcome-seg" style="width:${pct}%;background:${seg.color};" title="${seg.label}: ${seg.count} (${pct.toFixed(0)}%)"></div>`;
    }).join('');

    document.getElementById('outcomeLegend').innerHTML = segments.map(seg => {
        const pct = ((seg.count / total) * 100).toFixed(0);
        return `<div class="outcome-legend-item">
            <span class="outcome-dot" style="background:${seg.color};"></span>
            <span class="ol-label">${seg.label}</span>
            <span class="ol-count">${seg.count}</span>
            <span class="ol-pct">${pct}%</span>
        </div>`;
    }).join('');
}

function couponGameLabel(couponId, allSelections) {
    const games = new Set(allSelections.filter(s => s.couponId === couponId && s.game).map(s => s.game));
    if (games.size === 0) return '—';
    if (games.size === 1) {
        const key = [...games][0];
        const known = BY_GAME_LIST.find(g => g.key === key);
        return known ? known.label : key;
    }
    return 'multi';
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const total = betsData.coupons.length;
    const recent = [...betsData.coupons].reverse().slice(0, RECENT_LIMIT);
    const allSelections = getAllSelections(betsData);

    tbody.innerHTML = recent.map(c => {
        const legs = (c.selections || []).length;
        const type = c.type === 'single' ? 'single' : `acca · ${legs}`;
        const game = couponGameLabel(c.id, allSelections);
        const returnCls = c.gross_return_pln > c.stake_pln ? 'pos' : c.gross_return_pln === 0 ? 'neg' : '';
        return `<tr onclick="showDetails('${c.id}')">
            <td>${c.id}</td>
            <td>${c.date}</td>
            <td>${type}</td>
            <td>${game}</td>
            <td class="num">${fmt(c.stake_pln)}</td>
            <td class="num">${c.combined_odds}</td>
            <td class="num ${returnCls}">${fmt(c.gross_return_pln)}</td>
            <td><span class="tag ${c.status}">${c.status}</span></td>
            <td class="view-link">VIEW &rarr;</td>
        </tr>`;
    }).join('');

    document.getElementById('couponCount').textContent =
        total > recent.length ? `latest ${recent.length} of ${total}` : `${total} total`;
}

// ===== Selections Performance =====

function renderSelectionsPerformance() {
    const el = document.getElementById('selBody');
    const countEl = document.getElementById('selCount');
    if (!el) return;

    const selections = getAllSelections(betsData);
    const stats = selectionStats(selections);
    if (countEl) countEl.textContent = `${stats.total} legs · ${stats.won + stats.lost} settled`;

    if (stats.total === 0) {
        el.innerHTML = '<div class="calib-note">No selections logged yet.</div>';
        return;
    }

    const oddsBuckets = selectionsByOddsBucket(selections).filter(b => b.n > 0);
    const qualifying = oddsBuckets.filter(b => b.n >= 2 && b.hitRate != null);
    const best = qualifying.length ? qualifying.reduce((a, b) => b.hitRate > a.hitRate ? b : a) : null;
    const worst = qualifying.length ? qualifying.reduce((a, b) => b.hitRate < a.hitRate ? b : a) : null;

    const oddsValues = selections.filter(s => typeof s.odds === 'number');
    const avgOdds = oddsValues.length ? oddsValues.reduce((s, x) => s + x.odds, 0) / oddsValues.length : null;

    const hrCls = stats.hitRate == null ? '' : (stats.hitRate >= 0.55 ? 'pos' : stats.hitRate < 0.45 ? 'neg' : '');
    const cards = [
        { label: 'Selection Hit Rate', info: 'selHitRate', value: stats.hitRate != null ? `${(stats.hitRate * 100).toFixed(0)}%` : '—', cls: hrCls, sub: `${stats.won}W – ${stats.lost}L on legs` },
        { label: 'Avg Leg Odds', info: 'avgOdds', value: avgOdds != null ? avgOdds.toFixed(2) : '—', cls: '', sub: 'across all logged legs' },
        { label: 'Best Bucket', info: 'bestWorst', value: best ? best.label : '—', cls: best ? 'pos' : '', sub: best ? `${(best.hitRate * 100).toFixed(0)}% hit rate (n=${best.n})` : 'not enough data (need n≥2)' },
        { label: 'Worst Bucket', info: 'bestWorst', value: worst ? worst.label : '—', cls: worst ? 'neg' : '', sub: worst ? `${(worst.hitRate * 100).toFixed(0)}% hit rate (n=${worst.n})` : 'not enough data (need n≥2)' }
    ];

    const cardsHTML = `<div class="kpi-row">${cards.map(k => `
        <div class="kpi ${k.cls}">
            <div class="kpi-label click" onclick="calibInfo('${k.info}')">${k.label}</div>
            <div class="kpi-value ${k.cls}">${k.value}</div>
            <div class="kpi-sub">${k.sub}</div>
        </div>`).join('')}</div>`;

    const hrCell = b => b.hitRate == null ? '—' : `<span class="${b.hitRate >= 0.5 ? 'pos' : 'neg'}">${(b.hitRate * 100).toFixed(0)}%</span>`;

    const oddsRows = oddsBuckets.map(b => `
        <tr><td>${b.label}</td><td>${b.n}</td><td>${b.won}–${b.lost}</td><td>${hrCell(b)}</td></tr>`).join('');

    const marketRows = selectionsByMarket(selections).map(m => `
        <tr><td>${m.label}</td><td>${m.n}</td><td>${m.won}–${m.lost}</td><td>${hrCell(m)}</td></tr>`).join('');

    el.innerHTML = `
        ${cardsHTML}
        <div class="perf-tables">
            <div>
                <div class="calib-sub click" onclick="calibInfo('oddsRange')">By odds range</div>
                <table class="calib-table compact">
                    <thead><tr><th>Range</th><th>n</th><th>W–L</th><th>Hit rate</th></tr></thead>
                    <tbody>${oddsRows}</tbody>
                </table>
            </div>
            <div>
                <div class="calib-sub click" onclick="calibInfo('byMarketTbl')">By market</div>
                <table class="calib-table compact">
                    <thead><tr><th>Market</th><th>n</th><th>W–L</th><th>Hit rate</th></tr></thead>
                    <tbody>${marketRows}</tbody>
                </table>
            </div>
        </div>`;
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

// ===== Bet Source =====
// Splits real-money coupons by how the bet came about (Edge's own BET call
// vs. the user's own judgement), so the two can eventually be compared once
// there's a meaningful sample -- see the small-sample note below.

function renderBetSource() {
    const el = document.getElementById('sourceBody');
    const countEl = document.getElementById('sourceCount');
    if (!el) return;

    const coupons = betsData.coupons || [];
    const by = couponsBySource(coupons);
    const total = by.edge.n + by.own.n + by.unknown.n;

    if (countEl) {
        countEl.textContent = `${total} coupons · ${by.edge.n} Edge / ${by.own.n} own`
            + (by.unknown.n > 0 ? ` · ${by.unknown.n} unknown` : '');
    }

    if (total === 0) {
        el.innerHTML = '<div class="calib-note">No coupons logged yet.</div>';
        return;
    }

    const fmtSigned = n => `${n >= 0 ? '+' : ''}${n.toFixed(2)} PLN`;

    const sourceCard = (label, infoKey, g, emptyNote) => {
        if (g.n === 0) {
            return `
                <div class="kpi">
                    <div class="kpi-label click" onclick="calibInfo('${infoKey}')">${label}</div>
                    <div class="kpi-value">—</div>
                    <div class="kpi-sub">${emptyNote}</div>
                </div>`;
        }
        const hitPct = g.hitRate != null ? `${(g.hitRate * 100).toFixed(0)}%` : '—';
        const roiPct = g.roi != null ? `${g.roi >= 0 ? '+' : ''}${(g.roi * 100).toFixed(0)}%` : '—';
        return `
            <div class="kpi">
                <div class="kpi-label click" onclick="calibInfo('${infoKey}')">${label}</div>
                <div class="kpi-value ${g.net >= 0 ? 'pos' : 'neg'}">${fmtSigned(g.net)}</div>
                <div class="kpi-sub">${g.won}W – ${g.lost}L · hit rate ${hitPct}</div>
                <div class="kpi-sub">ROI ${roiPct} · staked ${g.staked.toFixed(2)} PLN</div>
            </div>`;
    };

    const edgeCard = sourceCard('Edge recommendations', 'sourceEdge', by.edge, 'no coupons from Edge recommendations yet');
    const ownCard = sourceCard('Own bets', 'sourceOwn', by.own, 'no coupons from own bets yet');
    const hasUnknown = by.unknown.n > 0;
    const unknownCard = hasUnknown ? `
        <div class="kpi">
            <div class="kpi-label">Unsourced</div>
            <div class="kpi-value ${by.unknown.net >= 0 ? 'pos' : 'neg'}">${fmtSigned(by.unknown.net)}</div>
            <div class="kpi-sub">missing source field</div>
        </div>` : '';

    const sampleN = by.edge.n + by.own.n;
    const smallSampleNote = sampleN < 20
        ? '<div class="calib-note" style="margin-top:8px;">Sample too small for conclusions — this panel collects data, it does not compare performance yet.</div>'
        : '';

    el.innerHTML = `
        <div class="kpi-row ${hasUnknown ? 'cols-3' : 'cols-2'}">${edgeCard}${ownCard}${unknownCard}</div>
        <div class="calib-note" style="margin-top:14px;">Edge ${fmtSigned(by.edge.net)} (${by.edge.n} coupons) · Own ${fmtSigned(by.own.net)} (${by.own.n} coupons)</div>
        ${smallSampleNote}`;
}

// ===== By Game =====

const BY_GAME_LIST = [
    { key: 'cs2', label: 'CS2', primary: true },
    { key: 'lol', label: 'LoL', primary: false },
    { key: 'dota2', label: 'Dota 2', primary: false }
];

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
