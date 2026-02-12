import { loadState, loadSettings, loadCategories, clearState, saveState } from './storage.js';
import { state, resetState, selectionState, statsState } from './state.js';
import {
    initElements, updateDates, showScreen, renderCategoriesSelect, elements,
    toggleSelection
} from './modules/ui.js';
import {
    startWork, endWork, startBreak, endBreak, resetApp,
    updateUIForWorkState, scheduleBreakReminder
} from './modules/timer.js';
import {
    renderHistory, selectAll, saveEdit, closeEditModal, addNewBreak,
    openEditModal
} from './modules/history.js';
import {
    renderStatistics, renderStatsCategorySelect, calculateStatistics
} from './modules/statistics.js';
import {
    openSettingsModal, closeSettingsModal, saveSettingsFromModal, addCategory,
    renderCategoriesList
} from './modules/settings.js';
import {
    exportToExcel, exportDatabaseJSON, importDatabaseJSON
} from './modules/export.js';
import { showToast } from './utils.js';

// ===== RESTORE SESSION =====
function restoreSession() {
    const hasState = loadState();

    if (hasState && state.isWorking && state.workStartTime) {
        const savedDate = new Date(state.workStartTime).toDateString();
        const today = new Date().toDateString();

        if (savedDate === today) {
            // Restore note and category to UI
            if (elements.workNote) {
                elements.workNote.value = state.note || '';
            }
            if (elements.workCategory) {
                renderCategoriesSelect(elements.workCategory, state.categoryId);
            }

            updateUIForWorkState();
            scheduleBreakReminder();
            return true;
        } else {
            clearState();
            resetState();
        }
    } else if (hasState) {
        // State exists but not working (maybe stuck?). Just clear it if not valid.
        // Actually loadState returns true if any state was loaded.
        // If not working, we just start fresh but keep settings/categories (they are separate keys).
        // If state has isWorking=false, it means we are at welcome screen usually.
    }
    return false;
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Timer controls
    if (elements.startWorkBtn) elements.startWorkBtn.addEventListener('click', startWork);
    if (elements.endWorkBtn) elements.endWorkBtn.addEventListener('click', endWork);
    if (elements.startBreakBtn) elements.startBreakBtn.addEventListener('click', startBreak);
    if (elements.endBreakBtn) elements.endBreakBtn.addEventListener('click', endBreak);
    if (elements.newDayBtn) elements.newDayBtn.addEventListener('click', resetApp);

    // Navigation
    if (elements.showHistoryBtn) elements.showHistoryBtn.addEventListener('click', () => {
        selectionState.selectedIndices.clear();
        renderHistory();
        showScreen(elements.historyScreen);
    });

    if (elements.backFromHistoryBtn) elements.backFromHistoryBtn.addEventListener('click', () => {
        showScreen(elements.welcomeScreen);
    });

    if (elements.backFromTimerBtn) elements.backFromTimerBtn.addEventListener('click', () => {
        showScreen(elements.welcomeScreen);
    });

    if (elements.showStatsBtn) elements.showStatsBtn.addEventListener('click', () => {
        // Default to month/all
        statsState.period = 'month';
        statsState.categoryId = 'all';

        // Reset UI
        if (elements.statsPeriodBtns) {
            elements.statsPeriodBtns.forEach(b => b.classList.remove('active'));
            const monthBtn = document.querySelector('.period-btn[data-period="month"]');
            if (monthBtn) monthBtn.classList.add('active');
        }

        renderStatsCategorySelect();
        if (elements.statsCategory) {
            elements.statsCategory.value = 'all';
        }

        renderStatistics('month', 'all');
        showScreen(elements.statsScreen);
    });

    if (elements.backFromStatsBtn) elements.backFromStatsBtn.addEventListener('click', () => {
        showScreen(elements.welcomeScreen);
    });

    // Stats filters
    if (elements.statsPeriodBtns) {
        elements.statsPeriodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.statsPeriodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderStatistics(btn.dataset.period, statsState.categoryId);
            });
        });
    }

    if (elements.statsCategory) {
        elements.statsCategory.addEventListener('change', () => {
             renderStatistics(statsState.period, elements.statsCategory.value);
        });
    }

    // Export / Import
    if (elements.selectAllCheckbox) elements.selectAllCheckbox.addEventListener('change', selectAll);
    if (elements.exportExcelBtn) elements.exportExcelBtn.addEventListener('click', exportToExcel);
    if (elements.exportJsonBtn) elements.exportJsonBtn.addEventListener('click', exportDatabaseJSON);
    if (elements.importJsonInput) {
        elements.importJsonInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await importDatabaseJSON(file);
                    renderHistory();
                    renderCategoriesSelect(elements.workCategory, state.categoryId);
                } catch (err) {
                    console.error('Import error:', err);
                }
                e.target.value = '';
            }
        });
    }

    // Modal Edit
    if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', closeEditModal);
    if (elements.cancelEditBtn) elements.cancelEditBtn.addEventListener('click', closeEditModal);
    if (elements.saveEditBtn) elements.saveEditBtn.addEventListener('click', saveEdit);
    if (elements.addBreakBtn) elements.addBreakBtn.addEventListener('click', addNewBreak);

    // Settings
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', openSettingsModal);
    if (elements.closeSettingsBtn) elements.closeSettingsBtn.addEventListener('click', closeSettingsModal);
    if (elements.saveSettingsBtn) elements.saveSettingsBtn.addEventListener('click', saveSettingsFromModal);
    if (elements.addCategoryBtn) elements.addCategoryBtn.addEventListener('click', () => {
        const name = prompt('Nazwa kategorii:');
        if (name && name.trim()) {
            const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
            addCategory(name.trim(), color);
            renderCategoriesList();
            renderCategoriesSelect(elements.workCategory, state.categoryId);
            renderCategoriesSelect(elements.editCategory);
        }
    });

    // Inputs
    if (elements.workNote) {
        elements.workNote.addEventListener('input', () => {
            state.note = elements.workNote.value;
            saveState();
        });
    }

    if (elements.workCategory) {
        elements.workCategory.addEventListener('change', () => {
            state.categoryId = elements.workCategory.value;
            saveState();
        });
    }

    // Global Modals
    if (elements.editModal) {
        const backdrop = elements.editModal.querySelector('.modal-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeEditModal);
    }
    if (elements.settingsModal) {
        const backdrop = elements.settingsModal.querySelector('.modal-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeSettingsModal);
    }
}

// ===== INIT =====
function init() {
    initElements();
    loadSettings();
    loadCategories();

    updateDates();
    initEventListeners();

    renderCategoriesSelect(elements.workCategory, state.categoryId);

    const restored = restoreSession();
    if (!restored) {
        showScreen(elements.welcomeScreen);
    }

    setInterval(updateDates, 60000);

    // Register SW
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    }

    // Hide Splash
    if (elements.splashScreen) {
        setTimeout(() => {
            elements.splashScreen.classList.add('hidden');
            setTimeout(() => {
                elements.splashScreen.style.display = 'none';
            }, 500);
        }, 2200);
    }
}

document.addEventListener('DOMContentLoaded', init);
