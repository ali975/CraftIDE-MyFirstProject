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

    function interpolateText(template, params) {
        if (!params) return String(template || '');
        return Object.entries(params).reduce((acc, [key, value]) => {
            return acc.replaceAll(`{${key}}`, String(value));
        }, String(template || ''));
    }

    function tr(key, fallback, params) {
        if (window.Lang && typeof window.Lang.t === 'function') {
            const translated = window.Lang.t(key, params || {});
            if (translated !== key || !fallback) {
                return translated;
            }
        }
        if (!fallback) return key;
        return interpolateText(fallback, params);
    }

    function esc(value) {
        const div = document.createElement('div');
        div.textContent = String(value || '');
        return div.innerHTML;
    }

    function normalizeMode(rawMode) {
        return MODE_ALIAS[String(rawMode || '').toLowerCase()] || 'plugin';
    }

    function notify(message, type) {
        const level = type || 'info';
        if (window.CraftIDEAppState && typeof window.CraftIDEAppState.showNotification === 'function') {
            window.CraftIDEAppState.showNotification(message, level);
            return;
        }
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, level);
            return;
        }
        console.log(`[${level}] ${message}`);
    }

    window.CraftIDEUtils = {
        esc,
        interpolateText,
        normalizeMode,
        notify,
        tr,
    };
})();
