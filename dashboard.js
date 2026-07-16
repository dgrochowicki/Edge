// Fetch and parse bets data from GitHub
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/dgrochowicki/Edge/main/data/bets.json';

let betsData = null;
let roiChart = null;
let winLossChart = null;

// Initialize dashboard
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
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="7">Error loading data</td></tr>';
    }
}

function renderDashboard() {
    updateSummary();
    renderCharts();
    renderTable();
}

function updateSummary() {
    const summary = betsData.summary;
    
    const netResult = summary.net_result_pln;
    const roi = (summary.roi * 100).toFixed(1);
    const hitRate = summary.coupons > 0 ? (summary.won / summary.coupons * 100).toFixed(1) : 0;
    
    document.getElementById('netResult').textContent = `${netResult.toFixed(3)} PLN`;
    document.getElementById('netResult').className = netResult < 0 ? 'value negative' : 'value positive';
    
    document.getElementById('roi').textContent = `${roi}%`;
    document.getElementById('roi').className = roi < 0 ? 'value negative' : 'value positive';
    
    document.getElementById('hitRate').textContent = `${hitRate}%`;
    document.getElementById('totalStaked').textContent = `${summary.total_staked_pln.toFixed(2)} PLN`;
}

function renderCharts() {
    const roiCtx = document.getElementById('roiChart').getContext('2d');
    const winLossCtx = document.getElementById('winLossChart').getContext('2d');

    // ROI Trend Chart
    const cumulativeROI = [];
    let cumulative = 0;
    
    betsData.coupons.forEach(coupon => {
        cumulative += coupon.net_result_pln;
        cumulativeROI.push(cumulative);
    });

    if (roiChart) roiChart.destroy();
    roiChart = new Chart(roiCtx, {
        type: 'line',
        data: {
            labels: betsData.coupons.map(c => c.id),
            datasets: [{
                label: 'Cumulative Net Result (PLN)',
                data: cumulativeROI,
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88, 166, 255, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#58a6ff',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#c9d1d9' }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#8b949e' },
                    grid: { color: '#30363d' }
                },
                x: {
                    ticks: { color: '#8b949e' },
                    grid: { color: '#30363d' }
                }
            }
        }
    });

    // Win/Loss Pie Chart
    const summary = betsData.summary;

    if (winLossChart) winLossChart.destroy();
    winLossChart = new Chart(winLossCtx, {
        type: 'doughnut',
        data: {
            labels: ['Won', 'Lost', 'Voided'],
            datasets: [{
                data: [summary.won, summary.lost, summary.voided],
                backgroundColor: [
                    '#3fb950',
                    '#f85149',
                    '#d29922'
                ],
                borderColor: '#161b22',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#c9d1d9' }
                }
            }
        }
    });
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    betsData.coupons.forEach((coupon, index) => {
        const row = document.createElement('tr');
        const roi = coupon.stake_pln > 0 ? ((coupon.net_result_pln / coupon.stake_pln) * 100).toFixed(1) : '0.0';
        const statusClass = `status-${coupon.status}`;

        row.innerHTML = `
            <td>${coupon.id}</td>
            <td>${coupon.date}</td>
            <td>${coupon.stake_pln.toFixed(2)} PLN</td>
            <td>${coupon.gross_return_pln.toFixed(3)} PLN</td>
            <td class="${statusClass}">${coupon.status.toUpperCase()}</td>
            <td>${roi}%</td>
            <td><button class="btn" onclick="showDetails('${coupon.id}')">View</button></td>
        `;

        tbody.appendChild(row);
    });
}

function showDetails(couponId) {
    const coupon = betsData.coupons.find(c => c.id === couponId);
    if (!coupon) return;

    const modal = document.getElementById('modal');
    
    document.getElementById('modalTitle').textContent = `${coupon.id} - ${coupon.date}`;
    
    let selectionsHTML = '';
    if (coupon.selections && Array.isArray(coupon.selections)) {
        selectionsHTML = coupon.selections.map(sel => {
            const finalScore = sel.final_score ? `<br>Score: ${sel.final_score}` : '';
            return `
                <div class="selection">
                    <strong>${sel.match}</strong><br>
                    Market: ${sel.market}<br>
                    Pick: ${sel.pick} @ ${sel.odds}${finalScore}<br>
                    Result: <span class="status-${sel.result}">${sel.result.toUpperCase()}</span>
                    ${sel.notes ? `<br><em>${sel.notes}</em>` : ''}
                </div>
            `;
        }).join('');
    }

    const reviewHTML = coupon.review ? `
        <hr style="border-color: #30363d; margin: 15px 0;">
        <h3 style="color: #58a6ff; margin-bottom: 10px;">Review</h3>
        <p><strong>Decision Quality:</strong> ${coupon.review.decision_quality}</p>
        <p><strong>Main Lesson:</strong> ${coupon.review.main_lesson}</p>
        <p><strong>Reason:</strong> ${coupon.review.reason}</p>
    ` : '';

    document.getElementById('modalBody').innerHTML = `
        <p><strong>Type:</strong> ${coupon.type.toUpperCase()}</p>
        <p><strong>Source:</strong> ${coupon.source.replace('_', ' ')}</p>
        <p><strong>Stake:</strong> ${coupon.stake_pln.toFixed(2)} PLN</p>
        <p><strong>Combined Odds:</strong> ${coupon.combined_odds}</p>
        <p><strong>Potential Return:</strong> ${coupon.potential_return_pln.toFixed(3)} PLN</p>
        <p><strong>Gross Return:</strong> ${coupon.gross_return_pln.toFixed(3)} PLN</p>
        <p><strong>Result:</strong> <span class="status-${coupon.status}">${coupon.status.toUpperCase()}</span></p>
        <p><strong>Net Result:</strong> ${coupon.net_result_pln.toFixed(3)} PLN</p>
        <hr style="border-color: #30363d; margin: 15px 0;">
        <h3 style="color: #58a6ff; margin-bottom: 10px;">Selections</h3>
        ${selectionsHTML}
        ${reviewHTML}
    `;
    
    modal.style.display = 'block';
}

function setupModalHandlers() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Refresh data every 30 seconds
setInterval(() => {
    loadBets();
}, 30000);
