/**
 * CraftIDE Phase Utils
 * Pure helpers shared by phase-completion-suite and tests.
 */
(function rootFactory(global) {
    const API_PATTERN_RULES = [
        { pattern: /PlayerRespawnEvent\.setRespawnLocation\(/g, min: '1.8', note: 'Respawn API changed across major versions.' },
        { pattern: /PersistentDataContainer/g, min: '1.14', note: 'PDC requires 1.14+.' },
        { pattern: /AdventureComponent|net\.kyori\.adventure/g, min: '1.16.5', note: 'Adventure API usage may require modern Paper versions.' },
        { pattern: /BossBar/g, min: '1.9', note: 'BossBar API requires 1.9+.' },
        { pattern: /MiniMessage/g, min: '1.19', note: 'MiniMessage requires modern Adventure stack.' },
        { pattern: /ServerPlayConnectionEvents/g, min: '1.17', note: 'Fabric API callback availability depends on versions.' },
    ];

    function versionToNumber(v) {
        const parts = String(v || '0').split('.').map((x) => Number(x) || 0);
        while (parts.length < 3) parts.push(0);
        return parts[0] * 10000 + parts[1] * 100 + parts[2];
    }

    function compareVersion(a, b) {
        const na = versionToNumber(a);
        const nb = versionToNumber(b);
        if (na === nb) return 0;
        return na > nb ? 1 : -1;
    }

    function recommendOfflineModel(totalMemGb) {
        const gb = Number(totalMemGb || 0);
        if (gb >= 16) return { tier: 'high', model: 'codellama:34b', hint: 'Best quality for local generation (16GB+ RAM).' };
        if (gb >= 8) return { tier: 'mid', model: 'codellama:13b', hint: 'Balanced quality/speed (8GB+ RAM).' };
        return { tier: 'low', model: 'mistral:7b', hint: 'Lean model for limited RAM (4-8GB).' };
    }

    function simulateGraph(graphRaw) {
        const graph = graphRaw && typeof graphRaw === 'object' ? graphRaw : {};
        const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
        const edges = Array.isArray(graph.connections) ? graph.connections : [];
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const outMap = new Map();
        edges.forEach((e) => {
            if (!outMap.has(e.from)) outMap.set(e.from, []);
            outMap.get(e.from).push(e.to);
        });

        const eventNodes = nodes.filter((n) => /^(Player|Block|Entity|Inventory|Server|GUI|Fabric|Forge|Sk)/.test(String(n.blockId || '')));
        const warnings = [];
        const steps = [];

        if (!nodes.length) warnings.push('Canvas is empty.');
        if (!eventNodes.length && nodes.length) warnings.push('No event trigger detected.');

        eventNodes.forEach((ev, evIdx) => {
            steps.push(`${evIdx + 1}. Trigger: ${ev.blockId}`);
            const queue = [...(outMap.get(ev.id) || [])];
            const visited = new Set([ev.id]);
            let depthGuard = 0;
            while (queue.length && depthGuard < 200) {
                depthGuard += 1;
                const id = queue.shift();
                if (visited.has(id)) continue;
                visited.add(id);
                const node = byId.get(id);
                if (!node) {
                    warnings.push(`Broken connection to node #${id}.`);
                    continue;
                }
                const p = node.params && typeof node.params === 'object'
                    ? Object.entries(node.params).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(', ')
                    : '';
                steps.push(`   -> ${node.blockId}${p ? ` (${p})` : ''}`);
                const next = outMap.get(id) || [];
                next.forEach((n) => queue.push(n));
            }
            if (depthGuard >= 200) warnings.push('Possible infinite chain detected in graph simulation.');
        });

        const perf = estimateGraphPerformance(graph);
        warnings.push(...perf.warnings);

        return {
            steps,
            warnings,
            estimatedCost: perf.score,
            nodeCount: nodes.length,
            edgeCount: edges.length,
        };
    }

    function estimateGraphPerformance(graphRaw) {
        const graph = graphRaw && typeof graphRaw === 'object' ? graphRaw : {};
        const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
        const scoreBase = nodes.length * 1.3;
        const repeaters = nodes.filter((n) => /RepeatTask|Schedule|Loop|SkLoop|ForEachPlayer/.test(String(n.blockId || ''))).length;
        const commandExec = nodes.filter((n) => /RunCommand|Broadcast/.test(String(n.blockId || ''))).length;
        const score = Math.round(scoreBase + repeaters * 6 + commandExec * 2);
        const warnings = [];
        if (repeaters > 0) warnings.push('Repeating/scheduled nodes detected: ensure cancel conditions exist.');
        if (score > 80) warnings.push('High estimated runtime cost: split heavy flows and add throttling.');
        if (nodes.length > 120) warnings.push('Large graph: enable performance mode or modularize templates.');
        return { score, warnings };
    }

    function checkCompatibilityFromText(text, targetVersion) {
        const source = String(text || '');
        const target = String(targetVersion || '1.21.4');
        const issues = [];

        API_PATTERN_RULES.forEach((rule) => {
            const has = rule.pattern.test(source);
            rule.pattern.lastIndex = 0;
            if (!has) return;
            if (compareVersion(target, rule.min) < 0) {
                issues.push({
                    level: 'error',
                    minVersion: rule.min,
                    targetVersion: target,
                    message: `Requires ${rule.min}+ but target is ${target}. ${rule.note}`,
                });
            } else {
                issues.push({
                    level: 'info',
                    minVersion: rule.min,
                    targetVersion: target,
                    message: `Compatible with target ${target} (requires ${rule.min}+).`,
                });
            }
        });

        if (/org\.bukkit\.material\./.test(source)) {
            issues.push({
                level: compareVersion(target, '1.13') >= 0 ? 'warn' : 'info',
                minVersion: 'legacy',
                targetVersion: target,
                message: 'Legacy Material API detected; consider org.bukkit.block.data for modern versions.',
            });
        }

        return issues;
    }

    function explainLine(line, level) {
        const t = String(line || '').trim();
        if (!t) return null;
        if (t.startsWith('//')) return 'Comment line.';
        if (/@EventHandler/.test(t)) return 'Marks an event listener method.';
        if (/class\s+\w+/.test(t)) return 'Declares a class type.';
        if (/extends\s+JavaPlugin/.test(t)) return 'Main plugin class extending JavaPlugin.';
        if (/public\s+void\s+onEnable\s*\(/.test(t)) return 'Runs when plugin is enabled.';
        if (/public\s+void\s+onDisable\s*\(/.test(t)) return 'Runs when plugin is disabled.';
        if (/sendMessage\(/.test(t)) return 'Sends chat message to player/command sender.';
        if (/teleport\(/.test(t)) return 'Teleports target entity/player.';
        if (/Bukkit\.dispatchCommand\(/.test(t)) return 'Executes a command programmatically.';
        if (/if\s*\(/.test(t)) return level === 'advanced' ? 'Branch condition controlling execution flow.' : 'Conditional check.';
        if (/for\s*\(|while\s*\(/.test(t)) return level === 'advanced' ? 'Loop block, repeats enclosed instructions.' : 'Loop statement.';
        if (/try\s*\{/.test(t)) return 'Starts guarded block for exception handling.';
        if (/catch\s*\(/.test(t)) return 'Handles runtime exception from try block.';
        if (/return\s+/.test(t)) return 'Returns value from method.';
        if (/new\s+/.test(t)) return 'Creates new object instance.';
        if (/=/.test(t) && /;\s*$/.test(t)) return 'Assigns/calculates a value.';
        if (/^\w+[\w<>,\s]*\s+\w+\s*\(/.test(t)) return 'Method declaration signature.';
        return 'Executes a statement.';
    }

    function generateHeuristicCodeExplanation(codeRaw, locale, level) {
        const code = String(codeRaw || '');
        const lang = locale === 'tr' ? 'tr' : 'en';
        const detail = level === 'advanced' ? 'advanced' : 'beginner';
        const lines = code.split(/\r?\n/);
        const out = [];

        lines.forEach((line, idx) => {
            const note = explainLine(line, detail);
            if (!note) return;
            if (lang === 'tr') out.push(`Satir ${idx + 1}: ${note}`);
            else out.push(`Line ${idx + 1}: ${note}`);
        });

        const summary = lang === 'tr'
            ? `Toplam ${lines.length} satir kod tarandi, ${out.length} aciklama uretildi.`
            : `Scanned ${lines.length} lines, generated ${out.length} explanations.`;

        return { summary, lines: out };
    }

    const api = {
        compareVersion,
        recommendOfflineModel,
        simulateGraph,
        estimateGraphPerformance,
        checkCompatibilityFromText,
        generateHeuristicCodeExplanation,
    };

    global.CraftIDEPhaseUtils = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
