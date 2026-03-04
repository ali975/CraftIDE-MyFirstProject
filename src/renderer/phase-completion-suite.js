
/**
 * CraftIDE Phase Completion Suite
 * Implements roadmap MVP features across phases 2-5.
 */
(() => {
    const { ipcRenderer } = require('electron');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const U = window.CraftIDEPhaseUtils || {};

    const STATE = {
        modalMounted: false,
        watcher: null,
        watcherEvents: [],
        hotReload: false,
        extensions: new Map(),
        extensionBus: new Map(),
        performanceMode: false,
        perfTimer: null,
        updateChannel: localStorage.getItem('craftide.update.channel') || 'stable',
    };

    const MATERIALS = ['DIAMOND', 'NETHERITE_SWORD', 'GOLDEN_APPLE', 'TOTEM_OF_UNDYING', 'SHIELD', 'BOW', 'ELYTRA'];

    function esc(value) {
        const d = document.createElement('div');
        d.textContent = String(value || '');
        return d.innerHTML;
    }

    function notify(msg, type = 'info') {
        if (window.CraftIDEAppState?.showNotification) window.CraftIDEAppState.showNotification(msg, type);
        else console.log(`[${type}] ${msg}`);
    }

    function currentMode() {
        const mode = String(window.CraftIDEVB?.getMode?.() || 'plugin').toLowerCase();
        if (mode === 'paper' || mode === 'spigot' || mode === 'bukkit') return 'plugin';
        return mode;
    }

    function currentGraph() {
        return window.CraftIDEVB?.exportGraph?.() || { version: '2', mode: currentMode(), nodes: [], connections: [] };
    }

    function applyGraph(graph) {
        if (!window.CraftIDEVB?.importGraph) return false;
        const normalized = JSON.parse(JSON.stringify(graph || {}));
        normalized.version = '2';
        normalized.mode = normalized.mode || currentMode();
        normalized.nodes = Array.isArray(normalized.nodes) ? normalized.nodes : [];
        normalized.connections = Array.isArray(normalized.connections) ? normalized.connections : [];
        window.CraftIDEVB.importGraph(normalized, { clear: true });
        return true;
    }

    function openGeneratedTab(fileName, content, languageHint) {
        const app = window.CraftIDEAppState;
        const map = app?.getOpenFiles?.();
        if (!(map instanceof Map) || !app.addTab || !app.activateTab) {
            notify('Generated output created but tab API is unavailable.', 'warn');
            return;
        }
        const pathId = `generated://${fileName}`;
        map.set(pathId, {
            content: String(content || ''),
            modified: false,
            virtual: true,
            generated: true,
            languageHint: languageHint || 'plaintext',
        });
        const old = document.querySelector(`.tab[data-tab="${CSS.escape(pathId)}"]`);
        if (old) old.remove();
        app.addTab(pathId, fileName);
        app.activateTab(pathId);
    }

    function countTemplates() {
        return Number(window.CraftIDEVB?.getTemplates?.().length || 0);
    }

    function getExtraTemplates() {
        return [
            { id: 'auto_message', name: 'Auto Message Loop', desc: 'RepeatTask + Broadcast loop', mode: 'plugin', category: 'social', nodes: [{ blockId: 'ServerLoad', x: 80, y: 120 }, { blockId: 'RepeatTask', x: 320, y: 120, params: { baslangic: '20', aralik: '1200' } }, { blockId: 'Broadcast', x: 560, y: 120, params: { mesaj: '&eRemember to vote for rewards!' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'afk_checker', name: 'AFK Checker', desc: 'Move event + delay based AFK check', mode: 'plugin', category: 'management', nodes: [{ blockId: 'PlayerMove', x: 80, y: 100 }, { blockId: 'Delay', x: 320, y: 100, params: { tick: '200' } }, { blockId: 'SendMessage', x: 560, y: 100, params: { mesaj: '&7You seem AFK.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'join_firework', name: 'Join Firework', desc: 'Welcome + sound on join', mode: 'plugin', category: 'fun', nodes: [{ blockId: 'PlayerJoin', x: 80, y: 120 }, { blockId: 'PlaySound', x: 320, y: 80, params: { ses: 'ENTITY_FIREWORK_ROCKET_BLAST' } }, { blockId: 'SendTitle', x: 320, y: 200, params: { baslik: '&6Welcome', alt: '&eEnjoy your stay' } }], connections: [{ from: 0, to: 1 }, { from: 0, to: 2 }] },
            { id: 'death_announce', name: 'Death Announce', desc: 'Broadcast when player dies', mode: 'plugin', category: 'social', nodes: [{ blockId: 'PlayerDeath', x: 80, y: 120 }, { blockId: 'Broadcast', x: 320, y: 120, params: { mesaj: '&cA player has fallen in battle!' } }], connections: [{ from: 0, to: 1 }] },
            { id: 'kit_basic', name: 'Starter Kit Command', desc: '/kit command with item reward', mode: 'plugin', category: 'management', nodes: [{ blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/kit' } }, { blockId: 'CommandEquals', x: 320, y: 80, params: { cmd: '/kit' } }, { blockId: 'GiveItem', x: 560, y: 80, params: { material: 'IRON_SWORD', adet: '1' } }, { blockId: 'SendMessage', x: 560, y: 200, params: { mesaj: '&aStarter kit delivered.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }] },
            { id: 'duel_request', name: 'Duel Request', desc: '/duel command message flow', mode: 'plugin', category: 'pvp', nodes: [{ blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/duel' } }, { blockId: 'CommandEquals', x: 320, y: 120, params: { cmd: '/duel' } }, { blockId: 'Broadcast', x: 560, y: 120, params: { mesaj: '&6A duel request was sent!' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'vote_reward', name: 'Vote Reward', desc: '/vote claim reward', mode: 'plugin', category: 'economy', nodes: [{ blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/vote' } }, { blockId: 'CommandEquals', x: 320, y: 80, params: { cmd: '/vote' } }, { blockId: 'GiveMoney', x: 560, y: 80, params: { miktar: '250' } }, { blockId: 'SendMessage', x: 560, y: 200, params: { mesaj: '&aYou received vote credits.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }] },
            { id: 'boss_spawn', name: 'Boss Spawn Event', desc: 'Spawn entity on server start', mode: 'plugin', category: 'pve', nodes: [{ blockId: 'ServerLoad', x: 80, y: 120 }, { blockId: 'SpawnEntity', x: 320, y: 120, params: { entityType: 'WITHER' } }, { blockId: 'Broadcast', x: 560, y: 120, params: { mesaj: '&4A boss has appeared!' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'custom_recipe_hint', name: 'Custom Recipe Hint', desc: 'Command opens recipe hint', mode: 'plugin', category: 'crafting', nodes: [{ blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/recipe' } }, { blockId: 'CommandEquals', x: 320, y: 120, params: { cmd: '/recipe' } }, { blockId: 'SendMessage', x: 560, y: 120, params: { mesaj: '&eUse the custom crafting menu.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'region_protect', name: 'Region Protect', desc: 'Cancel break in protected world', mode: 'plugin', category: 'protection', nodes: [{ blockId: 'BlockBreak', x: 80, y: 120 }, { blockId: 'IsInWorld', x: 320, y: 120, params: { world: 'spawn' } }, { blockId: 'CancelEvent', x: 560, y: 120 }, { blockId: 'SendMessage', x: 560, y: 230, params: { mesaj: '&cYou cannot break blocks here.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }] },
            { id: 'fabric_reward', name: 'Fabric Reward Join', desc: 'Join reward for Fabric', mode: 'fabric', category: 'economy', nodes: [{ blockId: 'FabricPlayerJoin', x: 80, y: 120 }, { blockId: 'FabricGiveItem', x: 320, y: 90, params: { item: 'minecraft:diamond', adet: '2' } }, { blockId: 'FabricSendMsg', x: 320, y: 210, params: { mesaj: 'Reward granted.' } }], connections: [{ from: 0, to: 1 }, { from: 0, to: 2 }] },
            { id: 'fabric_spawn_cmd', name: 'Fabric Spawn Warp', desc: 'Teleport on interact', mode: 'fabric', category: 'fun', nodes: [{ blockId: 'FabricInteract', x: 80, y: 120 }, { blockId: 'FabricTeleport', x: 320, y: 120, params: { x: '0', y: '100', z: '0' } }, { blockId: 'FabricSendMsg', x: 560, y: 120, params: { mesaj: 'Warped.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'fabric_event_guard', name: 'Fabric Event Guard', desc: 'Permission check flow', mode: 'fabric', category: 'protection', nodes: [{ blockId: 'FabricPlayerJoin', x: 80, y: 120 }, { blockId: 'FabricHasPermission', x: 320, y: 120, params: { perm: 'craftide.vip' } }, { blockId: 'FabricSendMsg', x: 560, y: 120, params: { mesaj: 'Permission checked.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'forge_login_bonus', name: 'Forge Login Bonus', desc: 'Reward flow for Forge login', mode: 'forge', category: 'economy', nodes: [{ blockId: 'ForgePlayerLogin', x: 80, y: 120 }, { blockId: 'ForgeGiveItem', x: 320, y: 80, params: { item: 'minecraft:emerald', adet: '4' } }, { blockId: 'ForgeSendMsg', x: 320, y: 220, params: { mesaj: 'Welcome bonus delivered.' } }], connections: [{ from: 0, to: 1 }, { from: 0, to: 2 }] },
            { id: 'forge_damage_guard', name: 'Forge Damage Guard', desc: 'Cancel dangerous damage', mode: 'forge', category: 'protection', nodes: [{ blockId: 'ForgeLivingDamage', x: 80, y: 120 }, { blockId: 'ForgeCancelEvent', x: 320, y: 120 }, { blockId: 'ForgeSendMsg', x: 560, y: 120, params: { mesaj: 'Damage blocked.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'forge_spawn_entity', name: 'Forge Mob Spawn', desc: 'Spawn entity on start', mode: 'forge', category: 'pve', nodes: [{ blockId: 'ForgeServerStart', x: 80, y: 120 }, { blockId: 'ForgeSetBlock', x: 320, y: 120, params: { block: 'minecraft:gold_block', x: '0', y: '75', z: '0' } }, { blockId: 'ForgeSendMsg', x: 560, y: 120, params: { mesaj: 'Arena marker generated.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'skript_afk', name: 'Skript AFK Ping', desc: 'Loop players + message', mode: 'skript', category: 'management', nodes: [{ blockId: 'SkJoin', x: 80, y: 120 }, { blockId: 'SkWaitDelay', x: 320, y: 120, params: { sure: '60 seconds' } }, { blockId: 'SkSendMsg', x: 560, y: 120, params: { mesaj: '&7Still there?' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'skript_kit', name: 'Skript Kit', desc: 'Kit command for Skript', mode: 'skript', category: 'management', nodes: [{ blockId: 'SkCommand', x: 80, y: 120, params: { komut: '/kit' } }, { blockId: 'SkGiveItem', x: 320, y: 80, params: { item: 'iron sword', adet: '1' } }, { blockId: 'SkSendMsg', x: 320, y: 220, params: { mesaj: '&aKit verildi.' } }], connections: [{ from: 0, to: 1 }, { from: 0, to: 2 }] },
            { id: 'skript_vote', name: 'Skript Vote Reward', desc: 'Vote -> reward flow', mode: 'skript', category: 'economy', nodes: [{ blockId: 'SkCommand', x: 80, y: 120, params: { komut: '/vote' } }, { blockId: 'SkBroadcast', x: 320, y: 120, params: { mesaj: '&e%player% voted!' } }, { blockId: 'SkGiveItem', x: 560, y: 120, params: { item: 'diamond', adet: '2' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'chat_filter', name: 'Chat Filter', desc: 'Simple chat moderation', mode: 'plugin', category: 'moderation', nodes: [{ blockId: 'PlayerChat', x: 80, y: 120 }, { blockId: 'CancelEvent', x: 320, y: 120 }, { blockId: 'SendMessage', x: 560, y: 120, params: { mesaj: '&cMessage blocked.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'health_guard', name: 'Health Guard', desc: 'Heal low health players', mode: 'plugin', category: 'utility', nodes: [{ blockId: 'EntityDamage', x: 80, y: 120 }, { blockId: 'HealthCheck', x: 320, y: 120, params: { op: '<=', value: '4' } }, { blockId: 'SetHealth', x: 560, y: 120, params: { can: '20' } }, { blockId: 'SendMessage', x: 560, y: 230, params: { mesaj: '&aEmergency heal triggered.' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }] },
            { id: 'economy_tax', name: 'Economy Tax Loop', desc: 'Scheduled economy drain', mode: 'plugin', category: 'economy', nodes: [{ blockId: 'ServerLoad', x: 80, y: 120 }, { blockId: 'RepeatTask', x: 320, y: 120, params: { baslangic: '100', aralik: '2400' } }, { blockId: 'TakeMoney', x: 560, y: 120, params: { miktar: '5' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
            { id: 'gui_shop_stub', name: 'GUI Shop Stub', desc: 'Create and open GUI on command', mode: 'plugin', category: 'economy', nodes: [{ blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/shop' } }, { blockId: 'CommandEquals', x: 320, y: 120, params: { cmd: '/shop' } }, { blockId: 'CreateGUI', x: 560, y: 90, params: { baslik: 'Shop', satir: '3' } }, { blockId: 'OpenGUI', x: 560, y: 220, params: { envanter: 'shopInv' } }], connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }] },
            { id: 'command_logger', name: 'Command Logger', desc: 'Log and notify command usage', mode: 'plugin', category: 'management', nodes: [{ blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/any' } }, { blockId: 'Broadcast', x: 320, y: 120, params: { mesaj: '&7Command used by player.' } }], connections: [{ from: 0, to: 1 }] },
        ];
    }

    function ensureTemplateExpansion() {
        const addTemplates = window.CraftIDEVB?.addTemplates;
        if (typeof addTemplates !== 'function') return 0;
        const added = addTemplates(getExtraTemplates());
        const badge = document.getElementById('phase-template-count');
        if (badge) badge.textContent = String(countTemplates());
        return added;
    }

    function getModal() {
        return document.getElementById('phase-hub-modal');
    }

    function openModal() {
        const modal = getModal();
        if (!modal) return;
        modal.style.display = 'flex';
        refreshExtensionList();
        renderWatcherOutput();
        renderPerformanceSnapshot();
        renderOfflineRecommendation();
        const tplCount = document.getElementById('phase-template-count');
        if (tplCount) tplCount.textContent = String(countTemplates());
    }

    function closeModal() {
        const modal = getModal();
        if (modal) modal.style.display = 'none';
    }

    function activeCodeText() {
        if (window.monacoEditor && typeof window.monacoEditor.getValue === 'function') return window.monacoEditor.getValue();
        const filePath = window.CraftIDEAppState?.getCurrentFilePath?.();
        const entry = window.CraftIDEAppState?.getOpenFiles?.()?.get(filePath);
        return entry?.content || '';
    }

    function inferProjectType(projectPath) {
        if (!projectPath) return 'plugin';
        if (fs.existsSync(path.join(projectPath, 'src', 'main', 'resources', 'fabric.mod.json'))) return 'fabric';
        if (fs.existsSync(path.join(projectPath, 'src', 'main', 'resources', 'META-INF', 'mods.toml'))) return 'forge';
        const skFiles = fs.readdirSync(projectPath, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.sk'));
        if (skFiles.length) return 'skript';
        return 'plugin';
    }
    async function runMobDesigner() {
        const mode = currentMode();
        const mobType = String(document.getElementById('phase-mob-type')?.value || 'ZOMBIE').trim();
        const mobName = String(document.getElementById('phase-mob-name')?.value || '&cCustom Mob').trim();
        const hp = Number(document.getElementById('phase-mob-hp')?.value || 40) || 40;
        const damage = Number(document.getElementById('phase-mob-damage')?.value || 8) || 8;
        const lootMat = String(document.getElementById('phase-mob-loot')?.value || 'DIAMOND').trim();
        const lootCount = Number(document.getElementById('phase-mob-loot-count')?.value || 2) || 1;

        const graph = {
            version: '2',
            mode,
            nodes: [
                { id: 1, blockId: mode === 'plugin' ? 'ServerLoad' : mode === 'fabric' ? 'FabricServerStart' : mode === 'forge' ? 'ForgeServerStart' : 'SkJoin', x: 80, y: 120, params: {} },
                { id: 2, blockId: mode === 'plugin' ? 'SpawnEntity' : mode === 'fabric' ? 'FabricSpawnEntity' : mode === 'forge' ? 'ForgeSetBlock' : 'SkSpawn', x: 320, y: 80, params: mode === 'plugin' ? { entityType: mobType } : mode === 'fabric' ? { type: `minecraft:${mobType.toLowerCase()}` } : mode === 'forge' ? { block: 'minecraft:spawner', x: '0', y: '70', z: '0' } : { entity: mobType.toLowerCase() } },
                { id: 3, blockId: mode === 'plugin' ? 'Broadcast' : mode === 'fabric' ? 'FabricBroadcast' : mode === 'forge' ? 'ForgeSendMsg' : 'SkBroadcast', x: 320, y: 220, params: { mesaj: `${mobName} spawned (HP ${hp}, DMG ${damage})` } },
                { id: 4, blockId: mode === 'plugin' ? 'GiveItem' : mode === 'fabric' ? 'FabricGiveItem' : mode === 'forge' ? 'ForgeGiveItem' : 'SkGiveItem', x: 560, y: 120, params: mode === 'plugin' ? { material: lootMat, adet: String(lootCount) } : mode === 'skript' ? { item: lootMat.toLowerCase(), adet: String(lootCount) } : { item: `minecraft:${lootMat.toLowerCase()}`, adet: String(lootCount) } },
            ],
            connections: [{ from: 1, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 4 }],
        };
        applyGraph(graph);

        const java = [
            'package generated.mob;',
            '',
            'public final class CustomMobSpec {',
            `    public static final String BASE_TYPE = "${mobType}";`,
            `    public static final String DISPLAY_NAME = "${mobName.replace(/"/g, '\\"')}";`,
            `    public static final double HEALTH = ${hp};`,
            `    public static final double DAMAGE = ${damage};`,
            `    public static final String LOOT_MATERIAL = "${lootMat}";`,
            `    public static final int LOOT_COUNT = ${lootCount};`,
            '',
            '    private CustomMobSpec() {}',
            '}',
        ].join('\n');
        openGeneratedTab('CustomMobSpec.java', java, 'java');
        notify('Mob designer applied to canvas and generated class.', 'success');
    }

    function runHudDesigner() {
        const title = String(document.getElementById('phase-hud-title')?.value || '&aCraftIDE').trim();
        const l1 = String(document.getElementById('phase-hud-line1')?.value || '&fKills: {kills}').trim();
        const l2 = String(document.getElementById('phase-hud-line2')?.value || '&fCoins: {coins}').trim();
        const java = [
            'package generated.hud;',
            '',
            'import org.bukkit.Bukkit;',
            'import org.bukkit.entity.Player;',
            'import org.bukkit.scoreboard.DisplaySlot;',
            'import org.bukkit.scoreboard.Objective;',
            'import org.bukkit.scoreboard.Scoreboard;',
            'import org.bukkit.scoreboard.ScoreboardManager;',
            '',
            'public final class HudBoard {',
            '    public static void apply(Player player) {',
            '        ScoreboardManager m = Bukkit.getScoreboardManager();',
            '        if (m == null) return;',
            '        Scoreboard board = m.getNewScoreboard();',
            '        Objective obj = board.registerNewObjective("craftide", "dummy", "' + title.replace(/"/g, '\\"') + '");',
            '        obj.setDisplaySlot(DisplaySlot.SIDEBAR);',
            '        obj.getScore("' + l1.replace(/"/g, '\\"') + '").setScore(2);',
            '        obj.getScore("' + l2.replace(/"/g, '\\"') + '").setScore(1);',
            '        player.setScoreboard(board);',
            '    }',
            '}',
            '',
        ].join('\n');
        openGeneratedTab('HudBoard.java', java, 'java');

        const graph = {
            version: '2',
            mode: 'plugin',
            nodes: [
                { id: 1, blockId: 'PlayerJoin', x: 80, y: 120, params: {} },
                { id: 2, blockId: 'SendTitle', x: 320, y: 120, params: { baslik: title, alt: l1 } },
                { id: 3, blockId: 'SendMessage', x: 560, y: 120, params: { mesaj: `${l1} | ${l2}` } },
            ],
            connections: [{ from: 1, to: 2 }, { from: 2, to: 3 }],
        };
        applyGraph(graph);
        notify('HUD designer generated code and a preview flow.', 'success');
    }

    function runNpcDesigner() {
        const name = String(document.getElementById('phase-npc-name')?.value || 'Guide').trim();
        const dialog = String(document.getElementById('phase-npc-dialog')?.value || 'Hello traveler!').trim();
        const options = String(document.getElementById('phase-npc-options')?.value || 'Trade|Quest|Bye').split('|').map((x) => x.trim()).filter(Boolean);
        const yaml = [
            `npc: ${name}`,
            'dialogue:',
            `  start: "${dialog.replace(/"/g, '\\"')}"`,
            '  options:',
            ...options.map((op) => `    - "${op.replace(/"/g, '\\"')}"`),
        ].join('\n');

        const java = [
            'package generated.npc;',
            '',
            'public final class NpcDialogueSpec {',
            `    public static final String NPC_NAME = "${name.replace(/"/g, '\\"')}";`,
            `    public static final String START_LINE = "${dialog.replace(/"/g, '\\"')}";`,
            `    public static final String[] OPTIONS = new String[] { ${options.map((x) => '"' + x.replace(/"/g, '\\"') + '"').join(', ')} };`,
            '    // Integrate with Citizens / ZNPCsPlus adapter.',
            '}',
            '',
        ].join('\n');

        openGeneratedTab('npc-dialogue.yml', yaml, 'yaml');
        openGeneratedTab('NpcDialogueSpec.java', java, 'java');
        notify('NPC dialogue files generated.', 'success');
    }

    function drawParticlePreview() {
        const canvas = document.getElementById('phase-particle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const type = String(document.getElementById('phase-particle-type')?.value || 'flame');
        const shape = String(document.getElementById('phase-particle-shape')?.value || 'ring');
        const count = Math.max(6, Number(document.getElementById('phase-particle-count')?.value || 24));
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f1520';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        const color = type === 'heart' ? '#ff6b81' : type === 'smoke' ? '#95a5a6' : '#f5a623';

        ctx.fillStyle = color;
        for (let i = 0; i < count; i += 1) {
            const a = (i / count) * Math.PI * 2;
            let x = cx;
            let y = cy;
            if (shape === 'ring') {
                x = cx + Math.cos(a) * radius;
                y = cy + Math.sin(a) * radius;
            } else if (shape === 'spiral') {
                const r = radius * (i / count);
                x = cx + Math.cos(a * 3) * r;
                y = cy + Math.sin(a * 3) * r;
            } else if (shape === 'line') {
                x = cx - radius + (2 * radius * i) / count;
                y = cy;
            } else {
                const r = radius * (0.4 + 0.6 * Math.random());
                x = cx + Math.cos(a) * r;
                y = cy + Math.sin(a) * r;
            }
            ctx.beginPath();
            ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function runParticleApply() {
        const type = String(document.getElementById('phase-particle-type')?.value || 'flame');
        const shape = String(document.getElementById('phase-particle-shape')?.value || 'ring');
        const count = Math.max(6, Number(document.getElementById('phase-particle-count')?.value || 24));
        const command = `particle minecraft:${type} ~ ~1 ~ 0.6 0.6 0.6 0.02 ${count} force`;
        const graph = {
            version: '2',
            mode: 'plugin',
            nodes: [
                { id: 1, blockId: 'PlayerJoin', x: 80, y: 120, params: {} },
                { id: 2, blockId: 'RunCommand', x: 330, y: 120, params: { komut: command } },
                { id: 3, blockId: 'SendMessage', x: 580, y: 120, params: { mesaj: `Particle ${type}/${shape} executed.` } },
            ],
            connections: [{ from: 1, to: 2 }, { from: 2, to: 3 }],
        };
        applyGraph(graph);
        openGeneratedTab('particle-command.txt', command + '\n', 'plaintext');
        notify('Particle flow applied to Visual Builder.', 'success');
    }

    function runSimulation() {
        const out = document.getElementById('phase-sim-output');
        if (!out) return;
        const sim = U.simulateGraph ? U.simulateGraph(currentGraph()) : { steps: ['No simulator available.'], warnings: [] };
        const lines = [`<div class="phase-row"><strong>Estimated Cost:</strong> ${esc(sim.estimatedCost ?? '-')}</div>`];
        sim.steps.forEach((s) => lines.push(`<div class="phase-row">${esc(s)}</div>`));
        sim.warnings.forEach((w) => lines.push(`<div class="phase-row warn">${esc(w)}</div>`));
        out.innerHTML = lines.join('');
    }

    function parseSimpleYaml(content) {
        const out = {};
        let parent = null;
        String(content || '').split(/\r?\n/).forEach((line) => {
            const m = line.match(/^(\s*)([\w\-.]+)\s*:\s*(.*)$/);
            if (!m) return;
            const indent = m[1].length;
            const key = m[2];
            const val = m[3].trim();
            if (indent === 0) {
                if (val === '') {
                    out[key] = {};
                    parent = key;
                } else {
                    out[key] = val;
                    parent = null;
                }
            } else if (parent && indent === 2) {
                if (!out[parent] || typeof out[parent] !== 'object') out[parent] = {};
                out[parent][key] = val;
            }
        });
        return out;
    }
    async function runDocsGenerator() {
        const out = document.getElementById('phase-docs-output');
        const projectPath = window.CraftIDEAppState?.getCurrentProjectPath?.();
        if (!projectPath) {
            notify('Open a project first.', 'error');
            return;
        }
        if (out) out.innerHTML = '<div class="phase-row">Generating docs...</div>';

        const pluginYmlPath = path.join(projectPath, 'src', 'main', 'resources', 'plugin.yml');
        const configYmlPath = path.join(projectPath, 'src', 'main', 'resources', 'config.yml');
        const readmePath = path.join(projectPath, 'README.generated.md');
        const cmdPath = path.join(projectPath, 'COMMANDS.generated.md');
        const cfgPath = path.join(projectPath, 'CONFIG.generated.md');
        const changelogPath = path.join(projectPath, 'CHANGELOG.generated.md');
        const descPath = path.join(projectPath, 'PLUGIN_DESCRIPTION.generated.md');

        const projectName = path.basename(projectPath);
        const type = inferProjectType(projectPath);
        const pluginData = fs.existsSync(pluginYmlPath) ? parseSimpleYaml(fs.readFileSync(pluginYmlPath, 'utf-8')) : {};
        const configRaw = fs.existsSync(configYmlPath) ? fs.readFileSync(configYmlPath, 'utf-8') : '';
        const commandNames = Object.keys(pluginData.commands || {});

        let aiSummary = '';
        const useAi = !!document.getElementById('phase-docs-use-ai')?.checked;
        if (useAi && window.llmProvider?.generate) {
            try {
                aiSummary = await window.llmProvider.generate(
                    `Project: ${projectName}\nType: ${type}\nCommands: ${commandNames.join(', ') || 'none'}\nConfig:\n${configRaw.slice(0, 1500)}\n\nWrite concise release + usage notes.`,
                    'Write concise technical markdown for Minecraft plugin users.'
                );
            } catch {
                aiSummary = '';
            }
        }

        const readme = [
            `# ${projectName}`,
            '',
            `Generated by CraftIDE Phase Suite on ${new Date().toISOString().slice(0, 10)}.`,
            '',
            '## Overview',
            `- Platform: ${type}`,
            `- Main: ${pluginData.main || 'N/A'}`,
            `- Version: ${pluginData.version || '1.0.0'}`,
            '',
            '## Commands',
            ...(commandNames.length ? commandNames.map((c) => `- /${c}`) : ['- No command metadata found.']),
            '',
            aiSummary ? '## AI Notes\n' + aiSummary : '## Notes\nGenerated locally (offline fallback).',
            '',
        ].join('\n');

        const commandsDoc = [
            '# Command Guide',
            '',
            ...(commandNames.length ? commandNames.map((c) => `- \`/${c}\` - ${pluginData.commands?.[c]?.description || 'No description'}`) : ['No commands detected in plugin.yml.']),
            '',
        ].join('\n');

        const configDoc = [
            '# Config Guide',
            '',
            '```yaml',
            configRaw || '# No config.yml detected',
            '```',
            '',
        ].join('\n');

        const changelog = [
            '# Changelog',
            '',
            `## ${new Date().toISOString().slice(0, 10)} - Generated`,
            '- Added generated documentation set.',
            '- Updated roadmap feature coverage with phase suite.',
            '',
        ].join('\n');

        const description = [
            '# Plugin Description',
            '',
            `${projectName} is a ${type} project generated and managed with CraftIDE.`,
            'Use this text for Spigot/Modrinth listing drafts.',
            '',
            aiSummary ? aiSummary : 'This draft was generated without cloud AI.',
            '',
        ].join('\n');

        fs.writeFileSync(readmePath, readme, 'utf-8');
        fs.writeFileSync(cmdPath, commandsDoc, 'utf-8');
        fs.writeFileSync(cfgPath, configDoc, 'utf-8');
        fs.writeFileSync(changelogPath, changelog, 'utf-8');
        fs.writeFileSync(descPath, description, 'utf-8');

        if (out) {
            out.innerHTML = [
                '<div class="phase-row ok">Documentation files generated.</div>',
                `<div class="phase-row">${esc(readmePath)}</div>`,
                `<div class="phase-row">${esc(cmdPath)}</div>`,
                `<div class="phase-row">${esc(cfgPath)}</div>`,
                `<div class="phase-row">${esc(changelogPath)}</div>`,
                `<div class="phase-row">${esc(descPath)}</div>`,
            ].join('');
        }
    }

    async function runCodeExplain() {
        const output = document.getElementById('phase-explain-output');
        const locale = String(document.getElementById('phase-explain-lang')?.value || 'tr');
        const level = String(document.getElementById('phase-explain-level')?.value || 'beginner');
        const source = activeCodeText();
        if (!source.trim()) {
            notify('No active source found to explain.', 'warn');
            return;
        }

        let markdown = '';
        if (document.getElementById('phase-explain-ai')?.checked && window.llmProvider?.generate) {
            try {
                markdown = await window.llmProvider.generate(
                    `Language: ${locale}\nLevel: ${level}\nExplain this code line-by-line in markdown:\n\n${source.slice(0, 7000)}`,
                    'You are a concise coding tutor. Explain source code with short bullets.'
                );
            } catch {
                markdown = '';
            }
        }

        if (!markdown && U.generateHeuristicCodeExplanation) {
            const heuristic = U.generateHeuristicCodeExplanation(source, locale, level);
            markdown = [
                '# Code Explanation',
                '',
                heuristic.summary,
                '',
                ...heuristic.lines.map((l) => `- ${l}`),
                '',
            ].join('\n');
        }

        if (output) output.innerHTML = `<pre>${esc(markdown || 'No explanation generated.')}</pre>`;
        openGeneratedTab('CODE_EXPLANATION.md', markdown || 'No explanation generated.\n', 'markdown');
    }

    function runCompatibilityCheck() {
        const output = document.getElementById('phase-compat-output');
        const target = String(document.getElementById('phase-compat-version')?.value || '1.21.4');
        const code = activeCodeText() || '';
        const graphText = JSON.stringify(currentGraph());
        const merged = `${code}\n${graphText}`;
        const issues = U.checkCompatibilityFromText ? U.checkCompatibilityFromText(merged, target) : [];
        if (!output) return;
        if (!issues.length) {
            output.innerHTML = '<div class="phase-row ok">No compatibility issue found for selected target.</div>';
            return;
        }
        output.innerHTML = issues.map((i) => `<div class="phase-row ${i.level === 'error' ? 'err' : i.level === 'warn' ? 'warn' : 'ok'}">${esc(i.message)}</div>`).join('');
    }

    async function runPublisher() {
        const output = document.getElementById('phase-publish-output');
        const projectPath = window.CraftIDEAppState?.getCurrentProjectPath?.();
        if (!projectPath) {
            notify('Open a project first.', 'error');
            return;
        }
        const targetType = String(document.getElementById('phase-publish-target')?.value || 'zip');
        const version = String(document.getElementById('phase-publish-version')?.value || '1.0.0').trim();
        const license = String(document.getElementById('phase-publish-license')?.value || 'MIT').trim();
        const deps = String(document.getElementById('phase-publish-deps')?.value || '').split(',').map((x) => x.trim()).filter(Boolean);

        if (output) output.innerHTML = '<div class="phase-row">Packaging release...</div>';

        const releaseRes = await ipcRenderer.invoke('release:oneClick', {
            projectPath,
            targetType,
            includeDocs: true,
        }).catch((err) => ({ success: false, error: err?.message || 'release IPC failed' }));

        if (!releaseRes?.success) {
            if (output) output.innerHTML = `<div class="phase-row err">Release failed: ${esc(releaseRes?.error || 'Unknown')}</div>`;
            return;
        }

        const releaseDir = path.join(projectPath, 'release');
        fs.mkdirSync(releaseDir, { recursive: true });
        const manifestPath = path.join(releaseDir, 'publish-manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify({
            project: path.basename(projectPath),
            version,
            license,
            dependencies: deps,
            createdAt: new Date().toISOString(),
            outputFiles: releaseRes.outputFiles || [],
            checksums: releaseRes.checksum || [],
            uploadPlan: {
                spigot: true,
                modrinth: true,
                curseforge: false,
                note: 'Upload simulation manifest generated. Integrate API tokens for live publish.',
            },
        }, null, 2), 'utf-8');

        if (output) {
            output.innerHTML = [
                '<div class="phase-row ok">Release package and publisher manifest created.</div>',
                ...((releaseRes.outputFiles || []).map((f) => `<div class="phase-row">${esc(f)}</div>`)),
                `<div class="phase-row">${esc(manifestPath)}</div>`,
            ].join('');
        }
    }
    function extensionHostApi(extId) {
        return {
            id: extId,
            notify,
            getProjectPath: () => window.CraftIDEAppState?.getCurrentProjectPath?.(),
            addTemplate: (tpl) => window.CraftIDEVB?.addTemplates?.([tpl]),
            postMessage: (topic, payload) => {
                const listeners = STATE.extensionBus.get(topic) || [];
                listeners.forEach((fn) => {
                    try { fn(payload, extId); } catch (err) { console.error(err); }
                });
            },
            onMessage: (topic, fn) => {
                if (typeof fn !== 'function') return () => {};
                const list = STATE.extensionBus.get(topic) || [];
                list.push(fn);
                STATE.extensionBus.set(topic, list);
                return () => {
                    const current = STATE.extensionBus.get(topic) || [];
                    STATE.extensionBus.set(topic, current.filter((x) => x !== fn));
                };
            },
        };
    }

    function scanExtensions() {
        const root = path.join(process.cwd(), 'extensions');
        if (!fs.existsSync(root)) return [];
        const dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());
        return dirs.map((d) => {
            const base = path.join(root, d.name);
            const pkgPath = path.join(base, 'package.json');
            let pkg = { name: d.name, version: '0.0.0', main: '' };
            if (fs.existsSync(pkgPath)) {
                try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')); } catch {}
            }
            return { id: d.name, base, pkg };
        });
    }

    function findRuntimeEntry(base, pkg) {
        const candidates = [pkg.main, 'dist/extension.js', 'dist/index.js', 'extension.js', 'src/extension.js'].filter(Boolean);
        for (const c of candidates) {
            const full = path.join(base, c);
            if (fs.existsSync(full)) return full;
        }
        return null;
    }

    function activateExtension(id) {
        const ext = scanExtensions().find((x) => x.id === id);
        if (!ext) return notify('Extension not found.', 'error');
        if (STATE.extensions.has(id) && STATE.extensions.get(id).active) return notify(`${id} already active.`, 'info');

        const entry = findRuntimeEntry(ext.base, ext.pkg || {});
        if (!entry) {
            STATE.extensions.set(id, { active: false, reason: 'No JS runtime entry found (source-only extension).' });
            renderExtensionList();
            return notify(`${id}: runtime entry not found.`, 'warn');
        }

        try {
            delete require.cache[require.resolve(entry)];
            const mod = require(entry);
            const activate = mod?.activate || mod?.default?.activate;
            const deactivate = mod?.deactivate || mod?.default?.deactivate;
            let cleanup = null;
            if (typeof activate === 'function') {
                cleanup = activate(extensionHostApi(id));
            }
            STATE.extensions.set(id, { active: true, reason: '', entry, deactivate: typeof deactivate === 'function' ? deactivate : cleanup });
            renderExtensionList();
            notify(`${id} activated.`, 'success');
        } catch (err) {
            STATE.extensions.set(id, { active: false, reason: err?.message || String(err) });
            renderExtensionList();
            notify(`${id} activation failed.`, 'error');
        }
    }

    function deactivateExtension(id) {
        const runtime = STATE.extensions.get(id);
        if (!runtime || !runtime.active) return;
        try {
            if (typeof runtime.deactivate === 'function') runtime.deactivate(extensionHostApi(id));
        } catch {}
        STATE.extensions.set(id, { active: false, reason: 'Deactivated by user.' });
        renderExtensionList();
        notify(`${id} deactivated.`, 'info');
    }

    function renderExtensionList() {
        const container = document.getElementById('phase-ext-list');
        if (!container) return;
        const scanned = scanExtensions();
        if (!scanned.length) {
            container.innerHTML = '<div class="phase-row">No extension folder found.</div>';
            return;
        }

        container.innerHTML = scanned.map((ext) => {
            const runtime = STATE.extensions.get(ext.id) || { active: false, reason: '' };
            return `
                <div class="phase-card">
                    <div><strong>${esc(ext.pkg?.name || ext.id)}</strong> <span class="phase-sub">${esc(ext.pkg?.version || '0.0.0')}</span></div>
                    <div class="phase-sub">${esc(runtime.active ? `Active (${runtime.entry || 'runtime'})` : (runtime.reason || 'Inactive'))}</div>
                    <div class="phase-inline">
                        <button class="phase-btn" data-ext-on="${esc(ext.id)}">Activate</button>
                        <button class="phase-btn" data-ext-off="${esc(ext.id)}">Deactivate</button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('[data-ext-on]').forEach((btn) => btn.addEventListener('click', () => activateExtension(btn.getAttribute('data-ext-on'))));
        container.querySelectorAll('[data-ext-off]').forEach((btn) => btn.addEventListener('click', () => deactivateExtension(btn.getAttribute('data-ext-off'))));
    }

    function refreshExtensionList() {
        renderExtensionList();
    }

    function pushWatcherEvent(text, cls) {
        STATE.watcherEvents.unshift({ text, cls: cls || '', ts: new Date().toLocaleTimeString() });
        if (STATE.watcherEvents.length > 120) STATE.watcherEvents.length = 120;
        renderWatcherOutput();
    }

    function renderWatcherOutput() {
        const out = document.getElementById('phase-watch-output');
        if (!out) return;
        if (!STATE.watcherEvents.length) {
            out.innerHTML = '<div class="phase-row">Watcher idle.</div>';
            return;
        }
        out.innerHTML = STATE.watcherEvents.slice(0, 35).map((e) => `<div class="phase-row ${e.cls}">[${esc(e.ts)}] ${esc(e.text)}</div>`).join('');
    }

    async function onWatchedFileChange(filePath) {
        pushWatcherEvent(`Changed: ${filePath}`);
        if (window.CraftIDEAppState?.refreshFileTree) {
            window.CraftIDEAppState.refreshFileTree();
        }
        if (!STATE.hotReload) return;

        if (filePath.endsWith('.jar')) {
            const status = await ipcRenderer.invoke('server:status').catch(() => null);
            if (status?.status === 'running') {
                const deploy = await ipcRenderer.invoke('server:deploy', filePath).catch(() => ({ success: false }));
                if (deploy?.success) pushWatcherEvent(`Hot deploy success: ${path.basename(filePath)}`, 'ok');
                else pushWatcherEvent('Hot deploy failed.', 'warn');
            }
        }
    }

    function startWatcher() {
        const projectPath = window.CraftIDEAppState?.getCurrentProjectPath?.();
        if (!projectPath) return notify('Open a project first.', 'error');
        stopWatcher();
        try {
            STATE.watcher = fs.watch(projectPath, { recursive: true }, (_, fileName) => {
                if (!fileName) return;
                const full = path.join(projectPath, String(fileName));
                onWatchedFileChange(full);
            });
            pushWatcherEvent(`Watching ${projectPath}`, 'ok');
            if (window.CraftIDEStore?.set) window.CraftIDEStore.set('runtime.watcherActive', true);
        } catch (err) {
            pushWatcherEvent(`Watch error: ${err?.message || err}`, 'err');
            notify('Watcher failed to start.', 'error');
        }
    }

    function stopWatcher() {
        if (!STATE.watcher) return;
        try { STATE.watcher.close(); } catch {}
        STATE.watcher = null;
        pushWatcherEvent('Watcher stopped.', 'warn');
        if (window.CraftIDEStore?.set) window.CraftIDEStore.set('runtime.watcherActive', false);
    }

    function parseLatestVersionFromReleaseNotes() {
        const releasePath = path.join(process.cwd(), 'RELEASE_NOTES.md');
        if (!fs.existsSync(releasePath)) return null;
        const txt = fs.readFileSync(releasePath, 'utf-8');
        const m = txt.match(/v?(\d+\.\d+\.\d+)/i);
        return m ? m[1] : null;
    }

    async function runUpdateCheck() {
        const out = document.getElementById('phase-update-output');
        const current = await ipcRenderer.invoke('app:getVersion').catch(() => '0.0.0');
        const localLatest = parseLatestVersionFromReleaseNotes() || current;
        const cmp = U.compareVersion ? U.compareVersion(localLatest, current) : 0;

        let lines = [`<div class="phase-row">Current version: ${esc(current)}</div>`, `<div class="phase-row">Latest known: ${esc(localLatest)}</div>`, `<div class="phase-row">Channel: ${esc(STATE.updateChannel)}</div>`];
        if (cmp > 0) lines.push('<div class="phase-row warn">Update available based on release notes.</div>');
        else lines.push('<div class="phase-row ok">No newer local release detected.</div>');
        if (out) out.innerHTML = lines.join('');
    }
    function applyPerformanceMode(enabled) {
        STATE.performanceMode = !!enabled;
        document.body.classList.toggle('phase-perf-mode', STATE.performanceMode);
        if (window.CraftIDEStore?.set) window.CraftIDEStore.set('runtime.performanceMode', STATE.performanceMode);

        if (STATE.perfTimer) {
            clearInterval(STATE.perfTimer);
            STATE.perfTimer = null;
        }

        if (STATE.performanceMode) {
            STATE.perfTimer = setInterval(() => {
                const wrapper = document.getElementById('visual-builder-canvas-wrapper');
                if (!wrapper) return;
                const wr = wrapper.getBoundingClientRect();
                wrapper.querySelectorAll('.vb-node').forEach((node) => {
                    const r = node.getBoundingClientRect();
                    const visible = r.right >= wr.left - 240 && r.left <= wr.right + 240 && r.bottom >= wr.top - 200 && r.top <= wr.bottom + 200;
                    node.style.visibility = visible ? 'visible' : 'hidden';
                });
                renderPerformanceSnapshot();
            }, 900);
        } else {
            document.querySelectorAll('#visual-builder-canvas-wrapper .vb-node').forEach((node) => {
                node.style.visibility = 'visible';
            });
        }
        renderPerformanceSnapshot();
    }

    function renderPerformanceSnapshot() {
        const out = document.getElementById('phase-perf-output');
        if (!out) return;
        const mem = process.memoryUsage();
        const heapMb = Math.round(mem.heapUsed / (1024 * 1024));
        const rssMb = Math.round(mem.rss / (1024 * 1024));
        const graph = currentGraph();
        const est = U.estimateGraphPerformance ? U.estimateGraphPerformance(graph) : { score: '-', warnings: [] };
        out.innerHTML = [
            `<div class="phase-row">Heap: ${heapMb} MB | RSS: ${rssMb} MB</div>`,
            `<div class="phase-row">Graph nodes: ${(graph.nodes || []).length}, cost score: ${esc(est.score)}</div>`,
            ...((est.warnings || []).slice(0, 3).map((w) => `<div class="phase-row warn">${esc(w)}</div>`)),
        ].join('');
    }

    function applyA11ySettings() {
        const theme = String(document.getElementById('phase-theme')?.value || 'dark');
        const contrast = String(document.getElementById('phase-contrast')?.value || 'normal');
        const fontScale = Number(document.getElementById('phase-font-scale')?.value || 1) || 1;

        const root = document.documentElement;
        if (theme === 'light') {
            root.style.setProperty('--bg-primary', '#f5f7fb');
            root.style.setProperty('--bg-secondary', '#ffffff');
            root.style.setProperty('--bg-tertiary', '#e9edf5');
            root.style.setProperty('--text-primary', '#1f2937');
            root.style.setProperty('--text-secondary', '#374151');
            root.style.setProperty('--border-color', '#d0d7e2');
        } else {
            root.style.removeProperty('--bg-primary');
            root.style.removeProperty('--bg-secondary');
            root.style.removeProperty('--bg-tertiary');
            root.style.removeProperty('--text-primary');
            root.style.removeProperty('--text-secondary');
            root.style.removeProperty('--border-color');
        }

        document.body.classList.toggle('phase-high-contrast', contrast === 'high');
        root.style.fontSize = `${Math.max(0.8, Math.min(1.6, fontScale)) * 100}%`;

        localStorage.setItem('craftide.phase.theme', theme);
        localStorage.setItem('craftide.phase.contrast', contrast);
        localStorage.setItem('craftide.phase.fontScale', String(fontScale));

        if (window.CraftIDEStore?.patch) {
            window.CraftIDEStore.patch({
                ui: {
                    theme,
                    contrast,
                    fontScale,
                },
            });
        }

        notify('Theme/accessibility settings applied.', 'success');
    }

    function applyStoredA11ySettings() {
        const theme = localStorage.getItem('craftide.phase.theme') || 'dark';
        const contrast = localStorage.getItem('craftide.phase.contrast') || 'normal';
        const fontScale = Number(localStorage.getItem('craftide.phase.fontScale') || '1') || 1;
        const themeSel = document.getElementById('phase-theme');
        const contrastSel = document.getElementById('phase-contrast');
        const fontInput = document.getElementById('phase-font-scale');
        if (themeSel) themeSel.value = theme;
        if (contrastSel) contrastSel.value = contrast;
        if (fontInput) fontInput.value = String(fontScale);
        applyA11ySettings();
    }

    function renderOfflineRecommendation() {
        const out = document.getElementById('phase-offline-output');
        if (!out) return;
        const memGb = Math.round((os.totalmem() / (1024 ** 3)) * 10) / 10;
        const rec = U.recommendOfflineModel ? U.recommendOfflineModel(memGb) : { model: 'mistral:7b', hint: 'Use lightweight model.' };
        out.innerHTML = [
            `<div class="phase-row">System RAM: ${esc(memGb)} GB</div>`,
            `<div class="phase-row ok">Recommended local model: ${esc(rec.model)}</div>`,
            `<div class="phase-row">${esc(rec.hint || '')}</div>`,
        ].join('');
    }

    function applyOfflineWizard() {
        const memGb = os.totalmem() / (1024 ** 3);
        const rec = U.recommendOfflineModel ? U.recommendOfflineModel(memGb) : { model: 'mistral:7b' };

        const provider = document.getElementById('setting-ai-provider');
        const model = document.getElementById('setting-ai-model');
        const endpoint = document.getElementById('setting-ai-endpoint');

        if (provider) provider.value = 'ollama';
        if (model) model.value = rec.model;
        if (endpoint) endpoint.value = 'http://localhost:11434';

        localStorage.setItem('setting-ai-provider', 'ollama');
        localStorage.setItem('setting-ai-model', rec.model);
        localStorage.setItem('setting-ai-endpoint', 'http://localhost:11434');

        if (window.CraftIDEStore?.patch) {
            window.CraftIDEStore.patch({
                ai: { provider: 'ollama', offlinePreferred: true },
            });
        }

        notify(`Offline AI profile applied: ${rec.model}`, 'success');
        renderOfflineRecommendation();
    }

    function injectStyles() {
        if (document.getElementById('phase-hub-style')) return;
        const style = document.createElement('style');
        style.id = 'phase-hub-style';
        style.textContent = `
            .phase-btn{padding:6px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);font-size:11px;cursor:pointer}
            .phase-btn:hover{border-color:#56a1ff}
            .phase-modal{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.62);display:none;align-items:center;justify-content:center}
            .phase-card-wrap{width:min(1120px,95vw);max-height:92vh;overflow:auto;background:#10161f;border:1px solid #303848;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px}
            .phase-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
            .phase-title{font-size:16px;font-weight:700;color:#eaf0fb}
            .phase-sub{font-size:11px;color:#8fa2ba}
            .phase-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:10px}
            .phase-card{border:1px solid #334153;background:#0d131c;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px}
            .phase-inline{display:flex;gap:6px;flex-wrap:wrap}
            .phase-inp,.phase-sel,.phase-txt{width:100%;box-sizing:border-box;padding:7px 9px;border-radius:8px;border:1px solid #334153;background:#0b1119;color:#eaf0fb;font-size:12px}
            .phase-txt{min-height:82px;resize:vertical}
            .phase-out{max-height:170px;overflow:auto;border:1px solid #2e3948;border-radius:8px;background:#0b1118;padding:6px;display:flex;flex-direction:column;gap:4px}
            .phase-row{font-size:11px;padding:3px 4px;border-radius:4px;background:rgba(255,255,255,.03)}
            .phase-row.ok{color:#55efc4;border-left:2px solid #55efc4}
            .phase-row.warn{color:#fdcb6e;border-left:2px solid #fdcb6e}
            .phase-row.err{color:#ff7675;border-left:2px solid #ff7675}
            #phase-particle-canvas{width:100%;height:130px;border:1px solid #334153;border-radius:8px;background:#0b1118}
            .phase-perf-mode #visual-builder-container .vb-node{transition:none !important}
            .phase-high-contrast{filter:contrast(1.2) saturate(1.06)}
            @media (max-width:900px){.phase-grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }
    function ensureModal() {
        if (STATE.modalMounted) return;
        document.body.insertAdjacentHTML('beforeend', `
            <div class="phase-modal" id="phase-hub-modal">
                <div class="phase-card-wrap">
                    <div class="phase-head">
                        <div>
                            <div class="phase-title">Phase Completion Hub</div>
                            <div class="phase-sub">Roadmap coverage for phases 2-5</div>
                        </div>
                        <div class="phase-inline">
                            <span class="phase-sub">Templates: <strong id="phase-template-count">0</strong></span>
                            <button class="phase-btn" id="phase-expand-templates">Expand Template Gallery</button>
                            <button class="phase-btn" id="phase-close">Close</button>
                        </div>
                    </div>

                    <div class="phase-grid">
                        <div class="phase-card">
                            <strong>C1 Mob Designer</strong>
                            <select id="phase-mob-type" class="phase-sel"><option>ZOMBIE</option><option>SKELETON</option><option>SPIDER</option><option>CREEPER</option><option>WITHER</option></select>
                            <input id="phase-mob-name" class="phase-inp" placeholder="&cDungeon Boss" value="&cDungeon Boss">
                            <div class="phase-inline">
                                <input id="phase-mob-hp" class="phase-inp" type="number" placeholder="Health" value="120">
                                <input id="phase-mob-damage" class="phase-inp" type="number" placeholder="Damage" value="16">
                            </div>
                            <div class="phase-inline">
                                <select id="phase-mob-loot" class="phase-sel">${MATERIALS.map((m) => `<option>${m}</option>`).join('')}</select>
                                <input id="phase-mob-loot-count" class="phase-inp" type="number" min="1" max="64" value="2">
                            </div>
                            <button class="phase-btn" id="phase-run-mob">Generate Mob Flow</button>
                        </div>

                        <div class="phase-card">
                            <strong>C4 HUD Designer</strong>
                            <input id="phase-hud-title" class="phase-inp" value="&aCraftIDE HUD" placeholder="Sidebar title">
                            <input id="phase-hud-line1" class="phase-inp" value="&fCoins: {coins}" placeholder="Line 1">
                            <input id="phase-hud-line2" class="phase-inp" value="&fRank: {rank}" placeholder="Line 2">
                            <button class="phase-btn" id="phase-run-hud">Generate HUD</button>
                        </div>

                        <div class="phase-card">
                            <strong>C5 NPC Dialogue</strong>
                            <input id="phase-npc-name" class="phase-inp" value="Guide" placeholder="NPC name">
                            <textarea id="phase-npc-dialog" class="phase-txt" placeholder="Dialog start">Welcome to our server. Do you need help?</textarea>
                            <input id="phase-npc-options" class="phase-inp" value="Trade|Quest|Bye" placeholder="OptionA|OptionB|OptionC">
                            <button class="phase-btn" id="phase-run-npc">Generate NPC Files</button>
                        </div>

                        <div class="phase-card">
                            <strong>C6 Particle Designer</strong>
                            <div class="phase-inline">
                                <select id="phase-particle-type" class="phase-sel"><option>flame</option><option>heart</option><option>smoke</option><option>cloud</option></select>
                                <select id="phase-particle-shape" class="phase-sel"><option>ring</option><option>spiral</option><option>line</option><option>burst</option></select>
                                <input id="phase-particle-count" class="phase-inp" type="number" value="30" min="6" max="240">
                            </div>
                            <canvas id="phase-particle-canvas"></canvas>
                            <div class="phase-inline">
                                <button class="phase-btn" id="phase-particle-preview">Preview</button>
                                <button class="phase-btn" id="phase-particle-apply">Apply Flow</button>
                            </div>
                        </div>

                        <div class="phase-card">
                            <strong>C10 Event Chain Simulator</strong>
                            <button class="phase-btn" id="phase-run-sim">Simulate Current Graph</button>
                            <div class="phase-out" id="phase-sim-output"></div>
                        </div>

                        <div class="phase-card">
                            <strong>C8 Version Compatibility</strong>
                            <input id="phase-compat-version" class="phase-inp" value="1.21.4" placeholder="Target MC version">
                            <button class="phase-btn" id="phase-run-compat">Check Compatibility</button>
                            <div class="phase-out" id="phase-compat-output"></div>
                        </div>

                        <div class="phase-card">
                            <strong>B4 AI Content Generator</strong>
                            <label class="phase-sub"><input type="checkbox" id="phase-docs-use-ai" checked> Use AI when available</label>
                            <button class="phase-btn" id="phase-run-docs">Generate Docs</button>
                            <div class="phase-out" id="phase-docs-output"></div>
                        </div>

                        <div class="phase-card">
                            <strong>B5 Code Explanation</strong>
                            <div class="phase-inline">
                                <select id="phase-explain-lang" class="phase-sel"><option value="tr">Turkish</option><option value="en">English</option></select>
                                <select id="phase-explain-level" class="phase-sel"><option value="beginner">Beginner</option><option value="advanced">Advanced</option></select>
                            </div>
                            <label class="phase-sub"><input type="checkbox" id="phase-explain-ai" checked> AI enhanced explanation</label>
                            <button class="phase-btn" id="phase-run-explain">Explain Active Code</button>
                            <div class="phase-out" id="phase-explain-output"></div>
                        </div>
                        <div class="phase-card">
                            <strong>C9 Publisher</strong>
                            <div class="phase-inline">
                                <input id="phase-publish-version" class="phase-inp" value="1.0.0" placeholder="SemVer">
                                <select id="phase-publish-target" class="phase-sel"><option value="zip">Zip</option><option value="jar">Jar</option><option value="sk">Skript</option></select>
                            </div>
                            <div class="phase-inline">
                                <input id="phase-publish-license" class="phase-inp" value="MIT" placeholder="License">
                                <input id="phase-publish-deps" class="phase-inp" placeholder="DependA,DependB">
                            </div>
                            <button class="phase-btn" id="phase-run-publish">Build + Publish Manifest</button>
                            <div class="phase-out" id="phase-publish-output"></div>
                        </div>

                        <div class="phase-card">
                            <strong>D3 Extension Runtime</strong>
                            <div class="phase-out" id="phase-ext-list"></div>
                        </div>

                        <div class="phase-card">
                            <strong>D6 File Watcher</strong>
                            <label class="phase-sub"><input type="checkbox" id="phase-watch-hot"> Enable hot deploy for changed JAR</label>
                            <div class="phase-inline">
                                <button class="phase-btn" id="phase-watch-start">Start Watch</button>
                                <button class="phase-btn" id="phase-watch-stop">Stop Watch</button>
                            </div>
                            <div class="phase-out" id="phase-watch-output"></div>
                        </div>

                        <div class="phase-card">
                            <strong>D7 Update Center</strong>
                            <div class="phase-inline">
                                <select id="phase-update-channel" class="phase-sel"><option value="stable">stable</option><option value="beta">beta</option></select>
                                <button class="phase-btn" id="phase-run-update">Check Updates</button>
                            </div>
                            <div class="phase-out" id="phase-update-output"></div>
                        </div>

                        <div class="phase-card">
                            <strong>D8 Performance</strong>
                            <label class="phase-sub"><input type="checkbox" id="phase-perf-mode"> Enable virtual node rendering</label>
                            <button class="phase-btn" id="phase-refresh-perf">Refresh Snapshot</button>
                            <div class="phase-out" id="phase-perf-output"></div>
                        </div>

                        <div class="phase-card">
                            <strong>D4 Offline-First AI Wizard</strong>
                            <button class="phase-btn" id="phase-offline-apply">Apply Offline Profile</button>
                            <div class="phase-out" id="phase-offline-output"></div>
                        </div>

                        <div class="phase-card">
                            <strong>D9 Accessibility & Theme</strong>
                            <div class="phase-inline">
                                <select id="phase-theme" class="phase-sel"><option value="dark">Dark</option><option value="light">Light</option></select>
                                <select id="phase-contrast" class="phase-sel"><option value="normal">Normal</option><option value="high">High Contrast</option></select>
                            </div>
                            <input id="phase-font-scale" type="number" min="0.8" max="1.6" step="0.1" value="1" class="phase-inp">
                            <button class="phase-btn" id="phase-apply-a11y">Apply Theme Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        STATE.modalMounted = true;

        document.getElementById('phase-close')?.addEventListener('click', closeModal);
        document.getElementById('phase-hub-modal')?.addEventListener('click', (e) => { if (e.target.id === 'phase-hub-modal') closeModal(); });
        document.getElementById('phase-expand-templates')?.addEventListener('click', () => {
            const added = ensureTemplateExpansion();
            notify(`${added} templates added.`, 'success');
        });

        document.getElementById('phase-run-mob')?.addEventListener('click', runMobDesigner);
        document.getElementById('phase-run-hud')?.addEventListener('click', runHudDesigner);
        document.getElementById('phase-run-npc')?.addEventListener('click', runNpcDesigner);
        document.getElementById('phase-particle-preview')?.addEventListener('click', drawParticlePreview);
        document.getElementById('phase-particle-apply')?.addEventListener('click', runParticleApply);
        document.getElementById('phase-run-sim')?.addEventListener('click', runSimulation);
        document.getElementById('phase-run-compat')?.addEventListener('click', runCompatibilityCheck);
        document.getElementById('phase-run-docs')?.addEventListener('click', runDocsGenerator);
        document.getElementById('phase-run-explain')?.addEventListener('click', runCodeExplain);
        document.getElementById('phase-run-publish')?.addEventListener('click', runPublisher);

        document.getElementById('phase-watch-start')?.addEventListener('click', () => {
            STATE.hotReload = !!document.getElementById('phase-watch-hot')?.checked;
            startWatcher();
        });
        document.getElementById('phase-watch-stop')?.addEventListener('click', stopWatcher);

        document.getElementById('phase-run-update')?.addEventListener('click', runUpdateCheck);
        document.getElementById('phase-update-channel')?.addEventListener('change', (e) => {
            STATE.updateChannel = e.target.value;
            localStorage.setItem('craftide.update.channel', STATE.updateChannel);
            runUpdateCheck();
        });

        document.getElementById('phase-perf-mode')?.addEventListener('change', (e) => applyPerformanceMode(!!e.target.checked));
        document.getElementById('phase-refresh-perf')?.addEventListener('click', renderPerformanceSnapshot);

        document.getElementById('phase-offline-apply')?.addEventListener('click', applyOfflineWizard);
        document.getElementById('phase-apply-a11y')?.addEventListener('click', applyA11ySettings);

        const channelSel = document.getElementById('phase-update-channel');
        if (channelSel) channelSel.value = STATE.updateChannel;

        drawParticlePreview();
        applyStoredA11ySettings();
    }

    function mountToolbarButton() {
        if (document.getElementById('btn-phase-hub')) return;
        const right = document.querySelector('#visual-builder-container .vb-toolbar-right');
        if (!right) return;
        const btn = document.createElement('button');
        btn.id = 'btn-phase-hub';
        btn.className = 'phase-btn';
        btn.textContent = 'Phase Hub';
        btn.addEventListener('click', openModal);
        right.prepend(btn);
    }

    function addGlobalHistoryPanel() {
        if (document.getElementById('phase-history-btn')) return;
        const right = document.querySelector('#visual-builder-container .vb-toolbar-right');
        if (!right) return;
        const btn = document.createElement('button');
        btn.id = 'phase-history-btn';
        btn.className = 'phase-btn';
        btn.textContent = 'History';
        btn.addEventListener('click', () => {
            const graph = currentGraph();
            const snapshot = JSON.stringify(graph, null, 2);
            openGeneratedTab('GRAPH_HISTORY_SNAPSHOT.json', snapshot, 'json');
        });
        right.prepend(btn);
    }
    function initRendererModernizationHooks() {
        if (window.CraftIDEStore?.patch) {
            const mode = currentMode();
            window.CraftIDEStore.patch({
                ai: {
                    provider: localStorage.getItem('setting-ai-provider') || 'ollama',
                    offlinePreferred: (localStorage.getItem('setting-ai-provider') || 'ollama') === 'ollama',
                },
                ui: {
                    currentFile: window.CraftIDEAppState?.getCurrentFilePath?.() || null,
                },
            });
            window.CraftIDEStore.set('project.openTabs', document.querySelectorAll('.tab').length);
            window.CraftIDEStore.set('ui.activeMode', mode);
        }
    }

    function init() {
        injectStyles();
        ensureModal();
        mountToolbarButton();
        addGlobalHistoryPanel();
        initRendererModernizationHooks();
        ensureTemplateExpansion();

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                openModal();
            }
        });

        window.CraftIDEPhaseSuite = {
            open: openModal,
            close: closeModal,
            expandTemplates: ensureTemplateExpansion,
            runSimulation,
            runCompatibilityCheck,
            generateDocs: runDocsGenerator,
            explainCode: runCodeExplain,
            startWatcher,
            stopWatcher,
            refreshExtensions: refreshExtensionList,
            setPerformanceMode: applyPerformanceMode,
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
