import { getHistory } from '../storage.js';
import { settings, statsState, categories } from '../state.js';
import { elements, showScreen } from './ui.js';
import { formatDurationReadable, escapeHTML, sanitizeColor } from '../utils.js';

export function calculateStatistics(period = 'month', categoryId = 'all') {
    const history = getHistory();
    const now = new Date();

    // Filter by period
    let filtered = history.filter(entry => {
        const entryDate = new Date(entry.workStartTime);
        if (period === 'week') {
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return entryDate >= weekAgo;
        } else if (period === 'month') {
            return entryDate.getMonth() === now.getMonth() &&
                   entryDate.getFullYear() === now.getFullYear();
        } else if (period === 'year') {
            return entryDate.getFullYear() === now.getFullYear();
        }
        return true; // 'all'
    });

    // Filter by category if not 'all'
    if (categoryId !== 'all') {
        filtered = filtered.filter(entry => entry.categoryId === categoryId);
    }

    const totalWorkMs = filtered.reduce((sum, e) => sum + (e.totalWorkTimeMs || 0), 0);
    const totalBreakMs = filtered.reduce((sum, e) => sum + (e.totalBreakTimeMs || 0), 0);
    const avgWorkMs = filtered.length > 0 ? totalWorkMs / filtered.length : 0;
    const standardMs = filtered.length * settings.dailyNorm * 60 * 60 * 1000;
    const overtime = totalWorkMs - standardMs;

    // Calculate category breakdown for "all" view
    const categoryBreakdown = {};
    if (categoryId === 'all') {
        filtered.forEach(entry => {
            const catId = entry.categoryId || 'default';
            if (!categoryBreakdown[catId]) {
                categoryBreakdown[catId] = {
                    id: catId,
                    name: entry.categoryName || 'Ogólne',
                    color: entry.categoryColor || '#0d9488',
                    totalMs: 0,
                    count: 0
                };
            }
            categoryBreakdown[catId].totalMs += entry.totalWorkTimeMs || 0;
            categoryBreakdown[catId].count++;
        });
    }

    return {
        daysWorked: filtered.length,
        totalWorkTimeMs: totalWorkMs,
        totalWorkTime: formatDurationReadable(totalWorkMs),
        totalBreakTimeMs: totalBreakMs,
        totalBreakTime: formatDurationReadable(totalBreakMs),
        avgWorkTimeMs: avgWorkMs,
        avgWorkTime: formatDurationReadable(avgWorkMs),
        overtimeMs: overtime,
        overtime: formatDurationReadable(Math.abs(overtime)),
        isOvertime: overtime > 0,
        categoryBreakdown: categoryBreakdown,
        showAllCategories: categoryId === 'all',
        dailyData: filtered.map(e => ({
            date: new Date(e.workStartTime),
            workMs: e.totalWorkTimeMs || 0,
            breakMs: e.totalBreakTimeMs || 0,
            categoryId: e.categoryId || 'default',
            categoryName: e.categoryName || 'Ogólne',
            categoryColor: e.categoryColor || '#0d9488'
        })).reverse() // chronological order
    };
}

export function renderStatsCategorySelect() {
    if (!elements.statsCategory) return;

    elements.statsCategory.innerHTML = '<option value="all">Wszystkie kategorie</option>' +
        categories.map(c =>
            `<option value="${escapeHTML(c.id)}" ${c.id === statsState.categoryId ? 'selected' : ''}>${escapeHTML(c.name)}</option>`
        ).join('');
}

export function renderStatistics(period = 'month', categoryId = 'all') {
    statsState.period = period;
    statsState.categoryId = categoryId;

    const stats = calculateStatistics(period, categoryId);

    if (elements.statsDaysWorked) {
        elements.statsDaysWorked.textContent = stats.daysWorked;
    }
    if (elements.statsTotalWork) {
        elements.statsTotalWork.textContent = stats.totalWorkTime;
    }
    if (elements.statsAvgWork) {
        elements.statsAvgWork.textContent = stats.avgWorkTime;
    }
    if (elements.statsTotalBreak) {
        elements.statsTotalBreak.textContent = stats.totalBreakTime;
    }
    if (elements.statsOvertime) {
        elements.statsOvertime.textContent = (stats.isOvertime ? '+' : '-') + stats.overtime;
    }
    if (elements.statsOvertimeCard) {
        elements.statsOvertimeCard.classList.toggle('overtime-positive', stats.isOvertime);
        elements.statsOvertimeCard.classList.toggle('overtime-negative', !stats.isOvertime);
    }

    renderStatsChart(stats.dailyData, stats.showAllCategories, stats.categoryBreakdown);
}

export function renderStatsChart(dailyData, showAllCategories = false, categoryBreakdown = {}) {
    if (!elements.statsChart) return;

    if (dailyData.length === 0) {
        elements.statsChart.innerHTML = '<p class="no-data-message">Brak danych do wyświetlenia</p>';
        return;
    }

    const maxMs = Math.max(...dailyData.map(d => d.workMs), settings.dailyNorm * 60 * 60 * 1000);
    const normMs = settings.dailyNorm * 60 * 60 * 1000;

    const barsHtml = dailyData.slice(-14).map(d => {
        const heightPercent = (d.workMs / maxMs) * 100;
        const normPercent = (normMs / maxMs) * 100;
        const dayName = d.date.toLocaleDateString('pl-PL', { weekday: 'short' });
        const dayNum = d.date.getDate();
        const hours = (d.workMs / (1000 * 60 * 60)).toFixed(1);
        const isOverNorm = d.workMs > normMs;

        // Use category color when showing all categories
        const barColor = showAllCategories ? sanitizeColor(d.categoryColor) : '';
        const barStyle = barColor ? `background: ${barColor};` : '';

        return `
            <div class="chart-bar-container">
                <div class="chart-bar ${isOverNorm && !showAllCategories ? 'over-norm' : ''}" style="height: ${heightPercent}%; ${barStyle}" title="${escapeHTML(d.categoryName)}">
                    <span class="chart-bar-value">${hours}h</span>
                </div>
                <div class="chart-norm-line" style="bottom: ${normPercent}%"></div>
                <div class="chart-label">${dayNum}<br>${dayName}</div>
            </div>
        `;
    }).join('');

    // Build legend based on view mode
    let legendHtml = '';
    if (showAllCategories && Object.keys(categoryBreakdown).length > 0) {
        // Show category legend with totals
        const categoryLegendItems = Object.values(categoryBreakdown).map(cat => `
            <span class="legend-item">
                <span class="legend-color" style="background: ${sanitizeColor(cat.color)}"></span>
                ${escapeHTML(cat.name)} (${formatDurationReadable(cat.totalMs)})
            </span>
        `).join('');

        legendHtml = `
            <div class="chart-legend chart-legend-categories">
                ${categoryLegendItems}
            </div>
            <div class="chart-legend">
                <span class="legend-item"><span class="legend-color norm"></span>Norma (${settings.dailyNorm}h)</span>
            </div>
        `;
    } else {
        legendHtml = `
            <div class="chart-legend">
                <span class="legend-item"><span class="legend-color norm"></span>Norma (${settings.dailyNorm}h)</span>
                <span class="legend-item"><span class="legend-color over"></span>Nadgodziny</span>
            </div>
        `;
    }

    elements.statsChart.innerHTML = `
        <div class="chart-container">
            ${barsHtml}
        </div>
        ${legendHtml}
    `;
}
