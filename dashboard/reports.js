const GITHUB_API_REPORTS = 'https://api.github.com/repos/dgrochowicki/Edge/contents/reports';

// { '2026-07-21': { claude: {url}, gpt: {url} }, '2026-07-16': { single: {url} } }
let reportsByDate = {};
let couponsByDate = {}; // { '2026-07-16': [coupon, ...] }
let currentDate = null;
let currentAgent = null;

document.addEventListener('DOMContentLoaded', init);

const FILENAME_RE = /^(\d{4}-\d{2}-\d{2})(?:-(claude|gpt))?$/;

async function init() {
    try {
        const [filesJson, betsJson] = await Promise.all([
            fetch(GITHUB_API_REPORTS).then(r => r.json()),
            fetchBetsData()
        ]);

        reportsByDate = {};
        (Array.isArray(filesJson) ? filesJson : [])
            .filter(f => f.name.endsWith('.md'))
            .forEach(f => {
                const m = FILENAME_RE.exec(f.name.replace('.md', ''));
                if (!m) return;
                const [, date, agent] = m;
                const day = reportsByDate[date] = reportsByDate[date] || {};
                day[agent || 'single'] = { download_url: f.download_url };
            });

        couponsByDate = {};
        (betsJson.coupons || []).forEach(c => {
            (couponsByDate[c.date] = couponsByDate[c.date] || []).push(c);
        });

        const params = new URLSearchParams(window.location.search);
        const requestedDate = params.get('date');
        const dates = Object.keys(reportsByDate).sort((a, b) => b.localeCompare(a));
        const initialDate = reportsByDate[requestedDate] ? requestedDate : dates[0];

        renderList(initialDate ? initialDate.slice(0, 7) : undefined);
        if (initialDate) selectReport(initialDate, params.get('agent'));

    } catch (err) {
        console.error('Error loading reports:', err);
        document.getElementById('reportList').innerHTML = '<div class="rv-empty" style="padding:16px;">Error loading report list.</div>';
    }
}

function statusDotClass(status) {
    if (status === 'won') return 'won';
    if (status === 'lost') return 'lost';
    if (status === 'void') return 'void';
    return 'pending';
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(monthKey) {
    const [y, m] = monthKey.split('-');
    return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function renderList(expandedMonth) {
    const el = document.getElementById('reportList');
    const dates = Object.keys(reportsByDate).sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) {
        el.innerHTML = '<div class="rv-empty" style="padding:16px;">No reports found.</div>';
        return;
    }

    const months = [];
    const byMonth = {};
    dates.forEach(date => {
        const monthKey = date.slice(0, 7);
        if (!byMonth[monthKey]) { byMonth[monthKey] = []; months.push(monthKey); }
        byMonth[monthKey].push(date);
    });
    if (!expandedMonth) expandedMonth = months[0];

    el.innerHTML = months.map(monthKey => {
        const isOpen = monthKey === expandedMonth;
        const items = byMonth[monthKey].map(date => {
            const coupons = couponsByDate[date] || [];
            const dots = coupons.map(c => `<span class="rl-dot ${statusDotClass(c.status)}">${c.id.replace('EDGE-', '')}</span>`).join('');
            return `<a href="?date=${date}" class="report-list-item" data-date="${date}">
                <div class="rl-date">${date}</div>
                <div class="rl-meta">${dots || '<span style="color:var(--ink-faint);">no coupon</span>'}</div>
            </a>`;
        }).join('');
        return `<div class="report-month${isOpen ? ' open' : ''}" data-month="${monthKey}">
            <button type="button" class="report-month-head">
                <span class="rm-chevron">▸</span>
                <span class="rm-label">${monthLabel(monthKey)}</span>
                <span class="rm-count">${byMonth[monthKey].length}</span>
            </button>
            <div class="report-month-items">${items}</div>
        </div>`;
    }).join('');

    el.querySelectorAll('.report-month-head').forEach(head => {
        head.addEventListener('click', () => {
            head.closest('.report-month').classList.toggle('open');
        });
    });

    el.querySelectorAll('.report-list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const date = item.getAttribute('data-date');
            history.pushState({}, '', `?date=${date}`);
            selectReport(date);
        });
    });
}

async function selectReport(date, preferredAgent) {
    const day = reportsByDate[date];
    currentDate = date;

    document.querySelectorAll('.report-list-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-date') === date);
    });
    const monthGroup = document.querySelector(`.report-month[data-month="${date.slice(0, 7)}"]`);
    if (monthGroup) monthGroup.classList.add('open');

    const view = document.getElementById('reportView');
    if (!day) {
        view.innerHTML = '<div class="rv-empty">No report found for this date.</div>';
        return;
    }

    const agents = Object.keys(day).filter(a => a !== 'single');
    currentAgent = agents.includes(preferredAgent) ? preferredAgent : agents[0] || 'single';

    await renderReport(date, currentAgent, agents);
}

function switchAgent(agent) {
    currentAgent = agent;
    history.pushState({}, '', `?date=${currentDate}&agent=${agent}`);
    const agents = Object.keys(reportsByDate[currentDate]).filter(a => a !== 'single');
    renderReport(currentDate, agent, agents);
}

async function renderReport(date, agent, agents) {
    const view = document.getElementById('reportView');
    view.innerHTML = '<div class="rv-loading">Loading report…</div>';

    const file = reportsByDate[date][agent];
    if (!file) {
        view.innerHTML = '<div class="rv-empty">No report found for this date.</div>';
        return;
    }

    try {
        const res = await fetch(file.download_url);
        const md = await res.text();
        let html = marked.parse(md);

        // Wrap tables in a horizontally-scrolling container so wide report
        // tables (10 columns) scroll internally instead of forcing the page
        // itself to overflow horizontally.
        html = html.replace(/<table>/g, '<div class="table-scroll"><table>');
        html = html.replace(/<\/table>/g, '</table></div>');

        // Highlight BET / PASS decisions
        html = html.replace(/<strong>PASS<\/strong>/g, '<strong class="tag-pass">PASS</strong>');
        html = html.replace(/<strong>BET<\/strong>/g, '<strong class="tag-bet">BET</strong>');
        // Color value percentages (e.g. +5.6%, −4.1%), whether in table cells or plain
        // prose after a bold "Value:" label -- reports don't bold the number itself.
        html = html.replace(/([+\-−]\d+(?:[.,]\d+)?%)/g, (m) => {
            const cls = (m[0] === '-' || m[0] === '−') ? 'val-neg' : 'val-pos';
            return `<span class="${cls}">${m}</span>`;
        });
        // Color risk levels (Ryzyko): a closed Polish vocabulary, safe to match anywhere.
        html = html.replace(/(Bardzo wysokie|Średnio-wysokie|Wysokie|Średnie|Niskie)/gi, (m) => {
            const norm = m.toLowerCase();
            const cls = norm.includes('wysok') ? 'risk-high' : norm.includes('nisk') ? 'risk-low' : 'risk-med';
            return `<span class="${cls}">${m}</span>`;
        });

        const coupons = couponsByDate[date] || [];
        const linkedBar = `
            <div class="report-meta-bar">
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-faint);">${date}</span>
                <div class="linked-coupons">
                    ${coupons.length
                        ? coupons.map(c => `<a href="logs.html?open=${c.id}"><span class="rl-dot ${statusDotClass(c.status)}"></span>${c.id} · ${c.status}</a>`).join('')
                        : '<span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-faint);">no coupon placed this day</span>'}
                </div>
            </div>`;

        const tabsBar = agents.length > 1
            ? `<div class="report-tabs">${agents.map(a => `<span class="report-tab ${a === agent ? 'active' : ''}" onclick="switchAgent('${a}')">${a}</span>`).join('')}</div>`
            : '';

        view.innerHTML = `${linkedBar}${tabsBar}<div class="markdown-body">${html}</div>`;
    } catch (err) {
        console.error('Error loading report file:', err);
        view.innerHTML = '<div class="rv-empty">Error loading this report.</div>';
    }
}
