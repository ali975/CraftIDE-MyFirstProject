(function () {
    const STORAGE_KEY = 'craftide.creator.metrics';

    function safeNow() {
        return Date.now();
    }

    function loadMetrics() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    function saveMetrics(metrics) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
    }

    function ensureJourney(id) {
        const metrics = loadMetrics();
        if (!metrics[id]) {
            metrics[id] = {
                startedAt: safeNow(),
                steps: {},
                meta: {},
            };
            saveMetrics(metrics);
        }
        return metrics[id];
    }

    function startJourney(meta = {}) {
        const id = `journey_${safeNow()}_${Math.random().toString(36).slice(2, 8)}`;
        const metrics = loadMetrics();
        metrics[id] = {
            startedAt: safeNow(),
            steps: {},
            meta,
        };
        saveMetrics(metrics);
        return id;
    }

    function markStep(journeyId, step, payload = {}) {
        if (!journeyId || !step) return null;
        const metrics = loadMetrics();
        const journey = metrics[journeyId] || ensureJourney(journeyId);
        journey.steps[step] = {
            at: safeNow(),
            payload,
        };
        metrics[journeyId] = journey;
        saveMetrics(metrics);
        return journey;
    }

    function finishJourney(journeyId, payload = {}) {
        if (!journeyId) return null;
        const metrics = loadMetrics();
        const journey = metrics[journeyId] || ensureJourney(journeyId);
        journey.finishedAt = safeNow();
        journey.result = payload;
        metrics[journeyId] = journey;
        saveMetrics(metrics);
        return journey;
    }

    function summarizeJourneys(limit = 20) {
        const metrics = loadMetrics();
        return Object.entries(metrics)
            .map(([id, journey]) => ({
                id,
                startedAt: journey.startedAt || 0,
                finishedAt: journey.finishedAt || 0,
                totalMs: journey.finishedAt && journey.startedAt ? Math.max(0, journey.finishedAt - journey.startedAt) : null,
                steps: Object.keys(journey.steps || {}),
                meta: journey.meta || {},
                result: journey.result || {},
            }))
            .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
            .slice(0, limit);
    }

    function getRawJourneys(metricsOverride, limit) {
        const metrics = metricsOverride || loadMetrics();
        return Object.values(metrics)
            .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
            .slice(0, limit || 50);
    }

    function getFirstWorkingBuildTime(metricsOverride) {
        for (const j of getRawJourneys(metricsOverride)) {
            const buildStep = (j.steps || {})['guaranteed_build_passed'];
            if (buildStep && j.startedAt && buildStep.at) {
                return Math.max(0, buildStep.at - j.startedAt);
            }
        }
        return null;
    }

    function getBuildSuccessRate(metricsOverride) {
        const journeys = getRawJourneys(metricsOverride);
        const relevant = journeys.filter((j) => j.steps && (j.steps['guaranteed_build_passed'] || j.steps['guaranteed_build_failed']));
        if (!relevant.length) return null;
        const passed = relevant.filter((j) => j.steps['guaranteed_build_passed']).length;
        return Math.round((passed / relevant.length) * 100);
    }

    function getScenarioPassRate(metricsOverride) {
        const journeys = getRawJourneys(metricsOverride);
        const relevant = journeys.filter((j) => j.steps && j.steps['scenario_run']);
        if (!relevant.length) return null;
        let totalPassed = 0;
        let totalTests = 0;
        for (const j of relevant) {
            const p = (j.steps['scenario_run'].payload) || {};
            totalPassed += Number(p.passed || 0);
            totalTests += Number(p.total || 0);
        }
        if (!totalTests) return null;
        return Math.round((totalPassed / totalTests) * 100);
    }

    function getManualFixRate(metricsOverride) {
        const journeys = getRawJourneys(metricsOverride);
        const relevant = journeys.filter((j) => j.steps && (j.steps['guaranteed_build_passed'] || j.steps['guaranteed_build_failed']));
        if (!relevant.length) return null;
        const multiAttempt = relevant.filter((j) => {
            const step = j.steps['guaranteed_build_passed'] || j.steps['guaranteed_build_failed'];
            return step && Number((step.payload || {}).attempts || 0) > 1;
        }).length;
        return Math.round((multiAttempt / relevant.length) * 100);
    }

    function getRecommendedRouteAccuracy(metricsOverride) {
        const journeys = getRawJourneys(metricsOverride);
        const relevant = journeys.filter((j) => j.steps && j.steps['creator_path_opened']);
        if (!relevant.length) return null;
        const matched = relevant.filter((j) => {
            const p = (j.steps['creator_path_opened'].payload) || {};
            return p.pathId && p.recommendedRoute && p.pathId === p.recommendedRoute;
        }).length;
        return Math.round((matched / relevant.length) * 100);
    }

    function aggregateTelemetry(metricsOverride) {
        const raw = metricsOverride || loadMetrics();
        return {
            journeyCount: Object.keys(raw).length,
            firstWorkingBuildMs: getFirstWorkingBuildTime(raw),
            buildSuccessRate: getBuildSuccessRate(raw),
            scenarioPassRate: getScenarioPassRate(raw),
            manualFixRate: getManualFixRate(raw),
            recommendedRouteAccuracy: getRecommendedRouteAccuracy(raw),
            capturedAt: Date.now(),
        };
    }

    const api = {
        aggregateTelemetry,
        finishJourney,
        getBuildSuccessRate,
        getFirstWorkingBuildTime,
        getManualFixRate,
        getRecommendedRouteAccuracy,
        getScenarioPassRate,
        loadMetrics,
        markStep,
        startJourney,
        summarizeJourneys,
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (typeof window !== 'undefined') {
        window.CraftIDEMetrics = api;
    }
})();
