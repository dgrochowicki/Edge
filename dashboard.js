// Fetch and parse bets data from GitHub
const GITHUB_API_URL = 'https://api.github.com/repos/dgrochowicki/Edge/contents/data/bets.json';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/dgrochowicki/Edge/main/data/bets.json';

let allBets = [];
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
        const data = await response.json();
        allBets = data.bets || [];
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
    const totals = calculateTotals();
    
    document.getElementById('netResult').textContent = `${totals.netResult.toFixed(3)} PLN`;
    document.getElementById('netResult').className = totals.netResult < 0 ? 'value negative' : 'value positive';
    
    document.getElementById('roi').textContent = `${totals.roi.toFixed(1)}%`;
    document.getElementById('roi').className = totals.roi < 0 ? 'value negative' : 'value positive';
    
    document.getElementById('hitRate').textContent = `${totals.hitRate.toFixed(1)}%`;
    document.getElementById('totalStaked').textContent = `${totals.totalStaked.toFixed(2)} PLN`;
}

function calculateTotals() {
    let totalStaked = 0;
    let totalReturn = 0;
    let won = 0;
    let total = 0;

    allBets.forEach(bet => {
        totalStaked += bet.stake || 0;
        totalReturn += bet.return || 0;
        if (bet.result === 'won') won++;
        total++;
    });

    const netResult = totalReturn - totalStaked;
    const roi = totalStaked > 0 ? (netResult / totalStaked) * 100 : 0;
    const hitRate = total > 0 ? (won / total) * 100 : 0;

    return { totalStaked, netResult, roi, hitRate };
}

function renderCharts() {
    const roiCtx = document.getElementById('roiChart').getContext('2d');
    const winLossCtx = document.getElementById('winLossChart').getContext('2d');

    // ROI Trend Chart
    const roiData = allBets.map(bet => {
        return (bet.return - bet.stake);
    });

    const cumulativeROI = [];
    let cumulative = 0;
    roiData.forEach(value => {
        cumulative += value;
        cumulativeROI.push(cumulative);
    });

    if (roiChart) roiChart.destroy();
    roiChart = new Chart(roiCtx, {
        type: 'line',
        data: {
            labels: allBets.map((_, i) => `EDGE-${String(i + 1).padStart(3, '0')}`),
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
    const won = allBets.filter(b => b.result === 'won').length;
    const lost = allBets.filter(b => b.result === 'lost').length;
    const voided = allBets.filter(b => b.result === 'void').length;

    if (winLossChart) winLossChart.destroy();
    winLossChart = new Chart(winLossCtx, {
        type: 'doughnut',
        data: {
            labels: ['Won', 'Lost', 'Voided'],
            datasets: [{
                data: [won, lost, voided],
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

    allBets.forEach((bet, index) => {
        const row = document.createElement('tr');
        const roi = bet.stake > 0 ? (((bet.return - bet.stake) / bet.stake) * 100).toFixed(1) : '0.0';
        const statusClass = `status-${bet.result}`;

        row.innerHTML = `
            <td>EDGE-${String(index + 1).padStart(3, '0')}</td>
            <td>${bet.date || 'N/A'}</td>
            <td>${bet.stake.toFixed(2)} PLN</td>
            <td>${bet.return.toFixed(3)} PLN</td>
            <td class="${statusClass}">${bet.result.toUpperCase()}</td>
            <td>${roi}%</td>
            <td><button class="btn" onclick="showDetails(${index})">View</button></td>
        `;

        tbody.appendChild(row);
    });
}

function showDetails(index) {
    const bet = allBets[index];
    const modal = document.getElementById('modal');
    
    document.getElementById('modalTitle').textContent = `EDGE-${String(index + 1).padStart(3, '0')} Details`;
    
    let selectionsHTML = '';
    if (bet.selections && Array.isArray(bet.selections)) {
        selectionsHTML = bet.selections.map(sel => `
            <div class="selection">
                <strong>${sel.match || 'N/A'}</strong><br>
                Pick: ${sel.pick || 'N/A'} @ ${sel.odds || 'N/A'}<br>
                Result: ${sel.result || 'N/A'}
            </div>
        `).join('');
    }

    document.getElementById('modalBody').innerHTML = `
        <p><strong>Date:</strong> ${bet.date || 'N/A'}</p>
        <p><strong>Stake:</strong> ${bet.stake.toFixed(2)} PLN</p>
        <p><strong>Combined Odds:</strong> ${bet.odds || 'N/A'}</p>
        <p><strong>Return:</strong> ${bet.return.toFixed(3)} PLN</p>
        <p><strong>Result:</strong> <span class="status-${bet.result}">${bet.result.toUpperCase()}</span></p>
        <p><strong>Net Result:</strong> ${(bet.return - bet.stake).toFixed(3)} PLN</p>
        <hr style="border-color: #30363d; margin: 15px 0;">
        <h3 style="color: #58a6ff; margin-bottom: 10px;">Selections</h3>
        ${selectionsHTML || '<p>No selections recorded</p>'}
        ${bet.notes ? `<hr style="border-color: #30363d; margin: 15px 0;"><p><strong>Notes:</strong> ${bet.notes}</p>` : ''}
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
