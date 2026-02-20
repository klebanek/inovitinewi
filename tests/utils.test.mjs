import test from 'node:test';
import assert from 'node:assert';
import { formatDurationReadable } from '../js/utils.js';

test('formatDurationReadable formats durations correctly', () => {
    // 0 ms
    assert.strictEqual(formatDurationReadable(0), '0m');

    // Less than 1 minute (e.g., 30s)
    assert.strictEqual(formatDurationReadable(30000), '0m');

    // Exactly 1 minute
    assert.strictEqual(formatDurationReadable(60000), '1m');

    // More than 1 minute but less than 1 hour
    assert.strictEqual(formatDurationReadable(45 * 60 * 1000), '45m');

    // Exactly 1 hour
    assert.strictEqual(formatDurationReadable(60 * 60 * 1000), '1h 0m');

    // More than 1 hour (1h 30m)
    assert.strictEqual(formatDurationReadable(90 * 60 * 1000), '1h 30m');

    // Large durations (25h 15m)
    assert.strictEqual(formatDurationReadable((25 * 60 + 15) * 60 * 1000), '25h 15m');
});
