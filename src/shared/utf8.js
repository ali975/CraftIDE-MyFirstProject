const fs = require('fs');

const UTF8_SMOKE_TEXT = '\u00E7\u011F\u0131\u00F6\u015F\u00FC \u0130\u0131 \u{1F680}';
const MOJIBAKE_RE = /(\u011F\u0178|\u00E2\u20AC|\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\uFFFD)/;

function stripBom(text) {
    if (!text) return '';
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function decodeUtf8Buffer(value) {
    if (Buffer.isBuffer(value)) return value.toString('utf8');
    if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
    return String(value ?? '');
}

function readTextUtf8(filePath) {
    return stripBom(fs.readFileSync(filePath, 'utf8'));
}

function readJsonUtf8(filePath) {
    return JSON.parse(readTextUtf8(filePath));
}

function hasMojibake(text) {
    return MOJIBAKE_RE.test(String(text ?? ''));
}

function repairMojibake(text) {
    const raw = String(text ?? '');
    if (!raw || !hasMojibake(raw)) return raw;
    try {
        const repaired = Buffer.from(raw, 'latin1').toString('utf8');
        return hasMojibake(repaired) ? raw : repaired;
    } catch {
        return raw;
    }
}

function humanizeIdentifier(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    return text
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\w/, (char) => char.toUpperCase());
}

function sanitizeVisibleText(rawText, fallbackText) {
    const fallback = String(fallbackText || '');
    const raw = repairMojibake(rawText);
    if (!raw) return fallback;
    return hasMojibake(raw) ? fallback : raw;
}

function normalizeUtf8Payload(value) {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
        return decodeUtf8Buffer(value);
    }
    if (typeof value === 'string') {
        return repairMojibake(value);
    }
    if (Array.isArray(value)) {
        return value.map((entry) => normalizeUtf8Payload(entry));
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeUtf8Payload(entry)]));
    }
    return value;
}

function createUtf8Logger(scope, enabled) {
    return (...parts) => {
        if (!enabled) return;
        console.info(`[utf8:${scope}]`, ...parts);
    };
}

module.exports = {
    UTF8_SMOKE_TEXT,
    createUtf8Logger,
    decodeUtf8Buffer,
    hasMojibake,
    humanizeIdentifier,
    normalizeUtf8Payload,
    readJsonUtf8,
    readTextUtf8,
    repairMojibake,
    sanitizeVisibleText,
    stripBom,
};
