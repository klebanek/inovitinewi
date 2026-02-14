import test from 'node:test';
import assert from 'node:assert';
import { sanitizeColor, escapeHTML } from '../js/utils.js';

test('escapeHTML escapes special characters', () => {
    assert.strictEqual(escapeHTML('<script>alert("XSS")</script>'), '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    assert.strictEqual(escapeHTML("context's"), 'context&#039;s');
    assert.strictEqual(escapeHTML('a & b'), 'a &amp; b');
    assert.strictEqual(escapeHTML(null), '');
    assert.strictEqual(escapeHTML(undefined), '');
});

test('sanitizeColor allows valid colors', () => {
    assert.strictEqual(sanitizeColor('#fff'), '#fff');
    assert.strictEqual(sanitizeColor('#aabbcc'), '#aabbcc');
    assert.strictEqual(sanitizeColor('red'), 'red');
    assert.strictEqual(sanitizeColor('rgb(255, 0, 0)'), 'rgb(255, 0, 0)');
    assert.strictEqual(sanitizeColor('rgba(255, 0, 0, 0.5)'), 'rgba(255, 0, 0, 0.5)');
});

test('sanitizeColor rejects malicious colors', () => {
    assert.strictEqual(sanitizeColor('red" onclick="alert(1)"'), '');
    assert.strictEqual(sanitizeColor('url("javascript:alert(1)")'), '');
    assert.strictEqual(sanitizeColor('red; background: blue'), '');
    assert.strictEqual(sanitizeColor(''), '');
    assert.strictEqual(sanitizeColor(null), '');
});

test('Fix verification: Attribute injection prevented', () => {
    const rawColor = 'red" onclick="alert(1)"';
    const barColor = sanitizeColor(rawColor);
    const heightPercent = 10;
    const barStyle = barColor ? `background: ${barColor};` : '';

    const html = `
        <div class="chart-bar" style="height: ${heightPercent}%; ${barStyle}">
        </div>
    `;

    assert.strictEqual(barColor, '', 'Malicious color should be sanitized to empty string');
    assert.ok(!html.includes('onclick="alert(1)"'), 'HTML should NOT contain injected onclick attribute');
});

test('Fix verification: XSS in category name prevented', () => {
    const categoryName = '"><script>alert(1)</script>';
    const escapedName = escapeHTML(categoryName);
    const html = `
        <div class="chart-bar" title="${escapedName}">
        </div>
    `;

    assert.ok(!html.includes('<script>'), 'HTML should NOT contain raw script tag');
    assert.ok(html.includes('&lt;script&gt;'), 'HTML should contain escaped script tag');
});
