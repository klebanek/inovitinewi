// ===== UTILITY FUNCTIONS =====

export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function formatTime(date) {
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('pl-PL', options);
}

export function formatDuration(ms) {
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

export function formatDurationReadable(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export function msToDecimalHours(ms) {
    return (ms / (1000 * 60 * 60)).toFixed(2);
}

export function formatDateForExcel(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

const HEX_REGEX = /^#([0-9a-fA-F]{3}){1,2}$/;
const RGB_REGEX = /^rgba?\((\s*\d+\s*,){2,3}\s*[\d.]+\s*\)$/;
const NAME_REGEX = /^[a-zA-Z]+$/;

export function sanitizeColor(color) {
    if (!color || typeof color !== 'string') return '';

    // Validate hex color
    if (HEX_REGEX.test(color)) return color;

    // Validate rgb/rgba
    if (RGB_REGEX.test(color)) return color;

    // Validate simple color name (only letters)
    if (NAME_REGEX.test(color)) return color;

    return '';
}
