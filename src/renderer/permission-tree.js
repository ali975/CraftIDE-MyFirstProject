/**
 * CraftIDE — Permission Tree Builder
 * Minecraft plugin izinlerini görsel ağaç yapısında oluştur
 */

let ptTree = null;        // Kök izin nodu
let ptSelected = null;   // Seçili node
let ptInitialized = false;

function ptTr(key, fallback, params) {
    if (typeof tr === 'function') return tr(key, fallback, params);
    if (!params) return fallback || key;
    return Object.entries(params).reduce((acc, [paramKey, value]) => acc.replaceAll(`{${paramKey}}`, String(value)), fallback || key);
}

function initPermissionTree() {
    if (ptInitialized) { ptRenderTree(); return; }
    ptInitialized = true;

    ptTree = { name: 'myplugin.*', description: 'Tüm izinler', default: 'op', children: [] };
    ptSelected = ptTree;

    document.getElementById('btn-pt-add-child')?.addEventListener('click', () => {
        if (!ptSelected) return;
        if (!ptSelected.children) ptSelected.children = [];
        const parentBase = ptSelected.name.endsWith('.*') ? ptSelected.name.slice(0, -2) : ptSelected.name;
        ptSelected.children.push({ name: parentBase + '.new', description: '', default: 'true', children: [] });
        ptRenderTree();
        ptRenderConfig();
    });

    document.getElementById('btn-pt-delete')?.addEventListener('click', () => {
        if (!ptSelected || ptSelected === ptTree) return;
        _ptDelete(ptTree, ptSelected);
        ptSelected = ptTree;
        ptRenderTree();
        ptRenderConfig();
        if (typeof showNotification === 'function') showNotification(ptTr('msg.permissionDeleted', 'Permission deleted'), 'info');
    });

    document.getElementById('btn-pt-generate-yml')?.addEventListener('click', ptGenerateYml);
    document.getElementById('btn-pt-generate-luckperms')?.addEventListener('click', ptGenerateLuckPerms);

    ptRenderTree();
    ptRenderConfig();
    document.addEventListener('lang:changed', () => {
        ptRenderTree();
        ptRenderConfig();
    });
}

function _ptDelete(parent, target) {
    if (!parent.children) return;
    const idx = parent.children.indexOf(target);
    if (idx >= 0) { parent.children.splice(idx, 1); return; }
    parent.children.forEach(c => _ptDelete(c, target));
}

// ═══════════════════════════════════════════════════════════
// Ağaç Render
// ═══════════════════════════════════════════════════════════

function ptRenderTree() {
    const area = document.getElementById('pt-tree-area');
    if (!area || !ptTree) return;
    area.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'pt-tree-ul';
    ul.appendChild(_ptBuildNode(ptTree, true));
    area.appendChild(ul);
}

function _ptBuildNode(node, isRoot) {
    const li = document.createElement('li');
    li.className = 'pt-node' + (node === ptSelected ? ' selected' : '');

    const row = document.createElement('div');
    row.className = 'pt-node-row';

    const icon = document.createElement('span');
    icon.textContent = isRoot ? '🔑' : '🔒';
    icon.style.cssText = 'margin-right:6px;font-size:13px;';

    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'font-size:12px;font-weight:600;color:' + (isRoot ? '#9b59b6' : 'var(--text-primary)') + ';cursor:pointer;flex:1;';
    nameSpan.textContent = node.name;

    const defaultBadge = document.createElement('span');
    const defColors = { op: '#e67e22', true: '#2ecc71', false: '#e74c3c', 'not op': '#3498db' };
    defaultBadge.textContent = ptTr(`ui.permission.default.${String(node.default || 'op').replace(/\s+/g, '')}`, node.default || 'op');
    defaultBadge.style.cssText = 'font-size:10px;padding:1px 6px;border-radius:10px;background:' + (defColors[node.default] || '#8b949e') + '30;color:' + (defColors[node.default] || '#8b949e') + ';border:1px solid ' + (defColors[node.default] || '#8b949e') + '40;';

    row.append(icon, nameSpan, defaultBadge);
    li.appendChild(row);

    row.addEventListener('click', () => {
        ptSelected = node;
        ptRenderTree();
        ptRenderConfig();
    });

    if (node.children && node.children.length > 0) {
        const subUl = document.createElement('ul');
        subUl.className = 'pt-tree-ul';
        node.children.forEach(c => subUl.appendChild(_ptBuildNode(c, false)));
        li.appendChild(subUl);
    }

    return li;
}

// ═══════════════════════════════════════════════════════════
// Konfigürasyon Paneli
// ═══════════════════════════════════════════════════════════

function ptRenderConfig() {
    const panel = document.getElementById('pt-config-panel');
    if (!panel || !ptSelected) return;
    panel.innerHTML = '';
    const node = ptSelected;

    const title = document.createElement('div');
    title.style.cssText = 'font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;';
    title.textContent = node === ptTree ? ptTr('ui.permission.root', 'Root Permission') : ptTr('ui.permission.node', 'Permission');
    panel.appendChild(title);

    const addField = (label, key, placeholder) => {
        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:11px;color:var(--text-secondary);display:block;margin-top:8px;';
        lbl.textContent = label;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = node[key] || '';
        inp.placeholder = placeholder || '';
        inp.style.cssText = 'width:100%;padding:5px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);font-size:12px;box-sizing:border-box;margin-top:3px;';
        inp.addEventListener('input', () => { node[key] = inp.value; ptRenderTree(); });
        panel.append(lbl, inp);
    };

    addField(ptTr('ui.permission.name', 'Permission Name'), 'name', 'myplugin.command');
    addField(ptTr('ui.permission.desc', 'Description'), 'description', ptTr('ui.permission.descPlaceholder', 'Permission description'));

    const defLbl = document.createElement('label');
    defLbl.style.cssText = 'font-size:11px;color:var(--text-secondary);display:block;margin-top:8px;';
    defLbl.textContent = ptTr('ui.permission.default', 'Default');
    const defSel = document.createElement('select');
    defSel.style.cssText = 'width:100%;padding:5px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);font-size:12px;box-sizing:border-box;margin-top:3px;';
    ['op','true','false','not op'].forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = ptTr(`ui.permission.default.${String(v).replace(/\s+/g, '')}`, v);
        if (node.default === v) o.selected = true;
        defSel.appendChild(o);
    });
    defSel.addEventListener('change', () => { node.default = defSel.value; ptRenderTree(); });
    panel.append(defLbl, defSel);
}

// ═══════════════════════════════════════════════════════════
// Kod Üretimi
// ═══════════════════════════════════════════════════════════

function ptGenerateYml() {
    if (!ptTree) return;
    let yaml = '# plugin.yml\'e ekle:\npermissions:\n';

    const flatten = (node) => {
        const lines = [];
        const addNode = (n, indent) => {
            lines.push(indent + n.name + ':');
            if (n.description) lines.push(indent + '  description: ' + n.description);
            if (n.default) lines.push(indent + '  default: ' + n.default);
            if (n.children && n.children.length > 0) {
                lines.push(indent + '  children:');
                n.children.forEach(c => {
                    lines.push(indent + '    ' + c.name + ': true');
                });
            }
        };
        addNode(node, '  ');
        if (node.children) node.children.forEach(c => flatten(c).forEach(l => lines.push(l)));
        return lines;
    };

    yaml += flatten(ptTree).join('\n') + '\n';

    const virtualPath = 'generated://plugin_permissions.yml';
    if (typeof openFiles !== 'undefined' && typeof addTab === 'function' && typeof activateTab === 'function') {
        openFiles.set(virtualPath, { content: yaml, modified: false, virtual: true, generated: true });
        const existing = document.querySelector(`.tab[data-tab="${CSS.escape(virtualPath)}"]`);
        if (existing) existing.remove();
        addTab(virtualPath, 'plugin_permissions.yml');
        activateTab(virtualPath);
        if (typeof showNotification === 'function') showNotification(ptTr('msg.permissionsGenerated', 'plugin.yml permissions generated!'), 'success');
    }
}

function ptGenerateLuckPerms() {
    if (!ptTree) return;
    const lines = ['# LuckPerms Komutları'];
    const genNode = (node) => {
        lines.push('/lp group default permission set ' + node.name + ' ' + (node.default === 'true' ? 'true' : (node.default === 'false' ? 'false' : 'true')));
        if (node.children) node.children.forEach(genNode);
    };
    genNode(ptTree);

    const virtualPath = 'generated://luckperms_commands.txt';
    if (typeof openFiles !== 'undefined' && typeof addTab === 'function' && typeof activateTab === 'function') {
        openFiles.set(virtualPath, { content: lines.join('\n'), modified: false, virtual: true, generated: true });
        const existing = document.querySelector(`.tab[data-tab="${CSS.escape(virtualPath)}"]`);
        if (existing) existing.remove();
        addTab(virtualPath, 'luckperms_commands.txt');
        activateTab(virtualPath);
        if (typeof showNotification === 'function') showNotification(ptTr('msg.luckpermsGenerated', 'LuckPerms commands generated!'), 'success');
    }
}

window.initPermissionTree = initPermissionTree;
