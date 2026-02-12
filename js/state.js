import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './config.js';

// ===== STATE =====
export const state = {
    isWorking: false,
    isOnBreak: false,
    workStartTime: null,
    workEndTime: null,
    currentBreakStart: null,
    breaks: [],
    timerInterval: null,
    breakTimerInterval: null,
    note: '',
    categoryId: 'default',
    breakReminderTimeout: null,
    lastBreakReminder: null
};

export function resetState() {
    state.isWorking = false;
    state.isOnBreak = false;
    state.workStartTime = null;
    state.workEndTime = null;
    state.currentBreakStart = null;
    state.breaks = [];
    state.note = '';
    state.categoryId = 'default';
    state.lastBreakReminder = null;

    // Don't reset intervals here, they should be cleared before calling this
}

// Edit state
export const editState = {
    editingIndex: null,
    editBreaks: []
};

export function resetEditState() {
    editState.editingIndex = null;
    editState.editBreaks = [];
}

// Selection state
export const selectionState = {
    selectedIndices: new Set()
};

// Settings state
export let settings = { ...DEFAULT_SETTINGS };

export function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
}

// Categories state
export let categories = [...DEFAULT_CATEGORIES];

export function updateCategories(newCategories) {
    categories = newCategories;
}

export function getCategoryById(id) {
    return categories.find(c => c.id === id) || categories[0];
}

// Stats state
export const statsState = {
    period: 'month',
    categoryId: 'all'
};
