import { settings, updateSettings, categories, updateCategories, state } from '../state.js';
import { saveSettingsToStorage, saveCategoriesToStorage } from '../storage.js';
import { elements, renderCategoriesSelect } from './ui.js';
import { showToast } from '../utils.js';
import { scheduleBreakReminder } from './timer.js';

export function renderCategoriesList() {
    if (!elements.categoriesList) return;
    elements.categoriesList.innerHTML = categories.map(c => `
        <div class="category-item" data-id="${c.id}">
            <div class="category-color" style="background: ${c.color}"></div>
            <span class="category-name">${c.name}</span>
            ${c.id !== 'default' ? `
                <button class="delete-category-btn" data-id="${c.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            ` : ''}
        </div>
    `).join('');

    // Add delete listeners
    elements.categoriesList.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Czy na pewno chcesz usunąć tę kategorię?')) {
                deleteCategory(btn.dataset.id);
                renderCategoriesList();
                renderCategoriesSelect(elements.workCategory, state.categoryId);
                renderCategoriesSelect(elements.editCategory);
            }
        });
    });
}

export function addCategory(name, color) {
    const id = 'cat_' + Date.now();
    const newCategories = [...categories, { id, name, color }];
    updateCategories(newCategories);
    saveCategoriesToStorage();
    return id;
}

export function deleteCategory(id) {
    if (id === 'default') return;
    const newCategories = categories.filter(c => c.id !== id);
    updateCategories(newCategories);
    saveCategoriesToStorage();
}

export function openSettingsModal() {
    if (!elements.settingsModal) return;

    if (elements.settingsDailyNorm) {
        elements.settingsDailyNorm.value = settings.dailyNorm;
    }
    if (elements.settingsBreakReminder) {
        elements.settingsBreakReminder.value = settings.breakReminderInterval;
    }
    if (elements.settingsBreakReminderEnabled) {
        elements.settingsBreakReminderEnabled.checked = settings.breakReminderEnabled;
    }

    renderCategoriesList();
    elements.settingsModal.classList.add('active');
}

export function closeSettingsModal() {
    if (elements.settingsModal) {
        elements.settingsModal.classList.remove('active');
    }
}

export function saveSettingsFromModal() {
    const newSettings = {};
    if (elements.settingsDailyNorm) {
        newSettings.dailyNorm = parseFloat(elements.settingsDailyNorm.value) || 8;
    }
    if (elements.settingsBreakReminder) {
        newSettings.breakReminderInterval = parseInt(elements.settingsBreakReminder.value) || 120;
    }
    if (elements.settingsBreakReminderEnabled) {
        newSettings.breakReminderEnabled = elements.settingsBreakReminderEnabled.checked;
    }

    updateSettings(newSettings);
    saveSettingsToStorage();
    closeSettingsModal();
    showToast('Ustawienia zapisane!', 'success');

    // Reschedule break reminder if working
    if (state.isWorking) {
        scheduleBreakReminder();
    }
}
