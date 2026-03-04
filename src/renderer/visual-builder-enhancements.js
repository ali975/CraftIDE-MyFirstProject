(() => {
    const { ipcRenderer } = require('electron');

    const PANEL_LEFT = 280;
    const PANEL_RIGHT = 340;
    const HISTORY_MAX = 80;
    const HISTORY = { stack: [], index: -1, sig: '', lock: false };

    const FRIENDLY = {
        PlayerJoin: { tr: 'Oyuncu sunucuya girdiginde', en: 'When a player joins', tags: ['join', 'giris', 'oyuncu'] },
        PlayerQuit: { tr: 'Oyuncu sunucudan ciktiginda', en: 'When a player leaves', tags: ['quit', 'cikis', 'oyuncu'] },
        PlayerCommand: { tr: 'Komut kullanildiginda', en: 'When a command is used', tags: ['komut', 'command', '/'] },
        SendMessage: { tr: 'Oyuncuya mesaj gonder', en: 'Send message to player', tags: ['mesaj', 'message', 'chat'] },
        GiveItem: { tr: 'Oyuncuya esya ver', en: 'Give item to player', tags: ['esya', 'item', 'odul'] },
        Teleport: { tr: 'Oyuncuyu isinla', en: 'Teleport player', tags: ['isinla', 'teleport', 'spawn'] },
        PlaySound: { tr: 'Ses cal', en: 'Play sound', tags: ['ses', 'sound'] },
        HasPermission: { tr: 'Izin kontrolu', en: 'Check permission', tags: ['izin', 'permission'] },
        SetHealth: { tr: 'Can degerini ayarla', en: 'Set health', tags: ['can', 'health'] },
        CancelEvent: { tr: 'Olayi iptal et', en: 'Cancel event', tags: ['iptal', 'cancel'] },
        CommandEquals: { tr: 'Komut eslesiyorsa', en: 'If command equals', tags: ['komut', 'esit'] },
        RunCommand: { tr: 'Sunucu komutu calistir', en: 'Run server command', tags: ['komut', 'console'] },
        Delay: { tr: 'Gecikme ekle', en: 'Add delay', tags: ['delay', 'bekle', 'tick'] },
        RepeatTask: { tr: 'Tekrarlayan gorev', en: 'Repeat task', tags: ['repeat', 'schedule', 'tekrar'] },
    };

    const ACTION_TEXT = {
        SendMessage: { tr: 'Oyuncuya mesaj gonderilir.', en: 'A message is sent to player.' },
        Broadcast: { tr: 'Sunucuya duyuru yapilir.', en: 'A broadcast message is sent.' },
        GiveItem: { tr: 'Oyuncuya esya verilir.', en: 'Player receives an item.' },
        Teleport: { tr: 'Oyuncu hedef konuma isinlanir.', en: 'Player is teleported to target location.' },
        PlaySound: { tr: 'Ses efekti calinir.', en: 'A sound effect is played.' },
        CancelEvent: { tr: 'Olay iptal edilir.', en: 'The event is canceled.' },
        RunCommand: { tr: 'Konsoldan komut calisir.', en: 'A console command runs.' },
    };

    const WIZ = {
        plugin: {
            triggers: { join: 'PlayerJoin', command: 'PlayerCommand', death: 'PlayerDeath', break: 'BlockBreak' },
            actions: { message: ['SendMessage', { mesaj: '&aMerhaba!' }], give: ['GiveItem', { material: 'DIAMOND', adet: '1' }], tp: ['Teleport', { x: '0', y: '80', z: '0' }], sound: ['PlaySound', { ses: 'ENTITY_EXPERIENCE_ORB_PICKUP' }] },
            cmdFilter: 'CommandEquals',
        },
        fabric: {
            triggers: { join: 'FabricPlayerJoin', command: 'FabricPlayerJoin', death: 'FabricPlayerJoin', break: 'FabricBlockBreak' },
            actions: { message: ['FabricSendMsg', { mesaj: 'Merhaba!' }], give: ['FabricGiveItem', { item: 'minecraft:diamond', adet: '1' }], tp: ['FabricTeleport', { x: '0', y: '80', z: '0' }], sound: ['FabricPlaySound', { ses: 'minecraft:entity.experience_orb.pickup' }] },
        },
        forge: {
            triggers: { join: 'ForgePlayerLogin', command: 'ForgePlayerLogin', death: 'ForgeLivingDamage', break: 'ForgeBreak' },
            actions: { message: ['ForgeSendMsg', { mesaj: 'Merhaba!' }], give: ['ForgeSendMsg', { mesaj: 'Odul verildi.' }], tp: ['ForgeTeleport', { x: '0', y: '80', z: '0' }], sound: ['ForgeSendMsg', { mesaj: 'Ses calindi.' }] },
        },
        skript: {
            triggers: { join: 'SkJoin', command: 'SkCommand', death: 'SkDeath', break: 'SkBreak' },
            actions: { message: ['SkSendMsg', { mesaj: '&aMerhaba!' }], give: ['SkGiveItem', { item: 'diamond', adet: '1' }], tp: ['SkTeleport', { x: '0', y: '80', z: '0' }], sound: ['SkPlaySound', { ses: 'entity.experience_orb.pickup' }] },
        },
    };

    const D = { left: null, right: null, search: null, cards: null, preview: null, wizard: null };

    const esc = (s) => {
        const d = document.createElement('div');
        d.textContent = String(s || '');
        return d.innerHTML;
    };
    const lang = () => (window.Lang && window.Lang.currentLang === 'tr' ? 'tr' : 'en');
    const t = (tr, en) => (lang() === 'tr' ? tr : en);
    const activeVB = () => {
        const c = document.getElementById('visual-builder-container');
        return !!c && c.style.display !== 'none';
    };
    const notify = (m, type = 'info') => (typeof showNotification === 'function' ? showNotification(m, type) : console.log(m));
    const defsByMode = (mode) => (window.CraftIDEVB?.getDefinitions?.()?.[mode] || {});

    function applyFriendlyLabels() {
        const all = window.CraftIDEVB?.getDefinitions?.();
        if (!all) return;
        const isTr = lang() === 'tr';
        Object.values(all).forEach((defs) => {
            Object.entries(defs).forEach(([id, def]) => {
                if (!def._rawLabel) def._rawLabel = def.label;
                if (FRIENDLY[id]) {
                    def.friendlyName = { tr: FRIENDLY[id].tr, en: FRIENDLY[id].en };
                    def.label = isTr ? FRIENDLY[id].tr : FRIENDLY[id].en;
                    def.tags = [...new Set([...(def.tags || []), ...FRIENDLY[id].tags, id.toLowerCase(), String(def._rawLabel).toLowerCase()])];
                } else {
                    def.tags = [...new Set([...(def.tags || []), id.toLowerCase(), String(def._rawLabel || '').toLowerCase()])];
                }
            });
        });
        const modeDefs = defsByMode(window.CraftIDEVB.getMode());
        window.CraftIDEVB.getNodes().forEach((n) => {
            const def = modeDefs[n.blockId];
            if (!def) return;
            n.label = def.label;
            const head = document.querySelector(`#vb-node-${n.id} .vb-node-header > span`);
            if (head) head.textContent = n.label;
        });
        if (typeof rebuildContextMenu === 'function') rebuildContextMenu();
    }

    function injectToolbarButtons() {
        const bar = document.querySelector('#visual-builder-container .vb-toolbar-right');
        if (!bar) return;
        if (!document.getElementById('btn-vb-wizard')) {
            const b = document.createElement('button');
            b.id = 'btn-vb-wizard';
            b.className = 'vb-toolbar-btn';
            b.textContent = t('Sihirbaz', 'Wizard');
            b.addEventListener('click', openWizard);
            bar.prepend(b);
        }
        if (!document.getElementById('btn-vb-undo')) {
            const b = document.createElement('button');
            b.id = 'btn-vb-undo';
            b.className = 'vb-toolbar-btn';
            b.textContent = t('Geri Al', 'Undo');
            b.addEventListener('click', undo);
            bar.prepend(b);
        }
        if (!document.getElementById('btn-vb-redo')) {
            const b = document.createElement('button');
            b.id = 'btn-vb-redo';
            b.className = 'vb-toolbar-btn';
            b.textContent = t('Yinele', 'Redo');
            b.addEventListener('click', redo);
            bar.prepend(b);
        }
    }

    function injectPanels() {
        const area = document.getElementById('visual-builder-canvas-wrapper');
        if (!area) return;
        area.classList.add('vb-enhanced-canvas');
        area.style.paddingLeft = `${PANEL_LEFT}px`;
        area.style.paddingRight = `${PANEL_RIGHT}px`;

        if (!document.getElementById('vb-cards-panel')) {
            const left = document.createElement('aside');
            left.id = 'vb-cards-panel';
            left.className = 'vb-cards-panel';
            left.innerHTML = `
                <div class="vb-panel-header">
                    <div class="vb-panel-title">${esc(t('Davranis Kartlari', 'Behavior Cards'))}</div>
                    <div class="vb-panel-sub">${esc(t('Surukle-birak ile ekle', 'Drag and drop to add'))}</div>
                </div>
                <input id="vb-card-search" class="vb-panel-search" type="text" placeholder="${esc(t('Ara: mesaj, komut, teleport', 'Search: message, command, teleport'))}" />
                <div id="vb-cards-body" class="vb-cards-body"></div>
            `;
            left.addEventListener('contextmenu', (e) => e.stopPropagation());
            left.addEventListener('mousedown', (e) => e.stopPropagation());
            area.appendChild(left);
        }

        if (!document.getElementById('vb-preview-panel')) {
            const right = document.createElement('aside');
            right.id = 'vb-preview-panel';
            right.className = 'vb-preview-panel';
            right.innerHTML = `
                <div class="vb-panel-header">
                    <div class="vb-panel-title">${esc(t('Canli Onizleme', 'Live Preview'))}</div>
                    <div class="vb-panel-sub">${esc(t('Bu plugin sunu yapacak:', 'This plugin will do:'))}</div>
                </div>
                <div id="vb-preview-body" class="vb-preview-body"></div>
            `;
            right.addEventListener('contextmenu', (e) => e.stopPropagation());
            right.addEventListener('mousedown', (e) => e.stopPropagation());
            area.appendChild(right);
        }

        D.left = document.getElementById('vb-cards-panel');
        D.right = document.getElementById('vb-preview-panel');
        D.search = document.getElementById('vb-card-search');
        D.cards = document.getElementById('vb-cards-body');
        D.preview = document.getElementById('vb-preview-body');
        if (D.search && !D.search.dataset.bound) {
            D.search.dataset.bound = '1';
            D.search.addEventListener('input', renderCards);
        }
    }

    function matches(def, id, query) {
        if (!query) return true;
        const q = query.toLowerCase();
        const values = [id, def._rawLabel || '', def.label || '', ...(def.tags || [])];
        return values.some((v) => String(v || '').toLowerCase().includes(q));
    }

    function renderCards() {
        if (!D.cards) return;
        const mode = window.CraftIDEVB.getMode();
        const defs = defsByMode(mode);
        const q = String(D.search?.value || '').trim();
        const groups = { event: [], action: [], condition: [], control: [] };

        Object.entries(defs).forEach(([id, def]) => {
            if (!groups[def.type]) return;
            if (!matches(def, id, q)) return;
            groups[def.type].push({ id, def });
        });

        const titles = { event: t('Tetikleyiciler', 'Triggers'), action: t('Aksiyonlar', 'Actions'), condition: t('Kosullar', 'Conditions'), control: t('Dongu ve Zaman', 'Flow & Timing') };
        const html = [];
        ['event', 'action', 'condition', 'control'].forEach((k) => {
            if (!groups[k].length) return;
            html.push(`<div class="vb-card-group"><div class="vb-card-group-title ${k}">${esc(titles[k])}</div>`);
            groups[k].forEach(({ id, def }) => {
                html.push(`<div class="vb-behavior-card ${k}" draggable="true" data-block-id="${esc(id)}">
                    <div class="vb-card-title">${esc(def.label || id)}</div>
                    <div class="vb-card-id">${esc(id)}</div>
                </div>`);
            });
            html.push('</div>');
        });
        if (!html.length) html.push(`<div class="vb-empty-search">${esc(t('Sonuc yok.', 'No results.'))}</div>`);
        D.cards.innerHTML = html.join('');

        D.cards.querySelectorAll('.vb-behavior-card').forEach((card) => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/block-id', card.dataset.blockId);
                e.dataTransfer.effectAllowed = 'copy';
            });
            card.addEventListener('click', () => {
                const area = document.getElementById('visual-builder-canvas-wrapper');
                const rect = area.getBoundingClientRect();
                window.CraftIDEVB.createNode(card.dataset.blockId, Math.max(24, Math.floor(rect.width * 0.45) - PANEL_LEFT), 80 + Math.floor(Math.random() * 180));
            });
        });
    }

    function eventText(node) {
        if (node.blockId === 'PlayerJoin') return t('Bir oyuncu sunucuya girdiginde', 'When a player joins');
        if (node.blockId === 'PlayerQuit') return t('Bir oyuncu sunucudan ciktiginda', 'When a player leaves');
        if (node.blockId === 'PlayerCommand' || node.blockId === 'SkCommand') return t('Oyuncu komut kullandiginda', 'When a command is used');
        if (node.blockId === 'BlockBreak' || node.blockId === 'SkBreak') return t('Bir blok kirildiginda', 'When a block is broken');
        if (node.blockId === 'PlayerDeath' || node.blockId === 'SkDeath') return t('Bir oyuncu oldugunde', 'When a player dies');
        return t('Bir olay tetiklenince', 'When an event triggers');
    }

    function actionText(node) {
        const entry = ACTION_TEXT[node.blockId];
        if (entry) return entry[lang()];
        return t(`${node.label || node.blockId} adimi calisir.`, `${node.label || node.blockId} step runs.`);
    }

    function renderPreview() {
        if (!D.preview) return;
        const g = window.CraftIDEVB.exportGraph();
        const defs = defsByMode(g.mode);
        if (!g.nodes.length) {
            D.preview.innerHTML = `<div class="vb-preview-empty">${esc(t('Canvas bos.', 'Canvas is empty.'))}</div>`;
            return;
        }

        const byId = new Map(g.nodes.map((n) => [n.id, n]));
        const next = new Map();
        g.connections.forEach((c) => {
            if (!next.has(c.from)) next.set(c.from, []);
            next.get(c.from).push(c.to);
        });
        const events = g.nodes.filter((n) => (defs[n.blockId]?.type || n.type) === 'event').sort((a, b) => (a.y - b.y) || (a.x - b.x));
        if (!events.length) {
            D.preview.innerHTML = `<div class="vb-preview-empty">${esc(t('En az bir tetikleyici ekleyin.', 'Add at least one trigger.'))}</div>`;
            return;
        }

        const collect = (id, seen = new Set()) => {
            if (seen.has(id)) return [];
            seen.add(id);
            const list = next.get(id) || [];
            const out = [];
            list.forEach((cid) => {
                out.push(cid);
                collect(cid, seen).forEach((x) => out.push(x));
            });
            return out;
        };

        const html = [];
        events.forEach((ev, i) => {
            const steps = [...new Set(collect(ev.id).map((id) => byId.get(id)).filter(Boolean).map((n) => actionText(n)))];
            html.push(`<div class="vb-preview-section"><div class="vb-preview-title">${i + 1}. ${esc(eventText(ev))}</div><ul class="vb-preview-actions">`);
            if (!steps.length) html.push(`<li>${esc(t('Bagli aksiyon yok.', 'No connected action.'))}</li>`);
            steps.forEach((s) => html.push(`<li>${esc(s)}</li>`));
            html.push('</ul></div>');
        });
        D.preview.innerHTML = html.join('');
    }

    function signature(g) {
        return JSON.stringify({
            mode: g.mode,
            nodes: g.nodes.map((n) => ({ id: n.id, blockId: n.blockId, x: Math.round(n.x), y: Math.round(n.y), params: n.params || {} })),
            conns: g.connections.map((c) => `${c.from}->${c.to}`).sort(),
        });
    }

    function pushHistory(g, force = false) {
        const sig = signature(g);
        if (!force && sig === HISTORY.sig) return;
        HISTORY.sig = sig;
        if (HISTORY.index < HISTORY.stack.length - 1) HISTORY.stack = HISTORY.stack.slice(0, HISTORY.index + 1);
        HISTORY.stack.push(JSON.parse(JSON.stringify(g)));
        if (HISTORY.stack.length > HISTORY_MAX) HISTORY.stack.shift();
        HISTORY.index = HISTORY.stack.length - 1;
        updateHistoryButtons();
    }

    function applyHistory(index) {
        if (index < 0 || index >= HISTORY.stack.length) return;
        HISTORY.lock = true;
        try {
            HISTORY.index = index;
            window.CraftIDEVB.importGraph(HISTORY.stack[HISTORY.index], { clear: true });
            renderCards();
            renderPreview();
        } finally {
            HISTORY.lock = false;
            updateHistoryButtons();
        }
    }

    function undo() { applyHistory(HISTORY.index - 1); }
    function redo() { applyHistory(HISTORY.index + 1); }
    function updateHistoryButtons() {
        const u = document.getElementById('btn-vb-undo');
        const r = document.getElementById('btn-vb-redo');
        if (u) u.disabled = HISTORY.index <= 0;
        if (r) r.disabled = HISTORY.index >= HISTORY.stack.length - 1;
    }

    function createWizard() {
        if (document.getElementById('vb-wizard-modal')) {
            D.wizard = document.getElementById('vb-wizard-modal');
            return;
        }
        const modal = document.createElement('div');
        modal.id = 'vb-wizard-modal';
        modal.className = 'vb-wizard-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="vb-wizard-card">
                <div class="vb-wizard-header">
                    <h2>${esc(t('Plugin Sihirbazi', 'Plugin Wizard'))}</h2>
                    <button id="vb-wz-close" class="vb-wizard-close">&times;</button>
                </div>
                <div class="vb-wizard-step">
                    <label>${esc(t('Mod', 'Mode'))}
                        <select id="vb-wz-mode">
                            <option value="plugin">Plugin</option><option value="fabric">Fabric</option><option value="forge">Forge</option><option value="skript">Skript</option>
                        </select>
                    </label>
                </div>
                <div class="vb-wizard-step">
                    <div class="vb-wizard-grid">
                        <label><input type="checkbox" value="join" checked /> ${esc(t('Oyuncu girisi', 'Player join'))}</label>
                        <label><input type="checkbox" value="command" /> ${esc(t('Komut', 'Command'))}</label>
                        <label><input type="checkbox" value="death" /> ${esc(t('Oyuncu olumu', 'Player death'))}</label>
                        <label><input type="checkbox" value="break" /> ${esc(t('Blok kirma', 'Block break'))}</label>
                    </div>
                    <label>${esc(t('Komut', 'Command'))}<input id="vb-wz-command" type="text" value="/spawn" /></label>
                </div>
                <div class="vb-wizard-step">
                    <div class="vb-wizard-grid">
                        <label><input type="checkbox" value="message" checked /> ${esc(t('Mesaj gonder', 'Send message'))}</label>
                        <label><input type="checkbox" value="give" /> ${esc(t('Esya ver', 'Give item'))}</label>
                        <label><input type="checkbox" value="tp" /> ${esc(t('Isinla', 'Teleport'))}</label>
                        <label><input type="checkbox" value="sound" /> ${esc(t('Ses cal', 'Play sound'))}</label>
                    </div>
                </div>
                <div class="vb-wizard-footer">
                    <button id="vb-wz-cancel" class="vb-toolbar-btn danger">${esc(t('Iptal', 'Cancel'))}</button>
                    <button id="vb-wz-build" class="vb-toolbar-btn">${esc(t('Grafik Olustur', 'Build Graph'))}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        D.wizard = modal;
        modal.querySelector('#vb-wz-close').addEventListener('click', closeWizard);
        modal.querySelector('#vb-wz-cancel').addEventListener('click', closeWizard);
        modal.querySelector('#vb-wz-build').addEventListener('click', buildWizardGraph);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeWizard(); });
    }

    function openWizard() {
        createWizard();
        const sel = D.wizard.querySelector('#vb-wz-mode');
        if (sel) sel.value = window.CraftIDEVB.getMode();
        D.wizard.style.display = 'flex';
    }

    function closeWizard() {
        if (D.wizard) D.wizard.style.display = 'none';
    }

    async function buildWizardGraph() {
        const mode = D.wizard.querySelector('#vb-wz-mode').value;
        const cfg = WIZ[mode] || WIZ.plugin;
        const triggers = [...D.wizard.querySelectorAll('.vb-wizard-step:nth-child(3) input[type="checkbox"]:checked')].map((e) => e.value);
        const actions = [...D.wizard.querySelectorAll('.vb-wizard-step:nth-child(4) input[type="checkbox"]:checked')].map((e) => e.value);
        const cmd = String(D.wizard.querySelector('#vb-wz-command').value || '/spawn').trim();
        if (!triggers.length) return notify(t('En az bir tetikleyici secin.', 'Select at least one trigger.'), 'error');
        if (!actions.length) return notify(t('En az bir aksiyon secin.', 'Select at least one action.'), 'error');

        const graph = { version: '2', mode, nodes: [], connections: [] };
        let id = 1;
        triggers.forEach((tk, row) => {
            const triggerBlock = cfg.triggers[tk];
            if (!triggerBlock) return;
            const eid = id++;
            const eNode = { id: eid, blockId: triggerBlock, x: 80, y: 80 + row * 220, params: {} };
            if (tk === 'command') {
                const c = cmd.startsWith('/') ? cmd : `/${cmd}`;
                if (mode === 'plugin') eNode.params.command = c;
                if (mode === 'skript') eNode.params.komut = c;
            }
            graph.nodes.push(eNode);

            let from = eid;
            if (tk === 'command' && mode === 'plugin' && cfg.cmdFilter) {
                const cid = id++;
                graph.nodes.push({ id: cid, blockId: cfg.cmdFilter, x: 320, y: 80 + row * 220, params: { cmd: eNode.params.command || '/spawn' } });
                graph.connections.push({ from: eid, to: cid });
                from = cid;
            }
            actions.forEach((ak, col) => {
                const act = cfg.actions[ak];
                if (!act) return;
                const aid = id++;
                graph.nodes.push({ id: aid, blockId: act[0], x: 560 + Math.floor(col / 2) * 220, y: 40 + row * 220 + (col % 2) * 90, params: { ...(act[1] || {}) } });
                graph.connections.push({ from, to: aid });
            });
        });

        // Try existing NL endpoint for better structure; fallback to local graph.
        try {
            const hint = [triggers.includes('join') ? 'oyuncu girisinde' : '', triggers.includes('command') ? `${cmd} komutunda` : '', actions.includes('message') ? 'mesaj gonder' : '', actions.includes('tp') ? 'isinla' : ''].filter(Boolean).join(', ');
            if (hint) {
                const remote = await ipcRenderer.invoke('vb:nl2graph', { text: hint, platform: mode, strictMode: false });
                if (remote && Array.isArray(remote.nodes) && remote.nodes.length) {
                    remote.mode = mode; remote.version = '2';
                    window.CraftIDEVB.importGraph(remote, { clear: true });
                    closeWizard();
                    return notify(t('Sihirbaz akisi olusturuldu.', 'Wizard flow generated.'), 'success');
                }
            }
        } catch {
            // local graph fallback
        }

        window.CraftIDEVB.importGraph(graph, { clear: true });
        closeWizard();
        notify(t('Sihirbaz akisi olusturuldu.', 'Wizard flow generated.'), 'success');
    }

    function bindModeAndLang() {
        const modeSel = document.getElementById('vb-mode-select');
        if (modeSel && !modeSel.dataset.vbEnhBound) {
            modeSel.dataset.vbEnhBound = '1';
            modeSel.addEventListener('change', () => { applyFriendlyLabels(); renderCards(); renderPreview(); pushHistory(window.CraftIDEVB.exportGraph(), true); });
        }
        document.addEventListener('lang:changed', () => { applyFriendlyLabels(); renderCards(); renderPreview(); injectToolbarButtons(); });
    }

    function bindShortcuts() {
        if (document.body.dataset.vbEnhKeybound) return;
        document.body.dataset.vbEnhKeybound = '1';
        document.addEventListener('keydown', (e) => {
            if (!activeVB()) return;
            const tag = (e.target?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
            if (!(e.ctrlKey || e.metaKey)) return;
            if (e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
            if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
        });
    }

    function exposeApi() {
        window.CraftIDEVB.generatePreview = () => { renderPreview(); return D.preview?.textContent || ''; };
        window.CraftIDEVB.searchBlocks = (query, mode) => {
            const defs = defsByMode(mode || window.CraftIDEVB.getMode());
            return Object.entries(defs).filter(([id, def]) => matches(def, id, query || '')).map(([id]) => id);
        };
        window.CraftIDEVB.applyFriendlyLabels = () => { applyFriendlyLabels(); renderCards(); renderPreview(); return true; };
        window.CraftIDEVB.history = { undo, redo };
    }

    function init() {
        if (!window.CraftIDEVB) return setTimeout(init, 100);
        applyFriendlyLabels();
        injectToolbarButtons();
        injectPanels();
        renderCards();
        renderPreview();
        createWizard();
        pushHistory(window.CraftIDEVB.exportGraph(), true);
        bindModeAndLang();
        bindShortcuts();
        exposeApi();

        setInterval(() => {
            if (!window.CraftIDEVB || !activeVB()) return;
            if (!HISTORY.lock) pushHistory(window.CraftIDEVB.exportGraph());
            renderPreview();
        }, 350);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
