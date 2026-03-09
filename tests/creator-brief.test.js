const test = require('node:test');
const assert = require('node:assert/strict');

const { describePrompt, buildCreatorBrief, inferWizardSeed, buildGraphFromWizardSeed, inferCreatorPath, extractSlashCommand, inferEconomySeed, inferLootSeed, inferQuestSeed, inferRegionSeed, parseEconomyOffers, buildGuidedIntake, buildDeliveryChecklist } = require('../src/shared/creator-brief.js');

test('describePrompt infers join trigger and reward actions', () => {
    const detail = describePrompt('When players join, give them a starter kit and show a welcome title.', 'plugin');

    assert.equal(detail.eventText, 'Main trigger: player join.');
    assert.match(detail.summary, /Plugin Mode/);
    assert.deepEqual(detail.actions, [
        'Players will receive visible feedback.',
        'The flow will likely give a reward or item.',
    ]);
});

test('describePrompt normalizes aliased modes', () => {
    const detail = describePrompt('Create a server menu command.', 'paper');

    assert.match(detail.summary, /Plugin Mode/);
    assert.equal(detail.eventText, 'Main trigger: a player command.');
    assert.ok(detail.actions.includes('The flow will probably open a GUI or menu.'));
});

test('buildCreatorBrief reports empty graph guidance', () => {
    const brief = buildCreatorBrief({ nodes: [], connections: [] });

    assert.equal(brief.summary, 'Start with a trigger or use the one-step AI flow to create your first draft.');
    assert.deepEqual(brief.risks, []);
    assert.deepEqual(brief.nextSteps, ['Add a trigger block or start with the one-step AI flow.']);
});

test('buildCreatorBrief prioritizes validation errors over suggestions', () => {
    const brief = buildCreatorBrief({
        nodes: [{ id: 1, blockId: 'PlayerCommand', params: {} }],
        connections: [],
    }, {
        validation: {
            errors: [{ message: 'Broken connection' }],
            warnings: [{ message: 'Missing slash' }],
        },
        suggestions: [{ text: 'Add CommandEquals guard.' }],
        simulation: {
            steps: ['Player uses a command.'],
            warnings: ['The flow still needs an action.'],
        },
    });

    assert.equal(brief.summary, 'Current graph: 1 block(s), 0 connection(s).');
    assert.deepEqual(brief.steps, ['Player uses a command.']);
    assert.deepEqual(brief.risks, ['Broken connection', 'The flow still needs an action.', 'Missing slash']);
    assert.deepEqual(brief.nextSteps, ['Fix validation errors before generating code.']);
});

test('inferWizardSeed extracts command, teleport and feedback actions', () => {
    const seed = inferWizardSeed('Players can use /spawn to teleport to spawn and hear a sound.', 'paper');

    assert.equal(seed.mode, 'plugin');
    assert.deepEqual(seed.triggers, ['command']);
    assert.deepEqual(seed.actions, ['tp', 'sound']);
    assert.equal(seed.command, '/spawn');
});

test('inferWizardSeed falls back to join with message for generic welcome prompt', () => {
    const seed = inferWizardSeed('When players join, welcome them and give a starter kit.', 'plugin');

    assert.deepEqual(seed.triggers, ['join']);
    assert.deepEqual(seed.actions, ['message', 'give']);
    assert.equal(seed.command, '/spawn');
});

test('buildGraphFromWizardSeed creates plugin command graph with command filter', () => {
    const graph = buildGraphFromWizardSeed({
        mode: 'plugin',
        triggers: ['command'],
        actions: ['tp', 'message'],
        command: '/home',
    });

    assert.equal(graph.mode, 'plugin');
    assert.equal(graph.nodes[0].blockId, 'PlayerCommand');
    assert.equal(graph.nodes[0].params.command, '/home');
    assert.equal(graph.nodes[1].blockId, 'CommandEquals');
    assert.equal(graph.nodes[1].params.cmd, '/home');
    assert.deepEqual(graph.connections, [
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 2, to: 4 },
    ]);
});

test('inferCreatorPath recommends npc designer for dialogue prompts', () => {
    const path = inferCreatorPath('Create an NPC dialogue with quest and trade options.');

    assert.equal(path.recommended, 'npc');
    assert.deepEqual(path.options, ['npc', 'quest', 'shop', 'region', 'loot', 'command']);
});

test('inferCreatorPath recommends region designer for protection prompts', () => {
    const path = inferCreatorPath('Protect the spawn region so players cannot break blocks or pvp there.');

    assert.equal(path.recommended, 'region');
    assert.deepEqual(path.options, ['region', 'quest', 'shop', 'loot', 'npc', 'command']);
});

test('inferCreatorPath recommends loot designer for reward prompts', () => {
    const path = inferCreatorPath('Create a boss loot reward that drops 5 diamonds on death.');

    assert.equal(path.recommended, 'loot');
    assert.deepEqual(path.options, ['loot', 'quest', 'shop', 'region', 'npc', 'command']);
});

test('inferCreatorPath recommends quest designer for objective prompts', () => {
    const path = inferCreatorPath('Create a daily quest where players collect wheat and claim a reward.');

    assert.equal(path.recommended, 'quest');
    assert.deepEqual(path.options, ['quest', 'npc', 'shop', 'region', 'loot', 'command']);
});

test('inferCreatorPath recommends shop designer for menu prompts', () => {
    const path = inferCreatorPath('Open a shop GUI when players type /shop.');

    assert.equal(path.recommended, 'shop');
    assert.deepEqual(path.options, ['shop', 'command', 'quest', 'region', 'loot', 'npc']);
});

test('extractSlashCommand returns fallback when command is missing', () => {
    assert.equal(extractSlashCommand('Give players a starter kit on join.', '/kit'), '/kit');
});

test('inferEconomySeed derives shop defaults from prompt', () => {
    const seed = inferEconomySeed('Open a /shop menu where players can buy emeralds for 250 coins.');

    assert.equal(seed.command, '/shop');
    assert.equal(seed.title, 'Shop');
    assert.equal(seed.item, 'EMERALD');
    assert.equal(seed.itemMaterial, 'EMERALD');
    assert.equal(seed.price, 250);
    assert.equal(seed.amount, 1);
});

test('parseEconomyOffers supports multiple line entries', () => {
    const offers = parseEconomyOffers('EMERALD:1:250\nGOLDEN_APPLE:16:500\nDIAMOND_SWORD:1:1200');

    assert.deepEqual(offers, [
        { id: 'offer_1', material: 'EMERALD', amount: 1, price: 250 },
        { id: 'offer_2', material: 'GOLDEN_APPLE', amount: 16, price: 500 },
        { id: 'offer_3', material: 'DIAMOND_SWORD', amount: 1, price: 1200 },
    ]);
});

test('parseEconomyOffers falls back to inferred single offer', () => {
    const offers = parseEconomyOffers('', 'Open a /shop menu where players can buy emeralds for 250 coins.');

    assert.deepEqual(offers, [
        { id: 'offer_1', material: 'EMERALD', amount: 1, price: 250 },
    ]);
});

test('inferQuestSeed extracts quest defaults from prompt', () => {
    const seed = inferQuestSeed('Create a daily quest where players collect wheat and claim 250 coins from /quest.');

    assert.equal(seed.command, '/quest');
    assert.equal(seed.questName, 'Daily Quest');
    assert.equal(seed.objective, 'Collect items');
    assert.equal(seed.reward, '250 coins');
    assert.equal(seed.npcName, 'Guide Luma');
});

test('inferLootSeed extracts reward defaults from prompt', () => {
    const seed = inferLootSeed('Create a boss loot reward that drops 5 diamonds on death.');

    assert.equal(seed.trigger, 'death');
    assert.equal(seed.command, '/reward');
    assert.equal(seed.material, 'DIAMOND');
    assert.equal(seed.amount, 5);
    assert.equal(seed.rewardName, 'Boss Loot Reward');
});

test('inferRegionSeed extracts protection defaults from prompt', () => {
    const seed = inferRegionSeed('Protect the spawn region so players cannot break blocks or pvp there.');

    assert.equal(seed.world, 'spawn');
    assert.equal(seed.mode, 'pvp');
    assert.equal(seed.regionName, 'Spawn Region');
    assert.equal(seed.message, '&cPvP is disabled in this region.');
});

test('buildGuidedIntake surfaces missing permission context for commands', () => {
    const intake = buildGuidedIntake('Create a /spawn command that teleports players to spawn.', 'plugin');

    assert.equal(intake.known.trigger, 'command');
    assert.equal(intake.known.outcome, 'teleport');
    assert.ok(intake.questions.some((q) => q.includes('access rule')));
    assert.equal(intake.route.recommended, 'command');
});

test('buildDeliveryChecklist includes balance review for economy flows', () => {
    const checklist = buildDeliveryChecklist('Open a /shop GUI where players buy emeralds for coins.', 'plugin');

    assert.ok(checklist.some((item) => item.id === 'balance'));
    assert.ok(checklist.some((item) => item.id === 'permission'));
    assert.ok(checklist.some((item) => item.id === 'release'));
});