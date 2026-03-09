const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildPromptPreamble,
    buildReleaseQualityGate,
    buildScenarioIdeas,
    inferKnowledgePacks,
    buildReleaseDeliverySummary,
    buildProjectReadinessSnapshot,
} = require('../src/shared/minecraft-guidance.js');

test('inferKnowledgePacks detects ecosystem dependencies from prompt', () => {
    const packs = inferKnowledgePacks('Create a Vault powered shop with PlaceholderAPI scoreboard text.', null);

    assert.ok(packs.includes('vault'));
    assert.ok(packs.includes('placeholderapi'));
});

test('buildPromptPreamble includes project and graph summary', () => {
    const prompt = buildPromptPreamble({
        context: {
            currentProjectPath: 'C:/tmp/project',
            activeFile: 'src/main/java/Main.java',
            files: ['plugin.yml', 'src/main/java/Main.java'],
            dependencies: ['plugin.yml', 'pom.xml'],
            mode: 'plugin',
            graph: {
                nodes: [{ id: 1, blockId: 'PlayerJoin' }, { id: 2, blockId: 'SendMessage' }],
                connections: [{ from: 1, to: 2 }],
            },
            prompt: 'Create a welcome reward with Vault economy support.',
        },
    });

    assert.match(prompt, /Target mode: plugin/);
    assert.match(prompt, /Files in context:/);
    assert.match(prompt, /Visual graph: 2 nodes, 1 connections/);
    assert.match(prompt, /Relevant Minecraft knowledge:/);
});

test('buildReleaseQualityGate blocks release until required checks pass', () => {
    const gate = buildReleaseQualityGate({
        validation: { errors: 1, warnings: 0, success: false },
        build: { success: true, attempts: 1 },
        scenario: { success: false, passed: 0, total: 1 },
    });

    assert.equal(gate.canRelease, false);
    assert.ok(gate.blockers.some((item) => item.id === 'validation'));
    assert.ok(gate.blockers.some((item) => item.id === 'scenario'));
});

test('buildScenarioIdeas creates practical defaults from prompt', () => {
    const scenarios = buildScenarioIdeas('Players can use /spawn to teleport and get a welcome reward.', 'plugin');

    assert.ok(scenarios.length >= 2);
    assert.ok(scenarios.some((item) => item.name.includes('Spawn')));
    assert.ok(scenarios.every((item) => item.timeoutMs === 8000));
});

test('buildReleaseDeliverySummary handles successful release', () => {
    const releaseResult = {
        success: true,
        outputFiles: ['/project/release/myplugin-1.0.0.jar'],
        checksum: [{ file: 'myplugin-1.0.0.jar', sha256: 'abc123' }],
    };
    const qualityStatus = {
        validation: { errors: 0, warnings: 0, success: true },
        build: { success: true, attempts: 1 },
        scenario: { success: true, passed: 2, total: 2 },
    };
    const summary = buildReleaseDeliverySummary(releaseResult, qualityStatus);

    assert.equal(summary.success, true);
    assert.equal(summary.artifacts.length, 1);
    assert.equal(summary.checksums.length, 1);
    assert.ok(summary.manualChecks.length > 0);
    assert.ok(summary.nextStep.includes('server'));
    assert.ok(summary.summary.includes('1 artifact'));
});

test('buildReleaseDeliverySummary handles failed release', () => {
    const summary = buildReleaseDeliverySummary({ success: false }, {});

    assert.equal(summary.success, false);
    assert.equal(summary.artifacts.length, 0);
    assert.ok(summary.summary.includes('not yet ready'));
    assert.ok(summary.nextStep.includes('Fix'));
});

test('buildReleaseDeliverySummary includes release warning in manual checks', () => {
    const summary = buildReleaseDeliverySummary({ success: true, warning: 'Zip fallback used.', outputFiles: ['a.zip'], checksum: [] }, {});

    assert.ok(summary.manualChecks.some((c) => c.includes('Zip fallback')));
});

test('buildProjectReadinessSnapshot computes correct score', () => {
    const qualityStatus = {
        validation: { errors: 0, warnings: 0, success: true },
        build: { success: true, attempts: 1 },
        scenario: { success: true, passed: 1, total: 1 },
    };
    const snapshot = buildProjectReadinessSnapshot(qualityStatus, null);

    assert.equal(snapshot.total, 4); // 3 required + 1 optional
    assert.ok(snapshot.score >= 3);
    assert.ok(snapshot.pct >= 75);
    assert.equal(snapshot.canRelease, true);
    assert.equal(snapshot.releaseCreated, false);
});

test('buildProjectReadinessSnapshot marks releaseCreated when release result is successful', () => {
    const snapshot = buildProjectReadinessSnapshot({
        validation: { errors: 0, warnings: 0, success: true },
        build: { success: true, attempts: 1 },
        scenario: { success: true, passed: 1, total: 1 },
    }, { success: true });

    assert.equal(snapshot.releaseCreated, true);
    assert.match(snapshot.summary, /Released/);
});

test('buildProjectReadinessSnapshot summary describes blocked state', () => {
    const snapshot = buildProjectReadinessSnapshot({
        validation: { errors: 2, warnings: 0, success: false },
        build: null,
        scenario: null,
    }, null);

    assert.equal(snapshot.canRelease, false);
    assert.match(snapshot.summary, /Not ready/);
});

