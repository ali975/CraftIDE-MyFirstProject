/**
 * CraftIDE Renderer Store
 * Lightweight central state container for renderer modules.
 */
(() => {
    const listeners = new Set();

    const state = {
        ui: {
            activePanel: 'explorer',
            currentFile: null,
            theme: 'dark',
            contrast: 'normal',
            fontScale: 1,
        },
        project: {
            path: null,
            openTabs: 0,
        },
        runtime: {
            watcherActive: false,
            performanceMode: false,
            extensions: {},
        },
        ai: {
            provider: 'ollama',
            offlinePreferred: true,
        },
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getState() {
        return clone(state);
    }

    function emit() {
        const snapshot = getState();
        listeners.forEach((fn) => {
            try { fn(snapshot); } catch (err) { console.error(err); }
        });
    }

    function deepMerge(target, patch) {
        if (!patch || typeof patch !== 'object') return;
        Object.keys(patch).forEach((key) => {
            const nextVal = patch[key];
            if (nextVal && typeof nextVal === 'object' && !Array.isArray(nextVal)) {
                if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
                deepMerge(target[key], nextVal);
            } else {
                target[key] = nextVal;
            }
        });
    }

    function patchState(partial) {
        deepMerge(state, partial || {});
        emit();
    }

    function setPath(path, value) {
        const parts = String(path || '').split('.').filter(Boolean);
        if (!parts.length) return;
        let ptr = state;
        for (let i = 0; i < parts.length - 1; i += 1) {
            const p = parts[i];
            if (!ptr[p] || typeof ptr[p] !== 'object' || Array.isArray(ptr[p])) ptr[p] = {};
            ptr = ptr[p];
        }
        ptr[parts[parts.length - 1]] = value;
        emit();
    }

    function subscribe(fn) {
        if (typeof fn !== 'function') return () => {};
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    window.CraftIDEStore = {
        getState,
        patch: patchState,
        set: setPath,
        subscribe,
    };
})();
