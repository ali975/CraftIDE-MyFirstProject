const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function readLocale(name) {
    return JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'renderer', 'locales', `${name}.json`), 'utf8'));
}

test('renderer locale catalogs stay in parity', () => {
    const en = readLocale('en');
    const tr = readLocale('tr');

    assert.deepEqual(Object.keys(en).sort(), Object.keys(tr).sort());
});
