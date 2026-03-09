(function () {
    const MODE_ALIAS = {
        paper: 'plugin',
        spigot: 'plugin',
        bukkit: 'plugin',
        plugin: 'plugin',
        fabric: 'fabric',
        forge: 'forge',
        skript: 'skript',
    };

    const KNOWLEDGE_PACKS = {
        vault: {
            id: 'vault',
            title: 'Vault',
            keywords: ['vault', 'economy', 'coins', 'money', 'balance', 'currency', 'shop', 'sell', 'buy'],
            summary: 'Economy and permissions bridge used by many Paper plugins.',
            capabilities: ['balance lookup', 'deposit and withdraw', 'economy-backed shop flows'],
        },
        placeholderapi: {
            id: 'placeholderapi',
            title: 'PlaceholderAPI',
            keywords: ['placeholderapi', 'placeholder', 'scoreboard', '%player%', '%vault%', 'hud'],
            summary: 'Dynamic placeholder system often used in scoreboards, GUIs, and chat formatting.',
            capabilities: ['scoreboard placeholders', 'chat placeholders', 'live GUI text'],
        },
        worldguard: {
            id: 'worldguard',
            title: 'WorldGuard',
            keywords: ['worldguard', 'region', 'protect', 'protection', 'flag', 'safe zone', 'claim'],
            summary: 'Region and flag management for protected zones.',
            capabilities: ['region checks', 'flag-based protection', 'spawn safety'],
        },
        citizens: {
            id: 'citizens',
            title: 'Citizens',
            keywords: ['citizens', 'npc', 'villager', 'dialog', 'quest giver', 'guide'],
            summary: 'NPC framework used for guides, quest givers, and scripted interactions.',
            capabilities: ['npc creation', 'dialogue hooks', 'quest givers'],
        },
        protocollib: {
            id: 'protocollib',
            title: 'ProtocolLib',
            keywords: ['protocollib', 'packet', 'tablist', 'nametag', 'client packet'],
            summary: 'Packet-level integrations for advanced visuals and protocol manipulation.',
            capabilities: ['packet interception', 'advanced client-side effects', 'protocol hooks'],
        },
        folia: {
            id: 'folia',
            title: 'Folia',
            keywords: ['folia', 'region thread', 'scheduler', 'async region', 'paper fork'],
            summary: 'Threaded server execution model that changes scheduling assumptions.',
            capabilities: ['region-safe scheduling', 'thread-aware task design', 'paper compatibility notes'],
        },
    };

    function normalizeMode(rawMode) {
        return MODE_ALIAS[String(rawMode || '').toLowerCase()] || 'plugin';
    }

    function uniq(list) {
        return [...new Set((Array.isArray(list) ? list : []).filter(Boolean))];
    }

    function summarizeGraph(graph) {
        const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
        const connections = Array.isArray(graph?.connections) ? graph.connections : [];
        const blockIds = uniq(nodes.map((node) => node?.blockId).filter(Boolean));
        return {
            nodeCount: nodes.length,
            connectionCount: connections.length,
            blockIds,
            blockSummary: blockIds.slice(0, 8).join(', '),
        };
    }

    function inferKnowledgePacks(prompt, graph) {
        const haystack = [
            String(prompt || ''),
            summarizeGraph(graph).blockSummary,
        ].join(' ').toLowerCase();
        return Object.values(KNOWLEDGE_PACKS)
            .filter((pack) => pack.keywords.some((keyword) => haystack.includes(keyword)))
            .map((pack) => pack.id);
    }

    function buildKnowledgeSummary(packIds) {
        const selected = uniq(packIds).map((id) => KNOWLEDGE_PACKS[id]).filter(Boolean);
        if (!selected.length) return '';
        return selected.map((pack) => {
            return `${pack.title}: ${pack.summary} Key capabilities: ${pack.capabilities.join(', ')}.`;
        }).join('\n');
    }

    function buildProjectSnapshot(options = {}) {
        const context = options.context || {};
        const projectPath = context.projectPath || context.rootPath || context.currentProjectPath || '';
        const activeFile = context.activeFile || context.currentFilePath || '';
        const files = uniq(context.existingFiles || context.files || []);
        const dependencies = uniq(context.dependencies || []);
        const openMode = normalizeMode(context.platform || context.mode || context.visualBuilderMode || 'plugin');
        const graphSummary = summarizeGraph(context.graph || context.visualGraph);
        return {
            projectPath,
            activeFile,
            openMode,
            minecraftVersion: context.minecraftVersion || '1.21.4',
            files,
            dependencies,
            graphSummary,
            knowledgePacks: uniq([...(context.knowledgePacks || []), ...inferKnowledgePacks(context.prompt, context.graph || context.visualGraph)]),
        };
    }

    function buildPromptPreamble(options = {}) {
        const snapshot = buildProjectSnapshot(options);
        const knowledgeSummary = buildKnowledgeSummary(snapshot.knowledgePacks);
        const fileSummary = snapshot.files.length ? snapshot.files.slice(0, 10).join(', ') : 'No indexed files yet';
        const dependencySummary = snapshot.dependencies.length ? snapshot.dependencies.join(', ') : 'No known dependencies';
        const graphSummary = snapshot.graphSummary.nodeCount
            ? `Visual graph: ${snapshot.graphSummary.nodeCount} nodes, ${snapshot.graphSummary.connectionCount} connections. Blocks: ${snapshot.graphSummary.blockSummary || 'n/a'}`
            : 'Visual graph: empty or unavailable.';

        return [
            `Target mode: ${snapshot.openMode}`,
            `Minecraft version: ${snapshot.minecraftVersion}`,
            `Project path: ${snapshot.projectPath || 'No project open'}`,
            `Active file: ${snapshot.activeFile || 'No active file'}`,
            `Files in context: ${fileSummary}`,
            `Dependencies in context: ${dependencySummary}`,
            graphSummary,
            knowledgeSummary ? `Relevant Minecraft knowledge:\n${knowledgeSummary}` : '',
        ].filter(Boolean).join('\n');
    }

    function buildReleaseQualityGate(status = {}) {
        const checks = [
            {
                id: 'validation',
                label: 'Graph validation',
                passed: !status.validation || (Number(status.validation.errors || 0) === 0),
                detail: status.validation ? `${status.validation.errors || 0} errors, ${status.validation.warnings || 0} warnings` : 'Not run yet',
                required: true,
            },
            {
                id: 'build',
                label: 'Guaranteed build',
                passed: !!status.build?.success,
                detail: status.build ? `Attempts: ${status.build.attempts || 0}` : 'Not run yet',
                required: true,
            },
            {
                id: 'scenario',
                label: 'Scenario test',
                passed: !!status.scenario?.success,
                detail: status.scenario ? `${status.scenario.passed || 0}/${status.scenario.total || 0} passed` : 'Not run yet',
                required: true,
            },
            {
                id: 'warningBudget',
                label: 'Critical warnings',
                passed: Number(status.validation?.warnings || 0) < 3,
                detail: status.validation ? `${status.validation.warnings || 0} warning(s)` : 'Not evaluated yet',
                required: false,
            },
        ];
        const blockers = checks.filter((check) => check.required && !check.passed);
        return {
            checks,
            canRelease: blockers.length === 0,
            blockers,
            summary: blockers.length
                ? `Release blocked by ${blockers.map((item) => item.label).join(', ')}.`
                : 'Release gate passed. Ready to package.',
        };
    }

    function buildScenarioIdeas(prompt, mode) {
        const normalizedMode = normalizeMode(mode);
        const text = String(prompt || '').trim();
        const lower = text.toLowerCase();
        const scenarios = [];

        if (lower.includes('/spawn') || lower.includes('spawn')) {
            scenarios.push({
                name: 'Spawn command',
                command: normalizedMode === 'skript' ? 'say [TEST] /spawn executed' : 'say [TEST] spawn ok',
                expect: lower.includes('teleport') ? 'spawn' : 'ok',
            });
        }
        if (lower.includes('join') || lower.includes('welcome')) {
            scenarios.push({
                name: 'Join welcome',
                command: 'say [TEST] welcome ok',
                expect: 'welcome',
            });
        }
        if (lower.includes('reward') || lower.includes('kit') || lower.includes('diamond')) {
            scenarios.push({
                name: 'Reward feedback',
                command: 'say [TEST] reward ok',
                expect: 'reward',
            });
        }
        if (!scenarios.length) {
            scenarios.push({
                name: 'Basic feedback',
                command: 'say [TEST] action completed',
                expect: 'action',
            });
        }

        return scenarios.map((scenario) => ({
            ...scenario,
            timeoutMs: 8000,
        }));
    }

    function buildReleaseDeliverySummary(releaseResult, qualityStatus) {
        const result = releaseResult || {};
        const gate = buildReleaseQualityGate(qualityStatus || {});
        const artifacts = (result.outputFiles || []).map((f) => String(f));
        const checksums = (result.checksum || []).map((c) => `${c.file}: ${c.sha256}`);
        const manualChecks = [
            'Test the plugin on a live server before publishing.',
            'Verify plugin.yml version matches the jar.',
        ];
        if (result.warning) manualChecks.unshift(String(result.warning));
        const nextStep = result.success
            ? 'Upload the artifact to your server and restart to test.'
            : 'Fix remaining issues before creating a release package.';
        return {
            success: !!result.success,
            artifacts,
            checksums,
            manualChecks,
            nextStep,
            gate,
            summary: result.success
                ? `Release created with ${artifacts.length} artifact(s). ${checksums.length} checksum(s) generated.`
                : `Release not yet ready. ${gate.summary}`,
        };
    }

    function buildProjectReadinessSnapshot(qualityStatus, releaseResult) {
        const gate = buildReleaseQualityGate(qualityStatus || {});
        const releaseCreated = !!releaseResult?.success;
        const checks = gate.checks.map((c) => ({
            id: c.id,
            label: c.label,
            passed: c.passed,
            detail: c.detail,
            required: c.required,
        }));
        const score = checks.filter((c) => c.passed).length;
        const total = checks.length;
        const pct = total > 0 ? Math.round((score / total) * 100) : 0;
        return {
            score,
            total,
            pct,
            canRelease: gate.canRelease,
            releaseCreated,
            checks,
            summary: releaseCreated
                ? `Released. All checks passed (${score}/${total}).`
                : gate.canRelease
                    ? `Ready to release (${score}/${total} checks). No release artifact yet.`
                    : `Not ready: ${gate.blockers.map((b) => b.label).join(', ')} pending (${score}/${total}).`,
        };
    }

    const api = {
        KNOWLEDGE_PACKS,
        buildKnowledgeSummary,
        buildProjectReadinessSnapshot,
        buildProjectSnapshot,
        buildPromptPreamble,
        buildReleaseDeliverySummary,
        buildReleaseQualityGate,
        buildScenarioIdeas,
        inferKnowledgePacks,
        normalizeMode,
        summarizeGraph,
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (typeof window !== 'undefined') {
        window.CraftIDEGuidance = api;
    }
})();
