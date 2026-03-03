import * as vscode from 'vscode';

/**
 * CraftIDE Minecraft API Referans Veritabanı
 * 
 * Versiyon-aware API bilgisi sağlar:
 * - Sınıf, metod, event bilgileri
 * - Deprecated metod tespiti
 * - Alternatif önerileri
 * 
 * NOT: Gerçek üretim versiyonunda SQLite kullanılacak.
 * Bu MVP'de in-memory JSON veri yapısı kullanıyoruz.
 */
export class MinecraftApiDatabase {
    private _classes: Map<string, ApiClass> = new Map();
    private _events: Map<string, ApiEvent> = new Map();
    private _materials: Set<string> = new Set();
    private _versions: McVersion[] = [];

    constructor() {
        this._loadBuiltinData();
    }

    // ─── Sorgu Metodları ─────────────────────────────────────

    /**
     * Sınıf bilgisi getir
     */
    getClass(name: string): ApiClass | undefined {
        return this._classes.get(name) || this._classes.get(this._resolveSimpleName(name));
    }

    /**
     * Metod bilgisi getir (sınıf adı + metod adı)
     */
    getMethod(className: string, methodName: string): ApiMethod | undefined {
        const cls = this.getClass(className);
        return cls?.methods.find(m => m.name === methodName);
    }

    /**
     * Event bilgisi getir
     */
    getEvent(name: string): ApiEvent | undefined {
        return this._events.get(name);
    }

    /**
     * Belirli bir versiyon için deprecated olan şeyleri bul
     */
    getDeprecatedMethods(mcVersion: string): ApiMethod[] {
        const deprecated: ApiMethod[] = [];
        for (const cls of this._classes.values()) {
            for (const method of cls.methods) {
                if (method.deprecatedSince && this._isVersionAtOrBefore(method.deprecatedSince, mcVersion)) {
                    deprecated.push(method);
                }
            }
        }
        return deprecated;
    }

    /**
     * Otomatik tamamlama için metod listesi
     */
    getMethodsForClass(className: string, mcVersion?: string): ApiMethod[] {
        const cls = this.getClass(className);
        if (!cls) { return []; }

        if (mcVersion) {
            return cls.methods.filter(m =>
                !m.sinceVersion || this._isVersionAtOrBefore(m.sinceVersion, mcVersion)
            );
        }
        return cls.methods;
    }

    /**
     * Tüm event'leri listele
     */
    getAllEvents(): ApiEvent[] {
        return Array.from(this._events.values());
    }

    /**
     * Material listesi
     */
    getAllMaterials(): string[] {
        return Array.from(this._materials);
    }

    /**
     * Versiyon bilgisi
     */
    getVersionInfo(version: string): McVersion | undefined {
        return this._versions.find(v => v.version === version);
    }

    // ─── Hover Bilgisi Üretici ──────────────────────────────

    /**
     * Bir token için Markdown hover bilgisi üret
     */
    generateHoverInfo(token: string, mcVersion: string): string | undefined {
        // Sınıf mı?
        const cls = this.getClass(token);
        if (cls) {
            let md = `### ${cls.simpleName}\n`;
            md += `📦 \`${cls.fullName}\`\n\n`;
            if (cls.description) { md += `${cls.description}\n\n`; }
            if (cls.parentClass) { md += `↗️ extends \`${cls.parentClass}\`\n\n`; }
            if (cls.deprecatedSince) {
                md += `⚠️ **Deprecated** since MC ${cls.deprecatedSince}\n\n`;
            }
            md += `📋 ${cls.methods.length} metod\n`;
            return md;
        }

        // Event mi?
        const event = this.getEvent(token);
        if (event) {
            let md = `### 🎯 ${event.name}\n`;
            md += `📦 \`${event.package}.${event.name}\`\n\n`;
            if (event.description) { md += `${event.description}\n\n`; }
            md += event.cancellable ? `✅ İptal edilebilir\n` : `❌ İptal edilemez\n`;
            if (event.deprecatedSince) {
                md += `\n⚠️ **Deprecated** since MC ${event.deprecatedSince}\n`;
            }
            return md;
        }

        // Material mi?
        if (this._materials.has(token)) {
            return `### 🧱 Material.${token}\n\nMinecraft blok/eşya türü`;
        }

        return undefined;
    }

    // ─── Dahili Veri ─────────────────────────────────────────

    private _resolveSimpleName(name: string): string {
        for (const cls of this._classes.values()) {
            if (cls.simpleName === name) { return cls.fullName; }
        }
        return name;
    }

    private _isVersionAtOrBefore(ver1: string, ver2: string): boolean {
        const parts1 = ver1.split('.').map(Number);
        const parts2 = ver2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const a = parts1[i] || 0;
            const b = parts2[i] || 0;
            if (a < b) { return true; }
            if (a > b) { return false; }
        }
        return true;
    }

    private _loadBuiltinData(): void {
        // ── Versiyonlar ──
        this._versions = [
            { version: '1.21.4', javaVersion: 21, apiVersion: '1.21', releaseDate: '2024-12-03' },
            { version: '1.21', javaVersion: 21, apiVersion: '1.21', releaseDate: '2024-06-13' },
            { version: '1.20.6', javaVersion: 21, apiVersion: '1.20', releaseDate: '2024-04-29' },
            { version: '1.20.4', javaVersion: 17, apiVersion: '1.20', releaseDate: '2023-12-07' },
            { version: '1.20.1', javaVersion: 17, apiVersion: '1.20', releaseDate: '2023-06-12' },
            { version: '1.19.4', javaVersion: 17, apiVersion: '1.19', releaseDate: '2023-03-14' },
            { version: '1.18.2', javaVersion: 17, apiVersion: '1.18', releaseDate: '2022-02-28' },
            { version: '1.16.5', javaVersion: 16, apiVersion: '1.16', releaseDate: '2021-01-15' },
        ];

        // ── Ana Sınıflar ──
        this._addClass({
            fullName: 'org.bukkit.entity.Player',
            simpleName: 'Player',
            package: 'org.bukkit.entity',
            parentClass: 'HumanEntity',
            description: 'Bir oyuncuyu temsil eder. Mesaj gönderme, ışınlama, envanter erişimi vb. işlemler için kullanılır.',
            methods: [
                { name: 'sendMessage', returnType: 'void', parameters: 'String message', description: 'Oyuncuya mesaj gönderir', sinceVersion: '1.0' },
                { name: 'sendActionBar', returnType: 'void', parameters: 'String message', description: 'Oyuncuya action bar mesajı gönderir', sinceVersion: '1.11' },
                { name: 'getHealth', returnType: 'double', parameters: '', description: 'Oyuncunun canını döndürür', sinceVersion: '1.0' },
                { name: 'setHealth', returnType: 'void', parameters: 'double health', description: 'Oyuncunun canını ayarlar', sinceVersion: '1.0' },
                { name: 'getLocation', returnType: 'Location', parameters: '', description: 'Oyuncunun konumunu döndürür', sinceVersion: '1.0' },
                { name: 'teleport', returnType: 'boolean', parameters: 'Location location', description: 'Oyuncuyu belirtilen konuma ışınlar', sinceVersion: '1.0' },
                { name: 'getInventory', returnType: 'PlayerInventory', parameters: '', description: 'Oyuncunun envanterini döndürür', sinceVersion: '1.0' },
                { name: 'openInventory', returnType: 'InventoryView', parameters: 'Inventory inventory', description: 'Belirtilen envanteri oyuncuya açar', sinceVersion: '1.0' },
                { name: 'isOp', returnType: 'boolean', parameters: '', description: 'Oyuncunun OP olup olmadığını kontrol eder', sinceVersion: '1.0' },
                { name: 'hasPermission', returnType: 'boolean', parameters: 'String permission', description: 'Oyuncunun belirtilen izne sahip olup olmadığını kontrol eder', sinceVersion: '1.0' },
                { name: 'getGameMode', returnType: 'GameMode', parameters: '', description: 'Oyuncunun oyun modunu döndürür', sinceVersion: '1.0' },
                { name: 'setGameMode', returnType: 'void', parameters: 'GameMode mode', description: 'Oyuncunun oyun modunu ayarlar', sinceVersion: '1.0' },
                { name: 'getWorld', returnType: 'World', parameters: '', description: 'Oyuncunun bulunduğu dünyayı döndürür', sinceVersion: '1.0' },
                { name: 'getName', returnType: 'String', parameters: '', description: 'Oyuncunun adını döndürür', sinceVersion: '1.0' },
                { name: 'getUniqueId', returnType: 'UUID', parameters: '', description: 'Oyuncunun benzersiz kimliğini döndürür', sinceVersion: '1.7' },
                { name: 'kickPlayer', returnType: 'void', parameters: 'String message', description: 'Oyuncuyu sunucudan atar', sinceVersion: '1.0' },
                { name: 'setMaxHealth', returnType: 'void', parameters: 'double health', description: 'Maksimum canı ayarlar', sinceVersion: '1.0', deprecatedSince: '1.6', replacement: 'getAttribute(Attribute.GENERIC_MAX_HEALTH).setBaseValue(double)' },
                { name: 'playSound', returnType: 'void', parameters: 'Location loc, Sound sound, float volume, float pitch', description: 'Oyuncuya ses çalar', sinceVersion: '1.0' },
            ],
        });

        this._addClass({
            fullName: 'org.bukkit.Bukkit',
            simpleName: 'Bukkit',
            package: 'org.bukkit',
            description: 'Sunucu ana sınıfı. Oyuncuları, dünyaları, scheduler\'ı ve plugin yöneticisini erişim sağlar.',
            methods: [
                { name: 'getServer', returnType: 'Server', parameters: '', description: 'Sunucu nesnesini döndürür', sinceVersion: '1.0' },
                { name: 'getOnlinePlayers', returnType: 'Collection<Player>', parameters: '', description: 'Çevrimiçi oyuncuları döndürür', sinceVersion: '1.0' },
                { name: 'getPlayer', returnType: 'Player', parameters: 'String name', description: 'İsme göre oyuncu bulur', sinceVersion: '1.0' },
                { name: 'getWorld', returnType: 'World', parameters: 'String name', description: 'İsme göre dünya bulur', sinceVersion: '1.0' },
                { name: 'createInventory', returnType: 'Inventory', parameters: 'InventoryHolder holder, int size, String title', description: 'Yeni envanter oluşturur', sinceVersion: '1.0' },
                { name: 'getScheduler', returnType: 'BukkitScheduler', parameters: '', description: 'Görev planlayıcısını döndürür', sinceVersion: '1.0' },
                { name: 'getPluginManager', returnType: 'PluginManager', parameters: '', description: 'Plugin yöneticisini döndürür', sinceVersion: '1.0' },
                { name: 'broadcastMessage', returnType: 'int', parameters: 'String message', description: 'Tüm oyunculara mesaj gönderir', sinceVersion: '1.0' },
                { name: 'getConsoleSender', returnType: 'ConsoleCommandSender', parameters: '', description: 'Konsol göndericiyi döndürür', sinceVersion: '1.0' },
            ],
        });

        this._addClass({
            fullName: 'org.bukkit.inventory.ItemStack',
            simpleName: 'ItemStack',
            package: 'org.bukkit.inventory',
            description: 'Bir eşya yığınını temsil eder. Materyal, miktar, meta verisi içerir.',
            methods: [
                { name: 'getType', returnType: 'Material', parameters: '', description: 'Eşyanın materyal türünü döndürür', sinceVersion: '1.0' },
                { name: 'setType', returnType: 'void', parameters: 'Material type', description: 'Eşyanın materyal türünü ayarlar', sinceVersion: '1.0' },
                { name: 'getAmount', returnType: 'int', parameters: '', description: 'Eşya miktarını döndürür', sinceVersion: '1.0' },
                { name: 'setAmount', returnType: 'void', parameters: 'int amount', description: 'Eşya miktarını ayarlar', sinceVersion: '1.0' },
                { name: 'getItemMeta', returnType: 'ItemMeta', parameters: '', description: 'Eşyanın meta verisini döndürür', sinceVersion: '1.0' },
                { name: 'setItemMeta', returnType: 'boolean', parameters: 'ItemMeta meta', description: 'Eşyanın meta verisini ayarlar', sinceVersion: '1.0' },
                { name: 'addEnchantment', returnType: 'void', parameters: 'Enchantment ench, int level', description: 'Büyü ekler', sinceVersion: '1.0' },
                { name: 'hasItemMeta', returnType: 'boolean', parameters: '', description: 'Meta verisi olup olmadığını kontrol eder', sinceVersion: '1.0' },
            ],
        });

        // ── Event'ler ──
        const events: ApiEvent[] = [
            { name: 'PlayerJoinEvent', package: 'org.bukkit.event.player', description: 'Bir oyuncu sunucuya katıldığında tetiklenir', cancellable: false, sinceVersion: '1.0' },
            { name: 'PlayerQuitEvent', package: 'org.bukkit.event.player', description: 'Bir oyuncu sunucudan ayrıldığında tetiklenir', cancellable: false, sinceVersion: '1.0' },
            { name: 'PlayerInteractEvent', package: 'org.bukkit.event.player', description: 'Oyuncu blok/eşya ile etkileşime girdiğinde tetiklenir', cancellable: true, sinceVersion: '1.0' },
            { name: 'PlayerMoveEvent', package: 'org.bukkit.event.player', description: 'Oyuncu hareket ettiğinde tetiklenir (dikkat: çok sık!)', cancellable: true, sinceVersion: '1.0' },
            { name: 'PlayerDeathEvent', package: 'org.bukkit.event.entity', description: 'Bir oyuncu öldüğünde tetiklenir', cancellable: false, sinceVersion: '1.0' },
            { name: 'PlayerRespawnEvent', package: 'org.bukkit.event.player', description: 'Oyuncu yeniden doğduğunda tetiklenir', cancellable: false, sinceVersion: '1.0' },
            { name: 'PlayerChatEvent', package: 'org.bukkit.event.player', description: 'Oyuncu mesaj yazdığında tetiklenir', cancellable: true, sinceVersion: '1.0', deprecatedSince: '1.3', replacement: 'AsyncPlayerChatEvent' },
            { name: 'AsyncPlayerChatEvent', package: 'org.bukkit.event.player', description: 'Oyuncu mesaj yazdığında tetiklenir (async)', cancellable: true, sinceVersion: '1.3' },
            { name: 'BlockBreakEvent', package: 'org.bukkit.event.block', description: 'Bir blok kırıldığında tetiklenir', cancellable: true, sinceVersion: '1.0' },
            { name: 'BlockPlaceEvent', package: 'org.bukkit.event.block', description: 'Bir blok yerleştirildiğinde tetiklenir', cancellable: true, sinceVersion: '1.0' },
            { name: 'InventoryClickEvent', package: 'org.bukkit.event.inventory', description: 'Envanterde bir slot tıklandığında tetiklenir', cancellable: true, sinceVersion: '1.0' },
            { name: 'InventoryCloseEvent', package: 'org.bukkit.event.inventory', description: 'Envanter kapatıldığında tetiklenir', cancellable: false, sinceVersion: '1.0' },
            { name: 'EntityDamageByEntityEvent', package: 'org.bukkit.event.entity', description: 'Bir varlık başka bir varlık tarafından hasar aldığında tetiklenir', cancellable: true, sinceVersion: '1.0' },
            { name: 'CreatureSpawnEvent', package: 'org.bukkit.event.entity', description: 'Bir yaratık doğduğunda tetiklenir', cancellable: true, sinceVersion: '1.0' },
            { name: 'PlayerCommandPreprocessEvent', package: 'org.bukkit.event.player', description: 'Oyuncu bir komut yazmadan hemen önce tetiklenir', cancellable: true, sinceVersion: '1.0' },
        ];
        for (const e of events) {
            this._events.set(e.name, e);
        }

        // ── Yaygın Material'ler ──
        const materials = [
            'DIAMOND_SWORD', 'DIAMOND_PICKAXE', 'DIAMOND_AXE', 'DIAMOND_SHOVEL', 'DIAMOND_HOE',
            'NETHERITE_SWORD', 'NETHERITE_PICKAXE', 'NETHERITE_AXE',
            'DIAMOND_HELMET', 'DIAMOND_CHESTPLATE', 'DIAMOND_LEGGINGS', 'DIAMOND_BOOTS',
            'NETHERITE_HELMET', 'NETHERITE_CHESTPLATE', 'NETHERITE_LEGGINGS', 'NETHERITE_BOOTS',
            'IRON_SWORD', 'IRON_PICKAXE', 'IRON_AXE', 'IRON_SHOVEL',
            'STONE', 'DIRT', 'GRASS_BLOCK', 'OAK_LOG', 'OAK_PLANKS', 'COBBLESTONE',
            'DIAMOND', 'EMERALD', 'GOLD_INGOT', 'IRON_INGOT', 'NETHERITE_INGOT',
            'DIAMOND_BLOCK', 'EMERALD_BLOCK', 'GOLD_BLOCK', 'IRON_BLOCK',
            'DIAMOND_ORE', 'IRON_ORE', 'GOLD_ORE', 'COAL_ORE', 'EMERALD_ORE',
            'CHEST', 'ENDER_CHEST', 'CRAFTING_TABLE', 'FURNACE', 'ANVIL',
            'APPLE', 'GOLDEN_APPLE', 'ENCHANTED_GOLDEN_APPLE', 'BREAD', 'COOKED_BEEF',
            'BOW', 'ARROW', 'SPECTRAL_ARROW', 'TIPPED_ARROW', 'CROSSBOW', 'TRIDENT',
            'SHIELD', 'TOTEM_OF_UNDYING', 'ELYTRA', 'FIREWORK_ROCKET',
            'ENDER_PEARL', 'ENDER_EYE', 'BLAZE_ROD', 'BLAZE_POWDER', 'NETHER_STAR',
            'POTION', 'SPLASH_POTION', 'LINGERING_POTION', 'EXPERIENCE_BOTTLE',
            'BOOK', 'ENCHANTED_BOOK', 'WRITABLE_BOOK', 'WRITTEN_BOOK',
            'COMPASS', 'CLOCK', 'MAP', 'FILLED_MAP', 'NAME_TAG', 'LEAD',
            'BARRIER', 'BEDROCK', 'COMMAND_BLOCK', 'STRUCTURE_BLOCK',
            'AIR', 'GLASS', 'GLASS_PANE', 'BLACK_STAINED_GLASS_PANE', 'GRAY_STAINED_GLASS_PANE',
            'OAK_SIGN', 'OAK_DOOR', 'OAK_FENCE', 'OAK_BUTTON', 'OAK_PRESSURE_PLATE',
            'REDSTONE', 'REDSTONE_BLOCK', 'REDSTONE_TORCH', 'REPEATER', 'COMPARATOR',
            'PISTON', 'STICKY_PISTON', 'OBSERVER', 'HOPPER', 'DROPPER', 'DISPENSER',
            'TNT', 'FIRE', 'LAVA_BUCKET', 'WATER_BUCKET', 'BUCKET',
            'SHORT_GRASS', 'TALL_GRASS', 'FERN', 'LARGE_FERN',
            'PLAYER_HEAD', 'SKELETON_SKULL', 'ZOMBIE_HEAD', 'CREEPER_HEAD',
        ];
        for (const m of materials) { this._materials.add(m); }
    }

    private _addClass(data: {
        fullName: string; simpleName: string; package: string;
        parentClass?: string; description?: string; deprecatedSince?: string;
        methods: Array<{
            name: string; returnType: string; parameters: string;
            description: string; sinceVersion?: string;
            deprecatedSince?: string; replacement?: string;
        }>;
    }): void {
        this._classes.set(data.fullName, {
            fullName: data.fullName,
            simpleName: data.simpleName,
            package: data.package,
            parentClass: data.parentClass,
            description: data.description,
            deprecatedSince: data.deprecatedSince,
            methods: data.methods,
        });
        this._classes.set(data.simpleName, this._classes.get(data.fullName)!);
    }
}

// ─── Tip Tanımları ──────────────────────────────────────────

export interface ApiClass {
    fullName: string;
    simpleName: string;
    package: string;
    parentClass?: string;
    description?: string;
    deprecatedSince?: string;
    methods: ApiMethod[];
}

export interface ApiMethod {
    name: string;
    returnType: string;
    parameters: string;
    description: string;
    sinceVersion?: string;
    deprecatedSince?: string;
    replacement?: string;
}

export interface ApiEvent {
    name: string;
    package: string;
    description: string;
    cancellable: boolean;
    sinceVersion?: string;
    deprecatedSince?: string;
    replacement?: string;
}

export interface McVersion {
    version: string;
    javaVersion: number;
    apiVersion: string;
    releaseDate: string;
}
