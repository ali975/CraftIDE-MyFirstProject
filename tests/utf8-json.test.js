const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { UTF8_SMOKE_TEXT, readJsonUtf8, readTextUtf8 } = require('../src/shared/utf8.js');

test('UTF-8 locale JSON is loaded with utf8 decoding', () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'utf8-locale.json');
    const rawText = readTextUtf8(fixturePath);
    const parsed = readJsonUtf8(fixturePath);

    assert.match(rawText, /sample/);
    assert.equal(parsed.sample, UTF8_SMOKE_TEXT);
});
