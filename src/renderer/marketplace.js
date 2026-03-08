/**
 * CraftIDE — Blueprint Marketplace
 * VB blueprint'lerini yayınla, paylaş ve indir (yerel JSON tabanlı)
 */

let mkInitialized = false;
let mkBlueprints = [];
let mkFilterMode = 'all';
let mkFilterCategory = 'all';
let mkSearchTerm = '';

function mkTr(key, fallback, params) {
    if (typeof tr === 'function') return tr(key, fallback, params);
    if (!params) return fallback || key;
    return Object.entries(params).reduce((acc, [paramKey, value]) => acc.replaceAll(`{${paramKey}}`, String(value)), fallback || key);
}

function mkModeLabel(mode) {
    const normalized = String(mode || 'plugin').toLowerCase();
    const modeKeys = {
        plugin: ['ui.market.mode.plugin', 'Plugin'],
        fabric: ['ui.market.mode.fabric', 'Fabric'],
        forge: ['ui.market.mode.forge', 'Forge'],
        skript: ['ui.market.mode.skript', 'Skript'],
    };
    const [key, fallback] = modeKeys[normalized] || ['ui.market.mode.plugin', normalized];
    return mkTr(key, fallback);
}

function mkCategoryLabel(category) {
    const normalized = String(category || 'utility').toLowerCase();
    const labels = {
        all: ['ui.market.category.all', 'All categories'],
        economy: ['ui.market.category.economy', 'Economy'],
        quest: ['ui.market.category.quest', 'Quest'],
        protection: ['ui.market.category.protection', 'Protection'],
        reward: ['ui.market.category.reward', 'Reward'],
        utility: ['ui.market.category.utility', 'Utility'],
    };
    const [key, fallback] = labels[normalized] || ['ui.market.category.utility', normalized];
    return mkTr(key, fallback);
}

function mkInferCategory(bp) {
    const nodes = Array.isArray(bp?.nodes) ? bp.nodes : [];
    const ids = nodes.map((node) => String(node?.blockId || ''));
    if (ids.some((id) => /GiveMoney|TakeMoney|GetBalance|CreateGUI|OpenGUI/.test(id))) return 'economy';
    if (ids.some((id) => /PlayerDeath|GiveItem/.test(id)) && /reward|loot|crate/i.test(`${bp?.name || ''} ${bp?.description || ''}`)) return 'reward';
    if (ids.some((id) => /BlockBreak|BlockPlace|IsInWorld|CancelEvent|EntityDamage/.test(id))) return 'protection';
    if (/quest|objective|mission/i.test(`${bp?.name || ''} ${bp?.description || ''}`)) return 'quest';
    return 'utility';
}

function mkNormalizeBlueprint(bp) {
    const normalized = bp && typeof bp === 'object' ? { ...bp } : {};
    normalized.category = String(normalized.category || mkInferCategory(normalized)).toLowerCase();
    normalized.packType = normalized.packType || 'solution-pack';
    normalized.tags = Array.isArray(normalized.tags)
        ? normalized.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
        : String(normalized.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    normalized.name = String(normalized.name || mkTr('ui.market.untitledPack', 'Untitled Pack'));
    normalized.description = String(normalized.description || '');
    normalized.mode = String(normalized.mode || 'plugin').toLowerCase();
    normalized.author = String(normalized.author || mkTr('ui.market.anonymous', 'Anonymous'));
    normalized.created = String(normalized.created || '');
    normalized.nodes = Array.isArray(normalized.nodes) ? normalized.nodes : [];
    normalized.connections = Array.isArray(normalized.connections) ? normalized.connections : [];
    return normalized;
}

function mkFilterBlueprints(blueprints, options = {}) {
    const mode = String(options.mode || 'all').toLowerCase();
    const category = String(options.category || 'all').toLowerCase();
    const searchTerm = String(options.searchTerm || '').toLowerCase();

    return (Array.isArray(blueprints) ? blueprints : [])
        .map(mkNormalizeBlueprint)
        .filter((bp) => {
            if (mode !== 'all' && bp.mode !== mode) return false;
            if (category !== 'all' && bp.category !== category) return false;
            if (searchTerm) {
                const haystack = [bp.name, bp.description, bp.category, ...(bp.tags || [])].join(' ').toLowerCase();
                if (!haystack.includes(searchTerm)) return false;
            }
            return true;
        })
        .sort((a, b) => String(b.created || '').localeCompare(String(a.created || '')));
}

function initMarketplace() {
    if (mkInitialized) { mkLoadAndRender(); return; }
    mkInitialized = true;

    // Arama
    const searchInput = document.getElementById('mk-search');
    if (searchInput) searchInput.addEventListener('input', (e) => { mkSearchTerm = e.target.value.toLowerCase(); mkRenderList(); });

    const categorySelect = document.getElementById('mk-category-filter');
    if (categorySelect) categorySelect.addEventListener('change', (e) => {
        mkFilterCategory = String(e.target.value || 'all');
        mkRenderList();
    });

    // Filtre butonları
    document.querySelectorAll('.mk-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            mkFilterMode = btn.dataset.mode || 'all';
            document.querySelectorAll('.mk-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mkRenderList();
        });
    });

    // Yayınla
    document.getElementById('btn-mk-publish')?.addEventListener('click', mkPublish);

    mkLoadAndRender();
    document.addEventListener('lang:changed', () => mkRenderList());
}

async function mkLoadAndRender() {
    try {
        const result = await ipcRenderer.invoke('marketplace:getList');
        mkBlueprints = Array.isArray(result) ? result.map(mkNormalizeBlueprint) : [];
    } catch (e) {
        mkBlueprints = [];
    }
    mkRenderList();
}

function mkRenderList() {
    const container = document.getElementById('mk-cards-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = mkFilterBlueprints(mkBlueprints, {
        mode: mkFilterMode,
        category: mkFilterCategory,
        searchTerm: mkSearchTerm,
    });

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'text-align:center;padding:60px 20px;color:var(--text-muted);';
        empty.innerHTML = '<div style="font-size:40px;margin-bottom:16px;">&#128230;</div><div style="font-size:14px;">' + mkTr('ui.market.emptyTitle', 'No templates yet') + '</div><div style="font-size:12px;margin-top:8px;">' + mkTr('ui.market.emptyDesc', 'Create a blueprint in Visual Builder and click Publish') + '</div>';
        container.appendChild(empty);
        return;
    }

    filtered.forEach(bp => {
        const card = document.createElement('div');
        card.className = 'mk-card';

        const modeBadgeColor = { plugin: '#2ecc71', fabric: '#3498db', forge: '#e67e22', skript: '#9b59b6' };
        const modeColor = modeBadgeColor[bp.mode] || '#8b949e';

        card.innerHTML = `
            <div class="mk-card-header">
                <span class="mk-card-title">${_mkEscape(bp.name)}</span>
                <span class="mk-mode-badge" style="background:${modeColor}20;color:${modeColor};border:1px solid ${modeColor}40;">${_mkEscape(mkModeLabel(bp.mode))}</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                <span class="mk-mode-badge" style="background:rgba(56,189,248,0.14);color:#7dd3fc;border:1px solid rgba(125,211,252,0.35);">${_mkEscape(mkTr('ui.market.solutionPack', 'Solution Pack'))}</span>
                <span class="mk-mode-badge" style="background:rgba(110,231,183,0.12);color:#6ee7b7;border:1px solid rgba(110,231,183,0.35);">${_mkEscape(mkCategoryLabel(bp.category))}</span>
            </div>
            <div class="mk-card-desc">${_mkEscape(bp.description || mkTr('ui.market.noDesc', 'No description'))}</div>
            ${(bp.tags || []).length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">${bp.tags.map((tag) => `<span class="mk-mode-badge" style="background:rgba(255,255,255,0.04);color:var(--text-secondary);border:1px solid var(--border-color);">#${_mkEscape(tag)}</span>`).join('')}</div>` : ''}
            <div class="mk-card-footer">
                <span style="font-size:10px;color:var(--text-muted);">${bp.author || mkTr('ui.market.anonymous', 'Anonymous')} | ${bp.created || ''} | ${(bp.nodes || []).length} ${mkTr('ui.market.blocks', 'blocks')} | ${(bp.connections || []).length} ${mkTr('ui.market.connections', 'connections')}</span>
                <button class="mk-import-btn vb-toolbar-btn" data-id="${bp.id}">&#8595; ${mkTr('ui.market.load', 'Load')}</button>
            </div>
        `;

        card.querySelector('.mk-import-btn').addEventListener('click', () => mkImport(bp));
        container.appendChild(card);
    });
}

function _mkEscape(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function mkPublish() {
    if (typeof vbNodes === 'undefined' || !vbNodes || vbNodes.length === 0) {
        if (typeof showNotification === 'function') showNotification(mkTr('msg.noBlocksInVB', 'Add blocks in Visual Builder first!'), 'error');
        return;
    }

    const name = document.getElementById('mk-publish-name')?.value.trim();
    const desc = document.getElementById('mk-publish-desc')?.value.trim();
    const category = String(document.getElementById('mk-publish-category')?.value || 'utility').trim().toLowerCase();
    const tags = String(document.getElementById('mk-publish-tags')?.value || '').split(',').map((tag) => tag.trim()).filter(Boolean);

    if (!name) {
        if (typeof showNotification === 'function') showNotification(mkTr('msg.enterBlueprintName', 'Enter a blueprint name!'), 'error');
        return;
    }

    const blueprint = {
        name,
        description: desc || '',
        mode: typeof vbCurrentMode !== 'undefined' ? vbCurrentMode : 'plugin',
        category,
        tags,
        packType: 'solution-pack',
        author: mkTr('ui.market.anonymous', 'Anonymous'),
        nodes: vbNodes.map(n => ({ id: n.id, blockId: n.blockId, x: n.x, y: n.y, params: { ...n.params } })),
        connections: (typeof vbConnections !== 'undefined' ? vbConnections : []).map(c => ({ from: c.from, to: c.to })),
    };

    try {
        await ipcRenderer.invoke('marketplace:publish', blueprint);
        if (typeof showNotification === 'function') showNotification(mkTr('msg.blueprintPublished', 'Blueprint published!'), 'success');
        // Input'ları temizle
        const ni = document.getElementById('mk-publish-name'); if (ni) ni.value = '';
        const di = document.getElementById('mk-publish-desc'); if (di) di.value = '';
        const ci = document.getElementById('mk-publish-category'); if (ci) ci.value = 'utility';
        const ti = document.getElementById('mk-publish-tags'); if (ti) ti.value = '';
        await mkLoadAndRender();
    } catch (e) {
        if (typeof showNotification === 'function') showNotification(mkTr('msg.publishError', 'Publish error: {error}', { error: e.message }), 'error');
    }
}

function mkImport(bp) {
    if (typeof vbLoadBlueprintObj !== 'function' && typeof vbNodes === 'undefined') {
        if (typeof showNotification === 'function') showNotification(mkTr('msg.visualBuilderNotLoaded', 'Visual Builder is not loaded!'), 'error');
        return;
    }

    // VB'yi temizle ve blueprint'i yükle
    if (typeof vbClearCanvas === 'function') vbClearCanvas();
    if (typeof vbCurrentMode !== 'undefined' && bp.mode) {
        vbCurrentMode = bp.mode;
        const sel = document.getElementById('vb-mode-select');
        if (sel) sel.value = bp.mode;
        if (typeof rebuildContextMenu === 'function') rebuildContextMenu();
    }

    const idMap = {};
    let maxId = 0;
    const BLOCK_DEFS = (typeof ALL_BLOCK_DEFS !== 'undefined' && ALL_BLOCK_DEFS[bp.mode]) ? ALL_BLOCK_DEFS[bp.mode] : {};

    (bp.nodes || []).forEach(n => {
        const def = BLOCK_DEFS[n.blockId];
        if (!def) return;
        const newId = ++maxId;
        const node = { id: newId, blockId: n.blockId, type: def.type, label: def.label, x: n.x || 100, y: n.y || 100, params: {} };
        (def.params || []).forEach(p => { node.params[p.n] = p.d; });
        if (n.params) Object.assign(node.params, n.params);
        if (typeof vbNodes !== 'undefined') vbNodes.push(node);
        idMap[n.id] = newId;
        if (typeof renderNode === 'function') renderNode(node);
    });

    if (typeof vbNextId !== 'undefined') vbNextId = maxId + 1;

    (bp.connections || []).forEach(c => {
        const from = idMap[c.from], to = idMap[c.to];
        if (from && to && typeof vbConnections !== 'undefined') vbConnections.push({ from, to });
    });

    if (typeof drawConnections === 'function') drawConnections();
    const hint = document.getElementById('vb-empty-hint');
    if (hint) hint.style.display = 'none';

    // VB tab'ına geç
    if (typeof openFile === 'function') openFile('visual-builder://tab', typeof getVirtualTabName === 'function' ? getVirtualTabName('visual-builder://tab') : 'Visual Builder');
    if (typeof showNotification === 'function') showNotification(mkTr('msg.blueprintLoaded', 'Blueprint loaded: {name}', { name: bp.name }), 'success');
}

if (typeof window !== 'undefined') {
    window.initMarketplace = initMarketplace;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mkInferCategory,
        mkNormalizeBlueprint,
        mkFilterBlueprints,
    };
}
