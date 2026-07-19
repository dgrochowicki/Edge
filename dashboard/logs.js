// Fetch and parse bets data from GitHub
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/dgrochowicki/Edge/main/data/bets.json';

let betsData = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBets();
    setupModalHandlers();
});

async function loadBets() {
    try {
        const response = await fetch(GITHUB_RAW_URL);
        betsData = await response.json();
        renderTable();

        const params = new URLSearchParams(window.location.search);
        const openId = params.get('open');
        if (openId && betsData.coupons.some(c => c.id === openId)) {
            showDetails(openId);
        }
    } catch (error) {
        console.error('Error loading bets:', error);
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="8">Error loading data</td></tr>';
    }
}

function fmt(n, d = 2) { return Number(n).toFixed(d); }

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const all = [...betsData.coupons].reverse();

    tbody.innerHTML = all.map(c => {
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

    document.getElementById('couponCount').textContent = `${all.length} total`;
}

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
        <div class="kv"><span class="k">Potential return</span><span class="v">${fmt(c.potential_return_pln, 3)} PLN</span></div>
        <div class="kv"><span class="k">Net result</span><span class="v">${fmt(c.net_result_pln, 3)} PLN</span></div>
        <div class="selections-title">Selections</div>
        ${selectionsHTML}
        ${reviewHTML}
        <div style="margin-top:16px;">
            <a href="reports.html?date=${c.date}" style="font-family:var(--font-mono);font-size:11px;color:var(--edge);text-decoration:none;">Pełny raport dnia →</a>
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
