const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = process.cwd();
const testsDir = path.join(rootDir, 'tests');
const nodeArgs = ['--test'];

for (const entry of fs.readdirSync(testsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.test.js')) continue;
    nodeArgs.push(path.join('tests', entry.name));
}

const result = spawnSync(process.execPath, nodeArgs, {
    cwd: rootDir,
    stdio: 'inherit',
});

if (result.error) {
    throw result.error;
}

process.exit(result.status || 0);
