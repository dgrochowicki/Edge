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
    const decided = s.won + s.lost;
    const hitRate = decided > 0 ? (s.won / decided * 100).toFixed(0) : '0';

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
    if (n < CAL_T.PRELIM) return { key: 'collection', label: 'Collection', cls: 'stage-col' };
    if (n < CAL_T.EMERG) return { key: 'prelim', label: 'Preliminary signal', cls: 'stage-pre' };
    if (n < CAL_T.VALID) return { key: 'emerg', label: 'Emerging pattern', cls: 'stage-pre' };
    return { key: 'valid', label: 'Validation checkpoint', cls: 'stage-val' };
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
    stage: ['Etapy', 'Collection (0–49 rozliczonych): tylko zbieranie. Preliminary (50–99): wstępne sygnały, zero wniosków. Emerging (100–149): wzorce warte rozmowy. Validation checkpoint (150+): działa zapisany z góry warunek porażki dla Brier. Osobno: checkpoint CLV przy 50 closing snapshotach na BET-ach. Progi zapisano zanim znamy wyniki — żeby nie przesuwać bramek.']
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

function renderCalibration() {
    const el = document.getElementById('calibBody');
    if (!el) return;
    const preds = betsData.predictions || [];
    const countEl = document.getElementById('calibCount');

    if (preds.length === 0) {
        if (countEl) countEl.textContent = '0 logged';
        el.innerHTML = '<div class="calib-note">No predictions logged yet.</div>';
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

    if (countEl) countEl.textContent = `${preds.length} logged \u00b7 ${settledEst.length} settled`;

    const dq = {
        opp: valid.filter(p => p.market_odds_opponent == null).length,
        ts: valid.filter(p => p.odds_timestamp == null).length,
        close: valid.filter(p => p.closing_odds == null).length,
        inv: invalid.length
    };

    let html = `
        <div class="calib-stage ${stage.cls}" onclick="calibInfo('stage')">${stage.label}</div>
        <div class="calib-grid">
            <div class="calib-cell click" onclick="calibInfo('logged')"><div class="cl">Logged</div><div class="cv">${preds.length}</div></div>
            <div class="calib-cell click" onclick="calibInfo('settled')"><div class="cl">Settled</div><div class="cv">${settledEst.length}<span class="cs">/ ${CAL_T.PRELIM} \u00b7 / ${CAL_T.VALID}</span></div></div>
            <div class="calib-cell click" onclick="calibInfo('paired')"><div class="cl">Paired baseline</div><div class="cv">${paired.length}</div></div>
            <div class="calib-cell click" onclick="calibInfo('snapshots')"><div class="cl">BET closing snaps</div><div class="cv">${snapsBet.length}<span class="cs">/ ${CAL_T.CLV_VALID}</span></div></div>
        </div>
        <div class="calib-progress"><div class="calib-progress-fill" style="width:${Math.min(100, settledEst.length / CAL_T.PRELIM * 100)}%"></div></div>
        <div class="calib-quality click" onclick="calibInfo('quality')">
            data quality \u2014 missing opponent odds: ${dq.opp} \u00b7 unknown timestamps: ${dq.ts} \u00b7 missing closing: ${dq.close} \u00b7 invalid records: ${dq.inv}
        </div>`;

    if (settledEst.length < CAL_T.PRELIM) {
        html += `<div class="calib-note">Collection phase \u2014 ${settledEst.length}/${CAL_T.PRELIM} settled predictions with a probability estimate. Per protocol, metrics are not computed below this threshold.</div>`;
        el.innerHTML = html;
        return;
    }

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
                : 'Validation checkpoint failed: Edge estimates do not beat the market baseline \u2014 per pre-registered condition, fair odds should be anchored to the de-vigged market price.'}</div>`;
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
        <div class="calib-note">Market comparison unavailable \u2014 no settled entries with both market prices. It requires <span class="mono">market_odds_opponent</span> in new entries.</div>`;
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
        return `<tr><td>${lo}\u2013${Number(lo) + 10}%</td><td>${b.n}</td><td>${pred.toFixed(0)}%</td><td>${act.toFixed(0)}%</td><td class="${gap < 0 ? 'neg' : 'pos'}">${gap >= 0 ? '+' : ''}${gap.toFixed(0)} pp</td></tr>`;
    }).join('');
    html += pairBlock + `
        <table class="calib-table click" onclick="calibInfo('buckets')">
            <thead><tr><th>Estimated</th><th>n</th><th>Mean predicted</th><th>Actual</th><th>Gap</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;

    el.innerHTML = html;
    renderClv(el, snapsBet);
}

function renderClv(el, snapsBet) {
    const clv = e => (e.market_odds_at_analysis / e.closing_odds - 1) * 100;
    let block = '<div class="calib-sub click" onclick="calibInfo(\'clv\')">Closing Line Value</div>';
    if (snapsBet.length === 0) {
        block += '<div class="calib-note">No BET closing snapshots yet (independent of settlement count \u2014 snapshot before each BET match).</div>';
    } else {
        const vals = snapsBet.map(clv).sort((a, b) => a - b);
        const avg = vals.reduce((s, x) => s + x, 0) / vals.length;
        const med = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
        const beat = vals.filter(c => c > 0).length;
        block += `<div class="calib-note">n=${vals.length} \u00b7 avg ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}% \u00b7 median ${med >= 0 ? '+' : ''}${med.toFixed(2)}% \u00b7 beat close: ${beat}/${vals.length}</div>`;
        if (snapsBet.length >= CAL_T.CLV_VALID) {
            block += `<div class="calib-verdict ${avg > 0 ? 'pos' : 'neg'}">${avg > 0
                ? 'CLV validation checkpoint: average CLV on BETs is positive.'
                : 'CLV validation checkpoint failed: average CLV on BETs is negative \u2014 per pre-registered condition, the selection method is not validated.'}</div>`;
        } else {
            block += `<div class="calib-note">CLV verdict at ${CAL_T.CLV_VALID} snapshots.</div>`;
        }
    }
    el.innerHTML += block;
}

// Refresh data every 30 seconds
setInterval(() => { loadBets(); }, 30000);
