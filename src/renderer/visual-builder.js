/**
 * CraftIDE — Görsel Mod / Plugin / Skript Builder
 * Sürükle-bırak node editör — Plugin, Fabric Mod, Forge Mod, Skript desteği
 */

// ═══════════════════════════════════════════════════════════
// Blok Tanımları — Tüm Modlar
// ═══════════════════════════════════════════════════════════

const ALL_BLOCK_DEFS = {
    // ── PLUGIN (Paper/Bukkit) ────────────────────────────────
    plugin: {
        // Olaylar
        PlayerJoin: { type: 'event', label: 'Oyuncu Girişi', sub: 'PlayerJoinEvent', params: [] },
        PlayerQuit: { type: 'event', label: 'Oyuncu Çıkışı', sub: 'PlayerQuitEvent', params: [] },
        BlockBreak: { type: 'event', label: 'Blok Kırma', sub: 'BlockBreakEvent', params: [] },
        BlockPlace: { type: 'event', label: 'Blok Yerleştirme', sub: 'BlockPlaceEvent', params: [] },
        PlayerChat: { type: 'event', label: 'Oyuncu Mesajı', sub: 'AsyncPlayerChatEvent', params: [] },
        PlayerDeath: { type: 'event', label: 'Oyuncu Ölümü', sub: 'PlayerDeathEvent', params: [] },
        EntityDamage: { type: 'event', label: 'Hasar', sub: 'EntityDamageByEntityEvent', params: [] },
        InventoryClick: { type: 'event', label: 'Envanter Tıklama', sub: 'InventoryClickEvent', params: [] },
        PlayerMove: { type: 'event', label: 'Oyuncu Hareketi', sub: 'PlayerMoveEvent', params: [] },
        PlayerCommand: { type: 'event', label: 'Komut Çalıştırma', sub: 'PlayerCommandPreprocessEvent', params: [{ n: 'command', t: 'text', d: '/spawn' }] },
        ServerLoad: { type: 'event', label: 'Sunucu Başlangıcı', sub: 'onEnable', params: [] },

        // Koşullar
        HasPermission: { type: 'condition', label: 'İzin Kontrolü', params: [{ n: 'permission', t: 'text', d: 'my.permission' }] },
        IsOp: { type: 'condition', label: 'Op Kontrolü', params: [] },
        HasItem: { type: 'condition', label: 'Eşya Kontrolü', params: [{ n: 'material', t: 'text', d: 'DIAMOND' }] },
        HealthCheck: { type: 'condition', label: window.Lang ? window.Lang.t('vb.HealthCheck') : 'Health Check', params: [{ n: 'op', t: 'select', opts: ['>=', '<=', '==', '>', '<'], d: '>=' }, { n: 'value', t: 'number', d: '10' }] },
        CommandEquals: { type: 'condition', label: 'Komut Eşit mi?', params: [{ n: 'cmd', t: 'text', d: '/tp' }] },
        IsInWorld: { type: 'condition', label: 'Dünya Kontrolü', params: [{ n: 'world', t: 'text', d: 'world' }] },

        // Aksiyonlar
        SendMessage: { type: 'action', label: window.Lang ? window.Lang.t('vb.SendMessage') : 'Send Message', params: [{ n: 'mesaj', t: 'text', d: '&aHoş geldin!' }] },
        Broadcast: { type: 'action', label: 'Herkese Mesaj', params: [{ n: 'mesaj', t: 'text', d: '&eDuyuru!' }] },
        Teleport: { type: 'action', label: window.Lang ? window.Lang.t('vb.Teleport') : 'Teleport', params: [{ n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        GiveItem: { type: 'action', label: window.Lang ? window.Lang.t('vb.GiveItem') : 'Give Item', params: [{ n: 'material', t: 'text', d: 'DIAMOND' }, { n: 'adet', t: 'number', d: '1' }] },
        PlaySound: { type: 'action', label: window.Lang ? window.Lang.t('vb.PlaySound') : 'Play Sound', params: [{ n: 'ses', t: 'text', d: 'ENTITY_EXPERIENCE_ORB_PICKUP' }] },
        SpawnEntity: { type: 'action', label: 'Entity Oluştur', params: [{ n: 'entityType', t: 'text', d: 'ZOMBIE' }] },
        CancelEvent: { type: 'action', label: 'Olayı İptal Et', params: [] },
        KickPlayer: { type: 'action', label: window.Lang ? window.Lang.t('vb.KickPlayer') : 'Kick Player', params: [{ n: 'sebep', t: 'text', d: 'Kurallara aykırı davranış' }] },
        SetGameMode: { type: 'action', label: 'Oyun Modu', params: [{ n: 'mod', t: 'select', opts: ['CREATIVE', 'SURVIVAL', 'ADVENTURE', 'SPECTATOR'], d: 'CREATIVE' }] },
        SetHealth: { type: 'action', label: 'Can Ayarla', params: [{ n: 'can', t: 'number', d: '20' }] },
        SendTitle: { type: 'action', label: 'Başlık Göster', params: [{ n: 'başlık', t: 'text', d: 'Hoş Geldin!' }, { n: 'alt', t: 'text', d: 'Sunucuya bağlandın' }] },
        RunCommand: { type: 'action', label: window.Lang ? window.Lang.t('vb.RunCommand') : 'Run Command', params: [{ n: 'komut', t: 'text', d: 'op {player}' }] },

        // Kontrol
        IfElse: { type: 'control', label: 'If / Else', params: [] },
        Loop: { type: 'control', label: 'Döngü', params: [{ n: 'kez', t: 'number', d: '10' }] },
        Delay: { type: 'control', label: 'Gecikme', params: [{ n: 'tick', t: 'number', d: '20' }] },
        ForEachPlayer: { type: 'control', label: 'Her Oyuncu İçin', params: [] },
    },

    // ── FABRIC MOD ───────────────────────────────────────────
    fabric: {
        // Callback / Events
        FabricPlayerJoin: { type: 'event', label: 'Oyuncu Girişi', sub: 'ServerPlayConnectionEvents.JOIN', params: [] },
        FabricPlayerQuit: { type: 'event', label: 'Oyuncu Çıkışı', sub: 'ServerPlayConnectionEvents.DISCONNECT', params: [] },
        FabricServerStart: { type: 'event', label: 'Sunucu Başlangıcı', sub: 'ServerLifecycleEvents.SERVER_STARTED', params: [] },
        FabricServerStop: { type: 'event', label: 'Sunucu Durumu', sub: 'ServerLifecycleEvents.SERVER_STOPPING', params: [] },
        FabricBlockBreak: { type: 'event', label: 'Blok Kırma', sub: 'PlayerBlockBreakEvents.BEFORE', params: [] },
        FabricAttack: { type: 'event', label: 'Saldırı', sub: 'AttackEntityCallback.EVENT', params: [] },
        FabricInteract: { type: 'event', label: 'Etkileşim', sub: 'UseBlockCallback.EVENT', params: [] },

        // Koşullar
        FabricIsOp: { type: 'condition', label: 'Op Kontrolü', params: [] },
        FabricHasPermission: { type: 'condition', label: 'İzin Kontrolü', params: [{ n: 'perm', t: 'text', d: 'mymod.use' }] },
        FabricServerSide: { type: 'condition', label: 'Sunucu Tarafı', params: [] },

        // Aksiyonlar
        FabricSendMsg: { type: 'action', label: window.Lang ? window.Lang.t('vb.SendMessage') : 'Send Message', params: [{ n: 'mesaj', t: 'text', d: 'Merhaba!' }] },
        FabricBroadcast: { type: 'action', label: 'Yayın Mesajı', params: [{ n: 'mesaj', t: 'text', d: 'Duyuru!' }] },
        FabricTeleport: { type: 'action', label: window.Lang ? window.Lang.t('vb.Teleport') : 'Teleport', params: [{ n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        FabricGiveItem: { type: 'action', label: window.Lang ? window.Lang.t('vb.GiveItem') : 'Give Item', params: [{ n: 'item', t: 'text', d: 'minecraft:diamond' }, { n: 'adet', t: 'number', d: '1' }] },
        FabricSpawnEntity: { type: 'action', label: 'Entity Oluştur', params: [{ n: 'type', t: 'text', d: 'minecraft:zombie' }] },
        FabricSetBlock: { type: 'action', label: 'Blok Koy', params: [{ n: 'block', t: 'text', d: 'minecraft:diamond_block' }, { n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        FabricPlaySound: { type: 'action', label: window.Lang ? window.Lang.t('vb.PlaySound') : 'Play Sound', params: [{ n: 'ses', t: 'text', d: 'minecraft:entity.experience_orb.pickup' }] },

        // Kontrol
        FabricIf: { type: 'control', label: 'Koşul', params: [] },
        FabricLoop: { type: 'control', label: 'Döngü', params: [{ n: 'kez', t: 'number', d: '10' }] },
        FabricSchedule: { type: 'control', label: 'Zamanla', params: [{ n: 'tick', t: 'number', d: '20' }] },
    },

    // ── FORGE MOD ────────────────────────────────────────────
    forge: {
        ForgePlayerLogin: { type: 'event', label: 'Oyuncu Girişi', sub: 'PlayerEvent.PlayerLoggedInEvent', params: [] },
        ForgePlayerLogout: { type: 'event', label: 'Oyuncu Çıkışı', sub: 'PlayerEvent.PlayerLoggedOutEvent', params: [] },
        ForgeServerStart: { type: 'event', label: 'Sunucu Başlangıcı', sub: 'ServerStartedEvent', params: [] },
        ForgeBreak: { type: 'event', label: 'Blok Kırma', sub: 'BlockEvent.BreakEvent', params: [] },
        ForgePlace: { type: 'event', label: 'Blok Yerleştirme', sub: 'BlockEvent.EntityPlaceEvent', params: [] },
        ForgeLivingDamage: { type: 'event', label: 'Hasar', sub: 'LivingDamageEvent', params: [] },
        ForgeEntityJoin: { type: 'event', label: 'Entity Dünyaya Katıldı', sub: 'EntityJoinLevelEvent', params: [] },

        ForgeIsOp: { type: 'condition', label: 'Op Kontrolü', params: [] },
        ForgeHasCapability: { type: 'condition', label: 'Yetenek Var mı?', params: [{ n: 'cap', t: 'text', d: 'MY_CAP' }] },

        ForgeSendMsg: { type: 'action', label: window.Lang ? window.Lang.t('vb.SendMessage') : 'Send Message', params: [{ n: 'mesaj', t: 'text', d: 'Merhaba!' }] },
        ForgeGiveItem: { type: 'action', label: window.Lang ? window.Lang.t('vb.GiveItem') : 'Give Item', params: [{ n: 'item', t: 'text', d: 'minecraft:diamond' }, { n: 'adet', t: 'number', d: '1' }] },
        ForgeTeleport: { type: 'action', label: window.Lang ? window.Lang.t('vb.Teleport') : 'Teleport', params: [{ n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        ForgeCancelEvent: { type: 'action', label: 'Olayı İptal Et', params: [] },
        ForgeSetBlock: { type: 'action', label: 'Blok Koy', params: [{ n: 'block', t: 'text', d: 'minecraft:stone' }, { n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },

        ForgeIf: { type: 'control', label: 'Koşul', params: [] },
        ForgeLoop: { type: 'control', label: 'Döngü', params: [{ n: 'kez', t: 'number', d: '10' }] },
        ForgeSchedule: { type: 'control', label: 'Zamanla (Tick)', params: [{ n: 'tick', t: 'number', d: '20' }] },
    },

    // ── SKRIPT ───────────────────────────────────────────────
    skript: {
        SkJoin: { type: 'event', label: 'on join', sub: 'on join', params: [] },
        SkQuit: { type: 'event', label: 'on quit', sub: 'on quit', params: [] },
        SkChat: { type: 'event', label: 'on chat', sub: 'on chat', params: [] },
        SkBreak: { type: 'event', label: 'on break', sub: 'on break of any block', params: [] },
        SkPlace: { type: 'event', label: 'on place', sub: 'on place of any block', params: [] },
        SkDeath: { type: 'event', label: 'on death', sub: 'on death of player', params: [] },
        SkCommand: { type: 'event', label: 'command', sub: 'command', params: [{ n: 'komut', t: 'text', d: '/spawn' }] },
        SkDamage: { type: 'event', label: 'on damage', sub: 'on damage of player', params: [] },
        SkRightClick: { type: 'event', label: 'on right click', sub: 'on right click', params: [] },

        SkHasPerm: { type: 'condition', label: 'player has permission', params: [{ n: 'perm', t: 'text', d: 'skript.use' }] },
        SkIsOp: { type: 'condition', label: 'player is op', params: [] },
        SkHasItem: { type: 'condition', label: 'player has item', params: [{ n: 'item', t: 'text', d: 'diamond' }] },
        SkHealthCheck: { type: 'condition', label: 'health of player >=', params: [{ n: 'değer', t: 'number', d: '10' }] },
        SkWorldCheck: { type: 'condition', label: 'world is', params: [{ n: 'dünya', t: 'text', d: 'world' }] },

        SkSendMsg: { type: 'action', label: 'send message', params: [{ n: 'mesaj', t: 'text', d: 'Merhaba {player}!' }] },
        SkBroadcast: { type: 'action', label: 'broadcast', params: [{ n: 'mesaj', t: 'text', d: 'Duyuru: ...' }] },
        SkTeleport: { type: 'action', label: 'teleport player', params: [{ n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        SkGiveItem: { type: 'action', label: 'give item', params: [{ n: 'item', t: 'text', d: 'diamond' }, { n: 'adet', t: 'number', d: '1' }] },
        SkPlaySound: { type: 'action', label: 'play sound', params: [{ n: 'ses', t: 'text', d: 'entity.experience_orb.pickup' }] },
        SkKick: { type: 'action', label: 'kick player', params: [{ n: 'sebep', t: 'text', d: 'Banned' }] },
        SkSetGamemode: { type: 'action', label: 'set gamemode', params: [{ n: 'mod', t: 'select', opts: ['creative', 'survival', 'adventure', 'spectator'], d: 'creative' }] },
        SkCancel: { type: 'action', label: 'cancel event', params: [] },
        SkSpawn: { type: 'action', label: 'spawn entity', params: [{ n: 'entity', t: 'text', d: 'zombie' }] },

        SkIf: { type: 'control', label: 'if', params: [] },
        SkLoop: { type: 'control', label: 'loop', params: [{ n: 'kez', t: 'number', d: '10' }] },
        SkWait: { type: 'control', label: 'wait', params: [{ n: 'süre', t: 'text', d: '1 second' }] },
        SkLoopPlayers: { type: 'control', label: 'loop all players', params: [] },
    },
};

// ═══════════════════════════════════════════════════════════
// Hazır Şablonlar
// ═══════════════════════════════════════════════════════════

const VB_TEMPLATES = [
    {
        id: 'welcome_msg',
        name: '🎉 Karşılama Mesajı',
        desc: 'Oyuncu katıldığında özel mesaj göster',
        mode: 'plugin',
        nodes: [
            { blockId: 'PlayerJoin', x: 80, y: 120 },
            { blockId: 'SendMessage', x: 320, y: 120, params: { mesaj: '&aHoş geldin! &e{player}' } },
            { blockId: 'SendTitle', x: 320, y: 240, params: { başlık: '&6CraftServer', alt: '&eHoş Geldin!' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
        ],
    },
    {
        id: 'spawn_command',
        name: '🏠 /spawn Komutu',
        desc: '/spawn komutunu yazan oyuncuyu başlangıç noktasına ışınla',
        mode: 'plugin',
        nodes: [
            { blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/spawn' } },
            { blockId: 'CommandEquals', x: 320, y: 80, params: { cmd: '/spawn' } },
            { blockId: 'Teleport', x: 560, y: 80, params: { x: '0', y: '64', z: '0' } },
            { blockId: 'SendMessage', x: 560, y: 200, params: { mesaj: '&aSpawn\'a ışınlandınız!' } },
            { blockId: 'CancelEvent', x: 320, y: 200, params: {} },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 1, to: 3 },
            { from: 0, to: 4 },
        ],
    },
    {
        id: 'anti_drop',
        name: '🛡️ Anti-Eşya Düşürme',
        desc: 'Oyuncu öldüğünde eşyalar düşmesin',
        mode: 'plugin',
        nodes: [
            { blockId: 'PlayerDeath', x: 80, y: 120 },
            { blockId: 'CancelEvent', x: 320, y: 80, params: {} },
            { blockId: 'SendMessage', x: 320, y: 200, params: { mesaj: '&cÖldün! Eşyaların korunuyor.' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
        ],
    },
    {
        id: 'op_command',
        name: '⚡ Op Komutu',
        desc: 'Sadece op\'lerin çalıştırabileceği özel komut',
        mode: 'plugin',
        nodes: [
            { blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/myop' } },
            { blockId: 'IsOp', x: 320, y: 80 },
            { blockId: 'Broadcast', x: 560, y: 80, params: { mesaj: '&6Op komutu çalıştırıldı!' } },
            { blockId: 'SendMessage', x: 560, y: 200, params: { mesaj: '&cBu komutu kullanmaya yetkiniz yok!' } },
            { blockId: 'CancelEvent', x: 320, y: 200 },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 0, to: 4 },
            { from: 0, to: 3 },
        ],
    },
    {
        id: 'join_reward',
        name: '🎁 Giriş Ödülü',
        desc: 'Oyuncu sunucuya girince elmas versin',
        mode: 'plugin',
        nodes: [
            { blockId: 'PlayerJoin', x: 80, y: 120 },
            { blockId: 'GiveItem', x: 320, y: 80, params: { material: 'DIAMOND', adet: '3' } },
            { blockId: 'SendMessage', x: 320, y: 200, params: { mesaj: '&b3 elmas kazandınız!' } },
            { blockId: 'PlaySound', x: 560, y: 80, params: { ses: 'ENTITY_PLAYER_LEVELUP' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
            { from: 0, to: 3 },
        ],
    },
    {
        id: 'fabric_join',
        name: '🧵 Fabric: Oyuncu Girişi',
        desc: 'Fabric mod ile oyuncu girişinde mesaj gönder',
        mode: 'fabric',
        nodes: [
            { blockId: 'FabricPlayerJoin', x: 80, y: 120 },
            { blockId: 'FabricSendMsg', x: 320, y: 120, params: { mesaj: 'Hoş geldin!' } },
        ],
        connections: [{ from: 0, to: 1 }],
    },
    {
        id: 'skript_welcome',
        name: '📜 Skript: Karşılama',
        desc: 'Skript ile katılan oyuncuya mesaj ve başlık göster',
        mode: 'skript',
        nodes: [
            { blockId: 'SkJoin', x: 80, y: 120 },
            { blockId: 'SkSendMsg', x: 320, y: 80, params: { mesaj: '&aHoş geldin, {player}!' } },
            { blockId: 'SkBroadcast', x: 320, y: 200, params: { mesaj: '&e%player% sunucuya katıldı!' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
        ],
    },
    {
        id: 'skript_spawn_cmd',
        name: '📜 Skript: /spawn Komutu',
        desc: 'Skript ile /spawn komutu oluştur',
        mode: 'skript',
        nodes: [
            { blockId: 'SkCommand', x: 80, y: 120, params: { komut: '/spawn' } },
            { blockId: 'SkTeleport', x: 320, y: 80, params: { x: '0', y: '64', z: '0' } },
            { blockId: 'SkSendMsg', x: 320, y: 200, params: { mesaj: '&aSpawn\'a ışınlandınız!' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
        ],
    },
];

// ═══════════════════════════════════════════════════════════
// Node Editor State
// ═══════════════════════════════════════════════════════════

let vbNodes = [];
let vbConnections = [];
let vbNextId = 1;
let vbCanvas = null;
let vbCtx = null;
let vbDragging = null;
let vbDragOffset = { x: 0, y: 0 };
let vbConnecting = null;
let vbSelectedNode = null;
let vbCurrentMode = 'plugin';
let vbViewOffset = { x: 0, y: 0 };
let vbPanning = false;
let vbPanStart = { x: 0, y: 0 };

function getCurrentBlockDefs() {
    return ALL_BLOCK_DEFS[vbCurrentMode] || ALL_BLOCK_DEFS.plugin;
}

function initVisualBuilder() {
    const area = document.getElementById('visual-builder-canvas-wrapper');
    if (!area) return;
    if (document.getElementById('vb-connections-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'vb-connections-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    area.appendChild(canvas);

    vbCanvas = canvas;
    vbCtx = canvas.getContext('2d');

    area.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        const blockId = e.dataTransfer.getData('text/block-id');
        if (blockId && getCurrentBlockDefs()[blockId]) {
            const rect = area.getBoundingClientRect();
            createNode(blockId, e.clientX - rect.left - 80 - vbViewOffset.x, e.clientY - rect.top - 20 - vbViewOffset.y);
        }
    });

    // Middle mouse / Alt+drag to pan
    area.addEventListener('mousedown', (e) => {
        if (e.target === area || e.target === canvas) {
            selectNode(null);
            if (e.button === 1 || (e.button === 0 && e.altKey)) {
                vbPanning = true;
                vbPanStart = { x: e.clientX - vbViewOffset.x, y: e.clientY - vbViewOffset.y };
                e.preventDefault();
            }
        }
    });

    // Right-click on connections
    area.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // Check if clicked near a connection line
        const rect = area.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const connIdx = findConnectionNear(mx, my);
        if (connIdx >= 0) {
            vbConnections.splice(connIdx, 1);
            drawConnections();
            if (typeof showNotification === 'function') showNotification('🔗 Bağlantı silindi', 'success');
        } else {
            showVbContextMenu(e.clientX, e.clientY);
        }
    });

    resizeVBCanvas();
    window.addEventListener('resize', resizeVBCanvas);

    const observer = new MutationObserver(() => {
        if (document.getElementById('visual-builder-container').style.display !== 'none') {
            resizeVBCanvas();
        }
    });
    observer.observe(document.getElementById('visual-builder-container'), { attributes: true, attributeFilter: ['style'] });

    // Mode selector
    const modeSelect = document.getElementById('vb-mode-select');
    if (modeSelect) {
        modeSelect.addEventListener('change', () => {
            vbCurrentMode = modeSelect.value;
            rebuildContextMenu();
        });
    }

    // Templates button
    document.getElementById('btn-vb-templates')?.addEventListener('click', showTemplatesModal);
    document.getElementById('btn-vb-load-template-hint')?.addEventListener('click', showTemplatesModal);
    document.getElementById('vb-templates-close')?.addEventListener('click', hideTemplatesModal);

    // Build template grid
    buildTemplateGrid();
    setupVbContextMenu();
}

// ═══════════════════════════════════════════════════════════
// Şablonlar
// ═══════════════════════════════════════════════════════════

function buildTemplateGrid() {
    const grid = document.getElementById('vb-template-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const tpl of VB_TEMPLATES) {
        const card = document.createElement('div');
        card.className = 'vb-template-card';
        card.innerHTML = `<div class="vb-tpl-name">${tpl.name}</div><div class="vb-tpl-desc">${tpl.desc}</div><div class="vb-tpl-mode">${tpl.mode}</div>`;
        card.addEventListener('click', () => {
            loadTemplate(tpl);
            hideTemplatesModal();
        });
        grid.appendChild(card);
    }
}

function showTemplatesModal() {
    const modal = document.getElementById('vb-templates-modal');
    if (modal) modal.style.display = 'flex';
}

function hideTemplatesModal() {
    const modal = document.getElementById('vb-templates-modal');
    if (modal) modal.style.display = 'none';
}

function loadTemplate(tpl) {
    // Mevcut canvas temizle
    vbNodes = [];
    vbConnections = [];
    const area = document.getElementById('visual-builder-canvas-wrapper');
    if (area) area.querySelectorAll('.vb-node').forEach(n => n.remove());

    // Modu değiştir
    vbCurrentMode = tpl.mode;
    const modeSelect = document.getElementById('vb-mode-select');
    if (modeSelect) modeSelect.value = tpl.mode;
    rebuildContextMenu();

    const BLOCK_DEFS = getCurrentBlockDefs();
    const idMap = {};

    // Düğümleri oluştur
    tpl.nodes.forEach((n, i) => {
        if (!BLOCK_DEFS[n.blockId]) return;
        const node = createNode(n.blockId, n.x, n.y);
        if (node) {
            if (n.params) Object.assign(node.params, n.params);
            refreshNodeInputs(node);
            idMap[i] = node.id;
        }
    });

    // Bağlantıları oluştur
    tpl.connections.forEach(c => {
        const fromId = idMap[c.from];
        const toId = idMap[c.to];
        if (fromId && toId) {
            vbConnections.push({ from: fromId, to: toId });
        }
    });

    drawConnections();
    const hint = document.getElementById('vb-empty-hint');
    if (hint) hint.style.display = 'none';
    if (typeof showNotification === 'function') showNotification('📋 Şablon yüklendi!', 'success');
}

function refreshNodeInputs(node) {
    const el = document.getElementById('vb-node-' + node.id);
    if (!el) return;
    const BLOCK_DEFS = getCurrentBlockDefs();
    const def = BLOCK_DEFS[node.blockId];
    if (!def) return;
    el.querySelectorAll('input, select').forEach(inp => {
        const name = inp.dataset.paramName;
        if (name && node.params[name] !== undefined) {
            inp.value = node.params[name];
        }
    });
}

// ═══════════════════════════════════════════════════════════
// Canvas
// ═══════════════════════════════════════════════════════════

function resizeVBCanvas() {
    if (!vbCanvas) return;
    const area = document.getElementById('visual-builder-canvas-wrapper');
    if (!area) return;
    vbCanvas.width = area.clientWidth;
    vbCanvas.height = area.clientHeight;
    drawConnections();
}

// ═══════════════════════════════════════════════════════════
// Node CRUD
// ═══════════════════════════════════════════════════════════

function createNode(blockId, x, y) {
    const BLOCK_DEFS = getCurrentBlockDefs();
    const def = BLOCK_DEFS[blockId];
    if (!def) return null;

    const id = vbNextId++;
    const node = { id, blockId, type: def.type, label: def.label, x, y, params: {} };

    for (const p of (def.params || [])) {
        node.params[p.n] = p.d || '';
    }
    vbNodes.push(node);
    renderNode(node);
    selectNode(id);

    const hint = document.getElementById('vb-empty-hint');
    if (hint) hint.style.display = 'none';

    return node;
}

function renderNode(node) {
    const area = document.getElementById('visual-builder-canvas-wrapper');
    if (!area) return;
    const BLOCK_DEFS = getCurrentBlockDefs();
    const def = BLOCK_DEFS[node.blockId];
    if (!def) return;

    const el = document.createElement('div');
    el.className = 'vb-node';
    el.id = 'vb-node-' + node.id;
    el.style.left = (node.x + vbViewOffset.x) + 'px';
    el.style.top = (node.y + vbViewOffset.y) + 'px';
    el.style.zIndex = 2;

    const header = document.createElement('div');
    header.className = 'vb-node-header ' + node.type;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = node.label;
    header.appendChild(titleSpan);

    if (def.sub) {
        const sub = document.createElement('div');
        sub.style.cssText = 'font-size:9px;opacity:0.65;margin-top:2px;font-weight:400;';
        sub.textContent = def.sub;
        header.appendChild(sub);
    }

    const infoBtn = document.createElement('span');
    infoBtn.textContent = '💡';
    infoBtn.title = 'AI Asistana Sor (Tutor)';
    infoBtn.style.cssText = 'cursor:pointer;opacity:0.8;font-size:12px;margin-left:auto;padding:0 2px;line-height:1;';
    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.aiManager) {
            document.querySelector('.activity-btn[data-panel="ai"]')?.click();
            window.aiManager.chatInput.value = `Lütfen "${node.label}" bloğunun ne işe yaradığını, nasıl kullanıldığını ve dikkat etmem gerekenleri anlat.`;
            window.aiManager.handleChatInput();
        }
    });
    header.appendChild(infoBtn);

    const delBtn = document.createElement('span');
    delBtn.textContent = '✕';
    delBtn.title = 'Bloğu Sil';
    delBtn.style.cssText = 'cursor:pointer;opacity:0.7;font-size:12px;margin-left:8px;padding:0 2px;line-height:1;';
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteNode(node.id); });
    header.appendChild(delBtn);

    el.appendChild(header);

    if ((def.params || []).length > 0) {
        const body = document.createElement('div');
        body.className = 'vb-node-body';
        for (const p of def.params) {
            const lbl = document.createElement('div');
            lbl.style.cssText = 'font-size:10px;color:#8b949e;margin-top:4px;';
            lbl.textContent = p.n;
            body.appendChild(lbl);

            if (p.t === 'select' && p.opts) {
                const sel = document.createElement('select');
                sel.dataset.paramName = p.n;
                for (const opt of p.opts) {
                    const o = document.createElement('option');
                    o.value = opt; o.textContent = opt;
                    if (node.params[p.n] === opt) o.selected = true;
                    sel.appendChild(o);
                }
                sel.addEventListener('change', () => { node.params[p.n] = sel.value; });
                body.appendChild(sel);
            } else {
                const inp = document.createElement('input');
                inp.type = p.t === 'number' ? 'number' : 'text';
                inp.value = node.params[p.n] || '';
                inp.placeholder = p.n;
                inp.dataset.paramName = p.n;
                inp.addEventListener('input', () => { node.params[p.n] = inp.value; });
                body.appendChild(inp);
            }
        }
        el.appendChild(body);
    }

    // In port (non-event nodes)
    if (node.type !== 'event') {
        const inPort = document.createElement('div');
        inPort.className = 'vb-node-port in';
        inPort.dataset.nodeId = node.id;
        inPort.dataset.portType = 'in';
        inPort.title = 'Giriş — bağlanmak için başka bloğun çıkış portunu sürükle';
        el.appendChild(inPort);
    }

    const outPort = document.createElement('div');
    outPort.className = 'vb-node-port out';
    outPort.dataset.nodeId = node.id;
    outPort.dataset.portType = 'out';
    outPort.title = 'Çıkış — sürükleyerek bağla';
    el.appendChild(outPort);

    // Drag
    header.addEventListener('mousedown', (e) => {
        if (e.target === delBtn || e.target === infoBtn) return;
        e.preventDefault();
        vbDragging = node;
        const rect = el.getBoundingClientRect();
        vbDragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        selectNode(node.id);
    });

    // Port connection
    el.querySelectorAll('.vb-node-port').forEach(port => {
        port.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (port.dataset.portType === 'out') {
                vbConnecting = { fromId: node.id, startX: e.clientX, startY: e.clientY };
            }
        });
    });

    el.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.vb-node-port')) selectNode(node.id);
    });

    area.appendChild(el);
}

function deleteNode(id) {
    vbNodes = vbNodes.filter(n => n.id !== id);
    vbConnections = vbConnections.filter(c => c.from !== id && c.to !== id);
    const el = document.getElementById('vb-node-' + id);
    if (el) el.remove();
    drawConnections();
    if (vbSelectedNode === id) vbSelectedNode = null;
    if (typeof showNotification === 'function') showNotification(window.Lang ? window.Lang.t('msg.blockDeleted') : '🗑️ Block deleted', 'success');
    if (window.aiManager) window.aiManager.triggerBalanceCheck();
}

function selectNode(id) {
    vbSelectedNode = id;
    document.querySelectorAll('.vb-node').forEach(n => n.classList.remove('selected'));
    if (id) {
        const el = document.getElementById('vb-node-' + id);
        if (el) el.classList.add('selected');
    }
}

// ═══════════════════════════════════════════════════════════
// Mouse Events
// ═══════════════════════════════════════════════════════════

document.addEventListener('mousemove', (e) => {
    if (vbPanning) {
        vbViewOffset = { x: e.clientX - vbPanStart.x, y: e.clientY - vbPanStart.y };
        // Move all nodes
        vbNodes.forEach(node => {
            const el = document.getElementById('vb-node-' + node.id);
            if (el) {
                el.style.left = (node.x + vbViewOffset.x) + 'px';
                el.style.top = (node.y + vbViewOffset.y) + 'px';
            }
        });
        drawConnections();
        return;
    }

    if (vbDragging) {
        const area = document.getElementById('visual-builder-canvas-wrapper');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        vbDragging.x = e.clientX - rect.left - vbDragOffset.x - vbViewOffset.x;
        vbDragging.y = e.clientY - rect.top - vbDragOffset.y - vbViewOffset.y;
        const el = document.getElementById('vb-node-' + vbDragging.id);
        if (el) {
            el.style.left = (vbDragging.x + vbViewOffset.x) + 'px';
            el.style.top = (vbDragging.y + vbViewOffset.y) + 'px';
        }
        drawConnections();
    }
});

document.addEventListener('mouseup', (e) => {
    vbPanning = false;

    if (vbConnecting) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.classList.contains('vb-node-port') && target.dataset.portType === 'in') {
            const toId = parseInt(target.dataset.nodeId);
            if (toId !== vbConnecting.fromId) {
                const existIdx = vbConnections.findIndex(c => c.to === toId);
                if (existIdx >= 0) vbConnections.splice(existIdx, 1);
                vbConnections.push({ from: vbConnecting.fromId, to: toId });
                drawConnections();
                if (window.aiManager) window.aiManager.triggerBalanceCheck();
            }
        }
        vbConnecting = null;
    }
    vbDragging = null;
});

// ═══════════════════════════════════════════════════════════
// Bağlantı Çizimi + Yakın Bağlantı Bulma
// ═══════════════════════════════════════════════════════════

function getPortCenter(nodeId, portType) {
    const el = document.getElementById('vb-node-' + nodeId);
    if (!el) return null;
    const area = document.getElementById('visual-builder-canvas-wrapper');
    const areaRect = area.getBoundingClientRect();
    const port = el.querySelector('.vb-node-port.' + portType);
    if (!port) return null;
    const r = port.getBoundingClientRect();
    return { x: r.left + r.width / 2 - areaRect.left, y: r.top + r.height / 2 - areaRect.top };
}

function drawConnections() {
    if (!vbCtx || !vbCanvas) return;
    vbCtx.clearRect(0, 0, vbCanvas.width, vbCanvas.height);

    for (const conn of vbConnections) {
        const from = getPortCenter(conn.from, 'out');
        const to = getPortCenter(conn.to, 'in');
        if (!from || !to) continue;

        const dx = Math.abs(to.x - from.x);
        const cpx = dx * 0.5;

        vbCtx.beginPath();
        vbCtx.moveTo(from.x, from.y);
        vbCtx.bezierCurveTo(from.x + cpx, from.y, to.x - cpx, to.y, to.x, to.y);

        vbCtx.strokeStyle = '#2ecc71';
        vbCtx.lineWidth = 2.5;
        vbCtx.shadowBlur = 6;
        vbCtx.shadowColor = 'rgba(46,204,113,0.4)';
        vbCtx.stroke();
        vbCtx.shadowBlur = 0;

        // Arrow head
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        vbCtx.beginPath();
        vbCtx.arc(to.x, to.y, 4, 0, Math.PI * 2);
        vbCtx.fillStyle = '#2ecc71';
        vbCtx.fill();
    }
}

function pointOnBezier(t, p0, cp1, cp2, p1) {
    const mt = 1 - t;
    return {
        x: mt * mt * mt * p0.x + 3 * mt * mt * t * cp1.x + 3 * mt * t * t * cp2.x + t * t * t * p1.x,
        y: mt * mt * mt * p0.y + 3 * mt * mt * t * cp1.y + 3 * mt * t * t * cp2.y + t * t * t * p1.y,
    };
}

function findConnectionNear(mx, my, threshold = 10) {
    for (let i = 0; i < vbConnections.length; i++) {
        const conn = vbConnections[i];
        const from = getPortCenter(conn.from, 'out');
        const to = getPortCenter(conn.to, 'in');
        if (!from || !to) continue;

        const dx = Math.abs(to.x - from.x) * 0.5;
        const cp1 = { x: from.x + dx, y: from.y };
        const cp2 = { x: to.x - dx, y: to.y };

        for (let t = 0; t <= 1; t += 0.05) {
            const pt = pointOnBezier(t, from, cp1, cp2, to);
            const dist = Math.sqrt((pt.x - mx) ** 2 + (pt.y - my) ** 2);
            if (dist < threshold) return i;
        }
    }
    return -1;
}

// ═══════════════════════════════════════════════════════════
// Sağ Tık Menüsü
// ═══════════════════════════════════════════════════════════

let vbContextMenu = null;
let vbMenuLastContextPos = { x: 0, y: 0 };

function rebuildContextMenu() {
    if (!vbContextMenu) return;
    const BLOCK_DEFS = getCurrentBlockDefs();
    const categories = {
        'event': { title: '🟢 Olaylar', color: '#2ecc71', blocks: [] },
        'condition': { title: '🟡 Koşullar', color: '#f1c40f', blocks: [] },
        'action': { title: '🔵 Aksiyonlar', color: '#3498db', blocks: [] },
        'control': { title: '🟣 Kontrol', color: '#9b59b6', blocks: [] },
    };

    for (const [id, def] of Object.entries(BLOCK_DEFS)) {
        if (categories[def.type]) categories[def.type].blocks.push({ id, label: def.label });
    }

    let menuContent = `<div class="vb-cm-mode-label">${getModeLabel()}</div>`;
    for (const catKey in categories) {
        const cat = categories[catKey];
        if (cat.blocks.length === 0) continue;
        menuContent += `<div class="vb-cm-category" style="color:${cat.color}">${cat.title}</div>`;
        for (const block of cat.blocks) {
            menuContent += `<div class="vb-cm-item" data-block-id="${block.id}">${block.label}</div>`;
        }
    }

    menuContent += `<div class="vb-cm-separator"></div>`;
    menuContent += `<div class="vb-cm-action" id="cm-btn-templates">📋 Şablonlar</div>`;
    menuContent += `<div class="vb-cm-action" id="cm-btn-generate">⚡ Koda Dönüştür</div>`;
    menuContent += `<div class="vb-cm-action danger" id="cm-btn-clear">🗑️ Temizle</div>`;

    vbContextMenu.innerHTML = menuContent;

    vbContextMenu.querySelectorAll('.vb-cm-item').forEach(item => {
        item.addEventListener('click', () => {
            const blockId = item.getAttribute('data-block-id');
            const area = document.getElementById('visual-builder-canvas-wrapper');
            const rect = area.getBoundingClientRect();
            createNode(blockId, vbMenuLastContextPos.x - rect.left - vbViewOffset.x, vbMenuLastContextPos.y - rect.top - vbViewOffset.y);
            hideVbContextMenu();
        });
    });

    vbContextMenu.querySelector('#cm-btn-templates')?.addEventListener('click', () => { showTemplatesModal(); hideVbContextMenu(); });
    vbContextMenu.querySelector('#cm-btn-generate')?.addEventListener('click', () => { vbGenerateCode(); hideVbContextMenu(); });
    vbContextMenu.querySelector('#cm-btn-clear')?.addEventListener('click', () => { vbClearCanvas(); hideVbContextMenu(); });
}

function getModeLabel() {
    const labels = { plugin: window.Lang ? window.Lang.t('mode.plugin') : '📦 Plugin Mode', fabric: window.Lang ? window.Lang.t('mode.fabric') : '🧵 Fabric Mode', forge: window.Lang ? window.Lang.t('mode.forge') : '🔨 Forge Mode', skript: window.Lang ? window.Lang.t('mode.skript') : '📜 Skript' };
    return labels[vbCurrentMode] || window.Lang ? window.Lang.t('mode.plugin') : '📦 Plugin Mode';
}

function setupVbContextMenu() {
    const area = document.getElementById('visual-builder-canvas-wrapper');
    if (!area) return;

    vbContextMenu = document.createElement('div');
    vbContextMenu.className = 'vb-context-menu';
    vbContextMenu.style.display = 'none';
    document.body.appendChild(vbContextMenu);

    rebuildContextMenu();

    document.addEventListener('click', (e) => {
        if (!vbContextMenu.contains(e.target)) hideVbContextMenu();
    });
}

function showVbContextMenu(x, y) {
    if (!vbContextMenu) return;
    vbMenuLastContextPos = { x, y };
    vbContextMenu.style.display = 'block';

    const rect = vbContextMenu.getBoundingClientRect();
    let posX = x;
    let posY = y;
    if (posX + rect.width > window.innerWidth) posX = window.innerWidth - rect.width - 10;
    if (posY + rect.height > window.innerHeight) posY = window.innerHeight - rect.height - 10;

    vbContextMenu.style.left = posX + 'px';
    vbContextMenu.style.top = posY + 'px';
}

function hideVbContextMenu() {
    if (vbContextMenu) vbContextMenu.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// Kod Üretimi
// ═══════════════════════════════════════════════════════════

function vbGenerateCode() {
    let code = '';
    switch (vbCurrentMode) {
        case 'plugin': code = generatePluginCode(); break;
        case 'fabric': code = generateFabricCode(); break;
        case 'forge': code = generateForgeCode(); break;
        case 'skript': code = generateSkriptCode(); break;
        default: code = generatePluginCode();
    }

    if (window.monacoEditor && window.monaco) {
        const lang = vbCurrentMode === 'skript' ? 'plaintext' : 'java';
        const model = window.monaco.editor.createModel(code, lang);
        window.monacoEditor.setModel(model);
        document.getElementById('welcome-screen').classList.remove('active');
        document.querySelectorAll('.editor-container').forEach(ec => ec.style.display = 'none');
        document.getElementById('editor-container').style.display = 'block';
        if (typeof showNotification === 'function') showNotification(window.Lang ? window.Lang.t('msg.codeGenerated') : '⚡ Code generated!', 'success');
    } else {
        if (typeof showNotification === 'function') showNotification('Editor yüklenmedi', 'error');
    }
}

function getConnectedChain(startId) {
    const chain = [];
    let currentId = startId;
    const visited = new Set();
    while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        chain.push(currentId);
        const conn = vbConnections.find(c => c.from === currentId);
        currentId = conn ? conn.to : null;
    }
    return chain;
}

// Plugin (Paper/Bukkit) kodu
function generatePluginCode() {
    const BLOCK_DEFS = ALL_BLOCK_DEFS.plugin;
    if (vbNodes.length === 0) return '// Henüz blok yok\n';

    let code = 'package me.craftide.myplugin;\n\n';
    code += 'import org.bukkit.plugin.java.JavaPlugin;\n';
    code += 'import org.bukkit.event.*;\nimport org.bukkit.event.player.*;\n';
    code += 'import org.bukkit.event.block.*;\nimport org.bukkit.event.entity.*;\n';
    code += 'import org.bukkit.event.inventory.*;\n';
    code += 'import org.bukkit.*;\nimport org.bukkit.entity.*;\nimport org.bukkit.inventory.*;\n\n';
    code += 'public class Main extends JavaPlugin implements Listener {\n\n';
    code += '    @Override\n    public void onEnable() {\n';
    code += '        getServer().getPluginManager().registerEvents(this, this);\n';
    code += '        getLogger().info("Plugin aktif!");\n    }\n\n';
    code += '    @Override\n    public void onDisable() {\n';
    code += '        getLogger().info("Plugin devre dışı!");\n    }\n\n';

    const eventNodes = vbNodes.filter(n => n.type === 'event' && n.blockId !== 'ServerLoad');
    for (const evNode of eventNodes) {
        const def = BLOCK_DEFS[evNode.blockId];
        if (!def || !def.sub) continue;
        code += '    @EventHandler\n';
        code += '    public void on' + evNode.blockId + '(' + def.sub + ' event) {\n';
        const chain = getConnectedChain(evNode.id);
        for (const nodeId of chain) {
            const node = vbNodes.find(n => n.id === nodeId);
            if (!node || node.type === 'event') continue;
            code += generatePluginNodeCode(node, '        ');
        }
        code += '    }\n\n';
    }
    code += '}\n';
    return code;
}

function generatePluginNodeCode(node, indent) {
    const p = node.params;
    switch (node.blockId) {
        case 'HasPermission': return indent + 'if (event.getPlayer() != null && event.getPlayer().hasPermission("' + (p.permission || 'perm') + '")) {\n';
        case 'IsOp': return indent + 'if (event.getPlayer() != null && event.getPlayer().isOp()) {\n';
        case 'HasItem': return indent + 'if (event.getPlayer().getInventory().contains(Material.' + (p.material || 'DIAMOND') + ')) {\n';
        case 'HealthCheck': return indent + 'if (event.getPlayer().getHealth() ' + (p.op || '>=') + ' ' + (p.value || '10') + ') {\n';
        case 'CommandEquals': return indent + 'if (event.getMessage().equalsIgnoreCase("' + (p.cmd || '/cmd') + '")) {\n';
        case 'IsInWorld': return indent + 'if (event.getPlayer().getWorld().getName().equals("' + (p.world || 'world') + '")) {\n';
        case 'SendMessage': return indent + 'event.getPlayer().sendMessage(org.bukkit.ChatColor.translateAlternateColorCodes(\'&\', "' + (p.mesaj || 'Merhaba!') + '"));\n';
        case 'Broadcast': return indent + 'Bukkit.broadcastMessage(org.bukkit.ChatColor.translateAlternateColorCodes(\'&\', "' + (p.mesaj || 'Duyuru!') + '"));\n';
        case 'Teleport': return indent + 'event.getPlayer().teleport(new org.bukkit.Location(event.getPlayer().getWorld(), ' + (p.x || 0) + ', ' + (p.y || 64) + ', ' + (p.z || 0) + '));\n';
        case 'GiveItem': return indent + 'event.getPlayer().getInventory().addItem(new ItemStack(Material.' + (p.material || 'DIAMOND') + ', ' + (p.adet || 1) + '));\n';
        case 'PlaySound': return indent + 'event.getPlayer().playSound(event.getPlayer().getLocation(), Sound.' + (p.ses || 'ENTITY_EXPERIENCE_ORB_PICKUP') + ', 1f, 1f);\n';
        case 'SpawnEntity': return indent + 'event.getPlayer().getWorld().spawnEntity(event.getPlayer().getLocation(), EntityType.' + (p.entityType || 'ZOMBIE') + ');\n';
        case 'CancelEvent': return indent + 'event.setCancelled(true);\n';
        case 'KickPlayer': return indent + 'event.getPlayer().kickPlayer("' + (p.sebep || '') + '");\n';
        case 'SetGameMode': return indent + 'event.getPlayer().setGameMode(GameMode.' + (p.mod || 'CREATIVE') + ');\n';
        case 'SetHealth': return indent + 'event.getPlayer().setHealth(' + (p.can || 20) + ');\n';
        case 'SendTitle': return indent + 'event.getPlayer().sendTitle("' + (p.başlık || 'Başlık') + '", "' + (p.alt || '') + '", 10, 70, 20);\n';
        case 'RunCommand': return indent + 'Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "' + (p.komut || '') + '".replace("{player}", event.getPlayer().getName()));\n';
        case 'IfElse': return indent + '// If-Else bloğu\n';
        case 'Loop': return indent + 'for (int i = 0; i < ' + (p.kez || 10) + '; i++) {\n' + indent + '    // döngü gövdesi\n' + indent + '}\n';
        case 'Delay': return indent + 'getServer().getScheduler().runTaskLater(this, () -> {\n' + indent + '    // gecikmeli işlem\n' + indent + '}, ' + (p.tick || 20) + ');\n';
        case 'ForEachPlayer': return indent + 'for (Player p : Bukkit.getOnlinePlayers()) {\n' + indent + '    // her oyuncu için\n' + indent + '}\n';
        default: return indent + '// ' + node.label + '\n';
    }
}

// Fabric kodu
function generateFabricCode() {
    const BLOCK_DEFS = ALL_BLOCK_DEFS.fabric;
    if (vbNodes.length === 0) return '// Henüz blok yok\n';

    let code = 'package me.craftide.mymod;\n\n';
    code += 'import net.fabricmc.api.ModInitializer;\n';
    code += 'import net.fabricmc.fabric.api.event.lifecycle.v1.*;\n';
    code += 'import net.fabricmc.fabric.api.networking.v1.*;\n';
    code += 'import net.fabricmc.fabric.api.event.player.*;\n';
    code += 'import net.minecraft.server.network.ServerPlayerEntity;\n';
    code += 'import net.minecraft.text.Text;\n';
    code += 'import net.minecraft.world.World;\n\n';
    code += 'public class MyMod implements ModInitializer {\n\n';
    code += '    @Override\n    public void onInitialize() {\n';

    const eventNodes = vbNodes.filter(n => n.type === 'event');
    for (const evNode of eventNodes) {
        const def = BLOCK_DEFS[evNode.blockId];
        if (!def) continue;
        code += '        ' + (def.sub || 'SERVER_EVENT') + '.register((';
        if (evNode.blockId === 'FabricPlayerJoin' || evNode.blockId === 'FabricPlayerQuit') {
            code += 'handler, player) -> {\n';
        } else if (evNode.blockId === 'FabricServerStart' || evNode.blockId === 'FabricServerStop') {
            code += 'server) -> {\n';
        } else {
            code += 'handler) -> {\n';
        }

        const chain = getConnectedChain(evNode.id);
        for (const nodeId of chain) {
            const node = vbNodes.find(n => n.id === nodeId);
            if (!node || node.type === 'event') continue;
            code += generateFabricNodeCode(node, '            ');
        }
        code += '        });\n\n';
    }

    code += '    }\n}\n';
    return code;
}

function generateFabricNodeCode(node, indent) {
    const p = node.params;
    switch (node.blockId) {
        case 'FabricSendMsg': return indent + 'player.sendMessage(Text.of("' + (p.mesaj || 'Merhaba!') + '"), false);\n';
        case 'FabricBroadcast': return indent + 'handler.getServer().getPlayerManager().broadcast(Text.of("' + (p.mesaj || 'Duyuru!') + '"), false);\n';
        case 'FabricTeleport': return indent + 'player.teleport(player.getWorld(), ' + (p.x || 0) + ', ' + (p.y || 64) + ', ' + (p.z || 0) + ', 0f, 0f);\n';
        case 'FabricGiveItem': return indent + '// ItemStack stack = new ItemStack(Registries.ITEM.get(Identifier.of("' + (p.item || 'minecraft:diamond') + '")), ' + (p.adet || 1) + ');\n' + indent + '// player.giveItemStack(stack);\n';
        case 'FabricSpawnEntity': return indent + '// Entity entity = EntityType.get("' + (p.type || 'minecraft:zombie') + '").get().create(player.getWorld());\n' + indent + '// entity.refreshPositionAndAngles(player.getX(), player.getY(), player.getZ(), 0, 0);\n' + indent + '// player.getWorld().spawnEntity(entity);\n';
        case 'FabricSetBlock': return indent + 'player.getWorld().setBlockState(new net.minecraft.util.math.BlockPos((int)' + (p.x || 0) + ', (int)' + (p.y || 64) + ', (int)' + (p.z || 0) + '), net.minecraft.block.Blocks.STONE.getDefaultState());\n';
        case 'FabricPlaySound': return indent + 'player.playSound(net.minecraft.registry.Registries.SOUND_EVENT.get(net.minecraft.util.Identifier.of("' + (p.ses || 'minecraft:entity.experience_orb.pickup') + '")), 1f, 1f);\n';
        case 'FabricIsOp': return indent + 'if (player.hasPermissionLevel(4)) {\n';
        case 'FabricIf': return indent + '// Koşul bloğu\n';
        case 'FabricLoop': return indent + 'for (int i = 0; i < ' + (p.kez || 10) + '; i++) {\n' + indent + '    // döngü gövdesi\n' + indent + '}\n';
        case 'FabricSchedule': return indent + '// MinecraftServer.currentTick\'e göre gecikmeli çalışma\n';
        default: return indent + '// ' + node.label + '\n';
    }
}

// Forge kodu
function generateForgeCode() {
    const BLOCK_DEFS = ALL_BLOCK_DEFS.forge;
    if (vbNodes.length === 0) return '// Henüz blok yok\n';

    let code = 'package me.craftide.mymod;\n\n';
    code += 'import net.minecraftforge.eventbus.api.*;\n';
    code += 'import net.minecraftforge.event.*;\n';
    code += 'import net.minecraftforge.event.entity.player.*;\n';
    code += 'import net.minecraftforge.event.level.*;\n';
    code += 'import net.minecraftforge.fml.common.Mod;\n';
    code += 'import net.minecraft.network.chat.Component;\n\n';
    code += '@Mod("mymod")\npublic class MyMod {\n\n';
    code += '    public MyMod() {\n        net.minecraftforge.common.MinecraftForge.EVENT_BUS.register(this);\n    }\n\n';

    const eventNodes = vbNodes.filter(n => n.type === 'event');
    for (const evNode of eventNodes) {
        const def = BLOCK_DEFS[evNode.blockId];
        if (!def) continue;
        code += '    @SubscribeEvent\n';
        code += '    public void on' + evNode.blockId + '(' + (def.sub || 'Event') + ' event) {\n';
        const chain = getConnectedChain(evNode.id);
        for (const nodeId of chain) {
            const node = vbNodes.find(n => n.id === nodeId);
            if (!node || node.type === 'event') continue;
            code += generateForgeNodeCode(node, '        ');
        }
        code += '    }\n\n';
    }
    code += '}\n';
    return code;
}

function generateForgeNodeCode(node, indent) {
    const p = node.params;
    switch (node.blockId) {
        case 'ForgeSendMsg': return indent + 'if (event.getEntity() instanceof net.minecraft.world.entity.player.Player player) {\n' + indent + '    player.sendSystemMessage(Component.literal("' + (p.mesaj || 'Merhaba!') + '"));\n' + indent + '}\n';
        case 'ForgeCancelEvent': return indent + 'event.setCanceled(true);\n';
        case 'ForgeTeleport': return indent + 'if (event.getEntity() instanceof net.minecraft.world.entity.player.Player player) {\n' + indent + '    player.teleportTo(' + (p.x || 0) + ', ' + (p.y || 64) + ', ' + (p.z || 0) + ');\n' + indent + '}\n';
        case 'ForgeGiveItem': return indent + '// player.getInventory().add(new ItemStack(...));\n';
        case 'ForgeIsOp': return indent + 'if (event.getEntity() instanceof net.minecraft.world.entity.player.Player p && p.hasPermissions(4)) {\n';
        case 'ForgeIf': return indent + '// Koşul bloğu\n';
        case 'ForgeLoop': return indent + 'for (int i = 0; i < ' + (p.kez || 10) + '; i++) {\n' + indent + '    // döngü gövdesi\n' + indent + '}\n';
        default: return indent + '// ' + node.label + '\n';
    }
}

// Skript kodu
function generateSkriptCode() {
    const BLOCK_DEFS = ALL_BLOCK_DEFS.skript;
    if (vbNodes.length === 0) return '# Henüz blok yok\n';

    let code = '# CraftIDE Görsel Builder — Skript Kodu\n# Düzenle ve scripts/ klasörüne kopyala\n\n';

    const eventNodes = vbNodes.filter(n => n.type === 'event');
    for (const evNode of eventNodes) {
        const def = BLOCK_DEFS[evNode.blockId];
        if (!def) continue;

        if (evNode.blockId === 'SkCommand') {
            code += 'command ' + (evNode.params.komut || '/mycommand') + ':\n';
            code += '    trigger:\n';
            const chain = getConnectedChain(evNode.id);
            for (const nodeId of chain) {
                const node = vbNodes.find(n => n.id === nodeId);
                if (!node || node.type === 'event') continue;
                code += generateSkriptNodeCode(node, '        ');
            }
        } else {
            code += def.sub + ':\n';
            const chain = getConnectedChain(evNode.id);
            for (const nodeId of chain) {
                const node = vbNodes.find(n => n.id === nodeId);
                if (!node || node.type === 'event') continue;
                code += generateSkriptNodeCode(node, '    ');
            }
        }
        code += '\n';
    }
    return code;
}

function generateSkriptNodeCode(node, indent) {
    const p = node.params;
    switch (node.blockId) {
        case 'SkHasPerm': return indent + 'if player has permission "' + (p.perm || 'skript.use') + '":\n';
        case 'SkIsOp': return indent + 'if player is op:\n';
        case 'SkHasItem': return indent + 'if player has ' + (p.item || 'diamond') + ':\n';
        case 'SkHealthCheck': return indent + 'if health of player >= ' + (p.değer || 10) + ':\n';
        case 'SkWorldCheck': return indent + 'if world is "' + (p.dünya || 'world') + '":\n';
        case 'SkSendMsg': return indent + 'send "' + (p.mesaj || 'Merhaba!') + '" to player\n';
        case 'SkBroadcast': return indent + 'broadcast "' + (p.mesaj || 'Duyuru!') + '"\n';
        case 'SkTeleport': return indent + 'teleport player to location(' + (p.x || 0) + ', ' + (p.y || 64) + ', ' + (p.z || 0) + ', world)\n';
        case 'SkGiveItem': return indent + 'give ' + (p.adet || 1) + ' ' + (p.item || 'diamond') + ' to player\n';
        case 'SkPlaySound': return indent + 'play sound "' + (p.ses || 'entity.experience_orb.pickup') + '" to player\n';
        case 'SkKick': return indent + 'kick player due to "' + (p.sebep || 'Banned') + '"\n';
        case 'SkSetGamemode': return indent + 'set gamemode of player to ' + (p.mod || 'creative') + '\n';
        case 'SkCancel': return indent + 'cancel event\n';
        case 'SkSpawn': return indent + 'spawn a ' + (p.entity || 'zombie') + ' at player\n';
        case 'SkIf': return indent + 'if (condition):\n';
        case 'SkLoop': return indent + 'loop ' + (p.kez || 10) + ' times:\n';
        case 'SkWait': return indent + 'wait ' + (p.süre || '1 second') + '\n';
        case 'SkLoopPlayers': return indent + 'loop all players:\n';
        default: return indent + '# ' + node.label + '\n';
    }
}

// ═══════════════════════════════════════════════════════════
// Buton Bağlantıları
// ═══════════════════════════════════════════════════════════

function vbClearCanvas() {
    if (vbNodes.length === 0) return;
    if (confirm('Tüm bloklar silinsin mi?')) {
        vbNodes = [];
        vbConnections = [];
        const area = document.getElementById('visual-builder-canvas-wrapper');
        if (area) area.querySelectorAll('.vb-node').forEach(n => n.remove());
        drawConnections();
        vbViewOffset = { x: 0, y: 0 };
        if (typeof showNotification === 'function') showNotification('🗑️ Canvas temizlendi', 'success');
        const hint = document.getElementById('vb-empty-hint');
        if (hint) hint.style.display = '';
    }
}

document.getElementById('btn-vb-generate')?.addEventListener('click', vbGenerateCode);
document.getElementById('btn-vb-clear')?.addEventListener('click', vbClearCanvas);

document.addEventListener('DOMContentLoaded', () => {
    initVisualBuilder();
});
