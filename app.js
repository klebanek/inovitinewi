// ===== STORAGE KEYS =====
const STORAGE_KEY = 'elmar_work_session';
const HISTORY_KEY = 'elmar_work_history';

// ===== STATE =====
let state = {
    isWorking: false,
    isOnBreak: false,
    workStartTime: null,
    workEndTime: null,
    currentBreakStart: null,
    breaks: [],
    timerInterval: null,
    breakTimerInterval: null
};

// Edit state
let editState = {
    editingIndex: null,
    editBreaks: []
};

// Selection state
let selectionState = {
    selectedIndices: new Set()
};

// ===== DOM ELEMENTS =====
const elements = {
    // Screens
    welcomeScreen: document.getElementById('welcome-screen'),
    timerScreen: document.getElementById('timer-screen'),
    summaryScreen: document.getElementById('summary-screen'),
    historyScreen: document.getElementById('history-screen'),

    // Welcome
    startWorkBtn: document.getElementById('start-work-btn'),
    showHistoryBtn: document.getElementById('show-history-btn'),
    welcomeDate: document.getElementById('welcome-date'),

    // Timer screen
    workStartDisplay: document.getElementById('work-start-display'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    timerLabel: document.getElementById('timer-label'),

    // Break timer
    breakHours: document.getElementById('break-hours'),
    breakMinutes: document.getElementById('break-minutes'),
    breakSeconds: document.getElementById('break-seconds'),
    breakTimerSection: document.getElementById('break-timer-section'),

    // Status
    statusIndicator: document.getElementById('status-indicator'),
    statusText: document.getElementById('status-text'),

    // Buttons
    endWorkBtn: document.getElementById('end-work-btn'),
    startBreakBtn: document.getElementById('start-break-btn'),
    endBreakBtn: document.getElementById('end-break-btn'),

    // Breaks list
    breaksList: document.getElementById('breaks-list'),
    breaksContainer: document.getElementById('breaks-container'),

    // Dates
    currentDate: document.getElementById('current-date'),

    // Summary
    summaryDate: document.getElementById('summary-date'),
    summaryStartTime: document.getElementById('summary-start-time'),
    summaryEndTime: document.getElementById('summary-end-time'),
    summaryTotalTime: document.getElementById('summary-total-time'),
    summaryBreaks: document.getElementById('summary-breaks'),
    summaryBreaksList: document.getElementById('summary-breaks-list'),
    summaryTotalBreak: document.getElementById('summary-total-break'),
    newDayBtn: document.getElementById('new-day-btn'),

    // History
    historyList: document.getElementById('history-list'),
    emptyHistory: document.getElementById('empty-history'),
    backFromHistoryBtn: document.getElementById('back-from-history-btn'),

    // Export
    exportPanel: document.getElementById('export-panel'),
    selectAllCheckbox: document.getElementById('select-all-checkbox'),
    selectedCount: document.getElementById('selected-count'),
    exportExcelBtn: document.getElementById('export-excel-btn'),

    // Modal
    editModal: document.getElementById('edit-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    saveEditBtn: document.getElementById('save-edit-btn'),
    editDate: document.getElementById('edit-date'),
    editStartTime: document.getElementById('edit-start-time'),
    editEndTime: document.getElementById('edit-end-time'),
    editBreaksList: document.getElementById('edit-breaks-list'),
    addBreakBtn: document.getElementById('add-break-btn')
};

// ===== LOCAL STORAGE FUNCTIONS =====
function saveState() {
    const dataToSave = {
        isWorking: state.isWorking,
        isOnBreak: state.isOnBreak,
        workStartTime: state.workStartTime,
        workEndTime: state.workEndTime,
        currentBreakStart: state.currentBreakStart,
        breaks: state.breaks
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.isWorking = data.isWorking || false;
            state.isOnBreak = data.isOnBreak || false;
            state.workStartTime = data.workStartTime || null;
            state.workEndTime = data.workEndTime || null;
            state.currentBreakStart = data.currentBreakStart || null;
            state.breaks = data.breaks || [];
            return true;
        } catch (e) {
            console.error('Error loading state:', e);
            return false;
        }
    }
    return false;
}

function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}

// ===== HISTORY FUNCTIONS =====
function getHistory() {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function saveToHistory(entry) {
    const history = getHistory();
    history.unshift(entry);
    if (history.length > 100) {
        history.pop();
    }
    saveHistory(history);
}

function updateHistoryEntry(index, updatedEntry) {
    const history = getHistory();
    if (index >= 0 && index < history.length) {
        history[index] = updatedEntry;
        saveHistory(history);
    }
}

function deleteFromHistory(index) {
    const history = getHistory();
    history.splice(index, 1);
    saveHistory(history);
    selectionState.selectedIndices.delete(index);
    // Adjust indices
    const newSelected = new Set();
    selectionState.selectedIndices.forEach(i => {
        if (i > index) {
            newSelected.add(i - 1);
        } else {
            newSelected.add(i);
        }
    });
    selectionState.selectedIndices = newSelected;
    renderHistory();
}

// ===== SELECTION FUNCTIONS =====
function updateSelectionUI() {
    const count = selectionState.selectedIndices.size;
    elements.selectedCount.textContent = `Wybrano: ${count}`;
    elements.exportExcelBtn.disabled = count === 0;

    const history = getHistory();
    elements.selectAllCheckbox.checked = count > 0 && count === history.length;
    elements.selectAllCheckbox.indeterminate = count > 0 && count < history.length;
}

function toggleSelection(index) {
    if (selectionState.selectedIndices.has(index)) {
        selectionState.selectedIndices.delete(index);
    } else {
        selectionState.selectedIndices.add(index);
    }
    updateSelectionUI();
}

function selectAll() {
    const history = getHistory();
    if (selectionState.selectedIndices.size === history.length) {
        // Deselect all
        selectionState.selectedIndices.clear();
    } else {
        // Select all
        history.forEach((_, index) => {
            selectionState.selectedIndices.add(index);
        });
    }
    renderHistory();
}

function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        elements.emptyHistory.style.display = 'block';
        elements.exportPanel.style.display = 'none';
        const items = elements.historyList.querySelectorAll('.history-item-wrapper');
        items.forEach(item => item.remove());
        return;
    }

    elements.emptyHistory.style.display = 'none';
    elements.exportPanel.style.display = 'flex';

    const existingItems = elements.historyList.querySelectorAll('.history-item-wrapper');
    existingItems.forEach(item => item.remove());

    history.forEach((entry, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'history-item-wrapper';

        const dateObj = new Date(entry.workStartTime);
        const dateStr = dateObj.toLocaleDateString('pl-PL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Modified info
        let modifiedHtml = '';
        if (entry.modifiedAt) {
            const modDate = new Date(entry.modifiedAt);
            const modDateStr = modDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
            const modTimeStr = modDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
            modifiedHtml = `
                <div class="history-item-modified">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Modyfikowano: ${modDateStr}, ${modTimeStr}
                </div>
            `;
        }

        const isChecked = selectionState.selectedIndices.has(index);

        wrapper.innerHTML = `
            <div class="history-item-checkbox">
                <label class="checkbox-container">
                    <input type="checkbox" class="item-checkbox" data-index="${index}" ${isChecked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
            </div>
            <div class="history-item-content">
                <div class="history-item">
                    <div class="history-item-header">
                        <span class="history-item-date">${dateStr}</span>
                        <div style="display: flex; align-items: center;">
                            <span class="history-item-total">${entry.totalWorkTime}</span>
                            <button class="history-edit-btn" data-index="${index}" title="Edytuj">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button class="history-delete-btn" data-index="${index}" title="Usuń">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="history-item-details">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            ${entry.startTime} - ${entry.endTime}
                        </span>
                        ${entry.breaksCount > 0 ? `
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="6" y="4" width="4" height="16"/>
                                <rect x="14" y="4" width="4" height="16"/>
                            </svg>
                            ${entry.breaksCount} ${entry.breaksCount === 1 ? 'przerwa' : (entry.breaksCount < 5 ? 'przerwy' : 'przerw')} (${entry.totalBreakTime})
                        </span>
                        ` : ''}
                    </div>
                    ${modifiedHtml}
                </div>
            </div>
        `;

        elements.historyList.appendChild(wrapper);
    });

    // Add checkbox listeners
    const checkboxes = elements.historyList.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = parseInt(checkbox.dataset.index);
            toggleSelection(index);
            // Update just this checkbox visual
            checkbox.checked = selectionState.selectedIndices.has(index);
        });
    });

    // Add edit button listeners
    const editButtons = elements.historyList.querySelectorAll('.history-edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            openEditModal(index);
        });
    });

    // Add delete button listeners
    const deleteButtons = elements.historyList.querySelectorAll('.history-delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (confirm('Czy na pewno chcesz usunąć ten wpis?')) {
                deleteFromHistory(index);
            }
        });
    });

    updateSelectionUI();
}

// ===== EXCEL EXPORT FUNCTIONS =====
function formatDateForExcel(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatBreaksForExcel(breaks) {
    if (!breaks || breaks.length === 0) return '-';
    return breaks.map(b => {
        const start = new Date(b.start).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const end = new Date(b.end).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        return `${start}-${end}`;
    }).join(', ');
}

function msToDecimalHours(ms) {
    return (ms / (1000 * 60 * 60)).toFixed(2);
}

function exportToExcel() {
    const history = getHistory();
    const selectedEntries = [];

    // Get selected entries in chronological order (oldest first)
    const sortedIndices = Array.from(selectionState.selectedIndices).sort((a, b) => b - a);
    sortedIndices.forEach(index => {
        if (history[index]) {
            selectedEntries.push(history[index]);
        }
    });

    if (selectedEntries.length === 0) {
        alert('Nie wybrano żadnych wpisów do eksportu.');
        return;
    }

    // Calculate totals
    let totalWorkMs = 0;
    let totalBreakMs = 0;

    selectedEntries.forEach(entry => {
        totalWorkMs += entry.totalWorkTimeMs || 0;
        totalBreakMs += entry.totalBreakTimeMs || 0;
    });

    // Create CSV content with BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    let csvContent = BOM;

    // Title
    csvContent += 'EWIDENCJA CZASU PRACY - ELMAR\n';
    csvContent += `Data eksportu: ${new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    csvContent += '\n';

    // Headers
    csvContent += 'Data;Dzień tygodnia;Rozpoczęcie;Zakończenie;Przerwy;Czas przerw;Czas pracy\n';

    // Data rows
    selectedEntries.forEach(entry => {
        const date = new Date(entry.workStartTime);
        const dateStr = formatDateForExcel(entry.workStartTime);
        const dayName = date.toLocaleDateString('pl-PL', { weekday: 'long' });
        const breaksStr = formatBreaksForExcel(entry.breaks);
        const breakTime = entry.totalBreakTime || '0m';
        const workTime = entry.totalWorkTime || '0m';

        csvContent += `${dateStr};${dayName};${entry.startTime};${entry.endTime};${breaksStr};${breakTime};${workTime}\n`;
    });

    // Empty row
    csvContent += '\n';

    // Summary
    csvContent += 'PODSUMOWANIE\n';
    csvContent += `Liczba dni;${selectedEntries.length}\n`;
    csvContent += `Łączny czas pracy;${formatDurationReadable(totalWorkMs)}\n`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const today = new Date();
    const fileName = `Ewidencja_Elmar_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ===== EDIT MODAL FUNCTIONS =====
function openEditModal(index) {
    const history = getHistory();
    const entry = history[index];

    if (!entry) return;

    editState.editingIndex = index;

    // Set date
    const dateObj = new Date(entry.workStartTime);
    const dateStr = dateObj.toISOString().split('T')[0];
    elements.editDate.value = dateStr;

    // Set times
    elements.editStartTime.value = entry.startTime;
    elements.editEndTime.value = entry.endTime;

    // Set breaks
    editState.editBreaks = entry.breaks ? entry.breaks.map(b => ({
        start: new Date(b.start),
        end: new Date(b.end)
    })) : [];

    renderEditBreaks();

    elements.editModal.classList.add('active');
}

function closeEditModal() {
    elements.editModal.classList.remove('active');
    editState.editingIndex = null;
    editState.editBreaks = [];
}

function renderEditBreaks() {
    if (editState.editBreaks.length === 0) {
        elements.editBreaksList.innerHTML = '<p class="no-breaks-message">Brak przerw</p>';
        return;
    }

    elements.editBreaksList.innerHTML = editState.editBreaks.map((breakItem, index) => {
        const startTime = breakItem.start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const endTime = breakItem.end.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="edit-break-item" data-index="${index}">
                <input type="time" class="break-start-input" value="${startTime}" data-index="${index}">
                <span>-</span>
                <input type="time" class="break-end-input" value="${endTime}" data-index="${index}">
                <button class="remove-break-btn" data-index="${index}" title="Usuń przerwę">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    // Add listeners for break inputs
    const startInputs = elements.editBreaksList.querySelectorAll('.break-start-input');
    const endInputs = elements.editBreaksList.querySelectorAll('.break-end-input');
    const removeButtons = elements.editBreaksList.querySelectorAll('.remove-break-btn');

    startInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const [hours, minutes] = e.target.value.split(':').map(Number);
            const newDate = new Date(editState.editBreaks[index].start);
            newDate.setHours(hours, minutes, 0, 0);
            editState.editBreaks[index].start = newDate;
        });
    });

    endInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const [hours, minutes] = e.target.value.split(':').map(Number);
            const newDate = new Date(editState.editBreaks[index].end);
            newDate.setHours(hours, minutes, 0, 0);
            editState.editBreaks[index].end = newDate;
        });
    });

    removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            editState.editBreaks.splice(index, 1);
            renderEditBreaks();
        });
    });
}

function addNewBreak() {
    const dateStr = elements.editDate.value;
    const baseDate = new Date(dateStr);

    const startTime = new Date(baseDate);
    startTime.setHours(12, 0, 0, 0);

    const endTime = new Date(baseDate);
    endTime.setHours(12, 30, 0, 0);

    editState.editBreaks.push({
        start: startTime,
        end: endTime
    });

    renderEditBreaks();
}

function saveEdit() {
    const history = getHistory();
    const index = editState.editingIndex;

    if (index === null || index < 0 || index >= history.length) {
        closeEditModal();
        return;
    }

    const entry = history[index];

    const dateStr = elements.editDate.value;
    const [year, month, day] = dateStr.split('-').map(Number);

    const [startHours, startMinutes] = elements.editStartTime.value.split(':').map(Number);
    const newStartTime = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);

    const [endHours, endMinutes] = elements.editEndTime.value.split(':').map(Number);
    const newEndTime = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);

    const updatedBreaks = editState.editBreaks.map(b => {
        const breakStart = new Date(year, month - 1, day,
            b.start.getHours(), b.start.getMinutes(), 0, 0);
        const breakEnd = new Date(year, month - 1, day,
            b.end.getHours(), b.end.getMinutes(), 0, 0);
        return {
            start: breakStart.getTime(),
            end: breakEnd.getTime()
        };
    });

    const totalBreakTimeMs = updatedBreaks.reduce((total, b) => {
        return total + (b.end - b.start);
    }, 0);

    const totalTimeMs = newEndTime.getTime() - newStartTime.getTime();
    const totalWorkTimeMs = totalTimeMs - totalBreakTimeMs;

    const updatedEntry = {
        ...entry,
        workStartTime: newStartTime.getTime(),
        workEndTime: newEndTime.getTime(),
        startTime: formatTime(newStartTime),
        endTime: formatTime(newEndTime),
        breaks: updatedBreaks,
        breaksCount: updatedBreaks.length,
        totalBreakTime: formatDurationReadable(totalBreakTimeMs),
        totalBreakTimeMs: totalBreakTimeMs,
        totalWorkTime: formatDurationReadable(totalWorkTimeMs),
        totalWorkTimeMs: totalWorkTimeMs,
        modifiedAt: Date.now()
    };

    updateHistoryEntry(index, updatedEntry);
    closeEditModal();
    renderHistory();
}

// ===== UTILITY FUNCTIONS =====
function formatTime(date) {
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('pl-PL', options);
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
    };
}

function formatDurationReadable(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

function calculateTotalBreakTime() {
    return state.breaks.reduce((total, breakItem) => {
        return total + (breakItem.end - breakItem.start);
    }, 0);
}

function calculateWorkTime() {
    if (!state.workStartTime) return 0;

    const now = Date.now();
    const endTime = state.workEndTime || now;
    const totalElapsed = endTime - state.workStartTime;
    const completedBreaksTime = calculateTotalBreakTime();

    let currentBreakTime = 0;
    if (state.isOnBreak && state.currentBreakStart) {
        currentBreakTime = now - state.currentBreakStart;
    }

    return Math.max(0, totalElapsed - completedBreaksTime - currentBreakTime);
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screen) {
    elements.welcomeScreen.classList.remove('active');
    elements.timerScreen.classList.remove('active');
    elements.summaryScreen.classList.remove('active');
    elements.historyScreen.classList.remove('active');
    screen.classList.add('active');
}

// ===== TIMER FUNCTIONS =====
function updateTimerDisplay() {
    const elapsed = calculateWorkTime();
    const formatted = formatDuration(elapsed);
    elements.hours.textContent = formatted.hours;
    elements.minutes.textContent = formatted.minutes;
    elements.seconds.textContent = formatted.seconds;
}

function updateBreakTimerDisplay() {
    if (!state.isOnBreak || !state.currentBreakStart) return;

    const elapsed = Date.now() - state.currentBreakStart;
    const formatted = formatDuration(elapsed);
    elements.breakHours.textContent = formatted.hours;
    elements.breakMinutes.textContent = formatted.minutes;
    elements.breakSeconds.textContent = formatted.seconds;
}

function startTimers() {
    stopTimers();

    state.timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();

    if (state.isOnBreak) {
        state.breakTimerInterval = setInterval(updateBreakTimerDisplay, 1000);
        updateBreakTimerDisplay();
    }
}

function stopTimers() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    if (state.breakTimerInterval) {
        clearInterval(state.breakTimerInterval);
        state.breakTimerInterval = null;
    }
}

// ===== STATUS FUNCTIONS =====
function updateStatus(status, text) {
    elements.statusIndicator.className = 'status-indicator';
    if (status) {
        elements.statusIndicator.classList.add(status);
    }
    elements.statusText.textContent = text;
}

// ===== BREAKS LIST =====
function updateBreaksList() {
    if (state.breaks.length === 0) {
        elements.breaksList.style.display = 'none';
        return;
    }

    elements.breaksList.style.display = 'block';
    elements.breaksContainer.innerHTML = state.breaks.map((breakItem, index) => `
        <div class="break-item">
            <span class="break-time">
                ${formatTime(new Date(breakItem.start))} - ${formatTime(new Date(breakItem.end))}
            </span>
            <span class="break-duration">
                ${formatDurationReadable(breakItem.end - breakItem.start)}
            </span>
        </div>
    `).join('');
}

// ===== UI STATE UPDATE =====
function updateUIForWorkState() {
    showScreen(elements.timerScreen);

    if (state.workStartTime) {
        elements.workStartDisplay.textContent = formatTime(new Date(state.workStartTime));
    }

    if (state.isOnBreak) {
        updateStatus('break', 'Na przerwie');
        elements.timerLabel.textContent = 'Przerwa';
        elements.startBreakBtn.disabled = true;
        elements.endBreakBtn.disabled = false;
        elements.breakTimerSection.style.display = 'block';
    } else {
        updateStatus('working', 'W pracy');
        elements.timerLabel.textContent = 'Czas pracy';
        elements.startBreakBtn.disabled = false;
        elements.endBreakBtn.disabled = true;
        elements.breakTimerSection.style.display = 'none';
    }

    updateBreaksList();
    startTimers();
}

// ===== WORK CONTROLS =====
function startWork() {
    state.isWorking = true;
    state.workStartTime = Date.now();
    state.workEndTime = null;
    state.currentBreakStart = null;
    state.breaks = [];
    state.isOnBreak = false;

    saveState();
    updateUIForWorkState();
}

function endWork() {
    if (state.isOnBreak && state.currentBreakStart) {
        state.breaks.push({
            start: state.currentBreakStart,
            end: Date.now()
        });
        state.isOnBreak = false;
        state.currentBreakStart = null;
    }

    state.isWorking = false;
    state.workEndTime = Date.now();

    stopTimers();

    const totalWorkTime = calculateWorkTime();
    const historyEntry = {
        workStartTime: state.workStartTime,
        workEndTime: state.workEndTime,
        startTime: formatTime(new Date(state.workStartTime)),
        endTime: formatTime(new Date(state.workEndTime)),
        totalWorkTime: formatDurationReadable(totalWorkTime),
        totalWorkTimeMs: totalWorkTime,
        breaks: state.breaks,
        breaksCount: state.breaks.length,
        totalBreakTime: formatDurationReadable(calculateTotalBreakTime()),
        totalBreakTimeMs: calculateTotalBreakTime()
    };
    saveToHistory(historyEntry);

    clearState();

    showSummary();
}

// ===== BREAK CONTROLS =====
function startBreak() {
    state.isOnBreak = true;
    state.currentBreakStart = Date.now();

    updateStatus('break', 'Na przerwie');
    elements.timerLabel.textContent = 'Przerwa';

    elements.startBreakBtn.disabled = true;
    elements.endBreakBtn.disabled = false;

    elements.breakTimerSection.style.display = 'block';
    elements.breakHours.textContent = '00';
    elements.breakMinutes.textContent = '00';
    elements.breakSeconds.textContent = '00';

    state.breakTimerInterval = setInterval(updateBreakTimerDisplay, 1000);

    saveState();
}

function endBreak() {
    state.isOnBreak = false;
    const breakEnd = Date.now();

    state.breaks.push({
        start: state.currentBreakStart,
        end: breakEnd
    });

    state.currentBreakStart = null;

    updateStatus('working', 'W pracy');
    elements.timerLabel.textContent = 'Czas pracy';

    elements.startBreakBtn.disabled = false;
    elements.endBreakBtn.disabled = true;

    elements.breakTimerSection.style.display = 'none';

    if (state.breakTimerInterval) {
        clearInterval(state.breakTimerInterval);
        state.breakTimerInterval = null;
    }

    updateBreaksList();
    saveState();
}

// ===== SUMMARY =====
function showSummary() {
    const history = getHistory();
    const latestEntry = history[0];

    if (latestEntry) {
        elements.summaryDate.textContent = formatDate(new Date(latestEntry.workStartTime));
        elements.summaryStartTime.textContent = latestEntry.startTime;
        elements.summaryEndTime.textContent = latestEntry.endTime;
        elements.summaryTotalTime.textContent = latestEntry.totalWorkTime;

        if (latestEntry.breaks && latestEntry.breaks.length > 0) {
            elements.summaryBreaks.style.display = 'block';
            elements.summaryBreaksList.innerHTML = latestEntry.breaks.map(breakItem => `
                <div class="break-item">
                    <span class="break-time">
                        ${formatTime(new Date(breakItem.start))} - ${formatTime(new Date(breakItem.end))}
                    </span>
                    <span class="break-duration">
                        ${formatDurationReadable(breakItem.end - breakItem.start)}
                    </span>
                </div>
            `).join('');
            elements.summaryTotalBreak.textContent = latestEntry.totalBreakTime;
        } else {
            elements.summaryBreaks.style.display = 'none';
        }
    }

    showScreen(elements.summaryScreen);
}

function resetApp() {
    stopTimers();

    state.isWorking = false;
    state.isOnBreak = false;
    state.workStartTime = null;
    state.workEndTime = null;
    state.currentBreakStart = null;
    state.breaks = [];

    clearState();

    elements.hours.textContent = '00';
    elements.minutes.textContent = '00';
    elements.seconds.textContent = '00';

    elements.breakTimerSection.style.display = 'none';
    elements.breaksList.style.display = 'none';

    updateDates();

    showScreen(elements.welcomeScreen);
}

// ===== DATE UPDATES =====
function updateDates() {
    const now = new Date();
    const dateStr = formatDate(now);

    elements.welcomeDate.textContent = dateStr;
    elements.currentDate.textContent = dateStr;
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    elements.startWorkBtn.addEventListener('click', startWork);
    elements.endWorkBtn.addEventListener('click', endWork);
    elements.startBreakBtn.addEventListener('click', startBreak);
    elements.endBreakBtn.addEventListener('click', endBreak);
    elements.newDayBtn.addEventListener('click', resetApp);

    elements.showHistoryBtn.addEventListener('click', () => {
        selectionState.selectedIndices.clear();
        renderHistory();
        showScreen(elements.historyScreen);
    });

    elements.backFromHistoryBtn.addEventListener('click', () => {
        showScreen(elements.welcomeScreen);
    });

    // Export events
    elements.selectAllCheckbox.addEventListener('change', selectAll);
    elements.exportExcelBtn.addEventListener('click', exportToExcel);

    // Modal events
    elements.closeModalBtn.addEventListener('click', closeEditModal);
    elements.cancelEditBtn.addEventListener('click', closeEditModal);
    elements.saveEditBtn.addEventListener('click', saveEdit);
    elements.addBreakBtn.addEventListener('click', addNewBreak);

    // Close modal on backdrop click
    elements.editModal.querySelector('.modal-backdrop').addEventListener('click', closeEditModal);
}

// ===== RESTORE SESSION =====
function restoreSession() {
    const hasState = loadState();

    if (hasState && state.isWorking && state.workStartTime) {
        const savedDate = new Date(state.workStartTime).toDateString();
        const today = new Date().toDateString();

        if (savedDate === today) {
            updateUIForWorkState();
            return true;
        } else {
            clearState();
            state.isWorking = false;
            state.isOnBreak = false;
            state.workStartTime = null;
            state.workEndTime = null;
            state.currentBreakStart = null;
            state.breaks = [];
        }
    }

    return false;
}

// ===== INITIALIZATION =====
function init() {
    updateDates();
    initEventListeners();

    const restored = restoreSession();

    if (!restored) {
        showScreen(elements.welcomeScreen);
    }

    setInterval(updateDates, 60000);
}

document.addEventListener('DOMContentLoaded', init);
