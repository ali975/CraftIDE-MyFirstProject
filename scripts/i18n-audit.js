const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const rendererDir = path.join(rootDir, 'src', 'renderer');
const strictMode = process.argv.includes('--strict');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walkFiles(dirPath, predicate, out = []) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            walkFiles(fullPath, predicate, out);
            continue;
        }
        if (predicate(fullPath)) out.push(fullPath);
    }
    return out;
}

function getLineNumber(text, index) {
    return text.slice(0, index).split('\n').length;
}

function shouldIgnoreLiteral(value, lineText) {
    const trimmed = String(value || '').trim();
    if (!trimmed) return true;
    const textOnly = trimmed
        .replace(/<[^>]+>/g, ' ')
        .replace(/\$\{[^}]+\}/g, ' ')
        .replace(/&[#a-z0-9]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (trimmed.length < 4) return true;
    if (!/[A-Za-z]/.test(trimmed) && !/[^\x00-\x7F]/.test(trimmed)) return true;
    if (!textOnly || textOnly.length < 4) return true;
    if (/^(https?:|generated:\/\/|visual-builder:\/\/|settings:\/\/|server-manager:\/\/|image-editor:\/\/|gui-builder:\/\/|command-tree:\/\/|recipe-creator:\/\/|permission-tree:\/\/|marketplace:\/\/|mc-tools:\/\/)/.test(trimmed)) return true;
    if (/^(div|span|input|select|label|button|canvas|option|style|class|id|type|text|number|search)$/i.test(trimmed)) return true;
    if (/[{}<>]/.test(trimmed) && !/\s/.test(trimmed)) return true;
    if (/^[.#@a-z0-9\-\s,:;()%]+$/i.test(trimmed) && /[:;{}]/.test(trimmed)) return true;
    if (/code \+=|return indent \+|querySelector|createElement|getElementById|classList|dataset|setProperty|console\.|nodePath\.|ipcRenderer\.|window\./.test(lineText)) return true;
    if (/\.style\.|style\.cssText|s\.textContent\s*=/.test(lineText)) return true;
    return false;
}

function collectJsCandidates(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const candidates = [];
    const patterns = [
        /showNotification\(\s*(['"`])([\s\S]*?)\1/g,
        /confirm\(\s*(['"`])([\s\S]*?)\1/g,
        /\.textContent\s*=\s*(['"`])([\s\S]*?)\1/g,
        /\.innerHTML\s*=\s*(['"`])([\s\S]*?)\1/g,
        /\.placeholder\s*=\s*(['"`])([\s\S]*?)\1/g,
        /\.title\s*=\s*(['"`])([\s\S]*?)\1/g,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text))) {
            const value = match[2];
            const lineNumber = getLineNumber(text, match.index);
            const lineText = text.split('\n')[lineNumber - 1] || '';
            if (shouldIgnoreLiteral(value, lineText)) continue;
            candidates.push({
                file: path.relative(rootDir, filePath),
                line: lineNumber,
                value: value.replace(/\s+/g, ' ').trim(),
            });
        }
    }

    return candidates;
}

function collectHtmlCandidates(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const candidates = [];
    const lines = text.split('\n');
    lines.forEach((line, index) => {
        if (/data-i18n/.test(line)) return;
        const matches = [...line.matchAll(/>([^<]+)</g)];
        matches.forEach((match) => {
            const value = String(match[1] || '').trim();
            if (shouldIgnoreLiteral(value, line)) return;
            candidates.push({
                file: path.relative(rootDir, filePath),
                line: index + 1,
                value,
            });
        });
    });
    return candidates;
}

function main() {
    const en = readJson(path.join(rendererDir, 'locales', 'en.json'));
    const tr = readJson(path.join(rendererDir, 'locales', 'tr.json'));
    const enKeys = Object.keys(en).sort();
    const trKeys = Object.keys(tr).sort();
    const onlyEn = enKeys.filter((key) => !(key in tr));
    const onlyTr = trKeys.filter((key) => !(key in en));

    console.log('[i18n-audit] locale parity');
    if (!onlyEn.length && !onlyTr.length) {
        console.log('  ok: en.json and tr.json are aligned');
    } else {
        if (onlyEn.length) console.log(`  missing in tr.json: ${onlyEn.join(', ')}`);
        if (onlyTr.length) console.log(`  missing in en.json: ${onlyTr.join(', ')}`);
    }

    const jsFiles = walkFiles(rendererDir, (filePath) => filePath.endsWith('.js') && !filePath.includes(`${path.sep}locales${path.sep}`));
    const htmlFiles = [path.join(rendererDir, 'index.html')].filter((filePath) => fs.existsSync(filePath));
    const candidates = [
        ...jsFiles.flatMap((filePath) => collectJsCandidates(filePath)),
        ...htmlFiles.flatMap((filePath) => collectHtmlCandidates(filePath)),
    ];

    console.log(`[i18n-audit] hardcoded string candidates: ${candidates.length}`);
    candidates.slice(0, 80).forEach((entry) => {
        console.log(`  ${entry.file}:${entry.line} -> ${entry.value}`);
    });
    if (candidates.length > 80) {
        console.log(`  ... ${candidates.length - 80} more candidate(s) omitted`);
    }

    const hasFailures = onlyEn.length > 0 || onlyTr.length > 0 || (strictMode && candidates.length > 0);
    process.exit(hasFailures ? 1 : 0);
}

main();
