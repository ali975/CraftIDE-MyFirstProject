const test = require('node:test');
const assert = require('node:assert/strict');

const {
    compareVersion,
    recommendOfflineModel,
    simulateGraph,
    checkCompatibilityFromText,
    generateHeuristicCodeExplanation,
} = require('../src/renderer/phase-utils.js');

test('compareVersion handles semantic order', () => {
    assert.equal(compareVersion('1.21.4', '1.21.4'), 0);
    assert.equal(compareVersion('1.21.5', '1.21.4'), 1);
    assert.equal(compareVersion('1.20.6', '1.21.0'), -1);
});

test('recommendOfflineModel returns tiered choices', () => {
    assert.equal(recommendOfflineModel(4).model, 'mistral:7b');
    assert.equal(recommendOfflineModel(8).model, 'codellama:13b');
    assert.equal(recommendOfflineModel(24).model, 'codellama:34b');
});

test('simulateGraph returns steps from event chain', () => {
    const sim = simulateGraph({
        nodes: [
            { id: 1, blockId: 'PlayerJoin', params: {} },
            { id: 2, blockId: 'SendMessage', params: { mesaj: 'hello' } },
            { id: 3, blockId: 'GiveItem', params: { material: 'DIAMOND' } },
        ],
        connections: [{ from: 1, to: 2 }, { from: 2, to: 3 }],
    });
    assert.ok(sim.steps.some((s) => s.includes('Trigger: PlayerJoin')));
    assert.ok(sim.steps.some((s) => s.includes('SendMessage')));
    assert.ok(sim.steps.some((s) => s.includes('GiveItem')));
});

test('checkCompatibilityFromText flags pdc for old versions', () => {
    const issues = checkCompatibilityFromText('PersistentDataContainer pdc = x;', '1.12.2');
    assert.ok(issues.some((i) => i.level === 'error'));
});

test('generateHeuristicCodeExplanation emits explanations', () => {
    const source = `public class A extends JavaPlugin {\n@Override\npublic void onEnable() {\nplayer.sendMessage(\"ok\");\n}\n}`;
    const result = generateHeuristicCodeExplanation(source, 'en', 'beginner');
    assert.ok(result.summary.includes('Scanned'));
    assert.ok(result.lines.length >= 2);
});
