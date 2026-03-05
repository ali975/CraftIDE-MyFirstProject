import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater, ProgressInfo, UpdateInfo } from 'electron-updater';

export type UpdaterStatus =
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'disabled'
    | 'error';

export type UpdaterState = {
    status: UpdaterStatus;
    currentVersion: string;
    latestVersion: string | null;
    progress: number | null;
    transferred: number;
    total: number;
    message: string;
    releaseName: string | null;
    releaseDate: string | null;
    updateAvailable: boolean;
    canCheck: boolean;
    canDownload: boolean;
    canInstall: boolean;
    isPortable: boolean;
    isPackaged: boolean;
};

const updaterState: UpdaterState = {
    status: 'idle',
    currentVersion: app.getVersion(),
    latestVersion: null,
    progress: null,
    transferred: 0,
    total: 0,
    message: 'Updater is idle.',
    releaseName: null,
    releaseDate: null,
    updateAvailable: false,
    canCheck: false,
    canDownload: false,
    canInstall: false,
    isPortable: false,
    isPackaged: app.isPackaged,
};

let updaterWindow: BrowserWindow | null = null;
let updaterInitialized = false;
let updaterIpcRegistered = false;
let autoCheckTriggered = false;

function isPortableBuild(): boolean {
    return Boolean(process.env.PORTABLE_EXECUTABLE_DIR);
}

function isUpdaterSupported(): boolean {
    return process.platform === 'win32' && app.isPackaged && !isPortableBuild();
}

function getDisabledReason(): string {
    if (process.platform !== 'win32') return 'Automatic updates are currently enabled only for Windows builds.';
    if (!app.isPackaged) return 'Automatic updates are available only in packaged builds.';
    if (isPortableBuild()) return 'Portable builds do not support in-app auto update. Use the installer build.';
    return 'Automatic updates are unavailable.';
}

function syncCapabilities(): void {
    updaterState.currentVersion = app.getVersion();
    updaterState.isPackaged = app.isPackaged;
    updaterState.isPortable = isPortableBuild();
    updaterState.canCheck = isUpdaterSupported() && updaterState.status !== 'checking' && updaterState.status !== 'downloading';
    updaterState.canDownload = isUpdaterSupported() && updaterState.status === 'available';
    updaterState.canInstall = isUpdaterSupported() && updaterState.status === 'downloaded';
}

function publishState(): void {
    syncCapabilities();
    updaterWindow?.webContents.send('updater:state', { ...updaterState });
}

function setUpdaterState(patch: Partial<UpdaterState>): void {
    Object.assign(updaterState, patch);
    publishState();
}

function applyUpdateInfo(status: UpdaterStatus, info: UpdateInfo, message: string): void {
    setUpdaterState({
        status,
        latestVersion: info.version || null,
        releaseName: info.releaseName || null,
        releaseDate: info.releaseDate || null,
        message,
        updateAvailable: status === 'available' || status === 'downloading' || status === 'downloaded',
    });
}

function attachUpdaterListeners(): void {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('checking-for-update', () => {
        setUpdaterState({
            status: 'checking',
            progress: null,
            transferred: 0,
            total: 0,
            message: 'Checking GitHub releases for updates...',
            updateAvailable: false,
        });
    });

    autoUpdater.on('update-available', (info) => {
        applyUpdateInfo('available', info, `Version ${info.version} is available to download.`);
    });

    autoUpdater.on('update-not-available', (info) => {
        applyUpdateInfo('not-available', info, `You are on the latest version (${app.getVersion()}).`);
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
        setUpdaterState({
            status: 'downloading',
            progress: Number.isFinite(progress.percent) ? Math.round(progress.percent * 10) / 10 : null,
            transferred: progress.transferred || 0,
            total: progress.total || 0,
            message: `Downloading update... ${Math.round(progress.percent)}%`,
            updateAvailable: true,
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        applyUpdateInfo('downloaded', info, `Version ${info.version} is ready. Restart to install.`);
    });

    autoUpdater.on('error', (error) => {
        setUpdaterState({
            status: 'error',
            progress: null,
            message: error?.message || 'Automatic update failed.',
            updateAvailable: Boolean(updaterState.latestVersion),
        });
    });
}

export function registerUpdaterWindow(window: BrowserWindow): void {
    updaterWindow = window;
    publishState();

    if (updaterInitialized) return;
    updaterInitialized = true;

    if (!isUpdaterSupported()) {
        setUpdaterState({
            status: 'disabled',
            message: getDisabledReason(),
            updateAvailable: false,
        });
        return;
    }

    attachUpdaterListeners();
    setUpdaterState({
        status: 'idle',
        message: 'Ready to check for updates from GitHub releases.',
        updateAvailable: false,
    });

    if (!autoCheckTriggered) {
        autoCheckTriggered = true;
        setTimeout(() => {
            checkForAppUpdates(false).catch(() => {
                // State is already updated in the error handler.
            });
        }, 4000);
    }
}

export async function checkForAppUpdates(manual = true): Promise<UpdaterState> {
    if (!isUpdaterSupported()) {
        setUpdaterState({
            status: 'disabled',
            message: getDisabledReason(),
            updateAvailable: false,
        });
        return { ...updaterState };
    }

    if (updaterState.status === 'checking' || updaterState.status === 'downloading') {
        return { ...updaterState };
    }

    setUpdaterState({
        status: 'checking',
        progress: null,
        transferred: 0,
        total: 0,
        message: manual ? 'Checking for updates...' : 'Running startup update check...',
        updateAvailable: false,
    });

    await autoUpdater.checkForUpdates();
    return { ...updaterState };
}

export async function downloadAppUpdate(): Promise<UpdaterState> {
    if (!isUpdaterSupported()) {
        setUpdaterState({
            status: 'disabled',
            message: getDisabledReason(),
            updateAvailable: false,
        });
        return { ...updaterState };
    }

    if (updaterState.status === 'downloaded' || updaterState.status === 'downloading') {
        return { ...updaterState };
    }

    if (updaterState.status !== 'available') {
        setUpdaterState({
            status: 'error',
            message: 'No downloadable update is currently available.',
        });
        return { ...updaterState };
    }

    await autoUpdater.downloadUpdate();
    return { ...updaterState };
}

export function quitAndInstallAppUpdate(): boolean {
    if (!isUpdaterSupported() || updaterState.status !== 'downloaded') return false;
    setUpdaterState({
        message: 'Closing application to install the downloaded update...',
    });
    setImmediate(() => autoUpdater.quitAndInstall());
    return true;
}

export function getUpdaterState(): UpdaterState {
    syncCapabilities();
    return { ...updaterState };
}

export function registerUpdaterIpcHandlers(): void {
    if (updaterIpcRegistered) return;
    updaterIpcRegistered = true;

    ipcMain.handle('updater:getState', () => getUpdaterState());
    ipcMain.handle('updater:check', () => checkForAppUpdates(true));
    ipcMain.handle('updater:download', () => downloadAppUpdate());
    ipcMain.handle('updater:quitAndInstall', () => quitAndInstallAppUpdate());
}
