const test = require('node:test');
const assert = require('node:assert/strict');

const { generateFromGraph } = require('../src/renderer/visual-builder-codegen.js');

test('plugin join graph generates listener and message flow', () => {
    const code = generateFromGraph({
        mode: 'plugin',
        nodes: [
            { id: 1, blockId: 'PlayerJoin', type: 'event', params: {} },
            { id: 2, blockId: 'SendMessage', type: 'action', params: { mesaj: '&aHos geldin!' } },
        ],
        connections: [{ from: 1, to: 2 }],
    });

    assert.match(code, /class Main extends JavaPlugin implements Listener/);
    assert.match(code, /public void onPlayerJoin\(PlayerJoinEvent event\)/);
    assert.match(code, /sendMessage/);
});

test('plugin command graph generates command equality guard', () => {
    const code = generateFromGraph({
        mode: 'plugin',
        nodes: [
            { id: 1, blockId: 'PlayerCommand', type: 'event', params: { command: '/spawn' } },
            { id: 2, blockId: 'CommandEquals', type: 'condition', params: { cmd: '/spawn' } },
            { id: 3, blockId: 'Teleport', type: 'action', params: { x: '0', y: '80', z: '0' } },
        ],
        connections: [{ from: 1, to: 2 }, { from: 2, to: 3 }],
    });

    assert.match(code, /PlayerCommandPreprocessEvent/);
    assert.match(code, /equalsIgnoreCase\("\/spawn"\)/);
    assert.match(code, /teleport/);
});

test('skript join graph generates event and send action', () => {
    const code = generateFromGraph({
        mode: 'skript',
        nodes: [
            { id: 1, blockId: 'SkJoin', type: 'event', params: {} },
            { id: 2, blockId: 'SkSendMsg', type: 'action', params: { mesaj: '&aHello %player%!' } },
        ],
        connections: [{ from: 1, to: 2 }],
    });

    assert.match(code, /on join:/);
    assert.match(code, /send "&aHello %player%!" to player/);
});

test('fabric graph generates initializer registration', () => {
    const code = generateFromGraph({
        mode: 'fabric',
        nodes: [
            { id: 1, blockId: 'FabricPlayerJoin', type: 'event', params: {} },
            { id: 2, blockId: 'FabricSendMsg', type: 'action', params: { mesaj: 'Welcome!' } },
        ],
        connections: [{ from: 1, to: 2 }],
    });

    assert.match(code, /implements ModInitializer/);
    assert.match(code, /ServerPlayConnectionEvents\.JOIN\.register/);
    assert.match(code, /player\.sendMessage/);
});

test('forge graph generates subscribe event handler', () => {
    const code = generateFromGraph({
        mode: 'forge',
        nodes: [
            { id: 1, blockId: 'ForgePlayerLogin', type: 'event', params: {} },
            { id: 2, blockId: 'ForgeSendMsg', type: 'action', params: { mesaj: 'Welcome!' } },
        ],
        connections: [{ from: 1, to: 2 }],
    });

    assert.match(code, /@SubscribeEvent/);
    assert.match(code, /PlayerEvent\.PlayerLoggedInEvent/);
    assert.match(code, /sendSystemMessage/);
});
