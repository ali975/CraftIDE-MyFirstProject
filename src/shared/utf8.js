const fs = require('fs');

const UTF8_SMOKE_TEXT = '\u00E7\u011F\u0131\u00F6\u015F\u00FC \u0130\u0131 \u{1F680}';
const MOJIBAKE_RE = /(\u011F\u0178|â[\u0080-\u00FF\u0153\u0161\u017E\u0178\u2018-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]|[ÃÂ][\u0080-\u00FF]|ğŸ|[“”‘’•–—…™šœžŸ]|\uFFFD)/;

const LEGACY_SINGLE_BYTE_MAP = new Map([
    ['€', 0x80],
    ['‚', 0x82],
    ['ƒ', 0x83],
    ['„', 0x84],
    ['…', 0x85],
    ['†', 0x86],
    ['‡', 0x87],
    ['ˆ', 0x88],
    ['‰', 0x89],
    ['Š', 0x8a],
    ['‹', 0x8b],
    ['Œ', 0x8c],
    ['Ž', 0x8e],
    ['‘', 0x91],
    ['’', 0x92],
    ['“', 0x93],
    ['”', 0x94],
    ['•', 0x95],
    ['–', 0x96],
    ['—', 0x97],
    ['˜', 0x98],
    ['™', 0x99],
    ['š', 0x9a],
    ['›', 0x9b],
    ['œ', 0x9c],
    ['ž', 0x9e],
    ['Ÿ', 0x9f],
    ['Ğ', 0xd0],
    ['İ', 0xdd],
    ['Ş', 0xde],
    ['ğ', 0xf0],
    ['ı', 0xfd],
    ['ş', 0xfe],
]);

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
    let current = raw;
    for (let attempt = 0; attempt < 2; attempt += 1) {
        const encoded = encodeLegacyBytes(current);
        if (!encoded) break;
        try {
            const repaired = encoded.toString('utf8');
            if (!repaired || repaired === current) break;
            current = repaired;
            if (!hasMojibake(current)) {
                return current;
            }
        } catch {
            break;
        }
    }
    return current;
}

function encodeLegacyBytes(text) {
    const bytes = [];
    for (const char of String(text ?? '')) {
        const code = char.charCodeAt(0);
        if (code <= 0xff) {
            bytes.push(code);
            continue;
        }
        const mapped = LEGACY_SINGLE_BYTE_MAP.get(char);
        if (mapped === undefined) {
            return null;
        }
        bytes.push(mapped);
    }
    return Buffer.from(bytes);
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
