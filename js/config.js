// ===== STORAGE KEYS =====
export const STORAGE_KEY = 'inovit_work_session';
export const HISTORY_KEY = 'inovit_work_history';
export const SETTINGS_KEY = 'inovit_settings';
export const CATEGORIES_KEY = 'inovit_categories';

// ===== LEGACY KEYS (for migration) =====
export const LEGACY_STORAGE_KEY = 'elmar_work_session';
export const LEGACY_HISTORY_KEY = 'elmar_work_history';
export const LEGACY_SETTINGS_KEY = 'elmar_settings';
export const LEGACY_CATEGORIES_KEY = 'elmar_categories';

// ===== DEFAULT SETTINGS =====
export const DEFAULT_SETTINGS = {
    dailyNorm: 8, // godziny
    breakReminderInterval: 120, // minuty (2h)
    breakReminderEnabled: true
};

// ===== DEFAULT CATEGORIES =====
export const DEFAULT_CATEGORIES = [
    { id: 'default', name: 'Ogólne', color: '#0d9488' }, // Changed to primary turquoise
    { id: 'meeting', name: 'Spotkania', color: '#10b981' },
    { id: 'project', name: 'Projekt', color: '#f59e0b' }
];
