/**
 * CraftIDE — Chest GUI Builder
 * Minecraft envanter GUI'lerini görsel olarak tasarla, koda dönüştür
 */

// ═══════════════════════════════════════════════════════════
// Durum
// ═══════════════════════════════════════════════════════════

let gbSlots = [];          // Slot nesneleri: { material, name, lore, clickAction, clickValue }
let gbRows = 3;            // Satır sayısı (1-6)
let gbSelectedSlot = null; // Seçili slot indeksi
let gbInitialized = false;

// Minecraft malzemeleri (yaygın 120 malzeme)
const GB_MATERIALS = [
    'AIR', 'STONE', 'GRASS_BLOCK', 'DIRT', 'COBBLESTONE', 'OAK_PLANKS', 'SAND', 'GRAVEL',
    'GOLD_ORE', 'IRON_ORE', 'COAL_ORE', 'DIAMOND_ORE', 'EMERALD_ORE', 'LAPIS_ORE', 'REDSTONE_ORE',
    'OAK_LOG', 'SPRUCE_LOG', 'BIRCH_LOG', 'JUNGLE_LOG', 'ACACIA_LOG', 'DARK_OAK_LOG',
    'OAK_LEAVES', 'GLASS', 'LADDER', 'CHEST', 'FURNACE', 'CRAFTING_TABLE', 'BOOKSHELF',
    'TNT', 'TORCH', 'IRON_BLOCK', 'GOLD_BLOCK', 'DIAMOND_BLOCK', 'EMERALD_BLOCK', 'COAL_BLOCK',
    'LAPIS_BLOCK', 'REDSTONE_BLOCK', 'NETHERITE_BLOCK', 'OBSIDIAN', 'BEDROCK', 'BARRIER',
    'DIAMOND', 'EMERALD', 'GOLD_INGOT', 'IRON_INGOT', 'NETHERITE_INGOT', 'COAL', 'LAPIS_LAZULI',
    'REDSTONE', 'STICK', 'BONE', 'STRING', 'FEATHER', 'GUNPOWDER', 'ARROW', 'FLINT',
    'APPLE', 'GOLDEN_APPLE', 'ENCHANTED_GOLDEN_APPLE', 'BREAD', 'COOKED_BEEF', 'COOKED_CHICKEN',
    'COOKED_PORKCHOP', 'COOKED_MUTTON', 'COOKED_RABBIT', 'COOKED_SALMON', 'COOKED_COD',
    'CAKE', 'COOKIE', 'PUMPKIN_PIE', 'MUSHROOM_STEW', 'RABBIT_STEW',
    'WOODEN_SWORD', 'STONE_SWORD', 'IRON_SWORD', 'GOLDEN_SWORD', 'DIAMOND_SWORD', 'NETHERITE_SWORD',
    'WOODEN_AXE', 'STONE_AXE', 'IRON_AXE', 'DIAMOND_AXE', 'NETHERITE_AXE',
    'WOODEN_PICKAXE', 'STONE_PICKAXE', 'IRON_PICKAXE', 'DIAMOND_PICKAXE', 'NETHERITE_PICKAXE',
    'WOODEN_SHOVEL', 'STONE_SHOVEL', 'IRON_SHOVEL', 'DIAMOND_SHOVEL', 'NETHERITE_SHOVEL',
    'LEATHER_HELMET', 'CHAINMAIL_HELMET', 'IRON_HELMET', 'GOLDEN_HELMET', 'DIAMOND_HELMET', 'NETHERITE_HELMET',
    'LEATHER_CHESTPLATE', 'IRON_CHESTPLATE', 'DIAMOND_CHESTPLATE', 'NETHERITE_CHESTPLATE',
    'LEATHER_LEGGINGS', 'IRON_LEGGINGS', 'DIAMOND_LEGGINGS', 'NETHERITE_LEGGINGS',
    'LEATHER_BOOTS', 'IRON_BOOTS', 'DIAMOND_BOOTS', 'NETHERITE_BOOTS',
    'BOW', 'CROSSBOW', 'TRIDENT', 'SHIELD', 'TOTEM_OF_UNDYING', 'ENDER_PEARL', 'EYE_OF_ENDER',
    'BLAZE_ROD', 'GHAST_TEAR', 'NETHER_STAR', 'DRAGON_EGG', 'ELYTRA',
    'NAME_TAG', 'LEAD', 'SADDLE', 'BOOK', 'BOOK_AND_QUILL', 'WRITABLE_BOOK',
    'MAP', 'FILLED_MAP', 'COMPASS', 'CLOCK', 'SPYGLASS',
    'WHITE_WOOL', 'RED_WOOL', 'GREEN_WOOL', 'BLUE_WOOL', 'YELLOW_WOOL', 'ORANGE_WOOL', 'PURPLE_WOOL', 'BLACK_WOOL',
    'WHITE_STAINED_GLASS', 'RED_STAINED_GLASS', 'GREEN_STAINED_GLASS', 'BLUE_STAINED_GLASS', 'YELLOW_STAINED_GLASS',
    'WHITE_STAINED_GLASS_PANE', 'RED_STAINED_GLASS_PANE', 'GREEN_STAINED_GLASS_PANE', 'BLUE_STAINED_GLASS_PANE',
    'YELLOW_STAINED_GLASS_PANE', 'BLACK_STAINED_GLASS_PANE', 'LIME_STAINED_GLASS_PANE',
];

// Malzeme → kısa etiket (slot içinde gösterilir)
function gbShortLabel(material) {
    if (!material || material === 'AIR') return '';
    const parts = material.split('_');
    if (parts.length === 1) return material.slice(0, 3).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 4);
}

// ═══════════════════════════════════════════════════════════
// Başlatma
// ═══════════════════════════════════════════════════════════

function initGuiBuilder() {
    if (gbInitialized) { gbRenderGrid(); return; }
    gbInitialized = true;

    // Satır sayısı
    gbSlots = Array(gbRows * 9).fill(null).map(() => ({ material: '', name: '', lore: '', clickAction: 'none', clickValue: '' }));

    // Datalist doldur
    const dl = document.getElementById('gb-materials-list');
    if (dl) {
        GB_MATERIALS.forEach(m => {
            const o = document.createElement('option');
            o.value = m;
            dl.appendChild(o);
        });
    }

    // Satır seçici
    const rowsSel = document.getElementById('gb-rows-select');
    if (rowsSel) {
        rowsSel.value = String(gbRows);
        rowsSel.addEventListener('change', () => {
            const newRows = parseInt(rowsSel.value);
            if (newRows !== gbRows) {
                gbRows = newRows;
                const newSlots = Array(gbRows * 9).fill(null).map((_, i) =>
                    gbSlots[i] || { material: '', name: '', lore: '', clickAction: 'none', clickValue: '' }
                );
                gbSlots = newSlots;
                gbSelectedSlot = null;
                document.getElementById('gb-config-panel').style.display = 'none';
                gbRenderGrid();
            }
        });
    }

    // Uygula butonu
    document.getElementById('btn-gb-apply-slot')?.addEventListener('click', gbApplySlotConfig);

    // VB'ye aktar
    document.getElementById('btn-gb-export-vb')?.addEventListener('click', gbExportToVB);

    // Kodu üret
    document.getElementById('btn-gb-generate-code')?.addEventListener('click', gbGenerateCode);

    // Temizle
    document.getElementById('btn-gb-clear-gb')?.addEventListener('click', () => {
        gbSlots = gbSlots.map(() => ({ material: '', name: '', lore: '', clickAction: 'none', clickValue: '' }));
        gbSelectedSlot = null;
        document.getElementById('gb-config-panel').style.display = 'none';
        gbRenderGrid();
        if (typeof showNotification === 'function') showNotification('🗑️ ' + (typeof tr === 'function' ? tr('msg.guiCleared', 'GUI cleared') : 'GUI cleared'), 'info');
    });

    gbRenderGrid();
}

// ═══════════════════════════════════════════════════════════
// Grid Oluşturma
// ═══════════════════════════════════════════════════════════

function gbRenderGrid() {
    const grid = document.getElementById('gb-chest-grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(9, 52px)';

    for (let i = 0; i < gbRows * 9; i++) {
        const slot = gbSlots[i];
        const div = document.createElement('div');
        div.className = 'gb-slot' + (slot && slot.material ? ' filled' : '') + (i === gbSelectedSlot ? ' selected' : '');
        div.dataset.slotIdx = i;
        div.title = slot && slot.material ? slot.material + (slot.name ? '\n' + slot.name : '') : (typeof tr === 'function' ? tr('ui.gui.hint', 'Click slot') : 'Empty slot');

        if (slot && slot.material) {
            const lbl = document.createElement('div');
            lbl.style.cssText = 'font-size:10px;font-weight:700;text-align:center;line-height:1.1;overflow:hidden;max-width:48px;';
            lbl.textContent = gbShortLabel(slot.material);
            div.appendChild(lbl);
            if (slot.name) {
                const nm = document.createElement('div');
                nm.style.cssText = 'font-size:8px;color:#a8d8a8;text-align:center;margin-top:1px;overflow:hidden;max-width:48px;white-space:nowrap;text-overflow:ellipsis;';
                nm.textContent = slot.name.replace(/&[0-9a-fk-or]/g, '');
                div.appendChild(nm);
            }
        } else {
            div.style.color = '#4a5568';
            div.style.fontSize = '18px';
            div.textContent = '+';
        }

        div.addEventListener('click', () => gbSelectSlot(i));
        grid.appendChild(div);
    }
}

// ═══════════════════════════════════════════════════════════
// Slot Seçme & Konfigürasyon
// ═══════════════════════════════════════════════════════════

function gbSelectSlot(index) {
    gbSelectedSlot = index;
    const slot = gbSlots[index] || {};
    const panel = document.getElementById('gb-config-panel');
    if (!panel) return;
    panel.style.display = 'flex';

    const matInp = document.getElementById('gb-item-material');
    const nameInp = document.getElementById('gb-item-name');
    const loreInp = document.getElementById('gb-item-lore');
    const actionSel = document.getElementById('gb-click-action');
    const valInp = document.getElementById('gb-click-value');

    if (matInp) matInp.value = slot.material || '';
    if (nameInp) nameInp.value = slot.name || '';
    if (loreInp) loreInp.value = slot.lore || '';
    if (actionSel) actionSel.value = slot.clickAction || 'none';
    if (valInp) valInp.value = slot.clickValue || '';

    // Slot başlığını güncelle
    const slotTitle = document.getElementById('gb-slot-title');
    if (slotTitle) slotTitle.textContent = 'Slot ' + index + ' (Row ' + Math.floor(index / 9 + 1) + ', Col ' + (index % 9 + 1) + ')';

    gbRenderGrid();
}

function gbApplySlotConfig() {
    if (gbSelectedSlot === null) return;
    const slot = gbSlots[gbSelectedSlot];
    if (!slot) return;

    slot.material = (document.getElementById('gb-item-material')?.value || '').toUpperCase().trim();
    slot.name = document.getElementById('gb-item-name')?.value || '';
    slot.lore = document.getElementById('gb-item-lore')?.value || '';
    slot.clickAction = document.getElementById('gb-click-action')?.value || 'none';
    slot.clickValue = document.getElementById('gb-click-value')?.value || '';

    gbRenderGrid();
    if (typeof showNotification === 'function') showNotification('✅ ' + (typeof tr === 'function' ? tr('msg.slotUpdated', 'Slot updated!') : 'Slot updated!'), 'success');
}

// ═══════════════════════════════════════════════════════════
// VB'ye Aktar
// ═══════════════════════════════════════════════════════════

function gbExportToVB() {
    if (typeof vbClearCanvas !== 'function' || typeof createNode !== 'function') {
        if (typeof showNotification === 'function') showNotification('❌ ' + (typeof tr === 'function' ? tr('msg.visualBuilderNotLoaded', 'Visual Builder is not loaded!') : 'Visual Builder not loaded!'), 'error');
        return;
    }

    const title = document.getElementById('gb-gui-title')?.value || 'Shop';
    vbClearCanvas();

    let x = 80, y = 80;
    const nodeIds = [];

    // 1. GUIClickEvent tetikleyici
    const evNode = createNode('GUIClickEvent', x, y);
    if (evNode) { evNode.params.envanter = title; nodeIds.push(evNode.id); }
    x += 240;

    // 2. CreateGUI
    const cgNode = createNode('CreateGUI', x, y);
    if (cgNode) { cgNode.params.baslik = title; cgNode.params.satir = String(gbRows); nodeIds.push(cgNode.id); }
    x += 240;

    // 3. Dolu slotlar için SetGUIItem
    const filledSlots = gbSlots.map((s, i) => ({ ...s, idx: i })).filter(s => s.material && s.material !== 'AIR');
    for (const fs of filledSlots) {
        const sNode = createNode('SetGUIItem', x, y);
        if (sNode) {
            sNode.params.slot = String(fs.idx);
            sNode.params.material = fs.material;
            sNode.params.isim = fs.name || fs.material;
            nodeIds.push(sNode.id);
            x += 220;
            if (x > 1400) { x = 320; y += 160; }
        }
    }

    // 4. OpenGUI
    const ogNode = createNode('OpenGUI', x, y);
    if (ogNode) { ogNode.params.envanter = 'inv'; nodeIds.push(ogNode.id); }

    // Bağlantıları kur (zincir)
    for (let i = 0; i < nodeIds.length - 1; i++) {
        if (typeof vbConnections !== 'undefined') {
            vbConnections.push({ from: nodeIds[i], to: nodeIds[i + 1] });
        }
    }
    if (typeof drawConnections === 'function') drawConnections();

    // VB tab'ına geç
    if (typeof openFile === 'function') openFile('visual-builder://tab', 'Görsel Builder');
    if (typeof showNotification === 'function') showNotification('🧩 ' + (typeof tr === 'function' ? tr('msg.guiExported', 'GUI exported to Visual Builder!') : 'GUI exported!'), 'success');
}

// ═══════════════════════════════════════════════════════════
// Java Kodu Üretimi
// ═══════════════════════════════════════════════════════════

function gbGenerateCode() {
    const title = document.getElementById('gb-gui-title')?.value || 'MyGUI';
    const className = title.replace(/[^a-zA-Z0-9]/g, '') + 'GUI';
    const filledSlots = gbSlots.map((s, i) => ({ ...s, idx: i })).filter(s => s.material && s.material !== 'AIR');

    let code = 'package me.craftide.myplugin.gui;\n\n';
    code += 'import org.bukkit.*;\nimport org.bukkit.entity.Player;\n';
    code += 'import org.bukkit.event.EventHandler;\nimport org.bukkit.event.Listener;\n';
    code += 'import org.bukkit.event.inventory.InventoryClickEvent;\n';
    code += 'import org.bukkit.inventory.*;\nimport org.bukkit.inventory.meta.ItemMeta;\n';
    code += 'import java.util.Arrays;\n\n';
    code += 'public class ' + className + ' implements Listener {\n\n';
    code += '    private static final String TITLE = "' + title + '";\n';
    code += '    private static final int ROWS = ' + gbRows + ';\n\n';
    code += '    public void open(Player player) {\n';
    code += '        Inventory inv = Bukkit.createInventory(null, ROWS * 9, TITLE);\n';

    for (const fs of filledSlots) {
        const loreLines = fs.lore ? fs.lore.split('\n').filter(l => l.trim()) : [];
        code += '        {\n';
        code += '            ItemStack item = new ItemStack(Material.' + fs.material + ');\n';
        code += '            ItemMeta meta = item.getItemMeta();\n';
        code += '            if (meta != null) {\n';
        code += '                meta.setDisplayName(ChatColor.translateAlternateColorCodes(\'&\', "' + (fs.name || fs.material) + '"));\n';
        if (loreLines.length > 0) {
            code += '                meta.setLore(Arrays.asList(' + loreLines.map(l => '"' + l.replace(/"/g, '\\"') + '"').join(', ') + '));\n';
        }
        code += '                item.setItemMeta(meta);\n';
        code += '            }\n';
        code += '            inv.setItem(' + fs.idx + ', item);\n';
        code += '        }\n';
    }

    code += '        player.openInventory(inv);\n';
    code += '    }\n\n';

    // Click handler
    code += '    @EventHandler\n';
    code += '    public void onInventoryClick(InventoryClickEvent event) {\n';
    code += '        if (!event.getView().getTitle().equals(TITLE)) return;\n';
    code += '        event.setCancelled(true);\n';
    code += '        if (!(event.getWhoClicked() instanceof Player)) return;\n';
    code += '        Player player = (Player) event.getWhoClicked();\n';
    code += '        int slot = event.getSlot();\n';

    const clickable = filledSlots.filter(fs => fs.clickAction && fs.clickAction !== 'none');
    if (clickable.length > 0) {
        code += '        switch (slot) {\n';
        for (const fs of clickable) {
            code += '            case ' + fs.idx + ':\n';
            if (fs.clickAction === 'command') {
                code += '                Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "' + (fs.clickValue || 'say test') + '".replace("{player}", player.getName()));\n';
            } else if (fs.clickAction === 'give') {
                code += '                player.getInventory().addItem(new ItemStack(Material.' + (fs.material || 'DIAMOND') + '));\n';
            } else if (fs.clickAction === 'close') {
                code += '                player.closeInventory();\n';
            }
            code += '                break;\n';
        }
        code += '        }\n';
    }
    code += '    }\n}\n';

    // Üretilen kodu tab'da aç
    const virtualPath = 'generated://' + className + '.java';
    if (typeof openFiles !== 'undefined' && typeof addTab === 'function' && typeof activateTab === 'function') {
        openFiles.set(virtualPath, { content: code, modified: false, virtual: true, generated: true });
        const existing = document.querySelector(`.tab[data-tab="${CSS.escape(virtualPath)}"]`);
        if (existing) existing.remove();
        addTab(virtualPath, className + '.java');
        activateTab(virtualPath);
        if (typeof showNotification === 'function') showNotification('⚡ ' + (typeof tr === 'function' ? tr('msg.guiCodeGenerated', 'GUI code generated!') : 'GUI code generated!'), 'success');
    }
}

// Global erişim için
window.initGuiBuilder = initGuiBuilder;
