/**
 * CraftIDE — Renderer Application Logic
 * Tüm UI etkileşimleri ve IPC çağrıları
 */

const { ipcRenderer } = require('electron');
const nodePath = require('path');
const sharedUtils = window.CraftIDEUtils || {};

// ═══════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════

let currentProjectPath = null;
let openFiles = new Map(); // path -> { content, modified }
let currentFilePath = null;
let activePanel = 'explorer';
let activeTerminalId = null; // Gerçek terminal process ID
let explorerSelectedPath = null;
let explorerSelectedIsDir = false;
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

function interpolateText(template, params) {
    if (typeof sharedUtils.interpolateText === 'function') {
        return sharedUtils.interpolateText(template, params);
    }
    if (!params) return template;
    return Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), String(template || ''));
}

function tr(key, fallback, params) {
    if (typeof sharedUtils.tr === 'function') {
        return sharedUtils.tr(key, fallback, params);
    }
    if (window.Lang && typeof window.Lang.t === 'function') {
        const translated = window.Lang.t(key, params || {});
        if (translated !== key || !fallback) {
            return translated;
        }
    }
    if (!fallback) return key;
    return interpolateText(fallback, params);
}

function showTrNotification(key, fallback, type = 'info', params) {
    showNotification(tr(key, fallback, params), type);
}

function syncRendererStore(patch) {
    if (window.CraftIDEStore && typeof window.CraftIDEStore.patch === 'function') {
        window.CraftIDEStore.patch(patch || {});
    }
}

window.onerror = function (message, source, lineno, colno, error) {
    console.error('Renderer error:', { message, source, lineno, colno, error });
    try {
        showNotification(tr('msg.unexpectedRendererError', 'An unexpected renderer error occurred.'), 'error');
    } catch (_) { }
    return false;
};

window.onunhandledrejection = function (event) {
    const reason = event && 'reason' in event ? event.reason : event;
    console.error('Unhandled renderer rejection:', reason);
    try {
        showNotification(tr('msg.unexpectedRendererError', 'An unexpected renderer error occurred.'), 'error');
    } catch (_) { }
};

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
    'mc-tools://': { key: 'ui.tab.mcToolsHub', icon: '🔺', fallback: 'Tools Hub' },
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

const VIRTUAL_TAB_REGISTRY = {
    'visual-builder://': {
        activate: () => {
            document.getElementById('visual-builder-container').style.display = 'flex';
            if (typeof resizeVBCanvas === 'function') setTimeout(resizeVBCanvas, 50);
        },
    },
    'blockbench://': {
        activate: () => {
            document.getElementById('blockbench-container').style.display = 'block';
        },
    },
    'settings://': {
        activate: () => {
            document.getElementById('settings-container').style.display = 'block';
        },
    },
    'server-manager://': {
        activate: () => {
            document.getElementById('server-manager-container').style.display = 'flex';
            setTimeout(() => initServerConsole(), 50);
        },
    },
    'image-editor://': {
        activate: () => {
            document.getElementById('image-editor-container').style.display = 'block';
            if (window.initImageEditor && !document.getElementById('ie-root')) {
                window.initImageEditor();
            }
        },
    },
    'gui-builder://': {
        activate: () => {
            document.getElementById('gui-builder-container').style.display = 'flex';
            if (typeof window.initGuiBuilder === 'function') setTimeout(() => window.initGuiBuilder(), 50);
        },
    },
    'command-tree://': {
        activate: () => {
            document.getElementById('command-tree-container').style.display = 'flex';
            if (typeof window.initCommandTree === 'function') setTimeout(() => window.initCommandTree(), 50);
        },
    },
    'recipe-creator://': {
        activate: () => {
            document.getElementById('recipe-creator-container').style.display = 'flex';
            if (typeof window.initRecipeCreator === 'function') setTimeout(() => window.initRecipeCreator(), 50);
        },
    },
    'permission-tree://': {
        activate: () => {
            document.getElementById('permission-tree-container').style.display = 'flex';
            if (typeof window.initPermissionTree === 'function') setTimeout(() => window.initPermissionTree(), 50);
        },
    },
    'marketplace://': {
        activate: () => {
            document.getElementById('marketplace-container').style.display = 'flex';
            if (typeof window.initMarketplace === 'function') setTimeout(() => window.initMarketplace(), 50);
        },
    },
    'mc-tools://': {
        activate: () => {
            document.getElementById('mc-tools-hub-container').style.display = 'flex';
            if (typeof renderMcToolsHub === 'function') setTimeout(() => renderMcToolsHub(), 30);
        },
    },
};

function getVirtualTabConfig(filePath) {
    if (!filePath || typeof filePath !== 'string') return null;
    for (const prefix of Object.keys(VIRTUAL_TAB_REGISTRY)) {
        if (filePath.startsWith(prefix)) {
            return Object.assign({ prefix }, getVirtualTabMeta(prefix) || {}, VIRTUAL_TAB_REGISTRY[prefix]);
        }
    }
    return null;
}

function createOpenFileRecord(filePath, patch = {}) {
    return Object.assign({
        content: '',
        modified: false,
        virtual: false,
        generated: false,
        displayName: patch.displayName || null,
        lastSavedContent: '',
        languageHint: null,
        model: null,
        modelListener: null,
    }, patch || {});
}

function getOpenFileRecord(filePath) {
    return openFiles.get(filePath) || null;
}

function upsertOpenFile(filePath, patch = {}) {
    const existing = getOpenFileRecord(filePath);
    const next = createOpenFileRecord(filePath, Object.assign({}, existing || {}, patch || {}));
    openFiles.set(filePath, next);
    return next;
}

function getTabBaseName(filePath) {
    if (filePath === 'welcome') return tr('ui.titlebar.welcome', 'Welcome');
    const record = getOpenFileRecord(filePath);
    const meta = getVirtualTabMeta(filePath);
    if (meta) return getVirtualTabName(filePath, record?.displayName || meta.fallback);
    if (filePath.startsWith('generated://')) return record?.displayName || filePath.replace('generated://', '');
    return record?.displayName || nodePath.basename(filePath);
}

function formatTabName(filePath) {
    const record = getOpenFileRecord(filePath);
    const base = getTabBaseName(filePath);
    return record?.modified ? `* ${base}` : base;
}

function updateTabLabel(filePath) {
    const tab = document.querySelector(`.tab[data-tab="${CSS.escape(filePath)}"]`);
    if (!tab) return;
    const nameEl = tab.querySelector('.tab-name');
    if (nameEl) nameEl.textContent = formatTabName(filePath);
}

function isImageFilePath(filePath) {
    const ext = filePath && !filePath.includes('//') ? nodePath.extname(filePath).toLowerCase() : '';
    return ['.png', '.jpg', '.jpeg'].includes(ext) || String(filePath || '').startsWith('image-editor://');
}

function isTextBackedTab(filePath, record) {
    if (!filePath || filePath === 'welcome') return false;
    if (isImageFilePath(filePath)) return false;
    if (filePath.startsWith('generated://')) return true;
    if (filePath.includes('//')) return false;
    return !(record && record.virtual);
}

function canPersistFile(filePath, record) {
    return isTextBackedTab(filePath, record) && !filePath.includes('//') && !(record && record.virtual);
}

function getRecordContent(filePath) {
    const record = getOpenFileRecord(filePath);
    if (!record) return '';
    if (record.model && typeof record.model.getValue === 'function') return record.model.getValue();
    return String(record.content || '');
}

function updateRecordDirtyState(filePath, content) {
    const record = getOpenFileRecord(filePath);
    if (!record) return;
    record.content = content;
    record.modified = content !== String(record.lastSavedContent || '');
    updateTabLabel(filePath);
}

function attachModelListener(filePath, model) {
    if (!model) return;
    const record = getOpenFileRecord(filePath);
    if (!record) return;
    if (record.modelListener && typeof record.modelListener.dispose === 'function') {
        record.modelListener.dispose();
    }
    record.model = model;
    record.modelListener = model.onDidChangeContent(() => {
        updateRecordDirtyState(filePath, model.getValue());
    });
}

function ensureEditorModel(filePath, language, contentOverride) {
    const record = upsertOpenFile(filePath, {});
    const desiredContent = typeof contentOverride === 'string' ? contentOverride : String(record.content || '');
    if (!window.monaco || !window.monaco.editor) return null;
    if (!record.modified && record.lastSavedContent === '' && desiredContent !== '') {
        record.lastSavedContent = desiredContent;
    }

    if (!record.model || (typeof record.model.isDisposed === 'function' && record.model.isDisposed())) {
        record.model = window.monaco.editor.createModel(desiredContent, language);
        attachModelListener(filePath, record.model);
    } else {
        if (window.monaco.editor.setModelLanguage && record.model.getLanguageId && record.model.getLanguageId() !== language) {
            window.monaco.editor.setModelLanguage(record.model, language);
        }
        if (!record.modified && record.model.getValue() !== desiredContent) {
            record.model.setValue(desiredContent);
        }
    }

    record.languageHint = language;
    return record.model;
}

function showMonacoFile(filePath, language, contentOverride) {
    const model = ensureEditorModel(filePath, language, contentOverride);
    if (!model || !window.monacoEditor) return;
    document.getElementById('editor-container').style.display = 'block';
    if (window.monacoEditor.getModel() !== model) {
        window.monacoEditor.setModel(model);
    }
    document.getElementById('status-language').textContent = language.charAt(0).toUpperCase() + language.slice(1);
}

function disposeFileModel(filePath) {
    const record = getOpenFileRecord(filePath);
    if (!record || !record.model) return;
    if (record.modelListener && typeof record.modelListener.dispose === 'function') {
        record.modelListener.dispose();
        record.modelListener = null;
    }
    if (typeof record.model.dispose === 'function') {
        record.model.dispose();
    }
    record.model = null;
}

function getSaveDialogConfig(filePath) {
    const fileName = getTabBaseName(filePath) || 'generated.txt';
    if (fileName.endsWith('.sk')) {
        return {
            defaultPath: fileName,
            filters: [{ name: 'Skript Files', extensions: ['sk'] }, { name: 'All Files', extensions: ['*'] }],
        };
    }
    if (fileName.endsWith('.java')) {
        return {
            defaultPath: fileName,
            filters: [{ name: 'Java Files', extensions: ['java'] }, { name: 'All Files', extensions: ['*'] }],
        };
    }
    return {
        defaultPath: fileName,
        filters: [{ name: 'All Files', extensions: ['*'] }],
    };
}

async function saveFileRecord(filePath, options = {}) {
    const record = getOpenFileRecord(filePath);
    if (!record || !isTextBackedTab(filePath, record)) return false;

    const content = getRecordContent(filePath);
    const requiresSaveAs = !canPersistFile(filePath, record) || options.saveAs === true;
    let targetPath = filePath;

    if (requiresSaveAs) {
        const dialogConfig = getSaveDialogConfig(filePath);
        targetPath = await ipcRenderer.invoke('dialog:saveFile', {
            title: tr('dialog.saveAs.title', 'Save File As'),
            defaultPath: dialogConfig.defaultPath,
            filters: dialogConfig.filters,
        });
        if (!targetPath) return false;
    }

    const success = await ipcRenderer.invoke('fs:writeFile', targetPath, content);
    if (!success) {
        showNotification(tr('msg.fileSaveError', 'Could not save file!'), 'error');
        return false;
    }

    record.content = content;
    record.lastSavedContent = content;
    record.modified = false;
    updateTabLabel(filePath);

    if (requiresSaveAs) {
        await openFile(targetPath);
    }

    showNotification('💾 ' + tr('msg.fileSaved', '{name} saved', { name: nodePath.basename(targetPath) }), 'success');
    return true;
}

async function confirmCloseTextTab(filePath) {
    const record = getOpenFileRecord(filePath);
    if (!record || !record.modified || !isTextBackedTab(filePath, record)) return true;

    const canSave = canPersistFile(filePath, record) || filePath.startsWith('generated://');
    const buttons = canSave
        ? [tr('dialog.unsaved.save', 'Save'), tr('dialog.unsaved.dontSave', "Don't Save"), tr('dialog.unsaved.cancel', 'Cancel')]
        : [tr('dialog.unsaved.dontSave', "Don't Save"), tr('dialog.unsaved.cancel', 'Cancel')];
    const cancelId = buttons.length - 1;
    const result = await ipcRenderer.invoke('dialog:showMessage', {
        type: 'question',
        title: tr('dialog.unsaved.title', 'Unsaved Changes'),
        message: tr('dialog.unsaved.message', 'There are unsaved changes in "{name}".', { name: getTabBaseName(filePath) }),
        detail: tr('dialog.unsaved.detail', 'Do you want to save your changes?'),
        buttons,
        defaultId: canSave ? 0 : 1,
        cancelId,
    });

    if (result.response === cancelId) return false;
    if (canSave && result.response === 0) {
        return saveFileRecord(filePath);
    }
    return true;
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
                openFile('mc-tools://tab', getVirtualTabName('mc-tools://tab'));
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
    markExplorerSelection(null, false);

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
        const smVersionSelect = document.getElementById('sm-version-select');
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
            if (smVersionSelect) {
                await refreshServerVersions(smTypeSelect.value, smVersionSelect, smVersionSelect.value || '');
            }
        }
    } catch (err) {
        console.error("Platform detection err:", err);
    }

    showNotification('\u{1F4C2} ' + nodePath.basename(folderPath) + ' açıldı', 'success');
}


function markExplorerSelection(path, isDir) {
    explorerSelectedPath = path || null;
    explorerSelectedIsDir = !!isDir;
    document.querySelectorAll('.tree-item.active').forEach((el) => el.classList.remove('active'));
    if (!explorerSelectedPath) return;
    const item = document.querySelector(`.tree-item[data-path="${CSS.escape(explorerSelectedPath)}"]`);
    if (item) item.classList.add('active');
}

function getExplorerCreateTargetDir(overridePath = null, overrideIsDir = null) {
    if (overridePath) {
        return overrideIsDir ? overridePath : nodePath.dirname(overridePath);
    }
    if (explorerSelectedPath) {
        return explorerSelectedIsDir ? explorerSelectedPath : nodePath.dirname(explorerSelectedPath);
    }
    return currentProjectPath;
}

function validateExplorerName(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return tr('prompt.quickCreate.nameEmpty', 'Name cannot be empty.');
    if (/[<>:\"/\\|?*]/.test(trimmed)) return tr('prompt.quickCreate.invalidName', 'Invalid name.');
    if (trimmed === '.' || trimmed === '..') return tr('prompt.quickCreate.invalidName', 'Invalid name.');
    return '';
}

async function openExplorerQuickCreate(kind, targetDir) {
    const title = kind === 'file'
        ? tr('prompt.quickCreate.fileTitle', 'Create New File')
        : tr('prompt.quickCreate.folderTitle', 'Create New Folder');
    const placeholder = kind === 'file'
        ? tr('prompt.quickCreate.placeholder.file', 'new-file.java')
        : tr('prompt.quickCreate.placeholder.folder', 'new-folder');

    return await new Promise((resolve) => {
        const existing = document.getElementById('explorer-quick-create');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'explorer-quick-create';
        popup.className = 'explorer-quick-create';
        popup.innerHTML = `
            <div class="explorer-quick-create-title">${title}</div>
            <input id="explorer-quick-create-input" type="text" placeholder="${placeholder}" />
            <div class="explorer-quick-actions">
                <button class="btn-secondary" id="explorer-quick-cancel">${tr('dialog.unsaved.cancel', 'Cancel')}</button>
                <button class="btn-primary" id="explorer-quick-confirm">${tr('btn.create', 'Create')}</button>
            </div>
            <div class="explorer-quick-error" id="explorer-quick-error"></div>
        `;
        document.body.appendChild(popup);

        const anchor = document.getElementById('panel-explorer') || document.body;
        const rect = anchor.getBoundingClientRect();
        popup.style.left = `${Math.max(60, rect.left + 20)}px`;
        popup.style.top = `${Math.max(60, rect.top + 60)}px`;

        const input = popup.querySelector('#explorer-quick-create-input');
        const errorEl = popup.querySelector('#explorer-quick-error');
        const btnConfirm = popup.querySelector('#explorer-quick-confirm');
        const btnCancel = popup.querySelector('#explorer-quick-cancel');

        const close = (value = null) => {
            document.removeEventListener('mousedown', onDocMouseDown, true);
            popup.remove();
            resolve(value);
        };

        const submit = async () => {
            const value = String(input.value || '').trim();
            const validationErr = validateExplorerName(value);
            if (validationErr) {
                errorEl.textContent = validationErr;
                input.focus();
                return;
            }
            const candidate = nodePath.join(targetDir, value);
            const exists = await ipcRenderer.invoke('fs:exists', candidate);
            if (exists) {
                errorEl.textContent = tr('prompt.quickCreate.exists', 'A file/folder with this name already exists.');
                input.focus();
                return;
            }
            close(value);
        };

        const onDocMouseDown = (event) => {
            if (!popup.contains(event.target)) close(null);
        };

        btnConfirm.addEventListener('click', submit);
        btnCancel.addEventListener('click', () => close(null));
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                submit();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                close(null);
            }
        });
        setTimeout(() => document.addEventListener('mousedown', onDocMouseDown, true), 10);
        setTimeout(() => input.focus(), 0);
    });
}

async function createExplorerEntry(kind, opts = {}) {
    if (!currentProjectPath) {
        showNotification(tr('msg.openProjectFirst', 'Open a project first!'), 'error');
        return null;
    }
    const targetDir = getExplorerCreateTargetDir(opts.path || null, opts.isDir ?? null);
    if (!targetDir) {
        showNotification(tr('msg.openProjectFirst', 'Open a project first!'), 'error');
        return null;
    }

    const name = await openExplorerQuickCreate(kind, targetDir);
    if (!name) return null;
    const finalPath = nodePath.join(targetDir, name);

    if (kind === 'file') {
        const result = await ipcRenderer.invoke('fs:createFile', finalPath);
        if (!result?.success) {
            showNotification((result?.error || tr('msg.fileCreateError', 'Could not create file!')), 'error');
            return null;
        }
        showNotification(tr('msg.fileCreated', '{name} created', { name }), 'success');
        if (currentProjectPath) await renderFileTree(currentProjectPath);
        markExplorerSelection(finalPath, false);
        if (opts.openAfterCreate !== false) await openFile(finalPath);
        return finalPath;
    }

    const ok = await ipcRenderer.invoke('fs:createDir', finalPath);
    if (!ok) {
        showNotification(tr('msg.folderCreateError', 'Could not create folder!'), 'error');
        return null;
    }
    showNotification(tr('msg.fileCreated', '{name} created', { name }), 'success');
    if (currentProjectPath) await renderFileTree(currentProjectPath);
    markExplorerSelection(finalPath, true);
    return finalPath;
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
                markExplorerSelection(entry.path, true);
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
            item.addEventListener('click', () => {
                markExplorerSelection(entry.path, false);
                openFile(entry.path);
            });
            treeContainer.appendChild(item);
        }
    }

    if (!parentEl && explorerSelectedPath) {
        markExplorerSelection(explorerSelectedPath, explorerSelectedIsDir);
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
    if (path) markExplorerSelection(path, !!isDir);
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
                await createExplorerEntry('file', { path: contextTarget.path, isDir: contextTarget.isDir, openAfterCreate: true });
                break;
            }
            case 'newFolder': {
                await createExplorerEntry('folder', { path: contextTarget.path, isDir: contextTarget.isDir, openAfterCreate: false });
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
    await createExplorerEntry('file', { openAfterCreate: true });
});

document.getElementById('btn-new-folder').addEventListener('click', async () => {
    await createExplorerEntry('folder', { openAfterCreate: false });
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

    if (getVirtualTabConfig(filePath)) {
        upsertOpenFile(filePath, {
            content: '',
            modified: false,
            virtual: true,
            displayName: virtualName || getVirtualTabName(filePath, ''),
            lastSavedContent: '',
        });
        addTab(filePath, getVirtualTabName(filePath, virtualName));
        activateTab(filePath);
        return;
    }

    if (filePath.startsWith('generated://')) {
        // generated:// sekmeleri zaten openFiles'a eklendi — sadece aktif et
        if (!openFiles.has(filePath)) {
            upsertOpenFile(filePath, {
                content: '',
                modified: false,
                virtual: true,
                generated: true,
                displayName: virtualName || filePath.replace('generated://', ''),
                lastSavedContent: '',
            });
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

    upsertOpenFile(filePath, {
        content,
        modified: false,
        virtual: false,
        displayName: nodePath.basename(filePath),
        lastSavedContent: content,
    });
    addTab(filePath);
    activateTab(filePath);
}

function addTab(filePath, overrideName = null) {
    const tabBar = document.getElementById('tab-bar');
    let name = overrideName;
    let icon = '📄';
    let ext = '';
    const record = upsertOpenFile(filePath, {});

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

    record.displayName = name;
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-tab', filePath);
    tab.innerHTML =
        '<span class="tab-icon">' + icon + '</span>' +
        '<span class="tab-name">' + formatTabName(filePath) + '</span>' +
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
        nameEl.textContent = path === 'welcome' ? tr('ui.titlebar.welcome', 'Welcome') : formatTabName(path);
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

    const fileData = upsertOpenFile(filePath, {});
    const virtualTab = getVirtualTabConfig(filePath);

    if (virtualTab) {
        virtualTab.activate(filePath, fileData);
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
    } else if (filePath.startsWith('mc-tools://')) {
        document.getElementById('mc-tools-hub-container').style.display = 'flex';
        if (typeof renderMcToolsHub === 'function') setTimeout(() => renderMcToolsHub(), 30);
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
        const genName = filePath.replace('generated://', '');
        const language = genName.endsWith('.sk') ? 'plaintext' : 'java';
        showMonacoFile(filePath, language, fileData.content);
    } else if ((ext === '.yml' || ext === '.yaml') && fileData) {
        // Visual Config Editor
        const cfgContainer = document.getElementById('config-editor-container');
        if (cfgContainer) {
            cfgContainer.style.display = 'flex';
            const fn = nodePath.basename(filePath).toLowerCase();
            showConfigEditor(filePath, fileData.content, fn === 'plugin.yml' ? 'plugin' : 'generic');
        } else {
            showMonacoFile(filePath, 'yaml', fileData.content);
        }
    } else {
        const language = getLanguageForFile(filePath);
        showMonacoFile(filePath, language, fileData.content);
    }

    currentFilePath = filePath;
    if (fileData.model && typeof fileData.model.getValue === 'function') {
        fileData.content = fileData.model.getValue();
    }
    syncRendererStore({
        ui: { currentFile: currentFilePath },
        project: { openTabs: document.querySelectorAll('.tab').length },
    });
    document.getElementById('titlebar-filename').textContent = getTabBaseName(filePath);
    setTimeout(() => window.Lang?.applyTranslations?.(), 0);
}

async function closeTab(filePath) {
    if (!(await confirmCloseTextTab(filePath))) {
        return;
    }
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
    disposeFileModel(filePath);
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

    return await saveFileRecord(currentFilePath);
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
    updateProjectPlatformFields(getActiveProjectPlatform());
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

function getActiveProjectPlatform() {
    return document.querySelector('.platform-card.active')?.dataset.platform || 'paper';
}

function updateProjectPlatformFields(platformRaw) {
    const platform = platformRaw || getActiveProjectPlatform();
    const javaOptions = document.getElementById('java-options');
    const depsGroup = document.getElementById('deps-group');
    const labelName = document.getElementById('label-project-name');
    const inputName = document.getElementById('input-project-name');

    if (platform === 'skript') {
        if (javaOptions) javaOptions.style.display = 'none';
        if (depsGroup) depsGroup.style.display = 'none';
        if (labelName) labelName.textContent = tr('modal.label.skriptName', 'Skript Name');
        if (inputName) inputName.placeholder = tr('modal.placeholder.skriptName', 'MyAwesomeSkript');
    } else if (platform === 'fabric' || platform === 'forge') {
        if (javaOptions) javaOptions.style.display = 'block';
        if (depsGroup) depsGroup.style.display = 'block';
        if (labelName) labelName.textContent = tr('modal.label.modName', 'Mod Name');
        if (inputName) inputName.placeholder = tr('modal.placeholder.modName', 'MyAwesomeMod');
    } else {
        if (javaOptions) javaOptions.style.display = 'block';
        if (depsGroup) depsGroup.style.display = 'block';
        if (labelName) labelName.textContent = tr('modal.label.pluginName', 'Plugin Name');
        if (inputName) inputName.placeholder = tr('modal.placeholder.pluginName', 'MyAwesomePlugin');
    }

    const projectVersionSelect = document.getElementById('input-mc-version');
    if (projectVersionSelect) {
        refreshServerVersions(serverTypeFromPlatform(platform), projectVersionSelect, projectVersionSelect.value || '');
    }
}

// Platform selection
document.querySelectorAll('.platform-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.platform-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        updateProjectPlatformFields(card.dataset.platform);
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
    await createExplorerEntry('file', { openAfterCreate: true });
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
                '<p>' + escapeHtml(tr('ai.errorLabel', 'AI error:')) + ' ' + escapeHtml(err.message) + '</p>' +
                '<p class="ai-hint">' + escapeHtml(tr('ai.errorHint', 'Check your AI provider settings. For Ollama, run the ollama serve command.')) + '</p>';
            messages.scrollTop = messages.scrollHeight;
        });
    } else {
        aiContent.innerHTML =
            '<p>' + escapeHtml(tr('ai.systemMissing', 'AI system is not loaded. Refresh the page.')) + '</p>';
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
        appendTerminalLine(tr('msg.buildingPlugin', 'Building plugin...'), 'info');
        const result = await ipcRenderer.invoke('build:run', currentProjectPath);
        if (result.success) {
            appendTerminalLine(tr('msg.buildSuccess', 'Build successful!'), 'success');
            showTrNotification('msg.buildSuccess', 'Build successful!', 'success');
        } else {
            appendTerminalLine(tr('msg.buildError', 'Build error: {error}', { error: result.error || tr('msg.errorFallback', 'Error') }), 'error');
            showTrNotification('msg.buildFailed', 'Build failed.', 'error');
        }
    }
});

// ═══════════════════════════════════════════════════════════
// Build & Test Server Buttons
// ═══════════════════════════════════════════════════════════

document.getElementById('btn-build-plugin').addEventListener('click', async () => {
    if (!currentProjectPath) {
        showTrNotification('msg.openProjectFirst', 'Open a project first!', 'error');
        return;
    }
    appendTerminalLine(tr('msg.buildingPlugin', 'Building plugin...'), 'info');
    const result = await ipcRenderer.invoke('build:run', currentProjectPath);
    if (result.success) {
        appendTerminalLine(tr('msg.buildSuccess', 'Build successful!'), 'success');
        showTrNotification('msg.buildSuccess', 'Build successful!', 'success');
    } else {
        appendTerminalLine(tr('msg.buildError', 'Build error: {error}', { error: result.error || tr('msg.errorFallback', 'Error') }), 'error');
        showTrNotification('msg.buildFailed', 'Build failed.', 'error');
    }
});

document.getElementById('btn-test-server')?.addEventListener('click', async () => {
    // Legacy button on welcome screen, redirect to our new panel
    openFile('server-manager://tab', getVirtualTabName('server-manager://tab'));
});

// -- Server Manager UI Bindings --
document.getElementById('sm-type-select')?.addEventListener('change', async (event) => {
    const versionSelect = document.getElementById('sm-version-select');
    if (versionSelect) {
        await refreshServerVersions(event.target.value, versionSelect, '');
    }
});

document.getElementById('btn-sm-start')?.addEventListener('click', async () => {
    const status = await ipcRenderer.invoke('server:status');
    if (status && status.status === 'running') {
        showTrNotification('msg.serverAlreadyRunning', 'Server is already running.', 'info');
        return;
    }

    const type = document.getElementById('sm-type-select')?.value || 'paper';
    const versionSelect = document.getElementById('sm-version-select');
    const version = versionSelect?.value || '1.21.11';
    const payload = serverVersionPayloadByType[type] || await refreshServerVersions(type, versionSelect, version);
    if (payload && Array.isArray(payload.versions) && payload.versions.length && !payload.versions.includes(version)) {
        showTrNotification('msg.serverUnsupportedVersion', 'Selected Minecraft version is not supported for {type}.', 'error', { type: getServerTypeLabel(type) });
        return;
    }

    showTrNotification('msg.serverStarting', 'Starting test server ({type} {version})...', 'info', {
        type: getServerTypeLabel(type),
        version,
    });

    if (currentFilePath !== 'server-manager://tab') {
        openFile('server-manager://tab', getVirtualTabName('server-manager://tab'));
    }

    const result = await ipcRenderer.invoke('server:start', {
        mcVersion: version,
        serverType: type,
        serverDir: '',
    });

    if (!result.success) {
        const fallbackError = result.error || tr('msg.errorFallback', 'Error');
        showTrNotification('msg.serverStartError', 'Server start error: {error}', 'error', { error: fallbackError });
        appendSmConsoleLine(tr('msg.serverStartError', 'Server start error: {error}', { error: fallbackError }), 'error');
    }
});

document.getElementById('btn-sm-stop')?.addEventListener('click', async () => {
    const status = await ipcRenderer.invoke('server:status');
    if (status && status.status === 'running') {
        showTrNotification('msg.serverStopping', 'Stopping server...', 'info');
        appendSmConsoleLine(tr('msg.serverStopCommandSent', 'Stop command sent...'), 'info');
        await ipcRenderer.invoke('server:stop');
    } else {
        showTrNotification('msg.serverNotRunning', 'Server is not running right now.', 'info');
    }
});

document.getElementById('btn-sm-deploy')?.addEventListener('click', async () => {
    if (!currentProjectPath) {
        showTrNotification('msg.openProjectFirst', 'Open a project first!', 'error');
        return;
    }

    appendSmConsoleLine(tr('msg.serverDeployingProject', 'Deploying project to server...'), 'info');
    showTrNotification('msg.serverBuildAndDeploy', 'Building project and deploying to server...', 'info');

    const buildResult = await ipcRenderer.invoke('build:run', currentProjectPath);
    if (!buildResult.success) {
        appendSmConsoleLine(tr('msg.buildError', 'Build error: {error}', {
            error: buildResult.error || tr('msg.errorFallback', 'Error'),
        }), 'error');
        showTrNotification('msg.buildFailed', 'Build failed.', 'error');
        return;
    }

    let targetFileToDeploy = null;
    try {
        const entries = await ipcRenderer.invoke('fs:readDir', currentProjectPath);
        const hasPom = entries.some(e => e.name === 'pom.xml');
        const hasBuildGradle = entries.some(e => e.name === 'build.gradle');

        if (hasPom || hasBuildGradle) {
            const targetDirPath = nodePath.join(currentProjectPath, hasPom ? 'target' : 'build/libs');
            const targetEntries = await ipcRenderer.invoke('fs:readDir', targetDirPath);
            if (targetEntries && targetEntries.length > 0) {
                const jars = targetEntries.filter(e => e.name.endsWith('.jar') && !e.name.includes('-original') && !e.name.includes('-sources'));
                if (jars.length > 0) {
                    targetFileToDeploy = jars[0].path;
                }
            }
        } else {
            const skripts = entries.filter(e => e.name.endsWith('.sk'));
            if (skripts.length > 0) {
                targetFileToDeploy = skripts[0].path;
            }
        }
    } catch (e) {
        console.error('Error finding target files', e);
    }

    if (!targetFileToDeploy) {
        appendSmConsoleLine(tr('msg.buildFileNotFound', 'Build artifact not found! Make sure your target (.jar or .sk) file was generated.'), 'error');
        showTrNotification('msg.buildArtifactNotFoundShort', 'Build artifact not found.', 'error');
        return;
    }

    const deployResult = await ipcRenderer.invoke('server:deploy', targetFileToDeploy);
    if (deployResult && deployResult.success) {
        const targetName = nodePath.basename(targetFileToDeploy);
        appendSmConsoleLine(tr('msg.serverPluginCopied', 'Plugin copied to server: {name}', { name: targetName }), 'success');
        showTrNotification('msg.serverDeployed', 'Successfully deployed!', 'success');

        const status = await ipcRenderer.invoke('server:status');
        if (status && status.status === 'running') {
            await ipcRenderer.invoke('server:command', 'reload confirm');
            appendSmConsoleLine(tr('msg.serverReloadingConsole', 'CraftIDE > Reloading server (reload)...'), 'dim');
        }
    } else {
        appendSmConsoleLine(tr('msg.deployUnexpected', 'Something went wrong during deployment: {error}', {
            error: deployResult?.error || tr('msg.errorFallback', 'Error'),
        }), 'error');
    }
});

// ─── VB "Derle & Test Et" — tek tıkla kod üret → derle → sunucuya yükle ───
async function deployToServer() {
    if (!currentProjectPath) {
        showTrNotification('msg.openProjectFirst', 'Open a project first!', 'error');
        return;
    }

    let code = '';
    if (typeof vbGenerateCode === 'function') {
        code = vbGenerateCode({ returnOnly: true });
    }

    if (!code || code.trim() === '' || code.startsWith('// Hen??z') || code.startsWith('# Hen??z')) {
        showTrNotification('msg.noBlocksInVB', 'Add blocks in Visual Builder first!', 'error');
        return;
    }

    showTrNotification('msg.vbWriteProjectFile', 'Writing code to project file...', 'info');

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
            showTrNotification('msg.skriptFileSaved', 'Skript file saved!', 'success');
            const deployResult = await ipcRenderer.invoke('server:deploy', skPath);
            if (deployResult && deployResult.success) {
                showTrNotification('msg.skriptDeployed', 'Skript deployed to server!', 'success');
                const status = await ipcRenderer.invoke('server:status');
                if (status && status.status === 'running') {
                    await ipcRenderer.invoke('server:command', 'reload confirm');
                }
            } else {
                showTrNotification('msg.deployError', 'Deploy error: {error}', 'error', { error: deployResult?.error || '?' });
            }
            return;
        }

        const projectName = nodePath.basename(currentProjectPath);
        const srcMainJava = nodePath.join(currentProjectPath, 'src', 'main', 'java');
        const srcExists = await ipcRenderer.invoke('fs:exists', srcMainJava);
        if (srcExists) {
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
                for (const item of items) {
                    if (!item.isDirectory && item.name.endsWith('.java')) return item.path;
                }
                return null;
            };
            const javaPath = await findMainJava(srcMainJava);
            if (javaPath) {
                await ipcRenderer.invoke('fs:writeFile', javaPath, code);
                showTrNotification('msg.javaFileUpdated', 'Java file updated: {name}', 'info', { name: nodePath.basename(javaPath) });
            }
        }
    } catch (e) {
        console.error('deployToServer - kod yazma hatas??:', e);
    }

    showTrNotification('msg.building', 'Building...', 'info');
    const buildResult = await ipcRenderer.invoke('build:run', currentProjectPath);
    if (!buildResult.success) {
        showTrNotification('msg.buildError', 'Build error: {error}', 'error', { error: buildResult.error || 'unknown' });
        if (appendSmConsoleLine) {
            appendSmConsoleLine(tr('msg.buildError', 'Build error: {error}', { error: buildResult.error || tr('msg.errorFallback', 'Error') }), 'error');
        }
        return;
    }
    showTrNotification('msg.buildSuccess', 'Build successful!', 'success');

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
    } catch (e) { console.error('deployToServer - jar arama hatas??:', e); }

    if (!targetFile) {
        showTrNotification('msg.jarNotFound', 'JAR not found!', 'error');
        return;
    }

    const deployResult = await ipcRenderer.invoke('server:deploy', targetFile);
    if (deployResult && deployResult.success) {
        const targetName = nodePath.basename(targetFile);
        showTrNotification('msg.vbArtifactDeployed', 'Deployed to server: {name}', 'success', { name: targetName });
        appendSmConsoleLine && appendSmConsoleLine(tr('msg.vbArtifactDeployed', 'Deployed to server: {name}', { name: targetName }), 'success');
        const status = await ipcRenderer.invoke('server:status');
        if (status && status.status === 'running') {
            await ipcRenderer.invoke('server:command', 'reload confirm');
            appendSmConsoleLine && appendSmConsoleLine(tr('msg.vbReloadSent', 'CraftIDE > Sent reload confirm'), 'dim');
            showTrNotification('msg.serverReloading', 'Reloading server...', 'info');
        }
    } else {
        showTrNotification('msg.deployError', 'Deploy error: {error}', 'error', { error: deployResult?.error || '?' });
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
        if (legacyBtnLabel) legacyBtnLabel.textContent = tr('ui.server.manage', 'Manage Server');
        if (smStartBtn) smStartBtn.disabled = true;
        if (smStopBtn) smStopBtn.disabled = false;
        showTrNotification('msg.testServerRunning', 'Test server is running!', 'success');
    } else {
        if (legacyBtnLabel) legacyBtnLabel.textContent = tr('ui.server.localTest', 'Local Test Server');
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
    showTrNotification('notify.apiRefHint', 'Open a Java file - view API details on hover!', 'info');
});

// ═══════════════════════════════════════════════════════════
// Keyboard Shortcuts
// ═══════════════════════════════════════════════════════════

const SHORTCUTS_STORAGE_KEY = 'craftide.shortcuts.bindings';
const SHORTCUTS_VERSION_KEY = 'craftide.shortcuts.version';
const SHORTCUTS_VERSION = '1';
let shortcutBindings = {};
let captureShortcutCommandId = null;

const SHORTCUT_COMMANDS = [
    { id: 'app.save', label: 'Save Current File', scope: 'global', defaultBinding: 'Ctrl+S', handler: () => saveCurrentFile() },
    { id: 'app.openFolder', label: 'Open Folder', scope: 'global', defaultBinding: 'Ctrl+O', handler: () => openFolder() },
    { id: 'app.newProject', label: 'New Project', scope: 'global', defaultBinding: 'Ctrl+N', handler: () => showNewProjectModal() },
    { id: 'app.settings', label: 'Open Settings', scope: 'global', defaultBinding: 'Ctrl+,', handler: () => openFile('settings://tab', getVirtualTabName('settings://tab')) },
    { id: 'app.toggleTerminal', label: 'Toggle Terminal Panel', scope: 'global', defaultBinding: 'Ctrl+`', handler: () => document.getElementById('btn-toggle-panel')?.click() },
    { id: 'app.closeModal', label: 'Close Modal', scope: 'global', defaultBinding: 'Escape', handler: () => hideNewProjectModal() },

    { id: 'vb.deleteNode', label: 'Delete Selected Node', scope: 'vb', defaultBinding: 'Delete', handler: () => window.CraftIDEVB?.deleteSelectedNode?.() },
    { id: 'vb.undo', label: 'Undo', scope: 'vb', defaultBinding: 'Ctrl+Z', handler: () => (window.CraftIDEVB?.history?.undo?.() || document.getElementById('btn-vb-undo')?.click()) },
    { id: 'vb.redo', label: 'Redo', scope: 'vb', defaultBinding: 'Ctrl+Y', handler: () => (window.CraftIDEVB?.history?.redo?.() || document.getElementById('btn-vb-redo')?.click()) },
    { id: 'vb.generate', label: 'Generate Code', scope: 'vb', defaultBinding: 'Ctrl+Enter', handler: () => document.getElementById('btn-vb-generate')?.click() },
    { id: 'vb.clear', label: 'Clear Canvas', scope: 'vb', defaultBinding: 'Ctrl+Shift+Delete', handler: () => document.getElementById('btn-vb-clear')?.click() },
    { id: 'vb.templates', label: 'Open Templates', scope: 'vb', defaultBinding: 'Ctrl+Shift+T', handler: () => (window.CraftIDEVB?.showTemplatesModal?.() || document.getElementById('btn-vb-templates')?.click()) },

    { id: 'explorer.newFile', label: 'Explorer New File', scope: 'explorer', defaultBinding: 'Ctrl+Alt+N', handler: () => createExplorerEntry('file', { openAfterCreate: true }) },
    { id: 'explorer.newFolder', label: 'Explorer New Folder', scope: 'explorer', defaultBinding: 'Ctrl+Alt+Shift+N', handler: () => createExplorerEntry('folder', { openAfterCreate: false }) },
    { id: 'explorer.refresh', label: 'Explorer Refresh', scope: 'explorer', defaultBinding: 'F5', handler: () => currentProjectPath && renderFileTree(currentProjectPath) },

    { id: 'image.save', label: 'Image Save', scope: 'image', defaultBinding: 'Ctrl+S', handler: () => window.saveImageEditorFile?.() },
    { id: 'image.undo', label: 'Image Undo', scope: 'image', defaultBinding: 'Ctrl+Z', handler: () => document.getElementById('ie-undo')?.click() },
    { id: 'image.redo', label: 'Image Redo', scope: 'image', defaultBinding: 'Ctrl+Y', handler: () => document.getElementById('ie-redo')?.click() },
    { id: 'image.tool.pencil', label: 'Image Tool Pencil', scope: 'image', defaultBinding: 'P', handler: () => document.querySelector('.ie-tool[data-tool="pencil"]')?.click() },
    { id: 'image.tool.eraser', label: 'Image Tool Eraser', scope: 'image', defaultBinding: 'E', handler: () => document.querySelector('.ie-tool[data-tool="eraser"]')?.click() },
    { id: 'image.tool.fill', label: 'Image Tool Fill', scope: 'image', defaultBinding: 'F', handler: () => document.querySelector('.ie-tool[data-tool="fill"]')?.click() },
    { id: 'image.tool.hand', label: 'Image Tool Pan', scope: 'image', defaultBinding: 'H', handler: () => document.querySelector('.ie-tool[data-tool="hand"]')?.click() },
];

const SHORTCUT_COMMAND_MAP = new Map(SHORTCUT_COMMANDS.map((cmd) => [cmd.id, cmd]));

function getScopeLabel(scope) {
    if (scope === 'vb') return tr('ui.shortcuts.scope.vb', 'Visual Builder');
    if (scope === 'explorer') return tr('ui.shortcuts.scope.explorer', 'Explorer');
    if (scope === 'image') return tr('ui.shortcuts.scope.image', 'Image Editor');
    return tr('ui.shortcuts.scope.global', 'Global');
}

function normalizeBinding(value) {
    return String(value || '').trim();
}

function bindingFromKeyboardEvent(event) {
    const key = String(event.key || '');
    if (!key) return '';
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return '';
    const parts = [];
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    const keyMap = {
        ' ': 'Space',
        Escape: 'Escape',
        Enter: 'Enter',
        Tab: 'Tab',
        Backspace: 'Backspace',
        Delete: 'Delete',
        ArrowUp: 'ArrowUp',
        ArrowDown: 'ArrowDown',
        ArrowLeft: 'ArrowLeft',
        ArrowRight: 'ArrowRight',
    };
    const normalizedKey = keyMap[key] || (key.length === 1 ? key.toUpperCase() : key);
    parts.push(normalizedKey);
    return parts.join('+');
}

function getCurrentShortcutContext() {
    const path = String(currentFilePath || '');
    if (path.startsWith('visual-builder://')) return 'vb';
    if (path.startsWith('image-editor://') || ['.png', '.jpg', '.jpeg'].includes(nodePath.extname(path).toLowerCase())) return 'image';
    if (activePanel === 'explorer' || document.activeElement?.closest?.('#panel-explorer')) return 'explorer';
    return 'global';
}

function loadShortcutBindings() {
    const version = localStorage.getItem(SHORTCUTS_VERSION_KEY);
    if (version !== SHORTCUTS_VERSION) {
        shortcutBindings = {};
        SHORTCUT_COMMANDS.forEach((cmd) => {
            shortcutBindings[cmd.id] = cmd.defaultBinding;
        });
        localStorage.setItem(SHORTCUTS_VERSION_KEY, SHORTCUTS_VERSION);
        localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcutBindings));
        return;
    }
    try {
        const parsed = JSON.parse(localStorage.getItem(SHORTCUTS_STORAGE_KEY) || '{}');
        SHORTCUT_COMMANDS.forEach((cmd) => {
            shortcutBindings[cmd.id] = normalizeBinding(parsed[cmd.id] || cmd.defaultBinding);
        });
    } catch {
        shortcutBindings = {};
        SHORTCUT_COMMANDS.forEach((cmd) => {
            shortcutBindings[cmd.id] = cmd.defaultBinding;
        });
    }
}

function persistShortcutBindings() {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcutBindings));
    localStorage.setItem(SHORTCUTS_VERSION_KEY, SHORTCUTS_VERSION);
}

function getShortcutConflicts(commandId, binding) {
    if (!binding) return [];
    const command = SHORTCUT_COMMAND_MAP.get(commandId);
    if (!command) return [];
    const conflicts = [];
    SHORTCUT_COMMANDS.forEach((other) => {
        if (other.id === commandId) return;
        const otherBinding = normalizeBinding(shortcutBindings[other.id]);
        if (!otherBinding || otherBinding !== binding) return;
        if (other.scope === command.scope || other.scope === 'global' || command.scope === 'global') {
            conflicts.push(other);
        }
    });
    return conflicts;
}

function renderShortcutSettings() {
    const list = document.getElementById('shortcuts-list');
    if (!list) return;
    list.innerHTML = SHORTCUT_COMMANDS.map((cmd) => {
        const binding = normalizeBinding(shortcutBindings[cmd.id]);
        const display = binding || tr('ui.shortcuts.unbound', 'Unbound');
        const conflicts = getShortcutConflicts(cmd.id, binding);
        const warning = conflicts.length
            ? `<div class="shortcut-warning">${tr('ui.shortcuts.conflict', 'Conflict with: {command}', { command: conflicts.map((c) => c.label).join(', ') })}</div>`
            : '';
        return `
            <div class="shortcut-item" data-shortcut-id="${cmd.id}">
                <div class="shortcut-meta">
                    <div class="shortcut-title">${cmd.label}</div>
                    <div class="shortcut-sub">${getScopeLabel(cmd.scope)}</div>
                </div>
                <button class="btn-secondary shortcut-bind-btn ${captureShortcutCommandId === cmd.id ? 'capturing' : ''}" data-shortcut-bind="${cmd.id}">
                    ${captureShortcutCommandId === cmd.id ? tr('ui.shortcuts.capture', 'Press keys...') : display}
                </button>
                <button class="btn-secondary" data-shortcut-reset="${cmd.id}">Reset</button>
                ${warning}
            </div>
        `;
    }).join('');

    list.querySelectorAll('[data-shortcut-bind]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const commandId = btn.getAttribute('data-shortcut-bind');
            captureShortcutCommandId = captureShortcutCommandId === commandId ? null : commandId;
            renderShortcutSettings();
        });
    });
    list.querySelectorAll('[data-shortcut-reset]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const commandId = btn.getAttribute('data-shortcut-reset');
            const command = SHORTCUT_COMMAND_MAP.get(commandId);
            if (!command) return;
            shortcutBindings[commandId] = command.defaultBinding;
            persistShortcutBindings();
            renderShortcutSettings();
        });
    });
}

function commandMatchesBinding(command, binding) {
    const assigned = normalizeBinding(shortcutBindings[command.id]);
    return assigned && assigned === binding;
}

async function executeShortcutCommand(command) {
    if (!command || typeof command.handler !== 'function') return false;
    const result = command.handler();
    if (result && typeof result.then === 'function') {
        await result;
    }
    return true;
}

async function handleShortcutKeydown(event) {
    if (captureShortcutCommandId) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'Escape') {
            captureShortcutCommandId = null;
            renderShortcutSettings();
            return;
        }
        if ((event.key === 'Backspace' || event.key === 'Delete') && !(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)) {
            shortcutBindings[captureShortcutCommandId] = '';
            captureShortcutCommandId = null;
            persistShortcutBindings();
            renderShortcutSettings();
            return;
        }
        const binding = bindingFromKeyboardEvent(event);
        if (!binding) return;
        shortcutBindings[captureShortcutCommandId] = binding;
        captureShortcutCommandId = null;
        persistShortcutBindings();
        renderShortcutSettings();
        return;
    }

    const target = event.target;
    const tag = String(target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;

    const binding = bindingFromKeyboardEvent(event);
    if (!binding) return;
    const context = getCurrentShortcutContext();
    let command = SHORTCUT_COMMANDS.find((cmd) => cmd.scope === context && commandMatchesBinding(cmd, binding));
    if (!command) {
        command = SHORTCUT_COMMANDS.find((cmd) => cmd.scope === 'global' && commandMatchesBinding(cmd, binding));
    }
    if (!command) return;

    event.preventDefault();
    event.stopPropagation();
    await executeShortcutCommand(command);
}

function resetAllShortcuts() {
    SHORTCUT_COMMANDS.forEach((cmd) => {
        shortcutBindings[cmd.id] = cmd.defaultBinding;
    });
    persistShortcutBindings();
    renderShortcutSettings();
}

function initShortcutSystem() {
    loadShortcutBindings();
    renderShortcutSettings();
    document.getElementById('btn-shortcuts-reset-all')?.addEventListener('click', resetAllShortcuts);
    document.addEventListener('keydown', (event) => {
        handleShortcutKeydown(event);
    });
    document.addEventListener('lang:changed', () => {
        renderShortcutSettings();
    });
}
initShortcutSystem();

// ═══════════════════════════════════════════════════════════
// Settings Logic & Language Sync
// ═══════════════════════════════════════════════════════════

const SETTINGS_KEYS = [
    'setting-ai-provider', 'setting-ai-model', 'setting-ai-endpoint', 'setting-ai-key',
    'setting-font-size', 'setting-font-family', 'setting-tab-size', 'setting-minimap', 'setting-wordwrap',
    'setting-platform', 'setting-language', 'setting-update-asset-preference'
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
                showNotification(tr('ui.settings.saved', 'Settings saved.'), 'success');
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

async function syncTitlebarVersion() {
    const versionEl = document.getElementById('titlebar-version');
    if (!versionEl) return;
    try {
        const version = await ipcRenderer.invoke('app:getVersion');
        if (version) versionEl.textContent = `v${version}`;
    } catch {
        // ignore version lookup failures in renderer
    }
}

let latestOfficialVerificationResult = null;
let latestOfficialUpdateStatus = null;
let lastUpdaterStatusNotified = '';
let officialUpdateLoading = false;

function formatByteSize(bytes) {
    const value = Number(bytes || 0);
    if (!Number.isFinite(value) || value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function localizeDescriptor(descriptor, fallbackKey, fallbackText, fallbackParams) {
    if (!descriptor) return tr(fallbackKey, fallbackText, fallbackParams);
    return tr(
        descriptor.key || fallbackKey,
        descriptor.fallback || fallbackText,
        { ...(fallbackParams || {}), ...(descriptor.params || {}) },
    );
}

function getOfficialAssetPreference() {
    const rawValue = document.getElementById('setting-update-asset-preference')?.value || localStorage.getItem('setting-update-asset-preference') || 'auto';
    return ['auto', 'setup', 'portable'].includes(rawValue) ? rawValue : 'auto';
}

function getOfficialAssetKindLabel(kind) {
    if (kind === 'portable') return tr('ui.official.assetKind.portable', 'Portable');
    if (kind === 'setup') return tr('ui.official.assetKind.setup', 'Setup');
    return tr('ui.official.assetKind.other', 'Asset');
}

function getOfficialDownloadableAssets(status) {
    return Array.isArray(status?.assets)
        ? status.assets.filter((asset) => asset?.kind === 'setup' || asset?.kind === 'portable')
        : [];
}

function getSelectedOfficialAsset(status) {
    const assets = getOfficialDownloadableAssets(status);
    if (!assets.length) return null;
    const preferredKind = status?.preferredAssetKind === 'portable' ? 'portable' : 'setup';
    const priority = preferredKind === 'portable' ? ['portable', 'setup'] : ['setup', 'portable'];
    for (const kind of priority) {
        const match = assets.find((asset) => asset.kind === kind);
        if (match) return match;
    }
    return assets[0] || null;
}

function formatOfficialReleaseDate(dateValue) {
    if (!dateValue) return '';
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateValue));
    } catch {
        return String(dateValue);
    }
}

function getOfficialUpdateStatusLine(status) {
    if (!status) {
        return tr('ui.official.updaterLoading', 'Loading official release status...');
    }

    const updaterState = status.updaterState || null;
    const capability = status.updaterCapability || updaterState?.capability || null;
    const latestVersion = status.latestVersion || updaterState?.latestVersion || null;
    const progressSuffix = updaterState?.status === 'downloading'
        ? ` (${updaterState.progress ?? 0}% - ${formatByteSize(updaterState.transferred)} / ${formatByteSize(updaterState.total)})`
        : '';

    if (capability?.supportsInApp && updaterState) {
        const message = localizeDescriptor({
            key: updaterState.messageKey,
            fallback: updaterState.messageFallback,
            params: updaterState.messageParams,
        }, 'ui.official.updaterReady', 'Ready to check for updates from GitHub releases.');
        const latestSuffix = latestVersion
            ? ` ${tr('ui.official.latestLabel', 'Latest: v{version}', { version: latestVersion })}`
            : '';
        return `${message}${latestSuffix}${progressSuffix}`.trim();
    }

    if (officialUpdateLoading) {
        return tr('ui.official.checkingRelease', 'Checking latest official release...');
    }

    if (status.releaseErrorKey || status.releaseErrorFallback) {
        return localizeDescriptor({
            key: status.releaseErrorKey,
            fallback: status.releaseErrorFallback,
            params: status.releaseErrorParams,
        }, 'ui.official.releaseCheckError', 'Official release check failed: {error}');
    }

    if (status.updateAvailable && latestVersion) {
        return tr('ui.official.manualUpdateAvailableStatus', 'Official release v{version} is available. Manual download is ready.', {
            version: latestVersion,
        });
    }

    if (status.releaseCheckSucceeded && latestVersion) {
        return tr('ui.official.manualLatestStatus', 'Official release v{version} checked. Manual update mode is active.', {
            version: latestVersion,
        });
    }

    return localizeDescriptor(capability && {
        key: capability.reasonKey,
        fallback: capability.reasonFallback,
        params: capability.reasonParams,
    }, 'ui.official.updaterUnavailable', 'Updater state is unavailable.');
}

function getOfficialUpdateDetails(status, selectedAsset) {
    if (!status) {
        return tr('ui.official.updaterLoading', 'Loading official release status...');
    }

    const updaterState = status.updaterState || null;
    const capability = status.updaterCapability || updaterState?.capability || null;
    const publishedAt = formatOfficialReleaseDate(status.publishedAt);

    if (status.releaseErrorKey || status.releaseErrorFallback) {
        return localizeDescriptor({
            key: status.releaseErrorKey,
            fallback: status.releaseErrorFallback,
            params: status.releaseErrorParams,
        }, 'ui.official.releaseCheckError', 'Official release check failed: {error}');
    }

    if (!status.releaseCheckSucceeded) {
        return tr('ui.official.checkingRelease', 'Checking latest official release...');
    }

    if (status.updateAvailable) {
        if (updaterState?.status === 'downloaded') {
            return tr('ui.official.updateDownloaded', 'Update downloaded: {current} -> {latest}. Click "Install update" to restart and apply it.', {
                current: status.currentVersion || '?',
                latest: status.latestVersion || updaterState.latestVersion || '?',
            });
        }
        if (updaterState?.status === 'downloading') {
            return tr('ui.official.updateDownloading', 'Downloading official update {version} in the background.', {
                version: status.latestVersion || updaterState.latestVersion || '?',
            });
        }
        if (capability?.supportsInApp) {
            return tr('ui.official.updateAvailable', 'Update available: {current} -> {latest}. Use "Download update" to fetch it in-app.', {
                current: status.currentVersion || '?',
                latest: status.latestVersion || '?',
            });
        }
        if (selectedAsset) {
            return tr('ui.official.updateManualAvailable', 'Update available: {current} -> {latest}. Download "{asset}" from the official release page.', {
                current: status.currentVersion || '?',
                latest: status.latestVersion || '?',
                asset: selectedAsset.name,
            });
        }
        return tr('ui.official.assetNone', 'No downloadable setup or portable asset was found in the official release.');
    }

    let detail = tr('ui.official.updateNotAvailable', 'You are on the latest official version ({current}).', {
        current: status.currentVersion || status.latestVersion || '?',
    });

    if (publishedAt) {
        detail += ` ${tr('ui.official.releasePublishedAt', 'Published: {date}', { date: publishedAt })}`;
    }

    if (capability && !capability.supportsInApp) {
        detail += ` ${localizeDescriptor({
            key: capability.reasonKey,
            fallback: capability.reasonFallback,
            params: capability.reasonParams,
        }, 'ui.official.updaterUnavailable', 'Updater state is unavailable.')}`;
    }

    return detail.trim();
}

function renderOfficialAssetSelection(status, selectedAsset) {
    const assetEl = document.getElementById('official-selected-asset');
    if (!assetEl) return;

    if (!status || (!status.releaseCheckSucceeded && !status.releaseErrorKey)) {
        assetEl.textContent = tr('ui.official.assetPending', 'Recommended asset will appear after the official release check.');
        return;
    }

    if (!selectedAsset) {
        assetEl.textContent = tr('ui.official.assetNone', 'No downloadable setup or portable asset was found in the official release.');
        return;
    }

    const updaterState = status.updaterState || null;
    const capability = status.updaterCapability || updaterState?.capability || null;
    const key = capability?.supportsInApp ? 'ui.official.assetSelectedInApp' : 'ui.official.assetSelectedManual';
    const fallback = capability?.supportsInApp
        ? 'Selected asset for this build: {name} ({size}, {kind}).'
        : 'Manual download target: {name} ({size}, {kind}).';
    assetEl.textContent = tr(key, fallback, {
        name: selectedAsset.name,
        size: formatByteSize(selectedAsset.size),
        kind: getOfficialAssetKindLabel(selectedAsset.kind),
    });
}

function renderOfficialUpdateState(status) {
    latestOfficialUpdateStatus = status || null;

    const statusEl = document.getElementById('official-auto-update-status');
    const updatesEl = document.getElementById('official-update-result');
    const lockEl = document.getElementById('official-channel-lock');
    const checkBtn = document.getElementById('btn-official-check-updates');
    const downloadBtn = document.getElementById('btn-official-download-update');
    const installBtn = document.getElementById('btn-official-install-update');
    const openBtn = document.getElementById('btn-open-official-release');
    const selectedAsset = getSelectedOfficialAsset(status);
    const updaterState = status?.updaterState || null;
    const capability = status?.updaterCapability || updaterState?.capability || null;
    const manualDownloadAvailable = Boolean(status?.releaseCheckSucceeded && status?.updateAvailable && selectedAsset && !capability?.supportsInApp);
    const inAppDownloadAvailable = Boolean(updaterState?.canDownload);

    if (checkBtn) {
        checkBtn.disabled = officialUpdateLoading || updaterState?.status === 'checking' || updaterState?.status === 'downloading';
    }
    if (downloadBtn) {
        downloadBtn.disabled = !(inAppDownloadAvailable || manualDownloadAvailable);
    }
    if (installBtn) {
        installBtn.disabled = !updaterState?.canInstall;
    }
    if (openBtn) {
        openBtn.disabled = false;
    }
    if (lockEl && status) {
        lockEl.textContent = tr('ui.official.channelLockedDynamic', 'Channel locked: {owner}/{repo}', {
            owner: status.owner || 'unknown',
            repo: status.repo || 'unknown',
        });
    }

    if (!statusEl || !updatesEl) return;
    if (!status) {
        statusEl.textContent = tr('ui.official.updaterLoading', 'Loading official release status...');
        updatesEl.textContent = tr('ui.official.assetPending', 'Recommended asset will appear after the official release check.');
        renderOfficialAssetSelection(status, selectedAsset);
        return;
    }

    statusEl.textContent = getOfficialUpdateStatusLine(status);
    updatesEl.textContent = getOfficialUpdateDetails(status, selectedAsset);
    renderOfficialAssetSelection(status, selectedAsset);

    const notifyStatus = capability?.supportsInApp
        ? (updaterState?.status || 'idle')
        : (status.updateAvailable ? 'manual-available' : 'manual-idle');
    const notifyKey = `${notifyStatus}:${status.latestVersion || updaterState?.latestVersion || ''}:${status.checkedAt || ''}`;
    if (notifyKey !== lastUpdaterStatusNotified) {
        if (notifyStatus === 'available' || notifyStatus === 'manual-available') {
            showNotification(tr('ui.official.notifyAvailable', 'New version available: v{version}', {
                version: status.latestVersion || updaterState?.latestVersion || '?',
            }), 'info');
        } else if (notifyStatus === 'downloaded') {
            showNotification(tr('ui.official.notifyDownloaded', 'Update downloaded: v{version}', {
                version: status.latestVersion || updaterState?.latestVersion || '?',
            }), 'success');
        }
        lastUpdaterStatusNotified = notifyKey;
    }
}

function renderOfficialStatus(status, reason) {
    const statusEl = document.getElementById('official-verify-status');
    const detailsEl = document.getElementById('official-verify-details');
    if (!statusEl || !detailsEl) return;

    const safeStatus = String(status || 'unknown').toLowerCase();
    statusEl.classList.remove('pending', 'verified', 'unverified', 'unknown', 'development', 'error');
    statusEl.classList.add(safeStatus);
    statusEl.textContent = tr(`ui.official.status.${safeStatus}`, safeStatus);
    if (typeof reason === 'string') {
        detailsEl.textContent = reason;
        return;
    }
    detailsEl.textContent = localizeDescriptor(reason, 'ui.official.noDetail', 'No detail.');
}

function renderOfficialVerificationResult(result) {
    latestOfficialVerificationResult = result || null;

    const lockEl = document.getElementById('official-channel-lock');
    const detailsEl = document.getElementById('official-verify-details');
    if (!result) {
        renderOfficialStatus('unknown', { key: 'ui.official.noDetail', fallback: 'No detail.', params: {} });
        return;
    }

    const reasonParts = [
        localizeDescriptor({
            key: result.reasonKey,
            fallback: result.reasonFallback || result.reason,
            params: result.reasonParams,
        }, 'ui.official.noReason', 'No reason provided.'),
    ];
    if (result.officialTag) {
        reasonParts.push(tr('ui.official.officialTag', 'Official tag: {tag}', { tag: result.officialTag }));
    }
    if (result.checksumsAsset) {
        reasonParts.push(tr('ui.official.checksumsAsset', 'Checksums asset: {name}', { name: result.checksumsAsset }));
    }
    if (result.localAsarSha256) {
        reasonParts.push(tr('ui.official.localAsar', 'Local app.asar SHA256: {hash}', {
            hash: `${String(result.localAsarSha256).slice(0, 12)}...`,
        }));
    }

    renderOfficialStatus(result.status || 'unknown', reasonParts.join(' '));

    if (lockEl) {
        lockEl.textContent = tr('ui.official.channelLockedDynamic', 'Channel locked: {owner}/{repo}', {
            owner: result.owner || 'unknown',
            repo: result.repo || 'unknown',
        });
    }

    if (detailsEl && result.officialReleaseUrl) {
        detailsEl.innerHTML = `${escapeHtml(reasonParts.join(' '))} <a href="${result.officialReleaseUrl}" target="_blank" rel="noopener">${escapeHtml(tr('ui.official.releaseLink', 'Official release'))}</a>`;
    }
}

function mergeUpdaterStateIntoOfficialStatus(state) {
    if (!state) return;

    if (!latestOfficialUpdateStatus) {
        latestOfficialUpdateStatus = {
            channelLocked: true,
            owner: 'ali975',
            repo: 'CraftIDE-MyFirstProject',
            currentVersion: state.currentVersion || 'unknown',
            latestTag: state.latestVersion ? `v${state.latestVersion}` : null,
            latestVersion: state.latestVersion || null,
            updateAvailable: Boolean(state.updateAvailable),
            publishedAt: null,
            releaseUrl: null,
            assets: [],
            preferredAssetKind: getOfficialAssetPreference() === 'portable' ? 'portable' : 'setup',
            updaterCapability: state.capability || null,
            updaterState: state,
            checkedAt: new Date().toISOString(),
            releaseCheckSucceeded: false,
            releaseErrorKey: null,
            releaseErrorFallback: null,
            releaseErrorParams: {},
        };
        renderOfficialUpdateState(latestOfficialUpdateStatus);
        return;
    }

    latestOfficialUpdateStatus = {
        ...latestOfficialUpdateStatus,
        currentVersion: latestOfficialUpdateStatus.currentVersion || state.currentVersion || 'unknown',
        latestVersion: latestOfficialUpdateStatus.latestVersion || state.latestVersion || null,
        latestTag: latestOfficialUpdateStatus.latestTag || (state.latestVersion ? `v${state.latestVersion}` : null),
        updateAvailable: Boolean(latestOfficialUpdateStatus.updateAvailable || state.updateAvailable),
        updaterCapability: state.capability || latestOfficialUpdateStatus.updaterCapability,
        updaterState: state,
    };
    renderOfficialUpdateState(latestOfficialUpdateStatus);
}

async function loadOfficialUpdateStatus(options = {}) {
    const triggerCheck = options.triggerCheck === true;
    const silent = options.silent === true;
    const channel = triggerCheck ? 'official:checkUpdates' : 'official:getUpdateStatus';

    officialUpdateLoading = true;
    renderOfficialUpdateState(latestOfficialUpdateStatus);

    try {
        const status = await ipcRenderer.invoke(channel, getOfficialAssetPreference());
        officialUpdateLoading = false;
        renderOfficialUpdateState(status);
    } catch (err) {
        officialUpdateLoading = false;
        const error = err?.message || err || 'unknown';
        const fallback = latestOfficialUpdateStatus
            ? {
                ...latestOfficialUpdateStatus,
                checkedAt: new Date().toISOString(),
                releaseCheckSucceeded: false,
                releaseErrorKey: 'ui.official.releaseCheckError',
                releaseErrorFallback: 'Official release check failed: {error}',
                releaseErrorParams: { error },
            }
            : null;
        renderOfficialUpdateState(fallback);
        if (!silent) {
            showNotification(tr('ui.official.releaseCheckError', 'Official release check failed: {error}', { error }), 'error');
        }
    }
}

async function verifyOfficialBuildUi() {
    const updatesEl = document.getElementById('official-update-result');
    if (updatesEl) updatesEl.textContent = '';

    renderOfficialStatus('pending', {
        key: 'ui.official.verifyChecking',
        fallback: 'Checking local build integrity against official release checksums...',
        params: {},
    });
    try {
        const result = await ipcRenderer.invoke('official:verifyBuild');
        renderOfficialVerificationResult(result);
    } catch (err) {
        renderOfficialVerificationResult({
            status: 'error',
            reasonKey: 'ui.official.verifyFailed',
            reasonFallback: 'Verification failed: {error}',
            reasonParams: { error: err?.message || err || 'unknown' },
            owner: 'ali975',
            repo: 'CraftIDE-MyFirstProject',
        });
    }
}

async function checkOfficialUpdatesUi() {
    await loadOfficialUpdateStatus({ triggerCheck: true });
}

async function downloadOfficialUpdateUi() {
    const status = latestOfficialUpdateStatus;
    const updaterState = status?.updaterState || null;
    const capability = status?.updaterCapability || updaterState?.capability || null;
    const selectedAsset = getSelectedOfficialAsset(status);

    if (!status?.updateAvailable) {
        showNotification(tr('ui.official.noDownloadReady', 'Check for updates first and wait for an available release.'), 'warn');
        return;
    }

    if (!capability?.supportsInApp) {
        if (selectedAsset?.url) {
            window.open(selectedAsset.url, '_blank');
            showNotification(tr('ui.official.manualDownloadOpening', 'Opening official download: {name}', {
                name: selectedAsset.name,
            }), 'info');
            return;
        }
        if (status?.releaseUrl) {
            window.open(status.releaseUrl, '_blank');
            showNotification(tr('ui.official.manualReleaseOpening', 'Opening the official release page.'), 'info');
            return;
        }
        showNotification(tr('ui.official.assetNone', 'No downloadable setup or portable asset was found in the official release.'), 'warn');
        return;
    }

    try {
        const state = await ipcRenderer.invoke('updater:download');
        mergeUpdaterStateIntoOfficialStatus(state);
    } catch (err) {
        const error = err?.message || err || 'unknown';
        if (latestOfficialUpdateStatus?.updaterState) {
            mergeUpdaterStateIntoOfficialStatus({
                ...latestOfficialUpdateStatus.updaterState,
                status: 'error',
                messageKey: 'ui.official.downloadFailed',
                messageFallback: 'Update download failed: {error}',
                messageParams: { error },
            });
        }
        showNotification(tr('ui.official.downloadFailed', 'Update download failed: {error}', { error }), 'error');
    }
}

async function installOfficialUpdateUi() {
    try {
        const ok = await ipcRenderer.invoke('updater:quitAndInstall');
        if (!ok) {
            showNotification(tr('ui.official.installNotReady', 'A downloaded update is required before installation can start.'), 'warn');
            return;
        }
        showNotification(tr('ui.official.installStarting', 'The app is restarting to install the update.'), 'info');
    } catch (err) {
        showNotification(tr('ui.official.installFailed', 'Install could not be started: {error}', {
            error: err.message || err,
        }), 'error');
    }
}

function initOfficialIntegrityPanel() {
    const verifyBtn = document.getElementById('btn-official-verify-refresh');
    const updatesBtn = document.getElementById('btn-official-check-updates');
    const downloadBtn = document.getElementById('btn-official-download-update');
    const installBtn = document.getElementById('btn-official-install-update');
    const openBtn = document.getElementById('btn-open-official-release');
    const assetPreferenceSelect = document.getElementById('setting-update-asset-preference');

    if (!verifyBtn || verifyBtn.dataset.bound === '1') return;
    verifyBtn.dataset.bound = '1';

    verifyBtn.addEventListener('click', () => verifyOfficialBuildUi());
    updatesBtn?.addEventListener('click', () => checkOfficialUpdatesUi());
    downloadBtn?.addEventListener('click', () => downloadOfficialUpdateUi());
    installBtn?.addEventListener('click', () => installOfficialUpdateUi());
    openBtn?.addEventListener('click', () => {
        const releaseUrl = latestOfficialUpdateStatus?.releaseUrl || 'https://github.com/ali975/CraftIDE-MyFirstProject/releases/latest';
        window.open(releaseUrl, '_blank');
    });
    assetPreferenceSelect?.addEventListener('change', () => {
        loadOfficialUpdateStatus({ triggerCheck: false, silent: true });
    });

    verifyOfficialBuildUi();
    loadOfficialUpdateStatus({ triggerCheck: false, silent: true });
}

ipcRenderer.on('updater:state', (_, state) => {
    mergeUpdaterStateIntoOfficialStatus(state);
});

document.addEventListener('lang:changed', () => {
    refreshLocalizedTabLabels();
    if (!currentFilePath) {
        const title = document.getElementById('titlebar-filename');
        if (title) title.textContent = tr('ui.titlebar.welcome', 'Welcome');
    }
    if (latestOfficialVerificationResult) {
        renderOfficialVerificationResult(latestOfficialVerificationResult);
    }
    if (latestOfficialUpdateStatus) {
        renderOfficialUpdateState(latestOfficialUpdateStatus);
    }
    updateProjectPlatformFields(getActiveProjectPlatform());
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
            grid.innerHTML = '<p style="color:var(--text-secondary);grid-column:span 2;">' + escapeHtml(tr('ui.onboard.noTemplate', 'No ready template exists for this mode. Start blank.')) + '</p>';
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
initOfficialIntegrityPanel();
syncTitlebarVersion();

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

// Visual Builder Top Region Resizer
const vbTopResizer = document.getElementById('vb-top-resizer');
const vbTopRegion = document.getElementById('vb-top-region');
const VB_TOP_REGION_KEY = 'craftide.vb.topRegionHeight';
const VB_TOP_REGION_MIN = 84;
const VB_TOP_REGION_MAX = 360;
const VB_TOP_REGION_DEFAULT = 136;

if (vbTopResizer && vbTopRegion) {
    const parseHeight = (value, fallback) => {
        const parsed = Number.parseInt(String(value || ''), 10);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(VB_TOP_REGION_MIN, Math.min(parsed, VB_TOP_REGION_MAX));
    };

    let isResizingVbTop = false;
    const savedHeight = parseHeight(localStorage.getItem(VB_TOP_REGION_KEY), VB_TOP_REGION_DEFAULT);
    vbTopRegion.style.height = savedHeight + 'px';

    vbTopResizer.addEventListener('mousedown', (e) => {
        isResizingVbTop = true;
        document.body.style.cursor = 'row-resize';
        vbTopResizer.classList.add('active');
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizingVbTop) return;
        const container = document.getElementById('visual-builder-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const targetHeight = e.clientY - rect.top;
        const clampedHeight = Math.max(VB_TOP_REGION_MIN, Math.min(targetHeight, VB_TOP_REGION_MAX));
        vbTopRegion.style.height = clampedHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!isResizingVbTop) return;
        isResizingVbTop = false;
        document.body.style.cursor = 'default';
        vbTopResizer.classList.remove('active');
        const finalHeight = parseHeight(vbTopRegion.style.height, VB_TOP_REGION_DEFAULT);
        vbTopRegion.style.height = finalHeight + 'px';
        localStorage.setItem(VB_TOP_REGION_KEY, String(finalHeight));
        window.dispatchEvent(new Event('resize'));
    });
}

let vbToolbarMoreObserver = null;

function syncVBToolbarMore() {
    const right = document.getElementById('vb-toolbar-right');
    const wrap = document.getElementById('vb-toolbar-more-wrap');
    const menu = document.getElementById('vb-toolbar-more-menu');
    if (!right || !wrap || !menu) return;

    const rightChildren = Array.from(right.children).filter((el) => el !== wrap);
    rightChildren.forEach((child) => {
        const isPrimary = child.getAttribute('data-vb-primary') === '1';
        if (!isPrimary && child.parentElement === right) {
            menu.appendChild(child);
        }
    });

    wrap.style.display = menu.children.length ? 'inline-flex' : 'none';
}

function initVBToolbarMore() {
    const right = document.getElementById('vb-toolbar-right');
    const wrap = document.getElementById('vb-toolbar-more-wrap');
    const btn = document.getElementById('btn-vb-more');
    if (!right || !wrap || !btn) return;

    btn.addEventListener('click', (event) => {
        event.stopPropagation();
        wrap.classList.toggle('open');
    });

    document.addEventListener('click', (event) => {
        if (!wrap.contains(event.target)) wrap.classList.remove('open');
    });

    if (!vbToolbarMoreObserver) {
        vbToolbarMoreObserver = new MutationObserver(() => syncVBToolbarMore());
        vbToolbarMoreObserver.observe(right, { childList: true });
    }

    window.addEventListener('resize', syncVBToolbarMore);
    document.addEventListener('lang:changed', syncVBToolbarMore);
    setTimeout(syncVBToolbarMore, 100);
}
initVBToolbarMore();

const MC_TOOLS_HUB_ITEMS = [
    { id: 'visual-builder', category: 'builder', icon: '🧩', titleKey: 'ui.mctools.visualBuilder', title: 'Visual Builder', desc: 'Build plugin/mod flow graphs visually.' },
    { id: 'gui-builder', category: 'builder', icon: '🗃️', titleKey: 'ui.mctools.guiBuilder', title: 'Chest GUI Builder', desc: 'Design GUI inventories quickly.' },
    { id: 'command-tree', category: 'builder', icon: '⌨️', titleKey: 'ui.mctools.commandTree', title: 'Command Tree Designer', desc: 'Build command hierarchies and arguments.' },
    { id: 'recipe-creator', category: 'builder', icon: '🍳', titleKey: 'ui.mctools.recipeCreator', title: 'Recipe Creator', desc: 'Create custom items and recipes.' },
    { id: 'permission-tree', category: 'builder', icon: '🔑', titleKey: 'ui.mctools.permissionTree', title: 'Permission Tree', desc: 'Generate structured permissions.' },
    { id: 'marketplace', category: 'integrations', icon: '🛍️', titleKey: 'ui.mctools.marketplace', title: 'Blueprint Marketplace', desc: 'Browse and publish templates.' },
    { id: 'server-manager', category: 'server', icon: '🖹', titleKey: 'ui.mctools.testServer', title: 'Test Server', desc: 'Start, stop and test local server.' },
    { id: 'blockbench', category: 'integrations', icon: '🎮', titleKey: 'ui.mctools.blockbench', title: 'Blockbench Editor', desc: 'Open model editor workspace.' },
    { id: 'new-plugin', category: 'builder', icon: '🚀', titleKey: 'ui.mctools.newPlugin', title: 'New Plugin', desc: 'Create a new project scaffold.' },
];

function openMcHubTool(toolId) {
    switch (toolId) {
        case 'new-plugin': showNewProjectModal(); break;
        case 'visual-builder': openFile('visual-builder://tab', getVirtualTabName('visual-builder://tab')); break;
        case 'gui-builder': openFile('gui-builder://tab', getVirtualTabName('gui-builder://tab')); break;
        case 'command-tree': openFile('command-tree://tab', getVirtualTabName('command-tree://tab')); break;
        case 'recipe-creator': openFile('recipe-creator://tab', getVirtualTabName('recipe-creator://tab')); break;
        case 'permission-tree': openFile('permission-tree://tab', getVirtualTabName('permission-tree://tab')); break;
        case 'marketplace': openFile('marketplace://tab', getVirtualTabName('marketplace://tab')); break;
        case 'server-manager': openFile('server-manager://tab', getVirtualTabName('server-manager://tab')); break;
        case 'blockbench': openFile('blockbench://tab', getVirtualTabName('blockbench://tab')); break;
    }
}

function renderMcToolsHub() {
    const grid = document.getElementById('mc-hub-grid');
    const searchEl = document.getElementById('mc-hub-search');
    const categoryEl = document.getElementById('mc-hub-category');
    if (!grid || !searchEl || !categoryEl) return;

    const query = String(searchEl.value || '').trim().toLowerCase();
    const category = String(categoryEl.value || 'all');

    const items = MC_TOOLS_HUB_ITEMS.filter((item) => {
        if (category !== 'all' && item.category !== category) return false;
        if (!query) return true;
        const title = tr(item.titleKey, item.title).toLowerCase();
        return title.includes(query) || String(item.desc || '').toLowerCase().includes(query);
    });

    if (!items.length) {
        grid.innerHTML = `<div class="mc-hub-empty">${tr('ui.mchub.empty', 'No tools match your search.')}</div>`;
        return;
    }

    grid.innerHTML = items.map((item) => `
        <article class="mc-hub-card" data-tool="${item.id}">
            <div class="mc-hub-card-top">
                <div class="mc-hub-card-icon">${item.icon}</div>
                <div class="mc-hub-card-title">${tr(item.titleKey, item.title)}</div>
            </div>
            <div class="mc-hub-card-desc">${item.desc}</div>
            <div class="mc-hub-card-footer">
                <button class="vb-toolbar-btn" data-tool-open="${item.id}">${tr('ui.mchub.open', 'Open')}</button>
            </div>
        </article>
    `).join('');

    grid.querySelectorAll('[data-tool-open]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            openMcHubTool(btn.getAttribute('data-tool-open'));
        });
    });
}

(() => {
    const searchEl = document.getElementById('mc-hub-search');
    const categoryEl = document.getElementById('mc-hub-category');
    if (searchEl && !searchEl.dataset.bound) {
        searchEl.dataset.bound = '1';
        searchEl.addEventListener('input', renderMcToolsHub);
    }
    if (categoryEl && !categoryEl.dataset.bound) {
        categoryEl.dataset.bound = '1';
        categoryEl.addEventListener('change', renderMcToolsHub);
    }
    document.addEventListener('lang:changed', () => {
        renderMcToolsHub();
    });
})();

const SERVER_VERSION_FALLBACK = {
    paper: ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.19.4', '1.18.2'],
    spigot: ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.19.4'],
    fabric: ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.19.4'],
    forge: ['1.21.1', '1.20.1', '1.19.2', '1.18.2'],
    vanilla: ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.19.4'],
};
const serverVersionPayloadByType = {};

function normalizeServerType(raw) {
    const type = String(raw || '').toLowerCase();
    if (type === 'paper' || type === 'spigot' || type === 'fabric' || type === 'forge' || type === 'vanilla') return type;
    return 'paper';
}

function serverTypeFromPlatform(platform) {
    const p = String(platform || '').toLowerCase();
    if (p === 'fabric') return 'fabric';
    if (p === 'forge') return 'forge';
    if (p === 'spigot') return 'spigot';
    if (p === 'vanilla') return 'vanilla';
    return 'paper';
}

function getServerTypeLabel(type) {
    const normalizedType = normalizeServerType(type);
    const map = {
        paper: 'ui.server.type.paper',
        spigot: 'ui.server.type.spigot',
        fabric: 'ui.server.type.fabric',
        forge: 'ui.server.type.forge',
        vanilla: 'ui.server.type.vanilla',
    };
    const fallbackMap = {
        paper: 'Paper (Plugin)',
        spigot: 'Spigot (Plugin)',
        fabric: 'Fabric (Mod)',
        forge: 'Forge (Mod)',
        vanilla: 'Vanilla',
    };
    return tr(map[normalizedType], fallbackMap[normalizedType] || normalizedType);
}

function renderVersionSelect(selectEl, versions, selectedValue) {
    const items = Array.isArray(versions) ? versions.filter(Boolean) : [];
    if (!selectEl) return;
    if (!items.length) {
        selectEl.innerHTML = `<option value="1.21.4">1.21.4 (${tr('ui.common.latestOffline', 'Latest - Offline')})</option>`;
        return;
    }
    const preferred = selectedValue && items.includes(selectedValue) ? selectedValue : items[0];
    selectEl.innerHTML = items.map((v, i) => {
        const isSelected = v === preferred || (!selectedValue && i === 0);
        const suffix = i === 0 ? ` (${tr('ui.common.latest', 'Latest')})` : '';
        return `<option value="${v}"${isSelected ? ' selected' : ''}>${v}${suffix}</option>`;
    }).join('');
}

async function refreshServerVersions(type, targetSelect, preferredVersion = '') {
    const normalizedType = normalizeServerType(type);
    const fallback = SERVER_VERSION_FALLBACK[normalizedType] || SERVER_VERSION_FALLBACK.paper;
    let payload = null;
    try {
        payload = await ipcRenderer.invoke('server:list-versions', normalizedType);
    } catch (error) {
        console.warn('server:list-versions failed:', error);
    }

    if (!payload || !Array.isArray(payload.versions) || !payload.versions.length) {
        payload = {
            serverType: normalizedType,
            versions: fallback,
            defaultVersion: fallback[0],
            source: 'fallback',
            fetchedAt: new Date().toISOString(),
        };
    }

    serverVersionPayloadByType[normalizedType] = payload;
    renderVersionSelect(targetSelect, payload.versions, preferredVersion || payload.defaultVersion);
    return payload;
}

async function initializeVersionSelectors() {
    const smType = document.getElementById('sm-type-select');
    const smVersion = document.getElementById('sm-version-select');
    const projectVersion = document.getElementById('input-mc-version');
    const activePlatform = document.querySelector('.platform-card.active');
    const platformType = serverTypeFromPlatform(activePlatform?.dataset?.platform || 'paper');

    if (smType && smVersion) {
        await refreshServerVersions(smType.value || 'paper', smVersion, smVersion.value || '');
    }
    if (projectVersion) {
        await refreshServerVersions(platformType, projectVersion, projectVersion.value || '');
    }
}

setTimeout(() => {
    initializeVersionSelectors();
}, 500);

// ═══════════════════════════════════════════════════════════
// Uygulama Kapanma Koruması — Kaydedilmemiş Değişiklik Kontrolü
// ═══════════════════════════════════════════════════════════
ipcRenderer.on('request-close', async () => {
    const dirtyFiles = [...openFiles.entries()]
        .filter(([filePath, record]) => Boolean(record?.modified) && isTextBackedTab(filePath, record))
        .map(([filePath]) => getTabBaseName(filePath));

    if (dirtyFiles.length > 0) {
        const preview = dirtyFiles.slice(0, 3).join(', ');
        const suffix = dirtyFiles.length > 3 ? ` (+${dirtyFiles.length - 3})` : '';
        const result = await ipcRenderer.invoke('dialog:showMessage', {
            type: 'question',
            title: tr('dialog.unsaved.title', 'Unsaved Changes'),
            message: tr('dialog.unsaved.exitMessage', 'There are unsaved text files before exit.'),
            detail: preview + suffix,
            buttons: [tr('dialog.unsaved.dontSave', "Don't Save"), tr('dialog.unsaved.cancel', 'Cancel')],
            defaultId: 1,
            cancelId: 1,
        });
        if (result.response === 1) return;
    }
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
                // Monaco ile g??ster
                container.style.display = 'none';
                document.getElementById('editor-container').style.display = 'block';
                showMonacoFile(_configEditorCurrentPath, 'yaml', content);
                rawBtn.textContent = tr('ui.config.formView', 'Form View');
            } else {
                document.getElementById('editor-container').style.display = 'none';
                container.style.display = 'flex';
                rawBtn.textContent = tr('ui.config.rawYaml', 'Raw YAML');
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
            showTrNotification('msg.configSaved', 'Config saved!', 'success');
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

section(tr('ui.config.section.basic', 'Basic Information'));
    for (const [k, inputType] of Object.entries(known)) {
        _addFormField(body, k, parsed[k] || '', inputType);
    }

    // commands
    section(tr('ui.config.section.commands', 'Commands'));
    const cmdArea = document.createElement('div');
    cmdArea.id = 'cfg-commands-area';
    cmdArea.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const cmdList = (typeof parsed.commands === 'object' && parsed.commands) ? Object.entries(parsed.commands) : [];
    const addCmdRow = (name, desc) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:6px;align-items:center;';
        const ni = document.createElement('input'); ni.placeholder = tr('ui.config.placeholder.commandName', 'command name'); ni.value = name || ''; ni.className = 'cfg-cmd-name'; ni.style.cssText = 'flex:0 0 120px;padding:4px 6px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-primary);border-radius:4px;font-size:12px;';
        const di = document.createElement('input'); di.placeholder = tr('ui.config.placeholder.commandDescription', 'description'); di.value = (typeof desc === 'object' ? desc.description : desc) || ''; di.className = 'cfg-cmd-desc'; di.style.cssText = 'flex:1;padding:4px 6px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-primary);border-radius:4px;font-size:12px;';
        const rm = document.createElement('button'); rm.textContent = 'x'; rm.style.cssText = 'background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;'; rm.onclick = () => row.remove();
        row.append(ni, di, rm);
        cmdArea.appendChild(row);
    };
    cmdList.forEach(([n, d]) => addCmdRow(n, d));
    const addCmdBtn = document.createElement('button');
    addCmdBtn.textContent = tr('ui.command.addCommand', '+ Add Command');
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
            resetBtn.title = tr('ui.config.resetDefault', 'Reset to default');
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
            showTrNotification('msg.oneClickFixUnavailable', 'One-click fix is not available.', 'warn');
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



