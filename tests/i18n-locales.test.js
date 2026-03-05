const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { readJsonUtf8 } = require('../src/shared/utf8.js');

const rootDir = path.join(__dirname, '..');

function readLocale(name) {
    return readJsonUtf8(path.join(rootDir, 'src', 'renderer', 'locales', `${name}.json`));
}

test('renderer locale catalogs stay in parity', () => {
    const en = readLocale('en');
    const tr = readLocale('tr');

    assert.deepEqual(Object.keys(en).sort(), Object.keys(tr).sort());
});
