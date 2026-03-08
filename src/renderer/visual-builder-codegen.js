(function () {
    const MODE_ALIAS = {
        paper: 'plugin',
        spigot: 'plugin',
        bukkit: 'plugin',
        plugin: 'plugin',
        fabric: 'fabric',
        forge: 'forge',
        skript: 'skript',
    };

    const EVENT_BLOCKS = {
        plugin: new Set([
            'PlayerJoin',
            'PlayerQuit',
            'BlockBreak',
            'BlockPlace',
            'PlayerChat',
            'PlayerDeath',
            'EntityDamage',
            'InventoryClick',
            'PlayerMove',
            'PlayerCommand',
            'ServerLoad',
        ]),
        fabric: new Set([
            'FabricPlayerJoin',
            'FabricPlayerQuit',
            'FabricServerStart',
            'FabricServerStop',
            'FabricBlockBreak',
            'FabricAttack',
            'FabricInteract',
        ]),
        forge: new Set([
            'ForgePlayerLogin',
            'ForgePlayerLogout',
            'ForgeBreak',
            'ForgePlace',
            'ForgeLivingDamage',
        ]),
        skript: new Set([
            'SkJoin',
            'SkQuit',
            'SkChat',
            'SkBreak',
            'SkPlace',
            'SkDeath',
            'SkCommand',
        ]),
    };

    const PLUGIN_EVENT_TYPES = {
        PlayerJoin: 'PlayerJoinEvent',
        PlayerQuit: 'PlayerQuitEvent',
        BlockBreak: 'BlockBreakEvent',
        BlockPlace: 'BlockPlaceEvent',
        PlayerChat: 'AsyncPlayerChatEvent',
        PlayerDeath: 'PlayerDeathEvent',
        EntityDamage: 'EntityDamageByEntityEvent',
        InventoryClick: 'InventoryClickEvent',
        PlayerMove: 'PlayerMoveEvent',
        PlayerCommand: 'PlayerCommandPreprocessEvent',
    };

    const FABRIC_EVENT_TYPES = {
        FabricPlayerJoin: 'ServerPlayConnectionEvents.JOIN',
        FabricPlayerQuit: 'ServerPlayConnectionEvents.DISCONNECT',
        FabricServerStart: 'ServerLifecycleEvents.SERVER_STARTED',
        FabricServerStop: 'ServerLifecycleEvents.SERVER_STOPPING',
        FabricBlockBreak: 'PlayerBlockBreakEvents.BEFORE',
        FabricAttack: 'AttackEntityCallback.EVENT',
        FabricInteract: 'UseBlockCallback.EVENT',
    };

    const FORGE_EVENT_TYPES = {
        ForgePlayerLogin: 'PlayerEvent.PlayerLoggedInEvent',
        ForgePlayerLogout: 'PlayerEvent.PlayerLoggedOutEvent',
        ForgeBreak: 'BlockEvent.BreakEvent',
        ForgePlace: 'BlockEvent.EntityPlaceEvent',
        ForgeLivingDamage: 'LivingDamageEvent',
    };

    const SKRIPT_EVENT_TYPES = {
        SkJoin: 'on join',
        SkQuit: 'on quit',
        SkChat: 'on chat',
        SkBreak: 'on break',
        SkPlace: 'on place',
        SkDeath: 'on death',
    };

    function normalizeMode(rawMode) {
        if (typeof window !== 'undefined' && window.CraftIDEUtils && typeof window.CraftIDEUtils.normalizeMode === 'function') {
            return window.CraftIDEUtils.normalizeMode(rawMode);
        }
        return MODE_ALIAS[String(rawMode || '').toLowerCase()] || 'plugin';
    }

    function getNodes(graph) {
        return Array.isArray(graph && graph.nodes) ? graph.nodes : [];
    }

    function getConnections(graph) {
        return Array.isArray(graph && graph.connections) ? graph.connections : [];
    }

    function isEventNode(mode, node) {
        if (!node || typeof node !== 'object') return false;
        if (node.type === 'event') return true;
        return !!EVENT_BLOCKS[mode] && EVENT_BLOCKS[mode].has(node.blockId);
    }

    function getNextNodeId(nodeId, portName, connections) {
        const conn = connections.find(c => c.from === nodeId && (c.fromPort || 'out') === portName);
        return conn ? conn.to : null;
    }

    function traverseTree(nodeId, indent, ctx, generateNodeCodeFunc) {
        let currentId = nodeId;
        let code = '';
        while (currentId) {
            // Avoid infinite loops in visual builder
            if (ctx.visited.has(currentId)) {
                code += indent + '// Loop detected\n';
                break;
            }
            ctx.visited.add(currentId);

            const node = ctx.nodes.find(n => n.id === currentId);
            if (!node || isEventNode(ctx.mode, node)) break;

            code += generateNodeCodeFunc(node, indent, ctx);

            // If it branches, the node code func handled true/false. If it has a standard 'out' port, continue.
            // Branches like IfElse have 'true' and 'false', no 'out'.
            const nextId = getNextNodeId(currentId, 'out', ctx.connections);
            if (!nextId) {
                // Check if it's a legacy if-else which we didn't migrate? Actually all branching nodes now don't have 'out'.
                break;
            }
            currentId = nextId;
        }
        return code;
    }

    function generatePluginNodeCode(node, indent, ctx) {
        const p = node.params || {};

        const branch = (conditionStr) => {
            let str = indent + 'if (' + conditionStr + ') {\n';
            const trueId = getNextNodeId(node.id, 'true', ctx.connections);
            if (trueId) str += traverseTree(trueId, indent + '    ', ctx, generatePluginNodeCode);
            str += indent + '} else {\n';
            const falseId = getNextNodeId(node.id, 'false', ctx.connections);
            if (falseId) str += traverseTree(falseId, indent + '    ', ctx, generatePluginNodeCode);
            str += indent + '}\n';
            return str;
        };

        switch (node.blockId) {
            case 'HasPermission': return branch('event.getPlayer() != null && event.getPlayer().hasPermission("' + (p.permission || 'perm') + '")');
            case 'IsOp': return branch('event.getPlayer() != null && event.getPlayer().isOp()');
            case 'HasItem': return branch('event.getPlayer().getInventory().contains(Material.' + (p.material || 'DIAMOND') + ')');
            case 'HealthCheck': return branch('event.getPlayer().getHealth() ' + (p.op || '>=') + ' ' + (p.value || '10'));
            case 'CommandEquals': return branch('event.getMessage().equalsIgnoreCase("' + (p.cmd || '/cmd') + '")');
            case 'IsInWorld': return branch('event.getPlayer().getWorld().getName().equals("' + (p.world || 'world') + '")');
            case 'IfElse': return branch('true /* Insert Condition */');
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
            case 'SendTitle': return indent + 'event.getPlayer().sendTitle("' + (p.baslik || 'Baslik') + '", "' + (p.alt || '') + '", 10, 70, 20);\n';
            case 'RunCommand': return indent + 'Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "' + (p.komut || '') + '".replace("{player}", event.getPlayer().getName()));\n';
            case 'Loop': return indent + 'for (int i = 0; i < ' + (p.kez || 10) + '; i++) {\n' + indent + '    // loop body\n' + indent + '}\n';
            case 'Delay': return indent + 'getServer().getScheduler().runTaskLater(this, () -> {\n' + indent + '    // delayed action\n' + indent + '}, ' + (p.tick || 20) + ');\n';
            case 'ForEachPlayer': return indent + 'for (Player p : Bukkit.getOnlinePlayers()) {\n' + indent + '    // each player\n' + indent + '}\n';
            case 'CreateGUI': return indent + 'Inventory inv = Bukkit.createInventory(null, ' + (parseInt(p.satir || 3, 10) * 9) + ', "' + (p.baslik || 'Shop') + '");\n';
            case 'SetGUIItem': return indent + '{\n' + indent + '    ItemStack guiItem = new ItemStack(Material.' + (p.material || 'DIAMOND') + ');\n' + indent + '    ItemMeta guiMeta = guiItem.getItemMeta();\n' + indent + '    if (guiMeta != null) { guiMeta.setDisplayName("' + (p.isim || 'Esya') + '"); guiItem.setItemMeta(guiMeta); }\n' + indent + '    inv.setItem(' + (p.slot || 0) + ', guiItem);\n' + indent + '}\n';
            case 'OpenGUI': return indent + 'event.getPlayer().openInventory(' + (p.envanter || 'inv') + ');\n';
            case 'GUIClickEvent': return indent + '// GUI click guard for "' + (p.envanter || 'Shop') + '"\n';
            case 'RunAfterDelay': return indent + 'getServer().getScheduler().runTaskLater(this, () -> {\n' + indent + '    // delayed action\n' + indent + '}, ' + (p.tick || 20) + ');\n';
            case 'RepeatTask': return indent + 'getServer().getScheduler().runTaskTimer(this, () -> {\n' + indent + '    // repeating action\n' + indent + '}, ' + (p.baslangic || 0) + ', ' + (p.aralik || 20) + ');\n';
            case 'CancelTask': return indent + '// BukkitTask ' + (p.gorevAdi || 'task') + ' = ...; ' + (p.gorevAdi || 'task') + '.cancel();\n';
            case 'ConfigGet': return indent + 'Object ' + (p.key || 'key').replace(/[.\-]/g, '_') + '_val = getConfig().get("' + (p.key || 'key') + '", ' + (p.varsayilan || '0') + ');\n';
            case 'ConfigSet': return indent + 'getConfig().set("' + (p.key || 'key') + '", ' + (p.deger || '"deger"') + ');\nsaveConfig();\n';
            case 'PDCGet': return indent + '{\n' + indent + '    org.bukkit.NamespacedKey pdcKey = new org.bukkit.NamespacedKey(this, "' + (p.key || 'coins') + '");\n' + indent + '    int pdcVal = event.getPlayer().getPersistentDataContainer().getOrDefault(pdcKey, org.bukkit.persistence.PersistentDataType.INTEGER, 0);\n' + indent + '}\n';
            case 'PDCSet': return indent + '{\n' + indent + '    org.bukkit.NamespacedKey pdcKey = new org.bukkit.NamespacedKey(this, "' + (p.key || 'coins') + '");\n' + indent + '    event.getPlayer().getPersistentDataContainer().set(pdcKey, org.bukkit.persistence.PersistentDataType.INTEGER, ' + (p.deger || '0') + ');\n' + indent + '}\n';
            case 'DBConnect': return indent + '// DB Connect: ' + (p.type || 'sqlite') + ' - ' + (p.db || 'mydb') + ' (Requires lib)\n';
            case 'DBUpdate': return indent + '// DB Update: ' + (p.query || '') + '\n';
            case 'GetBalance': return indent + '// double balance = economy.getBalance(event.getPlayer());\n';
            case 'GiveMoney': return indent + '// economy.depositPlayer(event.getPlayer(), ' + (p.miktar || 100) + ');\n';
            case 'TakeMoney': return indent + '// economy.withdrawPlayer(event.getPlayer(), ' + (p.miktar || 100) + ');\n';
            case 'SetVariable': return indent + 'playerData.put("' + (p.name || 'var') + '_" + event.getPlayer().getName(), "' + (p.value || '0') + '");\n';
            case 'GetVariable': return indent + 'Object ' + (p.name || 'var').replace(/[^a-zA-Z0-9_]/g, '_') + '_val = playerData.getOrDefault("' + (p.name || 'var') + '_" + event.getPlayer().getName(), "0");\n';
            case 'MathOperation': {
                const varName = (p.var || 'var').replace(/[^a-zA-Z0-9_]/g, '_');
                const op = p.op === 'sub' ? '-' : p.op === 'mul' ? '*' : p.op === 'div' ? '/' : '+';
                return indent + '{\n'
                    + indent + '    double ' + varName + '_cur = Double.parseDouble(String.valueOf(playerData.getOrDefault("' + (p.var || 'var') + '_" + event.getPlayer().getName(), "0")));\n'
                    + indent + '    playerData.put("' + (p.var || 'var') + '_" + event.getPlayer().getName(), String.valueOf(' + varName + '_cur ' + op + ' ' + (p.amount || '10') + '));\n'
                    + indent + '}\n';
            }
            case 'CompareVariable': return indent + 'if (Double.parseDouble(String.valueOf(playerData.getOrDefault("' + (p.var || 'var') + '_" + event.getPlayer().getName(), "0"))) ' + (p.op || '>=') + ' Double.parseDouble("' + (p.value || '0') + '")) {\n';
            default: return indent + '// ' + (node.label || node.blockId || 'node') + '\n';
        }
    }

    function generatePluginCode(graph) {
        const nodes = getNodes(graph);
        const connections = getConnections(graph);
        if (nodes.length === 0) return '// Henüz blok yok\n';

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

        const ctx = { nodes, connections, visited: new Set(), mode: 'plugin' };
        const eventNodes = nodes.filter((node) => isEventNode('plugin', node));

        for (const eventNode of eventNodes) {
            const eventType = PLUGIN_EVENT_TYPES[eventNode.blockId];
            if (!eventType) continue;
            code += '    @EventHandler\n';
            code += '    public void on' + eventNode.blockId + '(' + eventType + ' event) {\n';

            ctx.visited.clear();
            const firstNodeId = getNextNodeId(eventNode.id, 'out', connections);
            if (firstNodeId) {
                code += traverseTree(firstNodeId, '        ', ctx, generatePluginNodeCode);
            }
            code += '    }\n\n';
        }

        code += '}\n';
        return code;
    }

    function generateFabricNodeCode(node, indent, ctx) {
        const p = node.params || {};

        const branch = (conditionStr) => {
            let str = indent + 'if (' + conditionStr + ') {\n';
            const trueId = getNextNodeId(node.id, 'true', ctx.connections);
            if (trueId) str += traverseTree(trueId, indent + '    ', ctx, generateFabricNodeCode);
            str += indent + '} else {\n';
            const falseId = getNextNodeId(node.id, 'false', ctx.connections);
            if (falseId) str += traverseTree(falseId, indent + '    ', ctx, generateFabricNodeCode);
            str += indent + '}\n';
            return str;
        };

        switch (node.blockId) {
            case 'FabricSendMsg': return indent + 'player.sendMessage(Text.of("' + (p.mesaj || 'Merhaba!') + '"), false);\n';
            case 'FabricBroadcast': return indent + 'handler.getServer().getPlayerManager().broadcast(Text.of("' + (p.mesaj || 'Duyuru!') + '"), false);\n';
            case 'FabricTeleport': return indent + 'player.teleport(player.getWorld(), ' + (p.x || 0) + ', ' + (p.y || 64) + ', ' + (p.z || 0) + ', 0f, 0f);\n';
            case 'FabricGiveItem': return indent + '// ItemStack stack = new ItemStack(Registries.ITEM.get(Identifier.of("' + (p.item || 'minecraft:diamond') + '")), ' + (p.adet || 1) + ');\n' + indent + '// player.giveItemStack(stack);\n';
            case 'FabricSpawnEntity': return indent + '// Entity entity = EntityType.get("' + (p.type || 'minecraft:zombie') + '").get().create(player.getWorld());\n' + indent + '// entity.refreshPositionAndAngles(player.getX(), player.getY(), player.getZ(), 0, 0);\n' + indent + '// player.getWorld().spawnEntity(entity);\n';
            case 'FabricSetBlock': return indent + 'player.getWorld().setBlockState(new net.minecraft.util.math.BlockPos((int)' + (p.x || 0) + ', (int)' + (p.y || 64) + ', (int)' + (p.z || 0) + '), net.minecraft.block.Blocks.STONE.getDefaultState());\n';
            case 'FabricPlaySound': return indent + 'player.playSound(net.minecraft.registry.Registries.SOUND_EVENT.get(net.minecraft.util.Identifier.of("' + (p.ses || 'minecraft:entity.experience_orb.pickup') + '")), 1f, 1f);\n';
            case 'FabricRegisterItem': return indent + 'net.minecraft.registry.Registry.register(net.minecraft.registry.Registries.ITEM, net.minecraft.util.Identifier.of("mymod", "' + (p.id || 'my_item') + '"), new net.minecraft.item.Item(new net.minecraft.item.Item.Settings()));\n';
            case 'FabricRegisterBlock': return indent + 'net.minecraft.registry.Registry.register(net.minecraft.registry.Registries.BLOCK, net.minecraft.util.Identifier.of("mymod", "' + (p.id || 'my_block') + '"), new net.minecraft.block.Block(net.minecraft.block.AbstractBlock.Settings.create()));\n';
            case 'FabricIsOp': return branch('player.hasPermissionLevel(4)');
            case 'FabricHasPermission': return branch('me.lucko.fabric.api.permissions.v0.Permissions.check(player, "' + (p.perm || 'mymod.use') + '")');
            case 'FabricServerSide': return branch('!player.getWorld().isClient()');
            case 'FabricIf': return branch('true /* Insert Condition */');
            case 'FabricLoop': return indent + 'for (int i = 0; i < ' + (p.kez || 10) + '; i++) {\n' + indent + '    // loop body\n' + indent + '}\n';
            case 'FabricSchedule': return indent + '// Scheduled work based on server tick\n';
            default: return indent + '// ' + (node.label || node.blockId || 'node') + '\n';
        }
    }

    function generateFabricCode(graph) {
        const nodes = getNodes(graph);
        const connections = getConnections(graph);
        if (nodes.length === 0) return '// Henüz blok yok\n';

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

        const ctx = { nodes, connections, visited: new Set(), mode: 'fabric' };
        const eventNodes = nodes.filter((node) => isEventNode('fabric', node));
        for (const eventNode of eventNodes) {
            const eventType = FABRIC_EVENT_TYPES[eventNode.blockId];
            if (!eventType) continue;
            code += '        ' + eventType + '.register((';
            if (eventNode.blockId === 'FabricPlayerJoin' || eventNode.blockId === 'FabricPlayerQuit') {
                code += 'handler, player) -> {\n';
            } else if (eventNode.blockId === 'FabricServerStart' || eventNode.blockId === 'FabricServerStop') {
                code += 'server) -> {\n';
            } else {
                code += 'handler) -> {\n';
            }

            ctx.visited.clear();
            const firstNodeId = getNextNodeId(eventNode.id, 'out', connections);
            if (firstNodeId) {
                code += traverseTree(firstNodeId, '            ', ctx, generateFabricNodeCode);
            }
            code += '        });\n\n';
        }

        code += '    }\n}\n';
        return code;
    }

    function generateForgeNodeCode(node, indent, ctx) {
        const p = node.params || {};

        const branch = (conditionStr) => {
            let str = indent + 'if (' + conditionStr + ') {\n';
            const trueId = getNextNodeId(node.id, 'true', ctx.connections);
            if (trueId) str += traverseTree(trueId, indent + '    ', ctx, generateForgeNodeCode);
            str += indent + '} else {\n';
            const falseId = getNextNodeId(node.id, 'false', ctx.connections);
            if (falseId) str += traverseTree(falseId, indent + '    ', ctx, generateForgeNodeCode);
            str += indent + '}\n';
            return str;
        };

        switch (node.blockId) {
            case 'ForgeSendMsg': return indent + 'if (event.getEntity() instanceof net.minecraft.world.entity.player.Player player) {\n' + indent + '    player.sendSystemMessage(Component.literal("' + (p.mesaj || 'Merhaba!') + '"));\n' + indent + '}\n';
            case 'ForgeCancelEvent': return indent + 'event.setCanceled(true);\n';
            case 'ForgeTeleport': return indent + 'if (event.getEntity() instanceof net.minecraft.world.entity.player.Player player) {\n' + indent + '    player.teleportTo(' + (p.x || 0) + ', ' + (p.y || 64) + ', ' + (p.z || 0) + ');\n' + indent + '}\n';
            case 'ForgeGiveItem': return indent + '// player.getInventory().add(new ItemStack(...));\n';
            case 'ForgeRegisterItem': return indent + '// requires DeferredRegister for Item "' + (p.id || 'my_item') + '"\n';
            case 'ForgeRegisterBlock': return indent + '// requires DeferredRegister for Block "' + (p.id || 'my_block') + '"\n';
            case 'ForgeIsOp': return branch('event.getEntity() instanceof net.minecraft.world.entity.player.Player p && p.hasPermissions(4)');
            case 'ForgeHasCapability': return branch('/* Forge Has Capability Check */ false');
            case 'ForgeIf': return branch('true /* Insert Condition */');
            case 'ForgeLoop': return indent + 'for (int i = 0; i < ' + (p.kez || 10) + '; i++) {\n' + indent + '    // loop body\n' + indent + '}\n';
            default: return indent + '// ' + (node.label || node.blockId || 'node') + '\n';
        }
    }

    function generateForgeCode(graph) {
        const nodes = getNodes(graph);
        const connections = getConnections(graph);
        if (nodes.length === 0) return '// Henüz blok yok\n';

        let code = 'package me.craftide.mymod;\n\n';
        code += 'import net.minecraftforge.eventbus.api.*;\n';
        code += 'import net.minecraftforge.event.*;\n';
        code += 'import net.minecraftforge.event.entity.player.*;\n';
        code += 'import net.minecraftforge.event.level.*;\n';
        code += 'import net.minecraftforge.fml.common.Mod;\n';
        code += 'import net.minecraft.network.chat.Component;\n\n';
        code += '@Mod("mymod")\npublic class MyMod {\n\n';
        code += '    public MyMod() {\n        net.minecraftforge.common.MinecraftForge.EVENT_BUS.register(this);\n    }\n\n';

        const ctx = { nodes, connections, visited: new Set(), mode: 'forge' };
        const eventNodes = nodes.filter((node) => isEventNode('forge', node));
        for (const eventNode of eventNodes) {
            const eventType = FORGE_EVENT_TYPES[eventNode.blockId];
            if (!eventType) continue;
            code += '    @SubscribeEvent\n';
            code += '    public void on' + eventNode.blockId + '(' + eventType + ' event) {\n';

            ctx.visited.clear();
            const firstNodeId = getNextNodeId(eventNode.id, 'out', connections);
            if (firstNodeId) {
                code += traverseTree(firstNodeId, '        ', ctx, generateForgeNodeCode);
            }
            code += '    }\n\n';
        }

        code += '}\n';
        return code;
    }

    function generateSkriptNodeCode(node, indent, ctx) {
        const p = node.params || {};

        const branch = (conditionStr) => {
            let str = indent + 'if ' + conditionStr + ':\n';
            const trueId = getNextNodeId(node.id, 'true', ctx.connections);
            if (trueId) str += traverseTree(trueId, indent + '    ', ctx, generateSkriptNodeCode);
            str += indent + 'else:\n';
            const falseId = getNextNodeId(node.id, 'false', ctx.connections);
            if (falseId) str += traverseTree(falseId, indent + '    ', ctx, generateSkriptNodeCode);
            return str;
        };

        switch (node.blockId) {
            case 'SkHasPerm': return branch('player has permission "' + (p.perm || 'skript.use') + '"');
            case 'SkIsOp': return branch('player is op');
            case 'SkHasItem': return branch('player has ' + (p.item || 'diamond'));
            case 'SkHealthCheck': return branch('health of player >= ' + (p.deger || 10));
            case 'SkWorldCheck': return branch('world is "' + (p.dunya || 'world') + '"');
            case 'SkIf': return branch('true');
            case 'SkSendMsg': return indent + 'send "' + (p.mesaj || 'Merhaba!') + '" to player\n';
            case 'SkBroadcast': return indent + 'broadcast "' + (p.mesaj || 'Duyuru!') + '"\n';
            case 'SkTeleport': return indent + 'teleport player to location(' + (p.x || 0) + ', ' + (p.y || 64) + ', ' + (p.z || 0) + ', world)\n';
            case 'SkGiveItem': return indent + 'give ' + (p.adet || 1) + ' ' + (p.item || 'diamond') + ' to player\n';
            case 'SkPlaySound': return indent + 'play sound "' + (p.ses || 'entity.experience_orb.pickup') + '" to player\n';
            case 'SkKick': return indent + 'kick player due to "' + (p.sebep || 'Banned') + '"\n';
            case 'SkSetGamemode': return indent + 'set gamemode of player to ' + (p.mod || 'creative') + '\n';
            case 'SkCancel': return indent + 'cancel event\n';
            case 'SkSpawn': return indent + 'spawn a ' + (p.entity || 'zombie') + ' at player\n';
            case 'SkLoop': return indent + 'loop ' + (p.kez || 10) + ' times:\n';
            case 'SkWait': return indent + 'wait ' + (p.sure || '1 second') + '\n';
            case 'SkLoopPlayers': return indent + 'loop all players:\n';
            case 'SkGUIOpen': return indent + '# inventory open guard\n';
            case 'SkGUISend': return indent + 'open chest with ' + (p.satir || 3) + ' rows named "' + (p.baslik || 'Shop') + '" to player\n';
            case 'SkWaitDelay': return indent + 'wait ' + (p.sure || '5 seconds') + '\n';
            case 'SkScheduleRepeat': return indent + 'every ' + (p.aralik || '1 minute') + ':\n';
            case 'SkVarSet': return indent + 'set ' + (p.degisken || '{var}') + ' to ' + (p.deger || '0') + '\n';
            case 'SkVarGet': return indent + '# get ' + (p.degisken || '{var}') + '\n';
            case 'SkVarAdd': return indent + 'add ' + (p.miktar || 10) + ' to ' + (p.degisken || '{coins.%player%}') + '\n';
            case 'SkVaultBalance': return indent + '# set {_bal} to vault balance of ' + (p.hedef || 'player') + '\n';
            case 'SkVaultGive': return indent + '# add ' + (p.miktar || 100) + ' to vault balance of player\n';
            case 'SkVaultTake': return indent + '# remove ' + (p.miktar || 100) + ' from vault balance of player\n';
            case 'SkDBConnect': return indent + '# connect to ' + (p.type || 'sqlite') + ' database "' + (p.db || 'mydb') + '"\n';
            case 'SkDBUpdate': return indent + '# execute update "' + (p.query || '') + '"\n';
            default: return indent + '# ' + (node.label || node.blockId || 'node') + '\n';
        }
    }

    function generateSkriptCode(graph) {
        const nodes = getNodes(graph);
        const connections = getConnections(graph);
        if (nodes.length === 0) return '# Henüz blok yok\n';

        let code = '# CraftIDE Görsel Builder - Skript Kodu\n# Düzenle ve scripts/ klasörüne kopyala\n\n';
        const eventNodes = nodes.filter((node) => isEventNode('skript', node));

        const ctx = { nodes, connections, visited: new Set(), mode: 'skript' };

        for (const eventNode of eventNodes) {
            ctx.visited.clear();

            if (eventNode.blockId === 'SkCommand') {
                code += 'command ' + ((eventNode.params && eventNode.params.komut) || '/mycommand') + ':\n';
                code += '    trigger:\n';
                const firstNodeId = getNextNodeId(eventNode.id, 'out', connections);
                if (firstNodeId) {
                    code += traverseTree(firstNodeId, '        ', ctx, generateSkriptNodeCode);
                }
            } else {
                const eventType = SKRIPT_EVENT_TYPES[eventNode.blockId];
                if (!eventType) continue;
                code += eventType + ':\n';
                const firstNodeId = getNextNodeId(eventNode.id, 'out', connections);
                if (firstNodeId) {
                    code += traverseTree(firstNodeId, '    ', ctx, generateSkriptNodeCode);
                }
            }
            code += '\n';
        }

        return code;
    }

    function generateFromGraph(graph, options) {
        const mode = normalizeMode((options && options.mode) || (graph && graph.mode) || 'plugin');
        switch (mode) {
            case 'plugin': return generatePluginCode(graph || {});
            case 'fabric': return generateFabricCode(graph || {});
            case 'forge': return generateForgeCode(graph || {});
            case 'skript': return generateSkriptCode(graph || {});
            default: return generatePluginCode(graph || {});
        }
    }

    const api = { generateFromGraph };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (typeof window !== 'undefined') {
        window.CraftIDEVBCodegen = api;
    }
})();
