const GITHUB_API_REPORTS = 'https://api.github.com/repos/dgrochowicki/Edge/contents/reports';
const GITHUB_RAW_BETS = 'https://raw.githubusercontent.com/dgrochowicki/Edge/main/data/bets.json';

let reportFiles = [];   // [{date, download_url}]
let couponsByDate = {}; // { '2026-07-16': [coupon, ...] }

document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const [filesRes, betsRes] = await Promise.all([
            fetch(GITHUB_API_REPORTS),
            fetch(GITHUB_RAW_BETS)
        ]);

        const filesJson = await filesRes.json();
        reportFiles = (Array.isArray(filesJson) ? filesJson : [])
            .filter(f => f.name.endsWith('.md'))
            .map(f => ({ date: f.name.replace('.md', ''), download_url: f.download_url }))
            .sort((a, b) => b.date.localeCompare(a.date));

        const betsJson = await betsRes.json();
        couponsByDate = {};
        (betsJson.coupons || []).forEach(c => {
            (couponsByDate[c.date] = couponsByDate[c.date] || []).push(c);
        });

        renderList();

        const params = new URLSearchParams(window.location.search);
        const requestedDate = params.get('date');
        const initial = reportFiles.find(f => f.date === requestedDate) || reportFiles[0];
        if (initial) selectReport(initial.date);

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

function renderList() {
    const el = document.getElementById('reportList');
    if (reportFiles.length === 0) {
        el.innerHTML = '<div class="rv-empty" style="padding:16px;">No reports found.</div>';
        return;
    }
    el.innerHTML = reportFiles.map(f => {
        const coupons = couponsByDate[f.date] || [];
        const dots = coupons.map(c => `<span class="rl-dot ${statusDotClass(c.status)}">${c.id.replace('EDGE-', '')}</span>`).join('');
        return `<a href="?date=${f.date}" class="report-list-item" data-date="${f.date}">
            <div class="rl-date">${f.date}</div>
            <div class="rl-meta">${dots || '<span style="color:var(--ink-faint);">no coupon</span>'}</div>
        </a>`;
    }).join('');

    el.querySelectorAll('.report-list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const date = item.getAttribute('data-date');
            history.pushState({}, '', `?date=${date}`);
            selectReport(date);
        });
    });
}

async function selectReport(date) {
    document.querySelectorAll('.report-list-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-date') === date);
    });

    const view = document.getElementById('reportView');
    view.innerHTML = '<div class="rv-loading">Loading report…</div>';

    const file = reportFiles.find(f => f.date === date);
    if (!file) {
        view.innerHTML = '<div class="rv-empty">No report found for this date.</div>';
        return;
    }

    try {
        const res = await fetch(file.download_url);
        const md = await res.text();
        let html = marked.parse(md);

        // Highlight BET / PASS decisions
        html = html.replace(/<strong>PASS<\/strong>/g, '<strong class="tag-pass">PASS</strong>');
        html = html.replace(/<strong>BET<\/strong>/g, '<strong class="tag-bet">BET</strong>');
        // Color value percentages, e.g. <strong>+18.6%</strong> or <strong>−5.7%</strong>
        html = html.replace(/<strong>(\+[\d.]+%)<\/strong>/g, '<strong class="val-pos">$1</strong>');
        html = html.replace(/<strong>([−-][\d.]+%)<\/strong>/g, '<strong class="val-neg">$1</strong>');

        const coupons = couponsByDate[date] || [];
        const linkedBar = `
            <div class="report-meta-bar">
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-faint);">${date}</span>
                <div class="linked-coupons">
                    ${coupons.length
                        ? coupons.map(c => `<a href="../index.html?open=${c.id}">${c.id} · ${c.status}</a>`).join('')
                        : '<span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-faint);">no coupon placed this day</span>'}
                </div>
            </div>`;

        view.innerHTML = `${linkedBar}<div class="markdown-body">${html}</div>`;
    } catch (err) {
        console.error('Error loading report file:', err);
        view.innerHTML = '<div class="rv-empty">Error loading this report.</div>';
    }
}
