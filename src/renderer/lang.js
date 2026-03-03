/**
 * CraftIDE Language System (i18n)
 */

const DICT = {
    en: {
        // Common
        'lang.title': 'CraftIDE — Minecraft Development Studio',
        'btn.cancel': 'Cancel',
        'btn.create': 'Create',
        'btn.open': 'Open Folder',

        // Activity Bar
        'act.explorer': 'File Explorer',
        'act.search': 'Search',
        'act.mcTools': 'Minecraft Tools',
        'act.ai': 'AI Assistant',
        'act.vb': 'Visual Plugin Builder',
        'act.blockbench': 'Blockbench 3D',
        'act.server': 'Test Server',
        'act.image': 'Image Editor',
        'act.settings': 'Settings',

        // Sidebar - Explorer
        'exp.title': '📁 FILE EXPLORER',
        'exp.empty': 'No project opened yet',

        // Sidebar - Search
        'search.title': '🔍 SEARCH',
        'search.placeholder': 'Search in files...',

        // Sidebar - AI
        'ai.title': '🧠 AI ASSISTANT',
        'ai.welcome': 'Hello! I am CraftIDE AI Assistant. I can help you with Minecraft plugin development.',
        'ai.hint': 'Example: "Open a shop menu when players type /shop"',
        'ai.placeholder': 'Type your plugin idea...',

        // Welcome Tab
        'welcome.greeting': 'Welcome to CraftIDE',
        'welcome.subtitle': 'AI-Powered Minecraft Development Environment',
        'welcome.start': 'Getting Started',
        'welcome.newProject': '⛏️ Create New Project',
        'welcome.openFolder': '📁 Open Folder',
        'welcome.tools': 'Tools',
        'welcome.vb': '🧩 Visual Builder',
        'welcome.terminal': '🖥️ Terminal',
        'welcome.server': '🚀 Server Manager',

        // Modals
        'modal.newProject.title': 'Create New Project',
        'modal.platform': 'Platform',
        'modal.projectName': 'Project Name',
        'modal.mcVersion': 'MC Version',
        'modal.packageName': 'Package Name',
        'modal.deps': 'Dependencies (optional)',

        // Settings
        'settings.title': '⚙️ Settings',
        'settings.lang': 'Language',
        'settings.lang.en': 'English',
        'settings.lang.tr': 'Turkish',
        'settings.aiProvider': 'AI Provider',
        'settings.ollamaUrl': 'Ollama Local URL',
        'settings.openaiKey': 'OpenAI API Key',
        'settings.anthropicKey': 'Anthropic API Key',
        'settings.geminiKey': 'Gemini API Key',
        'settings.save': '💾 Save Settings',

        // Java Editor (Monaco)
        'editor.status.saving': 'Saving...',
        'editor.status.saved': 'Saved!',

        // Server Manager
        'server.title': '🚀 Test Server Manager',
        'server.desc': 'Start a local Minecraft server to test your plugins without leaving the IDE.',
        'server.type': 'Server Type',
        'server.version': 'Version',
        'server.start': '▶️ Start Server',
        'server.stop': '⏹️ Stop Server',
        'server.status.stopped': 'Stopped',

        // Notifications
        'notify.success': 'Success',
        'notify.error': 'Error',
        'notify.info': 'Info'
    },
    tr: {
        // Common
        'lang.title': 'CraftIDE — Minecraft Geliştirme Stüdyosu',
        'btn.cancel': 'İptal',
        'btn.create': 'Oluştur',
        'btn.open': 'Klasör Aç',

        // Activity Bar
        'act.explorer': 'Dosya Gezgini',
        'act.search': 'Arama',
        'act.mcTools': 'Minecraft Araçları',
        'act.ai': 'AI Asistan',
        'act.vb': 'Görsel Plugin Builder',
        'act.blockbench': 'Blockbench 3D Modelleme',
        'act.server': 'Test Sunucusu',
        'act.image': 'Resim Düzenleyici',
        'act.settings': 'Ayarlar',

        // Sidebar - Explorer
        'exp.title': '📁 DOSYA GEZGİNİ',
        'exp.empty': 'Henüz bir proje açılmadı',

        // Sidebar - Search
        'search.title': '🔍 ARAMA',
        'search.placeholder': 'Dosyalarda ara...',

        // Sidebar - AI
        'ai.title': '🧠 AI ASİSTAN',
        'ai.welcome': 'Merhaba! Ben CraftIDE AI Asistan. Minecraft plugin geliştirmenizde size yardımcı olabilirim.',
        'ai.hint': 'Örnek: "Oyuncular /shop yazınca bir mağaza menüsü açılsın"',
        'ai.placeholder': 'Plugin fikrini yaz...',

        // Welcome Tab
        'welcome.greeting': 'CraftIDE\'a Hoş Geldiniz',
        'welcome.subtitle': 'Yapay Zeka Destekli Minecraft Geliştirme Ortamı',
        'welcome.start': 'Başlangıç',
        'welcome.newProject': '⛏️ Yeni Proje Oluştur',
        'welcome.openFolder': '📁 Klasör Aç',
        'welcome.tools': 'Araçlar',
        'welcome.vb': '🧩 Görsel Builder',
        'welcome.terminal': '🖥️ Terminal',
        'welcome.server': '🚀 Sunucu Yöneticisi',

        // Modals
        'modal.newProject.title': 'Yeni Proje Oluştur',
        'modal.platform': 'Platform',
        'modal.projectName': 'Proje Adı',
        'modal.mcVersion': 'MC Versiyonu',
        'modal.packageName': 'Paket Adı',
        'modal.deps': 'Bağımlılıklar (opsiyonel)',

        // Settings
        'settings.title': '⚙️ Ayarlar',
        'settings.lang': 'Dil / Language',
        'settings.lang.en': 'English',
        'settings.lang.tr': 'Türkçe',
        'settings.aiProvider': 'Yapay Zeka Sağlayıcısı',
        'settings.ollamaUrl': 'Ollama Yerel URL',
        'settings.openaiKey': 'OpenAI API Anahtarı',
        'settings.anthropicKey': 'Anthropic API Anahtarı',
        'settings.geminiKey': 'Gemini API Anahtarı',
        'settings.save': '💾 Ayarları Kaydet',

        // Java Editor (Monaco)
        'editor.status.saving': 'Kaydediliyor...',
        'editor.status.saved': 'Kaydedildi!',

        // Server Manager
        'server.title': '🚀 Test Sunucu Yöneticisi',
        'server.desc': 'IDE\'den ayrılmadan eklentilerinizi test etmek için yerel bir test sunucusu başlatın.',
        'server.type': 'Sunucu Yazılımı',
        'server.version': 'Versiyon',
        'server.start': '▶️ Sunucuyu Başlat',
        'server.stop': '⏹️ Sunucuyu Durdur',
        'server.status.stopped': 'Durduruldu',

        // Notifications
        'notify.success': 'Başarılı',
        'notify.error': 'Hata',
        'notify.info': 'Bilgi'
    }
};

class LangManager {
    constructor() {
        this.currentLang = localStorage.getItem('setting-language') || 'en';
        document.documentElement.lang = this.currentLang;
    }

    setLanguage(lang) {
        if (!['en', 'tr'].includes(lang)) lang = 'en';
        this.currentLang = lang;
        localStorage.setItem('setting-language', lang);
        document.documentElement.lang = lang;
        this.applyTranslations();

        // Refresh menus, etc. if needed
        if (typeof rebuildContextMenu === 'function') rebuildContextMenu();
    }

    t(key, params = {}) {
        let text = DICT[this.currentLang][key] || DICT['en'][key] || key;
        for (let k in params) {
            text = text.replace(`{${k}}`, params[k]);
        }
        return text;
    }

    applyTranslations() {
        // Elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.type === 'button' || el.type === 'submit') {
                    el.value = this.t(key);
                } else if (el.placeholder) {
                    el.placeholder = this.t(key);
                }
            } else {
                // If the element has child HTML elements we want to preserve, this might wipe them out 
                // if we're not careful. Usually it's text.
                el.innerText = this.t(key);
            }
        });

        // Elements with data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = this.t(el.getAttribute('data-i18n-title'));
        });

        document.title = this.t('lang.title');
    }
}

window.Lang = new LangManager();

window.addEventListener('DOMContentLoaded', () => {
    window.Lang.applyTranslations();
});
