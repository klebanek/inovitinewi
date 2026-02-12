import {
    STORAGE_KEY, HISTORY_KEY, SETTINGS_KEY, CATEGORIES_KEY,
    LEGACY_STORAGE_KEY, LEGACY_HISTORY_KEY, LEGACY_SETTINGS_KEY, LEGACY_CATEGORIES_KEY,
    DEFAULT_SETTINGS, DEFAULT_CATEGORIES
} from './config.js';
import { state, settings, updateSettings, categories, updateCategories } from './state.js';
import { showToast } from './utils.js';

// ===== MIGRATION =====
function migrateData() {
    // Check if legacy data exists and new data doesn't
    const legacySession = localStorage.getItem(LEGACY_STORAGE_KEY);
    const newSession = localStorage.getItem(STORAGE_KEY);

    if (legacySession && !newSession) {
        console.log('Migrating session from Elmar to INOVIT...');
        localStorage.setItem(STORAGE_KEY, legacySession);
        // localStorage.removeItem(LEGACY_STORAGE_KEY); // Optional: keep for safety or remove
    }

    const legacyHistory = localStorage.getItem(LEGACY_HISTORY_KEY);
    const newHistory = localStorage.getItem(HISTORY_KEY);

    if (legacyHistory && !newHistory) {
        console.log('Migrating history from Elmar to INOVIT...');
        localStorage.setItem(HISTORY_KEY, legacyHistory);
        // localStorage.removeItem(LEGACY_HISTORY_KEY);
    }

    const legacySettings = localStorage.getItem(LEGACY_SETTINGS_KEY);
    const newSettings = localStorage.getItem(SETTINGS_KEY);

    if (legacySettings && !newSettings) {
        console.log('Migrating settings from Elmar to INOVIT...');
        localStorage.setItem(SETTINGS_KEY, legacySettings);
        // localStorage.removeItem(LEGACY_SETTINGS_KEY);
    }

    const legacyCategories = localStorage.getItem(LEGACY_CATEGORIES_KEY);
    const newCategories = localStorage.getItem(CATEGORIES_KEY);

    if (legacyCategories && !newCategories) {
        console.log('Migrating categories from Elmar to INOVIT...');
        localStorage.setItem(CATEGORIES_KEY, legacyCategories);
        // localStorage.removeItem(LEGACY_CATEGORIES_KEY);
    }
}

// ===== LOCAL STORAGE FUNCTIONS =====
export function saveState() {
    const dataToSave = {
        isWorking: state.isWorking,
        isOnBreak: state.isOnBreak,
        workStartTime: state.workStartTime,
        workEndTime: state.workEndTime,
        currentBreakStart: state.currentBreakStart,
        breaks: state.breaks,
        note: state.note,
        categoryId: state.categoryId,
        lastBreakReminder: state.lastBreakReminder
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

export function loadState() {
    migrateData(); // Run migration check
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
            state.note = data.note || '';
            state.categoryId = data.categoryId || 'default';
            state.lastBreakReminder = data.lastBreakReminder || null;
            return true;
        } catch (e) {
            console.error('Error loading state:', e);
            return false;
        }
    }
    return false;
}

export function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}

export function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            updateSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch (e) {
            updateSettings({ ...DEFAULT_SETTINGS });
        }
    }
}

export function saveSettingsToStorage() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadCategories() {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    if (saved) {
        try {
            updateCategories(JSON.parse(saved));
        } catch (e) {
            updateCategories([...DEFAULT_CATEGORIES]);
        }
    }
}

export function saveCategoriesToStorage() {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function getHistory() {
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

export function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function saveToHistory(entry) {
    const history = getHistory();
    history.unshift(entry);
    if (history.length > 100) {
        history.pop();
    }
    saveHistory(history);
}

export function updateHistoryEntry(index, updatedEntry) {
    const history = getHistory();
    if (index >= 0 && index < history.length) {
        history[index] = updatedEntry;
        saveHistory(history);
    }
}

export function deleteFromHistory(index) {
    const history = getHistory();
    history.splice(index, 1);
    saveHistory(history);
    return history;
}
