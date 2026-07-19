// Shared bets.json fetch — used by dashboard.js, logs.js and reports.js.
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/dgrochowicki/Edge/main/data/bets.json';

async function fetchBetsData() {
    const response = await fetch(GITHUB_RAW_URL);
    return response.json();
}
