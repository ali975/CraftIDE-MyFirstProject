/**
 * CraftIDE — Blueprint Marketplace
 * VB blueprint'lerini yayınla, paylaş ve indir (yerel JSON tabanlı)
 */

let mkInitialized = false;
let mkBlueprints = [];
let mkFilterMode = 'all';
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

function initMarketplace() {
    if (mkInitialized) { mkLoadAndRender(); return; }
    mkInitialized = true;

    // Arama
    const searchInput = document.getElementById('mk-search');
    if (searchInput) searchInput.addEventListener('input', (e) => { mkSearchTerm = e.target.value.toLowerCase(); mkRenderList(); });

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
        mkBlueprints = Array.isArray(result) ? result : [];
    } catch (e) {
        mkBlueprints = [];
    }
    mkRenderList();
}

function mkRenderList() {
    const container = document.getElementById('mk-cards-container');
    if (!container) return;
    container.innerHTML = '';

    let filtered = mkBlueprints.filter(bp => {
        if (mkFilterMode !== 'all' && bp.mode !== mkFilterMode) return false;
        if (mkSearchTerm && !bp.name.toLowerCase().includes(mkSearchTerm) && !((bp.description || '').toLowerCase().includes(mkSearchTerm))) return false;
        return true;
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
            <div class="mk-card-desc">${_mkEscape(bp.description || mkTr('ui.market.noDesc', 'No description'))}</div>
            <div class="mk-card-footer">
                <span style="font-size:10px;color:var(--text-muted);">${bp.author || mkTr('ui.market.anonymous', 'Anonymous')} | ${bp.created || ''} | ${(bp.nodes || []).length} ${mkTr('ui.market.blocks', 'blocks')}</span>
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

    if (!name) {
        if (typeof showNotification === 'function') showNotification(mkTr('msg.enterBlueprintName', 'Enter a blueprint name!'), 'error');
        return;
    }

    const blueprint = {
        name,
        description: desc || '',
        mode: typeof vbCurrentMode !== 'undefined' ? vbCurrentMode : 'plugin',
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

window.initMarketplace = initMarketplace;
