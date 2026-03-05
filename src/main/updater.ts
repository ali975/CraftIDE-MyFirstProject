import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater, ProgressInfo, UpdateInfo } from 'electron-updater';

export type LocalizedParams = Record<string, string | number | boolean | null>;

export type UpdaterStatus =
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'disabled'
    | 'error';

export type UpdaterCapabilityMode = 'in-app' | 'manual' | 'unsupported';

export type UpdaterCapability = {
    mode: UpdaterCapabilityMode;
    supportsInApp: boolean;
    isPortable: boolean;
    isPackaged: boolean;
    reasonKey: string;
    reasonFallback: string;
    reasonParams: LocalizedParams;
};

export type UpdaterState = {
    status: UpdaterStatus;
    currentVersion: string;
    latestVersion: string | null;
    progress: number | null;
    transferred: number;
    total: number;
    messageKey: string;
    messageFallback: string;
    messageParams: LocalizedParams;
    releaseName: string | null;
    releaseDate: string | null;
    updateAvailable: boolean;
    canCheck: boolean;
    canDownload: boolean;
    canInstall: boolean;
    isPortable: boolean;
    isPackaged: boolean;
    capability: UpdaterCapability;
};

type LocalizedDescriptor = {
    key: string;
    fallback: string;
    params?: LocalizedParams;
};

const emptyParams = Object.freeze({}) as LocalizedParams;

function createLocalized(key: string, fallback: string, params: LocalizedParams = emptyParams): LocalizedDescriptor {
    return { key, fallback, params };
}

function isPortableBuild(): boolean {
    return Boolean(process.env.PORTABLE_EXECUTABLE_DIR);
}

function isUpdaterSupported(): boolean {
    return process.platform === 'win32' && app.isPackaged && !isPortableBuild();
}

export function getUpdaterCapability(): UpdaterCapability {
    const packaged = app.isPackaged;
    const portable = isPortableBuild();

    if (process.platform !== 'win32') {
        return {
            mode: 'unsupported',
            supportsInApp: false,
            isPortable: portable,
            isPackaged: packaged,
            reasonKey: 'ui.official.capability.windowsOnly',
            reasonFallback: 'Official in-app updates are currently available only for Windows builds.',
            reasonParams: emptyParams,
        };
    }

    if (!packaged) {
        return {
            mode: 'manual',
            supportsInApp: false,
            isPortable: portable,
            isPackaged: packaged,
            reasonKey: 'ui.official.capability.devBuild',
            reasonFallback: 'Development builds can check official releases, but in-app installation requires a packaged installer build.',
            reasonParams: emptyParams,
        };
    }

    if (portable) {
        return {
            mode: 'manual',
            supportsInApp: false,
            isPortable: true,
            isPackaged: packaged,
            reasonKey: 'ui.official.capability.portableManual',
            reasonFallback: 'Portable builds can check official releases and download updates manually. In-app installation requires the setup build.',
            reasonParams: emptyParams,
        };
    }

    return {
        mode: 'in-app',
        supportsInApp: true,
        isPortable: false,
        isPackaged: packaged,
        reasonKey: 'ui.official.capability.installerReady',
        reasonFallback: 'This installer build supports official in-app updates.',
        reasonParams: emptyParams,
    };
}

const updaterState: UpdaterState = {
    status: 'idle',
    currentVersion: app.getVersion(),
    latestVersion: null,
    progress: null,
    transferred: 0,
    total: 0,
    messageKey: 'ui.official.updaterIdle',
    messageFallback: 'Updater is idle.',
    messageParams: emptyParams,
    releaseName: null,
    releaseDate: null,
    updateAvailable: false,
    canCheck: false,
    canDownload: false,
    canInstall: false,
    isPortable: isPortableBuild(),
    isPackaged: app.isPackaged,
    capability: getUpdaterCapability(),
};

let updaterWindow: BrowserWindow | null = null;
let updaterInitialized = false;
let updaterIpcRegistered = false;
let autoCheckTriggered = false;

function syncCapabilities(): void {
    updaterState.currentVersion = app.getVersion();
    updaterState.isPackaged = app.isPackaged;
    updaterState.isPortable = isPortableBuild();
    updaterState.capability = getUpdaterCapability();
    updaterState.canCheck = updaterState.capability.supportsInApp && updaterState.status !== 'checking' && updaterState.status !== 'downloading';
    updaterState.canDownload = updaterState.capability.supportsInApp && updaterState.status === 'available';
    updaterState.canInstall = updaterState.capability.supportsInApp && updaterState.status === 'downloaded';
}

function publishState(): void {
    syncCapabilities();
    updaterWindow?.webContents.send('updater:state', { ...updaterState });
}

function setUpdaterState(patch: Partial<UpdaterState>): void {
    Object.assign(updaterState, patch);
    publishState();
}

function applyUpdateInfo(status: UpdaterStatus, info: UpdateInfo, message: LocalizedDescriptor): void {
    setUpdaterState({
        status,
        latestVersion: info.version || null,
        releaseName: info.releaseName || null,
        releaseDate: info.releaseDate || null,
        messageKey: message.key,
        messageFallback: message.fallback,
        messageParams: message.params || emptyParams,
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
            messageKey: 'ui.official.updaterChecking',
            messageFallback: 'Checking GitHub releases for updates...',
            messageParams: emptyParams,
            updateAvailable: false,
        });
    });

    autoUpdater.on('update-available', (info) => {
        applyUpdateInfo('available', info, createLocalized(
            'ui.official.updaterUpdateAvailableStatus',
            'Version {version} is available to download.',
            { version: info.version || '?' },
        ));
    });

    autoUpdater.on('update-not-available', (info) => {
        applyUpdateInfo('not-available', info, createLocalized(
            'ui.official.updaterUpdateNotAvailableStatus',
            'You are on the latest version ({version}).',
            { version: app.getVersion() },
        ));
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
        setUpdaterState({
            status: 'downloading',
            progress: Number.isFinite(progress.percent) ? Math.round(progress.percent * 10) / 10 : null,
            transferred: progress.transferred || 0,
            total: progress.total || 0,
            messageKey: 'ui.official.updaterDownloadingStatus',
            messageFallback: 'Downloading update... {percent}%',
            messageParams: {
                percent: Number.isFinite(progress.percent) ? Math.round(progress.percent) : 0,
            },
            updateAvailable: true,
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        applyUpdateInfo('downloaded', info, createLocalized(
            'ui.official.updaterDownloadedStatus',
            'Version {version} is ready. Restart to install.',
            { version: info.version || '?' },
        ));
    });

    autoUpdater.on('error', (error) => {
        setUpdaterState({
            status: 'error',
            progress: null,
            messageKey: 'ui.official.updaterErrorStatus',
            messageFallback: 'Automatic update failed: {error}',
            messageParams: {
                error: error?.message || 'unknown',
            },
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
        const capability = getUpdaterCapability();
        setUpdaterState({
            status: 'disabled',
            capability,
            messageKey: capability.reasonKey,
            messageFallback: capability.reasonFallback,
            messageParams: capability.reasonParams,
            updateAvailable: false,
        });
        return;
    }

    attachUpdaterListeners();
    setUpdaterState({
        status: 'idle',
        messageKey: 'ui.official.updaterReady',
        messageFallback: 'Ready to check for updates from GitHub releases.',
        messageParams: emptyParams,
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
        const capability = getUpdaterCapability();
        setUpdaterState({
            status: 'disabled',
            capability,
            messageKey: capability.reasonKey,
            messageFallback: capability.reasonFallback,
            messageParams: capability.reasonParams,
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
        messageKey: manual ? 'ui.official.updaterManualCheck' : 'ui.official.updaterStartupCheck',
        messageFallback: manual ? 'Checking for updates...' : 'Running startup update check...',
        messageParams: emptyParams,
        updateAvailable: false,
    });

    await autoUpdater.checkForUpdates();
    return { ...updaterState };
}

export async function downloadAppUpdate(): Promise<UpdaterState> {
    if (!isUpdaterSupported()) {
        const capability = getUpdaterCapability();
        setUpdaterState({
            status: 'disabled',
            capability,
            messageKey: capability.reasonKey,
            messageFallback: capability.reasonFallback,
            messageParams: capability.reasonParams,
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
            messageKey: 'ui.official.updaterNoDownloadable',
            messageFallback: 'No downloadable update is currently available.',
            messageParams: emptyParams,
        });
        return { ...updaterState };
    }

    await autoUpdater.downloadUpdate();
    return { ...updaterState };
}

export function quitAndInstallAppUpdate(): boolean {
    if (!isUpdaterSupported() || updaterState.status !== 'downloaded') return false;
    setUpdaterState({
        messageKey: 'ui.official.updaterQuitAndInstall',
        messageFallback: 'Closing application to install the downloaded update...',
        messageParams: emptyParams,
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
