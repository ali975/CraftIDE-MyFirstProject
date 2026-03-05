const test = require('node:test');
const assert = require('node:assert/strict');

const { UTF8_SMOKE_TEXT, decodeUtf8Buffer } = require('../src/shared/utf8.js');

test('UTF-8 smoke text survives buffer encode/decode', () => {
    const encoded = Buffer.from(UTF8_SMOKE_TEXT, 'utf8');
    const decoded = decodeUtf8Buffer(encoded);

    assert.equal(decoded, UTF8_SMOKE_TEXT);
    assert.equal(decoded, '\u00E7\u011F\u0131\u00F6\u015F\u00FC \u0130\u0131 \u{1F680}');
});
