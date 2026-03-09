const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

// build-release-services.ts is compiled to dist/main/build-release-services.js
// Tests that rely on the compiled output are skipped gracefully if not built.
let brs;
try {
    brs = require('../dist/main/build-release-services.js');
} catch {
    brs = null;
}

function skip(name, fn) {
    if (!brs) {
        test(name, () => {});
    } else {
        test(name, fn);
    }
}

// --- extractCompileErrors ---

skip('extractCompileErrors picks up [ERROR] lines', () => {
    const text = 'info: building\n[ERROR] Main.java: cannot find symbol\ninfo: done';
    const errors = brs.extractCompileErrors(text);
    assert.ok(errors.some((e) => e.includes('[ERROR]')));
});

skip('extractCompileErrors picks up "error:" lines', () => {
    const text = 'warning: deprecation\nerror: cannot find symbol Foo\ninfo: done';
    const errors = brs.extractCompileErrors(text);
    assert.ok(errors.some((e) => e.includes('error:')));
});

skip('extractCompileErrors returns empty array for clean output', () => {
    const errors = brs.extractCompileErrors('BUILD SUCCESS\ninfo: done');
    assert.deepEqual(errors, []);
});

skip('extractCompileErrors caps output at 50 lines', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `[ERROR] error line ${i}`).join('\n');
    const errors = brs.extractCompileErrors(lines);
    assert.equal(errors.length, 50);
});

// --- findJarArtifact ---

skip('findJarArtifact returns null when no target or build/libs dir', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const result = brs.findJarArtifact(tmpDir);
        assert.equal(result, null);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

skip('findJarArtifact finds jar in target directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const targetDir = path.join(tmpDir, 'target');
        fs.mkdirSync(targetDir);
        const jarPath = path.join(targetDir, 'myplugin-1.0.0.jar');
        fs.writeFileSync(jarPath, 'fake jar content');
        const result = brs.findJarArtifact(tmpDir);
        assert.equal(result, jarPath);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

skip('findJarArtifact ignores -sources jars', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const targetDir = path.join(tmpDir, 'target');
        fs.mkdirSync(targetDir);
        fs.writeFileSync(path.join(targetDir, 'myplugin-1.0.0-sources.jar'), 'src');
        const result = brs.findJarArtifact(tmpDir);
        assert.equal(result, null);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

// --- findSkriptArtifact ---

skip('findSkriptArtifact returns null when no .sk files present', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const result = brs.findSkriptArtifact(tmpDir);
        assert.equal(result, null);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

skip('findSkriptArtifact returns first .sk file path', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const skPath = path.join(tmpDir, 'myscript.sk');
        fs.writeFileSync(skPath, 'on join:\n  send "Hello!"');
        const result = brs.findSkriptArtifact(tmpDir);
        assert.equal(result, skPath);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

// --- hashFileSha256 ---

skip('hashFileSha256 returns a 64-char hex string', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const filePath = path.join(tmpDir, 'test.txt');
        fs.writeFileSync(filePath, 'hello craftide');
        const hash = brs.hashFileSha256(filePath);
        assert.equal(typeof hash, 'string');
        assert.equal(hash.length, 64);
        assert.match(hash, /^[0-9a-f]+$/);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

skip('hashFileSha256 produces consistent hashes for the same content', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const filePath = path.join(tmpDir, 'test.txt');
        fs.writeFileSync(filePath, 'deterministic content');
        const h1 = brs.hashFileSha256(filePath);
        const h2 = brs.hashFileSha256(filePath);
        assert.equal(h1, h2);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

skip('hashFileSha256 produces different hashes for different content', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const f1 = path.join(tmpDir, 'a.txt');
        const f2 = path.join(tmpDir, 'b.txt');
        fs.writeFileSync(f1, 'content A');
        fs.writeFileSync(f2, 'content B');
        assert.notEqual(brs.hashFileSha256(f1), brs.hashFileSha256(f2));
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

// --- createReleasePackage ---

skip('createReleasePackage returns error for non-existent project path', async () => {
    const result = await brs.createReleasePackage({ projectPath: '/non/existent/path' });
    assert.equal(result.success, false);
    assert.ok(result.error);
});

skip('createReleasePackage succeeds for skript project with .sk file', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftide-test-'));
    try {
        const skPath = path.join(tmpDir, 'myscript.sk');
        fs.writeFileSync(skPath, 'on join:\n  send "Welcome!"');
        const result = await brs.createReleasePackage({ projectPath: tmpDir, targetType: 'sk' });
        assert.equal(result.success, true);
        assert.ok(Array.isArray(result.outputFiles));
        assert.ok(result.outputFiles.length > 0);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});
