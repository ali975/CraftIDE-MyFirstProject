/**
 * CraftIDE — Command Tree Designer
 * Minecraft komut ağaçlarını görsel olarak tasarla, Java/Skript koduna dönüştür
 */

const CommandCreatorBrief = require('../shared/creator-brief.js');

let ctTree = null;          // Kök komut ağacı
let ctSelectedNode = null;  // Seçili node referansı
let ctInitialized = false;

const CT_ARG_TYPES = ['player', 'string', 'integer', 'double', 'boolean', 'enum'];

function ctTr(key, fallback, params) {
    if (typeof tr === 'function') return tr(key, fallback, params);
    if (!params) return fallback || key;
    return Object.entries(params).reduce((acc, [paramKey, value]) => acc.replaceAll(`{${paramKey}}`, String(value)), fallback || key);
}

// ═══════════════════════════════════════════════════════════
// Başlatma
// ═══════════════════════════════════════════════════════════

function initCommandTree() {
    if (ctInitialized) { ctRenderTree(); return; }
    ctInitialized = true;

    ctTree = { name: 'mycommand', description: 'Açıklama', permission: '', aliases: [], args: [], subcommands: [] };
    ctSelectedNode = ctTree;

    document.getElementById('btn-ct-add-sub')?.addEventListener('click', () => {
        if (!ctSelectedNode) return;
        ctSelectedNode.subcommands = ctSelectedNode.subcommands || [];
        ctSelectedNode.subcommands.push({ name: 'alt', description: '', permission: '', args: [], subcommands: [] });
        ctRenderTree();
        ctRenderConfig();
    });

    document.getElementById('btn-ct-add-arg')?.addEventListener('click', () => {
        if (!ctSelectedNode) return;
        ctSelectedNode.args = ctSelectedNode.args || [];
        ctSelectedNode.args.push({ name: 'arg' + (ctSelectedNode.args.length + 1), type: 'string', optional: false });
        ctRenderTree();
        ctRenderConfig();
    });

    document.getElementById('btn-ct-delete')?.addEventListener('click', () => {
        if (!ctSelectedNode || ctSelectedNode === ctTree) return;
        _ctDeleteFromTree(ctTree, ctSelectedNode);
        ctSelectedNode = ctTree;
        ctRenderTree();
        ctRenderConfig();
        if (typeof showNotification === 'function') showNotification(ctTr('msg.commandDeleted', 'Subcommand deleted'), 'info');
    });

    document.getElementById('btn-ct-generate-java')?.addEventListener('click', ctGenerateJava);
    document.getElementById('btn-ct-generate-skript')?.addEventListener('click', ctGenerateSkript);

    ctRenderTree();
    ctRenderConfig();
    document.addEventListener('lang:changed', () => {
        ctRenderTree();
        ctRenderConfig();
    });
}

function _ctDeleteFromTree(parent, target) {
    if (!parent.subcommands) return;
    const idx = parent.subcommands.indexOf(target);
    if (idx >= 0) { parent.subcommands.splice(idx, 1); return; }
    parent.subcommands.forEach(sub => _ctDeleteFromTree(sub, target));
}

// ═══════════════════════════════════════════════════════════
// Ağaç Render
// ═══════════════════════════════════════════════════════════

function ctRenderTree() {
    const treeEl = document.getElementById('ct-tree-area');
    if (!treeEl || !ctTree) return;
    treeEl.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'ct-tree-ul';
    ul.appendChild(_ctBuildNode(ctTree, true));
    treeEl.appendChild(ul);
}

function _ctBuildNode(node, isRoot) {
    const li = document.createElement('li');
    li.className = 'ct-node' + (node === ctSelectedNode ? ' selected' : '');

    const row = document.createElement('div');
    row.className = 'ct-node-row';

    const icon = document.createElement('span');
    icon.textContent = isRoot ? '⌨️' : '↳';
    icon.style.cssText = 'margin-right:4px;opacity:0.6;';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'ct-node-name';
    nameSpan.textContent = '/' + (isRoot ? '' : '') + node.name;
    if (node.args && node.args.length) {
        nameSpan.textContent += ' ' + node.args.map(a => (a.optional ? '[' : '<') + a.name + ':' + a.type + (a.optional ? ']' : '>')).join(' ');
    }
    nameSpan.style.cssText = 'font-size:12px;font-weight:600;color:' + (isRoot ? '#2ecc71' : '#3498db') + ';cursor:pointer;';

    const permBadge = node.permission ? document.createElement('span') : null;
    if (permBadge) {
        permBadge.textContent = node.permission;
        permBadge.style.cssText = 'font-size:10px;background:rgba(155,89,182,0.2);color:#9b59b6;padding:1px 5px;border-radius:3px;margin-left:6px;';
    }

    row.append(icon, nameSpan);
    if (permBadge) row.appendChild(permBadge);
    li.appendChild(row);

    row.addEventListener('click', () => {
        ctSelectedNode = node;
        ctRenderTree();
        ctRenderConfig();
    });

    if (node.subcommands && node.subcommands.length > 0) {
        const subUl = document.createElement('ul');
        subUl.className = 'ct-tree-ul';
        node.subcommands.forEach(sub => subUl.appendChild(_ctBuildNode(sub, false)));
        li.appendChild(subUl);
    }

    return li;
}

// ═══════════════════════════════════════════════════════════
// Konfigürasyon Paneli
// ═══════════════════════════════════════════════════════════

function ctRenderConfig() {
    const panel = document.getElementById('ct-config-panel');
    if (!panel || !ctSelectedNode) return;
    panel.innerHTML = '';

    const node = ctSelectedNode;
    const isRoot = node === ctTree;

    const title = document.createElement('div');
    title.style.cssText = 'font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;';
    title.textContent = isRoot ? ctTr('ui.command.root', 'Root Command') : ctTr('ui.command.sub', 'Subcommand');
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
        inp.addEventListener('input', () => { node[key] = inp.value; ctRenderTree(); });
        panel.append(lbl, inp);
    };

    addField(ctTr('ui.command.name', 'Command Name'), 'name', 'mycommand');
    addField(ctTr('ui.command.desc', 'Description'), 'description', ctTr('ui.command.descPlaceholder', 'Command description'));
    addField(ctTr('ui.command.permission', 'Permission'), 'permission', ctTr('ui.command.permissionPlaceholder', 'myplugin.command'));
    if (isRoot) addField(ctTr('ui.command.aliases', 'Aliases (comma separated)'), 'aliasesStr', ctTr('ui.command.aliasesPlaceholder', 'mc, spawn'));

    // Argümanlar
    if (node.args && node.args.length > 0) {
        const argTitle = document.createElement('div');
        argTitle.style.cssText = 'font-size:11px;font-weight:700;color:var(--text-secondary);margin-top:12px;border-top:1px solid var(--border-color);padding-top:8px;';
        argTitle.textContent = ctTr('ui.command.args', 'Arguments').toUpperCase();
        panel.appendChild(argTitle);

        node.args.forEach((arg, i) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:4px;align-items:center;margin-top:4px;';

            const ni = document.createElement('input'); ni.placeholder = ctTr('ui.command.argName', 'name'); ni.value = arg.name;
            ni.style.cssText = 'flex:1;padding:4px 6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);font-size:11px;';
            ni.addEventListener('input', () => { arg.name = ni.value; ctRenderTree(); });

            const ts = document.createElement('select');
            ts.style.cssText = 'padding:4px 4px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);font-size:11px;';
            CT_ARG_TYPES.forEach(t => { const o = document.createElement('option'); o.value=t; o.textContent=t; if (arg.type===t) o.selected=true; ts.appendChild(o); });
            ts.addEventListener('change', () => { arg.type = ts.value; ctRenderTree(); });

            const optChk = document.createElement('input'); optChk.type='checkbox'; optChk.checked=arg.optional; optChk.title = ctTr('ui.command.argOptional', 'Optional');
            optChk.addEventListener('change', () => { arg.optional = optChk.checked; ctRenderTree(); });

            const rm = document.createElement('button'); rm.textContent='✕'; rm.style.cssText='background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px;';
            rm.onclick = () => { node.args.splice(i, 1); ctRenderTree(); ctRenderConfig(); };

            row.append(ni, ts, optChk, rm);
            panel.appendChild(row);
        });
    }
}

// ═══════════════════════════════════════════════════════════
// Java Kod Üretimi
// ═══════════════════════════════════════════════════════════

function ctGenerateJava() {
    if (!ctTree) return;
    const cn = (ctTree.name.charAt(0).toUpperCase() + ctTree.name.slice(1)) + 'Command';

    let code = 'package me.craftide.myplugin.commands;\n\n';
    code += 'import org.bukkit.command.*;\nimport org.bukkit.entity.Player;\nimport org.bukkit.*;\n\n';
    code += 'public class ' + cn + ' implements CommandExecutor, TabCompleter {\n\n';
    code += '    @Override\n';
    code += '    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {\n';
    if (ctTree.permission) {
        code += '        if (!sender.hasPermission("' + ctTree.permission + '")) {\n';
        code += '            sender.sendMessage(ChatColor.RED + "Yetkiniz yok!");\n            return true;\n        }\n';
    }
    code += _ctGenSubcommands(ctTree, '        ', 'args', 0);
    code += '        return true;\n    }\n\n';

    // Tab complete
    code += '    @Override\n';
    code += '    public java.util.List<String> onTabComplete(CommandSender sender, Command cmd, String alias, String[] args) {\n';
    code += '        java.util.List<String> completions = new java.util.ArrayList<>();\n';
    if (ctTree.subcommands && ctTree.subcommands.length > 0) {
        code += '        if (args.length == 1) {\n';
        code += '            completions.addAll(java.util.Arrays.asList(' + ctTree.subcommands.map(s => '"' + s.name + '"').join(', ') + '));\n';
        code += '        }\n';
    }
    code += '        return org.bukkit.util.StringUtil.copyPartialMatches(args[args.length-1], completions, new java.util.ArrayList<>());\n';
    code += '    }\n}\n';

    _ctOpenTab(code, cn + '.java');

    // plugin.yml commands bölümü
    let yml = '# plugin.yml\'e ekle:\ncommands:\n';
    yml += '  ' + ctTree.name + ':\n';
    yml += '    description: ' + (ctTree.description || '') + '\n';
    if (ctTree.permission) yml += '    permission: ' + ctTree.permission + '\n';
    _ctOpenTab(yml, 'plugin_commands.yml');
}

function _ctGenSubcommands(node, indent, argsVar, depth) {
    let code = '';
    if (!node.subcommands || node.subcommands.length === 0) return code;
    code += indent + 'if (' + argsVar + '.length > ' + depth + ') {\n';
    code += indent + '    switch (' + argsVar + '[' + depth + '].toLowerCase()) {\n';
    node.subcommands.forEach(sub => {
        code += indent + '        case "' + sub.name + '":\n';
        if (sub.permission) {
            code += indent + '            if (!sender.hasPermission("' + sub.permission + '")) { sender.sendMessage(ChatColor.RED + "Yetkiniz yok!"); return true; }\n';
        }
        // Argüman parse
        sub.args && sub.args.forEach((arg, i) => {
            if (arg.type === 'player') {
                code += indent + '            Player ' + arg.name + ' = Bukkit.getPlayer(' + argsVar + '[' + (depth + 1 + i) + ']);\n';
            } else if (arg.type === 'integer') {
                code += indent + '            int ' + arg.name + ' = Integer.parseInt(' + argsVar + '[' + (depth + 1 + i) + ']);\n';
            } else if (arg.type === 'double') {
                code += indent + '            double ' + arg.name + ' = Double.parseDouble(' + argsVar + '[' + (depth + 1 + i) + ']);\n';
            } else {
                code += indent + '            String ' + arg.name + ' = ' + argsVar + '.length > ' + (depth + 1 + i) + ' ? ' + argsVar + '[' + (depth + 1 + i) + '] : "";\n';
            }
        });
        code += indent + '            // TODO: ' + sub.name + ' işlemleri\n';
        code += _ctGenSubcommands(sub, indent + '            ', argsVar, depth + 1);
        code += indent + '            break;\n';
    });
    code += indent + '        default:\n';
    code += indent + '            sender.sendMessage("Kullanım: /' + node.name + ' [' + node.subcommands.map(s => s.name).join('|') + ']");\n';
    code += indent + '    }\n' + indent + '} else {\n';
    code += indent + '    sender.sendMessage("Usage: /' + node.name + ' <' + node.subcommands.map(s => s.name).join('|') + '>");\n';
    code += indent + '}\n';
    return code;
}

// ═══════════════════════════════════════════════════════════
// Skript Kod Üretimi
// ═══════════════════════════════════════════════════════════

function ctGenerateSkript() {
    if (!ctTree) return;
    let code = '# CraftIDE — Komut Tasarımcı — Skript Kodu\n\n';

    const genNode = (node, isRoot) => {
        if (isRoot) {
            const argStr = (node.args || []).map(a => a.type === 'player' ? 'player named %player%' : '%' + a.type + '%').join(' ');
            code += 'command /' + node.name + (argStr ? ' ' + argStr : '') + ':\n';
            if (node.permission) code += '    permission: ' + node.permission + '\n    permission message: &cYetkiniz yok!\n';
            if (node.description) code += '    description: ' + node.description + '\n';
            code += '    trigger:\n';
            if (node.subcommands && node.subcommands.length > 0) {
                node.subcommands.forEach(sub => {
                    code += '        if arg-1 is "' + sub.name + '":\n';
                    code += '            # TODO: ' + sub.name + ' işlemleri\n';
                    code += '            send "&a/' + node.name + ' ' + sub.name + ' çalıştırıldı!" to player\n';
                });
                code += '        else:\n';
                code += '            send "&cKullanım: /' + node.name + ' <' + node.subcommands.map(s => s.name).join('|') + '>" to player\n';
            } else {
                code += '        # TODO: komut işlemleri\n';
                code += '        send "&aMerhaba {player}!" to player\n';
            }
        }
    };

    genNode(ctTree, true);
    _ctOpenTab(code, ctTree.name + '.sk');
}

function _ctOpenTab(code, fileName) {
    const virtualPath = 'generated://' + fileName;
    if (typeof openFiles !== 'undefined' && typeof addTab === 'function' && typeof activateTab === 'function') {
        openFiles.set(virtualPath, { content: code, modified: false, virtual: true, generated: true });
        const existing = document.querySelector(`.tab[data-tab="${CSS.escape(virtualPath)}"]`);
        if (existing) existing.remove();
        addTab(virtualPath, fileName);
        activateTab(virtualPath);
        if (typeof showNotification === 'function') showNotification(ctTr('msg.fileGenerated', '{name} generated!', { name: fileName }), 'success');
    }
}

function ctApplyDesignerSeed(options = {}) {
    initCommandTree();
    const prompt = String(options.prompt || '').trim();
    const slashCommand = CommandCreatorBrief.extractSlashCommand(prompt, '/command');
    const baseName = slashCommand.replace(/^[\/]/, '') || 'command';
    const lower = prompt.toLowerCase();
    const subs = [];
    if (lower.includes('buy') || lower.includes('sell')) {
        subs.push({ name: 'buy', description: 'Buy flow', permission: '', args: [], subcommands: [] });
        subs.push({ name: 'sell', description: 'Sell flow', permission: '', args: [], subcommands: [] });
    }
    if (lower.includes('reload') || lower.includes('admin')) {
        subs.push({ name: 'reload', description: 'Reload command', permission: `${baseName}.reload`, args: [], subcommands: [] });
    }
    if (!subs.length) {
        subs.push({ name: 'run', description: 'Default action', permission: '', args: [], subcommands: [] });
    }

    ctTree = {
        name: baseName,
        description: prompt || 'Command generated from creator path',
        permission: options.permission || '',
        aliases: [],
        aliasesStr: '',
        args: [],
        subcommands: subs,
    };
    ctSelectedNode = ctTree;
    ctRenderTree();
    ctRenderConfig();
}

window.initCommandTree = initCommandTree;
window.CraftIDECommandTree = {
    init: initCommandTree,
    applyDesignerSeed: ctApplyDesignerSeed,
};
