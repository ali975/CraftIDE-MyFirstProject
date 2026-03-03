/**
 * CraftIDE i18n — Çoklu Dil Desteği
 * 
 * Türkçe (varsayılan) ve İngilizce arasında geçiş yapar.
 * Tüm UI metinleri bu dosyadan çekilir.
 */

export type Locale = 'tr' | 'en';

let currentLocale: Locale = 'tr';

export function setLocale(locale: Locale): void {
    currentLocale = locale;
}

export function getLocale(): Locale {
    return currentLocale;
}

export function t(key: string): string {
    const bundle = TRANSLATIONS[currentLocale] || TRANSLATIONS.tr;
    return bundle[key] || TRANSLATIONS.tr[key] || key;
}

// ─── Çeviri Sözlükleri  ─────────────────────────────────────

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
    tr: {
        // Genel
        'app.name': 'CraftIDE',
        'app.subtitle': 'Minecraft Geliştirme Stüdyosu',

        // Welcome
        'welcome.title': 'CraftIDE\'ye Hoş Geldiniz!',
        'welcome.newProject': '🚀 Yeni Plugin Oluştur',
        'welcome.openProject': '📂 Mevcut Projeyi Aç',
        'welcome.templateMarket': '📦 Şablon Market',
        'welcome.aiPrompt': '💬 AI ile Plugin Oluştur:',
        'welcome.aiPlaceholder': 'Ne tür bir plugin istiyorsun? Örn: "ekonomi shop sistemi"',
        'welcome.tutorials': '🎓 Eğitimler',
        'welcome.tutorial1': 'İlk Plugin\'ini 5 Dakikada Yap',
        'welcome.tutorial2': 'Skript\'le Hızlı Başlangıç',
        'welcome.tutorial3': 'AI ile Plugin Geliştirme',

        // Scaffolder
        'scaffolder.title': 'Yeni Proje Oluştur',
        'scaffolder.projectType': 'Proje Türü',
        'scaffolder.mcVersion': 'Minecraft Versiyonu',
        'scaffolder.projectName': 'Proje Adı',
        'scaffolder.packageName': 'Paket Adı',
        'scaffolder.dependencies': 'Bağımlılıklar',
        'scaffolder.creating': 'Proje oluşturuluyor...',
        'scaffolder.success': 'Proje başarıyla oluşturuldu!',

        // AI
        'ai.chatTitle': 'AI Asistan',
        'ai.thinking': 'Düşünüyor...',
        'ai.designing': 'Tasarlanıyor...',
        'ai.coding': 'Kodlanıyor...',
        'ai.validating': 'Doğrulanıyor...',
        'ai.complete': 'Tamamlandı!',
        'ai.approveDesign': 'Tasarımı Onayla',
        'ai.cancelDesign': 'İptal',
        'ai.inputPlaceholder': 'Mesajınızı yazın...',
        'ai.noProvider': 'AI sağlayıcısı yapılandırılmadı.',

        // Build
        'build.building': 'Build ediliyor...',
        'build.success': 'Build başarılı!',
        'build.failed': 'Build başarısız.',
        'build.noBuildFile': 'Build dosyası bulunamadı.',
        'build.showJar': 'JAR Dosyasını Göster',
        'build.copyToServer': 'Sunucuya Kopyala',

        // Server
        'server.title': 'Test Sunucusu',
        'server.start': '▶ Başlat',
        'server.stop': '⬛ Durdur',
        'server.restart': '🔄 Yenile',
        'server.running': 'Çalışıyor',
        'server.stopped': 'Kapalı',
        'server.starting': 'Başlatılıyor...',
        'server.stopping': 'Kapatılıyor...',
        'server.commandPlaceholder': 'Sunucu komutu girin...',
        'server.deployed': 'Plugin sunucuya deploy edildi!',

        // Visual Builder
        'visual.title': 'Görsel Plugin Builder',
        'visual.importCode': '📥 Koddan İçe Aktar',
        'visual.exportJava': '☕ Java Olarak Dışa Aktar',
        'visual.exportSkript': '📜 Skript Olarak Dışa Aktar',
        'visual.clear': '🗑️ Temizle',
        'visual.properties': '📋 Özellikler',
        'visual.selectNode': 'Bir düğüm seçin',

        // 3D Engine
        '3d.title': '3D Geometri Motoru',
        '3d.particle': '🌟 Parçacık',
        '3d.vector': '📐 Vektör',
        '3d.structure': '🧱 Yapı',
        '3d.copyCode': '📋 Kopyala',
        '3d.insertCode': '📥 Editöre Ekle',

        // Template Market
        'market.title': 'Template Market',
        'market.subtitle': 'Hazır şablonlarla hızlıca plugin geliştirmeye başla!',
        'market.searchPlaceholder': '🔍 Şablon ara...',
        'market.all': 'Tümü',
    },

    en: {
        'app.name': 'CraftIDE',
        'app.subtitle': 'Minecraft Development Studio',

        'welcome.title': 'Welcome to CraftIDE!',
        'welcome.newProject': '🚀 Create New Plugin',
        'welcome.openProject': '📂 Open Existing Project',
        'welcome.templateMarket': '📦 Template Market',
        'welcome.aiPrompt': '💬 Create Plugin with AI:',
        'welcome.aiPlaceholder': 'What kind of plugin do you want? E.g: "economy shop system"',
        'welcome.tutorials': '🎓 Tutorials',
        'welcome.tutorial1': 'Create Your First Plugin in 5 Minutes',
        'welcome.tutorial2': 'Quick Start with Skript',
        'welcome.tutorial3': 'Plugin Development with AI',

        'scaffolder.title': 'Create New Project',
        'scaffolder.projectType': 'Project Type',
        'scaffolder.mcVersion': 'Minecraft Version',
        'scaffolder.projectName': 'Project Name',
        'scaffolder.packageName': 'Package Name',
        'scaffolder.dependencies': 'Dependencies',
        'scaffolder.creating': 'Creating project...',
        'scaffolder.success': 'Project created successfully!',

        'ai.chatTitle': 'AI Assistant',
        'ai.thinking': 'Thinking...',
        'ai.designing': 'Designing...',
        'ai.coding': 'Coding...',
        'ai.validating': 'Validating...',
        'ai.complete': 'Complete!',
        'ai.approveDesign': 'Approve Design',
        'ai.cancelDesign': 'Cancel',
        'ai.inputPlaceholder': 'Type your message...',
        'ai.noProvider': 'AI provider not configured.',

        'build.building': 'Building...',
        'build.success': 'Build successful!',
        'build.failed': 'Build failed.',
        'build.noBuildFile': 'No build file found.',
        'build.showJar': 'Show JAR File',
        'build.copyToServer': 'Copy to Server',

        'server.title': 'Test Server',
        'server.start': '▶ Start',
        'server.stop': '⬛ Stop',
        'server.restart': '🔄 Restart',
        'server.running': 'Running',
        'server.stopped': 'Stopped',
        'server.starting': 'Starting...',
        'server.stopping': 'Stopping...',
        'server.commandPlaceholder': 'Enter server command...',
        'server.deployed': 'Plugin deployed to server!',

        'visual.title': 'Visual Plugin Builder',
        'visual.importCode': '📥 Import from Code',
        'visual.exportJava': '☕ Export as Java',
        'visual.exportSkript': '📜 Export as Skript',
        'visual.clear': '🗑️ Clear',
        'visual.properties': '📋 Properties',
        'visual.selectNode': 'Select a node',

        '3d.title': '3D Geometry Engine',
        '3d.particle': '🌟 Particle',
        '3d.vector': '📐 Vector',
        '3d.structure': '🧱 Structure',
        '3d.copyCode': '📋 Copy',
        '3d.insertCode': '📥 Insert to Editor',

        'market.title': 'Template Market',
        'market.subtitle': 'Quickly start plugin development with ready-made templates!',
        'market.searchPlaceholder': '🔍 Search templates...',
        'market.all': 'All',
    },
};
