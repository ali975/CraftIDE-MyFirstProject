/**
 * CraftIDE — Minecraft API Database & IntelliSense
 * Hover bilgisi, autocomplete, ve deprecated metod uyarıları
 */

(function () {
    function registerMinecraftAPISupport() {
        if (!window.monaco) {
            setTimeout(registerMinecraftAPISupport, 500);
            return;
        }

        const monaco = window.monaco;

        // ─── API Veritabanı ──────────────────────────────────────
        const API_DB = {
            classes: {
                'JavaPlugin': {
                    fullName: 'org.bukkit.plugin.java.JavaPlugin',
                    description: 'Tüm Bukkit/Paper plugin\'lerinin temel sınıfı',
                    methods: [
                        { name: 'onEnable', returnType: 'void', params: '', desc: 'Plugin aktif edildiğinde çağrılır' },
                        { name: 'onDisable', returnType: 'void', params: '', desc: 'Plugin deaktif edildiğinde çağrılır' },
                        { name: 'onLoad', returnType: 'void', params: '', desc: 'Plugin yüklendiğinde çağrılır (onEnable\'dan önce)' },
                        { name: 'getConfig', returnType: 'FileConfiguration', params: '', desc: 'Plugin yapılandırma dosyasını döndürür' },
                        { name: 'saveConfig', returnType: 'void', params: '', desc: 'Plugin yapılandırma dosyasını kaydeder' },
                        { name: 'saveDefaultConfig', returnType: 'void', params: '', desc: 'Varsayılan config.yml dosyasını kaydeder' },
                        { name: 'getLogger', returnType: 'Logger', params: '', desc: 'Plugin logger\'ını döndürür' },
                        { name: 'getServer', returnType: 'Server', params: '', desc: 'Sunucu instance\'ını döndürür' },
                        { name: 'getDataFolder', returnType: 'File', params: '', desc: 'Plugin veri klasörünü döndürür' },
                        { name: 'getResource', returnType: 'InputStream', params: 'String filename', desc: 'Plugin JAR\' içindeki kaynağı okur' },
                        { name: 'getCommand', returnType: 'PluginCommand', params: 'String name', desc: 'Kayıtlı komutu döndürür' },
                    ]
                },
                'Player': {
                    fullName: 'org.bukkit.entity.Player',
                    description: 'Minecraft oyuncusu',
                    methods: [
                        { name: 'getName', returnType: 'String', params: '', desc: 'Oyuncu adını döndürür' },
                        { name: 'getUniqueId', returnType: 'UUID', params: '', desc: 'Oyuncu UUID\'sini döndürür' },
                        { name: 'sendMessage', returnType: 'void', params: 'String message', desc: 'Oyuncuya mesaj gönderir' },
                        { name: 'sendActionBar', returnType: 'void', params: 'Component msg', desc: 'Action bar mesajı gönderir (Paper)' },
                        { name: 'getLocation', returnType: 'Location', params: '', desc: 'Oyuncunun konumunu döndürür' },
                        { name: 'teleport', returnType: 'boolean', params: 'Location loc', desc: 'Oyuncuyu ışınlar' },
                        { name: 'getHealth', returnType: 'double', params: '', desc: 'Oyuncunun canını döndürür' },
                        { name: 'setHealth', returnType: 'void', params: 'double health', desc: 'Oyuncunun canını ayarlar' },
                        { name: 'getFoodLevel', returnType: 'int', params: '', desc: 'Açlık seviyesini döndürür' },
                        { name: 'setFoodLevel', returnType: 'void', params: 'int food', desc: 'Açlık seviyesini ayarlar' },
                        { name: 'getInventory', returnType: 'PlayerInventory', params: '', desc: 'Envanteri döndürür' },
                        { name: 'openInventory', returnType: 'InventoryView', params: 'Inventory inv', desc: 'Envanter açar' },
                        { name: 'closeInventory', returnType: 'void', params: '', desc: 'Açık envanteri kapatır' },
                        { name: 'getGameMode', returnType: 'GameMode', params: '', desc: 'Oyun modunu döndürür' },
                        { name: 'setGameMode', returnType: 'void', params: 'GameMode mode', desc: 'Oyun modunu ayarlar' },
                        { name: 'hasPermission', returnType: 'boolean', params: 'String perm', desc: 'İzin kontrolü yapar' },
                        { name: 'kickPlayer', returnType: 'void', params: 'String reason', desc: 'Oyuncuyu atar' },
                        { name: 'isOnline', returnType: 'boolean', params: '', desc: 'Oyuncunun çevrimiçi olup olmadığını kontrol eder' },
                        { name: 'getWorld', returnType: 'World', params: '', desc: 'Oyuncunun bulunduğu dünyayı döndürür' },
                        { name: 'playSound', returnType: 'void', params: 'Location loc, Sound sound, float vol, float pitch', desc: 'Ses çalar' },
                        { name: 'sendTitle', returnType: 'void', params: 'String title, String subtitle, int fadeIn, int stay, int fadeOut', desc: 'Başlık metni gösterir' },
                        { name: 'giveExp', returnType: 'void', params: 'int amount', desc: 'Deneyim puanı verir' },
                        { name: 'getLevel', returnType: 'int', params: '', desc: 'Deneyim seviyesini döndürür' },
                    ]
                },
                'Bukkit': {
                    fullName: 'org.bukkit.Bukkit',
                    description: 'Sunucu API\'sine statik erişim',
                    methods: [
                        { name: 'getServer', returnType: 'Server', params: '', desc: 'Server instance döndürür' },
                        { name: 'getOnlinePlayers', returnType: 'Collection<Player>', params: '', desc: 'Çevrimiçi oyuncuları döndürür' },
                        { name: 'getPlayer', returnType: 'Player', params: 'String name', desc: 'İsimle oyuncu bulur' },
                        { name: 'getPlayer', returnType: 'Player', params: 'UUID id', desc: 'UUID ile oyuncu bulur' },
                        { name: 'getWorld', returnType: 'World', params: 'String name', desc: 'İsimle dünya döndürür' },
                        { name: 'getWorlds', returnType: 'List<World>', params: '', desc: 'Tüm dünyaları listeler' },
                        { name: 'createInventory', returnType: 'Inventory', params: 'InventoryHolder owner, int size, String title', desc: 'Özel envanter oluşturur' },
                        { name: 'getScheduler', returnType: 'BukkitScheduler', params: '', desc: 'Zamanlayıcıyı döndürür' },
                        { name: 'getPluginManager', returnType: 'PluginManager', params: '', desc: 'Plugin yöneticisini döndürür' },
                        { name: 'broadcastMessage', returnType: 'int', params: 'String message', desc: 'Tüm oyunculara mesaj gönderir' },
                        { name: 'shutdown', returnType: 'void', params: '', desc: 'Sunucuyu kapatır' },
                        { name: 'getConsoleSender', returnType: 'ConsoleCommandSender', params: '', desc: 'Konsol göndericiyi döndürür' },
                    ]
                },
                'ItemStack': {
                    fullName: 'org.bukkit.inventory.ItemStack',
                    description: 'Envanter eşyası',
                    methods: [
                        { name: 'getType', returnType: 'Material', params: '', desc: 'Eşya türünü döndürür' },
                        { name: 'setType', returnType: 'void', params: 'Material type', desc: 'Eşya türünü ayarlar' },
                        { name: 'getAmount', returnType: 'int', params: '', desc: 'Eşya miktarını döndürür' },
                        { name: 'setAmount', returnType: 'void', params: 'int amount', desc: 'Eşya miktarını ayarlar' },
                        { name: 'getItemMeta', returnType: 'ItemMeta', params: '', desc: 'Meta verisini döndürür' },
                        { name: 'setItemMeta', returnType: 'boolean', params: 'ItemMeta meta', desc: 'Meta verisini ayarlar' },
                        { name: 'hasItemMeta', returnType: 'boolean', params: '', desc: 'Meta verisi var mı kontrol eder' },
                        { name: 'clone', returnType: 'ItemStack', params: '', desc: 'Kopyasını oluşturur' },
                    ]
                },
                'Location': {
                    fullName: 'org.bukkit.Location',
                    description: 'Dünyada bir konum',
                    methods: [
                        { name: 'getX', returnType: 'double', params: '', desc: 'X koordinatı' },
                        { name: 'getY', returnType: 'double', params: '', desc: 'Y koordinatı' },
                        { name: 'getZ', returnType: 'double', params: '', desc: 'Z koordinatı' },
                        { name: 'getWorld', returnType: 'World', params: '', desc: 'Dünya referansı' },
                        { name: 'getBlock', returnType: 'Block', params: '', desc: 'Bu konumdaki bloğu döndürür' },
                        { name: 'distance', returnType: 'double', params: 'Location o', desc: 'İki konum arası mesafe' },
                        { name: 'add', returnType: 'Location', params: 'double x, double y, double z', desc: 'Koordinat ekler' },
                        { name: 'clone', returnType: 'Location', params: '', desc: 'Kopyasını oluşturur' },
                    ]
                },
            },
            events: {
                'PlayerJoinEvent': { desc: 'Oyuncu sunucuya girdiğinde', cancellable: false, methods: ['getPlayer()', 'getJoinMessage()', 'setJoinMessage(String)'] },
                'PlayerQuitEvent': { desc: 'Oyuncu sunucudan çıktığında', cancellable: false, methods: ['getPlayer()', 'getQuitMessage()', 'setQuitMessage(String)'] },
                'PlayerDeathEvent': { desc: 'Oyuncu öldüğünde', cancellable: false, methods: ['getEntity()', 'getDeathMessage()', 'setDeathMessage(String)', 'getDrops()', 'setKeepInventory(boolean)'] },
                'BlockBreakEvent': { desc: 'Blok kırıldığında', cancellable: true, methods: ['getPlayer()', 'getBlock()', 'setCancelled(boolean)'] },
                'BlockPlaceEvent': { desc: 'Blok yerleştirildiğinde', cancellable: true, methods: ['getPlayer()', 'getBlock()', 'setCancelled(boolean)'] },
                'PlayerInteractEvent': { desc: 'Oyuncu etkileşimde bulunduğunda', cancellable: true, methods: ['getPlayer()', 'getAction()', 'getItem()', 'getClickedBlock()'] },
                'EntityDamageEvent': { desc: 'Bir varlık hasar aldığında', cancellable: true, methods: ['getEntity()', 'getDamage()', 'setDamage(double)', 'getCause()'] },
                'InventoryClickEvent': { desc: 'Envanter tıklaması', cancellable: true, methods: ['getWhoClicked()', 'getSlot()', 'getCurrentItem()', 'getView()'] },
                'AsyncPlayerChatEvent': { desc: 'Oyuncu mesaj yazdığında (asenkron)', cancellable: true, methods: ['getPlayer()', 'getMessage()', 'setMessage(String)', 'setCancelled(boolean)'] },
                'PlayerCommandPreprocessEvent': { desc: 'Komut çalıştırılmadan önce', cancellable: true, methods: ['getPlayer()', 'getMessage()', 'setMessage(String)'] },
                'PlayerMoveEvent': { desc: 'Oyuncu hareket ettiğinde', cancellable: true, methods: ['getPlayer()', 'getFrom()', 'getTo()', 'setTo(Location)'] },
            },
        };

        // ─── Hover Provider ──────────────────────────────────────
        monaco.languages.registerHoverProvider('java', {
            provideHover: function (model, position) {
                const word = model.getWordAtPosition(position);
                if (!word) return null;
                const token = word.word;

                // Check classes
                const cls = API_DB.classes[token];
                if (cls) {
                    const methodList = cls.methods.map(m =>
                        `- \`${m.returnType} ${m.name}(${m.params})\` — ${m.desc}`
                    ).join('\n');

                    return {
                        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                        contents: [
                            { value: `**${token}** — \`${cls.fullName}\`` },
                            { value: cls.description },
                            { value: '### Metodlar\n' + methodList },
                        ],
                    };
                }

                // Check events
                const evt = API_DB.events[token];
                if (evt) {
                    return {
                        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                        contents: [
                            { value: `**${token}**` },
                            { value: evt.desc + (evt.cancellable ? ' *(İptal edilebilir)*' : '') },
                            { value: 'Metodlar: ' + evt.methods.map(m => '`' + m + '`').join(', ') },
                        ],
                    };
                }

                return null;
            }
        });

        // ─── Completion Provider ─────────────────────────────────
        monaco.languages.registerCompletionItemProvider('java', {
            triggerCharacters: ['.'],
            provideCompletionItems: function (model, position) {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                });

                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                const suggestions = [];

                // Check if typing after a dot (method access)
                const dotMatch = textUntilPosition.match(/(\w+)\.\s*$/);
                if (dotMatch) {
                    const varName = dotMatch[1];
                    // Try to find the type
                    let targetClass = null;
                    if (varName === 'player' || varName === 'p' || varName === 'sender') targetClass = 'Player';
                    else if (varName === 'Bukkit') targetClass = 'Bukkit';
                    else if (varName === 'item' || varName === 'stack') targetClass = 'ItemStack';
                    else if (varName === 'loc' || varName === 'location') targetClass = 'Location';

                    if (targetClass && API_DB.classes[targetClass]) {
                        for (const m of API_DB.classes[targetClass].methods) {
                            suggestions.push({
                                label: m.name,
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: m.params ? m.name + '($1)' : m.name + '()',
                                insertTextRules: m.params ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : 0,
                                detail: m.returnType + ' — ' + m.desc,
                                range,
                            });
                        }
                        return { suggestions };
                    }
                }

                // Class name completions
                for (const clsName of Object.keys(API_DB.classes)) {
                    suggestions.push({
                        label: clsName,
                        kind: monaco.languages.CompletionItemKind.Class,
                        insertText: clsName,
                        detail: API_DB.classes[clsName].fullName,
                        range,
                    });
                }

                // Event completions
                for (const evtName of Object.keys(API_DB.events)) {
                    suggestions.push({
                        label: evtName,
                        kind: monaco.languages.CompletionItemKind.Event,
                        insertText: evtName,
                        detail: API_DB.events[evtName].desc,
                        range,
                    });
                }

                return { suggestions };
            }
        });

        console.log('⛏️ Minecraft API IntelliSense registered!');
    }

    registerMinecraftAPISupport();
})();
