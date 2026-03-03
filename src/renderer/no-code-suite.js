/**
 * CraftIDE No-Code Suite
 * Adds no-database no-code helpers on top of Visual Builder.
 */
(() => {
    const { ipcRenderer } = require('electron');
    const nodePath = require('path');

    const MODE_ALIAS = { paper: 'plugin', spigot: 'plugin', bukkit: 'plugin', plugin: 'plugin', fabric: 'fabric', forge: 'forge', skript: 'skript' };
    const STATE = { intentGraph: null, validationSig: '', buildRunning: false, cancelBuild: false, attempt: 0 };

    const PACKS = {
        plugin: [
            {
                id: 'join_reward',
                name: 'Join Reward',
                desc: 'PlayerJoin -> GiveItem -> SendMessage',
                graph: {
                    nodes: [
                        { id: 1, blockId: 'PlayerJoin', x: 90, y: 120, params: {} },
                        { id: 2, blockId: 'GiveItem', x: 330, y: 80, params: { material: 'DIAMOND', adet: '3' } },
                        { id: 3, blockId: 'SendMessage', x: 330, y: 200, params: { mesaj: '&aWelcome! You got 3 diamonds.' } },
                    ],
                    connections: [{ from: 1, to: 2 }, { from: 1, to: 3 }],
                },
            },
            {
                id: 'spawn_cmd',
                name: 'Spawn Command',
                desc: 'PlayerCommand -> CommandEquals -> Teleport + SendMessage',
                graph: {
                    nodes: [
                        { id: 1, blockId: 'PlayerCommand', x: 90, y: 120, params: { command: '/spawn' } },
                        { id: 2, blockId: 'CommandEquals', x: 330, y: 80, params: { cmd: '/spawn' } },
                        { id: 3, blockId: 'Teleport', x: 570, y: 80, params: { x: '0', y: '80', z: '0' } },
                        { id: 4, blockId: 'SendMessage', x: 570, y: 200, params: { mesaj: '&aTeleported to spawn.' } },
                    ],
                    connections: [{ from: 1, to: 2 }, { from: 2, to: 3 }, { from: 2, to: 4 }],
                },
            },
        ],
        fabric: [
            {
                id: 'fabric_join',
                name: 'Fabric Join Message',
                desc: 'FabricPlayerJoin -> FabricSendMsg',
                graph: {
                    nodes: [
                        { id: 1, blockId: 'FabricPlayerJoin', x: 100, y: 120, params: {} },
                        { id: 2, blockId: 'FabricSendMsg', x: 340, y: 120, params: { mesaj: 'Welcome!' } },
                    ],
                    connections: [{ from: 1, to: 2 }],
                },
            },
        ],
        forge: [
            {
                id: 'forge_join',
                name: 'Forge Join Message',
                desc: 'ForgePlayerLogin -> ForgeSendMsg',
                graph: {
                    nodes: [
                        { id: 1, blockId: 'ForgePlayerLogin', x: 100, y: 120, params: {} },
                        { id: 2, blockId: 'ForgeSendMsg', x: 340, y: 120, params: { mesaj: 'Welcome from Forge!' } },
                    ],
                    connections: [{ from: 1, to: 2 }],
                },
            },
        ],
        skript: [
            {
                id: 'skript_join',
                name: 'Skript Join Message',
                desc: 'SkJoin -> SkSendMsg + SkBroadcast',
                graph: {
                    nodes: [
                        { id: 1, blockId: 'SkJoin', x: 100, y: 120, params: {} },
                        { id: 2, blockId: 'SkSendMsg', x: 340, y: 80, params: { mesaj: '&aWelcome %player%!' } },
                        { id: 3, blockId: 'SkBroadcast', x: 340, y: 200, params: { mesaj: '&e%player% joined.' } },
                    ],
                    connections: [{ from: 1, to: 2 }, { from: 1, to: 3 }],
                },
            },
        ],
    };

    function normalizeMode(raw) { return MODE_ALIAS[String(raw || '').toLowerCase()] || 'plugin'; }
    function getMode() { return normalizeMode(window.CraftIDEVB?.getMode?.() || 'plugin'); }
    function notify(msg, type = 'info') { window.CraftIDEAppState?.showNotification ? window.CraftIDEAppState.showNotification(msg, type) : console.log(msg); }
    function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
    function esc(s) { const d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }

    function currentGraph() {
        return window.CraftIDEVB?.exportGraph?.() || { version: '2', mode: getMode(), nodes: [], connections: [] };
    }

    function applyGraph(graph) {
        if (!window.CraftIDEVB?.importGraph) { notify('Visual Builder API unavailable.', 'error'); return; }
        const normalized = graph && typeof graph === 'object' ? JSON.parse(JSON.stringify(graph)) : {};
        normalized.version = normalized.version || '2';
        normalized.mode = normalizeMode(normalized.mode || getMode());
        normalized.nodes = Array.isArray(normalized.nodes) ? normalized.nodes : [];
        normalized.connections = Array.isArray(normalized.connections) ? normalized.connections : [];
        window.CraftIDEVB.importGraph(normalized, { clear: true });
    }

    function pickPackByPrompt(prompt, mode) {
        const t = String(prompt || '').toLowerCase();
        if (mode === 'plugin') {
            if (t.includes('spawn') || t.includes('/spawn') || t.includes('warp')) return PACKS.plugin.find((p) => p.id === 'spawn_cmd');
            return PACKS.plugin.find((p) => p.id === 'join_reward');
        }
        return (PACKS[mode] || [])[0] || null;
    }

    function localGraphFromPrompt(prompt, mode) {
        const pack = pickPackByPrompt(prompt, mode);
        if (pack) {
            const graph = JSON.parse(JSON.stringify(pack.graph));
            graph.version = '2';
            graph.mode = mode;
            return graph;
        }
        return {
            version: '2',
            mode,
            nodes: [
                { id: 1, blockId: mode === 'plugin' ? 'PlayerJoin' : mode === 'fabric' ? 'FabricPlayerJoin' : mode === 'forge' ? 'ForgePlayerLogin' : 'SkJoin', x: 100, y: 120, params: {} },
                { id: 2, blockId: mode === 'plugin' ? 'SendMessage' : mode === 'fabric' ? 'FabricSendMsg' : mode === 'forge' ? 'ForgeSendMsg' : 'SkSendMsg', x: 340, y: 120, params: { mesaj: 'Done.' } },
            ],
            connections: [{ from: 1, to: 2 }],
        };
    }

    function validationSignature(graph) {
        return `${graph.mode}:${(graph.nodes || []).length}:${(graph.connections || []).length}`;
    }

    function localValidate(graph) {
        const errors = [];
        const warnings = [];
        const nodes = graph.nodes || [];
        const edges = graph.connections || [];
        const byId = new Set(nodes.map((n) => n.id));

        if (!nodes.length) errors.push({ message: 'No blocks on canvas.' });
        if (!nodes.some((n) => /^(Player|Block|Entity|Inventory|Server|GUI|Fabric|Forge|Sk)/.test(String(n.blockId || '')))) errors.push({ message: 'Add at least one event block.' });

        for (const e of edges) {
            if (!byId.has(e.from) || !byId.has(e.to)) errors.push({ message: `Broken connection ${e.from} -> ${e.to}` });
            if (e.from === e.to) errors.push({ message: `Self connection on node ${e.from}` });
        }
        for (const n of nodes) {
            if (n.blockId === 'PlayerCommand' && !String(n.params?.command || '').startsWith('/')) warnings.push({ message: 'PlayerCommand should start with /' });
            if (n.blockId === 'SkCommand' && !String(n.params?.komut || '').startsWith('/')) warnings.push({ message: 'SkCommand should start with /' });
            if (/Teleport$/.test(String(n.blockId || ''))) {
                const xyz = [Number(n.params?.x), Number(n.params?.y), Number(n.params?.z)];
                if (xyz.some((v) => !Number.isFinite(v))) errors.push({ message: `${n.blockId} requires numeric x/y/z` });
            }
        }
        return { errors, warnings };
    }

    async function validateGraph(force = false) {
        const graph = currentGraph();
        const sig = validationSignature(graph);
        if (!force && sig === STATE.validationSig) return;
        STATE.validationSig = sig;

        let result = null;
        try { result = await ipcRenderer.invoke('validate:graph', { graph, platform: graph.mode, mcVersion: '1.21.4' }); } catch { result = null; }
        if (!result || !Array.isArray(result.errors)) result = localValidate(graph);

        const body = document.getElementById('nc-validator-body');
        if (!body) return result;
        const lines = [`<div class="nc-row"><strong>Validation:</strong> ${result.errors.length} error(s), ${result.warnings.length} warning(s)</div>`];
        for (const e of result.errors.slice(0, 4)) lines.push(`<div class="nc-row err">E: ${esc(e.message)}</div>`);
        for (const w of result.warnings.slice(0, 6)) lines.push(`<div class="nc-row warn">W: ${esc(w.message)}</div>`);
        if (!result.errors.length && !result.warnings.length) lines.push('<div class="nc-row ok">Graph looks good.</div>');
        body.innerHTML = lines.join('');
        return result;
    }

    async function analyzeIntent() {
        const input = document.getElementById('nc-intent-input');
        const modeEl = document.getElementById('nc-intent-mode');
        const out = document.getElementById('nc-intent-plan');
        const text = String(input?.value || '').trim();
        const mode = normalizeMode(modeEl?.value || getMode());
        if (!text) { notify('Write what you want to build first.', 'error'); return; }

        let graph = null;
        try {
            const remote = await ipcRenderer.invoke('vb:nl2graph', { text, platform: mode, strictMode: false });
            if (remote?.nodes?.length) graph = { version: '2', mode, nodes: remote.nodes, connections: remote.connections || [] };
        } catch {}
        if (!graph) graph = localGraphFromPrompt(text, mode);

        STATE.intentGraph = graph;
        if (out) out.innerHTML = `<div class="nc-card"><strong>Generated graph</strong><div class="nc-sub">${graph.nodes.length} node(s), ${graph.connections.length} connection(s)</div></div>`;
    }

    async function applyIntent() { if (!STATE.intentGraph) { notify('Analyze first.', 'error'); return; } applyGraph(STATE.intentGraph); closeModal('nc-intent-modal'); await validateGraph(true); }

    async function resolveMainSource(projectPath, mode) {
        if (mode === 'skript') {
            const entries = await ipcRenderer.invoke('fs:readDir', projectPath);
            const sk = (entries || []).find((e) => !e.isDirectory && e.name.endsWith('.sk'));
            return sk ? sk.path : nodePath.join(projectPath, 'generated.sk');
        }
        const root = nodePath.join(projectPath, 'src', 'main', 'java');
        if (!(await ipcRenderer.invoke('fs:exists', root))) return null;
        async function walk(dir) {
            const items = await ipcRenderer.invoke('fs:readDir', dir);
            for (const it of (items || [])) if (!it.isDirectory && it.name === 'Main.java') return it.path;
            for (const it of (items || [])) if (it.isDirectory) { const f = await walk(it.path); if (f) return f; }
            for (const it of (items || [])) if (!it.isDirectory && it.name.endsWith('.java')) return it.path;
            return null;
        }
        return walk(root);
    }

    function extractCodeBlock(text, mode) {
        const lang = mode === 'skript' ? '(?:sk|skript|txt|plaintext)' : '(?:java|txt|plaintext)';
        const m = String(text || '').match(new RegExp('```' + lang + '?\\s*([\\s\\S]*?)```', 'i'));
        return m?.[1]?.trim() || null;
    }

    async function runGuaranteedBuild() {
        if (STATE.buildRunning) { STATE.cancelBuild = true; return; }
        const projectPath = window.CraftIDEAppState?.getCurrentProjectPath?.();
        if (!projectPath) { notify('Open a project first.', 'error'); return; }
        const mode = getMode();
        const sourcePath = await resolveMainSource(projectPath, mode);
        if (!sourcePath) { notify('Source file not found.', 'error'); return; }

        STATE.buildRunning = true; STATE.cancelBuild = false; STATE.attempt = 0; renderBuildButton();
        logBuild('Guaranteed build started.', 'info');

        let source = window.CraftIDEVB?.generateCode?.({ returnOnly: true }) || '';
        if (!source || /Henuz|Henüz/.test(source)) { notify('Add nodes first.', 'error'); STATE.buildRunning = false; renderBuildButton(); return; }

        try {
            while (!STATE.cancelBuild) {
                STATE.attempt += 1;
                await ipcRenderer.invoke('fs:writeFile', sourcePath, source);
                const result = await ipcRenderer.invoke('build:guaranteed', { projectPath, platform: mode, attempt: STATE.attempt });
                if (result?.success) { logBuild(`Attempt ${STATE.attempt}: success`, 'ok'); notify(`Build passed after ${STATE.attempt} attempts.`, 'success'); break; }
                const err = [result?.error || '', ...(result?.compileErrors || [])].join('\n').trim() || 'Unknown error';
                logBuild(`Attempt ${STATE.attempt}: failed, fixing...`, 'warn');
                let fixed = null;
                if (window.llmProvider?.generate) {
                    const answer = await window.llmProvider.generate(`Mode: ${mode}\nCompiler errors:\n${err}\n\nCurrent source:\n${source}\n\nReturn only one full fixed source in fenced code block.`, 'Fix Minecraft source code and return only code.');
                    fixed = extractCodeBlock(answer, mode);
                }
                if (fixed && fixed !== source) { source = fixed; continue; }
                await sleep(1200);
            }
        } finally {
            if (STATE.cancelBuild) logBuild('Guaranteed build canceled by user.', 'warn');
            STATE.buildRunning = false; STATE.cancelBuild = false; renderBuildButton();
        }
    }

    function logBuild(text, cls) {
        const log = document.getElementById('nc-build-log');
        if (!log) return;
        const row = document.createElement('div');
        row.className = `nc-line ${cls || ''}`;
        row.textContent = text;
        log.prepend(row);
        while (log.childNodes.length > 24) log.removeChild(log.lastChild);
    }

    function renderBuildButton() {
        const btn = document.getElementById('btn-nc-guaranteed');
        if (!btn) return;
        if (STATE.buildRunning) { btn.textContent = 'Cancel Build'; btn.classList.add('danger'); }
        else { btn.textContent = 'Guaranteed Build'; btn.classList.remove('danger'); }
    }

    function parseScenarios() {
        const lines = String(document.getElementById('nc-scenario-input')?.value || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return lines.map((line) => {
            const p = line.split('|').map((x) => x.trim());
            return { name: p[0], command: p[1], expect: p[2], timeoutMs: Number(p[3] || 8000) || 8000 };
        }).filter((x) => x.name && x.command && x.expect);
    }

    function logsSince(ts) { return (window.__craftideServerLogs || []).filter((x) => x.ts >= ts).map((x) => String(x.line || '')); }
    function matches(expect, lines) { return lines.some((l) => l.toLowerCase().includes(String(expect).toLowerCase())); }

    async function runScenarios() {
        const out = document.getElementById('nc-scenario-output');
        const scenarios = parseScenarios();
        if (!scenarios.length) { out.innerHTML = '<div class="nc-row warn">No valid scenarios.</div>'; return; }
        const status = await ipcRenderer.invoke('server:status').catch(() => null);
        if (!status || status.status !== 'running') { out.innerHTML = '<div class="nc-row err">Server is not running.</div>'; return; }
        await ipcRenderer.invoke('scenario:run', { scenarios }).catch(() => null);

        let passed = 0;
        const rows = [];
        for (const s of scenarios) {
            const t0 = Date.now();
            const sent = await ipcRenderer.invoke('server:command', s.command).catch(() => false);
            if (!sent) { rows.push(`<div class="nc-row err">${esc(s.name)}: command failed</div>`); continue; }
            let ok = false;
            const until = Date.now() + s.timeoutMs;
            while (Date.now() < until) { if (matches(s.expect, logsSince(t0))) { ok = true; break; } await sleep(250); }
            if (ok) { passed += 1; rows.push(`<div class="nc-row ok">${esc(s.name)}: passed</div>`); }
            else rows.push(`<div class="nc-row err">${esc(s.name)}: failed</div>`);
        }
        rows.unshift(`<div class="nc-row"><strong>Scenario result:</strong> ${passed}/${scenarios.length} passed</div>`);
        out.innerHTML = rows.join('');
    }

    async function runRelease() {
        const out = document.getElementById('nc-release-output');
        const projectPath = window.CraftIDEAppState?.getCurrentProjectPath?.();
        if (!projectPath) { notify('Open a project first.', 'error'); return; }
        out.innerHTML = '<div class="nc-row">Packaging release...</div>';
        const result = await ipcRenderer.invoke('release:oneClick', {
            projectPath,
            targetType: document.getElementById('nc-release-target')?.value || 'jar',
            includeDocs: !!document.getElementById('nc-release-docs')?.checked,
        }).catch((e) => ({ success: false, error: e?.message || 'IPC error' }));
        if (!result?.success) { out.innerHTML = `<div class="nc-row err">Release failed: ${esc(result?.error || 'Unknown')}</div>`; return; }
        const lines = ['<div class="nc-row ok">Release package created.</div>'];
        for (const f of (result.outputFiles || [])) lines.push(`<div class="nc-row">${esc(f)}</div>`);
        for (const c of (result.checksum || [])) lines.push(`<div class="nc-row">${esc(c.file)} :: ${esc(c.sha256)}</div>`);
        if (result.warning) lines.push(`<div class="nc-row warn">${esc(result.warning)}</div>`);
        out.innerHTML = lines.join('');
    }

    function openModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
    function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

    function injectStyle() {
        if (document.getElementById('nc-suite-style')) return;
        const s = document.createElement('style');
        s.id = 'nc-suite-style';
        s.textContent = `
            .nc-inline{display:flex;gap:6px;flex-wrap:wrap;margin-right:8px}.nc-btn{padding:6px 10px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);font-size:11px;cursor:pointer}.nc-btn.danger{border-color:#e74c3c;color:#e74c3c}
            .nc-panel{border-top:1px solid var(--border-color);border-bottom:1px solid var(--border-color);background:rgba(0,0,0,.18);padding:8px 12px;display:flex;flex-direction:column;gap:6px}.nc-head{font-size:11px;color:var(--text-secondary)}.nc-body{max-height:120px;overflow:auto;display:flex;flex-direction:column;gap:4px}
            .nc-row{font-size:11px;padding:3px 4px;border-radius:4px;background:rgba(255,255,255,.03)}.nc-row.err{color:#ff7675;border-left:2px solid #ff7675}.nc-row.warn{color:#fdcb6e;border-left:2px solid #fdcb6e}.nc-row.ok{color:#55efc4;border-left:2px solid #55efc4}
            .nc-build{max-height:108px;overflow:auto;border:1px solid #2e3846;border-radius:8px;padding:6px;background:#0c121a}.nc-line{font-size:11px;padding:3px 4px;border-bottom:1px dashed rgba(255,255,255,.08)}.nc-line.info{color:#8ab4f8}.nc-line.warn{color:#fdcb6e}.nc-line.ok{color:#55efc4}
            .nc-modal-overlay{position:fixed;inset:0;z-index:2600;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.58)}.nc-modal{width:min(900px,92vw);max-height:86vh;overflow:auto;background:#10151d;border:1px solid #2b3340;border-radius:12px}
            .nc-m-head{padding:14px 16px;border-bottom:1px solid #2b3340;display:flex;justify-content:space-between;align-items:center}.nc-m-title{font-size:14px;font-weight:700;color:#e8eef7}.nc-m-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px}.nc-m-foot{padding:12px 16px;border-top:1px solid #2b3340;display:flex;justify-content:flex-end;gap:8px}
            .nc-inp,.nc-sel,.nc-txt{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #3a4352;background:#0b1118;color:#e8eef7;font-size:12px}.nc-txt{min-height:108px;resize:vertical}.nc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.nc-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.nc-card{border:1px solid #364253;border-radius:8px;padding:10px;background:#0f1620}.nc-sub{color:#9fb0c5;font-size:11px;margin-top:4px}
            @media(max-width:860px){.nc-grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(s);
    }

    function mountUI() {
        if (document.getElementById('btn-nc-intent')) return;
        const right = document.querySelector('#visual-builder-container .vb-toolbar-right');
        if (!right) return;
        const wrap = document.createElement('div');
        wrap.className = 'nc-inline';
        wrap.innerHTML = `
            <button class="nc-btn" id="btn-nc-intent">Intent Wizard</button>
            <button class="nc-btn" id="btn-nc-pack">Behavior Packs</button>
            <button class="nc-btn" id="btn-nc-validate">Validate</button>
            <button class="nc-btn" id="btn-nc-guaranteed">Guaranteed Build</button>
            <button class="nc-btn" id="btn-nc-scenarios">Scenario Test</button>
            <button class="nc-btn" id="btn-nc-release">One-Click Release</button>
        `;
        right.prepend(wrap);

        const panel = document.createElement('div');
        panel.className = 'nc-panel';
        panel.innerHTML = `<div class="nc-head">No-Code Health</div><div id="nc-validator-body" class="nc-body"><div class="nc-row">Validation panel initialized.</div></div><div id="nc-build-log" class="nc-build"></div>`;
        const vb = document.getElementById('visual-builder-container');
        const canvas = document.querySelector('#visual-builder-container .vb-canvas-area');
        if (vb && canvas) vb.insertBefore(panel, canvas);

        document.body.insertAdjacentHTML('beforeend', `
            <div class="nc-modal-overlay" id="nc-intent-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">Intent Wizard</div><button class="nc-btn" data-close="nc-intent-modal">Close</button></div><div class="nc-m-body"><div class="nc-grid"><div><label>Target mode</label><select id="nc-intent-mode" class="nc-sel"><option value="plugin">Paper/Plugin</option><option value="fabric">Fabric</option><option value="forge">Forge</option><option value="skript">Skript</option></select></div><div><label>Quick example</label><input id="nc-intent-example" class="nc-inp" placeholder="e.g. /spawn command with teleport"></div></div><textarea id="nc-intent-input" class="nc-txt" placeholder="Describe feature in natural language..."></textarea><div id="nc-intent-plan" class="nc-cards"></div></div><div class="nc-m-foot"><button class="nc-btn" id="nc-intent-analyze">Analyze</button><button class="nc-btn" id="nc-intent-apply">Apply</button></div></div></div>
            <div class="nc-modal-overlay" id="nc-pack-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">Behavior Packs</div><button class="nc-btn" data-close="nc-pack-modal">Close</button></div><div class="nc-m-body"><div id="nc-pack-list" class="nc-cards"></div></div></div></div>
            <div class="nc-modal-overlay" id="nc-scenario-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">Scenario Runner</div><button class="nc-btn" data-close="nc-scenario-modal">Close</button></div><div class="nc-m-body"><div class="nc-sub">Format: Name|command|expected text|timeoutMs</div><textarea id="nc-scenario-input" class="nc-txt">Spawn check|say [TEST] spawn ok|spawn ok|7000\nJoin check|say [TEST] welcome ok|welcome ok|7000</textarea><div id="nc-scenario-output"></div></div><div class="nc-m-foot"><button class="nc-btn" id="nc-scenario-run">Run Scenarios</button></div></div></div>
            <div class="nc-modal-overlay" id="nc-release-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">One-Click Release</div><button class="nc-btn" data-close="nc-release-modal">Close</button></div><div class="nc-m-body"><div class="nc-grid"><div><label>Target type</label><select id="nc-release-target" class="nc-sel"><option value="jar">Jar</option><option value="sk">Skript</option><option value="zip">Zip Bundle</option></select></div><div><label>Include docs</label><div style="display:flex;align-items:center;gap:8px;height:34px;"><input type="checkbox" id="nc-release-docs" checked><span class="nc-sub">Create release notes/checksums</span></div></div></div><div id="nc-release-output"></div></div><div class="nc-m-foot"><button class="nc-btn" id="nc-release-run">Create Release</button></div></div></div>
        `);

        document.getElementById('btn-nc-intent')?.addEventListener('click', () => { document.getElementById('nc-intent-mode').value = getMode(); openModal('nc-intent-modal'); });
        document.getElementById('btn-nc-pack')?.addEventListener('click', () => {
            const mode = getMode();
            const list = document.getElementById('nc-pack-list');
            list.innerHTML = (PACKS[mode] || []).map((p) => `<div class="nc-card"><strong>${esc(p.name)}</strong><div class="nc-sub">${esc(p.desc)}</div><button class="nc-btn" data-pack="${esc(p.id)}">Apply</button></div>`).join('');
            list.querySelectorAll('[data-pack]').forEach((btn) => btn.addEventListener('click', () => {
                const p = (PACKS[mode] || []).find((x) => x.id === btn.getAttribute('data-pack'));
                if (!p) return;
                applyGraph(JSON.parse(JSON.stringify(p.graph)));
                closeModal('nc-pack-modal');
                validateGraph(true);
            }));
            openModal('nc-pack-modal');
        });
        document.getElementById('btn-nc-validate')?.addEventListener('click', () => validateGraph(true));
        document.getElementById('btn-nc-guaranteed')?.addEventListener('click', () => runGuaranteedBuild());
        document.getElementById('btn-nc-scenarios')?.addEventListener('click', () => openModal('nc-scenario-modal'));
        document.getElementById('btn-nc-release')?.addEventListener('click', () => openModal('nc-release-modal'));

        document.getElementById('nc-intent-analyze')?.addEventListener('click', () => analyzeIntent());
        document.getElementById('nc-intent-apply')?.addEventListener('click', () => applyIntent());
        document.getElementById('nc-scenario-run')?.addEventListener('click', () => runScenarios());
        document.getElementById('nc-release-run')?.addEventListener('click', () => runRelease());
        document.getElementById('nc-intent-example')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('nc-intent-input').value = e.target.value; analyzeIntent(); } });

        document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close'))));
        document.querySelectorAll('.nc-modal-overlay').forEach((el) => el.addEventListener('click', (e) => { if (e.target === el) el.style.display = 'none'; }));
    }

    function startLiveValidation() {
        if (window.__ncLiveValidationStarted) return;
        window.__ncLiveValidationStarted = true;
        setInterval(() => {
            if (!String(window.CraftIDEAppState?.getCurrentFilePath?.() || '').startsWith('visual-builder://')) return;
            validateGraph(false);
        }, 2800);
    }

    function init() { injectStyle(); mountUI(); startLiveValidation(); validateGraph(true); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

    window.NoCodeSuite = {
        parsePrompt: (prompt, mode) => localGraphFromPrompt(prompt, normalizeMode(mode || getMode())),
        validateGraph: (graph) => localValidate(graph || currentGraph()),
        applyGraph,
        getPacksForMode: (mode) => [...(PACKS[normalizeMode(mode || getMode())] || [])],
    };
})();
