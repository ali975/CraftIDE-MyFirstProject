/**
 * CraftIDE Language System (i18n)
 */

const DICT = {
    en: require('./locales/en.json'),
    tr: require('./locales/tr.json'),
};

class LangManager {
    constructor() {
        const initialLang = localStorage.getItem('setting-language') || 'en';
        this.currentLang = DICT[initialLang] ? initialLang : 'en';
        document.documentElement.lang = this.currentLang;
    }

    setLanguage(lang) {
        if (!['en', 'tr'].includes(lang)) lang = 'en';
        this.currentLang = lang;
        localStorage.setItem('setting-language', lang);
        document.documentElement.lang = lang;
        this.applyTranslations();

        if (typeof window.rebuildContextMenu === 'function') window.rebuildContextMenu();
        document.dispatchEvent(new CustomEvent('lang:changed', { detail: { lang: this.currentLang } }));
    }

    t(key, params = {}) {
        const currentDict = DICT[this.currentLang] || DICT.en || {};
        let text = currentDict[key] || DICT.en[key] || key;
        for (const [k, v] of Object.entries(params)) {
            text = text.replaceAll(`{${k}}`, String(v));
        }
        return text;
    }

    localizeMessage(rawMessage) {
        let message = String(rawMessage || '');
        if (!message) return message;

        if (this.currentLang === 'en') {
            const replacements = [
                [/Önce bir proje açın!?/gi, 'Open a project first!'],
                [/Klasör oluşturulamadı!?/gi, 'Could not create folder!'],
                [/Dosya okunamadı!?/gi, 'Could not read file!'],
                [/Dosya kaydedilemedi!?/gi, 'Could not save file!'],
                [/Ayarlar kaydedildi\.?/gi, 'Settings saved.'],
                [/Build başarılı!?/gi, 'Build succeeded!'],
                [/Build hatası!?/gi, 'Build failed!'],
                [/Build başarısız oldu\.?/gi, 'Build failed.'],
                [/Sunucu zaten çalışıyor\.?/gi, 'Server is already running.'],
                [/Sunucu şu an çalışmıyor\.?/gi, 'Server is not running right now.'],
                [/Sunucu durduruluyor\.\.\./gi, 'Stopping server...'],
                [/Derleniyor\.\.\./gi, 'Building...'],
                [/Derleme başarılı!?/gi, 'Build completed successfully!'],
                [/Derleme hatası:/gi, 'Build error:'],
                [/Yükleme hatası:/gi, 'Deploy error:'],
                [/Bulunamadı!?/gi, 'Not found!'],
                [/Projeyi derleyip sunucuya aktarıyoruz\.\.\./gi, 'Building project and deploying to server...'],
                [/Sunucu yenileniyor\.\.\./gi, 'Reloading server...'],
                [/Skript dosyası kaydedildi!?/gi, 'Skript file saved!'],
                [/Skript sunucuya yüklendi!?/gi, 'Skript deployed to server!'],
                [/Test sunucusu çalışıyor!?/gi, 'Test server is running!'],
                [/Kod proje dosyasına yazılıyor\.\.\./gi, 'Writing code into project file...'],
                [/Plugin adı gerekli!?/gi, 'Plugin name is required!'],
                [/Yol kopyaland[ıi]/gi, 'Path copied'],
                [/Terminal dizini de[gğ]i[sş]tirildi/gi, 'Terminal directory changed'],
                [/Dosya a[gğ]ac[ıi] yenilendi/gi, 'File tree refreshed'],
                [/Sunucuda hata:/gi, 'Server error:'],
                [/JAR bulunamad[ıi]/gi, 'JAR not found'],
                [/Java dosyas[ıi] g[uü]ncellendi:/gi, 'Java file updated:'],
                [/Önce Visual Builder'?a blok ekleyin!?/gi, 'Add blocks in Visual Builder first!'],
                [/CraftIDE'ye ho[sş] geldiniz! Yeni bir proje olu[sş]turarak ba[sş]lay[ıi]n\./gi, 'Welcome to CraftIDE! Start by creating a new project.'],
                [/Temeller: Sol men[uü]den dosyalar[ıi]n[ıi]z[ıi] y[oö]netebilir, alttan terminali kullanabilirsiniz\./gi, 'Basics: Manage files from the left panel and use the terminal below.'],
                [/Hata:/gi, 'Error:'],
                [/başarıyla oluşturuldu/gi, 'created successfully'],
                [/oluşturuldu/gi, 'created'],
                [/açıldı/gi, 'opened'],
                [/kaydedildi/gi, 'saved'],
                [/Güncelleyici durumu kullanılamıyor\.?/gi, 'Updater state is unavailable.'],
                [/Güncelleyici beklemede\.?/gi, 'Updater is idle.'],
                [/Yeni sürüm hazır: v/gi, 'New version available: v'],
                [/Güncelleme indirildi: v/gi, 'Update downloaded: v'],
                [/En son resmi sürüm kontrol ediliyor\.\.\./gi, 'Checking latest official release...'],
                [/Doğrulama başarısız: /gi, 'Verification failed: '],
                [/Resmi güncelleme kontrolü başarısız: /gi, 'Official update check failed: '],
                [/Güncelleme indirilemedi: /gi, 'Update download failed: '],
                [/Kurulum başlatılamadı: /gi, 'Install could not be started: '],
                [/Kurulumun başlaması için önce indirilmiş bir güncelleme gerekli\.?/gi, 'A downloaded update is required before installation can start.'],
                [/Güncellemeyi kurmak için uygulama yeniden başlatılıyor\.?/gi, 'The app is restarting to install the update.'],
                [/Kanal kilidi: /gi, 'Channel locked: '],
                [/Resmi etiket: /gi, 'Official tag: '],
                [/Checksum dosyası: /gi, 'Checksums asset: '],
                [/Yerel app\.asar SHA256: /gi, 'Local app.asar SHA256: '],
                [/Bir neden sağlanmadı\.?/gi, 'No reason provided.'],
                [/Detay yok\.?/gi, 'No detail.'],
                [/Yerel sürüm bütünlüğü resmi release checksum dosyalarıyla karşılaştırılıyor\.\.\./gi, 'Checking local build integrity against official release checksums...'],
                [/Taşınabilir sürümler uygulama içi otomatik güncellemeyi desteklemez\. Kurulum sürümünü kullanın\.?/gi, 'Portable builds do not support in-app auto update. Use the installer build.'],
                [/Taşınabilir sürümler bütünlük doğrulaması için uygun değildir\. Kurulum sürümünü kullanın\.?/gi, 'Portable builds are not eligible for integrity verification. Use the installer build.'],
                [/Bu sürüm için yerel app\.asar kullanılamıyor\.?/gi, 'Local app.asar is not available for this build.'],
                [/Yerel app\.asar okunamadı: /gi, 'Local app.asar could not be read: '],
                [/Bu sürüm için resmi GitHub release bulunamadı\.?/gi, 'No official GitHub release found for this version.'],
                [/Release checksum dosyası eksik\.?/gi, 'Release checksum asset missing.'],
            ];
            replacements.forEach(([pattern, value]) => {
                message = message.replace(pattern, value);
            });
            return message;
        }

        if (this.currentLang === 'tr') {
            const replacements = [
                [/Open a project first!?/gi, 'Önce bir proje açın!'],
                [/Settings saved\.?/gi, 'Ayarlar kaydedildi.'],
                [/Build succeeded!?/gi, 'Build başarılı!'],
                [/Build failed!?/gi, 'Build hatası!'],
                [/Updater state is unavailable\.?/gi, 'Güncelleyici durumu kullanılamıyor.'],
                [/Updater is idle\.?/gi, 'Güncelleyici beklemede.'],
                [/New version available: v/gi, 'Yeni sürüm hazır: v'],
                [/Update downloaded: v/gi, 'Güncelleme indirildi: v'],
                [/Checking latest official release\.\.\./gi, 'En son resmi sürüm kontrol ediliyor...'],
                [/Verification failed: /gi, 'Doğrulama başarısız: '],
                [/Official update check failed: /gi, 'Resmi güncelleme kontrolü başarısız: '],
                [/Update download failed: /gi, 'Güncelleme indirilemedi: '],
                [/Install could not be started: /gi, 'Kurulum başlatılamadı: '],
                [/A downloaded update is required before installation can start\.?/gi, 'Kurulumun başlaması için önce indirilmiş bir güncelleme gerekli.'],
                [/The app is restarting to install the update\.?/gi, 'Güncellemeyi kurmak için uygulama yeniden başlatılıyor.'],
                [/Channel locked: /gi, 'Kanal kilidi: '],
                [/Official tag: /gi, 'Resmi etiket: '],
                [/Checksums asset: /gi, 'Checksum dosyası: '],
                [/Local app\.asar SHA256: /gi, 'Yerel app.asar SHA256: '],
                [/No reason provided\.?/gi, 'Bir neden sağlanmadı.'],
                [/No detail\.?/gi, 'Detay yok.'],
                [/Checking local build integrity against official release checksums\.\.\./gi, 'Yerel sürüm bütünlüğü resmi release checksum dosyalarıyla karşılaştırılıyor...'],
                [/Portable builds do not support in-app auto update\. Use the installer build\.?/gi, 'Taşınabilir sürümler uygulama içi otomatik güncellemeyi desteklemez. Kurulum sürümünü kullanın.'],
                [/Portable builds are not eligible for integrity verification\. Use the installer build\.?/gi, 'Taşınabilir sürümler bütünlük doğrulaması için uygun değildir. Kurulum sürümünü kullanın.'],
                [/Local app\.asar is not available for this build\.?/gi, 'Bu sürüm için yerel app.asar kullanılamıyor.'],
                [/Local app\.asar could not be read: /gi, 'Yerel app.asar okunamadı: '],
                [/No official GitHub release found for this version\.?/gi, 'Bu sürüm için resmi GitHub release bulunamadı.'],
                [/Release checksum asset missing\.?/gi, 'Release checksum dosyası eksik.'],
            ];
            replacements.forEach(([pattern, value]) => {
                message = message.replace(pattern, value);
            });
        }
        return message;
    }

    _setText(selector, key, params = {}) {
        const el = document.querySelector(selector);
        if (el) el.textContent = this.t(key, params);
    }

    _setTitle(selector, key, params = {}) {
        const el = document.querySelector(selector);
        if (el) el.title = this.t(key, params);
    }

    _setPlaceholder(selector, key, params = {}) {
        const el = document.querySelector(selector);
        if (el) el.placeholder = this.t(key, params);
    }

    _setOption(selector, value, key) {
        const el = document.querySelector(`${selector} option[value="${value}"]`);
        if (el) el.textContent = this.t(key);
    }

    _setIconLinkText(selector, key) {
        const el = document.querySelector(selector);
        if (!el) return;
        const svg = el.querySelector('svg');
        if (svg && svg.parentElement === el) {
            el.innerHTML = `${svg.outerHTML} ${this.t(key)}`;
            return;
        }
        el.textContent = this.t(key);
    }

    _setContextText(action, key, icon = '') {
        const el = document.querySelector(`#context-menu .context-item[data-action="${action}"]`);
        if (!el) return;
        el.textContent = icon ? `${icon} ${this.t(key)}` : this.t(key);
    }

    applyStaticTranslations() {
        const currentPath = window.CraftIDEAppState?.getCurrentFilePath?.();
        if (!currentPath) this._setText('#titlebar-filename', 'ui.titlebar.welcome');

        this._setTitle('#btn-minimize', 'ui.title.minimize');
        this._setTitle('#btn-maximize', 'ui.title.maximize');
        this._setTitle('#btn-close', 'ui.title.close');

        this._setTitle('#btn-new-file', 'ui.sidebar.newFile');
        this._setTitle('#btn-new-folder', 'ui.sidebar.newFolder');
        this._setTitle('#btn-refresh-tree', 'ui.sidebar.refresh');
        this._setTitle('#btn-open-folder', 'ui.sidebar.openFolder');

        this._setText('#visual-builder-container .vb-toolbar-title', 'ui.vb.title');
        this._setText('#visual-builder-container .vb-toolbar-hint', 'ui.vb.hint');
        this._setIconLinkText('#btn-vb-save', 'ui.vb.save');
        this._setIconLinkText('#btn-vb-load', 'ui.vb.load');
        this._setIconLinkText('#btn-vb-templates', 'ui.vb.templates');
        this._setIconLinkText('#btn-vb-generate', 'ui.vb.generate');
        this._setIconLinkText('#btn-vb-clear', 'ui.vb.clear');
        this._setIconLinkText('#btn-vb-deploy', 'ui.vb.deployTest');
        this._setOption('#vb-mode-select', 'plugin', 'mode.plugin');
        this._setOption('#vb-mode-select', 'fabric', 'mode.fabric');
        this._setOption('#vb-mode-select', 'forge', 'mode.forge');
        this._setOption('#vb-mode-select', 'skript', 'mode.skript');

        // VB Empty hint
        this._setText('#vb-empty-hint h3', 'ui.vb.empty.title');
        this._setText('#vb-empty-hint > p', 'ui.vb.empty.desc');
        const vbSteps = document.querySelectorAll('#vb-empty-hint .vb-step');
        const stepKeys = ['ui.vb.empty.step1', 'ui.vb.empty.step2', 'ui.vb.empty.step3', 'ui.vb.empty.step4', 'ui.vb.empty.step5'];
        vbSteps.forEach((step, i) => {
            if (stepKeys[i]) {
                const span = step.querySelector('span');
                if (span) { step.innerHTML = span.outerHTML + ' ' + this.t(stepKeys[i]); }
                else { step.textContent = this.t(stepKeys[i]); }
            }
        });
        this._setIconLinkText('#btn-vb-load-template-hint', 'ui.vb.empty.template');

        // VB Templates modal
        this._setText('#vb-templates-modal .modal-header h2', 'ui.vb.templatesTitle');
        this._setText('#vb-templates-modal .modal-body > p', 'ui.vb.templatesDesc');

        // GUI Builder
        this._setOption('#gb-rows-select', '1', 'ui.gui.row1');
        this._setOption('#gb-rows-select', '2', 'ui.gui.row2');
        this._setOption('#gb-rows-select', '3', 'ui.gui.row3');
        this._setOption('#gb-rows-select', '4', 'ui.gui.row4');
        this._setOption('#gb-rows-select', '5', 'ui.gui.row5');
        this._setOption('#gb-rows-select', '6', 'ui.gui.row6');
        const gbTitleInput = document.getElementById('gb-gui-title');
        if (gbTitleInput) gbTitleInput.placeholder = this.t('ui.gui.titlePlaceholder');
        this._setIconLinkText('#btn-gb-export-vb', 'ui.gui.exportVB');
        this._setIconLinkText('#btn-gb-generate-code', 'ui.gui.generate');
        this._setIconLinkText('#btn-gb-clear-gb', 'ui.gui.clear');
        const gbHint = document.querySelector('#gb-grid-area > div:first-child');
        if (gbHint && gbHint.style) gbHint.textContent = this.t('ui.gui.hint');
        this._setText('#gb-slot-title', 'ui.gui.slotSelect');
        const gbLabels = document.querySelectorAll('#gb-config-panel > label');
        const gbLabelKeys = ['ui.gui.material', 'ui.gui.displayName', 'ui.gui.description', 'ui.gui.clickAction'];
        gbLabelKeys.forEach((key, i) => { if (gbLabels[i]) gbLabels[i].textContent = this.t(key); });
        this._setOption('#gb-click-action', 'none', 'ui.gui.action.none');
        this._setOption('#gb-click-action', 'command', 'ui.gui.action.command');
        this._setOption('#gb-click-action', 'give', 'ui.gui.action.give');
        this._setOption('#gb-click-action', 'close', 'ui.gui.action.close');
        const gbValueInput = document.getElementById('gb-click-value');
        if (gbValueInput) gbValueInput.placeholder = this.t('ui.gui.valuePlaceholder');
        this._setText('#btn-gb-apply-slot', 'ui.gui.apply');

        // Marketplace
        this._setText('#marketplace-container > div:first-child > span', 'ui.market.title');
        const mkSearch = document.getElementById('mk-search');
        if (mkSearch) mkSearch.placeholder = this.t('ui.market.search');
        this._setText('.mk-filter-btn[data-mode="all"]', 'ui.market.all');
        this._setText('#marketplace-container > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)', 'ui.market.publishTitle');
        this._setText('#marketplace-container > div:nth-child(2) > div:nth-child(2) > div:nth-child(2)', 'ui.market.publishHint');
        const mkLabels = document.querySelectorAll('#marketplace-container > div:nth-child(2) > div:nth-child(2) > label');
        if (mkLabels[0]) mkLabels[0].textContent = this.t('ui.market.name');
        if (mkLabels[1]) mkLabels[1].textContent = this.t('ui.market.desc');
        this._setText('#btn-mk-publish', 'ui.market.publish');

        // Recipe Creator
        this._setText('#recipe-creator-container > div:first-child > span', 'ui.recipe.title');
        this._setText('.rc-type-btn[data-type="shaped"]', 'ui.recipe.shaped');
        this._setText('.rc-type-btn[data-type="shapeless"]', 'ui.recipe.shapeless');
        this._setIconLinkText('#btn-rc-clear', 'ui.recipe.clear');
        this._setIconLinkText('#btn-rc-generate', 'ui.recipe.generate');
        this._setText('#recipe-creator-container div[style*="Crafting"]', 'ui.recipe.table');
        const rcResultLabel = document.querySelector('#recipe-creator-container div[style*="Sonuç"], #recipe-creator-container div[style*="Result"]');
        if (rcResultLabel) rcResultLabel.textContent = this.t('ui.recipe.result');
        this._setText('#rc-cell-config > div:first-child', 'ui.recipe.slotConfig');
        this._setText('#rc-result-config > div:first-child', 'ui.recipe.resultItem');
        const rcCellLabels = document.querySelectorAll('#rc-cell-config > label');
        if (rcCellLabels[0]) rcCellLabels[0].textContent = this.t('ui.recipe.material');
        if (rcCellLabels[1]) rcCellLabels[1].textContent = this.t('ui.recipe.count');
        const rcResultLabels = document.querySelectorAll('#rc-result-config > label');
        if (rcResultLabels[0]) rcResultLabels[0].textContent = this.t('ui.recipe.material');
        if (rcResultLabels[1]) rcResultLabels[1].textContent = this.t('ui.recipe.name');
        if (rcResultLabels[2]) rcResultLabels[2].textContent = this.t('ui.recipe.lore');
        if (rcResultLabels[3]) rcResultLabels[3].textContent = this.t('ui.recipe.count');

        // Permission Tree
        this._setText('#permission-tree-container > div:first-child > span', 'ui.permission.title');
        this._setText('#btn-pt-add-child', 'ui.permission.addSub');
        this._setIconLinkText('#btn-pt-delete', 'ui.permission.delete');
        this._setText('#btn-pt-generate-yml', 'ui.permission.generateYml');
        this._setText('#btn-pt-generate-luckperms', 'ui.permission.generateLuckPerms');

        // Command Tree
        this._setText('#command-tree-container > div:first-child > span', 'ui.command.title');
        this._setText('#btn-ct-add-sub', 'ui.command.addSub');
        this._setText('#btn-ct-add-arg', 'ui.command.addArg');
        this._setIconLinkText('#btn-ct-delete', 'ui.command.delete');
        this._setText('#btn-ct-generate-java', 'ui.command.generateJava');
        this._setText('#btn-ct-generate-skript', 'ui.command.generateSkript');

        // Config Editor
        this._setText('#config-editor-container > div:first-child > span', 'ui.config.title');
        this._setText('#btn-config-raw-toggle', 'ui.config.rawYaml');
        this._setIconLinkText('#btn-config-save', 'ui.config.save');

        this._setText('#tab-bar .tab[data-tab="welcome"] .tab-name', 'ui.titlebar.welcome');
        this._setText('.welcome-col-left .welcome-section:nth-of-type(1) h2', 'ui.welcome.start');
        this._setIconLinkText('#wl-new-file', 'ui.welcome.newFile');
        this._setIconLinkText('#wl-open-file', 'ui.welcome.openFile');
        this._setIconLinkText('#wl-open-folder', 'ui.welcome.openFolder');
        this._setIconLinkText('#btn-new-project', 'ui.welcome.newProject');
        this._setIconLinkText('#wl-ai-create', 'ui.welcome.aiCreate');
        this._setText('.welcome-col-left .welcome-section:nth-of-type(2) h2', 'ui.welcome.recent');
        this._setText('#welcome-recent-list .welcome-recent-empty', 'ui.welcome.recentEmpty');
        this._setText('.welcome-col-right .welcome-section:nth-of-type(1) h2', 'ui.welcome.guides');
        this._setText('#wt-get-started .wt-title', 'ui.welcome.wt.getStarted.title');
        this._setText('#wt-get-started .wt-desc', 'ui.welcome.wt.getStarted.desc');
        this._setText('#wt-learn-basics .wt-title', 'ui.welcome.wt.learnBasics.title');
        this._setText('#btn-build-plugin .wt-title', 'ui.welcome.wt.build.title');
        this._setText('#btn-build-plugin .wt-desc', 'ui.welcome.wt.build.desc');
        this._setText('#btn-build-plugin .wt-badge', 'ui.welcome.badge.new');
        this._setText('#btn-test-server .wt-title', 'ui.welcome.wt.server.title');
        this._setText('#btn-test-server .wt-desc', 'ui.welcome.wt.server.desc');
        this._setText('#btn-test-server .wt-badge', 'ui.welcome.badge.new');
        this._setText('#btn-api-ref .wt-title', 'ui.welcome.wt.api.title');
        this._setText('#btn-api-ref .wt-desc', 'ui.welcome.wt.api.desc');
        this._setText('.welcome-col-right .welcome-section:nth-of-type(2) h2', 'ui.welcome.mcVersionTitle');
        this._setText('.welcome-col-right .welcome-section:nth-of-type(2) .welcome-mc-version label', 'ui.welcome.targetVersion');
        this._setText('.welcome-more-link', 'ui.welcome.more');

        const startupLabel = document.querySelector('.welcome-footer .welcome-checkbox');
        if (startupLabel) {
            const checkbox = startupLabel.querySelector('input');
            if (checkbox) {
                const textNode = Array.from(startupLabel.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
                if (textNode) textNode.nodeValue = ` ${this.t('ui.welcome.showOnStartup')}`;
                else startupLabel.appendChild(document.createTextNode(` ${this.t('ui.welcome.showOnStartup')}`));
            }
        }

        this._setText('#settings-container .settings-tab-header p', 'ui.settings.subtitle');
        const settingGroupTitles = document.querySelectorAll('#settings-container .setting-group h3');
        if (settingGroupTitles[0]) settingGroupTitles[0].textContent = this.t('ui.settings.group.ai');
        if (settingGroupTitles[1]) settingGroupTitles[1].textContent = this.t('ui.settings.group.editor');
        if (settingGroupTitles[2]) settingGroupTitles[2].textContent = this.t('ui.settings.group.project');

        const labels = document.querySelectorAll('#settings-container .setting-item label');
        const settingLabelKeys = [
            'settings.aiProvider',
            'ui.settings.model',
            'ui.settings.endpoint',
            'ui.settings.apiKey',
            'ui.settings.fontSize',
            'ui.settings.fontFamily',
            'ui.settings.tabSize',
            'ui.settings.minimap',
            'ui.settings.wordWrap',
            'ui.settings.defaultPlatform',
            'settings.lang',
        ];
        settingLabelKeys.forEach((key, idx) => {
            if (labels[idx]) labels[idx].textContent = this.t(key);
        });
        this._setOption('#setting-minimap', 'true', 'ui.option.on');
        this._setOption('#setting-minimap', 'false', 'ui.option.off');
        this._setOption('#setting-wordwrap', 'off', 'ui.option.off');
        this._setOption('#setting-wordwrap', 'on', 'ui.option.on');
        this._setOption('#setting-wordwrap', 'wordWrapColumn', 'ui.option.column');
        this._setOption('#setting-platform', 'paper', 'ui.server.type.paper');
        this._setOption('#setting-platform', 'spigot', 'ui.server.type.spigot');
        this._setOption('#setting-platform', 'fabric', 'ui.server.type.fabric');
        this._setOption('#setting-platform', 'skript', 'mode.skript');
        this._setOption('#setting-language', 'en', 'settings.lang.en');
        this._setOption('#setting-language', 'tr', 'settings.lang.tr');
        this._setOption('#setting-update-asset-preference', 'auto', 'ui.official.assetPreference.auto');
        this._setOption('#setting-update-asset-preference', 'setup', 'ui.official.assetPreference.setup');
        this._setOption('#setting-update-asset-preference', 'portable', 'ui.official.assetPreference.portable');

        this._setText('#server-manager-container .settings-tab-header h1', 'server.title');
        this._setText('#server-manager-container .settings-tab-header p', 'server.desc');
        this._setText('#btn-sm-start', 'server.start');
        this._setText('#btn-sm-stop', 'server.stop');
        this._setText('#btn-sm-deploy', 'ui.server.deploy');
        this._setTitle('#btn-sm-deploy', 'ui.server.deployTitle');
        this._setOption('#sm-type-select', 'paper', 'ui.server.type.paper');
        this._setOption('#sm-type-select', 'spigot', 'ui.server.type.spigot');
        this._setOption('#sm-type-select', 'fabric', 'ui.server.type.fabric');
        this._setOption('#sm-type-select', 'forge', 'ui.server.type.forge');
        this._setOption('#sm-type-select', 'vanilla', 'ui.server.type.vanilla');
        const inputMcSelect = document.getElementById('input-mc-version');
        if (inputMcSelect && inputMcSelect.options && inputMcSelect.options.length === 1) {
            inputMcSelect.options[0].textContent = this.t('ui.server.loadingVersions');
        }
        const smSelect = document.getElementById('sm-version-select');
        if (smSelect && smSelect.options && smSelect.options.length === 1) {
            smSelect.options[0].textContent = this.t('ui.server.loadingVersions');
        }
        this._setText('#sm-problems-panel > div:first-child', 'ui.server.problems');

        this._setText('.bottom-tab[data-btab="output"]', 'ui.bottom.output');
        this._setText('.bottom-tab[data-btab="problems"]', 'ui.bottom.problems');
        this._setTitle('#btn-toggle-panel', 'ui.bottom.toggle');

        const outputLine = document.querySelector('#output-output .terminal-line.dim');
        if (outputLine) outputLine.textContent = this.t('ui.output.placeholder');
        const problemsLine = document.querySelector('#problems-output .terminal-line.dim');
        if (problemsLine) problemsLine.textContent = this.t('ui.problems.none');
        this._setText('#status-problems', 'ui.status.problems');

        this._setContextText('newFile', 'ui.ctx.newFile', '📄');
        this._setContextText('newFolder', 'ui.ctx.newFolder', '📁');
        this._setContextText('rename', 'ui.ctx.rename', '✏️');
        this._setContextText('delete', 'ui.ctx.delete', '🗑️');
        this._setContextText('copyPath', 'ui.ctx.copyPath', '📋');
        this._setContextText('openInExplorer', 'ui.ctx.openExplorer', '📂');
        this._setContextText('openInTerminal', 'ui.ctx.openTerminal', '💻');

        this._setText('#modal-new-project .modal-header h2', 'modal.newProject.title');
        const recommended = document.querySelector('#modal-new-project .platform-card[data-platform="paper"] .platform-tag');
        if (recommended) recommended.textContent = this.t('ui.modal.recommended');
        this._setText('#label-project-name', 'modal.projectNameLabel');

        this._setText('#ob-step-0 h2', 'ui.onboard.step1.title');
        this._setText('#ob-step-0 p', 'ui.onboard.step1.desc');
        this._setText('#ob-next-0', 'ui.onboard.next');
        this._setText('#ob-step-1 h2', 'ui.onboard.step2.title');
        this._setText('#ob-step-1 p', 'ui.onboard.step2.desc');
        this._setText('#ob-step-1 label:nth-of-type(1)', 'ui.onboard.provider');
        this._setText('#ob-step-1 label:nth-of-type(2)', 'ui.onboard.model');
        this._setText('#ob-step-1 label:nth-of-type(3)', 'ui.onboard.endpoint');
        this._setText('#ob-step-1 label:nth-of-type(4)', 'ui.onboard.apikey');
        this._setOption('#ob-ai-provider', 'ollama', 'ui.onboard.provider.ollama');
        this._setOption('#ob-ai-provider', 'lmstudio', 'ui.onboard.provider.lmstudio');
        this._setOption('#ob-ai-provider', 'openai', 'ui.onboard.provider.openai');
        this._setOption('#ob-ai-provider', 'anthropic', 'ui.onboard.provider.anthropic');
        this._setOption('#ob-ai-provider', 'google', 'ui.onboard.provider.google');
        this._setText('#ob-back-1', 'ui.onboard.back');
        this._setText('#ob-skip-ai', 'ui.onboard.skip');
        this._setText('#ob-next-1', 'ui.onboard.next');
        this._setText('#ob-step-2 h2', 'ui.onboard.step3.title');
        this._setText('#ob-step-2 p', 'ui.onboard.step3.desc');
        this._setText('#ob-back-2', 'ui.onboard.back');
        this._setText('#ob-blank-start', 'ui.onboard.blank');
    }

    applyTranslations(root = document) {
        const scope = root && typeof root.querySelectorAll === 'function' ? root : document;

        scope.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                const input = el;
                if (input.type === 'button' || input.type === 'submit') input.value = this.t(key);
                else input.placeholder = this.t(key);
            } else {
                el.textContent = this.t(key);
            }
        });

        scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (!key) return;
            if ('placeholder' in el) el.placeholder = this.t(key);
        });

        scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
            const key = el.getAttribute('data-i18n-title');
            if (!key) return;
            el.title = this.t(key);
        });

        if (scope === document) {
            this.applyStaticTranslations();
            document.title = this.t('lang.title');
        }
    }
}

window.Lang = new LangManager();

window.addEventListener('DOMContentLoaded', () => {
    window.Lang.applyTranslations();
});

