import { getHistory, saveHistory, saveCategoriesToStorage, saveSettingsToStorage } from '../storage.js';
import { settings, updateSettings, categories, updateCategories, selectionState } from '../state.js';
import { showToast, formatDateForExcel, formatDurationReadable } from '../utils.js';
import { STORAGE_KEY, DEFAULT_SETTINGS } from '../config.js';

// ===== EXCEL EXPORT =====
function formatBreaksForExcel(breaks) {
    if (!breaks || breaks.length === 0) return '-';
    return breaks.map(b => {
        const start = new Date(b.start).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const end = new Date(b.end).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        return `${start}-${end}`;
    }).join(', ');
}

export function exportToExcel() {
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
    csvContent += 'EWIDENCJA CZASU PRACY - INOVIT\n';
    csvContent += `Data eksportu: ${new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    csvContent += '\n';

    // Headers
    csvContent += 'Data;Dzień tygodnia;Rozpoczęcie;Zakończenie;Przerwy;Czas przerw;Czas pracy\n';

    // Data rows
    selectedEntries.forEach(entry => {
        const dateStr = formatDateForExcel(entry.workStartTime);
        const dayName = new Date(entry.workStartTime).toLocaleDateString('pl-PL', { weekday: 'long' });
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
    const fileName = `Ewidencja_INOVIT_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ===== JSON IMPORT/EXPORT =====
export function exportDatabaseJSON() {
    const data = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        history: getHistory(),
        settings: settings,
        categories: categories,
        currentSession: JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inovit_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Baza danych wyeksportowana pomyślnie!', 'success');
}

export function importDatabaseJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate structure
                if (!data.history && !data.settings && !data.categories) {
                    throw new Error('Nieprawidłowy format pliku');
                }

                // Import history
                if (data.history && Array.isArray(data.history)) {
                    const existingHistory = getHistory();
                    const mergedHistory = [...data.history];

                    // Merge with existing (avoid duplicates by timestamp)
                    existingHistory.forEach(entry => {
                        const exists = mergedHistory.some(e =>
                            e.workStartTime === entry.workStartTime &&
                            e.workEndTime === entry.workEndTime
                        );
                        if (!exists) {
                            mergedHistory.push(entry);
                        }
                    });

                    // Sort by date (newest first)
                    mergedHistory.sort((a, b) => b.workStartTime - a.workStartTime);

                    // Limit to 100 entries
                    if (mergedHistory.length > 100) {
                        mergedHistory.length = 100;
                    }

                    saveHistory(mergedHistory);
                }

                // Import settings
                if (data.settings) {
                    updateSettings({ ...DEFAULT_SETTINGS, ...data.settings });
                    saveSettingsToStorage();
                }

                // Import categories
                if (data.categories && Array.isArray(data.categories)) {
                    // Merge categories
                    const newCategories = [...categories];
                    data.categories.forEach(cat => {
                        const exists = newCategories.some(c => c.id === cat.id);
                        if (!exists) {
                            newCategories.push(cat);
                        }
                    });
                    updateCategories(newCategories);
                    saveCategoriesToStorage();
                }

                showToast(`Zaimportowano ${data.history?.length || 0} wpisów!`, 'success');
                resolve(data);
            } catch (err) {
                showToast('Błąd importu: ' + err.message, 'error');
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Błąd odczytu pliku'));
        reader.readAsText(file);
    });
}
