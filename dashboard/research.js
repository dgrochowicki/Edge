let betsData = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBets();
});

async function loadBets() {
    try {
        betsData = await fetchBetsData();
        // TODO(stage-3): wire up renderCalibration/renderDisciplineMonitor/renderByGame here.
    } catch (error) {
        console.error('Error loading bets:', error);
    }
}
