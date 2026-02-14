import { state, selectionState, getCategoryById, categories } from '../state.js';
import { getHistory } from '../storage.js';
import { formatDate, escapeHTML } from '../utils.js';

export const elements = {};

export function initElements() {
    // Screens
    elements.welcomeScreen = document.getElementById('welcome-screen');
    elements.timerScreen = document.getElementById('timer-screen');
    elements.summaryScreen = document.getElementById('summary-screen');
    elements.historyScreen = document.getElementById('history-screen');
    elements.statsScreen = document.getElementById('stats-screen');
    elements.splashScreen = document.getElementById('splash-screen');

    // Welcome
    elements.startWorkBtn = document.getElementById('start-work-btn');
    elements.showHistoryBtn = document.getElementById('show-history-btn');
    elements.showStatsBtn = document.getElementById('show-stats-btn');
    elements.settingsBtn = document.getElementById('settings-btn');
    elements.welcomeDate = document.getElementById('welcome-date');
    elements.workCategory = document.getElementById('work-category');

    // Timer screen
    elements.workStartDisplay = document.getElementById('work-start-display');
    elements.hours = document.getElementById('hours');
    elements.minutes = document.getElementById('minutes');
    elements.seconds = document.getElementById('seconds');
    elements.timerLabel = document.getElementById('timer-label');
    elements.backFromTimerBtn = document.getElementById('back-from-timer-btn');

    // Break timer
    elements.breakHours = document.getElementById('break-hours');
    elements.breakMinutes = document.getElementById('break-minutes');
    elements.breakSeconds = document.getElementById('break-seconds');
    elements.breakTimerSection = document.getElementById('break-timer-section');

    // Status
    elements.statusIndicator = document.getElementById('status-indicator');
    elements.statusText = document.getElementById('status-text');

    // Buttons
    elements.endWorkBtn = document.getElementById('end-work-btn');
    elements.startBreakBtn = document.getElementById('start-break-btn');
    elements.endBreakBtn = document.getElementById('end-break-btn');

    // Breaks list
    elements.breaksList = document.getElementById('breaks-list');
    elements.breaksContainer = document.getElementById('breaks-container');

    // Dates
    elements.currentDate = document.getElementById('current-date');

    // Summary
    elements.summaryDate = document.getElementById('summary-date');
    elements.summaryStartTime = document.getElementById('summary-start-time');
    elements.summaryEndTime = document.getElementById('summary-end-time');
    elements.summaryTotalTime = document.getElementById('summary-total-time');
    elements.summaryBreaks = document.getElementById('summary-breaks');
    elements.summaryBreaksList = document.getElementById('summary-breaks-list');
    elements.summaryTotalBreak = document.getElementById('summary-total-break');
    elements.newDayBtn = document.getElementById('new-day-btn');

    // History
    elements.historyList = document.getElementById('history-list');
    elements.emptyHistory = document.getElementById('empty-history');
    elements.backFromHistoryBtn = document.getElementById('back-from-history-btn');

    // Export
    elements.exportPanel = document.getElementById('export-panel');
    elements.selectAllCheckbox = document.getElementById('select-all-checkbox');
    elements.selectedCount = document.getElementById('selected-count');
    elements.exportExcelBtn = document.getElementById('export-excel-btn');
    elements.exportJsonBtn = document.getElementById('export-json-btn');
    elements.importJsonInput = document.getElementById('import-json-input');

    // Modal Edit
    elements.editModal = document.getElementById('edit-modal');
    elements.closeModalBtn = document.getElementById('close-modal-btn');
    elements.cancelEditBtn = document.getElementById('cancel-edit-btn');
    elements.saveEditBtn = document.getElementById('save-edit-btn');
    elements.editDate = document.getElementById('edit-date');
    elements.editStartTime = document.getElementById('edit-start-time');
    elements.editEndTime = document.getElementById('edit-end-time');
    elements.editBreaksList = document.getElementById('edit-breaks-list');
    elements.addBreakBtn = document.getElementById('add-break-btn');
    elements.editNote = document.getElementById('edit-note');
    elements.editCategory = document.getElementById('edit-category');

    // Stats screen elements
    elements.backFromStatsBtn = document.getElementById('back-from-stats-btn');
    elements.statsPeriodBtns = document.querySelectorAll('.period-btn');
    elements.statsDaysWorked = document.getElementById('stats-days-worked');
    elements.statsTotalWork = document.getElementById('stats-total-work');
    elements.statsAvgWork = document.getElementById('stats-avg-work');
    elements.statsTotalBreak = document.getElementById('stats-total-break');
    elements.statsOvertime = document.getElementById('stats-overtime');
    elements.statsOvertimeCard = document.getElementById('stats-overtime-card');
    elements.statsChart = document.getElementById('stats-chart');
    elements.statsCategory = document.getElementById('stats-category');

    // Note
    elements.workNote = document.getElementById('work-note');

    // Settings
    elements.settingsModal = document.getElementById('settings-modal');
    elements.closeSettingsBtn = document.getElementById('close-settings-btn');
    elements.saveSettingsBtn = document.getElementById('save-settings-btn');
    elements.settingsDailyNorm = document.getElementById('settings-daily-norm');
    elements.settingsBreakReminder = document.getElementById('settings-break-reminder');
    elements.settingsBreakReminderEnabled = document.getElementById('settings-break-reminder-enabled');
    elements.categoriesList = document.getElementById('categories-list');
    elements.addCategoryBtn = document.getElementById('add-category-btn');
}

export function showScreen(screen) {
    if (!screen) return;

    // Deactivate all screens
    [
        elements.welcomeScreen,
        elements.timerScreen,
        elements.summaryScreen,
        elements.historyScreen,
        elements.statsScreen
    ].forEach(s => {
        if (s) s.classList.remove('active');
    });

    // Activate target screen
    screen.classList.add('active');

    // Update start button when showing welcome screen
    if (screen === elements.welcomeScreen) {
        updateStartButtonState();
    }
}

export function updateStatus(status, text) {
    elements.statusIndicator.className = 'status-indicator';
    if (status) {
        elements.statusIndicator.classList.add(status);
    }
    elements.statusText.textContent = text;
}

export function updateDates() {
    const now = new Date();
    const dateStr = formatDate(now);

    if (elements.welcomeDate) elements.welcomeDate.textContent = dateStr;
    if (elements.currentDate) elements.currentDate.textContent = dateStr;
}

export function updateStartButtonState() {
    if (!elements.startWorkBtn) return;

    if (state.isWorking) {
        elements.startWorkBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
            </svg>
            <span>Kontynuuj pracę</span>
        `;
        elements.startWorkBtn.classList.remove('btn-success');
        elements.startWorkBtn.classList.add('btn-primary');
    } else {
        elements.startWorkBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
            </svg>
            <span>Rozpocznij pracę</span>
        `;
        elements.startWorkBtn.classList.remove('btn-primary');
        elements.startWorkBtn.classList.add('btn-success');
    }
}

export function updateSelectionUI() {
    const count = selectionState.selectedIndices.size;
    if (elements.selectedCount) elements.selectedCount.textContent = `Wybrano: ${count}`;
    if (elements.exportExcelBtn) elements.exportExcelBtn.disabled = count === 0;

    const history = getHistory();
    if (elements.selectAllCheckbox) {
        elements.selectAllCheckbox.checked = count > 0 && count === history.length;
        elements.selectAllCheckbox.indeterminate = count > 0 && count < history.length;
    }
}

export function toggleSelection(index) {
    if (selectionState.selectedIndices.has(index)) {
        selectionState.selectedIndices.delete(index);
    } else {
        selectionState.selectedIndices.add(index);
    }
    updateSelectionUI();
}

export function renderCategoriesSelect(selectElement, selectedId = 'default') {
    if (!selectElement) return;
    selectElement.innerHTML = categories.map(c =>
        `<option value="${escapeHTML(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${escapeHTML(c.name)}</option>`
    ).join('');
}
