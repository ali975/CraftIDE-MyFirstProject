/**
 * CraftIDE — Renderer Application Logic
 * Tüm UI etkileşimleri ve IPC çağrıları
 */

const { ipcRenderer } = require('electron');
const nodePath = require('path');

// ═══════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════

let currentProjectPath = null;
let openFiles = new Map(); // path -> { content, modified }
let currentFilePath = null;
let activePanel = 'explorer';
let activeTerminalId = null; // Gerçek terminal process ID
// Shared runtime API for additional renderer modules (e.g. No-Code Suite)
window.CraftIDEAppState = {
    getCurrentProjectPath: () => currentProjectPath,
    getCurrentFilePath: () => currentFilePath,
    getActivePanel: () => activePanel,
    getOpenFiles: () => openFiles,
    refreshFileTree: async () => { if (currentProjectPath) await renderFileTree(currentProjectPath); return !!currentProjectPath; },
    openFolder: (...args) => openFolder(...args),
    openFile: (...args) => openFile(...args),
    addTab: (...args) => addTab(...args),
    activateTab: (...args) => activateTab(...args),
    showNotification: (...args) => showNotification(...args),
    appendOutputLine: (...args) => appendOutputLine(...args),
    appendServerLine: (...args) => appendSmConsoleLine(...args),
};

function tr(key, fallback, params) {
    if (window.Lang && typeof window.Lang.t === 'function') {
        return window.Lang.t(key, params || {});
    }
    if (!fallback) return key;
    if (!params) return fallback;
    return Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), fallback);
}

function syncRendererStore(patch) {
    if (window.CraftIDEStore && typeof window.CraftIDEStore.patch === 'function') {
        window.CraftIDEStore.patch(patch || {});
    }
}

const VIRTUAL_TAB_META = {
    'visual-builder://': { key: 'ui.tab.visualBuilder', icon: '🧩', fallback: 'Visual Builder' },
    'blockbench://': { key: 'ui.tab.blockbench', icon: '🎮', fallback: 'Blockbench Editor' },
    'settings://': { key: 'ui.tab.settings', icon: '⚙️', fallback: 'Settings' },
    'server-manager://': { key: 'ui.tab.serverManager', icon: '🖹', fallback: 'Server Manager' },
    'image-editor://': { key: 'ui.tab.imageEditor', icon: '🖼️', fallback: 'Image Editor' },
    'gui-builder://': { key: 'ui.tab.guiBuilder', icon: '🗃️', fallback: 'GUI Builder' },
    'command-tree://': { key: 'ui.tab.commandTree', icon: '⌨️', fallback: 'Command Designer' },
    'recipe-creator://': { key: 'ui.tab.recipeCreator', icon: '🍳', fallback: 'Recipe Creator' },
    'permission-tree://': { key: 'ui.tab.permissionTree', icon: '🔑', fallback: 'Permission Tree' },
    'marketplace://': { key: 'ui.tab.marketplace', icon: '🛍️', fallback: 'Blueprint Marketplace' },
};

function getVirtualTabMeta(filePath) {
    if (!filePath || typeof filePath !== 'string') return null;
    for (const prefix of Object.keys(VIRTUAL_TAB_META)) {
        if (filePath.startsWith(prefix)) return VIRTUAL_TAB_META[prefix];
    }
    return null;
}

function getVirtualTabName(filePath, fallbackName) {
    const meta = getVirtualTabMeta(filePath);
    if (!meta) return fallbackName || '';
    return tr(meta.key, fallbackName || meta.fallback);
}

// ═══════════════════════════════════════════════════════════
// Real Terminal — xterm.js + Gerçek Shell Entegrasyonu
// ═══════════════════════════════════════════════════════════

let xtermMain = null;
let xtermMainFit = null;
let xtermServer = null;
let xtermServerFit = null;

function createXterm(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const term = new Terminal({
        theme: {
            background: '#0d1117',
            foreground: '#e6edf3',
            cursor: '#2ecc71',
            cursorAccent: '#0d1117',
            selectionBackground: 'rgba(46, 204, 113, 0.3)',
            black: '#0d1117', brightBlack: '#484f58',
            red: '#f85149', brightRed: '#ff7b72',
            green: '#2ecc71', brightGreen: '#56d364',
            yellow: '#e3b341', brightYellow: '#f0e68c',
            blue: '#58a6ff', brightBlue: '#79c0ff',
            magenta: '#bc8cff', brightMagenta: '#d2a8ff',
            cyan: '#56d4dd', brightCyan: '#39c5cf',
            white: '#abb2bf', brightWhite: '#e6edf3',
        },
        fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: 'block',
        allowTransparency: false,
        scrollback: 2000,
        convertEol: true,
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();

    // Resize observer — terminal boyutunu otomatik ayarla
    const ro = new ResizeObserver(() => {
        try { fitAddon.fit(); } catch (e) { }
    });
    ro.observe(container);

    return { term, fitAddon };
}

async function initTerminal(cwd) {
    // xterm henüz oluşturulmadıysa oluştur
    if (!xtermMain) {
        const created = createXterm('xterm-terminal');
        if (!created) return;
        xtermMain = created.term;
        xtermMainFit = created.fitAddon;

        // Klavye girdisini shell'e ilet
        xtermMain.onData(async (data) => {
            if (activeTerminalId) {
                await ipcRenderer.invoke('terminal:write', activeTerminalId, data);
            }
        });
    }

    const result = await ipcRenderer.invoke('terminal:create', cwd || undefined);
    activeTerminalId = result.id;
    xtermMain.writeln('\x1b[32m' + tr('terminal.main.title', 'CraftIDE Terminal') + ' ⛏️ — ' + result.shell + '\x1b[0m');
    xtermMain.writeln('\x1b[2m' + tr('terminal.main.cwd', 'Working directory: {cwd}', { cwd: result.cwd }) + '\x1b[0m');
    xtermMain.writeln('');
}

// Terminal çıktısını dinle (main process'ten gelen)
ipcRenderer.on('terminal:output', (_, id, data) => {
    if (id === activeTerminalId && xtermMain) {
        xtermMain.write(data);
    }
});

ipcRenderer.on('terminal:exit', (_, id, code) => {
    if (id === activeTerminalId && xtermMain) {
        xtermMain.writeln('');
        xtermMain.writeln('\x1b[2m[Terminal kapandı, çıkış kodu: ' + code + ']\x1b[0m');
        activeTerminalId = null;
        // Otomatik yeniden başlat
        setTimeout(() => initTerminal(currentProjectPath), 500);
    }
});

ipcRenderer.on('ai:server-error', (_, errorMsg) => {
    if (window.aiManager) {
        window.aiManager.processServerError(errorMsg);
    }
});

// appendTerminalLine artık xterm'e yazıyor — eski çağrılar için uyumluluk
function appendTerminalLine(text, className) {
    if (!xtermMain) return;
    let prefix = '';
    if (className === 'error') prefix = '\x1b[31m';
    else if (className === 'success') prefix = '\x1b[32m';
    else if (className === 'dim') prefix = '\x1b[2m';
    else if (className === 'info') prefix = '\x1b[36m';
    const localized = (window.Lang && typeof window.Lang.localizeMessage === 'function')
        ? window.Lang.localizeMessage(text)
        : text;
    xtermMain.writeln(prefix + localized + (prefix ? '\x1b[0m' : ''));
}

// ═══════════════════════════════════════════════════════════
// Window Controls (Custom Titlebar)
// ═══════════════════════════════════════════════════════════

document.getElementById('btn-minimize').addEventListener('click', () => {
    ipcRenderer.send('window-minimize');
});

document.getElementById('btn-maximize').addEventListener('click', () => {
    ipcRenderer.send('window-maximize');
});

document.getElementById('btn-close').addEventListener('click', () => {
    ipcRenderer.send('window-close');
});

// ═══════════════════════════════════════════════════════════
// Activity Bar — Panel Switching
// ═══════════════════════════════════════════════════════════

document.querySelectorAll('.activity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.hasAttribute('data-action')) {
            const action = btn.getAttribute('data-action');
            if (action === 'visual-builder') {
                openFile('visual-builder://tab', getVirtualTabName('visual-builder://tab'));
            } else if (action === 'blockbench') {
                openFile('blockbench://tab', getVirtualTabName('blockbench://tab'));
            } else if (action === 'settings') {
                openFile('settings://tab', getVirtualTabName('settings://tab'));
            } else if (action === 'server-manager') {
                openFile('server-manager://tab', getVirtualTabName('server-manager://tab'));
            } else if (action === 'image-editor') {
                openFile('image-editor://tab', getVirtualTabName('image-editor://tab'));
            } else if (action === 'gui-builder') {
                openFile('gui-builder://tab', getVirtualTabName('gui-builder://tab'));
            } else if (action === 'command-tree') {
                openFile('command-tree://tab', getVirtualTabName('command-tree://tab'));
            } else if (action === 'recipe-creator') {
                openFile('recipe-creator://tab', getVirtualTabName('recipe-creator://tab'));
            } else if (action === 'permission-tree') {
                openFile('permission-tree://tab', getVirtualTabName('permission-tree://tab'));
            } else if (action === 'marketplace') {
                openFile('marketplace://tab', getVirtualTabName('marketplace://tab'));
            } else if (action === 'mc-tools') {
                // Toggle MC Tools dropdown
                toggleMcToolsDropdown(btn);
            }
            // New logic for data-action
            const panelId = btn.getAttribute('data-action');
            if (panelId === 'welcome') {
                showWelcome();
                return;
            }
            return;
        }

        const actualPanelId = btn.getAttribute('data-panel');
        if (!actualPanelId) return;

        const activityBtns = document.querySelectorAll('.activity-btn'); // Define activityBtns
        activityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
        const targetPanel = document.getElementById(`panel-${actualPanelId}`); // Use actualPanelId
        if (targetPanel) targetPanel.classList.add('active');

        activePanel = actualPanelId; // Update activePanel
        syncRendererStore({ ui: { activePanel } });
    });
});

// ═══════════════════════════════════════════════════════════
// File Explorer
// ═══════════════════════════════════════════════════════════

async function openFolder(folderPath) {
    if (!folderPath) {
        folderPath = await ipcRenderer.invoke('dialog:openFolder');
    }
    if (!folderPath) return;

    currentProjectPath = folderPath;
    syncRendererStore({ project: { path: currentProjectPath } });
    document.getElementById('titlebar-filename').textContent = nodePath.basename(folderPath);

    await renderFileTree(folderPath);

    // Auto-detect project platform and sync Server Manager
    try {
        const entries = await ipcRenderer.invoke('fs:readDir', folderPath);

        let isForge = false;
        let isFabric = false;

        try {
            const resAttrs = await ipcRenderer.invoke('fs:readDir', nodePath.join(folderPath, 'src', 'main', 'resources'));
            if (resAttrs && Array.isArray(resAttrs)) {
                if (resAttrs.some(e => e.name === 'fabric.mod.json')) isFabric = true;
            }
            const metaInfAttrs = await ipcRenderer.invoke('fs:readDir', nodePath.join(folderPath, 'src', 'main', 'resources', 'META-INF'));
            if (metaInfAttrs && Array.isArray(metaInfAttrs)) {
                if (metaInfAttrs.some(e => e.name === 'mods.toml')) isForge = true;
            }
        } catch (e) { }

        const smTypeSelect = document.getElementById('sm-type-select');
        if (smTypeSelect) {
            if (isForge) {
                smTypeSelect.value = 'forge';
                smTypeSelect.disabled = true; // Lock to prevent mismatch
            } else if (isFabric) {
                smTypeSelect.value = 'fabric';
                smTypeSelect.disabled = true;
            } else {
                smTypeSelect.value = 'paper';
                smTypeSelect.disabled = false; // Allow fallback to spigot/vanilla
            }
        }
    } catch (err) {
        console.error("Platform detection err:", err);
    }

    showNotification('\u{1F4C2} ' + nodePath.basename(folderPath) + ' açıldı', 'success');
}

async function renderFileTree(dirPath, parentEl, depth) {
    depth = depth || 0;
    const treeContainer = parentEl || document.getElementById('file-tree');

    if (!parentEl) {
        treeContainer.innerHTML = '';
    }

    const entries = await ipcRenderer.invoke('fs:readDir', dirPath);
    if (!entries || entries.length === 0) return;

    // Sort: directories first, then files, alphabetical
    entries.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    // Filter hidden/build folders
    const filtered = entries.filter(e =>
        !e.name.startsWith('.') &&
        e.name !== 'node_modules' &&
        e.name !== 'target' &&
        e.name !== 'out' &&
        e.name !== 'dist' &&
        e.name !== 'release' &&
        e.name !== '.git'
    );

    for (const entry of filtered) {
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.style.paddingLeft = (16 + depth * 16) + 'px';
        item.dataset.path = entry.path;
        item.dataset.isDir = entry.isDirectory ? '1' : '0';

        const icon = getFileIcon(entry);
        item.innerHTML =
            '<span class="tree-icon">' + icon + '</span>' +
            '<span class="tree-name">' + entry.name + '</span>';

        // Sağ tık context menu
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e.clientX, e.clientY, entry.path, entry.isDirectory, entry.name);
        });

        // Çift tık → yeniden adlandır
        item.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (entry.isDirectory) return;
            startInlineRename(item, entry);
        });

        if (entry.isDirectory) {
            let expanded = false;
            const childContainer = document.createElement('div');
            childContainer.style.display = 'none';

            item.addEventListener('click', async () => {
                expanded = !expanded;
                if (expanded) {
                    childContainer.style.display = 'block';
                    item.querySelector('.tree-icon').textContent = '\u{1F4C2}';
                    if (childContainer.children.length === 0) {
                        await renderFileTree(entry.path, childContainer, depth + 1);
                    }
                } else {
                    childContainer.style.display = 'none';
                    item.querySelector('.tree-icon').textContent = '\u{1F4C1}';
                }
            });

            treeContainer.appendChild(item);
            treeContainer.appendChild(childContainer);
        } else {
            item.addEventListener('click', () => openFile(entry.path));
            treeContainer.appendChild(item);
        }
    }
}

function getFileIcon(entry) {
    if (entry.isDirectory) return '\u{1F4C1}';
    const ext = entry.ext || nodePath.extname(entry.name).toLowerCase();
    const iconMap = {
        '.java': '\u2615', '.sk': '\u{1F4DC}', '.yml': '\u2699\uFE0F', '.yaml': '\u2699\uFE0F',
        '.json': '\u{1F4CB}', '.xml': '\u{1F4C4}', '.properties': '\u{1F527}', '.md': '\u{1F4DD}',
        '.txt': '\u{1F4C3}', '.gradle': '\u{1F418}', '.js': '\u{1F7E8}', '.ts': '\u{1F7E6}',
        '.css': '\u{1F3A8}', '.html': '\u{1F310}', '.png': '\u{1F5BC}\uFE0F', '.jpg': '\u{1F5BC}\uFE0F',
        '.jar': '\u{1F4E6}',
    };
    return iconMap[ext] || '\u{1F4C4}';
}

// ═══════════════════════════════════════════════════════════
// Context Menu — Sağ Tık Menü
// ═══════════════════════════════════════════════════════════

let contextTarget = { path: '', isDir: false, name: '' };

function showContextMenu(x, y, path, isDir, name) {
    contextTarget = { path, isDir, name };
    const menu = document.getElementById('context-menu');

    // Konum ayarla (ekran dışına taşmasını önle)
    const menuW = 220;
    const menuH = 250;
    const posX = (x + menuW > window.innerWidth) ? x - menuW : x;
    const posY = (y + menuH > window.innerHeight) ? y - menuH : y;

    menu.style.left = Math.max(0, posX) + 'px';
    menu.style.top = Math.max(0, posY) + 'px';
    menu.style.display = 'block';
}

function hideContextMenu() {
    document.getElementById('context-menu').style.display = 'none';
}

// Menüyü kapat: herhangi yere tıklayınca
document.addEventListener('click', hideContextMenu);
document.addEventListener('contextmenu', (e) => {
    // File tree dışında sağ tık → default menü kapat
    if (!e.target.closest('.tree-item') && !e.target.closest('.file-tree')) {
        hideContextMenu();
    }
});

// Dosya ağacında boş alana sağ tık
document.getElementById('file-tree').addEventListener('contextmenu', (e) => {
    if (!e.target.closest('.tree-item') && currentProjectPath) {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY, currentProjectPath, true, '');
    }
});

// Context menu aksiyonları
document.querySelectorAll('.context-item').forEach(item => {
    item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        hideContextMenu();

        switch (action) {
            case 'newFile': {
                const parentDir = contextTarget.isDir ? contextTarget.path : nodePath.dirname(contextTarget.path);
                const name = prompt(tr('prompt.newFileName', 'New file name:'), 'new-file.java');
                if (name) {
                    const filePath = nodePath.join(parentDir, name);
                    const result = await ipcRenderer.invoke('fs:createFile', filePath);
                    if (result.success) {
                        showNotification('📄 ' + tr('msg.fileCreated', '{name} created', { name }), 'success');
                        if (currentProjectPath) await renderFileTree(currentProjectPath);
                        await openFile(filePath);
                    } else {
                        showNotification('❌ ' + result.error, 'error');
                    }
                }
                break;
            }
            case 'newFolder': {
                const parentDir = contextTarget.isDir ? contextTarget.path : nodePath.dirname(contextTarget.path);
                const name = prompt(tr('prompt.newFolderName', 'New folder name:'), 'new-folder');
                if (name) {
                    const dirPath = nodePath.join(parentDir, name);
                    const ok = await ipcRenderer.invoke('fs:createDir', dirPath);
                    if (ok) {
                        showNotification('📁 ' + tr('msg.fileCreated', '{name} created', { name }), 'success');
                        if (currentProjectPath) await renderFileTree(currentProjectPath);
                    } else {
                        showNotification('❌ ' + tr('msg.folderCreateError', 'Could not create folder!'), 'error');
                    }
                }
                break;
            }
            case 'rename': {
                const treeItem = document.querySelector('.tree-item[data-path="' + CSS.escape(contextTarget.path) + '"]');
                if (treeItem) {
                    startInlineRename(treeItem, { path: contextTarget.path, name: contextTarget.name, isDirectory: contextTarget.isDir });
                }
                break;
            }
            case 'delete': {
                const confirmMsg = contextTarget.isDir
                    ? tr('prompt.deleteFolder', 'Delete folder "{name}" and all its contents?', { name: contextTarget.name })
                    : tr('prompt.deleteFile', 'Delete file "{name}"?', { name: contextTarget.name });
                if (confirm('⚠️ ' + confirmMsg)) {
                    const result = await ipcRenderer.invoke('fs:delete', contextTarget.path);
                    if (result.success) {
                        showNotification('🗑️ ' + tr('msg.fileDeleted', '{name} deleted', { name: contextTarget.name }), 'success');
                        if (currentProjectPath) await renderFileTree(currentProjectPath);
                        // Açık sekmeyi de kapat
                        if (openFiles.has(contextTarget.path)) {
                            closeTab(contextTarget.path);
                        }
                    } else {
                        showNotification('❌ ' + result.error, 'error');
                    }
                }
                break;
            }
            case 'copyPath': {
                await ipcRenderer.invoke('fs:copyPath', contextTarget.path);
                showNotification('📋 ' + tr('msg.pathCopied', 'Path copied'), 'success');
                break;
            }
            case 'openInExplorer': {
                await ipcRenderer.invoke('fs:openInExplorer', contextTarget.path);
                break;
            }
            case 'openInTerminal': {
                const dir = contextTarget.isDir ? contextTarget.path : nodePath.dirname(contextTarget.path);
                if (activeTerminalId) {
                    await ipcRenderer.invoke('terminal:write', activeTerminalId, 'cd "' + dir + '"\n');
                    showNotification('📂 ' + tr('msg.terminalDirChanged', 'Terminal directory changed'), 'success');
                }
                break;
            }
        }
    });
});

// ═══════════════════════════════════════════════════════════
// Inline Rename
// ═══════════════════════════════════════════════════════════

function startInlineRename(treeItem, entry) {
    const nameSpan = treeItem.querySelector('.tree-name');
    if (!nameSpan) return;
    const oldName = entry.name || nodePath.basename(entry.path);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'rename-input';
    input.value = oldName;

    nameSpan.textContent = '';
    nameSpan.appendChild(input);
    input.focus();
    // Dosya uzantısı hariç seç
    const dotIndex = oldName.lastIndexOf('.');
    input.setSelectionRange(0, dotIndex > 0 ? dotIndex : oldName.length);

    async function commitRename() {
        const newName = input.value.trim();
        input.removeEventListener('blur', commitRename);

        if (newName && newName !== oldName) {
            const oldPath = entry.path;
            const newPath = nodePath.join(nodePath.dirname(oldPath), newName);
            const result = await ipcRenderer.invoke('fs:rename', oldPath, newPath);
            if (result.success) {
                showNotification('✏️ ' + tr('msg.renamed', '{old} → {new}', { old: oldName, new: newName }), 'success');
                if (currentProjectPath) await renderFileTree(currentProjectPath);
            } else {
                showNotification('❌ ' + result.error, 'error');
                nameSpan.textContent = oldName;
            }
        } else {
            nameSpan.textContent = oldName;
        }
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
        if (e.key === 'Escape') { input.removeEventListener('blur', commitRename); nameSpan.textContent = oldName; }
    });
    input.addEventListener('blur', commitRename);
}

// ═══════════════════════════════════════════════════════════
// Header Buttons — Yeni Dosya, Yeni Klasör, Yenile
// ═══════════════════════════════════════════════════════════

document.getElementById('btn-new-file').addEventListener('click', async () => {
    if (!currentProjectPath) { showNotification(tr('msg.openProjectFirst', 'Open a project first!'), 'error'); return; }
    const name = prompt(tr('prompt.newFileName', 'New file name:'), 'new-file.java');
    if (name) {
        const filePath = nodePath.join(currentProjectPath, name);
        const result = await ipcRenderer.invoke('fs:createFile', filePath);
        if (result.success) {
            showNotification('📄 ' + tr('msg.fileCreated', '{name} created', { name }), 'success');
            await renderFileTree(currentProjectPath);
            await openFile(filePath);
        } else {
            showNotification('❌ ' + result.error, 'error');
        }
    }
});

document.getElementById('btn-new-folder').addEventListener('click', async () => {
    if (!currentProjectPath) { showNotification(tr('msg.openProjectFirst', 'Open a project first!'), 'error'); return; }
    const name = prompt(tr('prompt.newFolderName', 'New folder name:'), 'new-folder');
    if (name) {
        const dirPath = nodePath.join(currentProjectPath, name);
        const ok = await ipcRenderer.invoke('fs:createDir', dirPath);
        if (ok) {
            showNotification('📁 ' + tr('msg.fileCreated', '{name} created', { name }), 'success');
            await renderFileTree(currentProjectPath);
        } else {
            showNotification('❌ ' + tr('msg.folderCreateError', 'Could not create folder!'), 'error');
        }
    }
});

document.getElementById('btn-refresh-tree').addEventListener('click', async () => {
    if (currentProjectPath) {
        await renderFileTree(currentProjectPath);
        showNotification('🔄 ' + tr('msg.treeRefreshed', 'File tree refreshed'), 'success');
    }
});

// ═══════════════════════════════════════════════════════════
// File Operations
// ═══════════════════════════════════════════════════════════

async function openFile(filePath, virtualName = null) {
    if (!filePath) {
        filePath = await ipcRenderer.invoke('dialog:openFile');
    }
    if (!filePath) return;

    if (openFiles.has(filePath)) {
        activateTab(filePath);
        return;
    }

    if (filePath.startsWith('visual-builder://') || filePath.startsWith('blockbench://') || filePath.startsWith('settings://') || filePath.startsWith('server-manager://') || filePath.startsWith('image-editor://') || filePath.startsWith('gui-builder://') || filePath.startsWith('command-tree://') || filePath.startsWith('recipe-creator://') || filePath.startsWith('permission-tree://') || filePath.startsWith('marketplace://')) {
        openFiles.set(filePath, { content: '', modified: false, virtual: true });
        addTab(filePath, getVirtualTabName(filePath, virtualName));
        activateTab(filePath);
        return;
    }

    if (filePath.startsWith('generated://')) {
        // generated:// sekmeleri zaten openFiles'a eklendi — sadece aktif et
        if (!openFiles.has(filePath)) {
            openFiles.set(filePath, { content: '', modified: false, virtual: true, generated: true });
        }
        addTab(filePath, virtualName);
        activateTab(filePath);
        return;
    }

    const ext = nodePath.extname(filePath).toLowerCase();

    // Yalnızca Metin Dosyaları için okuma yap, Binary veya Resim dosyalarına girme
    let content = '';
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        content = filePath; // Image Path
    } else {
        content = await ipcRenderer.invoke('fs:readFile', filePath);
        if (content === null) {
            showNotification(tr('msg.fileReadError', 'Could not read file!'), 'error');
            return;
        }
    }

    openFiles.set(filePath, { content: content, modified: false, virtual: false });
    addTab(filePath);
    activateTab(filePath);
}

function addTab(filePath, overrideName = null) {
    const tabBar = document.getElementById('tab-bar');
    let name = overrideName;
    let icon = '📄';
    let ext = '';

    const virtualMeta = getVirtualTabMeta(filePath);
    if (virtualMeta) {
        name = name || tr(virtualMeta.key, virtualMeta.fallback);
        icon = virtualMeta.icon;
    } else if (filePath.startsWith('generated://')) {
        const genName = filePath.replace('generated://', '');
        name = name || genName;
        icon = genName.endsWith('.sk') ? '📜' : '☕';
    } else {
        name = nodePath.basename(filePath);
        ext = nodePath.extname(filePath).toLowerCase();
        icon = getFileIcon({ name: name, ext: ext, isDirectory: false });
    }

    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-tab', filePath);
    tab.innerHTML =
        '<span class="tab-icon">' + icon + '</span>' +
        '<span class="tab-name">' + name + '</span>' +
        '<button class="tab-close" title="' + tr('ui.tab.close', 'Close') + '"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z"/></svg></button>';

    tab.addEventListener('click', (e) => {
        if (!e.target.closest('.tab-close')) {
            activateTab(filePath);
        }
    });

    tab.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(filePath);
    });

    tabBar.appendChild(tab);
}

function refreshLocalizedTabLabels() {
    document.querySelectorAll('.tab').forEach((tab) => {
        const path = tab.getAttribute('data-tab') || '';
        const nameEl = tab.querySelector('.tab-name');
        const closeEl = tab.querySelector('.tab-close');
        if (closeEl) closeEl.title = tr('ui.tab.close', 'Close');
        if (!nameEl) return;
        if (path === 'welcome') {
            nameEl.textContent = tr('ui.titlebar.welcome', 'Welcome');
            return;
        }
        const meta = getVirtualTabMeta(path);
        if (meta) nameEl.textContent = tr(meta.key, meta.fallback);
    });
}

function activateTab(filePath) {
    // Guard: if 'welcome' is passed, delegate to showWelcome()
    if (filePath === 'welcome') {
        showWelcome();
        return;
    }
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    const tabs = document.querySelectorAll('.tab');
    let tabName = '';
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === filePath) {
            tab.classList.add('active');
            tabName = tab.querySelector('.tab-name').textContent;
        }
    });

    document.getElementById('welcome-screen').classList.remove('active');

    // Hide all editor views
    document.querySelectorAll('.editor-container').forEach(ec => ec.style.display = 'none');

    const ext = filePath.includes('//') ? '' : nodePath.extname(filePath).toLowerCase();

    const fileData = openFiles.get(filePath);

    if (filePath.startsWith('visual-builder://')) {
        document.getElementById('visual-builder-container').style.display = 'flex';
        // Auto-refresh layout for canvas
        if (typeof resizeVBCanvas === 'function') setTimeout(resizeVBCanvas, 50);
    } else if (filePath.startsWith('blockbench://') || ext === '.bbmodel') {
        document.getElementById('blockbench-container').style.display = 'block';
    } else if (filePath.startsWith('settings://')) {
        document.getElementById('settings-container').style.display = 'block';
    } else if (filePath.startsWith('server-manager://')) {
        document.getElementById('server-manager-container').style.display = 'flex';
        // Sunucu konsolu xterm başlat
        setTimeout(() => initServerConsole(), 50);
    } else if (filePath.startsWith('gui-builder://')) {
        document.getElementById('gui-builder-container').style.display = 'flex';
        if (typeof window.initGuiBuilder === 'function') setTimeout(() => window.initGuiBuilder(), 50);
    } else if (filePath.startsWith('command-tree://')) {
        document.getElementById('command-tree-container').style.display = 'flex';
        if (typeof window.initCommandTree === 'function') setTimeout(() => window.initCommandTree(), 50);
    } else if (filePath.startsWith('recipe-creator://')) {
        document.getElementById('recipe-creator-container').style.display = 'flex';
        if (typeof window.initRecipeCreator === 'function') setTimeout(() => window.initRecipeCreator(), 50);
    } else if (filePath.startsWith('permission-tree://')) {
        document.getElementById('permission-tree-container').style.display = 'flex';
        if (typeof window.initPermissionTree === 'function') setTimeout(() => window.initPermissionTree(), 50);
    } else if (filePath.startsWith('marketplace://')) {
        document.getElementById('marketplace-container').style.display = 'flex';
        if (typeof window.initMarketplace === 'function') setTimeout(() => window.initMarketplace(), 50);
    } else if (filePath.startsWith('image-editor://') || ['.png', '.jpg', '.jpeg'].includes(ext)) {
        document.getElementById('image-editor-container').style.display = 'block';
        // İlk açılışta editörü başlat
        if (window.initImageEditor && !document.getElementById('ie-root')) {
            window.initImageEditor();
        }
        if (['.png', '.jpg', '.jpeg'].includes(ext) && window.loadImageToEditor) {
            window.loadImageToEditor(filePath);
        }
    } else if (filePath.startsWith('generated://')) {
        document.getElementById('editor-container').style.display = 'block';
        if (fileData && window.monacoEditor && window.monaco) {
            const genName = filePath.replace('generated://', '');
            const language = genName.endsWith('.sk') ? 'plaintext' : 'java';
            const model = window.monaco.editor.createModel(fileData.content, language);
            const oldModel = window.monacoEditor.getModel();
            window.monacoEditor.setModel(model);
            if (oldModel && oldModel !== model) oldModel.dispose();
            document.getElementById('status-language').textContent = language.charAt(0).toUpperCase() + language.slice(1);
        }
    } else if ((ext === '.yml' || ext === '.yaml') && fileData) {
        // Visual Config Editor
        const cfgContainer = document.getElementById('config-editor-container');
        if (cfgContainer) {
            cfgContainer.style.display = 'flex';
            const fn = nodePath.basename(filePath).toLowerCase();
            showConfigEditor(filePath, fileData.content, fn === 'plugin.yml' ? 'plugin' : 'generic');
        } else {
            // Fallback: Monaco
            document.getElementById('editor-container').style.display = 'block';
            if (window.monacoEditor && window.monaco) {
                const model = window.monaco.editor.createModel(fileData.content, 'yaml');
                const oldModel = window.monacoEditor.getModel();
                window.monacoEditor.setModel(model);
                if (oldModel && oldModel !== model) oldModel.dispose();
            }
        }
    } else {
        // Default Monaco Editor
        document.getElementById('editor-container').style.display = 'block';
        if (fileData && window.monacoEditor && window.monaco) {
            const language = getLanguageForFile(filePath);
            const model = window.monaco.editor.createModel(fileData.content, language);
            const oldModel = window.monacoEditor.getModel();
            window.monacoEditor.setModel(model);
            if (oldModel && oldModel !== model) {
                oldModel.dispose();
            }
            document.getElementById('status-language').textContent = language.charAt(0).toUpperCase() + language.slice(1);
        }
    }

    currentFilePath = filePath;
    syncRendererStore({
        ui: { currentFile: currentFilePath },
        project: { openTabs: document.querySelectorAll('.tab').length },
    });
    document.getElementById('titlebar-filename').textContent = filePath.startsWith('virtual://') || filePath.includes('//') ? tabName : nodePath.basename(filePath);
}

async function closeTab(filePath) {
    // Kaydedilmemiş değişiklik kontrolü (resim dosyaları için)
    const extCheck = filePath.includes('//') ? '' : nodePath.extname(filePath).toLowerCase();
    const isImageFile = ['.png', '.jpg', '.jpeg'].includes(extCheck);
    if (isImageFile &&
        typeof window.imageEditorIsDirty === 'function' && window.imageEditorIsDirty() &&
        typeof window.imageEditorCurrentPath === 'function' && window.imageEditorCurrentPath() === filePath) {

        const result = await ipcRenderer.invoke('dialog:showMessage', {
            type: 'question',
            title: tr('dialog.unsaved.title', 'Unsaved Changes'),
            message: tr('dialog.unsaved.message', 'There are unsaved changes in "{name}".', { name: nodePath.basename(filePath) }),
            detail: tr('dialog.unsaved.detail', 'Do you want to save your changes?'),
            buttons: [tr('dialog.unsaved.save', 'Save'), tr('dialog.unsaved.dontSave', "Don't Save"), tr('dialog.unsaved.cancel', 'Cancel')],
            defaultId: 0,
            cancelId: 2
        });

        if (result.response === 2) return; // İptal — sekme açık kalır
        if (result.response === 0 && typeof window.saveImageEditorFile === 'function') {
            await window.saveImageEditorFile(); // Kaydet
        }
        // response === 1 → kaydetmeden kapat
    }

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === filePath) {
            tab.remove();
        }
    });
    openFiles.delete(filePath);

    const remainingTabs = document.querySelectorAll('.tab');
    if (remainingTabs.length > 0) {
        const lastTab = remainingTabs[remainingTabs.length - 1];
        const tabPath = lastTab.getAttribute('data-tab');
        if (tabPath === 'welcome') {
            showWelcome();
        } else {
            activateTab(tabPath);
        }
    } else {
        showWelcome();
    }
}

function showWelcome() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const welcomeTab = document.querySelector('.tab[data-tab="welcome"]');
    if (welcomeTab) welcomeTab.classList.add('active');

    // Hide ALL editor containers
    document.querySelectorAll('.editor-container').forEach(ec => ec.style.display = 'none');

    document.getElementById('welcome-screen').classList.add('active');
    document.getElementById('titlebar-filename').textContent = tr('ui.titlebar.welcome', 'Welcome');
    currentFilePath = null;
    syncRendererStore({
        ui: { currentFile: null },
        project: { openTabs: document.querySelectorAll('.tab').length },
    });
}

async function saveCurrentFile() {
    if (!currentFilePath || !window.monacoEditor) return;

    const content = window.monacoEditor.getValue();
    const success = await ipcRenderer.invoke('fs:writeFile', currentFilePath, content);

    if (success) {
        openFiles.set(currentFilePath, { content: content, modified: false });
        showNotification('💾 ' + tr('msg.fileSaved', '{name} saved', { name: nodePath.basename(currentFilePath) }), 'success');
    } else {
        showNotification(tr('msg.fileSaveError', 'Could not save file!'), 'error');
    }
}

window.saveCurrentFile = saveCurrentFile;

function getLanguageForFile(filePath) {
    const ext = nodePath.extname(filePath).toLowerCase();
    const langMap = {
        '.java': 'java', '.sk': 'skript', '.yml': 'yaml', '.yaml': 'yaml',
        '.json': 'json', '.xml': 'xml', '.properties': 'ini', '.md': 'markdown',
        '.txt': 'plaintext', '.gradle': 'groovy', '.js': 'javascript',
        '.ts': 'typescript', '.css': 'css', '.html': 'html', '.py': 'python',
        '.sh': 'shell', '.bat': 'bat', '.ps1': 'powershell', '.toml': 'toml',
    };
    return langMap[ext] || 'plaintext';
}

// ═══════════════════════════════════════════════════════════
// New Project Modal
// ═══════════════════════════════════════════════════════════

function showNewProjectModal() {
    document.getElementById('modal-new-project').style.display = 'flex';
}

function hideNewProjectModal() {
    document.getElementById('modal-new-project').style.display = 'none';
}

document.getElementById('modal-close').addEventListener('click', hideNewProjectModal);
document.getElementById('btn-cancel-project').addEventListener('click', hideNewProjectModal);

document.getElementById('modal-new-project').addEventListener('click', (e) => {
    if (e.target.id === 'modal-new-project') hideNewProjectModal();
});

// Platform selection
document.querySelectorAll('.platform-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.platform-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const platform = card.dataset.platform;
        const javaOptions = document.getElementById('java-options');
        const depsGroup = document.getElementById('deps-group');
        const labelName = document.getElementById('label-project-name');
        const inputName = document.getElementById('input-project-name');

        if (platform === 'skript') {
            javaOptions.style.display = 'none';
            depsGroup.style.display = 'none';
            if (labelName) labelName.textContent = tr('modal.label.skriptName', 'Skript Name');
            if (inputName) inputName.placeholder = 'MyAwesomeSkript';
        } else if (platform === 'fabric' || platform === 'forge') {
            javaOptions.style.display = 'block';
            depsGroup.style.display = 'block';
            if (labelName) labelName.textContent = tr('modal.label.modName', 'Mod Name');
            if (inputName) inputName.placeholder = 'MyAwesomeMod';
        } else {
            javaOptions.style.display = 'block';
            depsGroup.style.display = 'block';
            if (labelName) labelName.textContent = tr('modal.label.pluginName', 'Plugin Name');
            if (inputName) inputName.placeholder = 'MyAwesomePlugin';
        }
    });
});

// Update package name when project name changes
document.getElementById('input-project-name').addEventListener('input', (e) => {
    const name = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    document.getElementById('input-package-name').value = 'com.example.' + (name || 'myplugin');
});

// Create project
document.getElementById('btn-create-project').addEventListener('click', async () => {
    const activePlatform = document.querySelector('.platform-card.active');
    const platform = activePlatform ? activePlatform.dataset.platform : 'paper';
    const name = document.getElementById('input-project-name').value.trim();
    const mcVersion = document.getElementById('input-mc-version').value;
    const packageName = document.getElementById('input-package-name').value.trim();

    if (!name) {
        showNotification(tr('msg.pluginNameRequired', 'Plugin name is required!'), 'error');
        return;
    }

    const targetDir = await ipcRenderer.invoke('dialog:openFolder');
    if (!targetDir) return;

    const deps = [];
    document.querySelectorAll('.dep-check input:checked').forEach(cb => {
        deps.push(cb.value);
    });

    const result = await ipcRenderer.invoke('project:scaffold', {
        platform: platform,
        mcVersion: mcVersion,
        name: name,
        packageName: packageName,
        targetDir: targetDir,
        dependencies: deps,
    });

    if (result.success) {
        hideNewProjectModal();
        showNotification('⛏️ ' + tr('msg.projectCreated', '{name} created successfully!', { name }), 'success');
        await openFolder(result.path);
    } else {
        showNotification(tr('msg.error', 'Error: {error}', { error: result.error }), 'error');
    }
});

// ═══════════════════════════════════════════════════════════
// Bottom Panel Tabs
// ═══════════════════════════════════════════════════════════

document.querySelectorAll('.bottom-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.bottom-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const targetId = tab.dataset.btab;
        document.querySelectorAll('.terminal-content').forEach(c => c.classList.remove('active'));
        const targetContent = document.getElementById(targetId + '-content');
        if (targetContent) targetContent.classList.add('active');

        // xterm terminal görünür olunca fit uygula
        if (targetId === 'terminal' && xtermMainFit) {
            setTimeout(() => { try { xtermMainFit.fit(); } catch (e) { } }, 10);
        }
    });
});

// Terminal input artık xterm.onData üzerinden geçiyor — eski #terminal-input kaldırıldı

// ═══════════════════════════════════════════════════════════
// Dosya Arama — Gerçek Dosya İçeriği Arama
// ═══════════════════════════════════════════════════════════

let searchTimeout = null;
document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    if (query.length < 2) {
        document.getElementById('search-results').innerHTML = '<div style="padding:16px;color:#8b949e;font-size:12px;">' + tr('search.minChars', 'Type at least 2 characters') + '</div>';
        return;
    }

    searchTimeout = setTimeout(async () => {
        if (!currentProjectPath) {
            document.getElementById('search-results').innerHTML = '<div style="padding:16px;color:#8b949e;font-size:12px;">' + tr('search.openProject', 'Open a project first') + '</div>';
            return;
        }

        document.getElementById('search-results').innerHTML = '<div style="padding:16px;color:#8b949e;font-size:12px;">' + tr('search.searching', 'Searching...') + '</div>';

        const results = await ipcRenderer.invoke('search:files', currentProjectPath, query);
        const container = document.getElementById('search-results');

        if (!results || results.length === 0) {
            container.innerHTML = '<div style="padding:16px;color:#8b949e;font-size:12px;">' + tr('search.noResults', 'No results found') + '</div>';
            return;
        }

        container.innerHTML = '';
        for (const r of results) {
            const item = document.createElement('div');
            item.style.cssText = 'padding:6px 10px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;';
            item.innerHTML =
                '<div style="color:#2ecc71;font-weight:500;">' + nodePath.basename(r.file) + ':' + r.line + '</div>' +
                '<div style="color:#8b949e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(r.preview) + '</div>';
            item.addEventListener('click', async () => {
                await openFile(r.file);
                setTimeout(() => {
                    if (window.monacoEditor) {
                        window.monacoEditor.revealLineInCenter(r.line);
                        window.monacoEditor.setPosition({ lineNumber: r.line, column: 1 });
                        window.monacoEditor.focus();
                    }
                }, 200);
            });
            item.addEventListener('mouseenter', () => { item.style.background = 'rgba(46,204,113,0.1)'; });
            item.addEventListener('mouseleave', () => { item.style.background = ''; });
            container.appendChild(item);
        }

        const countDiv = document.createElement('div');
        countDiv.style.cssText = 'padding:6px 10px;font-size:11px;color:#8b949e;';
        const limitPart = results.length >= 100 ? (' ' + tr('search.limit', '(limit)')) : '';
        countDiv.textContent = tr('search.results', '{count} result(s) found', { count: results.length }) + limitPart;
        container.appendChild(countDiv);
    }, 300);
});

// Toggle bottom panel
document.getElementById('btn-toggle-panel').addEventListener('click', () => {
    const panel = document.getElementById('bottom-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'flex';
    } else {
        panel.style.display = 'none';
    }
});

// ═══════════════════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════════════════

function showNotification(message, type) {
    type = type || 'info';
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'notification ' + type;
    const text = (window.Lang && typeof window.Lang.localizeMessage === 'function')
        ? window.Lang.localizeMessage(message)
        : message;
    notif.textContent = text;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(60px)';
        notif.style.transition = '0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════
// Welcome Screen Actions
// ═══════════════════════════════════════════════════════════

// --- Welcome Screen Links (VS Code Style) ---
document.getElementById('btn-new-project')?.addEventListener('click', (e) => {
    e.preventDefault();
    showNewProjectModal();
});

document.getElementById('wl-new-file')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!currentProjectPath) {
        showNotification(tr('msg.openProjectFirst', 'Open a project first!'), 'error');
        return;
    }
    const name = prompt(tr('prompt.newFileName', 'New file name:'), 'new-file.java');
    if (name) {
        const filePath = nodePath.join(currentProjectPath, name);
        const result = await ipcRenderer.invoke('fs:createFile', filePath);
        if (result.success) {
            showNotification('📄 ' + tr('msg.fileCreated', '{name} created', { name }), 'success');
            await renderFileTree(currentProjectPath);
            await openFile(filePath);
        } else {
            showNotification('❌ ' + result.error, 'error');
        }
    }
});

document.getElementById('wl-open-file')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const filePath = await ipcRenderer.invoke('dialog:openFile');
    if (filePath) {
        await openFile(filePath);
    }
});

document.getElementById('wl-open-folder')?.addEventListener('click', async (e) => {
    e.preventDefault();
    openFolder();
});

document.getElementById('wl-ai-create')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.NoCodeSuite?.openOneStepModal) {
        document.querySelector('.activity-btn[data-action="visual-builder"]')?.click();
        setTimeout(() => window.NoCodeSuite.openOneStepModal(), 120);
        return;
    }
    document.querySelector('.activity-btn[data-panel="ai"]')?.click();
});

document.getElementById('wt-get-started')?.addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('💡 ' + tr('notify.welcomeHint', 'Welcome to CraftIDE! Start by creating a new project.'), 'info');
    document.getElementById('btn-new-project')?.click();
});

document.getElementById('wt-learn-basics')?.addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('📖 ' + tr('notify.basicsHint', 'Basics: Manage files from the left panel and use the terminal below.'), 'info');
});

document.getElementById('btn-open-folder')?.addEventListener('click', () => openFolder());
document.getElementById('btn-explorer-open')?.addEventListener('click', () => openFolder());

document.getElementById('btn-ai-send').addEventListener('click', () => {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    if (message) {
        sendAIMessage(message);
        input.value = '';
    }
});

document.getElementById('ai-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('btn-ai-send').click();
    }
});

function sendAIMessage(message) {
    const messages = document.getElementById('ai-messages');

    const userMsg = document.createElement('div');
    userMsg.className = 'ai-message ai-user';
    userMsg.innerHTML =
        '<div class="ai-avatar">\u{1F464}</div>' +
        '<div class="ai-content"><p>' + escapeHtml(message) + '</p></div>';
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;

    // AI yanıt container'ı oluştur
    const aiMsg = document.createElement('div');
    aiMsg.className = 'ai-message ai-system';
    const aiContent = document.createElement('div');
    aiContent.className = 'ai-content';
    aiContent.innerHTML = '<p><span class="spinner" style="display:inline-block;width:16px;height:16px;border-width:2px;vertical-align:middle;margin-right:8px;"></span>' + tr('ai.thinking', 'Thinking...') + '</p>';
    aiMsg.innerHTML = '<div class="ai-avatar">\u{1F916}</div>';
    aiMsg.appendChild(aiContent);
    messages.appendChild(aiMsg);
    messages.scrollTop = messages.scrollHeight;

    // Gerçek LLM çağrısı
    if (window.llmProvider) {
        let fullResponse = '';
        aiContent.innerHTML = '<p></p>';
        const responseParagraph = aiContent.querySelector('p');

        window.llmProvider.generateStream(
            message,
            window.MC_SYSTEM_PROMPT || 'Sen yardımcı bir AI asistanısın.',
            (chunk) => {
                fullResponse += chunk;
                // Markdown-like formatting (basit)
                responseParagraph.innerHTML = formatAIResponse(fullResponse);
                messages.scrollTop = messages.scrollHeight;
            }
        ).then(() => {
            // Streaming tamamlandı
            responseParagraph.innerHTML = formatAIResponse(fullResponse);
            messages.scrollTop = messages.scrollHeight;
        }).catch((err) => {
            aiContent.innerHTML =
                '<p>\u274C AI hatası: ' + escapeHtml(err.message) + '</p>' +
                '<p class="ai-hint">Ayarlar panelinden AI sağlayıcınızı kontrol edin. Ollama için: ollama serve komutunu çalıştırın.</p>';
            messages.scrollTop = messages.scrollHeight;
        });
    } else {
        aiContent.innerHTML =
            '<p>\u{1F527} AI sistemi yüklenmedi. Sayfayı yenileyin.</p>';
    }
}

function formatAIResponse(text) {
    // Basit Markdown → HTML dönüşümü
    return text
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(46,204,113,0.1);padding:2px 6px;border-radius:4px;">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════
// IPC Listeners (from Main Process Menu)
// ═══════════════════════════════════════════════════════════

ipcRenderer.on('new-project', () => showNewProjectModal());
ipcRenderer.on('open-folder', (_, p) => openFolder(p));
ipcRenderer.on('open-file', (_, p) => openFile(p));
ipcRenderer.on('save-file', () => saveCurrentFile());
ipcRenderer.on('show-welcome', () => showWelcome());
ipcRenderer.on('toggle-ai-chat', () => {
    document.querySelector('.activity-btn[data-panel="ai"]').click();
});
ipcRenderer.on('open-settings', () => {
    openFile('settings://tab', getVirtualTabName('settings://tab'));
});
ipcRenderer.on('build-plugin', async () => {
    if (currentProjectPath) {
        appendTerminalLine('\u23F3 Plugin derleniyor...', 'info');
        const result = await ipcRenderer.invoke('build:run', currentProjectPath);
        if (result.success) {
            appendTerminalLine('\u2705 Build başarılı!', 'success');
            showNotification('\u2705 Build başarılı!', 'success');
        } else {
            appendTerminalLine('\u274C Build hatası: ' + result.error, 'error');
            showNotification('\u274C Build hatası!', 'error');
        }
    }
});

// ═══════════════════════════════════════════════════════════
// Build & Test Server Buttons
// ═══════════════════════════════════════════════════════════

document.getElementById('btn-build-plugin').addEventListener('click', async () => {
    if (!currentProjectPath) {
        showNotification('\u274C Önce bir proje açın!', 'error');
        return;
    }
    appendTerminalLine('\u23F3 Plugin derleniyor...', 'info');
    const result = await ipcRenderer.invoke('build:run', currentProjectPath);
    if (result.success) {
        appendTerminalLine('\u2705 Build başarılı!', 'success');
        showNotification('\u2705 Build başarılı!', 'success');
    } else {
        appendTerminalLine('\u274C Build hatası: ' + result.error, 'error');
    }
});

document.getElementById('btn-test-server')?.addEventListener('click', async () => {
    // Legacy button on welcome screen, redirect to our new panel
    openFile('server-manager://tab', getVirtualTabName('server-manager://tab'));
});

// -- Server Manager UI Bindings --
document.getElementById('btn-sm-start')?.addEventListener('click', async () => {
    const status = await ipcRenderer.invoke('server:status');
    if (status && status.status === 'running') {
        showNotification('Sunucu zaten çalışıyor.', 'info');
        return;
    }

    const type = document.getElementById('sm-type-select')?.value || 'paper';
    const version = document.getElementById('sm-version-select')?.value || '1.21.11';

    showNotification('🚀 Test sunucusu başlatılıyor (' + type + ' ' + version + ')...', 'info');

    // Make sure we are on the server manager tab
    if (currentFilePath !== 'server-manager://tab') {
        openFile('server-manager://tab', getVirtualTabName('server-manager://tab'));
    }

    const result = await ipcRenderer.invoke('server:start', {
        mcVersion: version,
        serverType: type,
        serverDir: '', // default
    });

    if (!result.success) {
        showNotification('❌ ' + result.error, 'error');
        appendSmConsoleLine('❌ Sunucu başlatma hatası: ' + result.error, 'error');
    }
});

document.getElementById('btn-sm-stop')?.addEventListener('click', async () => {
    const status = await ipcRenderer.invoke('server:status');
    if (status && status.status === 'running') {
        showNotification('⏹️ Sunucu durduruluyor...', 'info');
        appendSmConsoleLine('⏹️ Durdurma komutu gönderildi...', 'info');
        await ipcRenderer.invoke('server:stop');
    } else {
        showNotification('Sunucu şu an çalışmıyor.', 'info');
    }
});

document.getElementById('btn-sm-deploy')?.addEventListener('click', async () => {
    if (!currentProjectPath) {
        showNotification('❌ Önce bir proje açın!', 'error');
        return;
    }

    appendSmConsoleLine('🚀 Proje sunucuya yükleniyor...', 'info');
    showNotification('Projeyi derleyip sunucuya aktarıyoruz...', 'info');

    // 1. Build project
    const buildResult = await ipcRenderer.invoke('build:run', currentProjectPath);
    if (!buildResult.success) {
        appendSmConsoleLine('❌ Build error: ' + buildResult.error, 'error');
        showNotification('❌ Build başarısız oldu.', 'error');
        return;
    }

    // 2. We assume the build places a JAR or Skript file in target/. We can just send a generic IPC command 
    // to ask main process to deploy from currentProjectPath to serverDir

    // Find built files
    let targetFileToDeploy = null;
    try {
        const entries = await ipcRenderer.invoke('fs:readDir', currentProjectPath);
        const hasPom = entries.some(e => e.name === 'pom.xml');
        const hasBuildGradle = entries.some(e => e.name === 'build.gradle');

        if (hasPom || hasBuildGradle) { // It's a java plugin/mod
            const targetDirPath = nodePath.join(currentProjectPath, hasPom ? 'target' : 'build/libs');
            const targetEntries = await ipcRenderer.invoke('fs:readDir', targetDirPath);
            if (targetEntries && targetEntries.length > 0) {
                // Find first .jar that doesn't end with -original.jar or -sources.jar
                const jars = targetEntries.filter(e => e.name.endsWith('.jar') && !e.name.includes('-original') && !e.name.includes('-sources'));
                if (jars.length > 0) {
                    targetFileToDeploy = jars[0].path;
                }
            }
        } else {
            // Skript projeleri: *.sk dosyalarını bul
            const skripts = entries.filter(e => e.name.endsWith('.sk'));
            if (skripts.length > 0) {
                targetFileToDeploy = skripts[0].path; // just deploy the first one for now
            }
        }
    } catch (e) {
        console.error("Error finding target files", e);
    }

    if (!targetFileToDeploy) {
        appendSmConsoleLine('❌ ' + tr('msg.buildFileNotFound', 'Build artifact not found! Make sure your target (.jar or .sk) file was generated.'), 'error');
        showNotification('Bulunamadı!', 'error');
        return;
    }

    const deployResult = await ipcRenderer.invoke('server:deploy', targetFileToDeploy);
    if (deployResult && deployResult.success) {
        appendSmConsoleLine('✅ Eklenti başarıyla sunucuya kopyalandı! (' + nodePath.basename(targetFileToDeploy) + ')', 'success');
        showNotification('✅ Başarıyla yüklendi!', 'success');

        // Sunucu konsoluna reload komutu at if server is running
        const status = await ipcRenderer.invoke('server:status');
        if (status && status.status === 'running') {
            await ipcRenderer.invoke('server:command', 'reload confirm');
            appendSmConsoleLine('CraftIDE > Sunucu yeniden yükleniyor (reload)...', 'dim');
        }
    } else {
        appendSmConsoleLine('⚠️ Yükleme sırasında bir şeyler ters gitti: ' + (deployResult?.error || 'Bilinmeyen hata'), 'error');
    }
});

// ─── VB "Derle & Test Et" — tek tıkla kod üret → derle → sunucuya yükle ───
async function deployToServer() {
    if (!currentProjectPath) {
        showNotification('❌ Önce bir proje açın!', 'error');
        return;
    }

    // Adım 1: VB'den kodu al
    let code = '';
    if (typeof vbGenerateCode === 'function') {
        code = vbGenerateCode({ returnOnly: true });
    }

    if (!code || code.trim() === '' || code.startsWith('// Henüz') || code.startsWith('# Henüz')) {
        showNotification('⚠️ Önce Visual Builder\'a blok ekleyin!', 'error');
        return;
    }

    showNotification('📝 Kod proje dosyasına yazılıyor...', 'info');

    // Adım 2: Proje tipini belirle ve kodu kaydet
    try {
        const entries = await ipcRenderer.invoke('fs:readDir', currentProjectPath);
        const hasPom = entries.some(e => e.name === 'pom.xml');
        const hasBuildGradle = entries.some(e => e.name === 'build.gradle');
        const isSkript = !hasPom && !hasBuildGradle;

        if (isSkript) {
            const skFiles = entries.filter(e => e.name.endsWith('.sk'));
            const skPath = skFiles.length > 0
                ? skFiles[0].path
                : nodePath.join(currentProjectPath, 'generated.sk');
            await ipcRenderer.invoke('fs:writeFile', skPath, code);
            // Skript için derleme yok, doğrudan deploy
            showNotification('📜 Skript dosyası kaydedildi!', 'success');
            const deployResult = await ipcRenderer.invoke('server:deploy', skPath);
            if (deployResult && deployResult.success) {
                showNotification('✅ Skript sunucuya yüklendi!', 'success');
                const status = await ipcRenderer.invoke('server:status');
                if (status && status.status === 'running') {
                    await ipcRenderer.invoke('server:command', 'reload confirm');
                }
            } else {
                showNotification('❌ Yükleme hatası: ' + (deployResult?.error || '?'), 'error');
            }
            return;
        }

        // Java projesi: src/main/java/... altındaki ilk .java dosyasına yaz
        // Proje adı olarak currentProjectPath'in son klasörünü al
        const projectName = nodePath.basename(currentProjectPath);
        // Basit arama: target klasörü yoksa ana .java dosyayı bul
        const srcMainJava = nodePath.join(currentProjectPath, 'src', 'main', 'java');
        const srcExists = await ipcRenderer.invoke('fs:exists', srcMainJava);
        if (srcExists) {
            // Mevcut .java dosyalarından Main.java'yı bul
            const findMainJava = async (dir) => {
                const items = await ipcRenderer.invoke('fs:readDir', dir);
                if (!items) return null;
                for (const item of items) {
                    if (item.isDirectory) {
                        const found = await findMainJava(item.path);
                        if (found) return found;
                    } else if (item.name === 'Main.java' || item.name === projectName + '.java') {
                        return item.path;
                    }
                }
                // Herhangi bir .java dosyasını döndür
                for (const item of items) {
                    if (!item.isDirectory && item.name.endsWith('.java')) return item.path;
                }
                return null;
            };
            const javaPath = await findMainJava(srcMainJava);
            if (javaPath) {
                await ipcRenderer.invoke('fs:writeFile', javaPath, code);
                showNotification('☕ Java dosyası güncellendi: ' + nodePath.basename(javaPath), 'info');
            }
        }
    } catch (e) {
        console.error('deployToServer - kod yazma hatası:', e);
    }

    // Adım 3: Derle
    showNotification(tr('msg.building', 'Building...'), 'info');
    const buildResult = await ipcRenderer.invoke('build:run', currentProjectPath);
    if (!buildResult.success) {
        showNotification(tr('msg.buildError', 'Build error: {error}', { error: buildResult.error || 'unknown' }), 'error');
        appendSmConsoleLine && appendSmConsoleLine('❌ Build hatası: ' + buildResult.error, 'error');
        return;
    }
    showNotification(tr('msg.buildSuccess', 'Build successful!'), 'success');

    // Adım 4: JAR'ı bul
    let targetFile = null;
    try {
        const entries = await ipcRenderer.invoke('fs:readDir', currentProjectPath);
        const hasPom = entries.some(e => e.name === 'pom.xml');
        const targetDirPath = nodePath.join(currentProjectPath, hasPom ? 'target' : 'build/libs');
        const targetEntries = await ipcRenderer.invoke('fs:readDir', targetDirPath);
        if (targetEntries) {
            const jars = targetEntries.filter(e =>
                e.name.endsWith('.jar') && !e.name.includes('-original') && !e.name.includes('-sources'));
            if (jars.length > 0) targetFile = jars[0].path;
        }
    } catch (e) { console.error('deployToServer - jar arama hatası:', e); }

    if (!targetFile) {
        showNotification('❌ JAR bulunamadı!', 'error');
        return;
    }

    // Adım 5: Sunucuya kopyala
    const deployResult = await ipcRenderer.invoke('server:deploy', targetFile);
    if (deployResult && deployResult.success) {
        showNotification('🚀 ' + nodePath.basename(targetFile) + ' sunucuya yüklendi!', 'success');
        appendSmConsoleLine && appendSmConsoleLine('✅ VB Deploy: ' + nodePath.basename(targetFile) + ' yüklendi!', 'success');
        const status = await ipcRenderer.invoke('server:status');
        if (status && status.status === 'running') {
            await ipcRenderer.invoke('server:command', 'reload confirm');
            appendSmConsoleLine && appendSmConsoleLine('CraftIDE > reload confirm gönderildi', 'dim');
            showNotification('🔄 Sunucu yenileniyor...', 'info');
        }
    } else {
        showNotification('❌ Yükleme hatası: ' + (deployResult?.error || '?'), 'error');
    }
}

// Sunucu konsolu xterm başlatma (server manager açıldığında)
function initServerConsole() {
    if (!xtermServer) {
        const created = createXterm('xterm-server-console');
        if (!created) return;
        xtermServer = created.term;
        xtermServerFit = created.fitAddon;

        xtermServer.writeln('\x1b[32mCraftIDE Test Sunucusu Konsolu ⛏️\x1b[0m');
        xtermServer.writeln('\x1b[2mKomut girin — Enter ile sunucuya gönderin\x1b[0m');
        xtermServer.writeln('');

        // Komut tamponu
        let serverCmdBuffer = '';

        xtermServer.onData(async (data) => {
            const code = data.charCodeAt(0);
            if (data === '\r' || data === '\n') {
                // Enter basıldı
                const cmd = serverCmdBuffer.trim();
                serverCmdBuffer = '';
                xtermServer.writeln('');
                if (cmd) {
                    xtermServer.writeln('\x1b[2m> ' + cmd + '\x1b[0m');
                    await ipcRenderer.invoke('server:command', cmd);
                }
                xtermServer.write('\x1b[32m> \x1b[0m');
            } else if (code === 127 || data === '\x7f') {
                // Backspace
                if (serverCmdBuffer.length > 0) {
                    serverCmdBuffer = serverCmdBuffer.slice(0, -1);
                    xtermServer.write('\b \b');
                }
            } else if (code >= 32) {
                serverCmdBuffer += data;
                xtermServer.write(data);
            }
        });

        // İlk prompt
        xtermServer.write('\x1b[32m> \x1b[0m');
    }
}

// Sunucu konsoldan gelen mesajları göster
ipcRenderer.on('server:log', (_, data) => {
    if (!window.__craftideServerLogs) window.__craftideServerLogs = [];
    window.__craftideServerLogs.push({ ts: Date.now(), line: String(data) });
    if (window.__craftideServerLogs.length > 4000) {
        window.__craftideServerLogs.splice(0, window.__craftideServerLogs.length - 4000);
    }
    document.dispatchEvent(new CustomEvent('craftide:server-log', { detail: String(data) }));

    appendSmConsoleLine(data);
    // Live Debug: VB event bloklarını vurgula
    if (typeof window.highlightEventInVB === 'function') {
        window.highlightEventInVB(data);
    }
    // Smart Error Resolver: stack trace yakala
    _handleServerLogForErrors(data);
});

ipcRenderer.on('server:status', (_, status) => {
    const legacyBtnLabel = document.getElementById('btn-test-server')?.querySelector('.wt-title');
    const smStartBtn = document.getElementById('btn-sm-start');
    const smStopBtn = document.getElementById('btn-sm-stop');

    if (status === 'running') {
        if (legacyBtnLabel) legacyBtnLabel.textContent = 'Sunucuyu Yönet';
        if (smStartBtn) smStartBtn.disabled = true;
        if (smStopBtn) smStopBtn.disabled = false;
        showNotification('✅ Test sunucusu çalışıyor!', 'success');
    } else {
        if (legacyBtnLabel) legacyBtnLabel.textContent = 'Yerel Test Sunucusu';
        if (smStartBtn) smStartBtn.disabled = false;
        if (smStopBtn) smStopBtn.disabled = true;
    }
});

function appendSmConsoleLine(text, className) {
    if (!xtermServer) {
        initServerConsole();
        // delay bir sonraki satır için
        setTimeout(() => appendSmConsoleLine(text, className), 200);
        return;
    }
    let prefix = '';
    if (className === 'error') prefix = '\x1b[31m';
    else if (className === 'success') prefix = '\x1b[32m';
    else if (className === 'dim') prefix = '\x1b[2m';
    else if (className === 'info') prefix = '\x1b[36m';

    const lines = text.split('\n');
    for (const line of lines) {
        if (!line && lines.length > 1) continue;
        xtermServer.writeln(prefix + line.replace(/\r/g, '') + (prefix ? '\x1b[0m' : ''));
    }
}

function appendOutputLine(text, className) {
    const output = document.getElementById('output-output');
    if (!output) return;
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.trim().length === 0) continue;
        const div = document.createElement('div');
        div.className = 'terminal-line ' + (className || '');
        const normalized = line.replace(/\r/g, '');
        div.textContent = (window.Lang && typeof window.Lang.localizeMessage === 'function')
            ? window.Lang.localizeMessage(normalized)
            : normalized;
        output.appendChild(div);
    }
    output.scrollTop = output.scrollHeight;
}

document.getElementById('btn-api-ref').addEventListener('click', () => {
    showNotification('📚 Java dosyası açın — hover ile API bilgisi görüntüleyin!', 'info');
});

// ═══════════════════════════════════════════════════════════
// Keyboard Shortcuts
// ═══════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
    // Ctrl+S -> Save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
    }
    // Ctrl+N -> New Project
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        showNewProjectModal();
    }
    // Ctrl+O -> Open Folder
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        openFolder();
    }
    // Escape -> Close modal
    if (e.key === 'Escape') {
        hideNewProjectModal();
    }
});

// ═══════════════════════════════════════════════════════════
// Settings Logic & Language Sync
// ═══════════════════════════════════════════════════════════

const SETTINGS_KEYS = [
    'setting-ai-provider', 'setting-ai-model', 'setting-ai-endpoint', 'setting-ai-key',
    'setting-font-size', 'setting-font-family', 'setting-tab-size', 'setting-minimap', 'setting-wordwrap',
    'setting-platform', 'setting-language'
];

function loadSettings() {
    SETTINGS_KEYS.forEach(key => {
        const el = document.getElementById(key);
        if (el) {
            const val = localStorage.getItem(key);
            if (val !== null) {
                el.value = val;
            }
            // Add change listener to auto-save and apply
            el.addEventListener('change', () => {
                localStorage.setItem(key, el.value);
                applySettings();
                showNotification('Ayarlar kaydedildi.', 'success');
            });
            // Update on input for text fields as well
            if (el.type === 'text' || el.type === 'number' || el.type === 'password') {
                el.addEventListener('input', () => {
                    localStorage.setItem(key, el.value);
                    applySettings();
                });
            }
        }
    });
    applySettings();
}

function applySettings() {
    if (window.monacoEditor && window.monaco) {
        const fontSize = parseInt(document.getElementById('setting-font-size')?.value || 14);
        const fontFamily = document.getElementById('setting-font-family')?.value || "'JetBrains Mono', monospace";
        const tabSize = parseInt(document.getElementById('setting-tab-size')?.value || 4);
        const minimap = document.getElementById('setting-minimap')?.value === 'true';
        const wordWrap = document.getElementById('setting-wordwrap')?.value || 'off';

        window.monacoEditor.updateOptions({
            fontSize: fontSize,
            fontFamily: fontFamily,
            tabSize: tabSize,
            minimap: { enabled: minimap },
            wordWrap: wordWrap
        });
    }

    // AI Provider updates
    if (window.llmProvider) {
        window.llmProvider.provider = document.getElementById('setting-ai-provider')?.value || 'ollama';
        window.llmProvider.model = document.getElementById('setting-ai-model')?.value || 'codellama:13b';
        window.llmProvider.endpoint = document.getElementById('setting-ai-endpoint')?.value || 'http://localhost:11434';
        window.llmProvider.apiKey = document.getElementById('setting-ai-key')?.value || '';
    }

    // Language Sync logic (ui updates when changed)
    const lang = document.getElementById('setting-language')?.value || 'en';
    if (window.Lang && window.Lang.currentLang !== lang) {
        window.Lang.setLanguage(lang);
    }
}

document.addEventListener('lang:changed', () => {
    refreshLocalizedTabLabels();
    if (!currentFilePath) {
        const title = document.getElementById('titlebar-filename');
        if (title) title.textContent = tr('ui.titlebar.welcome', 'Welcome');
    }
});

// ═══════════════════════════════════════════════════════════
// Onboarding Wizard
// ═══════════════════════════════════════════════════════════

function initOnboarding() {
    if (localStorage.getItem('craftide-onboarded')) return;

    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';

    let currentStep = 0;
    let selectedMode = 'plugin';

    const steps = [
        document.getElementById('ob-step-0'),
        document.getElementById('ob-step-1'),
        document.getElementById('ob-step-2'),
    ];
    const dots = [
        document.getElementById('ob-dot-0'),
        document.getElementById('ob-dot-1'),
        document.getElementById('ob-dot-2'),
    ];

    function goToStep(n) {
        steps.forEach((s, i) => {
            if (s) s.classList.toggle('active', i === n);
        });
        dots.forEach((d, i) => {
            if (d) d.classList.toggle('active', i === n);
        });
        currentStep = n;
        if (n === 2) buildOnboardTplGrid();
    }

    // Platform buttons
    document.querySelectorAll('.onboard-platform-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.onboard-platform-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMode = btn.dataset.mode || 'plugin';
        });
    });
    // Pre-select plugin
    const pluginBtn = document.querySelector('.onboard-platform-btn[data-mode="plugin"]');
    if (pluginBtn) pluginBtn.classList.add('selected');

    document.getElementById('ob-next-0')?.addEventListener('click', () => goToStep(1));
    document.getElementById('ob-back-1')?.addEventListener('click', () => goToStep(0));
    document.getElementById('ob-skip-ai')?.addEventListener('click', () => goToStep(2));
    document.getElementById('ob-next-1')?.addEventListener('click', () => {
        // Save AI settings to localStorage
        const provider = document.getElementById('ob-ai-provider')?.value || 'ollama';
        const model = document.getElementById('ob-ai-model')?.value || 'codellama:13b';
        const endpoint = document.getElementById('ob-ai-endpoint')?.value || 'http://localhost:11434';
        const key = document.getElementById('ob-ai-key')?.value || '';
        localStorage.setItem('setting-ai-provider', provider);
        localStorage.setItem('setting-ai-model', model);
        localStorage.setItem('setting-ai-endpoint', endpoint);
        localStorage.setItem('setting-ai-key', key);
        // Sync to settings UI elements if they exist
        ['setting-ai-provider', 'setting-ai-model', 'setting-ai-endpoint', 'setting-ai-key'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = localStorage.getItem(id) || '';
        });
        if (window.llmProvider) window.llmProvider.reload();
        goToStep(2);
    });
    document.getElementById('ob-back-2')?.addEventListener('click', () => goToStep(1));
    document.getElementById('ob-blank-start')?.addEventListener('click', () => {
        finishOnboarding(selectedMode, null);
    });

    function buildOnboardTplGrid() {
        const grid = document.getElementById('ob-tpl-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const tplList = typeof VB_TEMPLATES !== 'undefined'
            ? VB_TEMPLATES.filter(t => t.mode === selectedMode)
            : [];
        tplList.forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'onboard-tpl-card';
            card.innerHTML = `<strong>${tpl.name}</strong><span>${tpl.desc}</span>`;
            card.addEventListener('click', () => finishOnboarding(selectedMode, tpl));
            grid.appendChild(card);
        });
        if (tplList.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-secondary);grid-column:span 2;">Bu mod için hazır şablon yok. Boş başlayın.</p>';
        }
    }

    function finishOnboarding(mode, tpl) {
        overlay.style.display = 'none';
        localStorage.setItem('craftide-onboarded', '1');
        // Open Visual Builder
        openFile('visual-builder://tab', getVirtualTabName('visual-builder://tab'));
        // Set mode
        if (typeof vbCurrentMode !== 'undefined') {
            setTimeout(() => {
                const sel = document.getElementById('vb-mode-select');
                if (sel) { sel.value = mode; sel.dispatchEvent(new Event('change')); }
                if (tpl && typeof loadTemplate === 'function') loadTemplate(tpl);
            }, 200);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════

console.log('⛏️ CraftIDE renderer initialized!');

// Ayarları yükle
loadSettings();

// Terminal'i otomatik başlat
initTerminal();

// Onboarding wizard (800ms gecikme)
setTimeout(initOnboarding, 800);

// ═══════════════════════════════════════════════════════════
// Sidebar Resizer Default Logic
// ═══════════════════════════════════════════════════════════

const sidebarResizer = document.getElementById('sidebar-resizer');
const sidebar = document.getElementById('sidebar');

if (sidebarResizer && sidebar) {
    let isResizing = false;
    sidebarResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        sidebarResizer.classList.add('active');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        // Calculate new width: mouse X - activity bar width (48px)
        let newWidth = e.clientX - 48;
        if (newWidth < 150) newWidth = 150; // min width
        if (newWidth > 600) newWidth = 600; // max width

        sidebar.style.width = newWidth + 'px';
        document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            sidebarResizer.classList.remove('active');

            // Trigger a resize event to layout Monaco editor
            window.dispatchEvent(new Event('resize'));
        }
    });
}

// ═══════════════════════════════════════════════════════════
// Bottom Panel Resizer
// ═══════════════════════════════════════════════════════════

const bottomResizer = document.getElementById('bottom-panel-resizer');
const bottomPanel = document.getElementById('bottom-panel');

if (bottomResizer && bottomPanel) {
    let isResizingBottom = false;
    bottomResizer.addEventListener('mousedown', (e) => {
        isResizingBottom = true;
        document.body.style.cursor = 'row-resize';
        bottomResizer.classList.add('active');
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizingBottom) return;
        const newHeight = window.innerHeight - e.clientY - 22; // 22px = status bar
        const clampedHeight = Math.max(80, Math.min(newHeight, 500));
        bottomPanel.style.height = clampedHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isResizingBottom) {
            isResizingBottom = false;
            document.body.style.cursor = 'default';
            bottomResizer.classList.remove('active');
            window.dispatchEvent(new Event('resize'));
        }
    });
}

// ═══════════════════════════════════════════════════════════
// MC Tools Dropdown
// ═══════════════════════════════════════════════════════════

let mcToolsDropdown = null;

function toggleMcToolsDropdown(btnEl) {
    // If dropdown is open, close it
    if (mcToolsDropdown) {
        mcToolsDropdown.remove();
        mcToolsDropdown = null;
        return;
    }

    mcToolsDropdown = document.createElement('div');
    mcToolsDropdown.className = 'mc-tools-dropdown';
    mcToolsDropdown.innerHTML = `
        <div class="mc-tool-item" data-tool="new-plugin">🚀 ${tr('ui.mctools.newPlugin', 'Create New Plugin')}</div>
        <div class="mc-tool-item" data-tool="visual-builder">🧩 ${tr('ui.mctools.visualBuilder', 'Visual Builder')}</div>
        <div class="mc-tool-sep"></div>
        <div class="mc-tool-item" data-tool="gui-builder">🗃️ ${tr('ui.mctools.guiBuilder', 'Chest GUI Builder')}</div>
        <div class="mc-tool-item" data-tool="command-tree">⌨️ ${tr('ui.mctools.commandTree', 'Command Tree Designer')}</div>
        <div class="mc-tool-item" data-tool="recipe-creator">🍳 ${tr('ui.mctools.recipeCreator', 'Custom Item and Recipe')}</div>
        <div class="mc-tool-item" data-tool="permission-tree">🔑 ${tr('ui.mctools.permissionTree', 'Permission Tree Generator')}</div>
        <div class="mc-tool-sep"></div>
        <div class="mc-tool-item" data-tool="build">🔨 ${tr('ui.mctools.build', 'Build Plugin')}</div>
        <div class="mc-tool-item" data-tool="test-server">🧪 ${tr('ui.mctools.testServer', 'Test Server')}</div>
        <div class="mc-tool-sep"></div>
        <div class="mc-tool-item" data-tool="marketplace">🛍️ ${tr('ui.mctools.marketplace', 'Blueprint Marketplace')}</div>
        <div class="mc-tool-item" data-tool="api-ref">📚 ${tr('ui.mctools.api', 'API Reference')}</div>
        <div class="mc-tool-item" data-tool="blockbench">🎮 ${tr('ui.mctools.blockbench', 'Blockbench Editor')}</div>
        <div class="mc-tool-sep"></div>
        <div class="mc-tool-item" data-tool="welcome">🏠 ${tr('ui.mctools.welcome', 'Welcome Page')}</div>
    `;

    // Position next to button
    const rect = btnEl.getBoundingClientRect();
    mcToolsDropdown.style.left = (rect.right + 4) + 'px';
    mcToolsDropdown.style.top = rect.top + 'px';

    document.body.appendChild(mcToolsDropdown);

    mcToolsDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.mc-tool-item');
        if (!item) return;
        const tool = item.getAttribute('data-tool');
        switch (tool) {
            case 'new-plugin': showNewProjectModal(); break;
            case 'visual-builder': openFile('visual-builder://tab', getVirtualTabName('visual-builder://tab')); break;
            case 'gui-builder': openFile('gui-builder://tab', getVirtualTabName('gui-builder://tab')); break;
            case 'command-tree': openFile('command-tree://tab', getVirtualTabName('command-tree://tab')); break;
            case 'recipe-creator': openFile('recipe-creator://tab', getVirtualTabName('recipe-creator://tab')); break;
            case 'permission-tree': openFile('permission-tree://tab', getVirtualTabName('permission-tree://tab')); break;
            case 'marketplace': openFile('marketplace://tab', getVirtualTabName('marketplace://tab')); break;
            case 'build': document.getElementById('btn-build-plugin')?.click(); break;
            case 'test-server': document.getElementById('btn-test-server')?.click(); break;
            case 'api-ref': document.getElementById('btn-api-ref')?.click(); break;
            case 'blockbench': openFile('blockbench://tab', getVirtualTabName('blockbench://tab')); break;
            case 'welcome': showWelcome(); break;
        }
        mcToolsDropdown.remove();
        mcToolsDropdown = null;
    });

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', function closeMcTools(e) {
            if (mcToolsDropdown && !mcToolsDropdown.contains(e.target) && !btnEl.contains(e.target)) {
                mcToolsDropdown.remove();
                mcToolsDropdown = null;
                document.removeEventListener('click', closeMcTools);
            }
        });
    }, 10);
}

// ═══════════════════════════════════════════════════════════
// Dynamic MC Version Fetching
// ═══════════════════════════════════════════════════════════
async function fetchMinecraftVersions() {
    try {
        const response = await fetch('https://api.papermc.io/v2/projects/paper');
        if (!response.ok) throw new Error('API fetch failed');
        const data = await response.json();
        const versions = data.versions;
        if (!versions || versions.length === 0) return;

        // Reverse array to put newest first
        const sortedVersions = versions.reverse();

        const inputSelect = document.getElementById('input-mc-version');
        const smSelect = document.getElementById('sm-version-select');

        let html = '';
        sortedVersions.forEach((v, i) => {
            html += `<option value="${v}"${i === 0 ? ' selected' : ''}>${v}${i === 0 ? ' (' + tr('ui.common.latest', 'Latest') + ')' : ''}</option>`;
        });

        if (inputSelect) inputSelect.innerHTML = html;
        if (smSelect) smSelect.innerHTML = html;

    } catch (err) {
        console.error('Failed to fetch MC versions:', err);
        const fallbackHTML = `
            <option value="1.21.4" selected>1.21.4 (${tr('ui.common.latestOffline', 'Latest - Offline')})</option>
            <option value="1.21.1">1.21.1</option>
            <option value="1.20.4">1.20.4</option>
            <option value="1.19.4">1.19.4</option>
            <option value="1.18.2">1.18.2</option>
        `;
        const inputSelect = document.getElementById('input-mc-version');
        const smSelect = document.getElementById('sm-version-select');
        if (inputSelect) inputSelect.innerHTML = fallbackHTML;
        if (smSelect) smSelect.innerHTML = fallbackHTML;
    }
}

// İstemci tarafında versiyonları çek (Gecikmeli)
setTimeout(() => {
    fetchMinecraftVersions();
}, 500);

// ═══════════════════════════════════════════════════════════
// Uygulama Kapanma Koruması — Kaydedilmemiş Değişiklik Kontrolü
// ═══════════════════════════════════════════════════════════
ipcRenderer.on('request-close', () => {
    const dirty = typeof window.imageEditorIsDirty === 'function' && window.imageEditorIsDirty();
    const hasPath = typeof window.imageEditorCurrentPath === 'function' && window.imageEditorCurrentPath();

    if (dirty && hasPath) {
        const ok = confirm(tr('prompt.unsavedImage', 'There are unsaved changes in the image editor.\\n\\nExit without saving?'));


        if (!ok) return; // Kullanıcı iptal etti, pencere açık kalır
    }

    ipcRenderer.send('close-app-confirmed');
});

// ═══════════════════════════════════════════════════════════
// Visual Config Editor — YAML form tabanlı düzenleyici
// ═══════════════════════════════════════════════════════════

let _configEditorCurrentPath = null;

function showConfigEditor(filePath, content, type) {
    _configEditorCurrentPath = filePath;
    const container = document.getElementById('config-editor-container');
    const body = document.getElementById('config-editor-body');
    const fnSpan = document.getElementById('config-editor-filename');
    if (!container || !body) return;

    if (fnSpan) fnSpan.textContent = nodePath.basename(filePath);
    body.innerHTML = '';

    if (type === 'plugin') {
        _renderPluginYmlEditor(body, content);
    } else {
        _renderGenericYmlEditor(body, content);
    }

    // Ham YAML toggle
    const rawBtn = document.getElementById('btn-config-raw-toggle');
    if (rawBtn) {
        rawBtn._cfgRawMode = false;
        rawBtn.onclick = () => {
            rawBtn._cfgRawMode = !rawBtn._cfgRawMode;
            if (rawBtn._cfgRawMode) {
                // Monaco ile göster
                container.style.display = 'none';
                document.getElementById('editor-container').style.display = 'block';
                if (window.monacoEditor && window.monaco) {
                    const model = window.monaco.editor.createModel(content, 'yaml');
                    const oldModel = window.monacoEditor.getModel();
                    window.monacoEditor.setModel(model);
                    if (oldModel && oldModel !== model) oldModel.dispose();
                }
                rawBtn.textContent = 'Form Görünümü';
            } else {
                document.getElementById('editor-container').style.display = 'none';
                container.style.display = 'flex';
                rawBtn.textContent = 'Ham YAML';
            }
        };
    }

    // Kaydet butonu
    const saveBtn = document.getElementById('btn-config-save');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const yaml = _serializeConfigForm(body, type);
            await ipcRenderer.invoke('fs:writeFile', _configEditorCurrentPath, yaml);
            const fd = openFiles.get(_configEditorCurrentPath);
            if (fd) fd.content = yaml;
            showNotification('💾 Config kaydedildi!', 'success');
        };
    }
}

function _renderPluginYmlEditor(body, content) {
    const known = {
        name: 'text', version: 'text', main: 'text',
        'api-version': 'text', description: 'text', author: 'text',
        website: 'text', prefix: 'text'
    };
    const parsed = _parseSimpleYaml(content);

    const section = (title) => {
        const h = document.createElement('h3');
        h.style.cssText = 'font-size:13px;color:var(--accent);margin:16px 0 8px;border-bottom:1px solid var(--border-color);padding-bottom:4px;';
        h.textContent = title;
        body.appendChild(h);
    };

    section('Temel Bilgiler');
    for (const [k, inputType] of Object.entries(known)) {
        _addFormField(body, k, parsed[k] || '', inputType);
    }

    // commands
    section('Komutlar (commands)');
    const cmdArea = document.createElement('div');
    cmdArea.id = 'cfg-commands-area';
    cmdArea.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const cmdList = (typeof parsed.commands === 'object' && parsed.commands) ? Object.entries(parsed.commands) : [];
    const addCmdRow = (name, desc) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:6px;align-items:center;';
        const ni = document.createElement('input'); ni.placeholder = 'komut adı'; ni.value = name || ''; ni.className = 'cfg-cmd-name'; ni.style.cssText = 'flex:0 0 120px;padding:4px 6px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-primary);border-radius:4px;font-size:12px;';
        const di = document.createElement('input'); di.placeholder = 'açıklama'; di.value = (typeof desc === 'object' ? desc.description : desc) || ''; di.className = 'cfg-cmd-desc'; di.style.cssText = 'flex:1;padding:4px 6px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-primary);border-radius:4px;font-size:12px;';
        const rm = document.createElement('button'); rm.textContent = '✕'; rm.style.cssText = 'background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;'; rm.onclick = () => row.remove();
        row.append(ni, di, rm);
        cmdArea.appendChild(row);
    };
    cmdList.forEach(([n, d]) => addCmdRow(n, d));
    const addCmdBtn = document.createElement('button');
    addCmdBtn.textContent = '+ Komut Ekle';
    addCmdBtn.style.cssText = 'align-self:flex-start;padding:4px 10px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-secondary);border-radius:4px;cursor:pointer;font-size:12px;';
    addCmdBtn.onclick = () => addCmdRow('', '');
    body.appendChild(cmdArea);
    body.appendChild(addCmdBtn);

    body.dataset.type = 'plugin';
}

function _renderGenericYmlEditor(body, content) {
    const lines = content.split('\n');
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    wrapper.id = 'cfg-generic-lines';

    lines.forEach((line, i) => {
        if (line.trim() === '' || line.trim().startsWith('#')) {
            const comment = document.createElement('div');
            comment.style.cssText = 'font-size:11px;color:var(--text-muted);padding:2px 0;';
            comment.textContent = line;
            comment.dataset.lineType = 'comment';
            comment.dataset.original = line;
            wrapper.appendChild(comment);
            return;
        }
        const m = line.match(/^(\s*)([\w\-\.]+)\s*:\s*(.*)/);
        if (m) {
            const indent = m[1], key = m[2], val = m[3].trim();
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:6px;align-items:center;';
            row.dataset.lineType = 'kv';
            row.dataset.indent = indent;
            const lbl = document.createElement('label');
            lbl.style.cssText = 'flex:0 0 180px;font-size:12px;color:var(--text-secondary);text-align:right;padding-left:' + (indent.length * 6) + 'px;';
            lbl.textContent = key + ':';

            const inp = _createConfigInput(key, val);
            inp.dataset.cfgKey = key;
            inp.dataset.cfgDefault = val;
            inp.style.cssText = 'flex:1;padding:4px 6px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-primary);border-radius:4px;font-size:12px;';
            lbl.title = _cfgHintForKey(key);

            const resetBtn = document.createElement('button');
            resetBtn.textContent = '↺';
            resetBtn.title = 'Reset to default';
            resetBtn.style.cssText = 'padding:3px 6px;background:transparent;border:1px solid var(--border-color);border-radius:4px;color:var(--text-muted);cursor:pointer;';
            resetBtn.onclick = () => _setConfigInputValue(inp, val);
            row.append(lbl, inp, resetBtn);
            wrapper.appendChild(row);
        } else {
            // list item veya complex — göster ama değiştirme
            const comment = document.createElement('div');
            comment.style.cssText = 'font-size:11px;color:var(--text-muted);padding:2px 0;';
            comment.textContent = line;
            comment.dataset.lineType = 'raw';
            comment.dataset.original = line;
            wrapper.appendChild(comment);
        }
    });

    body.appendChild(wrapper);
    body.dataset.type = 'generic';
}

const _CFG_HINTS = {
    prefix: 'Chat prefix shown to players.',
    language: 'Language code used by plugin messages.',
    debug: 'Enables verbose debug output.',
    permission: 'Permission string required for the feature.',
    world: 'Minecraft world name.',
    material: 'Bukkit/Fabric material id.',
    color: 'Color value (hex or Minecraft code).',
    cooldown: 'Delay in seconds/ticks between uses.',
    amount: 'Numeric amount used by rewards/economy.',
    x: 'Coordinate X value.',
    y: 'Coordinate Y value.',
    z: 'Coordinate Z value.',
};

const _CFG_MATERIAL_SUGGESTIONS = [
    'DIAMOND', 'NETHERITE_SWORD', 'IRON_SWORD', 'GOLDEN_APPLE', 'TOTEM_OF_UNDYING',
    'minecraft:diamond', 'minecraft:netherite_sword', 'minecraft:golden_apple',
];

function _cfgHintForKey(key) {
    const k = String(key || '').toLowerCase();
    for (const [hintKey, hintVal] of Object.entries(_CFG_HINTS)) {
        if (k.includes(hintKey)) return hintVal;
    }
    return 'Config value';
}

function _ensureCfgMaterialList() {
    let dl = document.getElementById('cfg-material-list');
    if (dl) return dl;
    dl = document.createElement('datalist');
    dl.id = 'cfg-material-list';
    _CFG_MATERIAL_SUGGESTIONS.forEach((m) => {
        const o = document.createElement('option');
        o.value = m;
        dl.appendChild(o);
    });
    document.body.appendChild(dl);
    return dl;
}

function _createConfigInput(key, val) {
    const k = String(key || '').toLowerCase();
    const raw = String(val ?? '');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = raw;

    if (raw === 'true' || raw === 'false') {
        input.type = 'checkbox';
        input.checked = raw === 'true';
        input.style.width = '18px';
        return input;
    }

    if ((k.includes('color') || k.includes('renk')) && /^#?[0-9a-f]{6}$/i.test(raw)) {
        input.type = 'color';
        input.value = raw.startsWith('#') ? raw : `#${raw}`;
        return input;
    }

    if (/^-?\d+(\.\d+)?$/.test(raw)) {
        input.type = 'number';
        return input;
    }

    if (k.includes('material') || k.includes('item')) {
        _ensureCfgMaterialList();
        input.setAttribute('list', 'cfg-material-list');
    }

    return input;
}

function _setConfigInputValue(inp, val) {
    if (!inp) return;
    if (inp.type === 'checkbox') inp.checked = String(val) === 'true';
    else if (inp.type === 'color') inp.value = String(val || '').startsWith('#') ? String(val) : `#${String(val || '').replace('#', '')}`;
    else inp.value = String(val ?? '');
}

function _readConfigInputValue(inp) {
    if (!inp) return '';
    if (inp.type === 'checkbox') return inp.checked ? 'true' : 'false';
    return String(inp.value ?? '');
}

function _addFormField(parent, key, value, type) {
    const row = document.createElement('div');
    row.className = 'cfg-field';
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:4px;';
    const lbl = document.createElement('label');
    lbl.style.cssText = 'flex:0 0 140px;font-size:12px;color:var(--text-secondary);text-align:right;';
    lbl.textContent = key + ':';
    lbl.title = _cfgHintForKey(key);
    const inp = _createConfigInput(key, value);
    _setConfigInputValue(inp, value);
    inp.dataset.cfgKey = key;
    inp.style.cssText = 'flex:1;padding:5px 8px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-primary);border-radius:4px;font-size:12px;';
    row.append(lbl, inp);
    parent.appendChild(row);
}

function _parseSimpleYaml(content) {
    const result = {};
    let currentParent = null;
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.trim() === '' || line.trim().startsWith('#')) continue;
        const m = line.match(/^(\s*)([\w\-\.]+)\s*:\s*(.*)/);
        if (!m) continue;
        const indent = m[1].length, key = m[2], val = m[3].trim();
        if (indent === 0) {
            if (val === '') { result[key] = {}; currentParent = key; }
            else { result[key] = val; currentParent = null; }
        } else if (currentParent && indent === 2) {
            if (typeof result[currentParent] !== 'object') result[currentParent] = {};
            result[currentParent][key] = val;
        }
    }
    return result;
}

function _serializeConfigForm(body, type) {
    if (type === 'plugin') {
        let yaml = '';
        body.querySelectorAll('[data-cfg-key]').forEach(inp => {
            yaml += inp.dataset.cfgKey + ': ' + _readConfigInputValue(inp) + '\n';
        });
        // commands
        yaml += 'commands:\n';
        body.querySelectorAll('#cfg-commands-area > div').forEach(row => {
            const name = row.querySelector('.cfg-cmd-name')?.value;
            const desc = row.querySelector('.cfg-cmd-desc')?.value;
            if (name) yaml += '  ' + name + ':\n    description: ' + (desc || '') + '\n';
        });
        return yaml;
    } else {
        // generic: her satırı yeniden oluştur
        const wrapper = body.querySelector('#cfg-generic-lines');
        if (!wrapper) return '';
        let yaml = '';
        wrapper.childNodes.forEach(node => {
            if (node.dataset && node.dataset.lineType === 'kv') {
                const inp = node.querySelector('[data-cfg-key]');
                if (inp) {
                    yaml += (node.dataset.indent || '') + inp.dataset.cfgKey + ': ' + _readConfigInputValue(inp) + '\n';
                }
            } else if (node.dataset && (node.dataset.lineType === 'comment' || node.dataset.lineType === 'raw')) {
                yaml += (node.dataset.original || '') + '\n';
            }
        });
        return yaml;
    }
}

// ═══════════════════════════════════════════════════════════
// Smart Error Resolver — sunucu stack trace analizi (Özellik 6)
// ═══════════════════════════════════════════════════════════

let _traceBuffer = [];
let _collectingTrace = false;

function _handleServerLogForErrors(data) {
    if (/Exception|Error:/.test(data) && !/^\[.*\] \[INFO\]/.test(data)) {
        _collectingTrace = true;
        _traceBuffer = [data];
    } else if (_collectingTrace && /^\s+at /.test(data)) {
        _traceBuffer.push(data);
    } else if (_collectingTrace) {
        if (_traceBuffer.length > 1) _analyzeStackTrace([..._traceBuffer]);
        _collectingTrace = false;
        _traceBuffer = [];
    }
}

function _analyzeStackTrace(lines) {
    const firstLine = lines[0];
    // Exception tipini çıkar
    const exMatch = firstLine.match(/([\w.]+Exception|[\w.]+Error)[:\s]/);
    const exType = exMatch ? exMatch[1] : tr('msg.errorFallback', 'Error');
    const shortType = exType.split('.').pop();

    // Kullanıcı paketini bul (bukkit/java/minecraft değil)
    const userAt = lines.slice(1).find(l =>
        /^\s+at /.test(l) &&
        !l.includes('org.bukkit') && !l.includes('java.') &&
        !l.includes('net.minecraft') && !l.includes('com.sun') &&
        !l.includes('sun.reflect') && !l.includes('io.netty')
    );

    let location = '';
    if (userAt) {
        const m = userAt.match(/at ([\w.]+)\((\w+\.java):(\d+)\)/);
        if (m) location = m[2] + ':' + m[3];
    }

    // Sorunlar paneli
    const problemsList = document.getElementById('sm-problems-list');
    if (!problemsList) return;

    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:flex-start;gap:8px;padding:8px;background:rgba(231,76,60,0.1);border-left:3px solid #e74c3c;border-radius:4px;margin-bottom:6px;';
    item.innerHTML = `
        <span style="color:#e74c3c;font-size:16px;">&#9888;</span>
        <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:600;color:#e74c3c;">${shortType}</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${location || firstLine.slice(0, 80)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
            <button class="cfg-ai-btn" style="white-space:nowrap;padding:3px 8px;font-size:11px;background:rgba(52,152,219,0.2);border:1px solid rgba(52,152,219,0.4);color:#3498db;border-radius:4px;cursor:pointer;">${tr('ui.server.aiAnalyze', 'AI Analyze')}</button>
            <button class="cfg-fix-btn" style="white-space:nowrap;padding:3px 8px;font-size:11px;background:rgba(46,204,113,0.18);border:1px solid rgba(46,204,113,0.45);color:#2ecc71;border-radius:4px;cursor:pointer;">${tr('ui.server.aiFix', 'One-Click Fix')}</button>
        </div>
    `;
    item.querySelector('.cfg-ai-btn').onclick = () => {
        if (window.aiManager) {
            document.querySelector('.activity-btn[data-panel="ai"]')?.click();
            setTimeout(() => {
                if (window.aiManager.chatInput) {
                    window.aiManager.chatInput.value = tr('msg.aiAnalyzePrompt', 'Analyze this Java error and tell me how to fix it:\n') + lines.slice(0, 5).join('\n');
                    if (window.aiManager.handleChatInput) window.aiManager.handleChatInput();
                }
            }, 200);
        }
    };
    item.querySelector('.cfg-fix-btn').onclick = async () => {
        if (!window.NoCodeSuite?.oneClickFixCurrent) {
            showNotification('One-click fix is not available.', 'warn');
            return;
        }
        document.querySelector('.activity-btn[data-action="visual-builder"]')?.click();
        setTimeout(() => window.NoCodeSuite.oneClickFixCurrent(), 120);
    };
    problemsList.insertBefore(item, problemsList.firstChild);

    // Max 10 hata göster
    while (problemsList.childNodes.length > 10) problemsList.removeChild(problemsList.lastChild);

    showNotification('⚠️ ' + (location ? tr('msg.serverErrorLocation', 'Server error: {type} ({location})', { type: shortType, location }) : tr('msg.serverError', 'Server error: {type}', { type: shortType })), 'error');
}


