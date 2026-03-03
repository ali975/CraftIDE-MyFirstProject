/**
 * CraftIDE — Custom Item & Recipe Creator
 * Minecraft crafting tariflerini görsel olarak oluştur
 */

let rcGrid = Array(9).fill(null).map(() => ({ material: '', count: 1 }));
let rcResult = { material: 'DIAMOND_SWORD', name: '', lore: '', count: 1, enchants: [] };
let rcType = 'shaped';
let rcSelectedCell = null; // 0-8 = grid, 9 = result
let rcInitialized = false;

// En yaygın Minecraft malzemeleri (crafting için)
const RC_MATERIALS = [
    'AIR','STICK','STRING','IRON_INGOT','GOLD_INGOT','DIAMOND','NETHERITE_INGOT',
    'COAL','LAPIS_LAZULI','REDSTONE','EMERALD','COPPER_INGOT','AMETHYST_SHARD',
    'WOOD','OAK_PLANKS','SPRUCE_PLANKS','BIRCH_PLANKS','JUNGLE_PLANKS','ACACIA_PLANKS','DARK_OAK_PLANKS',
    'OAK_LOG','SPRUCE_LOG','BIRCH_LOG','STONE','COBBLESTONE','SMOOTH_STONE','DEEPSLATE',
    'IRON_BLOCK','GOLD_BLOCK','DIAMOND_BLOCK','NETHERITE_BLOCK','COAL_BLOCK',
    'LEATHER','RABBIT_HIDE','WOOL','FEATHER','BONE','BONE_MEAL','BLAZE_ROD','BLAZE_POWDER',
    'ENDER_PEARL','ENDER_EYE','NETHER_STAR','GHAST_TEAR','SLIME_BALL',
    'GLASS','GLASS_PANE','SAND','GRAVEL','CLAY','CLAY_BALL','BRICK','NETHER_BRICK',
    'GUNPOWDER','PAPER','BOOK','BOWL','BUCKET','WATER_BUCKET','LAVA_BUCKET',
    'CRAFTING_TABLE','FURNACE','CHEST','HOPPER','DISPENSER','DROPPER','PISTON',
    'TORCH','LANTERN','GLOWSTONE_DUST','GLOWSTONE','SEA_LANTERN','SHROOMLIGHT',
    'IRON_NUGGET','GOLD_NUGGET','NETHERITE_SCRAP',
    'FLINT','FLINT_AND_STEEL','FIRE_CHARGE','ARROW','SPECTRAL_ARROW','TIPPED_ARROW',
    'OAK_SLAB','STONE_SLAB','COBBLESTONE_SLAB','BRICK_SLAB',
    'WHEAT','WHEAT_SEEDS','SUGAR_CANE','SUGAR','CACTUS','BAMBOO',
];

const RC_ENCHANTS = [
    'DAMAGE_ALL','PROTECTION_ENVIRONMENTAL','PROTECTION_FIRE','PROTECTION_FALL',
    'PROTECTION_EXPLOSIONS','PROTECTION_PROJECTILE','THORNS','DURABILITY',
    'SILK_TOUCH','FORTUNE','EFFICIENCY','LOOT_BONUS_MOBS','ARROW_DAMAGE',
    'ARROW_FIRE','ARROW_KNOCKBACK','ARROW_INFINITE','MENDING','SHARPNESS',
    'KNOCKBACK','FIRE_ASPECT','LOOTING','SWEEPING_EDGE','DEPTH_STRIDER',
    'AQUA_AFFINITY','RESPIRATION','SOUL_SPEED','SWIFT_SNEAK','FROST_WALKER',
];

function initRecipeCreator() {
    if (rcInitialized) { rcRenderGrid(); return; }
    rcInitialized = true;

    // Datalist
    const dl = document.getElementById('rc-materials-list');
    if (dl) {
        RC_MATERIALS.forEach(m => { const o = document.createElement('option'); o.value = m; dl.appendChild(o); });
    }
    const dl2 = document.getElementById('rc-result-material-list');
    if (dl2) {
        RC_MATERIALS.forEach(m => { const o = document.createElement('option'); o.value = m; dl2.appendChild(o); });
    }

    // Tarif tipi
    document.querySelectorAll('.rc-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            rcType = btn.dataset.type;
            document.querySelectorAll('.rc-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Malzeme uygula
    document.getElementById('btn-rc-apply-cell')?.addEventListener('click', rcApplyCell);

    // Sonuç uygula
    document.getElementById('btn-rc-apply-result')?.addEventListener('click', rcApplyResult);

    // Temizle
    document.getElementById('btn-rc-clear')?.addEventListener('click', () => {
        rcGrid = Array(9).fill(null).map(() => ({ material: '', count: 1 }));
        rcSelectedCell = null;
        rcRenderGrid();
        if (typeof showNotification === 'function') showNotification('🗑️ Tarif temizlendi', 'info');
    });

    // Kod üret
    document.getElementById('btn-rc-generate')?.addEventListener('click', rcGenerateCode);

    // Sonuç slotu
    const resultEl = document.getElementById('rc-result-slot');
    if (resultEl) {
        resultEl.addEventListener('click', () => {
            rcSelectedCell = 9;
            rcRenderGrid();
            // Result config göster
            document.getElementById('rc-cell-config').style.display = 'none';
            document.getElementById('rc-result-config').style.display = 'flex';
            // Değerleri doldur
            const mi = document.getElementById('rc-result-material'); if (mi) mi.value = rcResult.material || '';
            const ni = document.getElementById('rc-result-name'); if (ni) ni.value = rcResult.name || '';
            const li = document.getElementById('rc-result-lore'); if (li) li.value = rcResult.lore || '';
            const ci = document.getElementById('rc-result-count'); if (ci) ci.value = String(rcResult.count || 1);
        });
    }

    rcRenderGrid();
}

function rcRenderGrid() {
    const gridEl = document.getElementById('rc-craft-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const cell = rcGrid[i];
        const div = document.createElement('div');
        div.className = 'rc-slot' + (cell && cell.material ? ' filled' : '') + (i === rcSelectedCell ? ' selected' : '');
        div.dataset.idx = i;

        if (cell && cell.material) {
            div.textContent = _rcShort(cell.material);
            if (cell.count > 1) {
                const cnt = document.createElement('div');
                cnt.style.cssText = 'font-size:9px;color:#f1c40f;text-align:right;position:absolute;bottom:2px;right:3px;';
                cnt.textContent = cell.count;
                div.style.position = 'relative';
                div.appendChild(cnt);
            }
        } else {
            div.style.color = '#4a5568';
        }

        div.addEventListener('click', () => {
            rcSelectedCell = i;
            rcRenderGrid();
            document.getElementById('rc-result-config').style.display = 'none';
            const cfg = document.getElementById('rc-cell-config');
            if (cfg) {
                cfg.style.display = 'flex';
                const mi = document.getElementById('rc-cell-material'); if (mi) mi.value = rcGrid[i].material || '';
                const ci = document.getElementById('rc-cell-count'); if (ci) ci.value = String(rcGrid[i].count || 1);
            }
            if (i === rcSelectedCell) div.classList.add('selected');
        });
        gridEl.appendChild(div);
    }

    // Sonuç slotunu güncelle
    const resultEl = document.getElementById('rc-result-slot');
    if (resultEl) {
        resultEl.className = 'rc-slot rc-result' + (rcResult.material ? ' filled' : '') + (rcSelectedCell === 9 ? ' selected' : '');
        resultEl.textContent = rcResult.material ? _rcShort(rcResult.material) : '+';
    }
}

function _rcShort(mat) {
    if (!mat) return '';
    const p = mat.split('_');
    return p.length === 1 ? mat.slice(0, 3) : p.map(x => x[0]).join('').slice(0, 4);
}

function rcApplyCell() {
    if (rcSelectedCell === null || rcSelectedCell > 8) return;
    const mat = (document.getElementById('rc-cell-material')?.value || '').toUpperCase().trim();
    const cnt = parseInt(document.getElementById('rc-cell-count')?.value || '1') || 1;
    rcGrid[rcSelectedCell] = { material: mat, count: cnt };
    rcRenderGrid();
    if (typeof showNotification === 'function') showNotification('✅ Slot güncellendi!', 'success');
}

function rcApplyResult() {
    rcResult.material = (document.getElementById('rc-result-material')?.value || '').toUpperCase().trim();
    rcResult.name = document.getElementById('rc-result-name')?.value || '';
    rcResult.lore = document.getElementById('rc-result-lore')?.value || '';
    rcResult.count = parseInt(document.getElementById('rc-result-count')?.value || '1') || 1;
    rcRenderGrid();
    if (typeof showNotification === 'function') showNotification('✅ Sonuç güncellendi!', 'success');
}

function rcGenerateCode() {
    if (!rcResult.material) {
        if (typeof showNotification === 'function') showNotification('❌ Önce sonuç malzemesini seçin!', 'error');
        return;
    }

    const filled = rcGrid.map((c, i) => ({ ...c, idx: i })).filter(c => c.material && c.material !== 'AIR');
    let code = 'package me.craftide.myplugin;\n\n';
    code += 'import org.bukkit.*;\nimport org.bukkit.plugin.java.JavaPlugin;\n';
    code += 'import org.bukkit.inventory.*;\nimport org.bukkit.inventory.meta.ItemMeta;\n';
    code += 'import java.util.Arrays;\n\n';
    code += '// RecipeManager — plugin\'inizin onEnable() metoduna registerRecipes() ekleyin\npublic class RecipeManager {\n\n';
    code += '    public static void registerRecipes(JavaPlugin plugin) {\n';
    code += '        // Sonuç eşyası\n';
    code += '        ItemStack result = new ItemStack(Material.' + rcResult.material + ', ' + rcResult.count + ');\n';

    if (rcResult.name || rcResult.lore) {
        code += '        ItemMeta meta = result.getItemMeta();\n        if (meta != null) {\n';
        if (rcResult.name) code += '            meta.setDisplayName(ChatColor.translateAlternateColorCodes(\'&\', "' + rcResult.name + '"));\n';
        if (rcResult.lore) {
            const loreLines = rcResult.lore.split('\n').filter(l => l.trim());
            code += '            meta.setLore(Arrays.asList(' + loreLines.map(l => '"' + l + '"').join(', ') + '));\n';
        }
        code += '            result.setItemMeta(meta);\n        }\n';
    }

    if (rcType === 'shaped') {
        // Şekilli tarif
        const chars = 'ABCDEFGHI';
        const matToChar = {};
        let charIdx = 0;
        const rows = ['', '', ''];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const cell = rcGrid[row * 3 + col];
                if (cell && cell.material && cell.material !== 'AIR') {
                    if (!matToChar[cell.material]) {
                        matToChar[cell.material] = chars[charIdx++];
                    }
                    rows[row] += matToChar[cell.material];
                } else {
                    rows[row] += ' ';
                }
            }
        }
        code += '        ShapedRecipe recipe = new ShapedRecipe(new NamespacedKey(plugin, "custom_recipe_' + rcResult.material.toLowerCase() + '"), result);\n';
        code += '        recipe.shape("' + rows[0] + '", "' + rows[1] + '", "' + rows[2] + '");\n';
        Object.entries(matToChar).forEach(([mat, ch]) => {
            code += '        recipe.setIngredient(\'' + ch + '\', Material.' + mat + ');\n';
        });
    } else {
        // Şekilsiz tarif
        code += '        ShapelessRecipe recipe = new ShapelessRecipe(new NamespacedKey(plugin, "custom_recipe_' + rcResult.material.toLowerCase() + '"), result);\n';
        filled.forEach(cell => {
            code += '        recipe.addIngredient(' + cell.count + ', Material.' + cell.material + ');\n';
        });
    }

    code += '        Bukkit.addRecipe(recipe);\n';
    code += '    }\n}\n';

    const virtualPath = 'generated://RecipeManager.java';
    if (typeof openFiles !== 'undefined' && typeof addTab === 'function' && typeof activateTab === 'function') {
        openFiles.set(virtualPath, { content: code, modified: false, virtual: true, generated: true });
        const existing = document.querySelector(`.tab[data-tab="${CSS.escape(virtualPath)}"]`);
        if (existing) existing.remove();
        addTab(virtualPath, 'RecipeManager.java');
        activateTab(virtualPath);
        if (typeof showNotification === 'function') showNotification('⚡ Tarif kodu üretildi!', 'success');
    }
}

window.initRecipeCreator = initRecipeCreator;
