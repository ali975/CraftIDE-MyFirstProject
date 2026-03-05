const test = require('node:test');
const assert = require('node:assert/strict');

const { UTF8_SMOKE_TEXT, normalizeUtf8Payload } = require('../src/shared/utf8.js');

test('IPC UTF-8 payload roundtrip normalizes nested buffers', () => {
    const payload = {
        channel: 'debug:utf8Echo',
        text: Buffer.from(UTF8_SMOKE_TEXT, 'utf8'),
        nested: [
            Buffer.from(UTF8_SMOKE_TEXT, 'utf8'),
            { value: Buffer.from(UTF8_SMOKE_TEXT, 'utf8') },
        ],
    };

    const normalized = normalizeUtf8Payload(payload);

    assert.equal(normalized.channel, 'debug:utf8Echo');
    assert.equal(normalized.text, UTF8_SMOKE_TEXT);
    assert.equal(normalized.nested[0], UTF8_SMOKE_TEXT);
    assert.equal(normalized.nested[1].value, UTF8_SMOKE_TEXT);
});
