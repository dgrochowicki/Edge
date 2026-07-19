// Fetch and parse bets data from GitHub
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/dgrochowicki/Edge/main/data/bets.json';

const RECENT_LIMIT = 6;

let betsData = null;
let roiChart = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBets();
    setupModalHandlers();
});

async function loadBets() {
    try {
        const response = await fetch(GITHUB_RAW_URL);
        betsData = await response.json();
        renderDashboard();
    } catch (error) {
        console.error('Error loading bets:', error);
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="8">Error loading data</td></tr>';
    }
}

function fmt(n, d = 2) { return Number(n).toFixed(d); }

function renderDashboard() {
    buildKPIs();
    renderCharts();
    renderCalibration();
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
    const settledCount = s.coupons - s.pending;
    const hitRate = settledCount > 0 ? (s.won / settledCount * 100).toFixed(0) : '0';

    const streak = computeStreak(betsData.coupons);
    const streakCls = streak.type === 'won' ? 'pos' : streak.type === 'lost' ? 'neg' : '';
    const streakValue = streak.count > 0 ? `${streak.count}${streak.type === 'won' ? 'W' : 'L'}` : '—';
    const streakNoun = streak.type === 'won'
        ? (streak.count === 1 ? 'win' : 'wins')
        : (streak.count === 1 ? 'loss' : 'losses');
    const streakSub = streak.count > 0 ? `${streak.count} ${streakNoun} in a row` : 'no settled coupons yet';

    const kpis = [
        { label: 'Net Result', value: `${s.net_result_pln >= 0 ? '+' : ''}${fmt(s.net_result_pln, 3)} PLN`, cls: s.net_result_pln < 0 ? 'neg' : 'pos', sub: `${fmt(s.total_staked_pln)} PLN staked` },
        { label: 'ROI', value: `${roi >= 0 ? '+' : ''}${roi}%`, cls: roi < 0 ? 'neg' : 'pos', sub: `vs. flat stake baseline` },
        { label: 'Hit Rate', value: `${hitRate}%`, cls: '', sub: `${s.won}W – ${s.lost}L – ${s.voided}V` },
        { label: 'Streak', value: streakValue, cls: streakCls, sub: streakSub }
    ];

    document.getElementById('kpiRow').innerHTML = kpis.map(k => `
        <div class="kpi ${k.cls}">
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-value ${k.cls}">${k.value}</div>
            <div class="kpi-sub">${k.sub}</div>
        </div>`).join('');

    const wonReturned = betsData.coupons.filter(c => c.status === 'won').reduce((sum, c) => sum + c.gross_return_pln, 0);
    const lostStaked = betsData.coupons.filter(c => c.status === 'lost').reduce((sum, c) => sum + c.stake_pln, 0);

    const kpis2 = [
        { label: 'Coupons', value: `${s.coupons}`, cls: '', sub: `${settledCount} settled` },
        { label: 'Won', value: `${s.won}`, cls: 'pos', sub: `${fmt(wonReturned)} PLN returned` },
        { label: 'Lost', value: `${s.lost}`, cls: 'neg', sub: `${fmt(lostStaked)} PLN staked` },
        { label: 'Pending', value: `${s.pending}`, cls: '', sub: `open coupons awaiting result` }
    ];

    document.getElementById('kpiRow2').innerHTML = kpis2.map(k => `
        <div class="kpi ${k.cls}">
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-value ${k.cls}">${k.value}</div>
            <div class="kpi-sub">${k.sub}</div>
        </div>`).join('');
}

function renderCharts() {
    const roiCtx = document.getElementById('roiChart').getContext('2d');

    const settled = betsData.coupons.filter(c => c.status !== 'pending');
    let cumulative = 0;
    const cumulativeData = settled.map(c => { cumulative += c.net_result_pln; return cumulative; });
    const labels = settled.map(c => c.id.replace('EDGE-', ''));

    if (roiChart) roiChart.destroy();
    roiChart = new Chart(roiCtx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: cumulativeData,
                borderColor: '#ff9f1c',
                backgroundColor: 'rgba(255,159,28,0.08)',
                borderWidth: 2,
                tension: 0.25,
                fill: true,
                pointBackgroundColor: '#ff9f1c',
                pointBorderColor: '#0a0b0d',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { color: '#a8abb3', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: '#1c1e23' } },
                x: { ticks: { color: '#a8abb3', font: { family: 'JetBrains Mono', size: 10 } }, grid: { display: false } }
            }
        }
    });

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

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const total = betsData.coupons.length;
    const recent = [...betsData.coupons].reverse().slice(0, RECENT_LIMIT);

    tbody.innerHTML = recent.map(c => {
        const roi = c.stake_pln > 0 ? ((c.net_result_pln / c.stake_pln) * 100).toFixed(1) : '0.0';
        return `<tr onclick="showDetails('${c.id}')">
            <td>${c.id}</td>
            <td>${c.date}</td>
            <td class="num">${fmt(c.stake_pln)}</td>
            <td class="num">${c.combined_odds}</td>
            <td class="num">${fmt(c.gross_return_pln)}</td>
            <td><span class="tag ${c.status}">${c.status}</span></td>
            <td class="num">${roi}%</td>
            <td class="view-link">VIEW &rarr;</td>
        </tr>`;
    }).join('');

    document.getElementById('couponCount').textContent =
        total > recent.length ? `latest ${recent.length} of ${total}` : `${total} total`;
}

function showDetails(couponId) {
    const c = betsData.coupons.find(x => x.id === couponId);
    if (!c) return;

    document.getElementById('modalTitle').textContent = `${c.id} \u00b7 ${c.date}`;

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
        <div class="kv"><span class="k">Potential return</span><span class="v">${fmt(c.potential_return_pln, 3)} PLN</span></div>
        <div class="kv"><span class="k">Net result</span><span class="v">${fmt(c.net_result_pln, 3)} PLN</span></div>
        <div class="selections-title">Selections</div>
        ${selectionsHTML}
        ${reviewHTML}
        <div style="margin-top:16px;">
            <a href="dashboard/reports.html?date=${c.date}" style="font-family:var(--font-mono);font-size:11px;color:var(--edge);text-decoration:none;">Pełny raport dnia →</a>
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
}



// ===== Calibration Lab =====
// Computes Brier vs de-vigged market baseline, calibration buckets and CLV
// from betsData.predictions. Below MIN_SETTLED, per playbook protocol,
// no metrics are shown — only collection progress.

const MIN_SETTLED = 50;

function devig(oddsPick, oddsOpp) {
    if (!oddsPick || !oddsOpp) return null;
    const a = 1 / oddsPick, b = 1 / oddsOpp;
    return a / (a + b);
}

function renderCalibration() {
    const el = document.getElementById('calibBody');
    if (!el) return;
    const preds = betsData.predictions || [];
    const settled = preds.filter(p => p.result === 'won' || p.result === 'lost');
    const pending = preds.filter(p => p.result === 'pending');
    const withClose = preds.filter(p => p.closing_odds && p.market_odds_at_analysis);

    const countEl = document.getElementById('calibCount');
    if (countEl) countEl.textContent = `${preds.length} logged \u00b7 ${settled.length} settled`;

    if (preds.length === 0) {
        el.innerHTML = `<div class="calib-note">No predictions logged yet. The reporting agent appends every analyzed market (BET and PASS) to <span class="mono">data/bets.json \u2192 predictions</span> per the playbook protocol.</div>`;
        return;
    }

    if (settled.length < MIN_SETTLED) {
        const pct = Math.min(100, settled.length / MIN_SETTLED * 100);
        el.innerHTML = `
            <div class="calib-grid">
                <div class="calib-cell"><div class="cl">Logged</div><div class="cv">${preds.length}</div></div>
                <div class="calib-cell"><div class="cl">Settled</div><div class="cv">${settled.length}</div></div>
                <div class="calib-cell"><div class="cl">Pending</div><div class="cv">${pending.length}</div></div>
                <div class="calib-cell"><div class="cl">Closing snapshots</div><div class="cv">${withClose.length}</div></div>
            </div>
            <div class="calib-progress"><div class="calib-progress-fill" style="width:${pct}%"></div></div>
            <div class="calib-note">Data collection phase \u2014 ${settled.length}/${MIN_SETTLED} settled predictions. Per playbook protocol, metrics are not computed below this threshold.${withClose.length === 0 ? ' Closing snapshots: none yet \u2014 currently the biggest gap in the dataset.' : ''}</div>`;
        return;
    }

    const out = p => p.result === 'won' ? 1 : 0;
    const eb = settled.filter(p => typeof p.estimated_probability === 'number');
    const brier = eb.reduce((s, p) => s + Math.pow(p.estimated_probability - out(p), 2), 0) / eb.length;

    const mkt = settled
        .map(p => ({ p, m: devig(p.market_odds_at_analysis, p.market_odds_opponent) }))
        .filter(x => x.m !== null && typeof x.p.estimated_probability === 'number');
    const brierMkt = mkt.length
        ? mkt.reduce((s, x) => s + Math.pow(x.m - out(x.p), 2), 0) / mkt.length
        : null;

    const buckets = {};
    eb.forEach(p => {
        const lo = Math.min(90, Math.floor(p.estimated_probability * 10) * 10);
        buckets[lo] = buckets[lo] || { n: 0, w: 0 };
        buckets[lo].n++;
        buckets[lo].w += out(p);
    });
    const bucketRows = Object.keys(buckets).sort((a, b) => a - b).map(lo => {
        const b = buckets[lo];
        return `<tr><td>${lo}\u2013${Number(lo) + 10}%</td><td>${b.n}</td><td>${(100 * b.w / b.n).toFixed(0)}%</td></tr>`;
    }).join('');

    const clvOf = e => (e.market_odds_at_analysis / e.closing_odds - 1) * 100;
    const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
    const clvAll = withClose.map(clvOf);
    const clvBets = withClose.filter(e => e.decision === 'BET').map(clvOf);
    const beat = clvBets.filter(c => c > 0).length;

    let verdict = '';
    if (brierMkt !== null) {
        const better = brier < brierMkt;
        verdict = `<div class="calib-verdict ${better ? 'pos' : 'neg'}">${better
            ? 'Edge estimates currently beat the de-vigged market baseline.'
            : 'Edge estimates do not beat the market baseline \u2014 fair odds should be anchored to the de-vigged market price.'}</div>`;
    }

    el.innerHTML = `
        <div class="calib-grid">
            <div class="calib-cell"><div class="cl">Brier (Edge)</div><div class="cv">${brier.toFixed(4)}</div></div>
            <div class="calib-cell"><div class="cl">Brier (Market)</div><div class="cv">${brierMkt !== null ? brierMkt.toFixed(4) : '\u2014'}</div></div>
            <div class="calib-cell"><div class="cl">CLV avg (all)</div><div class="cv">${clvAll.length ? (avg(clvAll) >= 0 ? '+' : '') + avg(clvAll).toFixed(2) + '%' : '\u2014'}</div></div>
            <div class="calib-cell"><div class="cl">CLV avg (BET)</div><div class="cv">${clvBets.length ? (avg(clvBets) >= 0 ? '+' : '') + avg(clvBets).toFixed(2) + '%' : '\u2014'}</div></div>
        </div>
        ${clvBets.length ? `<div class="calib-note">BETs beating the close: ${beat}/${clvBets.length}</div>` : ''}
        <table class="calib-table">
            <thead><tr><th>Estimated</th><th>n</th><th>Actual win rate</th></tr></thead>
            <tbody>${bucketRows}</tbody>
        </table>
        ${brierMkt === null ? '<div class="calib-note" style="margin-top:10px;">Market baseline unavailable \u2014 settled entries lack <span class="mono">market_odds_opponent</span>.</div>' : ''}
        ${verdict}`;
}

// Refresh data every 30 seconds
setInterval(() => { loadBets(); }, 30000);
