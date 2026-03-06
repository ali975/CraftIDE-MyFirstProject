/**
 * CraftIDE No-Code Suite
 * Adds no-database no-code helpers on top of Visual Builder.
 */
(() => {
    const { ipcRenderer } = require('electron');
    const nodePath = require('path');
    const Utils = window.CraftIDEUtils || {};

    const MODE_ALIAS = { paper: 'plugin', spigot: 'plugin', bukkit: 'plugin', plugin: 'plugin', fabric: 'fabric', forge: 'forge', skript: 'skript' };
    const STATE = {
        intentGraph: null,
        validationSig: '',
        suggestionSig: '',
        buildRunning: false,
        oneStepRunning: false,
        cancelBuild: false,
        attempt: 0,
    };

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

    function normalizeMode(raw) { return typeof Utils.normalizeMode === 'function' ? Utils.normalizeMode(raw) : (MODE_ALIAS[String(raw || '').toLowerCase()] || 'plugin'); }
    function getMode() { return normalizeMode(window.CraftIDEVB?.getMode?.() || 'plugin'); }
    function t(key, fallback, params) {
        if (typeof Utils.tr === 'function') return Utils.tr(key, fallback, params);
        if (window.Lang && typeof window.Lang.t === 'function') return window.Lang.t(key, params || {});
        if (!fallback) return key;
        if (!params) return fallback;
        return Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), fallback);
    }
    function notify(msg, type = 'info') {
        if (typeof Utils.notify === 'function') return Utils.notify(msg, type);
        window.CraftIDEAppState?.showNotification ? window.CraftIDEAppState.showNotification(msg, type) : console.log(msg);
    }
    function notifyT(key, fallback, type = 'info', params) { notify(t(key, fallback, params), type); }
    function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
    function esc(s) { return typeof Utils.esc === 'function' ? Utils.esc(s) : String(s || ''); }
    function formatMessage(entry, fallbackKey, fallbackText) {
        if (entry && typeof entry === 'object' && entry.messageKey) {
            return t(entry.messageKey, entry.message || fallbackText || fallbackKey, entry.messageParams || {});
        }
        if (typeof entry?.message === 'string') return entry.message;
        return t(fallbackKey, fallbackText);
    }

    function currentGraph() {
        return window.CraftIDEVB?.exportGraph?.() || { version: '2', mode: getMode(), nodes: [], connections: [] };
    }

    async function ensureVisualBuilderOpen(mode) {
        const targetMode = normalizeMode(mode || getMode());
        const currentFile = String(window.CraftIDEAppState?.getCurrentFilePath?.() || '');
        if (!currentFile.startsWith('visual-builder://')) {
            if (window.CraftIDEAppState?.openFile) {
                await window.CraftIDEAppState.openFile('visual-builder://tab', 'Visual Builder');
            } else {
                document.querySelector('.activity-btn[data-action="visual-builder"]')?.click();
            }
            await sleep(120);
        }
        if (window.CraftIDEVB?.setMode) window.CraftIDEVB.setMode(targetMode);
        await sleep(60);
    }

    function applyGraph(graph) {
        if (!window.CraftIDEVB?.importGraph) { notifyT('ui.nc.notify.visualBuilderUnavailable', 'Visual Builder API unavailable.', 'error'); return; }
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

        if (!nodes.length) errors.push({ messageKey: 'ui.nc.validation.noBlocks', messageParams: {} });
        if (!nodes.some((n) => /^(Player|Block|Entity|Inventory|Server|GUI|Fabric|Forge|Sk)/.test(String(n.blockId || '')))) errors.push({ messageKey: 'ui.nc.validation.addEvent', messageParams: {} });

        for (const e of edges) {
            if (!byId.has(e.from) || !byId.has(e.to)) errors.push({ messageKey: 'ui.nc.validation.brokenConnection', messageParams: { from: e.from, to: e.to } });
            if (e.from === e.to) errors.push({ messageKey: 'ui.nc.validation.selfConnection', messageParams: { node: e.from } });
        }
        for (const n of nodes) {
            if (n.blockId === 'PlayerCommand' && !String(n.params?.command || '').startsWith('/')) warnings.push({ messageKey: 'ui.nc.validation.commandSlash', messageParams: {} });
            if (n.blockId === 'SkCommand' && !String(n.params?.komut || '').startsWith('/')) warnings.push({ messageKey: 'ui.nc.validation.skriptCommandSlash', messageParams: {} });
            if (/Teleport$/.test(String(n.blockId || ''))) {
                const xyz = [Number(n.params?.x), Number(n.params?.y), Number(n.params?.z)];
                if (xyz.some((v) => !Number.isFinite(v))) errors.push({ messageKey: 'ui.nc.validation.teleportCoords', messageParams: { block: n.blockId } });
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
        const lines = [`<div class="nc-row"><strong>${esc(t('ui.nc.validate', 'Validate'))}:</strong> ${esc(t('ui.nc.validateSummary', '{errors} error(s), {warnings} warning(s)', { errors: result.errors.length, warnings: result.warnings.length }))}</div>`];
        for (const e of result.errors.slice(0, 4)) lines.push(`<div class="nc-row err">E: ${esc(formatMessage(e, 'ui.nc.validation.error', 'Validation error'))}</div>`);
        for (const w of result.warnings.slice(0, 6)) lines.push(`<div class="nc-row warn">W: ${esc(formatMessage(w, 'ui.nc.validation.warning', 'Validation warning'))}</div>`);
        if (!result.errors.length && !result.warnings.length) lines.push(`<div class="nc-row ok">${esc(t('ui.nc.validationReady', 'Validation panel initialized.'))}</div>`);
        body.innerHTML = lines.join('');
        return result;
    }

    async function analyzeIntent() {
        const input = document.getElementById('nc-intent-input');
        const modeEl = document.getElementById('nc-intent-mode');
        const out = document.getElementById('nc-intent-plan');
        const text = String(input?.value || '').trim();
        const mode = normalizeMode(modeEl?.value || getMode());
        if (!text) { notifyT('ui.nc.notify.describeFirst', 'Write what you want to build first.', 'error'); return; }

        let graph = null;
        try {
            const remote = await ipcRenderer.invoke('vb:nl2graph', { text, platform: mode, strictMode: false });
            if (remote?.nodes?.length) graph = { version: '2', mode, nodes: remote.nodes, connections: remote.connections || [] };
        } catch {}
        if (!graph) graph = localGraphFromPrompt(text, mode);

        STATE.intentGraph = graph;
        if (out) out.innerHTML = `<div class="nc-card"><strong>${esc(t('ui.nc.generatedGraph', 'Generated graph'))}</strong><div class="nc-sub">${esc(t('ui.nc.generatedGraphSummary', '{nodes} node(s), {connections} connection(s)', { nodes: graph.nodes.length, connections: graph.connections.length }))}</div></div>`;
    }

    async function applyIntent() { if (!STATE.intentGraph) { notifyT('ui.nc.notify.analyzeFirst', 'Analyze first.', 'error'); return; } applyGraph(STATE.intentGraph); closeModal('nc-intent-modal'); await validateGraph(true); }

    function suggestionsForGraph(graph) {
        const suggestions = [];
        const nodes = graph.nodes || [];
        const edges = graph.connections || [];
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const outMap = new Map();
        for (const c of edges) {
            if (!outMap.has(c.from)) outMap.set(c.from, []);
            outMap.get(c.from).push(c.to);
        }

        const descendants = (id, seen = new Set()) => {
            if (seen.has(id)) return [];
            seen.add(id);
            const direct = outMap.get(id) || [];
            const out = [];
            for (const child of direct) {
                out.push(child);
                descendants(child, seen).forEach((x) => out.push(x));
            }
            return out;
        };

        const cmdNodes = nodes.filter((n) => n.blockId === 'PlayerCommand' || n.blockId === 'SkCommand');
        for (const cmd of cmdNodes) {
            const chain = descendants(cmd.id).map((id) => byId.get(id)).filter(Boolean);
            const ids = chain.map((n) => n.blockId);
            if (cmd.blockId === 'PlayerCommand' && !ids.includes('CommandEquals')) {
                suggestions.push({ level: 'warn', text: t('ui.nc.suggestion.commandFlow', 'Command flow: Add CommandEquals to avoid matching every command.') });
            }
            if (!ids.some((x) => x === 'HasPermission' || x === 'SkHasPerm' || x === 'IsOp' || x === 'SkIsOp')) {
                suggestions.push({ level: 'warn', text: t('ui.nc.suggestion.commandSecurity', 'Command security: Add permission/op check before command actions.') });
            }
        }

        const teleports = nodes.filter((n) => /Teleport$/.test(String(n.blockId || '')));
        if (teleports.length && !nodes.some((n) => /SendMsg|SendMessage|Broadcast/.test(String(n.blockId || '')))) {
            suggestions.push({ level: 'info', text: t('ui.nc.suggestion.teleportFeedback', 'UX: Consider adding a message after teleport so users get feedback.') });
        }

        const giveItems = nodes.filter((n) => /GiveItem|SkGiveItem|FabricGiveItem/.test(String(n.blockId || '')));
        for (const item of giveItems) {
            const raw = item.params?.adet || item.params?.amount || item.params?.count || '1';
            const amount = Number(raw);
            if (Number.isFinite(amount) && amount > 16) {
                suggestions.push({ level: 'warn', text: t('ui.nc.suggestion.balance', 'Balance: {block} gives {amount} items; consider lower values.', { block: item.blockId, amount }) });
            }
        }

        if (nodes.some((n) => /RepeatTask|SkScheduleRepeat/.test(String(n.blockId || ''))) && !nodes.some((n) => /CancelTask|Delay|SkWait/.test(String(n.blockId || '')))) {
            suggestions.push({ level: 'info', text: t('ui.nc.suggestion.performance', 'Performance: repeating tasks should have delay/cancel controls.') });
        }

        return suggestions.slice(0, 8);
    }

    function renderSuggestions(force = false) {
        const graph = currentGraph();
        const sig = `${graph.mode}:${(graph.nodes || []).length}:${(graph.connections || []).length}`;
        if (!force && sig === STATE.suggestionSig) return;
        STATE.suggestionSig = sig;

        const body = document.getElementById('nc-suggest-body');
        if (!body) return;

        const suggestions = suggestionsForGraph(graph);
        if (!suggestions.length) {
            body.innerHTML = `<div class="nc-row ok">${esc(t('ui.nc.suggestionReady', 'Suggestion engine initialized.'))}</div>`;
            return;
        }
        body.innerHTML = suggestions.map((s) => `<div class="nc-row ${s.level === 'warn' ? 'warn' : ''}">${esc(s.text)}</div>`).join('');
    }

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
        if (!projectPath) { notifyT('msg.openProjectFirst', 'Open a project first!', 'error'); return; }
        const mode = getMode();
        const sourcePath = await resolveMainSource(projectPath, mode);
        if (!sourcePath) { notifyT('ui.nc.notify.sourceNotFound', 'Source file not found.', 'error'); return; }

        STATE.buildRunning = true; STATE.cancelBuild = false; STATE.attempt = 0; renderBuildButton();
        logBuild(t('ui.nc.build.started', 'Guaranteed build started.'), 'info');

        let source = window.CraftIDEVB?.generateCode?.({ returnOnly: true }) || '';
        if (!source || /Henuz|Hen?z/.test(source)) { notifyT('ui.nc.notify.addNodesFirst', 'Add nodes first.', 'error'); STATE.buildRunning = false; renderBuildButton(); return; }

        try {
            while (!STATE.cancelBuild) {
                STATE.attempt += 1;
                await ipcRenderer.invoke('fs:writeFile', sourcePath, source);
                const result = await ipcRenderer.invoke('build:guaranteed', { projectPath, platform: mode, attempt: STATE.attempt });
                if (result?.success) { logBuild(t('ui.nc.build.attemptSuccess', 'Attempt {attempt}: success', { attempt: STATE.attempt }), 'ok'); notifyT('ui.nc.notify.buildPassedAfterAttempts', 'Build passed after {attempt} attempts.', 'success', { attempt: STATE.attempt }); break; }
                const err = [result?.error || '', ...(result?.compileErrors || [])].join('\n').trim() || 'Unknown error';
                logBuild(t('ui.nc.build.attemptFailedFixing', 'Attempt {attempt}: failed, fixing...', { attempt: STATE.attempt }), 'warn');
                let fixed = null;
                if (window.llmProvider?.generate) {
                    const answer = await window.llmProvider.generate(`Mode: ${mode}\nCompiler errors:\n${err}\n\nCurrent source:\n${source}\n\nReturn only one full fixed source in fenced code block.`, 'Fix Minecraft source code and return only code.');
                    fixed = extractCodeBlock(answer, mode);
                }
                if (fixed && fixed !== source) { source = fixed; continue; }
                await sleep(1200);
            }
        } finally {
            if (STATE.cancelBuild) logBuild(t('ui.nc.build.canceled', 'Guaranteed build canceled by user.'), 'warn');
            STATE.buildRunning = false; STATE.cancelBuild = false; renderBuildButton();
        }
    }

    function logBuild(text, cls) {
        const log = document.getElementById('nc-build-log');
        if (!log) return;
        log.style.display = 'block';
        const row = document.createElement('div');
        row.className = `nc-line ${cls || ''}`;
        row.textContent = text;
        log.prepend(row);
        while (log.childNodes.length > 24) log.removeChild(log.lastChild);
    }

    function renderBuildButton() {
        const btn = document.getElementById('btn-nc-guaranteed');
        if (!btn) return;
        if (STATE.buildRunning) { btn.textContent = t('ui.nc.build.cancel', 'Cancel Build'); btn.classList.add('danger'); }
        else { btn.textContent = t('ui.nc.guaranteed', 'Guaranteed Build'); btn.classList.remove('danger'); }
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
        if (!scenarios.length) { out.innerHTML = `<div class="nc-row warn">${esc(t('ui.nc.scenario.none', 'No valid scenarios.'))}</div>`; return; }
        const status = await ipcRenderer.invoke('server:status').catch(() => null);
        if (!status || status.status !== 'running') { out.innerHTML = `<div class="nc-row err">${esc(t('ui.nc.scenario.serverNotRunning', 'Server is not running.'))}</div>`; return; }
        await ipcRenderer.invoke('scenario:run', { scenarios }).catch(() => null);

        let passed = 0;
        const rows = [];
        for (const s of scenarios) {
            const t0 = Date.now();
            const sent = await ipcRenderer.invoke('server:command', s.command).catch(() => false);
            if (!sent) { rows.push(`<div class="nc-row err">${esc(s.name)}: ${esc(t('ui.nc.scenario.commandFailed', 'command failed'))}</div>`); continue; }
            let ok = false;
            const until = Date.now() + s.timeoutMs;
            while (Date.now() < until) { if (matches(s.expect, logsSince(t0))) { ok = true; break; } await sleep(250); }
            if (ok) { passed += 1; rows.push(`<div class="nc-row ok">${esc(s.name)}: ${esc(t('ui.nc.scenario.passed', 'passed'))}</div>`); }
            else rows.push(`<div class="nc-row err">${esc(s.name)}: ${esc(t('ui.nc.scenario.failed', 'failed'))}</div>`);
        }
        rows.unshift(`<div class="nc-row"><strong>${esc(t('ui.nc.scenario.result', 'Scenario result'))}:</strong> ${passed}/${scenarios.length} ${esc(t('ui.nc.scenario.passed', 'passed'))}</div>`);
        out.innerHTML = rows.join('');
    }

    async function runRelease() {
        const out = document.getElementById('nc-release-output');
        const projectPath = window.CraftIDEAppState?.getCurrentProjectPath?.();
        if (!projectPath) { notifyT('msg.openProjectFirst', 'Open a project first!', 'error'); return; }
        out.innerHTML = `<div class="nc-row">${esc(t('ui.nc.release.packaging', 'Packaging release...'))}</div>`;
        const result = await ipcRenderer.invoke('release:oneClick', {
            projectPath,
            targetType: document.getElementById('nc-release-target')?.value || 'jar',
            includeDocs: !!document.getElementById('nc-release-docs')?.checked,
        }).catch((e) => ({ success: false, error: e?.message || 'IPC error' }));
        if (!result?.success) { out.innerHTML = `<div class="nc-row err">${esc(t('ui.nc.release.failed', 'Release failed: {error}', { error: result?.error || t('ui.nc.errorUnknown', 'Unknown') }))}</div>`; return; }
        const lines = [`<div class="nc-row ok">${esc(t('ui.nc.release.created', 'Release package created.'))}</div>`];
        for (const f of (result.outputFiles || [])) lines.push(`<div class="nc-row">${esc(f)}</div>`);
        for (const c of (result.checksum || [])) lines.push(`<div class="nc-row">${esc(c.file)} :: ${esc(c.sha256)}</div>`);
        if (result.warning) lines.push(`<div class="nc-row warn">${esc(result.warning)}</div>`);
        out.innerHTML = lines.join('');
    }

    function oneStepLog(text, cls) {
        const out = document.getElementById('nc-one-step-output');
        if (!out) return;
        const row = document.createElement('div');
        row.className = `nc-row ${cls || ''}`;
        row.textContent = text;
        out.appendChild(row);
        out.scrollTop = out.scrollHeight;
    }

    async function runOneStepCreate() {
        if (STATE.oneStepRunning) return;
        const prompt = String(document.getElementById('nc-one-step-input')?.value || '').trim();
        const mode = normalizeMode(document.getElementById('nc-one-step-mode')?.value || getMode());
        const doGenerate = !!document.getElementById('nc-one-step-gencode')?.checked;
        const doBuild = !!document.getElementById('nc-one-step-build')?.checked;
        const out = document.getElementById('nc-one-step-output');
        if (!prompt) { notifyT('ui.nc.notify.describeFirst', 'Write what you want to build first.', 'error'); return; }
        if (out) out.innerHTML = '';

        STATE.oneStepRunning = true;
        const runBtn = document.getElementById('nc-one-step-run');
        if (runBtn) runBtn.textContent = t('ui.nc.run.running', 'Running...');

        try {
            oneStepLog(t('ui.nc.run.architectParsing', 'Architect: parsing request for {mode}...', { mode }), 'info');
            await ensureVisualBuilderOpen(mode);

            let graph = null;
            try {
                const remote = await ipcRenderer.invoke('vb:nl2graph', { text: prompt, platform: mode, strictMode: false });
                if (remote?.nodes?.length) graph = { version: '2', mode, nodes: remote.nodes, connections: remote.connections || [] };
            } catch {}
            if (!graph) {
                graph = localGraphFromPrompt(prompt, mode);
                oneStepLog(t('ui.nc.run.localFallback', 'Architect: local fallback graph generated.'), 'warn');
            } else {
                oneStepLog(t('ui.nc.run.nodesDesigned', 'Architect: {count} nodes designed.', { count: graph.nodes.length }), 'ok');
            }

            oneStepLog(t('ui.nc.run.applyGraph', 'Coder: applying graph to Visual Builder...'), 'info');
            applyGraph(graph);

            oneStepLog(t('ui.nc.run.checkingGraph', 'Validator: checking graph quality...'), 'info');
            const result = await validateGraph(true);
            renderSuggestions(true);
            if (result?.errors?.length) oneStepLog(t('ui.nc.run.validationErrors', 'Validator: {count} error(s), review required.', { count: result.errors.length }), 'warn');
            else oneStepLog(t('ui.nc.run.graphPassed', 'Validator: graph passed.'), 'ok');

            if (doGenerate) {
                oneStepLog(t('ui.nc.run.generateSource', 'Coder: generating source code...'), 'info');
                window.CraftIDEVB?.generateCode?.();
                oneStepLog(t('ui.nc.run.sourceGenerated', 'Coder: source generated in editor tab.'), 'ok');
            }

            if (doBuild) {
                oneStepLog(t('ui.nc.run.guaranteedStart', 'Validator: running guaranteed build...'), 'info');
                await runGuaranteedBuild();
                oneStepLog(t('ui.nc.run.guaranteedDone', 'Validator: guaranteed build flow finished.'), 'ok');
            }

            oneStepLog(t('ui.nc.run.completed', 'Flow completed.'), 'ok');
            notifyT('ui.nc.notify.flowCompleted', 'One-step flow completed.', 'success');
        } catch (e) {
            oneStepLog(t('ui.nc.run.failed', 'Flow failed: {error}', { error: e?.message || t('ui.nc.errorUnknown', 'Unknown error') }), 'err');
            notifyT('ui.nc.notify.flowFailed', 'One-step flow failed: {error}', 'error', { error: e?.message || t('ui.nc.errorUnknown', 'Unknown error') });
        } finally {
            STATE.oneStepRunning = false;
            if (runBtn) runBtn.textContent = t('ui.nc.runFlow', 'Run One-Step Flow');
        }
    }

    function openOneStepModal(seedPrompt) {
        const modeEl = document.getElementById('nc-one-step-mode');
        const promptEl = document.getElementById('nc-one-step-input');
        if (modeEl) modeEl.value = getMode();
        if (promptEl && seedPrompt) promptEl.value = seedPrompt;
        openModal('nc-one-step-modal');
        promptEl?.focus();
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
            .nc-build{max-height:72px;overflow:auto;border:1px solid #2e3846;border-radius:8px;padding:6px;background:#0c121a}.nc-line{font-size:11px;padding:3px 4px;border-bottom:1px dashed rgba(255,255,255,.08)}.nc-line.info{color:#8ab4f8}.nc-line.warn{color:#fdcb6e}.nc-line.ok{color:#55efc4}
            .nc-modal-overlay{position:fixed;inset:0;z-index:2600;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.58)}.nc-modal{width:min(900px,92vw);max-height:86vh;overflow:auto;background:#10151d;border:1px solid #2b3340;border-radius:12px}
            .nc-m-head{padding:14px 16px;border-bottom:1px solid #2b3340;display:flex;justify-content:space-between;align-items:center}.nc-m-title{font-size:14px;font-weight:700;color:#e8eef7}.nc-m-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px}.nc-m-foot{padding:12px 16px;border-top:1px solid #2b3340;display:flex;justify-content:flex-end;gap:8px}
            .nc-inp,.nc-sel,.nc-txt{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #3a4352;background:#0b1118;color:#e8eef7;font-size:12px}.nc-txt{min-height:108px;resize:vertical}.nc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.nc-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.nc-card{border:1px solid #364253;border-radius:8px;padding:10px;background:#0f1620}.nc-sub{color:#9fb0c5;font-size:11px;margin-top:4px}
            .nc-stack{display:flex;flex-direction:column;gap:6px}.nc-stack .nc-body{max-height:48px}
            @media(max-width:860px){.nc-grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(s);
    }

    function localizeNoCodeUI() {
        const setText = (selector, key, fallback) => {
            const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
            if (el) el.textContent = t(key, fallback);
        };
        setText('#btn-nc-one-step', 'ui.nc.oneStep', 'One-Step AI');
        setText('#btn-nc-intent', 'ui.nc.intent', 'Intent Wizard');
        setText('#btn-nc-pack', 'ui.nc.packs', 'Behavior Packs');
        setText('#btn-nc-validate', 'ui.nc.validate', 'Validate');
        setText('#btn-nc-guaranteed', 'ui.nc.guaranteed', 'Guaranteed Build');
        setText('#btn-nc-scenarios', 'ui.nc.scenario', 'Scenario Test');
        setText('#btn-nc-release', 'ui.nc.release', 'One-Click Release');
        setText('.nc-panel .nc-head', 'ui.nc.health', 'No-Code Health');
        setText('#nc-one-step-modal .nc-m-title', 'ui.nc.modal.oneStepTitle', 'One-Step Natural Language -> Plugin');
        setText('#nc-intent-modal .nc-m-title', 'ui.nc.modal.intentTitle', 'Intent Wizard');
        setText('#nc-pack-modal .nc-m-title', 'ui.nc.modal.packTitle', 'Behavior Packs');
        setText('#nc-scenario-modal .nc-m-title', 'ui.nc.modal.scenarioTitle', 'Scenario Runner');
        setText('#nc-release-modal .nc-m-title', 'ui.nc.modal.releaseTitle', 'One-Click Release');
        document.querySelectorAll('[data-close]').forEach((btn) => setText(btn, 'ui.nc.close', 'Close'));
        setText('#nc-one-step-run', 'ui.nc.runFlow', 'Run One-Step Flow');
        setText('#nc-intent-analyze', 'ui.nc.analyze', 'Analyze');
        setText('#nc-intent-apply', 'ui.nc.apply', 'Apply');
        setText('#nc-scenario-run', 'ui.nc.run', 'Run');
        setText('#nc-release-run', 'ui.nc.run', 'Run');
        setText('#nc-one-step-mode-label', 'ui.nc.label.targetMode', 'Target mode');
        setText('#nc-one-step-options-label', 'ui.nc.label.options', 'Options');
        setText('#nc-one-step-gencode-label', 'ui.nc.option.generateCodeTab', 'Generate code tab');
        setText('#nc-one-step-build-label', 'ui.nc.option.runGuaranteedBuild', 'Run guaranteed build');
        setText('#nc-intent-mode-label', 'ui.nc.label.targetMode', 'Target mode');
        setText('#nc-intent-example-label', 'ui.nc.label.quickExample', 'Quick example');
        setText('#nc-scenario-format', 'ui.nc.label.scenarioFormat', 'Format: Name|command|expected text|timeoutMs');
        setText('#nc-release-target-label', 'ui.nc.label.targetType', 'Target type');
        setText('#nc-release-docs-label', 'ui.nc.label.includeDocs', 'Include docs');
        setText('#nc-release-docs-text', 'ui.nc.option.includeDocs', 'Create release notes/checksums');
        setText('#nc-release-run', 'ui.nc.release.create', 'Create Release');
        const oneStepInput = document.getElementById('nc-one-step-input');
        if (oneStepInput) oneStepInput.placeholder = t('ui.nc.placeholder.oneStep', 'Describe the full plugin you want in natural language...');
        const intentInput = document.getElementById('nc-intent-input');
        if (intentInput) intentInput.placeholder = t('ui.nc.placeholder.intent', 'Describe feature in natural language...');
        const intentExample = document.getElementById('nc-intent-example');
        if (intentExample) intentExample.placeholder = t('ui.nc.placeholder.example', 'e.g. /spawn command with teleport');
        const setOption = (selector, value, key, fallback) => {
            const option = document.querySelector(`${selector} option[value="${value}"]`);
            if (option) option.textContent = t(key, fallback);
        };
        setOption('#nc-one-step-mode', 'plugin', 'ui.server.type.paper', 'Paper (Plugin)');
        setOption('#nc-one-step-mode', 'fabric', 'ui.server.type.fabric', 'Fabric (Mod)');
        setOption('#nc-one-step-mode', 'forge', 'ui.server.type.forge', 'Forge (Mod)');
        setOption('#nc-one-step-mode', 'skript', 'mode.skript', 'Skript Mode');
        setOption('#nc-intent-mode', 'plugin', 'ui.server.type.paper', 'Paper (Plugin)');
        setOption('#nc-intent-mode', 'fabric', 'ui.server.type.fabric', 'Fabric (Mod)');
        setOption('#nc-intent-mode', 'forge', 'ui.server.type.forge', 'Forge (Mod)');
        setOption('#nc-intent-mode', 'skript', 'mode.skript', 'Skript Mode');
        setOption('#nc-release-target', 'jar', 'ui.nc.release.type.jar', 'Jar');
        setOption('#nc-release-target', 'sk', 'ui.nc.release.type.sk', 'Skript');
        setOption('#nc-release-target', 'zip', 'ui.nc.release.type.zip', 'Zip Bundle');
        renderBuildButton();
    }

    function mountUI() {
        if (document.getElementById('btn-nc-intent')) return;
        const right = document.querySelector('#visual-builder-container .vb-toolbar-right');
        if (!right) return;
        const wrap = document.createElement('div');
        wrap.className = 'nc-inline';
        wrap.innerHTML = `
            <button class="nc-btn" id="btn-nc-one-step">One-Step AI</button>
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
        panel.innerHTML = `
            <div class="nc-head">No-Code Health</div>
            <div class="nc-stack">
                <div id="nc-validator-body" class="nc-body"><div class="nc-row">Validation panel initialized.</div></div>
                <div id="nc-suggest-body" class="nc-body"><div class="nc-row">Suggestion engine initialized.</div></div>
            </div>
            <div id="nc-build-log" class="nc-build" style="display:none;"></div>
        `;
        const vbTopRegion = document.getElementById('vb-top-region');
        const canvas = document.querySelector('#visual-builder-container .vb-canvas-area');
        if (vbTopRegion) {
            vbTopRegion.appendChild(panel);
        } else {
            const vb = document.getElementById('visual-builder-container');
            if (vb && canvas) vb.insertBefore(panel, canvas);
        }

        document.body.insertAdjacentHTML('beforeend', `
            <div class="nc-modal-overlay" id="nc-one-step-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">One-Step Natural Language -> Plugin</div><button class="nc-btn" data-close="nc-one-step-modal">Close</button></div><div class="nc-m-body"><div class="nc-grid"><div><label id="nc-one-step-mode-label">Target mode</label><select id="nc-one-step-mode" class="nc-sel"><option value="plugin">Paper/Plugin</option><option value="fabric">Fabric</option><option value="forge">Forge</option><option value="skript">Skript</option></select></div><div><label id="nc-one-step-options-label">Options</label><div style="display:flex;flex-direction:column;gap:6px;padding-top:6px;"><label><input type="checkbox" id="nc-one-step-gencode" checked> <span id="nc-one-step-gencode-label">Generate code tab</span></label><label><input type="checkbox" id="nc-one-step-build"> <span id="nc-one-step-build-label">Run guaranteed build</span></label></div></div></div><textarea id="nc-one-step-input" class="nc-txt" placeholder="Describe the full plugin you want in natural language..."></textarea><div id="nc-one-step-output" class="nc-build"></div></div><div class="nc-m-foot"><button class="nc-btn" id="nc-one-step-run">Run One-Step Flow</button></div></div></div>
            <div class="nc-modal-overlay" id="nc-intent-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">Intent Wizard</div><button class="nc-btn" data-close="nc-intent-modal">Close</button></div><div class="nc-m-body"><div class="nc-grid"><div><label id="nc-intent-mode-label">Target mode</label><select id="nc-intent-mode" class="nc-sel"><option value="plugin">Paper/Plugin</option><option value="fabric">Fabric</option><option value="forge">Forge</option><option value="skript">Skript</option></select></div><div><label id="nc-intent-example-label">Quick example</label><input id="nc-intent-example" class="nc-inp" placeholder="e.g. /spawn command with teleport"></div></div><textarea id="nc-intent-input" class="nc-txt" placeholder="Describe feature in natural language..."></textarea><div id="nc-intent-plan" class="nc-cards"></div></div><div class="nc-m-foot"><button class="nc-btn" id="nc-intent-analyze">Analyze</button><button class="nc-btn" id="nc-intent-apply">Apply</button></div></div></div>
            <div class="nc-modal-overlay" id="nc-pack-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">Behavior Packs</div><button class="nc-btn" data-close="nc-pack-modal">Close</button></div><div class="nc-m-body"><div id="nc-pack-list" class="nc-cards"></div></div></div></div>
            <div class="nc-modal-overlay" id="nc-scenario-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">Scenario Runner</div><button class="nc-btn" data-close="nc-scenario-modal">Close</button></div><div class="nc-m-body"><div class="nc-sub" id="nc-scenario-format">Format: Name|command|expected text|timeoutMs</div><textarea id="nc-scenario-input" class="nc-txt">Spawn check|say [TEST] spawn ok|spawn ok|7000\nJoin check|say [TEST] welcome ok|welcome ok|7000</textarea><div id="nc-scenario-output"></div></div><div class="nc-m-foot"><button class="nc-btn" id="nc-scenario-run">Run Scenarios</button></div></div></div>
            <div class="nc-modal-overlay" id="nc-release-modal"><div class="nc-modal"><div class="nc-m-head"><div class="nc-m-title">One-Click Release</div><button class="nc-btn" data-close="nc-release-modal">Close</button></div><div class="nc-m-body"><div class="nc-grid"><div><label id="nc-release-target-label">Target type</label><select id="nc-release-target" class="nc-sel"><option value="jar">Jar</option><option value="sk">Skript</option><option value="zip">Zip Bundle</option></select></div><div><label id="nc-release-docs-label">Include docs</label><div style="display:flex;align-items:center;gap:8px;height:34px;"><input type="checkbox" id="nc-release-docs" checked><span id="nc-release-docs-text" class="nc-sub">Create release notes/checksums</span></div></div></div><div id="nc-release-output"></div></div><div class="nc-m-foot"><button class="nc-btn" id="nc-release-run">Create Release</button></div></div></div>
        `);

        document.getElementById('btn-nc-one-step')?.addEventListener('click', () => openOneStepModal());
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

        document.getElementById('nc-one-step-run')?.addEventListener('click', () => runOneStepCreate());
        document.getElementById('nc-intent-analyze')?.addEventListener('click', () => analyzeIntent());
        document.getElementById('nc-intent-apply')?.addEventListener('click', () => applyIntent());
        document.getElementById('nc-scenario-run')?.addEventListener('click', () => runScenarios());
        document.getElementById('nc-release-run')?.addEventListener('click', () => runRelease());
        document.getElementById('nc-intent-example')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('nc-intent-input').value = e.target.value; analyzeIntent(); } });

        document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close'))));
        document.querySelectorAll('.nc-modal-overlay').forEach((el) => el.addEventListener('click', (e) => { if (e.target === el) el.style.display = 'none'; }));
        localizeNoCodeUI();
    }

    function startLiveValidation() {
        if (window.__ncLiveValidationStarted) return;
        window.__ncLiveValidationStarted = true;
        setInterval(() => {
            if (!String(window.CraftIDEAppState?.getCurrentFilePath?.() || '').startsWith('visual-builder://')) return;
            validateGraph(false);
            renderSuggestions(false);
        }, 2800);
    }

    function init() {
        injectStyle();
        mountUI();
        startLiveValidation();
        validateGraph(true);
        renderSuggestions(true);
        document.addEventListener('lang:changed', () => {
            localizeNoCodeUI();
            validateGraph(true);
            renderSuggestions(true);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

    window.NoCodeSuite = {
        parsePrompt: (prompt, mode) => localGraphFromPrompt(prompt, normalizeMode(mode || getMode())),
        validateGraph: (graph) => localValidate(graph || currentGraph()),
        applyGraph,
        createFromPrompt: async (prompt, options = {}) => {
            const mode = normalizeMode(options.mode || getMode());
            await ensureVisualBuilderOpen(mode);
            let graph = null;
            try {
                const remote = await ipcRenderer.invoke('vb:nl2graph', { text: String(prompt || ''), platform: mode, strictMode: false });
                if (remote?.nodes?.length) graph = { version: '2', mode, nodes: remote.nodes, connections: remote.connections || [] };
            } catch {}
            if (!graph) graph = localGraphFromPrompt(String(prompt || ''), mode);
            applyGraph(graph);
            await validateGraph(true);
            renderSuggestions(true);
            if (options.generateCode !== false) window.CraftIDEVB?.generateCode?.();
            if (options.build) await runGuaranteedBuild();
            return graph;
        },
        getPacksForMode: (mode) => [...(PACKS[normalizeMode(mode || getMode())] || [])],
        getSuggestions: (graph) => suggestionsForGraph(graph || currentGraph()),
        openOneStepModal,
        oneClickFixCurrent: async () => runGuaranteedBuild(),
    };
})();
