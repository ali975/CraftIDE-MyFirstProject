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
        PlayerJoin: { type: 'event', label: 'Player Join', sub: 'PlayerJoinEvent', params: [] },
        PlayerQuit: { type: 'event', label: 'Player Quit', sub: 'PlayerQuitEvent', params: [] },
        BlockBreak: { type: 'event', label: 'Block Break', sub: 'BlockBreakEvent', params: [] },
        BlockPlace: { type: 'event', label: 'Block Place', sub: 'BlockPlaceEvent', params: [] },
        PlayerChat: { type: 'event', label: 'Player Chat', sub: 'AsyncPlayerChatEvent', params: [] },
        PlayerDeath: { type: 'event', label: 'Player Death', sub: 'PlayerDeathEvent', params: [] },
        EntityDamage: { type: 'event', label: 'Damage', sub: 'EntityDamageByEntityEvent', params: [] },
        InventoryClick: { type: 'event', label: 'Inventory Click', sub: 'InventoryClickEvent', params: [] },
        PlayerMove: { type: 'event', label: 'Player Move', sub: 'PlayerMoveEvent', params: [] },
        PlayerCommand: { type: 'event', label: 'Command Preprocess', sub: 'PlayerCommandPreprocessEvent', params: [{ n: 'command', t: 'text', d: '/spawn' }] },
        ServerLoad: { type: 'event', label: 'Server Start', sub: 'onEnable', params: [] },

        // Koşullar
        HasPermission: { type: 'condition', label: 'Permission Check', params: [{ n: 'permission', t: 'text', d: 'my.permission' }] },
        IsOp: { type: 'condition', label: 'Op Check', params: [] },
        HasItem: { type: 'condition', label: 'Has Item', params: [{ n: 'material', t: 'text', d: 'DIAMOND' }] },
        HealthCheck: { type: 'condition', label: window.Lang ? window.Lang.t('vb.HealthCheck') : 'Health Check', params: [{ n: 'op', t: 'select', opts: ['>=', '<=', '==', '>', '<'], d: '>=' }, { n: 'value', t: 'number', d: '10' }] },
        CommandEquals: { type: 'condition', label: 'Command Equals?', params: [{ n: 'cmd', t: 'text', d: '/tp' }] },
        IsInWorld: { type: 'condition', label: 'World Check', params: [{ n: 'world', t: 'text', d: 'world' }] },

        // Aksiyonlar
        SendMessage: { type: 'action', label: window.Lang ? window.Lang.t('vb.SendMessage') : 'Send Message', params: [{ n: 'mesaj', t: 'text', d: '&aHoş geldin!' }] },
        Broadcast: { type: 'action', label: 'Broadcast', params: [{ n: 'mesaj', t: 'text', d: '&eDuyuru!' }] },
        Teleport: { type: 'action', label: window.Lang ? window.Lang.t('vb.Teleport') : 'Teleport', params: [{ n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        GiveItem: { type: 'action', label: window.Lang ? window.Lang.t('vb.GiveItem') : 'Give Item', params: [{ n: 'material', t: 'text', d: 'DIAMOND' }, { n: 'adet', t: 'number', d: '1' }] },
        PlaySound: { type: 'action', label: window.Lang ? window.Lang.t('vb.PlaySound') : 'Play Sound', params: [{ n: 'ses', t: 'text', d: 'ENTITY_EXPERIENCE_ORB_PICKUP' }] },
        SpawnEntity: { type: 'action', label: 'Spawn Entity', params: [{ n: 'entityType', t: 'text', d: 'ZOMBIE' }] },
        CancelEvent: { type: 'action', label: 'Cancel Event', params: [] },
        KickPlayer: { type: 'action', label: window.Lang ? window.Lang.t('vb.KickPlayer') : 'Kick Player', params: [{ n: 'sebep', t: 'text', d: 'Kurallara aykırı davranış' }] },
        SetGameMode: { type: 'action', label: 'Set Gamemode', params: [{ n: 'mod', t: 'select', opts: ['CREATIVE', 'SURVIVAL', 'ADVENTURE', 'SPECTATOR'], d: 'CREATIVE' }] },
        SetHealth: { type: 'action', label: 'Set Health', params: [{ n: 'can', t: 'number', d: '20' }] },
        SendTitle: { type: 'action', label: 'Show Title', params: [{ n: 'başlık', t: 'text', d: 'Hoş Geldin!' }, { n: 'alt', t: 'text', d: 'Sunucuya bağlandın' }] },
        RunCommand: { type: 'action', label: window.Lang ? window.Lang.t('vb.RunCommand') : 'Run Command', params: [{ n: 'komut', t: 'text', d: 'op {player}' }] },

        // Kontrol
        IfElse: { type: 'control', label: 'If / Else', params: [] },
        Loop: { type: 'control', label: 'Loop', params: [{ n: 'kez', t: 'number', d: '10' }] },
        Delay: { type: 'control', label: 'Delay', params: [{ n: 'tick', t: 'number', d: '20' }] },
        ForEachPlayer: { type: 'control', label: 'For Each Player', params: [] },

        // GUI
        CreateGUI: { type: 'action', label: 'Create GUI', params: [{ n: 'baslik', t: 'text', d: 'Shop' }, { n: 'satir', t: 'select', opts: ['1','2','3','4','5','6'], d: '3' }] },
        SetGUIItem: { type: 'action', label: 'Set GUI Item', params: [{ n: 'slot', t: 'number', d: '0' }, { n: 'material', t: 'text', d: 'DIAMOND' }, { n: 'isim', t: 'text', d: 'Elmas' }] },
        OpenGUI: { type: 'action', label: 'Open GUI', params: [{ n: 'envanter', t: 'text', d: 'inv' }] },
        GUIClickEvent: { type: 'event', label: 'GUI Click', sub: 'InventoryClickEvent', params: [{ n: 'envanter', t: 'text', d: 'Shop' }] },

        // Zamanlayıcı
        RunAfterDelay: { type: 'control', label: 'Run After Delay', params: [{ n: 'tick', t: 'number', d: '20' }] },
        RepeatTask: { type: 'control', label: 'Repeat Task', params: [{ n: 'baslangic', t: 'number', d: '0' }, { n: 'aralik', t: 'number', d: '20' }] },
        CancelTask: { type: 'action', label: 'Cancel Task', params: [{ n: 'gorevAdi', t: 'text', d: 'myTask' }] },

        // Veri Depolama
        ConfigGet: { type: 'action', label: 'Config Get', params: [{ n: 'key', t: 'text', d: 'players.points' }, { n: 'varsayilan', t: 'text', d: '0' }] },
        ConfigSet: { type: 'action', label: 'Config Set', params: [{ n: 'key', t: 'text', d: 'players.points' }, { n: 'deger', t: 'text', d: '100' }] },
        PDCGet: { type: 'action', label: 'PDC Get', params: [{ n: 'namespace', t: 'text', d: 'myplugin' }, { n: 'key', t: 'text', d: 'coins' }] },
        PDCSet: { type: 'action', label: 'PDC Set', params: [{ n: 'namespace', t: 'text', d: 'myplugin' }, { n: 'key', t: 'text', d: 'coins' }, { n: 'deger', t: 'text', d: '0' }] },

        // Ekonomi / Vault
        GetBalance: { type: 'action', label: 'Get Balance', params: [{ n: 'hedef', t: 'text', d: 'player' }] },
        GiveMoney: { type: 'action', label: 'Give Money', params: [{ n: 'miktar', t: 'number', d: '100' }] },
        TakeMoney: { type: 'action', label: 'Take Money', params: [{ n: 'miktar', t: 'number', d: '100' }] },

        // Değişkenler
        SetVariable: { type: 'action', label: 'Set Variable', sub: 'variable', params: [{ n: 'name', t: 'text', d: 'playerCoins' }, { n: 'value', t: 'text', d: '0' }] },
        GetVariable: { type: 'action', label: 'Get Variable', sub: 'variable', params: [{ n: 'name', t: 'text', d: 'playerCoins' }] },
        MathOperation: { type: 'action', label: 'Math Operation', sub: 'variable', params: [{ n: 'var', t: 'text', d: 'playerCoins' }, { n: 'op', t: 'select', opts: ['add', 'sub', 'mul', 'div'], d: 'add' }, { n: 'amount', t: 'number', d: '10' }] },
        CompareVariable: { type: 'condition', label: 'Compare Variable', sub: 'variable', params: [{ n: 'var', t: 'text', d: 'playerCoins' }, { n: 'op', t: 'select', opts: ['==', '!=', '>', '<', '>=', '<='], d: '>=' }, { n: 'value', t: 'text', d: '0' }] },
    },

    // ── FABRIC MOD ───────────────────────────────────────────
    fabric: {
        // Callback / Events
        FabricPlayerJoin: { type: 'event', label: 'Player Join', sub: 'ServerPlayConnectionEvents.JOIN', params: [] },
        FabricPlayerQuit: { type: 'event', label: 'Player Quit', sub: 'ServerPlayConnectionEvents.DISCONNECT', params: [] },
        FabricServerStart: { type: 'event', label: 'Server Start', sub: 'ServerLifecycleEvents.SERVER_STARTED', params: [] },
        FabricServerStop: { type: 'event', label: 'Server Stopping', sub: 'ServerLifecycleEvents.SERVER_STOPPING', params: [] },
        FabricBlockBreak: { type: 'event', label: 'Block Break', sub: 'PlayerBlockBreakEvents.BEFORE', params: [] },
        FabricAttack: { type: 'event', label: 'Attack', sub: 'AttackEntityCallback.EVENT', params: [] },
        FabricInteract: { type: 'event', label: 'Interact', sub: 'UseBlockCallback.EVENT', params: [] },

        // Koşullar
        FabricIsOp: { type: 'condition', label: 'Op Check', params: [] },
        FabricHasPermission: { type: 'condition', label: 'Permission Check', params: [{ n: 'perm', t: 'text', d: 'mymod.use' }] },
        FabricServerSide: { type: 'condition', label: 'Server Side', params: [] },

        // Aksiyonlar
        FabricSendMsg: { type: 'action', label: window.Lang ? window.Lang.t('vb.SendMessage') : 'Send Message', params: [{ n: 'mesaj', t: 'text', d: 'Merhaba!' }] },
        FabricBroadcast: { type: 'action', label: 'Broadcast', params: [{ n: 'mesaj', t: 'text', d: 'Duyuru!' }] },
        FabricTeleport: { type: 'action', label: window.Lang ? window.Lang.t('vb.Teleport') : 'Teleport', params: [{ n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        FabricGiveItem: { type: 'action', label: window.Lang ? window.Lang.t('vb.GiveItem') : 'Give Item', params: [{ n: 'item', t: 'text', d: 'minecraft:diamond' }, { n: 'adet', t: 'number', d: '1' }] },
        FabricSpawnEntity: { type: 'action', label: 'Spawn Entity', params: [{ n: 'type', t: 'text', d: 'minecraft:zombie' }] },
        FabricSetBlock: { type: 'action', label: 'Set Block', params: [{ n: 'block', t: 'text', d: 'minecraft:diamond_block' }, { n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        FabricPlaySound: { type: 'action', label: window.Lang ? window.Lang.t('vb.PlaySound') : 'Play Sound', params: [{ n: 'ses', t: 'text', d: 'minecraft:entity.experience_orb.pickup' }] },

        // Kontrol
        FabricIf: { type: 'control', label: 'Condition', params: [] },
        FabricLoop: { type: 'control', label: 'Loop', params: [{ n: 'kez', t: 'number', d: '10' }] },
        FabricSchedule: { type: 'control', label: 'Schedule', params: [{ n: 'tick', t: 'number', d: '20' }] },
    },

    // ── FORGE MOD ────────────────────────────────────────────
    forge: {
        ForgePlayerLogin: { type: 'event', label: 'Player Join', sub: 'PlayerEvent.PlayerLoggedInEvent', params: [] },
        ForgePlayerLogout: { type: 'event', label: 'Player Quit', sub: 'PlayerEvent.PlayerLoggedOutEvent', params: [] },
        ForgeServerStart: { type: 'event', label: 'Server Start', sub: 'ServerStartedEvent', params: [] },
        ForgeBreak: { type: 'event', label: 'Block Break', sub: 'BlockEvent.BreakEvent', params: [] },
        ForgePlace: { type: 'event', label: 'Block Place', sub: 'BlockEvent.EntityPlaceEvent', params: [] },
        ForgeLivingDamage: { type: 'event', label: 'Damage', sub: 'LivingDamageEvent', params: [] },
        ForgeEntityJoin: { type: 'event', label: 'Entity Join World', sub: 'EntityJoinLevelEvent', params: [] },

        ForgeIsOp: { type: 'condition', label: 'Op Check', params: [] },
        ForgeHasCapability: { type: 'condition', label: 'Has Capability?', params: [{ n: 'cap', t: 'text', d: 'MY_CAP' }] },

        ForgeSendMsg: { type: 'action', label: window.Lang ? window.Lang.t('vb.SendMessage') : 'Send Message', params: [{ n: 'mesaj', t: 'text', d: 'Merhaba!' }] },
        ForgeGiveItem: { type: 'action', label: window.Lang ? window.Lang.t('vb.GiveItem') : 'Give Item', params: [{ n: 'item', t: 'text', d: 'minecraft:diamond' }, { n: 'adet', t: 'number', d: '1' }] },
        ForgeTeleport: { type: 'action', label: window.Lang ? window.Lang.t('vb.Teleport') : 'Teleport', params: [{ n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },
        ForgeCancelEvent: { type: 'action', label: 'Cancel Event', params: [] },
        ForgeSetBlock: { type: 'action', label: 'Set Block', params: [{ n: 'block', t: 'text', d: 'minecraft:stone' }, { n: 'x', t: 'number', d: '0' }, { n: 'y', t: 'number', d: '64' }, { n: 'z', t: 'number', d: '0' }] },

        ForgeIf: { type: 'control', label: 'Condition', params: [] },
        ForgeLoop: { type: 'control', label: 'Loop', params: [{ n: 'kez', t: 'number', d: '10' }] },
        ForgeSchedule: { type: 'control', label: 'Schedule (Tick)', params: [{ n: 'tick', t: 'number', d: '20' }] },
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

        // GUI
        SkGUIOpen: { type: 'event', label: 'on inventory open', sub: 'on inventory open', params: [] },
        SkGUISend: { type: 'action', label: 'open inventory', params: [{ n: 'baslik', t: 'text', d: 'Shop' }, { n: 'satir', t: 'number', d: '3' }] },

        // Zamanlayıcı
        SkWaitDelay: { type: 'control', label: 'wait (delay)', params: [{ n: 'sure', t: 'text', d: '5 seconds' }] },
        SkScheduleRepeat: { type: 'control', label: 'every X seconds', params: [{ n: 'aralik', t: 'text', d: '1 minute' }] },

        // Değişken
        SkVarSet: { type: 'action', label: 'set variable', params: [{ n: 'degisken', t: 'text', d: '{coins.%player%}' }, { n: 'deger', t: 'text', d: '0' }] },
        SkVarGet: { type: 'action', label: 'get variable', params: [{ n: 'degisken', t: 'text', d: '{coins.%player%}' }] },
        SkVarAdd: { type: 'action', label: 'add to variable', params: [{ n: 'miktar', t: 'number', d: '10' }, { n: 'degisken', t: 'text', d: '{coins.%player%}' }] },

        // Ekonomi
        SkVaultBalance: { type: 'action', label: 'vault balance', params: [{ n: 'hedef', t: 'text', d: 'player' }] },
        SkVaultGive: { type: 'action', label: 'vault give money', params: [{ n: 'miktar', t: 'number', d: '100' }] },
        SkVaultTake: { type: 'action', label: 'vault take money', params: [{ n: 'miktar', t: 'number', d: '100' }] },
    },
};

// ═══════════════════════════════════════════════════════════
// Hazır Şablonlar
// ═══════════════════════════════════════════════════════════

const VB_TEMPLATES = [
    {
        id: 'welcome_msg',
        name: '🎉 Welcome Message',
        desc: 'Show custom message when player joins',
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
        name: '🏠 /spawn Command',
        desc: 'Teleport the player to spawn when they type /spawn',
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
        name: '🛡️ Anti-Item Drop',
        desc: 'Prevent item drop on player death',
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
        name: '⚡ Op Command',
        desc: 'Custom command only op players can execute',
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
        name: '🎁 Join Reward',
        desc: 'Give diamond when player joins the server',
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
        name: '🧵 Fabric: Player Join',
        desc: 'Send message on player join with Fabric mod',
        mode: 'fabric',
        nodes: [
            { blockId: 'FabricPlayerJoin', x: 80, y: 120 },
            { blockId: 'FabricSendMsg', x: 320, y: 120, params: { mesaj: 'Hoş geldin!' } },
        ],
        connections: [{ from: 0, to: 1 }],
    },
    {
        id: 'skript_welcome',
        name: '📜 Skript: Welcome',
        desc: 'Show message and title to joining player with Skript',
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
        name: '📜 Skript: /spawn Command',
        desc: 'Create /spawn command with Skript',
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
    {
        id: 'plugin_welcome_kit',
        name: '📦 Plugin Welcome Kit',
        desc: 'Welcome message, starter item and sound on first join flow',
        mode: 'plugin',
        nodes: [
            { blockId: 'PlayerJoin', x: 80, y: 120 },
            { blockId: 'SendMessage', x: 320, y: 80, params: { mesaj: '&aWelcome! Enjoy your starter kit.' } },
            { blockId: 'GiveItem', x: 320, y: 180, params: { material: 'BREAD', adet: '8' } },
            { blockId: 'PlaySound', x: 560, y: 120, params: { ses: 'ENTITY_PLAYER_LEVELUP' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
            { from: 0, to: 3 },
        ],
    },
    {
        id: 'plugin_home_command',
        name: '🏠 Plugin Home Command',
        desc: 'Simple /home teleport command with confirmation message',
        mode: 'plugin',
        nodes: [
            { blockId: 'PlayerCommand', x: 80, y: 120, params: { command: '/home' } },
            { blockId: 'CommandEquals', x: 320, y: 80, params: { cmd: '/home' } },
            { blockId: 'Teleport', x: 560, y: 80, params: { x: '100', y: '64', z: '100' } },
            { blockId: 'SendMessage', x: 560, y: 180, params: { mesaj: '&aTeleported to home.' } },
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
        id: 'plugin_auto_broadcast',
        name: '📢 Plugin Auto Broadcast',
        desc: 'Repeating server tips broadcast',
        mode: 'plugin',
        nodes: [
            { blockId: 'ServerLoad', x: 80, y: 120 },
            { blockId: 'RepeatTask', x: 320, y: 120, params: { baslangic: '20', aralik: '1200' } },
            { blockId: 'Broadcast', x: 560, y: 120, params: { mesaj: '&eTip: Use /spawn to go back to center.' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
        ],
    },
    {
        id: 'plugin_death_penalty',
        name: '💀 Plugin Death Penalty',
        desc: 'On death, warn player and reset health after a short delay',
        mode: 'plugin',
        nodes: [
            { blockId: 'PlayerDeath', x: 80, y: 120 },
            { blockId: 'SendMessage', x: 320, y: 80, params: { mesaj: '&cYou died and lost your streak!' } },
            { blockId: 'Delay', x: 320, y: 180, params: { tick: '40' } },
            { blockId: 'SetHealth', x: 560, y: 180, params: { can: '20' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
            { from: 2, to: 3 },
        ],
    },
    {
        id: 'fabric_join_reward',
        name: '🧵 Fabric Join Reward',
        desc: 'Send message and reward item on Fabric player join',
        mode: 'fabric',
        nodes: [
            { blockId: 'FabricPlayerJoin', x: 80, y: 120 },
            { blockId: 'FabricSendMsg', x: 320, y: 80, params: { mesaj: 'Welcome to the Fabric server!' } },
            { blockId: 'FabricGiveItem', x: 320, y: 180, params: { item: 'minecraft:bread', adet: '4' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
        ],
    },
    {
        id: 'fabric_break_alert',
        name: '🧵 Fabric Break Alert',
        desc: 'Alert all players when a block is broken',
        mode: 'fabric',
        nodes: [
            { blockId: 'FabricBlockBreak', x: 80, y: 120 },
            { blockId: 'FabricBroadcast', x: 320, y: 120, params: { mesaj: 'A block was broken nearby.' } },
        ],
        connections: [{ from: 0, to: 1 }],
    },
    {
        id: 'fabric_scheduled_tip',
        name: '🧵 Fabric Scheduled Tip',
        desc: 'Start periodic tip broadcast when server starts',
        mode: 'fabric',
        nodes: [
            { blockId: 'FabricServerStart', x: 80, y: 120 },
            { blockId: 'FabricSchedule', x: 320, y: 120, params: { tick: '1200' } },
            { blockId: 'FabricBroadcast', x: 560, y: 120, params: { mesaj: 'Tip: Keep your spawn area protected.' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
        ],
    },
    {
        id: 'forge_login_message',
        name: '🔨 Forge Login Message',
        desc: 'Send a custom message when Forge player logs in',
        mode: 'forge',
        nodes: [
            { blockId: 'ForgePlayerLogin', x: 80, y: 120 },
            { blockId: 'ForgeSendMsg', x: 320, y: 120, params: { mesaj: 'Forge systems online. Welcome!' } },
        ],
        connections: [{ from: 0, to: 1 }],
    },
    {
        id: 'forge_guardian_spawn',
        name: '🔨 Forge Guardian Spawn',
        desc: 'When block breaks, cancel and warn with guardian zone message',
        mode: 'forge',
        nodes: [
            { blockId: 'ForgeBreak', x: 80, y: 120 },
            { blockId: 'ForgeCancelEvent', x: 320, y: 80, params: {} },
            { blockId: 'ForgeSendMsg', x: 320, y: 180, params: { mesaj: 'This zone is guarded. Breaking denied.' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
        ],
    },
    {
        id: 'skript_warp_command',
        name: '📜 Skript Warp Command',
        desc: 'Create a /warp command that teleports player and confirms',
        mode: 'skript',
        nodes: [
            { blockId: 'SkCommand', x: 80, y: 120, params: { komut: '/warp' } },
            { blockId: 'SkTeleport', x: 320, y: 80, params: { x: '200', y: '70', z: '200' } },
            { blockId: 'SkSendMsg', x: 320, y: 200, params: { mesaj: '&aWarped to destination.' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
        ],
    },
    {
        id: 'skript_daily_reward',
        name: '📜 Skript Daily Reward',
        desc: 'Timed reward reminder and variable increment',
        mode: 'skript',
        nodes: [
            { blockId: 'SkScheduleRepeat', x: 80, y: 120, params: { aralik: '1 day' } },
            { blockId: 'SkBroadcast', x: 320, y: 80, params: { mesaj: '&eDaily reward is now available!' } },
            { blockId: 'SkVarAdd', x: 320, y: 190, params: { miktar: '1', degisken: '{dailyRewards}' } },
        ],
        connections: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
        ],
    },
    {
        id: 'skript_chat_filter',
        name: '📜 Skript Chat Filter',
        desc: 'Cancel chat and notify player with simple moderation flow',
        mode: 'skript',
        nodes: [
            { blockId: 'SkChat', x: 80, y: 120 },
            { blockId: 'SkCancel', x: 320, y: 80, params: {} },
            { blockId: 'SkSendMsg', x: 320, y: 180, params: { mesaj: '&cPlease avoid forbidden words in chat.' } },
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

const VB_PARAM_LABEL_KEYS = {
    command: 'ui.vb.param.command',
    cmd: 'ui.vb.param.cmd',
    komut: 'ui.vb.param.command',
    message: 'ui.vb.param.message',
    mesaj: 'ui.vb.param.mesaj',
    item: 'ui.vb.param.item',
    material: 'ui.vb.param.material',
    amount: 'ui.vb.param.amount',
    adet: 'ui.vb.param.adet',
    count: 'ui.vb.param.count',
    permission: 'ui.vb.param.permission',
    perm: 'ui.vb.param.permission',
    world: 'ui.vb.param.world',
    reason: 'ui.vb.param.reason',
    sebep: 'ui.vb.param.reason',
    sound: 'ui.vb.param.sound',
    ses: 'ui.vb.param.ses',
    mode: 'ui.vb.param.mode',
    mod: 'ui.vb.param.mode',
    x: 'ui.vb.param.x',
    y: 'ui.vb.param.y',
    z: 'ui.vb.param.z',
    key: 'ui.vb.param.key',
    value: 'ui.vb.param.value',
    deger: 'ui.vb.param.value',
    name: 'ui.vb.param.name',
    variable: 'ui.vb.param.variable',
    degisken: 'ui.vb.param.variable',
    delay: 'ui.vb.param.delay',
    tick: 'ui.vb.param.tick',
    slot: 'ui.vb.param.slot',
    inventory: 'ui.vb.param.inventory',
    envanter: 'ui.vb.param.inventory',
    entity: 'ui.vb.param.entity',
    entitytype: 'ui.vb.param.type',
    type: 'ui.vb.param.type',
    start: 'ui.vb.param.start',
    baslangic: 'ui.vb.param.start',
    interval: 'ui.vb.param.interval',
    aralik: 'ui.vb.param.interval',
    title: 'ui.vb.param.title',
    baslik: 'ui.vb.param.title',
    subtitle: 'ui.vb.param.subtitle',
    alt: 'ui.vb.param.subtitle',
};

function vbTr(key, fallback, params) {
    if (window.Lang && typeof window.Lang.t === 'function') {
        return window.Lang.t(key, params || {});
    }
    if (!fallback) return key;
    if (!params) return fallback;
    return Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), fallback);
}

function normalizeParamKey(name) {
    const raw = String(name || '').trim();
    const plain = raw.toLowerCase()
        .replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i')
        .replace(/[ç]/g, 'c')
        .replace(/[ğ]/g, 'g')
        .replace(/[ö]/g, 'o')
        .replace(/[ü]/g, 'u');
    return plain.replace(/[^a-z0-9]/g, '');
}

function humanizeParamName(name) {
    const text = String(name || '');
    if (!text) return '';
    const spaced = text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_\-]+/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function getParamLabel(paramName) {
    const normalized = normalizeParamKey(paramName);
    const key = VB_PARAM_LABEL_KEYS[normalized];
    if (key) {
        return vbTr(key, humanizeParamName(paramName));
    }
    return humanizeParamName(paramName);
}

function refreshNodesLanguage() {
    const defs = getCurrentBlockDefs();
    vbNodes.forEach((node) => {
        const def = defs[node.blockId];
        if (!def) return;
        node.label = def.label;
        const el = document.getElementById('vb-node-' + node.id);
        if (!el) return;
        const title = el.querySelector('.vb-node-header > span');
        if (title) title.textContent = node.label;
        el.querySelectorAll('.vb-param-label').forEach((labelEl) => {
            const name = labelEl.dataset.paramName || '';
            labelEl.textContent = getParamLabel(name);
        });
        el.querySelectorAll('input[data-param-name], select[data-param-name]').forEach((inputEl) => {
            const name = inputEl.dataset.paramName || '';
            if (inputEl.tagName === 'INPUT') inputEl.placeholder = getParamLabel(name);
        });
    });
}

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

    area.style.cursor = 'grab';

    // Empty canvas drag / middle mouse / Alt+drag to pan
    area.addEventListener('mousedown', (e) => {
        if (e.target === area || e.target === canvas) {
            selectNode(null);
            const isPanGesture = e.button === 1 || e.button === 0 || (e.button === 0 && e.altKey);
            if (isPanGesture) {
                vbPanning = true;
                vbPanStart = { x: e.clientX - vbViewOffset.x, y: e.clientY - vbViewOffset.y };
                area.style.cursor = 'grabbing';
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
            if (typeof showNotification === 'function') showNotification(window.Lang ? window.Lang.t('msg.blockDeleted') : 'Connection deleted', 'success');
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
            refreshNodesLanguage();
        });
    }

    // Templates button
    document.getElementById('btn-vb-templates')?.addEventListener('click', showTemplatesModal);
    document.getElementById('btn-vb-templates')?.addEventListener('mousedown', (e) => e.stopPropagation());
    document.getElementById('btn-vb-load-template-hint')?.addEventListener('click', showTemplatesModal);
    document.getElementById('btn-vb-load-template-hint')?.addEventListener('mousedown', (e) => e.stopPropagation());
    document.getElementById('vb-templates-close')?.addEventListener('click', hideTemplatesModal);

    if (!document.body.dataset.vbLangBound) {
        document.body.dataset.vbLangBound = '1';
        document.addEventListener('lang:changed', () => {
            refreshNodesLanguage();
            buildTemplateGrid();
        });
    }

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
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 80;
        canvas.style.cssText = 'display:block;margin-bottom:6px;border-radius:4px;background:rgba(0,0,0,0.2);';
        card.appendChild(canvas);
        const nameEl = document.createElement('div');
        nameEl.className = 'vb-tpl-name';
        nameEl.textContent = tpl.name;
        const descEl = document.createElement('div');
        descEl.className = 'vb-tpl-desc';
        descEl.textContent = tpl.desc;
        const modeEl = document.createElement('div');
        modeEl.className = 'vb-tpl-mode';
        modeEl.textContent = tpl.category ? `${tpl.mode} · ${tpl.category}` : tpl.mode;
        card.appendChild(nameEl);
        card.appendChild(descEl);
        card.appendChild(modeEl);
        card.addEventListener('click', () => {
            loadTemplate(tpl);
            hideTemplatesModal();
        });
        grid.appendChild(card);
        renderMiniPreview(canvas, tpl);
    }
}

function renderMiniPreview(canvas, tpl) {
    const ctx = canvas.getContext('2d');
    const typeColors = { event: '#2ecc71', condition: '#f1c40f', action: '#3498db', control: '#9b59b6' };
    const nodes = tpl.nodes || [];
    if (nodes.length === 0) return;

    // Fit all nodes into canvas
    const xs = nodes.map(n => n.x || 0);
    const ys = nodes.map(n => n.y || 0);
    const minX = Math.min(...xs) - 10;
    const minY = Math.min(...ys) - 10;
    const maxX = Math.max(...xs) + 100;
    const maxY = Math.max(...ys) + 30;
    const scaleX = canvas.width / (maxX - minX);
    const scaleY = canvas.height / (maxY - minY);
    const scale = Math.min(scaleX, scaleY, 1);

    const tx = (x) => (x - minX) * scale;
    const ty = (y) => (y - minY) * scale;
    const nw = 60 * scale;
    const nh = 22 * scale;

    // Draw connections
    ctx.strokeStyle = 'rgba(46,204,113,0.5)';
    ctx.lineWidth = 1.5;
    (tpl.connections || []).forEach(c => {
        const fi = typeof c.from === 'number' ? c.from : c.fromIndex;
        const ti = typeof c.to === 'number' ? c.to : c.toIndex;
        const fn = nodes[fi];
        const tn = nodes[ti];
        if (!fn || !tn) return;
        const fx = tx(fn.x || 0) + nw;
        const fy = ty(fn.y || 0) + nh / 2;
        const ttx = tx(tn.x || 0);
        const tty = ty(tn.y || 0) + nh / 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.bezierCurveTo(fx + 15 * scale, fy, ttx - 15 * scale, tty, ttx, tty);
        ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(n => {
        const def = Object.values(ALL_BLOCK_DEFS).reduce((acc, mode) => acc || mode[n.blockId], null);
        const type = def ? def.type : 'action';
        const color = typeColors[type] || '#888';
        const x = tx(n.x || 0);
        const y = ty(n.y || 0);
        ctx.fillStyle = color + '33';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, nw, nh, 3 * scale);
        } else {
            ctx.rect(x, y, nw, nh);
        }
        ctx.fill();
        ctx.stroke();
    });
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
    if (typeof showNotification === 'function') showNotification(window.Lang ? window.Lang.t('msg.blueprintLoaded', { name: tpl.name }) : 'Template loaded!', 'success');
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
            if (inp.tagName === 'INPUT') inp.placeholder = getParamLabel(name);
        }
    });
    el.querySelectorAll('.vb-param-label').forEach((labelEl) => {
        const name = labelEl.dataset.paramName || '';
        labelEl.textContent = getParamLabel(name);
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

    // Değişken blokları için turuncu stil
    if (def.sub === 'variable') {
        el.style.borderColor = '#e67e22';
        el.style.boxShadow = '0 0 8px rgba(230, 126, 34, 0.3)';
        header.classList.add('variable');
    }

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
    infoBtn.title = 'Ask AI Assistant';
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
    delBtn.title = 'Delete Block';
    delBtn.style.cssText = 'cursor:pointer;opacity:0.7;font-size:12px;margin-left:8px;padding:0 2px;line-height:1;';
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteNode(node.id); });
    header.appendChild(delBtn);

    el.appendChild(header);

    if ((def.params || []).length > 0) {
        const body = document.createElement('div');
        body.className = 'vb-node-body';
        for (const p of def.params) {
            const lbl = document.createElement('div');
            lbl.className = 'vb-param-label';
            lbl.dataset.paramName = p.n;
            lbl.style.cssText = 'font-size:10px;color:#8b949e;margin-top:4px;';
            lbl.textContent = getParamLabel(p.n);
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
                inp.placeholder = getParamLabel(p.n);
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
        inPort.title = 'Input — drag output port of another block to connect';
        el.appendChild(inPort);
    }

    const outPort = document.createElement('div');
    outPort.className = 'vb-node-port out';
    outPort.dataset.nodeId = node.id;
    outPort.dataset.portType = 'out';
    outPort.title = 'Output — drag to connect';
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

function deleteSelectedNode() {
    if (vbSelectedNode) deleteNode(vbSelectedNode);
}

// ═══════════════════════════════════════════════════════════
// Mouse Events
// ═══════════════════════════════════════════════════════════

document.addEventListener('mousemove', (e) => {
    if (vbPanning) {
        const area = document.getElementById('visual-builder-canvas-wrapper');
        if (area) area.style.cursor = 'grabbing';
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
    const area = document.getElementById('visual-builder-canvas-wrapper');
    vbPanning = false;
    if (area) area.style.cursor = 'grab';

    if (vbConnecting) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.classList.contains('vb-node-port') && target.dataset.portType === 'in') {
            const toId = parseInt(target.dataset.nodeId);
            if (toId !== vbConnecting.fromId) {
                const fromNode = vbNodes.find(n => n.id === vbConnecting.fromId);
                const toNode = vbNodes.find(n => n.id === toId);
                const validFrom = {
                    event: ['condition', 'action', 'control'],
                    condition: ['action', 'control'],
                    action: ['action', 'control'],
                    control: ['action', 'condition'],
                };
                if (fromNode && toNode && !validFrom[fromNode.type]?.includes(toNode.type)) {
                    if (typeof showNotification === 'function') {
                        showNotification(fromNode.type + ' → ' + toNode.type + ' bağlantısı geçersiz!', 'error');
                    }
                } else {
                    const existIdx = vbConnections.findIndex(c => c.to === toId);
                    if (existIdx >= 0) vbConnections.splice(existIdx, 1);
                    vbConnections.push({ from: vbConnecting.fromId, to: toId });
                    drawConnections();
                    if (window.aiManager) window.aiManager.triggerBalanceCheck();
                }
            }
        }
        vbConnecting = null;
        drawConnections();
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

    // Draw active dragging connection
    if (typeof vbConnecting !== 'undefined' && vbConnecting && vbConnecting.currentX !== undefined && vbConnecting.currentY !== undefined) {
        const from = getPortCenter(vbConnecting.fromId, 'out');
        if (from) {
            const to = { x: vbConnecting.currentX, y: vbConnecting.currentY };
            const dx = Math.abs(to.x - from.x);
            const cpx = dx * 0.5;
            vbCtx.beginPath();
            vbCtx.moveTo(from.x, from.y);
            vbCtx.bezierCurveTo(from.x + cpx, from.y, to.x - cpx, to.y, to.x, to.y);
            vbCtx.strokeStyle = 'rgba(46, 204, 113, 0.7)';
            vbCtx.lineWidth = 2.5;
            vbCtx.setLineDash([8, 8]);
            vbCtx.stroke();
            vbCtx.setLineDash([]);
        }
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
        'event': { title: '🟢 Events', color: '#2ecc71', blocks: [] },
        'condition': { title: '🟡 Conditions', color: '#f1c40f', blocks: [] },
        'action': { title: '🔵 Actions', color: '#3498db', blocks: [] },
        'control': { title: '🟣 Control', color: '#9b59b6', blocks: [] },
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
    menuContent += `<div class="vb-cm-action" id="cm-btn-templates">📋 Templates</div>`;
    menuContent += `<div class="vb-cm-action" id="cm-btn-generate">⚡ Generate Code</div>`;
    menuContent += `<div class="vb-cm-action danger" id="cm-btn-clear">🗑️ Clear</div>`;

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

function vbGenerateCode(options) {
    const returnOnly = options && options.returnOnly === true;
    let code = '';
    switch (vbCurrentMode) {
        case 'plugin': code = generatePluginCode(); break;
        case 'fabric': code = generateFabricCode(); break;
        case 'forge': code = generateForgeCode(); break;
        case 'skript': code = generateSkriptCode(); break;
        default: code = generatePluginCode();
    }

    // returnOnly=true ise sadece kodu döndür, tab açma
    if (returnOnly) return code;

    const fileName = vbCurrentMode === 'skript' ? 'generated.sk' : 'GeneratedPlugin.java';
    const virtualPath = 'generated://' + fileName;

    // Sekmeyi app.js üzerinden aç (openFiles global map)
    if (typeof openFiles !== 'undefined' && typeof addTab === 'function' && typeof activateTab === 'function') {
        openFiles.set(virtualPath, { content: code, modified: false, virtual: true, generated: true });
        const existing = document.querySelector(`.tab[data-tab="${CSS.escape(virtualPath)}"]`);
        if (existing) existing.remove();
        addTab(virtualPath, fileName);
        activateTab(virtualPath);
        if (typeof showNotification === 'function') showNotification(window.Lang ? window.Lang.t('msg.codeGenerated') : '⚡ Kod üretildi!', 'success');
    } else if (window.monacoEditor && window.monaco) {
        // Fallback: Doğrudan Monaco'ya yaz
        const lang = vbCurrentMode === 'skript' ? 'plaintext' : 'java';
        const model = window.monaco.editor.createModel(code, lang);
        window.monacoEditor.setModel(model);
        document.getElementById('welcome-screen').classList.remove('active');
        document.querySelectorAll('.editor-container').forEach(ec => ec.style.display = 'none');
        document.getElementById('editor-container').style.display = 'block';
        if (typeof showNotification === 'function') showNotification('⚡ Kod üretildi!', 'success');
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
    code += '    private final java.util.HashMap<String, Object> playerData = new java.util.HashMap<>();\n\n';
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
        // GUI
        case 'CreateGUI': return indent + 'Inventory inv = Bukkit.createInventory(null, ' + (parseInt(p.satir || 3) * 9) + ', "' + (p.baslik || 'Shop') + '");\n';
        case 'SetGUIItem': return indent + '{\n' + indent + '    ItemStack guiItem = new ItemStack(Material.' + (p.material || 'DIAMOND') + ');\n' + indent + '    ItemMeta guiMeta = guiItem.getItemMeta();\n' + indent + '    if (guiMeta != null) { guiMeta.setDisplayName("' + (p.isim || 'Eşya') + '"); guiItem.setItemMeta(guiMeta); }\n' + indent + '    inv.setItem(' + (p.slot || 0) + ', guiItem);\n' + indent + '}\n';
        case 'OpenGUI': return indent + 'event.getPlayer().openInventory(' + (p.envanter || 'inv') + ');\n';
        case 'GUIClickEvent': return indent + '// GUI Tıklama kontrolü — if (event.getView().getTitle().equals("' + (p.envanter || 'Shop') + '"))\n';
        // Zamanlayıcı
        case 'RunAfterDelay': return indent + 'getServer().getScheduler().runTaskLater(this, () -> {\n' + indent + '    // gecikmeli işlem\n' + indent + '}, ' + (p.tick || 20) + ');\n';
        case 'RepeatTask': return indent + 'getServer().getScheduler().runTaskTimer(this, () -> {\n' + indent + '    // tekrarlayan işlem\n' + indent + '}, ' + (p.baslangic || 0) + ', ' + (p.aralik || 20) + ');\n';
        case 'CancelTask': return indent + '// BukkitTask ' + (p.gorevAdi || 'task') + ' = ...; ' + (p.gorevAdi || 'task') + '.cancel();\n';
        // Veri Depolama
        case 'ConfigGet': return indent + 'Object ' + (p.key || 'key').replace(/[.\-]/g, '_') + '_val = getConfig().get("' + (p.key || 'key') + '", ' + (p.varsayilan || '0') + ');\n';
        case 'ConfigSet': return indent + 'getConfig().set("' + (p.key || 'key') + '", ' + (p.deger || '"deger"') + ');\nsaveConfig();\n';
        case 'PDCGet': return indent + '{\n' + indent + '    org.bukkit.NamespacedKey pdcKey = new org.bukkit.NamespacedKey(this, "' + (p.key || 'coins') + '");\n' + indent + '    int pdcVal = event.getPlayer().getPersistentDataContainer().getOrDefault(pdcKey, org.bukkit.persistence.PersistentDataType.INTEGER, 0);\n' + indent + '}\n';
        case 'PDCSet': return indent + '{\n' + indent + '    org.bukkit.NamespacedKey pdcKey = new org.bukkit.NamespacedKey(this, "' + (p.key || 'coins') + '");\n' + indent + '    event.getPlayer().getPersistentDataContainer().set(pdcKey, org.bukkit.persistence.PersistentDataType.INTEGER, ' + (p.deger || '0') + ');\n' + indent + '}\n';
        // Ekonomi / Vault
        case 'GetBalance': return indent + '// double balance = economy.getBalance(event.getPlayer());\n';
        case 'GiveMoney': return indent + '// economy.depositPlayer(event.getPlayer(), ' + (p.miktar || 100) + ');\n';
        case 'TakeMoney': return indent + '// economy.withdrawPlayer(event.getPlayer(), ' + (p.miktar || 100) + ');\n';
        // Değişkenler
        case 'SetVariable': return indent + 'playerData.put("' + (p.name || 'var') + '_" + event.getPlayer().getName(), "' + (p.value || '0') + '");\n';
        case 'GetVariable': return indent + 'Object ' + (p.name || 'var').replace(/[^a-zA-Z0-9_]/g, '_') + '_val = playerData.getOrDefault("' + (p.name || 'var') + '_" + event.getPlayer().getName(), "0");\n';
        case 'MathOperation': {
            const _varN = (p.var || 'var').replace(/[^a-zA-Z0-9_]/g, '_');
            const _opStr = p.op === 'sub' ? '-' : p.op === 'mul' ? '*' : p.op === 'div' ? '/' : '+';
            return indent + '{\n'
                + indent + '    double ' + _varN + '_cur = Double.parseDouble(String.valueOf(playerData.getOrDefault("' + (p.var || 'var') + '_" + event.getPlayer().getName(), "0")));\n'
                + indent + '    playerData.put("' + (p.var || 'var') + '_" + event.getPlayer().getName(), String.valueOf(' + _varN + '_cur ' + _opStr + ' ' + (p.amount || '10') + '));\n'
                + indent + '}\n';
        }
        case 'CompareVariable': return indent + 'if (Double.parseDouble(String.valueOf(playerData.getOrDefault("' + (p.var || 'var') + '_" + event.getPlayer().getName(), "0"))) ' + (p.op || '>=') + ' Double.parseDouble("' + (p.value || '0') + '")) {\n';
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
        // GUI
        case 'SkGUIOpen': return indent + '# on inventory open kontrolü\n';
        case 'SkGUISend': return indent + 'open chest with ' + (p.satir || 3) + ' rows named "' + (p.baslik || 'Shop') + '" to player\n';
        // Zamanlayıcı
        case 'SkWaitDelay': return indent + 'wait ' + (p.sure || '5 seconds') + '\n';
        case 'SkScheduleRepeat': return indent + 'every ' + (p.aralik || '1 minute') + ':\n';
        // Değişken
        case 'SkVarSet': return indent + 'set ' + (p.degisken || '{var}') + ' to ' + (p.deger || '0') + '\n';
        case 'SkVarGet': return indent + '# get ' + (p.degisken || '{var}') + '\n';
        case 'SkVarAdd': return indent + 'add ' + (p.miktar || 10) + ' to ' + (p.degisken || '{coins.%player%}') + '\n';
        // Ekonomi
        case 'SkVaultBalance': return indent + '# set {_bal} to vault balance of ' + (p.hedef || 'player') + '\n';
        case 'SkVaultGive': return indent + '# add ' + (p.miktar || 100) + ' to vault balance of player\n';
        case 'SkVaultTake': return indent + '# remove ' + (p.miktar || 100) + ' from vault balance of player\n';
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

// ═══════════════════════════════════════════════════════════
// Blueprint Kaydet / Yükle
// ═══════════════════════════════════════════════════════════

async function vbSaveBlueprint() {
    if (vbNodes.length === 0) {
        if (typeof showNotification === 'function') showNotification('Kaydedilecek blok yok!', 'error');
        return;
    }
    const blueprint = {
        version: '1',
        mode: vbCurrentMode,
        nodes: vbNodes.map(n => ({ id: n.id, blockId: n.blockId, x: n.x, y: n.y, params: { ...n.params } })),
        connections: vbConnections.map(c => ({ from: c.from, to: c.to })),
    };
    const filePath = await ipcRenderer.invoke('dialog:saveFile', {
        title: 'Blueprint Kaydet',
        defaultPath: 'blueprint.vbp',
        filters: [{ name: 'VB Blueprint', extensions: ['vbp'] }, { name: 'Tüm Dosyalar', extensions: ['*'] }],
    });
    if (!filePath) return;
    const ok = await ipcRenderer.invoke('fs:writeFile', filePath, JSON.stringify(blueprint, null, 2));
    if (ok) {
        if (typeof showNotification === 'function') showNotification('💾 Blueprint kaydedildi!', 'success');
    } else {
        if (typeof showNotification === 'function') showNotification('❌ Kaydetme başarısız!', 'error');
    }
}

async function vbLoadBlueprint() {
    const filePath = await ipcRenderer.invoke('dialog:openFile', {
        title: 'Blueprint Yükle',
        filters: [{ name: 'VB Blueprint', extensions: ['vbp'] }, { name: 'Tüm Dosyalar', extensions: ['*'] }],
    });
    if (!filePath) return;
    const content = await ipcRenderer.invoke('fs:readFile', filePath);
    if (!content) {
        if (typeof showNotification === 'function') showNotification('❌ Dosya okunamadı!', 'error');
        return;
    }
    try {
        let blueprint = JSON.parse(content);
        if (window.CraftIDEVB && typeof window.CraftIDEVB.migrateBlueprint === 'function') {
            blueprint = window.CraftIDEVB.migrateBlueprint(blueprint);
        }
        // Canvas temizle
        vbNodes = [];
        vbConnections = [];
        const area = document.getElementById('visual-builder-canvas-wrapper');
        if (area) area.querySelectorAll('.vb-node').forEach(n => n.remove());

        // Modu değiştir
        if (blueprint.mode) {
            vbCurrentMode = blueprint.mode;
            const sel = document.getElementById('vb-mode-select');
            if (sel) sel.value = vbCurrentMode;
            rebuildContextMenu();
        }

        // ID haritası: kaydedilen id → yeni id
        const idMap = {};

        // Nodları render et (createNode yerine doğrudan renderNode)
        let maxId = 0;
        for (const n of (blueprint.nodes || [])) {
            const def = (ALL_BLOCK_DEFS[vbCurrentMode] || {})[n.blockId];
            if (!def) continue;
            const newId = n.id || (++maxId);
            if (newId > maxId) maxId = newId;
            const node = {
                id: newId,
                blockId: n.blockId,
                type: def.type,
                label: def.label,
                x: n.x || 100,
                y: n.y || 100,
                params: {},
            };
            (def.params || []).forEach(p => { node.params[p.n] = p.d; });
            if (n.params) Object.assign(node.params, n.params);
            vbNodes.push(node);
            idMap[n.id] = newId;
            renderNode(node);
        }
        vbNextId = maxId + 1;

        // Bağlantıları kur
        for (const c of (blueprint.connections || [])) {
            const fromId = idMap[c.from];
            const toId = idMap[c.to];
            if (fromId && toId) {
                vbConnections.push({ from: fromId, to: toId });
            }
        }
        drawConnections();

        const hint = document.getElementById('vb-empty-hint');
        if (hint) hint.style.display = vbNodes.length > 0 ? 'none' : '';

        if (typeof showNotification === 'function') showNotification('📂 Blueprint yüklendi!', 'success');
    } catch (e) {
        if (typeof showNotification === 'function') showNotification('❌ Blueprint formatı geçersiz: ' + e.message, 'error');
    }
}

document.getElementById('btn-vb-save')?.addEventListener('click', vbSaveBlueprint);
document.getElementById('btn-vb-load')?.addEventListener('click', vbLoadBlueprint);
document.getElementById('btn-vb-generate')?.addEventListener('click', vbGenerateCode);
document.getElementById('btn-vb-clear')?.addEventListener('click', vbClearCanvas);

// Derle & Test Et butonu
document.getElementById('btn-vb-deploy')?.addEventListener('click', () => {
    if (typeof deployToServer === 'function') {
        deployToServer();
    } else {
        if (typeof showNotification === 'function') showNotification('deployToServer fonksiyonu bulunamadı!', 'error');
    }
});

// ═══════════════════════════════════════════════════════════
// Live Event Debug
// ═══════════════════════════════════════════════════════════

let vbDebugMode = false;

const vbDebugCheckbox = document.getElementById('vb-debug-mode');
if (vbDebugCheckbox) {
    vbDebugCheckbox.addEventListener('change', () => {
        vbDebugMode = vbDebugCheckbox.checked;
        if (typeof showNotification === 'function') {
            showNotification(vbDebugMode ? '🔍 Debug modu açık — sunucu eventleri VB\'de vurgulanacak' : '🔕 Debug modu kapalı', 'info');
        }
    });
}

// Log satırı → VB blok eşleme tablosu
const LOG_EVENT_MAP = [
    { pattern: /joined the game|PlayerJoinEvent/i,           blockId: 'PlayerJoin' },
    { pattern: /left the game|PlayerQuitEvent/i,             blockId: 'PlayerQuit' },
    { pattern: /BlockBreakEvent/i,                           blockId: 'BlockBreak' },
    { pattern: /BlockPlaceEvent/i,                           blockId: 'BlockPlace' },
    { pattern: /AsyncPlayerChatEvent|chat message/i,         blockId: 'PlayerChat' },
    { pattern: /PlayerDeathEvent|died|was slain|fell from/i, blockId: 'PlayerDeath' },
    { pattern: /EntityDamageByEntityEvent/i,                 blockId: 'EntityDamage' },
    { pattern: /PlayerCommandPreprocessEvent/i,              blockId: 'PlayerCommand' },
    { pattern: /PlayerMoveEvent/i,                           blockId: 'PlayerMove' },
    { pattern: /InventoryClickEvent/i,                       blockId: 'InventoryClick' },
    { pattern: /ServerStartedEvent|onEnable/i,               blockId: 'ServerLoad' },
    // Fabric
    { pattern: /ServerPlayConnectionEvents\.JOIN/i,          blockId: 'FabricPlayerJoin' },
    { pattern: /ServerPlayConnectionEvents\.DISCONNECT/i,    blockId: 'FabricPlayerQuit' },
    // Forge
    { pattern: /PlayerLoggedInEvent/i,                       blockId: 'ForgePlayerLogin' },
    { pattern: /PlayerLoggedOutEvent/i,                      blockId: 'ForgePlayerLogout' },
];

function pulseNode(nodeId) {
    const el = document.getElementById('vb-node-' + nodeId);
    if (!el) return;
    el.classList.remove('vb-debug-pulse');
    void el.offsetWidth; // reflow — animasyonu sıfırla
    el.classList.add('vb-debug-pulse');
    setTimeout(() => el.classList.remove('vb-debug-pulse'), 1600);
}

function highlightEventInVB(logLine) {
    if (!vbDebugMode) return;
    for (const mapping of LOG_EVENT_MAP) {
        if (mapping.pattern.test(logLine)) {
            const matchingNodes = vbNodes.filter(n => n.blockId === mapping.blockId);
            matchingNodes.forEach(n => pulseNode(n.id));
        }
    }
}

// highlightEventInVB'yi global yap (app.js'den çağrılabilsin)

function vbExportGraph() {
    return {
        version: '2',
        mode: vbCurrentMode,
        nodes: vbNodes.map((n) => ({
            id: n.id,
            blockId: n.blockId,
            type: n.type,
            label: n.label,
            x: n.x,
            y: n.y,
            params: { ...n.params },
        })),
        connections: vbConnections.map((c) => ({ from: c.from, to: c.to })),
    };
}

function vbMigrateBlueprint(raw) {
    const data = raw && typeof raw === 'object' ? { ...raw } : {};
    const oldMode = String(data.mode || 'plugin').toLowerCase();
    if (oldMode === 'paper' || oldMode === 'spigot' || oldMode === 'bukkit') {
        data.mode = 'plugin';
    } else if (['plugin', 'fabric', 'forge', 'skript'].includes(oldMode)) {
        data.mode = oldMode;
    } else {
        data.mode = 'plugin';
    }
    data.version = data.version || '1';

    const defs = ALL_BLOCK_DEFS[data.mode] || ALL_BLOCK_DEFS.plugin;
    const normalizedNodes = [];
    for (const entry of (Array.isArray(data.nodes) ? data.nodes : [])) {
        if (!entry || typeof entry !== 'object') continue;
        let blockId = entry.blockId;
        if (!blockId && entry.label) {
            const match = Object.entries(defs).find(([, def]) => def.label === entry.label);
            if (match) blockId = match[0];
        }
        if (!blockId || !defs[blockId]) continue;
        normalizedNodes.push({
            id: Number(entry.id) || 0,
            blockId,
            x: Number(entry.x) || 100,
            y: Number(entry.y) || 100,
            params: entry.params && typeof entry.params === 'object' ? { ...entry.params } : {},
        });
    }
    data.nodes = normalizedNodes;

    const validIds = new Set(normalizedNodes.map((n) => n.id).filter((id) => id > 0));
    data.connections = (Array.isArray(data.connections) ? data.connections : [])
        .filter((c) => c && typeof c === 'object')
        .map((c) => ({ from: Number(c.from), to: Number(c.to) }))
        .filter((c) => validIds.has(c.from) && validIds.has(c.to) && c.from !== c.to);

    return data;
}

function vbImportGraph(graph, options) {
    const opts = options || {};
    const migrated = vbMigrateBlueprint(graph || {});
    const mode = migrated.mode || 'plugin';
    if (mode !== vbCurrentMode) {
        vbCurrentMode = mode;
        const sel = document.getElementById('vb-mode-select');
        if (sel) sel.value = vbCurrentMode;
        rebuildContextMenu();
    }

    if (opts.clear !== false) {
        vbNodes = [];
        vbConnections = [];
        const area = document.getElementById('visual-builder-canvas-wrapper');
        if (area) area.querySelectorAll('.vb-node').forEach((n) => n.remove());
    }

    const idMap = {};
    let maxId = vbNextId;
    for (const n of (migrated.nodes || [])) {
        const created = createNode(n.blockId, n.x, n.y);
        if (!created) continue;
        Object.assign(created.params, n.params || {});
        refreshNodeInputs(created);
        idMap[n.id] = created.id;
        if (created.id > maxId) maxId = created.id;
    }
    vbNextId = maxId + 1;

    for (const c of (migrated.connections || [])) {
        const fromId = idMap[c.from];
        const toId = idMap[c.to];
        if (fromId && toId && !vbConnections.some((x) => x.from === fromId && x.to === toId)) {
            vbConnections.push({ from: fromId, to: toId });
        }
    }
    drawConnections();
    const hint = document.getElementById('vb-empty-hint');
    if (hint) hint.style.display = vbNodes.length > 0 ? 'none' : '';
}

function vbSetMode(mode) {
    const normalized = String(mode || '').toLowerCase();
    const allowed = ['plugin', 'fabric', 'forge', 'skript'];
    if (!allowed.includes(normalized)) return false;
    vbCurrentMode = normalized;
    const sel = document.getElementById('vb-mode-select');
    if (sel) {
        sel.value = vbCurrentMode;
        sel.dispatchEvent(new Event('change'));
    } else {
        rebuildContextMenu();
    }
    return true;
}

window.CraftIDEVB = {
    exportGraph: vbExportGraph,
    importGraph: vbImportGraph,
    migrateBlueprint: vbMigrateBlueprint,
    clear: vbClearCanvas,
    createNode,
    drawConnections,
    setMode: vbSetMode,
    getMode: () => vbCurrentMode,
    getNodes: () => vbNodes,
    getConnections: () => vbConnections,
    getDefinitions: () => ALL_BLOCK_DEFS,
    getTemplates: () => [...VB_TEMPLATES],
    showTemplatesModal,
    hideTemplatesModal,
    loadTemplate,
    deleteSelectedNode,
    addTemplates: (templates) => {
        const arr = Array.isArray(templates) ? templates : [];
        let added = 0;
        for (const tpl of arr) {
            if (!tpl || typeof tpl !== 'object') continue;
            const id = String(tpl.id || '').trim();
            if (!id) continue;
            if (VB_TEMPLATES.some((x) => x.id === id)) continue;
            const normalized = {
                id,
                name: tpl.name || id,
                desc: tpl.desc || '',
                mode: tpl.mode || 'plugin',
                category: tpl.category || '',
                nodes: Array.isArray(tpl.nodes) ? tpl.nodes : [],
                connections: Array.isArray(tpl.connections) ? tpl.connections : [],
            };
            VB_TEMPLATES.push(normalized);
            added += 1;
        }
        if (added > 0) buildTemplateGrid();
        return added;
    },
    generateCode: (options) => vbGenerateCode(options || { returnOnly: true }),
};
window.highlightEventInVB = highlightEventInVB;

document.addEventListener('DOMContentLoaded', () => {
    initVisualBuilder();
});

