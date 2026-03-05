const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = process.cwd();
const releaseDir = path.join(rootDir, 'release');
const notesSource = path.join(rootDir, 'RELEASE_NOTES.md');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = String(packageJson.version || '0.0.0');
const releaseTag = `v${version}`;
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;
const skipBuild = process.argv.includes('--skip-build');
const skipDist = process.argv.includes('--skip-dist');

function runStep(label, command, args) {
    console.log(`[release-prep] ${label}`);
    const result = spawnSync(command, args, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: process.platform === 'win32' && /\.cmd$/i.test(command),
    });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`${label} failed with exit code ${result.status}`);
    }
}

function ensureFile(filePath, label) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`${label} is missing: ${path.relative(rootDir, filePath)}`);
    }
}

function main() {
    console.log(`[release-prep] version ${version} (${releaseTag})`);

    if (!skipBuild) {
        runStep('Build main process', npmCmd, ['run', 'build:main']);
        runStep('Run tests', npmCmd, ['test']);
    }

    if (!skipDist) {
        runStep('Build Windows distributables', npmCmd, ['run', 'dist']);
    }

    runStep('Generate release checksums', nodeCmd, ['scripts/generate-release-checksums.js']);

    ensureFile(notesSource, 'Release notes source');
    ensureFile(releaseDir, 'Release directory');

    const expectedPortable = path.join(releaseDir, `CraftIDE-${version}.exe`);
    const expectedSetup = path.join(releaseDir, `CraftIDE-Setup-${version}.exe`);
    const expectedBlockmaps = [
        path.join(releaseDir, `CraftIDE-Setup-${version}.exe.blockmap`),
        path.join(releaseDir, `CraftIDE-${version}.exe.blockmap`),
    ];
    const expectedChecksums = path.join(releaseDir, `SHA256SUMS-${version}.txt`);
    const expectedLatest = path.join(releaseDir, 'latest.yml');

    ensureFile(expectedPortable, 'Portable executable');
    ensureFile(expectedSetup, 'Setup executable');
    ensureFile(expectedChecksums, 'Checksum manifest');
    ensureFile(expectedLatest, 'latest.yml');

    const latestContent = fs.readFileSync(expectedLatest, 'utf8');
    if (!latestContent.includes(`version: ${version}`)) {
        throw new Error(`latest.yml version mismatch. Expected ${version}.`);
    }

    const blockmaps = expectedBlockmaps
        .filter((filePath) => fs.existsSync(filePath))
        .map((filePath) => path.basename(filePath));
    if (blockmaps.length === 0) {
        throw new Error(`No current-version .blockmap artifact was generated for ${version}.`);
    }

    const notesBody = fs.readFileSync(notesSource, 'utf8').trim();
    const generatedNotesPath = path.join(releaseDir, 'RELEASE_NOTES.generated.md');
    const generatedNotes = `# CraftIDE ${releaseTag}\n\n${notesBody}\n`;
    fs.writeFileSync(generatedNotesPath, generatedNotes, 'utf8');

    const manifest = {
        version,
        releaseTag,
        artifacts: {
            portable: path.basename(expectedPortable),
            setup: path.basename(expectedSetup),
            latestYml: path.basename(expectedLatest),
            checksums: path.basename(expectedChecksums),
            blockmaps,
            notes: path.basename(generatedNotesPath),
        },
    };
    fs.writeFileSync(path.join(releaseDir, 'release-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    console.log('[release-prep] release package is ready');
    console.log(`  portable: ${manifest.artifacts.portable}`);
    console.log(`  setup: ${manifest.artifacts.setup}`);
    console.log(`  latest.yml: ${manifest.artifacts.latestYml}`);
    console.log(`  checksums: ${manifest.artifacts.checksums}`);
    console.log(`  blockmaps: ${manifest.artifacts.blockmaps.join(', ')}`);
    console.log(`  notes: ${manifest.artifacts.notes}`);
}

main();
