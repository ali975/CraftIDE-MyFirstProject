function interpolate(template, params) {
    if (!params) return String(template || '');
    return Object.entries(params).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), String(template || ''));
}

function defaultTranslate(key, fallback, params) {
    if (!fallback) return key;
    return interpolate(fallback, params);
}

function normalizeMode(mode) {
    const raw = String(mode || '').toLowerCase();
    if (raw === 'paper' || raw === 'spigot' || raw === 'bukkit') return 'plugin';
    if (raw === 'fabric' || raw === 'forge' || raw === 'skript') return raw;
    return 'plugin';
}

function createTranslator(options) {
    return typeof options?.translate === 'function' ? options.translate : defaultTranslate;
}

function describePrompt(prompt, mode, options = {}) {
    const t = createTranslator(options);
    const text = String(prompt || '').trim();
    if (!text) return null;

    const lower = text.toLowerCase();
    const normalizedMode = normalizeMode(mode);
    const eventText = lower.includes('/spawn') || lower.includes('command') || lower.includes('komut')
        ? t('ui.nc.creator.event.command', 'Main trigger: a player command.')
        : lower.includes('join') || lower.includes('giris') || lower.includes('katil')
            ? t('ui.nc.creator.event.join', 'Main trigger: player join.')
            : lower.includes('death') || lower.includes('ol')
                ? t('ui.nc.creator.event.death', 'Main trigger: player death.')
                : lower.includes('break') || lower.includes('kir')
                    ? t('ui.nc.creator.event.break', 'Main trigger: block break.')
                    : t('ui.nc.creator.event.generic', 'Main trigger: a Minecraft event or interaction.');

    const actions = [];
    if (lower.includes('message') || lower.includes('mesaj') || lower.includes('title')) actions.push(t('ui.nc.creator.action.message', 'Players will receive visible feedback.'));
    if (lower.includes('item') || lower.includes('kit') || lower.includes('reward') || lower.includes('odul')) actions.push(t('ui.nc.creator.action.reward', 'The flow will likely give a reward or item.'));
    if (lower.includes('teleport') || lower.includes('spawn') || lower.includes('isin')) actions.push(t('ui.nc.creator.action.teleport', 'The flow will move players to a location.'));
    if (lower.includes('gui') || lower.includes('menu')) actions.push(t('ui.nc.creator.action.gui', 'The flow will probably open a GUI or menu.'));
    if (lower.includes('permission') || lower.includes('yetki') || lower.includes('op')) actions.push(t('ui.nc.creator.action.permission', 'The flow may need access control.'));
    if (!actions.length) actions.push(t('ui.nc.creator.action.generic', 'The request will be converted into a visual event-action flow.'));

    const modeLabel = normalizedMode === 'skript'
        ? t('mode.skript', 'Skript Mode')
        : normalizedMode === 'fabric'
            ? t('mode.fabric', 'Fabric Mode')
            : normalizedMode === 'forge'
                ? t('mode.forge', 'Forge Mode')
                : t('mode.plugin', 'Plugin Mode');

    return {
        summary: t('ui.nc.creator.promptSummary', 'CraftIDE will prepare a {mode} draft from this idea.', { mode: modeLabel }),
        eventText,
        actions,
        nextStep: t('ui.nc.creator.promptNext', 'Start the flow, review the generated graph, then use validation to fill any missing logic.'),
        badge: t('ui.welcome.idea.previewBadge', 'Draft'),
    };
}

function inferWizardSeed(prompt, mode) {
    const text = String(prompt || '').trim();
    const lower = text.toLowerCase();
    const normalizedMode = normalizeMode(mode);
    const slashMatch = text.match(/\/[a-z0-9:_-]+/i);

    const triggers = [];
    if (slashMatch || lower.includes('command') || lower.includes('komut') || lower.includes('menu')) triggers.push('command');
    if (lower.includes('join') || lower.includes('giris') || lower.includes('katil') || lower.includes('welcome')) triggers.push('join');
    if (lower.includes('death') || lower.includes('ol')) triggers.push('death');
    if (lower.includes('break') || lower.includes('kir')) triggers.push('break');
    if (!triggers.length) triggers.push(slashMatch ? 'command' : 'join');

    const actions = [];
    if (lower.includes('message') || lower.includes('mesaj') || lower.includes('title') || lower.includes('welcome')) actions.push('message');
    if (lower.includes('item') || lower.includes('kit') || lower.includes('reward') || lower.includes('odul') || lower.includes('starter')) actions.push('give');
    if (lower.includes('teleport') || lower.includes('spawn') || lower.includes('warp') || lower.includes('isin')) actions.push('tp');
    if (lower.includes('sound') || lower.includes('ses')) actions.push('sound');
    if (!actions.length) actions.push('message');

    return {
        mode: normalizedMode,
        triggers: [...new Set(triggers)],
        actions: [...new Set(actions)],
        command: slashMatch ? slashMatch[0] : '/spawn',
        prompt: text,
    };
}

function inferCreatorPath(prompt) {
    const text = String(prompt || '').trim();
    const lower = text.toLowerCase();
    if (!text) return { recommended: 'command', options: ['command', 'shop', 'quest', 'region', 'loot', 'npc'] };
    if (lower.includes('npc') || lower.includes('dialog') || lower.includes('villager') || lower.includes('trade')) {
        return { recommended: 'npc', options: ['npc', 'quest', 'shop', 'region', 'loot', 'command'] };
    }
    if (lower.includes('region') || lower.includes('protect') || lower.includes('protection') || lower.includes('pvp') || lower.includes('grief') || lower.includes('safe zone') || lower.includes('land claim') || lower.includes('claim area')) {
        return { recommended: 'region', options: ['region', 'quest', 'shop', 'loot', 'npc', 'command'] };
    }
    if (lower.includes('quest') || lower.includes('objective') || lower.includes('collect') || lower.includes('kill ') || lower.includes('deliver') || lower.includes('mission')) {
        return { recommended: 'quest', options: ['quest', 'npc', 'shop', 'region', 'loot', 'command'] };
    }
    if (lower.includes('loot') || lower.includes('reward') || lower.includes('crate') || lower.includes('drop') || lower.includes('boss loot') || lower.includes('starter kit')) {
        return { recommended: 'loot', options: ['loot', 'quest', 'shop', 'region', 'npc', 'command'] };
    }
    if (lower.includes('shop') || lower.includes('gui') || lower.includes('menu') || lower.includes('inventory')) {
        return { recommended: 'shop', options: ['shop', 'command', 'quest', 'region', 'loot', 'npc'] };
    }
    return { recommended: 'command', options: ['command', 'shop', 'quest', 'region', 'loot', 'npc'] };
}

function extractSlashCommand(prompt, fallback = '/spawn') {
    const match = String(prompt || '').match(/\/[a-z0-9:_-]+/i);
    return match ? match[0] : fallback;
}

function inferEconomySeed(prompt) {
    const text = String(prompt || '').trim();
    const lower = text.toLowerCase();
    const command = extractSlashCommand(text, '/shop');
    const commandName = command.replace(/^[\/]/, '').replace(/[-_]/g, ' ').trim() || 'shop';
    const baseTitle = commandName.replace(/\b\w/g, (char) => char.toUpperCase());
    const title = /shop$/i.test(baseTitle) ? baseTitle : `${baseTitle} Shop`;

    const itemMaterial = lower.includes('emerald') ? 'EMERALD'
        : lower.includes('gold') ? 'GOLD_INGOT'
            : lower.includes('apple') ? 'GOLDEN_APPLE'
                : lower.includes('sword') ? 'DIAMOND_SWORD'
                    : 'DIAMOND';

    const numberMatch = text.match(/\b(\d{1,5})\b/);
    const value = numberMatch ? Number(numberMatch[1]) : null;
    const price = value || (lower.includes('cheap') ? 25 : 100);
    const amount = lower.includes('kit') ? 1 : (value && value <= 64 ? Math.max(1, Math.min(16, value)) : 1);

    return {
        command,
        title,
        item: itemMaterial,
        itemMaterial,
        price,
        amount,
        prompt: text,
    };
}

function inferQuestSeed(prompt) {
    const text = String(prompt || '').trim();
    const lower = text.toLowerCase();
    const command = extractSlashCommand(text, '/quest');
    const questName = lower.includes('daily') ? 'Daily Quest'
        : lower.includes('hunter') ? 'Hunter Quest'
            : lower.includes('farmer') ? 'Farmer Quest'
                : 'Village Quest';

    const objective = lower.includes('collect') ? 'Collect items'
        : lower.includes('kill') ? 'Defeat mobs'
            : lower.includes('deliver') ? 'Deliver supplies'
                : 'Talk to the guide';

    const reward = lower.includes('money') || lower.includes('coin') ? '250 coins'
        : lower.includes('emerald') ? '8 emeralds'
            : lower.includes('diamond') ? '3 diamonds'
                : 'Starter reward bundle';

    const npcName = lower.includes('merchant') ? 'Merchant Mira'
        : lower.includes('captain') ? 'Captain Rowan'
            : lower.includes('farmer') ? 'Farmer Elio'
                : 'Guide Luma';

    return {
        command,
        questName,
        objective,
        reward,
        npcName,
        prompt: text,
    };
}

function inferRegionSeed(prompt) {
    const text = String(prompt || '').trim();
    const lower = text.toLowerCase();
    const world = lower.includes('spawn') ? 'spawn'
        : lower.includes('lobby') ? 'lobby'
            : lower.includes('arena') ? 'arena'
                : 'protected';
    const mode = lower.includes('place') ? 'place'
        : lower.includes('pvp') || lower.includes('damage') ? 'pvp'
            : 'break';
    const regionName = world.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) + ' Region';
    const message = mode === 'place' ? '&cYou cannot place blocks in this region.'
        : mode === 'pvp' ? '&cPvP is disabled in this region.'
            : '&cYou cannot break blocks in this region.';

    return {
        world,
        mode,
        regionName,
        message,
        prompt: text,
    };
}

function inferLootSeed(prompt) {
    const text = String(prompt || '').trim();
    const lower = text.toLowerCase();
    const trigger = lower.includes('death') || lower.includes('boss') || lower.includes('kill') ? 'death'
        : lower.includes('join') ? 'join'
            : lower.includes('command') || /\/[a-z0-9:_-]+/i.test(text) ? 'command'
                : 'join';
    const command = extractSlashCommand(text, '/reward');
    const material = lower.includes('emerald') ? 'EMERALD'
        : lower.includes('gold') ? 'GOLD_INGOT'
            : lower.includes('bread') ? 'BREAD'
                : lower.includes('sword') ? 'DIAMOND_SWORD'
                    : 'DIAMOND';
    const amountMatch = text.match(/\b(\d{1,3})\b/);
    const amount = amountMatch ? Math.max(1, Number(amountMatch[1])) : 3;
    const rewardName = lower.includes('crate') ? 'Epic Crate Reward'
        : lower.includes('boss') ? 'Boss Loot Reward'
            : lower.includes('starter') ? 'Starter Reward'
                : 'Player Reward';
    const message = `&aReward granted: ${amount}x ${material}.`;

    return {
        trigger,
        command,
        material,
        amount,
        rewardName,
        message,
        prompt: text,
    };
}

function parseEconomyOffers(input, prompt = '') {
    const text = String(input || '').trim();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const offers = lines.map((line, index) => {
        const parts = line.split(/\s*[:|,]\s*/).map((part) => part.trim()).filter(Boolean);
        if (parts.length < 3) return null;
        const material = String(parts[0] || '').toUpperCase().replace(/\s+/g, '_');
        const amount = Number(parts[1]);
        const price = Number(parts[2]);
        if (!material || !Number.isFinite(amount) || !Number.isFinite(price)) return null;
        return {
            id: `offer_${index + 1}`,
            material,
            amount: Math.max(1, Math.floor(amount)),
            price: Math.max(1, Math.floor(price)),
        };
    }).filter(Boolean);

    if (offers.length) return offers;

    const seed = inferEconomySeed(prompt || text);
    return [{
        id: 'offer_1',
        material: seed.item || seed.itemMaterial || 'DIAMOND',
        amount: Math.max(1, Math.floor(Number(seed.amount) || 1)),
        price: Math.max(1, Math.floor(Number(seed.price) || 100)),
    }];
}

const WIZARD_GRAPH_CONFIG = {
    plugin: {
        triggers: { join: 'PlayerJoin', command: 'PlayerCommand', death: 'PlayerDeath', break: 'BlockBreak' },
        actions: {
            message: ['SendMessage', { mesaj: '&aMerhaba!' }],
            give: ['GiveItem', { material: 'DIAMOND', adet: '1' }],
            tp: ['Teleport', { x: '0', y: '80', z: '0' }],
            sound: ['PlaySound', { ses: 'ENTITY_EXPERIENCE_ORB_PICKUP' }],
        },
        cmdFilter: 'CommandEquals',
    },
    fabric: {
        triggers: { join: 'FabricPlayerJoin', command: 'FabricPlayerJoin', death: 'FabricPlayerJoin', break: 'FabricBlockBreak' },
        actions: {
            message: ['FabricSendMsg', { mesaj: 'Merhaba!' }],
            give: ['FabricGiveItem', { item: 'minecraft:diamond', adet: '1' }],
            tp: ['FabricTeleport', { x: '0', y: '80', z: '0' }],
            sound: ['FabricPlaySound', { ses: 'minecraft:entity.experience_orb.pickup' }],
        },
    },
    forge: {
        triggers: { join: 'ForgePlayerLogin', command: 'ForgePlayerLogin', death: 'ForgeLivingDamage', break: 'ForgeBreak' },
        actions: {
            message: ['ForgeSendMsg', { mesaj: 'Merhaba!' }],
            give: ['ForgeSendMsg', { mesaj: 'Odul verildi.' }],
            tp: ['ForgeTeleport', { x: '0', y: '80', z: '0' }],
            sound: ['ForgeSendMsg', { mesaj: 'Ses calindi.' }],
        },
    },
    skript: {
        triggers: { join: 'SkJoin', command: 'SkCommand', death: 'SkDeath', break: 'SkBreak' },
        actions: {
            message: ['SkSendMsg', { mesaj: '&aMerhaba!' }],
            give: ['SkGiveItem', { item: 'diamond', adet: '1' }],
            tp: ['SkTeleport', { x: '0', y: '80', z: '0' }],
            sound: ['SkPlaySound', { ses: 'entity.experience_orb.pickup' }],
        },
    },
};

function buildGraphFromWizardSeed(seed) {
    const normalizedSeed = seed && typeof seed === 'object' ? seed : {};
    const mode = normalizeMode(normalizedSeed.mode);
    const cfg = WIZARD_GRAPH_CONFIG[mode] || WIZARD_GRAPH_CONFIG.plugin;
    const triggers = Array.isArray(normalizedSeed.triggers) && normalizedSeed.triggers.length ? normalizedSeed.triggers : ['join'];
    const actions = Array.isArray(normalizedSeed.actions) && normalizedSeed.actions.length ? normalizedSeed.actions : ['message'];
    const command = String(normalizedSeed.command || '/spawn').trim();
    const normalizedCommand = command.startsWith('/') ? command : `/${command}`;

    const graph = { version: '2', mode, nodes: [], connections: [] };
    let id = 1;

    triggers.forEach((triggerKey, row) => {
        const triggerBlock = cfg.triggers[triggerKey];
        if (!triggerBlock) return;

        const eventId = id++;
        const eventNode = { id: eventId, blockId: triggerBlock, x: 80, y: 80 + row * 220, params: {} };
        if (triggerKey === 'command') {
            if (mode === 'plugin') eventNode.params.command = normalizedCommand;
            if (mode === 'skript') eventNode.params.komut = normalizedCommand;
        }
        graph.nodes.push(eventNode);

        let from = eventId;
        if (triggerKey === 'command' && mode === 'plugin' && cfg.cmdFilter) {
            const commandCheckId = id++;
            graph.nodes.push({
                id: commandCheckId,
                blockId: cfg.cmdFilter,
                x: 320,
                y: 80 + row * 220,
                params: { cmd: eventNode.params.command || normalizedCommand },
            });
            graph.connections.push({ from: eventId, to: commandCheckId });
            from = commandCheckId;
        }

        actions.forEach((actionKey, col) => {
            const actionDef = cfg.actions[actionKey];
            if (!actionDef) return;
            const actionId = id++;
            graph.nodes.push({
                id: actionId,
                blockId: actionDef[0],
                x: 560 + Math.floor(col / 2) * 220,
                y: 40 + row * 220 + (col % 2) * 90,
                params: { ...(actionDef[1] || {}) },
            });
            graph.connections.push({ from, to: actionId });
        });
    });

    return graph;
}

function formatMessage(entry, options = {}) {
    const t = createTranslator(options);
    if (entry && typeof entry === 'object' && entry.messageKey) {
        return t(entry.messageKey, entry.message || options.fallbackText || options.fallbackKey, entry.messageParams || {});
    }
    if (typeof entry?.message === 'string') return entry.message;
    return t(options.fallbackKey || 'ui.nc.validation.warning', options.fallbackText || 'Validation warning');
}

function buildCreatorBrief(graph, options = {}) {
    const t = createTranslator(options);
    const safeGraph = graph && typeof graph === 'object' ? graph : { nodes: [], connections: [] };
    const validation = options.validation || { errors: [], warnings: [] };
    const suggestions = Array.isArray(options.suggestions) ? options.suggestions : [];
    const simulation = options.simulation || null;
    const steps = Array.isArray(simulation?.steps) ? simulation.steps : [];
    const warnings = [
        ...(simulation?.warnings || []),
        ...(validation.warnings || []).map((warning) => formatMessage(warning, { ...options, fallbackKey: 'ui.nc.validation.warning', fallbackText: 'Validation warning' })),
    ];
    const errors = (validation.errors || []).map((error) => formatMessage(error, { ...options, fallbackKey: 'ui.nc.validation.error', fallbackText: 'Validation error' }));

    if (!safeGraph.nodes?.length) {
        return {
            summary: t('ui.nc.creator.emptySummary', 'Start with a trigger or use the one-step AI flow to create your first draft.'),
            steps: [],
            risks: [],
            nextSteps: [t('ui.nc.creator.next.addTrigger', 'Add a trigger block or start with the one-step AI flow.')],
        };
    }

    const nextSteps = [];
    if (errors.length) nextSteps.push(t('ui.nc.creator.next.fixErrors', 'Fix validation errors before generating code.'));
    if (!errors.length && suggestions.length) nextSteps.push(...suggestions.slice(0, 2).map((suggestion) => suggestion.text));
    if (!nextSteps.length) nextSteps.push(t('ui.nc.creator.next.generate', 'Generate code or run the guaranteed build flow next.'));

    return {
        summary: t('ui.nc.creator.graphSummary', 'Current graph: {nodes} block(s), {connections} connection(s).', {
            nodes: safeGraph.nodes.length,
            connections: (safeGraph.connections || []).length,
        }),
        steps: steps.slice(0, 4),
        risks: [...errors, ...warnings].slice(0, 4),
        nextSteps,
    };
}

module.exports = {
    describePrompt,
    buildCreatorBrief,
    buildGraphFromWizardSeed,
    extractSlashCommand,
    inferEconomySeed,
    inferLootSeed,
    inferQuestSeed,
    inferRegionSeed,
    parseEconomyOffers,
    inferCreatorPath,
    inferWizardSeed,
    normalizeMode,
};