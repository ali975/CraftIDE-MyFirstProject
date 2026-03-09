(function () {
    const CreatorBrief = require('../shared/creator-brief.js');
    const Guidance = require('../shared/minecraft-guidance.js');

    function tr(key, fallback, params) {
        return window.CraftIDEUtils?.tr ? window.CraftIDEUtils.tr(key, fallback, params) : fallback || key;
    }

    function getRequest() {
        const input = document.getElementById('welcome-idea-input');
        const mode = document.getElementById('welcome-idea-mode');
        return {
            prompt: String(input?.value || '').trim(),
            mode: String(mode?.value || 'plugin').trim() || 'plugin',
        };
    }

    function getCreatorCatalog() {
        return {
            command: {
                title: tr('ui.welcome.paths.command.title', 'Command Designer'),
                desc: tr('ui.welcome.paths.command.desc', 'Shape a command flow with subcommands and arguments.'),
                sub: tr('ui.welcome.paths.command.sub', 'Best for command-first ideas, automation and admin tools.'),
            },
            shop: {
                title: tr('ui.welcome.paths.shop.title', 'GUI Shop'),
                desc: tr('ui.welcome.paths.shop.desc', 'Start a chest menu for shop or server navigation flows.'),
                sub: tr('ui.welcome.paths.shop.sub', 'Best for menus, shops and button-based player flows.'),
            },
            quest: {
                title: tr('ui.welcome.paths.quest.title', 'Quest Designer'),
                desc: tr('ui.welcome.paths.quest.desc', 'Create guided missions with objectives, rewards and claim flows.'),
                sub: tr('ui.welcome.paths.quest.sub', 'Best for daily quests, collection goals and reward-driven progression.'),
            },
            region: {
                title: tr('ui.welcome.paths.region.title', 'Region Designer'),
                desc: tr('ui.welcome.paths.region.desc', 'Protect spawn, claims and PvP zones with guided flags.'),
                sub: tr('ui.welcome.paths.region.sub', 'Best for spawn protection, safe zones and anti-grief rules.'),
            },
            loot: {
                title: tr('ui.welcome.paths.loot.title', 'Loot Designer'),
                desc: tr('ui.welcome.paths.loot.desc', 'Create loot drops, starter rewards and crate-style giveaways.'),
                sub: tr('ui.welcome.paths.loot.sub', 'Best for boss loot, join rewards and claimable reward flows.'),
            },
            npc: {
                title: tr('ui.welcome.paths.npc.title', 'NPC Dialogue'),
                desc: tr('ui.welcome.paths.npc.desc', 'Generate dialogue files and option branches for guide NPCs.'),
                sub: tr('ui.welcome.paths.npc.sub', 'Best for dialogue, quest givers and guided interactions.'),
            },
        };
    }

    function renderPreview() {
        const request = getRequest();
        const detail = window.NoCodeSuite?.describePrompt?.(request.prompt, request.mode)
            || CreatorBrief.describePrompt(request.prompt, request.mode, { translate: tr });
        const intake = CreatorBrief.buildGuidedIntake(request.prompt, request.mode, { translate: tr });
        const delivery = CreatorBrief.buildDeliveryChecklist(request.prompt, request.mode);
        const route = intake.route;
        const catalog = getCreatorCatalog();
        const routeMeta = catalog[route.recommended] || catalog.command;

        const summaryEl = document.getElementById('welcome-idea-summary');
        const actionsEl = document.getElementById('welcome-idea-actions');
        const nextEl = document.getElementById('welcome-idea-next');
        const badgeEl = document.getElementById('welcome-idea-preview-badge');
        const routeEl = document.getElementById('welcome-idea-route');
        const requirementsEl = document.getElementById('welcome-idea-requirements');
        const deliveryEl = document.getElementById('welcome-delivery-status');
        if (!summaryEl || !actionsEl || !nextEl || !badgeEl) return;

        if (!detail) {
            summaryEl.textContent = tr('ui.welcome.idea.previewEmptySummary', 'Describe an idea and CraftIDE will summarize the likely project flow here.');
            actionsEl.textContent = tr('ui.welcome.idea.previewEmptyActions', 'CraftIDE turns your request into a visual graph, suggests missing blocks, and opens the right builder flow.');
            nextEl.textContent = tr('ui.welcome.idea.previewEmptyNext', 'Start the AI flow to open the one-step builder with your idea prefilled.');
            badgeEl.textContent = tr('ui.welcome.idea.previewBadge', 'Draft');
            if (routeEl) routeEl.textContent = tr('ui.welcome.paths.subtitle', 'CraftIDE can route this idea into the most useful designer.');
            if (requirementsEl) requirementsEl.innerHTML = `<div class="welcome-idea-preview-card-line">${tr('ui.welcome.intake.empty', 'Answering a few key questions here will make the first draft more accurate.')}</div>`;
            if (deliveryEl) deliveryEl.innerHTML = `<div class="welcome-idea-preview-card-line">${tr('ui.welcome.delivery.empty', 'Validate, scenario test, and release will appear here once the idea is clear.')}</div>`;
            return;
        }

        summaryEl.textContent = [detail.summary, detail.eventText].filter(Boolean).join(' ');
        actionsEl.textContent = Array.isArray(detail.actions) ? detail.actions.join(' ') : String(detail.actions || '');
        nextEl.textContent = intake.nextStep || detail.nextStep || tr('ui.welcome.idea.previewEmptyNext', 'Start the AI flow to open the one-step builder with your idea prefilled.');
        badgeEl.textContent = intake.ready ? tr('ui.welcome.idea.previewReady', 'Ready') : (detail.badge || tr('ui.welcome.idea.previewBadge', 'Draft'));

        if (routeEl) {
            routeEl.textContent = `${routeMeta.title}: ${routeMeta.sub}`;
        }
        if (requirementsEl) {
            requirementsEl.innerHTML = intake.questions.length
                ? intake.questions.map((question) => `<div class="welcome-idea-preview-card-line">${window.CraftIDEUtils.esc(question)}</div>`).join('')
                : `<div class="welcome-idea-preview-card-line">${tr('ui.welcome.intake.ready', 'The intake has enough context for a strong first draft.')}</div>`;
        }
        if (deliveryEl) {
            const storeState = window.CraftIDEStore?.getState?.();
            const storeReadiness = storeState?.creator?.readiness;
            if (storeReadiness && storeReadiness.checks && storeReadiness.checks.length) {
                const badge = storeReadiness.canRelease ? '✅' : '⏳';
                deliveryEl.innerHTML = `<div class="welcome-idea-preview-card-line">${badge} ${window.CraftIDEUtils?.esc ? window.CraftIDEUtils.esc(storeReadiness.summary) : storeReadiness.summary}</div>`
                    + storeReadiness.checks.slice(0, 4).map((c) => {
                        const icon = c.passed ? '✓' : (c.required ? '✗' : '△');
                        const text = `${icon} ${c.label}: ${c.detail}`;
                        return `<div class="welcome-idea-preview-card-line">${window.CraftIDEUtils?.esc ? window.CraftIDEUtils.esc(text) : text}</div>`;
                    }).join('');
            } else {
                deliveryEl.innerHTML = delivery.slice(0, 5)
                    .map((item) => `<div class="welcome-idea-preview-card-line">${window.CraftIDEUtils.esc(item.label)}</div>`)
                    .join('');
            }
        }
    }

    function renderCreatorPaths() {
        const request = getRequest();
        const route = CreatorBrief.inferCreatorPath(request.prompt);
        const subEl = document.getElementById('welcome-creator-paths-sub');
        const buttons = Array.from(document.querySelectorAll('.welcome-creator-path'));
        const catalog = getCreatorCatalog();
        if (subEl) subEl.textContent = catalog[route.recommended]?.sub || tr('ui.welcome.paths.subtitle', 'CraftIDE can route this idea into the most useful designer.');
        buttons.forEach((button) => {
            const pathId = button.getAttribute('data-path');
            const meta = catalog[pathId] || catalog.command;
            button.classList.toggle('is-recommended', pathId === route.recommended);
            const title = button.querySelector('.welcome-creator-path-title');
            const desc = button.querySelector('.welcome-creator-path-desc');
            if (title) title.textContent = meta.title;
            if (desc) desc.textContent = meta.desc;
        });
    }

    function buildJourneySnapshot(status = {}) {
        const request = getRequest();
        const gate = Guidance.buildReleaseQualityGate(status);
        const route = CreatorBrief.inferCreatorPath(request.prompt);
        return {
            request,
            route,
            gate,
        };
    }

    window.CraftIDEWelcomeFlow = {
        buildJourneySnapshot,
        getCreatorCatalog,
        getRequest,
        renderCreatorPaths,
        renderPreview,
    };

    if (window.CraftIDEStore?.subscribe) {
        window.CraftIDEStore.subscribe(() => {
            const deliveryEl = document.getElementById('welcome-delivery-status');
            if (deliveryEl) renderPreview();
        });
    }
})();
