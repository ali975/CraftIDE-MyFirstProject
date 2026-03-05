const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

function maybePushChecksum(lines, absolutePath, outputName) {
    if (!fs.existsSync(absolutePath)) return;
    lines.push(`${sha256File(absolutePath)}  ${outputName}`);
}

function main() {
    const root = process.cwd();
    const releaseDir = path.join(root, 'release');
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
    const version = String(packageJson.version || '0.0.0');

    if (!fs.existsSync(releaseDir)) {
        console.log('[checksums] release directory not found, skipping');
        return;
    }

    const lines = [];
    maybePushChecksum(lines, path.join(releaseDir, `CraftIDE-${version}.exe`), `CraftIDE-${version}.exe`);
    maybePushChecksum(lines, path.join(releaseDir, `CraftIDE-Setup-${version}.exe`), `CraftIDE-Setup-${version}.exe`);
    maybePushChecksum(lines, path.join(releaseDir, 'win-unpacked', 'resources', 'app.asar'), 'app.asar');

    if (!lines.length) {
        console.log('[checksums] no target artifact found, skipping');
        return;
    }

    const outPath = path.join(releaseDir, `SHA256SUMS-${version}.txt`);
    fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');
    console.log(`[checksums] wrote ${outPath}`);
}

main();
