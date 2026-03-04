import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { BrowserWindow, ipcMain } from 'electron';

/**
 * CraftIDE Test Sunucusu Yöneticisi
 * Paper MC sunucusunu IDE içinden yönetir
 */

interface ServerState {
    status: 'stopped' | 'starting' | 'running' | 'stopping';
    mcVersion: string;
    serverDir: string;
}

type SupportedServerType = 'paper' | 'spigot' | 'fabric' | 'forge' | 'vanilla';

interface ServerVersionPayload {
    serverType: SupportedServerType;
    versions: string[];
    defaultVersion: string;
    source: string;
    fetchedAt: string;
}

let serverProcess: ChildProcess | null = null;
let serverState: ServerState = { status: 'stopped', mcVersion: '1.21.11', serverDir: '' };
const VERSION_CACHE_MS = 5 * 60 * 1000;
const versionCache = new Map<SupportedServerType, { at: number; payload: ServerVersionPayload }>();
const VERSION_FALLBACK: Record<SupportedServerType, string[]> = {
    paper: ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.19.4'],
    spigot: ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.19.4'],
    fabric: ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.19.4'],
    forge: ['1.21.1', '1.20.1', '1.19.2', '1.18.2'],
    vanilla: ['1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.19.4'],
};

function normalizeServerType(raw: string | undefined): SupportedServerType {
    const type = String(raw || '').toLowerCase();
    if (type === 'paper' || type === 'spigot' || type === 'fabric' || type === 'forge' || type === 'vanilla') {
        return type;
    }
    return 'paper';
}

function compareVersionDesc(a: string, b: string): number {
    const pa = a.split('.').map((x) => Number.parseInt(x, 10) || 0);
    const pb = b.split('.').map((x) => Number.parseInt(x, 10) || 0);
    const max = Math.max(pa.length, pb.length);
    for (let i = 0; i < max; i += 1) {
        const diff = (pb[i] || 0) - (pa[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

function sanitizeVersionList(list: unknown[]): string[] {
    return Array.from(new Set((list || [])
        .map((v) => String(v || '').trim())
        .filter((v) => /^\d+\.\d+(\.\d+)?$/.test(v)))).sort(compareVersionDesc);
}

function makeVersionPayload(serverType: SupportedServerType, versions: string[], source: string): ServerVersionPayload {
    const clean = sanitizeVersionList(versions);
    const finalVersions = clean.length ? clean : VERSION_FALLBACK[serverType];
    return {
        serverType,
        versions: finalVersions,
        defaultVersion: finalVersions[0],
        source,
        fetchedAt: new Date().toISOString(),
    };
}

async function fetchVersionPayload(serverType: SupportedServerType): Promise<ServerVersionPayload> {
    const cached = versionCache.get(serverType);
    if (cached && (Date.now() - cached.at) < VERSION_CACHE_MS) {
        return cached.payload;
    }

    let payload: ServerVersionPayload;
    try {
        if (serverType === 'paper' || serverType === 'spigot') {
            const data = await fetchJson('https://api.papermc.io/v2/projects/paper');
            payload = makeVersionPayload(serverType, data?.versions || [], 'papermc');
        } else if (serverType === 'fabric') {
            const data = await fetchJson('https://meta.fabricmc.net/v2/versions/game');
            const versions = Array.isArray(data) ? data.filter((x: any) => x?.stable !== false).map((x: any) => x.version) : [];
            payload = makeVersionPayload(serverType, versions, 'fabric-meta');
        } else if (serverType === 'forge') {
            const promos = await fetchJson('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
            const keys = Object.keys(promos?.promos || {});
            const versions = keys
                .filter((k) => /-(latest|recommended)$/.test(k))
                .map((k) => k.replace(/-(latest|recommended)$/, ''));
            payload = makeVersionPayload(serverType, versions, 'forge-promotions');
        } else {
            const manifest = await fetchJson('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
            const versions = Array.isArray(manifest?.versions)
                ? manifest.versions.filter((x: any) => x?.type === 'release').map((x: any) => x.id)
                : [];
            payload = makeVersionPayload(serverType, versions, 'mojang-manifest');
        }
    } catch (error) {
        payload = makeVersionPayload(serverType, VERSION_FALLBACK[serverType], 'fallback');
    }

    versionCache.set(serverType, { at: Date.now(), payload });
    return payload;
}

function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
            // Follow redirects
            if (response.statusCode === 302 || response.statusCode === 301) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    file.close();
                    fs.unlinkSync(dest);
                    downloadFile(redirectUrl, dest).then(resolve).catch(reject);
                    return;
                }
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlinkSync(dest);
            reject(err);
        });
    });
}

function fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'CraftIDE/0.1.0' } }, (res) => {
            let data = '';
            res.on('data', (chunk: Buffer) => data += chunk.toString());
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

export function registerTestServerHandlers(mainWindow: BrowserWindow): void {
    ipcMain.handle('server:list-versions', async (_, rawType?: string) => {
        const serverType = normalizeServerType(rawType);
        return fetchVersionPayload(serverType);
    });

    // Sunucu başlat
    ipcMain.handle('server:start', async (_, options: { mcVersion: string; serverDir: string; serverType?: string; javaPath?: string }) => {
        if (serverProcess) {
            return { success: false, error: 'Sunucu zaten çalışıyor' };
        }

        try {
            const serverType = options.serverType || 'paper';
            const serverDir = options.serverDir || path.join(require('os').homedir(), '.craftide', 'test-server', serverType);
            const mcVersion = options.mcVersion || '1.21.11';
            serverState = { status: 'starting', mcVersion, serverDir };

            fs.mkdirSync(serverDir, { recursive: true });

            // Java yolunu baştan bul
            const javaPath = options.javaPath || await findJava();
            if (!javaPath) {
                return { success: false, error: 'Java bulunamadı! Java 17+ yüklü olmalı.' };
            }

            let jarPath = path.join(serverDir, `${serverType}-${mcVersion}.jar`);
            let startArgs = ['-Xms512M', '-Xmx1G'];

            if (serverType === 'paper') {
                fs.mkdirSync(path.join(serverDir, 'plugins'), { recursive: true });
                if (!fs.existsSync(jarPath)) {
                    mainWindow.webContents.send('server:log', `⬇️ Paper ${mcVersion} indiriliyor...`);
                    try {
                        const buildsData = await fetchJson(`https://api.papermc.io/v2/projects/paper/versions/${mcVersion}/builds`);
                        const builds = buildsData.builds;
                        if (!builds || builds.length === 0) return { success: false, error: `Paper ${mcVersion} bulunamadı` };

                        const latestBuild = builds[builds.length - 1];
                        const buildNum = latestBuild.build;
                        const downloadName = latestBuild.downloads?.application?.name || `paper-${mcVersion}-${buildNum}.jar`;
                        const downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${mcVersion}/builds/${buildNum}/downloads/${downloadName}`;

                        mainWindow.webContents.send('server:log', `📦 Build #${buildNum} indiriliyor: ${downloadName}`);
                        await downloadFile(downloadUrl, jarPath);
                        mainWindow.webContents.send('server:log', '✅ Paper JAR indirildi!');
                    } catch (err: any) {
                        return { success: false, error: 'Paper indirme hatası: ' + err.message };
                    }
                }
                startArgs.push('-jar', jarPath, 'nogui');

            } else if (serverType === 'fabric') {
                fs.mkdirSync(path.join(serverDir, 'mods'), { recursive: true });
                if (!fs.existsSync(jarPath)) {
                    mainWindow.webContents.send('server:log', `⬇️ Fabric ${mcVersion} Server indiriliyor...`);
                    try {
                        const loaders = await fetchJson(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`);
                        if (!loaders || loaders.length === 0) return { success: false, error: `Fabric ${mcVersion} (loader) bulunamadı` };
                        const loaderVersion = loaders[0].loader.version;

                        const installers = await fetchJson(`https://meta.fabricmc.net/v2/versions/installer`);
                        if (!installers || installers.length === 0) return { success: false, error: `Fabric installer bulunamadı` };
                        const installerVersion = installers[0].version;

                        const downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/${installerVersion}/server/jar`;
                        mainWindow.webContents.send('server:log', `📦 Kurucu: ${installerVersion}, Yükleyici: ${loaderVersion}`);
                        await downloadFile(downloadUrl, jarPath);
                        mainWindow.webContents.send('server:log', '✅ Fabric Server JAR indirildi!');
                    } catch (err: any) {
                        return { success: false, error: 'Fabric indirme hatası: ' + err.message };
                    }
                }
                startArgs.push('-jar', jarPath, 'nogui');

            } else if (serverType === 'forge') {
                fs.mkdirSync(path.join(serverDir, 'mods'), { recursive: true });
                const runSh = path.join(serverDir, 'run.bat');

                // If the run.bat doesn't exist, we must install
                if (!fs.existsSync(runSh) && !fs.existsSync(path.join(serverDir, 'run.sh'))) {
                    mainWindow.webContents.send('server:log', `⬇️ Forge ${mcVersion} Installer indiriliyor...`);
                    try {
                        const promos = await fetchJson(`https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json`);
                        let forgeVersion = promos.promos[`${mcVersion}-latest`] || promos.promos[`${mcVersion}-recommended`];

                        if (!forgeVersion) return { success: false, error: `Forge ${mcVersion} promosyonu bulunamadı (Desteklenmiyor olabilir)` };

                        const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-installer.jar`;
                        const installerPath = path.join(serverDir, `forge-installer.jar`);

                        mainWindow.webContents.send('server:log', `📦 Forge ${forgeVersion} indiriliyor...`);
                        await downloadFile(installerUrl, installerPath);
                        mainWindow.webContents.send('server:log', '⏳ Forge Installer çalıştırılıyor (Bu işlem 1-3 dk sürebilir)...');

                        await new Promise<void>((resolve, reject) => {
                            const installProc = spawn(javaPath as string, ['-jar', installerPath, '--installServer'], { cwd: serverDir });
                            installProc.stdout?.on('data', (d: Buffer) => mainWindow.webContents.send('server:log', '[Forge-Install] ' + d.toString().trim()));
                            installProc.stderr?.on('data', (d: Buffer) => mainWindow.webContents.send('server:log', '[Forge-Install] ' + d.toString().trim()));
                            installProc.on('close', (code: number | null) => code === 0 ? resolve() : reject(new Error('Installer başarısız oldu: code ' + code)));
                        });

                        fs.unlinkSync(installerPath); // cleanup
                        mainWindow.webContents.send('server:log', '✅ Forge başarıyla kuruldu!');
                    } catch (err: any) {
                        return { success: false, error: 'Forge kurulum hatası: ' + err.message };
                    }
                }

                // For modern Forge, there's run.bat (Windows) or run.sh (Unix)
                const isWin = process.platform === 'win32';
                const runScript = isWin ? 'run.bat' : './run.sh';
                if (!fs.existsSync(path.join(serverDir, isWin ? 'run.bat' : 'run.sh'))) {
                    // Fallback to older forge (e.g 1.12.2)
                    const oldJar = path.join(serverDir, `forge-${mcVersion}.jar`);
                    // We don't fully support older forge versions down to 1.8 in this generic IDE seamlessly,
                    // but we try to fallback for standard setups.
                    startArgs.push('-jar', oldJar, 'nogui');
                    if (!fs.existsSync(oldJar)) { return { success: false, error: 'Forge başlatma dosyası bulunamadı!' }; }
                } else {
                    jarPath = path.join(serverDir, runScript);
                    startArgs = []; // The script handles arguments
                }
            } else if (serverType === 'spigot' || serverType === 'vanilla') {
                mainWindow.webContents.send('server:log', `⚠️ ${serverType} henüz tam otomatize edilmedi, Paper klasörüne düşüldü.`);
                jarPath = path.join(serverDir, `paper-${mcVersion}.jar`);
                startArgs.push('-jar', jarPath, 'nogui');
            }

            // EULA kabul
            const eulaPath = path.join(serverDir, 'eula.txt');
            fs.writeFileSync(eulaPath, 'eula=true\n');

            // server.properties
            const propsPath = path.join(serverDir, 'server.properties');
            if (!fs.existsSync(propsPath)) {
                fs.writeFileSync(propsPath, [
                    'server-port=25566',
                    'online-mode=false',
                    'gamemode=creative',
                    'difficulty=peaceful',
                    'spawn-protection=0',
                    'max-players=5',
                    'motd=CraftIDE Test Server',
                    'level-name=craftide-test',
                    'enable-command-block=true',
                    'white-list=false',
                ].join('\n') + '\n');
            }

            mainWindow.webContents.send('server:log', `🚀 Sunucu başlatılıyor... (Araç: ${serverType}, Port: 25566)`);

            // Sunucuyu başlat (Forge run.bat ise shell ile başlat)
            const isRunScript = serverType === 'forge' && startArgs.length === 0;
            serverProcess = spawn(isRunScript ? jarPath : (javaPath as string), startArgs, {
                cwd: serverDir,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: isRunScript
            });

            serverState.status = 'running';

            serverProcess.stdout?.on('data', (data: Buffer) => {
                const msg = data.toString('utf-8');
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('server:log', msg);

                    // AI Interceptor for Auto-Healing
                    if (msg.includes('Exception') || msg.includes(' Error ') || msg.toLowerCase().includes('failed to')) {
                        mainWindow.webContents.send('ai:server-error', msg);
                    }
                }

                if (msg.includes('Done (')) {
                    mainWindow.webContents.send('server:status', 'running');
                }
            });

            serverProcess.stderr?.on('data', (data: Buffer) => {
                const msg = data.toString('utf-8');
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('server:log', '[STDERR] ' + msg);
                    mainWindow.webContents.send('ai:server-error', msg); // Catch all stderr
                }
            });

            serverProcess.on('close', (code) => {
                serverProcess = null;
                serverState.status = 'stopped';
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('server:log', `\n⏹️ Sunucu kapandı (kod: ${code})\n`);
                    mainWindow.webContents.send('server:status', 'stopped');
                }
            });

            return { success: true, serverDir };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

    // Sunucu durdur
    ipcMain.handle('server:stop', async () => {
        if (serverProcess && serverProcess.stdin) {
            serverState.status = 'stopping';
            serverProcess.stdin.write('stop\n');
            return { success: true };
        }
        return { success: false, error: 'Sunucu çalışmıyor' };
    });

    // Sunucuya komut gönder
    ipcMain.handle('server:command', async (_, command: string) => {
        if (serverProcess && serverProcess.stdin) {
            serverProcess.stdin.write(command + '\n');
            return true;
        }
        return false;
    });

    // Plugin deploy
    ipcMain.handle('server:deploy', async (_, jarPath: string) => {
        if (!serverState.serverDir) return { success: false, error: 'Sunucu dizini ayarlanmadı' };
        try {
            const destDir = path.join(serverState.serverDir, 'plugins');
            fs.mkdirSync(destDir, { recursive: true });
            const destPath = path.join(destDir, path.basename(jarPath));
            fs.copyFileSync(jarPath, destPath);
            return { success: true, path: destPath };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

    // Sunucu durumu
    ipcMain.handle('server:status', () => {
        return serverState;
    });
}

async function findJava(): Promise<string | null> {
    // JAVA_HOME kontrol
    if (process.env.JAVA_HOME) {
        const javaExe = path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
        if (fs.existsSync(javaExe)) return javaExe;
    }

    // PATH'te java ara
    const { execSync } = require('child_process');
    try {
        const result = execSync(process.platform === 'win32' ? 'where java' : 'which java', { encoding: 'utf-8' });
        const firstLine = result.trim().split('\n')[0].trim();
        if (firstLine && fs.existsSync(firstLine)) return firstLine;
    } catch { /* not found */ }

    return null;
}

export function cleanupTestServer(): void {
    if (serverProcess && serverProcess.stdin) {
        serverProcess.stdin.write('stop\n');
        setTimeout(() => {
            if (serverProcess) {
                serverProcess.kill();
                serverProcess = null;
            }
        }, 5000);
    }
}
