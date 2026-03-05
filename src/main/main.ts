import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createApplicationMenu } from './menu';
import { registerIpcHandlers } from './ipc';
import { ProjectScaffolder } from './scaffolder';
import { registerTerminalHandlers, cleanupTerminals } from './terminal';
import { registerTestServerHandlers, cleanupTestServer } from './test-server';
import { registerUpdaterIpcHandlers, registerUpdaterWindow } from './updater';

/**
 * CraftIDE — Minecraft Development Studio
 * Electron Ana İşlem (Main Process)
 */

let mainWindow: BrowserWindow | null = null;
let forceClose = false; // Renderer onayı alındıktan sonra kapama için

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        title: 'CraftIDE — Minecraft Development Studio',
        backgroundColor: '#0a0e1a',
        show: false,
        frame: false, // Custom titlebar
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            webviewTag: true,
        },
        icon: path.join(__dirname, '../../logo.png'),
    });

    registerUpdaterWindow(mainWindow);

    // HTML dosyasını yükle
    mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

    // Pencere hazır olduğunda göster
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        mainWindow?.focus();
    });

    // Pencere kapanmadan önce renderer'a sor (kaydedilmemiş değişiklik var mı?)
    mainWindow.on('close', (event) => {
        if (forceClose) return; // Renderer onay verdiyse doğrudan kapat
        event.preventDefault();
        mainWindow?.webContents.send('request-close');
    });

    // Pencere kapanınca referansı temizle
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Harici linkleri default browser'da aç
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Dev tools kısayolu (F12)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            mainWindow?.webContents.toggleDevTools();
        }
    });
}

// Uygulama hazır olduğunda
app.whenReady().then(() => {
    // Uygulama menüsünü oluştur
    const menu = createApplicationMenu();
    Menu.setApplicationMenu(menu);

    // IPC handler'ları kaydet
    registerIpcHandlers();
    registerUpdaterIpcHandlers();

    // Ana pencereyi oluştur
    createWindow();

    // Terminal handler'ları kaydet
    if (mainWindow) {
        registerTerminalHandlers(mainWindow);
        registerTestServerHandlers(mainWindow);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Tüm pencereler kapandığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
    cleanupTerminals();
    cleanupTestServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC: Pencere kontrolleri
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

// Renderer kapama onayı verdiğinde
ipcMain.on('close-app-confirmed', () => {
    forceClose = true;
    cleanupTerminals();
    cleanupTestServer();
    mainWindow?.close();
});
