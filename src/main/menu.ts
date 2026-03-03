import { Menu, BrowserWindow, dialog, shell } from 'electron';

/**
 * CraftIDE Uygulama Menüsü
 */
export function createApplicationMenu(): Menu {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: '⛏️ CraftIDE',
            submenu: [
                {
                    label: 'Hakkında',
                    click: () => {
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'CraftIDE Hakkında',
                            message: 'CraftIDE — Minecraft Development Studio',
                            detail: 'v0.1.0 Alpha\n\nAI-powered IDE for Minecraft plugin and Skript development.\n\n© 2024 CraftIDE Team',
                        });
                    },
                },
                { type: 'separator' },
                {
                    label: 'Ayarlar',
                    accelerator: 'CmdOrCtrl+,',
                    click: (_, win) => {
                        win?.webContents.send('open-settings');
                    },
                },
                { type: 'separator' },
                { role: 'quit', label: 'Çıkış' },
            ],
        },
        {
            label: 'Dosya',
            submenu: [
                {
                    label: 'Yeni Plugin Projesi',
                    accelerator: 'CmdOrCtrl+N',
                    click: (_, win) => {
                        win?.webContents.send('new-project');
                    },
                },
                {
                    label: 'Klasör Aç...',
                    accelerator: 'CmdOrCtrl+O',
                    click: async (_, win) => {
                        const result = await dialog.showOpenDialog({
                            properties: ['openDirectory'],
                            title: 'Proje Klasörü Aç',
                        });
                        if (!result.canceled && result.filePaths.length > 0) {
                            win?.webContents.send('open-folder', result.filePaths[0]);
                        }
                    },
                },
                {
                    label: 'Dosya Aç...',
                    accelerator: 'CmdOrCtrl+Shift+O',
                    click: async (_, win) => {
                        const result = await dialog.showOpenDialog({
                            properties: ['openFile'],
                            title: 'Dosya Aç',
                            filters: [
                                { name: 'All Files', extensions: ['*'] },
                                { name: 'Java', extensions: ['java'] },
                                { name: 'Skript', extensions: ['sk'] },
                                { name: 'YAML', extensions: ['yml', 'yaml'] },
                                { name: 'JSON', extensions: ['json'] },
                            ],
                        });
                        if (!result.canceled && result.filePaths.length > 0) {
                            win?.webContents.send('open-file', result.filePaths[0]);
                        }
                    },
                },
                { type: 'separator' },
                {
                    label: 'Kaydet',
                    accelerator: 'CmdOrCtrl+S',
                    click: (_, win) => {
                        win?.webContents.send('save-file');
                    },
                },
                {
                    label: 'Farklı Kaydet...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: (_, win) => {
                        win?.webContents.send('save-file-as');
                    },
                },
            ],
        },
        {
            label: 'Düzenle',
            submenu: [
                { role: 'undo', label: 'Geri Al' },
                { role: 'redo', label: 'Yinele' },
                { type: 'separator' },
                { role: 'cut', label: 'Kes' },
                { role: 'copy', label: 'Kopyala' },
                { role: 'paste', label: 'Yapıştır' },
                { role: 'selectAll', label: 'Tümünü Seç' },
            ],
        },
        {
            label: 'Görünüm',
            submenu: [
                { role: 'reload', label: 'Yenile' },
                { role: 'forceReload', label: 'Zorla Yenile' },
                { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
                { type: 'separator' },
                { role: 'zoomIn', label: 'Yakınlaştır' },
                { role: 'zoomOut', label: 'Uzaklaştır' },
                { role: 'resetZoom', label: 'Sıfırla' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Tam Ekran' },
            ],
        },
        {
            label: 'Minecraft',
            submenu: [
                {
                    label: '🧪 Test Sunucusu Başlat',
                    accelerator: 'CmdOrCtrl+F5',
                    click: (_, win) => {
                        win?.webContents.send('start-test-server');
                    },
                },
                {
                    label: '🔨 Plugin Derle (Build)',
                    accelerator: 'CmdOrCtrl+B',
                    click: (_, win) => {
                        win?.webContents.send('build-plugin');
                    },
                },
                { type: 'separator' },
                {
                    label: '📚 API Referansı',
                    click: (_, win) => {
                        win?.webContents.send('open-api-reference');
                    },
                },
            ],
        },
        {
            label: 'AI',
            submenu: [
                {
                    label: '🧠 AI Chat Aç',
                    accelerator: 'CmdOrCtrl+Shift+A',
                    click: (_, win) => {
                        win?.webContents.send('toggle-ai-chat');
                    },
                },
                {
                    label: '⚡ Plugin Oluştur',
                    click: (_, win) => {
                        win?.webContents.send('ai-generate-plugin');
                    },
                },
            ],
        },
        {
            label: 'Yardım',
            submenu: [
                {
                    label: 'Belgeler',
                    click: () => {
                        shell.openExternal('https://craftide.dev/docs');
                    },
                },
                {
                    label: 'GitHub',
                    click: () => {
                        shell.openExternal('https://github.com/craftide/craftide');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Hoş Geldin Ekranı',
                    click: (_, win) => {
                        win?.webContents.send('show-welcome');
                    },
                },
            ],
        },
    ];

    return Menu.buildFromTemplate(template);
}
