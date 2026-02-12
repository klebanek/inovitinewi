import { selectionState, editState, getCategoryById, resetEditState } from '../state.js';
import { getHistory, deleteFromHistory, updateHistoryEntry } from '../storage.js';
import { elements, toggleSelection, updateSelectionUI, renderCategoriesSelect } from './ui.js';
import { formatTime, formatDurationReadable } from '../utils.js';

export function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        if (elements.emptyHistory) elements.emptyHistory.style.display = 'block';
        if (elements.exportPanel) elements.exportPanel.style.display = 'none';
        const items = elements.historyList.querySelectorAll('.history-item-wrapper');
        items.forEach(item => item.remove());
        return;
    }

    if (elements.emptyHistory) elements.emptyHistory.style.display = 'none';
    if (elements.exportPanel) elements.exportPanel.style.display = 'flex';

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

        // Category badge
        const categoryColor = entry.categoryColor || '#0d9488';
        const categoryName = entry.categoryName || 'Ogólne';

        // Note preview
        const notePreview = entry.note ? `
            <div class="history-item-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                ${entry.note.length > 50 ? entry.note.substring(0, 50) + '...' : entry.note}
            </div>
        ` : '';

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
                        <div class="history-item-title">
                            <span class="history-item-date">${dateStr}</span>
                            <span class="history-item-category" style="background: ${categoryColor}">${categoryName}</span>
                        </div>
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
                    ${notePreview}
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
                // Also remove from selection if needed
                if (selectionState.selectedIndices.has(index)) {
                   selectionState.selectedIndices.delete(index);
                }
                // Re-calculate selection indices since array shifted?
                // The original code handled shifting:
                // "const newSelected = new Set(); selectionState.selectedIndices.forEach(i => { if (i > index) { newSelected.add(i - 1); } else { newSelected.add(i); } }); selectionState.selectedIndices = newSelected;"
                // But `deleteFromHistory` in `storage.js` just deletes.
                // I need to implement index shifting in `history.js` or `storage.js` for selection state.
                // But selection state is in `state.js`.
                // Actually `deleteFromHistory` function in `storage.js` only modifies local storage array.
                // The caller should handle selection update.
                // Let's copy the logic from original `app.js` to here.

                const newSelected = new Set();
                selectionState.selectedIndices.forEach(i => {
                    if (i > index) {
                        newSelected.add(i - 1);
                    } else if (i < index) {
                        newSelected.add(i);
                    }
                });
                selectionState.selectedIndices.clear();
                newSelected.forEach(i => selectionState.selectedIndices.add(i));

                renderHistory();
            }
        });
    });

    updateSelectionUI();
}

export function selectAll() {
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

// ===== EDIT MODAL FUNCTIONS =====
export function openEditModal(index) {
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

    // Set note
    if (elements.editNote) {
        elements.editNote.value = entry.note || '';
    }

    // Set category
    if (elements.editCategory) {
        renderCategoriesSelect(elements.editCategory, entry.categoryId || 'default');
    }

    // Set breaks
    editState.editBreaks = entry.breaks ? entry.breaks.map(b => ({
        start: new Date(b.start),
        end: new Date(b.end)
    })) : [];

    renderEditBreaks();

    elements.editModal.classList.add('active');
}

export function closeEditModal() {
    elements.editModal.classList.remove('active');
    resetEditState();
}

export function renderEditBreaks() {
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

export function addNewBreak() {
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

export function saveEdit() {
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

    // Get note and category
    const note = elements.editNote ? elements.editNote.value : (entry.note || '');
    const categoryId = elements.editCategory ? elements.editCategory.value : (entry.categoryId || 'default');
    const category = getCategoryById(categoryId);

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
        note: note,
        categoryId: categoryId,
        categoryName: category.name,
        categoryColor: category.color,
        modifiedAt: Date.now()
    };

    updateHistoryEntry(index, updatedEntry);
    closeEditModal();
    renderHistory();
}
