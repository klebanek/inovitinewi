import { state, settings, getCategoryById, resetState } from '../state.js';
import { saveState, saveToHistory, clearState, getHistory } from '../storage.js';
import { elements, showScreen, updateStatus, updateDates, updateStartButtonState, renderCategoriesSelect } from './ui.js';
import { formatTime, formatDuration, formatDurationReadable, showToast, formatDate } from '../utils.js';

// ===== TIMER FUNCTIONS =====
export function updateTimerDisplay() {
    const elapsed = calculateWorkTime();
    const formatted = formatDuration(elapsed);
    elements.hours.textContent = formatted.hours;
    elements.minutes.textContent = formatted.minutes;
    elements.seconds.textContent = formatted.seconds;
}

export function updateBreakTimerDisplay() {
    if (!state.isOnBreak || !state.currentBreakStart) return;

    const elapsed = Date.now() - state.currentBreakStart;
    const formatted = formatDuration(elapsed);
    elements.breakHours.textContent = formatted.hours;
    elements.breakMinutes.textContent = formatted.minutes;
    elements.breakSeconds.textContent = formatted.seconds;
}

export function startTimers() {
    stopTimers();

    state.timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();

    if (state.isOnBreak) {
        state.breakTimerInterval = setInterval(updateBreakTimerDisplay, 1000);
        updateBreakTimerDisplay();
    }
}

export function stopTimers() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    if (state.breakTimerInterval) {
        clearInterval(state.breakTimerInterval);
        state.breakTimerInterval = null;
    }
}

// ===== BREAKS LIST =====
export function updateBreaksList() {
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
export function updateUIForWorkState() {
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
export function startWork() {
    // If already working, just go back to timer screen
    if (state.isWorking) {
        updateUIForWorkState();
        return;
    }

    state.isWorking = true;
    state.workStartTime = Date.now();
    state.workEndTime = null;
    state.currentBreakStart = null;
    state.breaks = [];
    state.isOnBreak = false;
    state.note = '';
    state.categoryId = elements.workCategory ? elements.workCategory.value : 'default';
    state.lastBreakReminder = null;

    saveState();
    updateUIForWorkState();
    scheduleBreakReminder();
    requestNotificationPermission();
}

export function endWork() {
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
    clearBreakReminder();

    // Get note from input if available
    if (elements.workNote) {
        state.note = elements.workNote.value || '';
    }

    const totalWorkTime = calculateWorkTime();
    const category = getCategoryById(state.categoryId);

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
        totalBreakTimeMs: calculateTotalBreakTime(),
        note: state.note,
        categoryId: state.categoryId,
        categoryName: category.name,
        categoryColor: category.color
    };
    saveToHistory(historyEntry);

    clearState();

    showSummary();
}

// ===== BREAK CONTROLS =====
export function startBreak() {
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

    clearBreakReminder();
    saveState();
}

export function endBreak() {
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
    scheduleBreakReminder();
}

// ===== SUMMARY =====
export function showSummary() {
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

export function resetApp() {
    stopTimers();
    clearBreakReminder();

    resetState();
    clearState(); // Storage

    elements.hours.textContent = '00';
    elements.minutes.textContent = '00';
    elements.seconds.textContent = '00';

    elements.breakTimerSection.style.display = 'none';
    elements.breaksList.style.display = 'none';

    // Reset note and category inputs
    if (elements.workNote) {
        elements.workNote.value = '';
    }
    if (elements.workCategory) {
        renderCategoriesSelect(elements.workCategory, 'default');
    }

    updateDates();
    updateStartButtonState();

    showScreen(elements.welcomeScreen);
}

// ===== BREAK REMINDER =====
export function scheduleBreakReminder() {
    clearBreakReminder();

    if (!settings.breakReminderEnabled || !state.isWorking || state.isOnBreak) {
        return;
    }

    const intervalMs = settings.breakReminderInterval * 60 * 1000;
    const now = Date.now();

    // Calculate when the last break ended or work started
    let lastBreakEnd = state.workStartTime;
    if (state.breaks.length > 0) {
        lastBreakEnd = Math.max(...state.breaks.map(b => b.end));
    }

    const timeSinceBreak = now - lastBreakEnd;
    const timeUntilReminder = intervalMs - timeSinceBreak;

    if (timeUntilReminder <= 0) {
        // Should remind now
        showBreakReminder();
    } else {
        // Schedule for later
        state.breakReminderTimeout = setTimeout(showBreakReminder, timeUntilReminder);
    }
}

export function clearBreakReminder() {
    if (state.breakReminderTimeout) {
        clearTimeout(state.breakReminderTimeout);
        state.breakReminderTimeout = null;
    }
}

export function showBreakReminder() {
    if (!state.isWorking || state.isOnBreak) return;

    // Check if browser supports notifications
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('INOVIT - Przypomnienie', {
            body: 'Czas na przerwę! Pracujesz już ' + settings.breakReminderInterval + ' minut.',
            icon: 'icon-192.png',
            tag: 'break-reminder'
        });
    }

    // Also show in-app toast
    showToast('Czas na przerwę! Pracujesz już ' + settings.breakReminderInterval + ' minut.', 'warning');

    // Schedule next reminder
    state.lastBreakReminder = Date.now();
    saveState();
    scheduleBreakReminder();
}

export function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ===== UTILS =====
export function calculateTotalBreakTime() {
    return state.breaks.reduce((total, breakItem) => {
        return total + (breakItem.end - breakItem.start);
    }, 0);
}

export function calculateWorkTime() {
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
