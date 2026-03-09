export type NlNode = {
    id: number;
    blockId: string;
    x: number;
    y: number;
    params: Record<string, string>;
};

export type NlConnection = {
    from: number;
    to: number;
};

export type ValidationEntry = {
    code: string;
    message: string;
};

export function normalizeGraphMode(rawMode: string): 'plugin' | 'fabric' | 'forge' | 'skript' {
    const mode = String(rawMode || '').toLowerCase();
    if (mode === 'paper' || mode === 'spigot' || mode === 'bukkit' || mode === 'plugin') return 'plugin';
    if (mode === 'fabric') return 'fabric';
    if (mode === 'forge') return 'forge';
    return 'skript';
}

export function localNlGraph(textRaw: string, platformRaw: string): { nodes: NlNode[]; connections: NlConnection[]; warnings: string[] } {
    const platform = normalizeGraphMode(platformRaw);
    const text = String(textRaw || '').toLowerCase();
    const warnings: string[] = [];

    let eventBlock = '';
    if (platform === 'plugin') {
        if (text.includes('command') || text.includes('/') || text.includes('komut')) eventBlock = 'PlayerCommand';
        else if (text.includes('break') || text.includes('kır')) eventBlock = 'BlockBreak';
        else eventBlock = 'PlayerJoin';
    } else if (platform === 'fabric') {
        eventBlock = text.includes('break') || text.includes('kır') ? 'FabricBlockBreak' : 'FabricPlayerJoin';
    } else if (platform === 'forge') {
        eventBlock = text.includes('break') || text.includes('kır') ? 'ForgeBreak' : 'ForgePlayerLogin';
    } else {
        eventBlock = text.includes('command') || text.includes('/') || text.includes('komut') ? 'SkCommand' : 'SkJoin';
    }

    const nodes: NlNode[] = [];
    nodes.push({
        id: 1,
        blockId: eventBlock,
        x: 100,
        y: 120,
        params: platform === 'plugin' && eventBlock === 'PlayerCommand'
            ? { command: text.match(/\/[a-z0-9_:-]+/i)?.[0] || '/command' }
            : platform === 'skript' && eventBlock === 'SkCommand'
                ? { komut: text.match(/\/[a-z0-9_:-]+/i)?.[0] || '/command' }
                : {},
    });

    let nextId = 2;
    const action = (blockId: string, params: Record<string, string>, y: number): NlNode => ({
        id: nextId++,
        blockId,
        x: 360 + (nextId - 3) * 230,
        y,
        params,
    });

    if (platform === 'plugin') {
        if (text.includes('/spawn') || text.includes('spawn') || text.includes('teleport') || text.includes('ışınla')) {
            if (eventBlock !== 'PlayerCommand') warnings.push('Teleport flow usually works better with a command event.');
            nodes.push(action('CommandEquals', { cmd: '/spawn' }, 80));
            nodes.push(action('Teleport', { x: '0', y: '80', z: '0' }, 80));
            nodes.push(action('SendMessage', { mesaj: '&aTeleported to spawn.' }, 200));
        } else if (text.includes('reward') || text.includes('ödül') || text.includes('diamond') || text.includes('elmas')) {
            nodes.push(action('GiveItem', { material: 'DIAMOND', adet: '1' }, 80));
            nodes.push(action('SendMessage', { mesaj: '&aReward granted.' }, 200));
        } else if (text.includes('broadcast') || text.includes('duyuru')) {
            nodes.push(action('Broadcast', { mesaj: '&eAnnouncement' }, 120));
        } else {
            nodes.push(action('SendMessage', { mesaj: '&aAction completed.' }, 120));
        }
    } else if (platform === 'fabric') {
        if (text.includes('teleport') || text.includes('spawn')) nodes.push(action('FabricTeleport', { x: '0', y: '100', z: '0' }, 80));
        if (text.includes('reward') || text.includes('ödül') || text.includes('diamond')) nodes.push(action('FabricGiveItem', { item: 'minecraft:diamond', adet: '1' }, 200));
        nodes.push(action('FabricSendMsg', { mesaj: 'Action completed.' }, 120));
    } else if (platform === 'forge') {
        if (text.includes('teleport') || text.includes('spawn')) nodes.push(action('ForgeTeleport', { x: '0', y: '100', z: '0' }, 80));
        if (text.includes('cancel') || text.includes('iptal')) nodes.push(action('ForgeCancelEvent', {}, 200));
        nodes.push(action('ForgeSendMsg', { mesaj: 'Action completed.' }, 120));
    } else {
        if (text.includes('teleport') || text.includes('spawn')) nodes.push(action('SkTeleport', { x: '0', y: '80', z: '0' }, 80));
        nodes.push(action('SkSendMsg', { mesaj: '&aAction completed.' }, 120));
    }

    const connections: NlConnection[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({ from: nodes[i].id, to: nodes[i + 1].id });
    }
    return { nodes, connections, warnings };
}

export function validateGraphShape(graph: { mode?: string; nodes?: NlNode[]; connections?: NlConnection[] }): { errors: ValidationEntry[]; warnings: ValidationEntry[]; autoFixes: Array<{ nodeId: number; field: string; value: string }> } {
    const errors: ValidationEntry[] = [];
    const warnings: ValidationEntry[] = [];
    const autoFixes: Array<{ nodeId: number; field: string; value: string }> = [];

    const mode = normalizeGraphMode(graph.mode || 'plugin');
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const connections = Array.isArray(graph.connections) ? graph.connections : [];
    const byId = new Set(nodes.map((n) => n.id));

    if (!nodes.length) {
        errors.push({ code: 'EMPTY_GRAPH', message: 'No blocks on canvas.' });
        return { errors, warnings, autoFixes };
    }

    const hasEvent = nodes.some((n) => /^(Player|Block|Entity|Inventory|Server|GUI|Fabric|Forge|Sk)/.test(String(n.blockId || '')));
    if (!hasEvent) errors.push({ code: 'MISSING_EVENT', message: 'Add at least one event block.' });

    for (const c of connections) {
        if (!byId.has(c.from) || !byId.has(c.to)) errors.push({ code: 'BROKEN_CONNECTION', message: `Broken connection ${c.from} -> ${c.to}` });
        if (c.from === c.to) errors.push({ code: 'SELF_CONNECTION', message: `Self connection on node ${c.from}` });
    }

    for (const n of nodes) {
        if (n.blockId === 'PlayerCommand') {
            const cmd = String(n.params?.command || '').trim();
            if (!cmd) {
                errors.push({ code: 'MISSING_COMMAND', message: 'PlayerCommand requires a command value.' });
                autoFixes.push({ nodeId: n.id, field: 'command', value: '/command' });
            } else if (!cmd.startsWith('/')) {
                warnings.push({ code: 'COMMAND_PREFIX', message: 'PlayerCommand should start with /' });
                autoFixes.push({ nodeId: n.id, field: 'command', value: '/' + cmd });
            }
        }
        if (n.blockId === 'SkCommand') {
            const cmd = String(n.params?.komut || '').trim();
            if (!cmd) {
                errors.push({ code: 'MISSING_COMMAND', message: 'SkCommand requires a command value.' });
                autoFixes.push({ nodeId: n.id, field: 'komut', value: '/command' });
            } else if (!cmd.startsWith('/')) {
                warnings.push({ code: 'COMMAND_PREFIX', message: 'SkCommand should start with /' });
                autoFixes.push({ nodeId: n.id, field: 'komut', value: '/' + cmd });
            }
        }
        if (/Teleport$/.test(String(n.blockId || ''))) {
            const x = Number(n.params?.x);
            const y = Number(n.params?.y);
            const z = Number(n.params?.z);
            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
                errors.push({ code: 'INVALID_COORDS', message: `${n.blockId} requires numeric x/y/z values.` });
                autoFixes.push({ nodeId: n.id, field: 'x', value: '0' });
                autoFixes.push({ nodeId: n.id, field: 'y', value: mode === 'plugin' || mode === 'skript' ? '80' : '100' });
                autoFixes.push({ nodeId: n.id, field: 'z', value: '0' });
            }
        }
        if (n.blockId === 'GiveItem') {
            const mat = String(n.params?.material || '');
            if (mat && !/^[A-Z0-9_]+$/.test(mat)) warnings.push({ code: 'MATERIAL_CASE', message: 'GiveItem material should be uppercase enum (e.g. DIAMOND).' });
        }
        if (n.blockId === 'FabricGiveItem' || n.blockId === 'ForgeGiveItem') {
            const item = String(n.params?.item || '');
            if (item && !item.includes(':')) warnings.push({ code: 'ITEM_NAMESPACE', message: `${n.blockId} item should include namespace (minecraft:diamond).` });
        }
    }

    return { errors, warnings, autoFixes };
}
