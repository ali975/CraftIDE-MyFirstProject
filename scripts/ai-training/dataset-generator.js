const fs = require('fs');
const path = require('path');

// Temel Şablonlar (Q&A)
const SPIGOT_TEMPLATES = [
    {
        q_en: "How do I create a Spigot plugin that listens to the {EVENT_NAME}?",
        q_tr: "Spigot'ta {EVENT_NAME} olayını dinleyen bir plugin nasıl yaparım?",
        a_en: "To listen to the {EVENT_NAME} in Spigot, implement the `Listener` interface and use the `@EventHandler` annotation.\n\n```java\npackage me.craftide.plugin;\n\nimport org.bukkit.event.EventHandler;\nimport org.bukkit.event.Listener;\nimport {EVENT_CLASS};\nimport org.bukkit.plugin.java.JavaPlugin;\n\npublic class MyPlugin extends JavaPlugin implements Listener {\n    @Override\n    public void onEnable() {\n        getServer().getPluginManager().registerEvents(this, this);\n    }\n\n    @EventHandler\n    public void onEvent({EVENT_CLASS_NAME} event) {\n        // Handle event here\n    }\n}\n```",
        a_tr: "Spigot'ta {EVENT_NAME} olayını dinlemek için `Listener` arayüzünü uygulayın ve `@EventHandler` kullanın.\n\n```java\npackage me.craftide.plugin;\n\nimport org.bukkit.event.EventHandler;\nimport org.bukkit.event.Listener;\nimport {EVENT_CLASS};\nimport org.bukkit.plugin.java.JavaPlugin;\n\npublic class MyPlugin extends JavaPlugin implements Listener {\n    @Override\n    public void onEnable() {\n        getServer().getPluginManager().registerEvents(this, this);\n    }\n\n    @EventHandler\n    public void onEvent({EVENT_CLASS_NAME} event) {\n        // Olayı burada işleyin\n    }\n}\n```"
    },
    {
        q_en: "Give a player {ITEM_COUNT} {ITEM_NAME} when they type /{COMMAND_NAME}",
        q_tr: "/{COMMAND_NAME} yazdıklarında oyuncuya {ITEM_COUNT} adet {ITEM_NAME} veren komut kodu",
        a_en: "You can achieve this by overriding `onCommand` in your JavaPlugin class or creating a `CommandExecutor`.\n\n```java\n@Override\npublic boolean onCommand(CommandSender sender, Command command, String label, String[] args) {\n    if (command.getName().equalsIgnoreCase(\"{COMMAND_NAME}\")) {\n        if (sender instanceof Player player) {\n            ItemStack item = new ItemStack(Material.{ITEM_ENUM}, {ITEM_COUNT});\n            player.getInventory().addItem(item);\n            player.sendMessage(\"You received the items!\");\n            return true;\n        }\n    }\n    return false;\n}\n```",
        a_tr: "Bunu JavaPlugin sınıfınızda `onCommand` metodunu ezerek veya bir `CommandExecutor` oluşturarak yapabilirsiniz.\n\n```java\n@Override\npublic boolean onCommand(CommandSender sender, Command command, String label, String[] args) {\n    if (command.getName().equalsIgnoreCase(\"{COMMAND_NAME}\")) {\n        if (sender instanceof Player player) {\n            ItemStack item = new ItemStack(Material.{ITEM_ENUM}, {ITEM_COUNT});\n            player.getInventory().addItem(item);\n            player.sendMessage(\"Eşyaları aldın!\");\n            return true;\n        }\n    }\n    return false;\n}\n```"
    }
];

const SKRIPT_TEMPLATES = [
    {
        q_en: "Write a Skript that broadcasts '{MESSAGE}' when someone types /{COMMAND_NAME}",
        q_tr: "Biri /{COMMAND_NAME} yazdığında '{MESSAGE}' duyurusu geçen Skript",
        a_en: "Here is the Skript code for your command:\n\n```skript\ncommand /{COMMAND_NAME}:\n    trigger:\n        broadcast \"{MESSAGE}\"\n```",
        a_tr: "Bu komut için gereken Skript kodu aşağıdadır:\n\n```skript\ncommand /{COMMAND_NAME}:\n    trigger:\n        broadcast \"{MESSAGE}\"\n```"
    },
    {
        q_en: "How to give a player {ITEM_COUNT} {ITEM_NAME} on join in Skript?",
        q_tr: "Skript ile oyuncu oyuna girince nasıl {ITEM_COUNT} {ITEM_NAME} verilir?",
        a_en: "Use the `on join` event in Skript:\n\n```skript\non join:\n    give {ITEM_COUNT} {ITEM_NAME} to player\n```",
        a_tr: "Skript'te `on join` olayını kullanın:\n\n```skript\non join:\n    give {ITEM_COUNT} {ITEM_NAME} to player\n```"
    }
];

// Değişken Setleri
const SPIGOT_EVENTS = [
    { name: "Player Join Event", cls: "org.bukkit.event.player.PlayerJoinEvent", clsName: "PlayerJoinEvent" },
    { name: "Block Break Event", cls: "org.bukkit.event.block.BlockBreakEvent", clsName: "BlockBreakEvent" },
    { name: "Entity Damage Event", cls: "org.bukkit.event.entity.EntityDamageEvent", clsName: "EntityDamageEvent" },
    { name: "Player Death Event", cls: "org.bukkit.event.entity.PlayerDeathEvent", clsName: "PlayerDeathEvent" }
];

const ITEMS = [
    { name: "diamonds", enm: "DIAMOND", sk: "diamond" },
    { name: "iron ingots", enm: "IRON_INGOT", sk: "iron ingot" },
    { name: "emerald", enm: "EMERALD", sk: "emerald" },
    { name: "golden apples", enm: "GOLDEN_APPLE", sk: "golden apple" }
];

const COUNTS = [1, 5, 10, 32, 64];

const COMMANDS = ["kit", "reward", "daily", "free", "claim", "start", "info"];

const MESSAGES = ["Welcome back!", "A player joined!", "Don't forget to read the rules.", "Server is restarting soon!"];

// Üretilecek verileri toplayacağımız dizi
const dataset = [];

function addEntry(instruction, response) {
    dataset.push({
        messages: [
            { role: "user", content: instruction },
            { role: "assistant", content: response }
        ]
    });
}

console.log("Generating dataset...");

// Spigot Event Permütasyonları
SPIGOT_TEMPLATES.forEach(tpl => {
    if (tpl.q_en.includes("{EVENT_NAME}")) {
        SPIGOT_EVENTS.forEach(ev => {
            let q_en = tpl.q_en.replace(/{EVENT_NAME}/g, ev.name);
            let q_tr = tpl.q_tr.replace(/{EVENT_NAME}/g, ev.name);
            let a_en = tpl.a_en.replace(/{EVENT_CLASS}/g, ev.cls).replace(/{EVENT_CLASS_NAME}/g, ev.clsName);
            let a_tr = tpl.a_tr.replace(/{EVENT_CLASS}/g, ev.cls).replace(/{EVENT_CLASS_NAME}/g, ev.clsName);
            addEntry(q_en, a_en);
            addEntry(q_tr, a_tr);
        });
    }

    if (tpl.q_en.includes("{ITEM_COUNT}")) {
        ITEMS.forEach(item => {
            COUNTS.forEach(count => {
                COMMANDS.forEach(cmd => {
                    let q_en = tpl.q_en.replace(/{ITEM_COUNT}/g, count).replace(/{ITEM_NAME}/g, item.name).replace(/{COMMAND_NAME}/g, cmd);
                    let q_tr = tpl.q_tr.replace(/{ITEM_COUNT}/g, count).replace(/{ITEM_NAME}/g, item.name).replace(/{COMMAND_NAME}/g, cmd);
                    let a_en = tpl.a_en.replace(/{ITEM_COUNT}/g, count).replace(/{ITEM_ENUM}/g, item.enm).replace(/{COMMAND_NAME}/g, cmd);
                    let a_tr = tpl.a_tr.replace(/{ITEM_COUNT}/g, count).replace(/{ITEM_ENUM}/g, item.enm).replace(/{COMMAND_NAME}/g, cmd);
                    addEntry(q_en, a_en);
                    addEntry(q_tr, a_tr);
                });
            });
        });
    }
});

// Skript Permütasyonları
SKRIPT_TEMPLATES.forEach(tpl => {
    if (tpl.q_en.includes("{MESSAGE}")) {
        MESSAGES.forEach(msg => {
            COMMANDS.forEach(cmd => {
                let q_en = tpl.q_en.replace(/{MESSAGE}/g, msg).replace(/{COMMAND_NAME}/g, cmd);
                let q_tr = tpl.q_tr.replace(/{MESSAGE}/g, msg).replace(/{COMMAND_NAME}/g, cmd);
                let a_en = tpl.a_en.replace(/{MESSAGE}/g, msg).replace(/{COMMAND_NAME}/g, cmd);
                let a_tr = tpl.a_tr.replace(/{MESSAGE}/g, msg).replace(/{COMMAND_NAME}/g, cmd);
                addEntry(q_en, a_en);
                addEntry(q_tr, a_tr);
            });
        });
    }

    if (tpl.q_en.includes("{ITEM_COUNT}")) {
        ITEMS.forEach(item => {
            COUNTS.forEach(count => {
                let q_en = tpl.q_en.replace(/{ITEM_COUNT}/g, count).replace(/{ITEM_NAME}/g, item.sk);
                let q_tr = tpl.q_tr.replace(/{ITEM_COUNT}/g, count).replace(/{ITEM_NAME}/g, item.sk);
                let a_en = tpl.a_en.replace(/{ITEM_COUNT}/g, count).replace(/{ITEM_NAME}/g, item.sk);
                let a_tr = tpl.a_tr.replace(/{ITEM_COUNT}/g, count).replace(/{ITEM_NAME}/g, item.sk);
                addEntry(q_en, a_en);
                addEntry(q_tr, a_tr);
            });
        });
    }
});

// CraftIDE Specific Synthetic Data
const CRAFTIDE_FAQS = [
    {
        user: "How do I use the Visual Builder in CraftIDE?",
        asst: "To use the Visual Builder in CraftIDE, open a Visual Blueprint (.vbp) file. You can drag and drop blocks from the node list on the right, connect their data and execution ports with your mouse, and generate Spigot/Fabric/Forge or Skript structure automatically."
    },
    {
        user: "CraftIDE'de görsel yapıcı nasıl kullanılır?",
        asst: "CraftIDE'de Görsel Yapıcı'yı (Visual Builder) kullanmak için bir Visual Blueprint (.vbp) dosyası açın. Sağdaki listeden blokları sürükleyip bırakabilir, kablolarla portları birbirine bağlayabilir ve tek tıkla Spigot, Fabric veya Skript kodunuzu üretebilirsiniz."
    },
    {
        user: "Write a CraftIDE Visual Builder definition for a Spigot kill command.",
        asst: "In CraftIDE's Visual Builder, you would use a `CommandBlock` connected to a `KillPlayer` action. Alternatively, in standard Spigot code:\n```java\nif(cmd.getName().equalsIgnoreCase(\"kill\")) {\n    player.setHealth(0);\n    return true;\n}\n```"
    }
];

CRAFTIDE_FAQS.forEach(faq => addEntry(faq.user, faq.asst));

// Karıştırma (Shuffle)
dataset.sort(() => Math.random() - 0.5);

// GGUF model training requires JSONL
const outputFilePath = path.join(__dirname, 'dataset.jsonl');
let fileContent = '';

dataset.forEach(entry => {
    fileContent += JSON.stringify(entry) + '\n';
});

fs.writeFileSync(outputFilePath, fileContent, 'utf-8');
console.log(`Generated ${dataset.length} samples at ${outputFilePath}`);
