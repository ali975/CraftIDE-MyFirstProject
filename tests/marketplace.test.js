const test = require('node:test');
const assert = require('node:assert/strict');

const { mkInferCategory, mkNormalizeBlueprint, mkFilterBlueprints } = require('../src/renderer/marketplace.js');

test('mkInferCategory detects economy and protection flows from blueprint blocks', () => {
    assert.equal(mkInferCategory({
        name: 'Spawn Shop',
        nodes: [{ blockId: 'CreateGUI' }, { blockId: 'GiveMoney' }],
    }), 'economy');

    assert.equal(mkInferCategory({
        name: 'Spawn Guard',
        description: 'Disable pvp and block breaking',
        nodes: [{ blockId: 'EntityDamage' }, { blockId: 'CancelEvent' }],
    }), 'protection');
});

test('mkNormalizeBlueprint fills solution-pack defaults', () => {
    const normalized = mkNormalizeBlueprint({
        description: 'Starter crate rewards',
        tags: 'crate, starter , rewards',
        nodes: [{ blockId: 'GiveItem' }],
    });

    assert.equal(normalized.name, 'Untitled Pack');
    assert.equal(normalized.packType, 'solution-pack');
    assert.equal(normalized.category, 'reward');
    assert.deepEqual(normalized.tags, ['crate', 'starter', 'rewards']);
    assert.equal(normalized.mode, 'plugin');
    assert.equal(normalized.author, 'Anonymous');
    assert.deepEqual(normalized.connections, []);
});

test('mkFilterBlueprints applies mode, category, search and newest-first sorting', () => {
    const filtered = mkFilterBlueprints([
        {
            id: 'quest-old',
            name: 'Daily Wheat Quest',
            description: 'Collect wheat for coins',
            mode: 'plugin',
            category: 'quest',
            tags: ['daily', 'farm'],
            created: '2025-01-02T08:00:00.000Z',
        },
        {
            id: 'quest-new',
            name: 'Daily Wheat Quest Plus',
            description: 'Collect wheat for bigger coins',
            mode: 'plugin',
            category: 'quest',
            tags: ['daily', 'featured'],
            created: '2025-01-05T08:00:00.000Z',
        },
        {
            id: 'shop-pack',
            name: 'Spawn Shop',
            description: 'Emerald starter offers',
            mode: 'plugin',
            category: 'economy',
            tags: ['shop'],
            created: '2025-01-04T08:00:00.000Z',
        },
        {
            id: 'fabric-quest',
            name: 'Fabric Quest',
            description: 'Quest pack',
            mode: 'fabric',
            category: 'quest',
            tags: ['daily'],
            created: '2025-01-06T08:00:00.000Z',
        },
    ], {
        mode: 'plugin',
        category: 'quest',
        searchTerm: 'daily',
    });

    assert.deepEqual(filtered.map((bp) => bp.id), ['quest-new', 'quest-old']);
});