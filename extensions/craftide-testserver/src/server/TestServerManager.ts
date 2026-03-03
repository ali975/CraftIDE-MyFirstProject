import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess, spawn } from 'child_process';

/**
 * CraftIDE Dahili Test Sunucusu Yöneticisi
 * 
 * Paper MC sunucusunu IDE içinden yönetir:
 * - Paper JAR otomatik indirme
 * - Sunucu başlatma/durdurma/yeniden başlatma
 * - EULA otomatik kabul
 * - Plugin JAR'ını plugins/ klasörüne deploy etme
 * - Canlı konsol çıktısı
 * - server.properties yapılandırma
 */
export class TestServerManager {
    private _serverProcess: ChildProcess | null = null;
    private _serverDir: string;
    private _outputChannel: vscode.OutputChannel;
    private _statusBarItem: vscode.StatusBarItem;
    private _state: ServerState = 'stopped';

    // Event emitters
    private readonly _onStateChange = new vscode.EventEmitter<ServerState>();
    readonly onStateChange = this._onStateChange.event;

    private readonly _onConsoleLine = new vscode.EventEmitter<string>();
    readonly onConsoleLine = this._onConsoleLine.event;

    constructor(private readonly storageUri: vscode.Uri) {
        this._serverDir = path.join(storageUri.fsPath, 'test-server');
        this._outputChannel = vscode.window.createOutputChannel('CraftIDE Server');
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
        this._statusBarItem.command = 'craftide.server.openConsole';
        this._updateStatusBar();
        this._statusBarItem.show();
    }

    get state(): ServerState { return this._state; }

    /**
     * Test sunucusunu başlat
     */
    async start(): Promise<void> {
        if (this._state === 'running') {
            vscode.window.showWarningMessage('⛏️ Sunucu zaten çalışıyor.');
            return;
        }

        this._setState('starting');
        this._outputChannel.show(true);
        this._outputChannel.appendLine('⛏️ CraftIDE Test Sunucusu başlatılıyor...');

        try {
            // Sunucu dizinini oluştur
            await this._ensureServerDir();

            // Paper JAR kontrolü
            const paperJar = await this._ensurePaperJar();

            // EULA kontrolü
            await this._ensureEula();

            // server.properties ayarla
            await this._ensureServerProperties();

            // Java kontrolü
            const javaPath = await this._findJava();
            if (!javaPath) {
                vscode.window.showErrorMessage('⛏️ Java bulunamadı. Java JDK yüklü olduğundan emin olun.');
                this._setState('stopped');
                return;
            }

            // JVM argümanları
            const jvmArgs = vscode.workspace
                .getConfiguration('craftide.server')
                .get<string>('jvmArgs', '-Xms512M -Xmx1G');

            const args = [
                ...jvmArgs.split(' '),
                '-jar', paperJar,
                '--nogui',
            ];

            this._outputChannel.appendLine(`☕ Java: ${javaPath}`);
            this._outputChannel.appendLine(`🚀 Komut: java ${args.join(' ')}`);
            this._outputChannel.appendLine('─'.repeat(50));

            // Sunucu sürecini başlat
            this._serverProcess = spawn(javaPath, args, {
                cwd: this._serverDir,
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            // stdout
            this._serverProcess.stdout?.on('data', (data: Buffer) => {
                const lines = data.toString().split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        this._outputChannel.appendLine(line);
                        this._onConsoleLine.fire(line);

                        // Sunucu hazır mı kontrol
                        if (line.includes('Done (') && line.includes('For help')) {
                            this._setState('running');
                            vscode.window.showInformationMessage('⛏️ Test sunucusu çalışıyor!');
                        }
                    }
                }
            });

            // stderr
            this._serverProcess.stderr?.on('data', (data: Buffer) => {
                this._outputChannel.appendLine(`[HATA] ${data.toString()}`);
                this._onConsoleLine.fire(`[HATA] ${data.toString()}`);
            });

            // Süreç kapandığında
            this._serverProcess.on('close', (code) => {
                this._outputChannel.appendLine(`\n⛏️ Sunucu kapandı (kod: ${code})`);
                this._setState('stopped');
                this._serverProcess = null;
            });

            this._serverProcess.on('error', (err) => {
                this._outputChannel.appendLine(`[HATA] Sunucu başlatılamadı: ${err.message}`);
                this._setState('stopped');
                this._serverProcess = null;
            });

        } catch (err: any) {
            this._outputChannel.appendLine(`[HATA] ${err.message}`);
            this._setState('stopped');
        }
    }

    /**
     * Sunucuyu düzgünce kapat
     */
    async stop(): Promise<void> {
        if (!this._serverProcess || this._state === 'stopped') {
            vscode.window.showWarningMessage('⛏️ Sunucu zaten kapalı.');
            return;
        }

        this._setState('stopping');
        this._outputChannel.appendLine('\n⛏️ Sunucu kapatılıyor...');

        // "stop" komutu gönder
        this.sendCommand('stop');

        // 10 saniye bekle, hala kapanmadıysa zorla kapat
        setTimeout(() => {
            if (this._serverProcess) {
                this._serverProcess.kill('SIGKILL');
                this._serverProcess = null;
                this._setState('stopped');
            }
        }, 10000);
    }

    /**
     * Sunucuyu yeniden başlat
     */
    async restart(): Promise<void> {
        await this.stop();
        // Sunucu kapanana kadar bekle
        await new Promise<void>((resolve) => {
            const check = setInterval(() => {
                if (this._state === 'stopped') {
                    clearInterval(check);
                    resolve();
                }
            }, 500);
        });
        await this.start();
    }

    /**
     * Sunucuya konsol komutu gönder
     */
    sendCommand(command: string): void {
        if (this._serverProcess?.stdin) {
            this._serverProcess.stdin.write(command + '\n');
            this._outputChannel.appendLine(`> ${command}`);
        }
    }

    /**
     * Plugin JAR dosyasını sunucu plugins/ klasörüne kopyala
     */
    async deployPlugin(jarPath: string): Promise<void> {
        const pluginsDir = path.join(this._serverDir, 'plugins');
        if (!fs.existsSync(pluginsDir)) {
            fs.mkdirSync(pluginsDir, { recursive: true });
        }

        const jarName = path.basename(jarPath);
        const destPath = path.join(pluginsDir, jarName);

        try {
            fs.copyFileSync(jarPath, destPath);
            this._outputChannel.appendLine(`📦 Plugin deploy edildi: ${jarName}`);
            vscode.window.showInformationMessage(`⛏️ ${jarName} sunucuya deploy edildi!`);

            // Sunucu çalışıyorsa reload yap
            if (this._state === 'running') {
                const reload = await vscode.window.showInformationMessage(
                    'Plugin yüklendi. Sunucuyu yeniden yüklemek ister misiniz?',
                    'Reload', 'Hayır'
                );
                if (reload === 'Reload') {
                    this.sendCommand('reload confirm');
                }
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`⛏️ Deploy hatası: ${err.message}`);
        }
    }

    /**
     * Skript dosyasını sunucuya deploy et
     */
    async deploySkript(skriptPath: string): Promise<void> {
        const skriptsDir = path.join(this._serverDir, 'plugins', 'Skript', 'scripts');
        if (!fs.existsSync(skriptsDir)) {
            fs.mkdirSync(skriptsDir, { recursive: true });
        }

        const skName = path.basename(skriptPath);
        const destPath = path.join(skriptsDir, skName);

        try {
            fs.copyFileSync(skriptPath, destPath);
            this._outputChannel.appendLine(`📜 Skript deploy edildi: ${skName}`);

            if (this._state === 'running') {
                this.sendCommand(`sk reload ${skName.replace('.sk', '')}`);
                vscode.window.showInformationMessage(`⛏️ ${skName} yüklendi ve yeniden yüklendi!`);
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`⛏️ Skript deploy hatası: ${err.message}`);
        }
    }

    // ─── Dahili Yardımcılar ─────────────────────────────────

    private async _ensureServerDir(): Promise<void> {
        if (!fs.existsSync(this._serverDir)) {
            fs.mkdirSync(this._serverDir, { recursive: true });
            this._outputChannel.appendLine(`📁 Sunucu dizini oluşturuldu: ${this._serverDir}`);
        }
    }

    private async _ensurePaperJar(): Promise<string> {
        const mcVersion = vscode.workspace
            .getConfiguration('craftide.server')
            .get<string>('paperVersion', '1.20.4');

        const jarName = `paper-${mcVersion}.jar`;
        const jarPath = path.join(this._serverDir, jarName);

        if (fs.existsSync(jarPath)) {
            return jarPath;
        }

        // Paper API'den build numarası al ve indir
        this._outputChannel.appendLine(`📥 Paper ${mcVersion} indiriliyor...`);

        try {
            const buildsUrl = `https://api.papermc.io/v2/projects/paper/versions/${mcVersion}/builds`;
            const buildsRes = await fetch(buildsUrl);
            const buildsData = await buildsRes.json() as any;
            const latestBuild = buildsData.builds?.[buildsData.builds.length - 1];

            if (!latestBuild) {
                throw new Error(`Paper ${mcVersion} için build bulunamadı.`);
            }

            const buildNum = latestBuild.build;
            const downloadName = latestBuild.downloads?.application?.name || `paper-${mcVersion}-${buildNum}.jar`;
            const downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${mcVersion}/builds/${buildNum}/downloads/${downloadName}`;

            this._outputChannel.appendLine(`📥 ${downloadUrl}`);

            const dlRes = await fetch(downloadUrl);
            const buffer = Buffer.from(await dlRes.arrayBuffer());
            fs.writeFileSync(jarPath, buffer);

            this._outputChannel.appendLine(`✅ Paper ${mcVersion} (build ${buildNum}) indirildi!`);
        } catch (err: any) {
            this._outputChannel.appendLine(`[UYARI] Paper indirilemedi: ${err.message}`);
            this._outputChannel.appendLine('Paper JAR dosyasını manuel olarak koyabilirsiniz.');

            // Kullanıcıdan manuel seçim iste
            const selected = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'JAR': ['jar'] },
                title: 'Paper sunucu JAR dosyasını seçin',
            });

            if (selected?.[0]) {
                fs.copyFileSync(selected[0].fsPath, jarPath);
            } else {
                throw new Error('Paper JAR dosyası bulunamadı.');
            }
        }

        return jarPath;
    }

    private async _ensureEula(): Promise<void> {
        const eulaPath = path.join(this._serverDir, 'eula.txt');
        const autoAccept = vscode.workspace
            .getConfiguration('craftide.server')
            .get<boolean>('autoAcceptEula', true);

        if (autoAccept) {
            fs.writeFileSync(eulaPath, 'eula=true\n');
        } else if (!fs.existsSync(eulaPath)) {
            const accept = await vscode.window.showWarningMessage(
                '⛏️ Minecraft EULA\'yı kabul etmeniz gerekiyor.',
                'Kabul Et', 'İptal'
            );
            if (accept === 'Kabul Et') {
                fs.writeFileSync(eulaPath, 'eula=true\n');
            } else {
                throw new Error('EULA kabul edilmedi.');
            }
        }
    }

    private async _ensureServerProperties(): Promise<void> {
        const propsPath = path.join(this._serverDir, 'server.properties');
        if (fs.existsSync(propsPath)) { return; }

        const port = vscode.workspace
            .getConfiguration('craftide.server')
            .get<number>('port', 25565);

        const props = [
            `server-port=${port}`,
            'online-mode=false',
            'max-players=5',
            'level-name=test-world',
            'motd=CraftIDE Test Server',
            'spawn-protection=0',
            'difficulty=peaceful',
            'gamemode=creative',
            'allow-flight=true',
            'view-distance=10',
            'simulation-distance=10',
            'enable-command-block=true',
        ].join('\n');

        fs.writeFileSync(propsPath, props + '\n');
    }

    private async _findJava(): Promise<string | null> {
        const configJava = vscode.workspace
            .getConfiguration('craftide.mc')
            .get<string>('javaHome');

        if (configJava) {
            const javaBin = path.join(configJava, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
            if (fs.existsSync(javaBin)) { return javaBin; }
        }

        if (process.env.JAVA_HOME) {
            const javaBin = path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
            if (fs.existsSync(javaBin)) { return javaBin; }
        }

        // PATH'de java arama
        return process.platform === 'win32' ? 'java.exe' : 'java';
    }

    private _setState(state: ServerState): void {
        this._state = state;
        this._onStateChange.fire(state);
        this._updateStatusBar();
    }

    private _updateStatusBar(): void {
        const icons: Record<ServerState, string> = {
            stopped: '$(circle-outline)',
            starting: '$(loading~spin)',
            running: '$(circle-filled)',
            stopping: '$(loading~spin)',
        };
        const labels: Record<ServerState, string> = {
            stopped: 'Sunucu Kapalı',
            starting: 'Başlatılıyor...',
            running: 'Sunucu Çalışıyor',
            stopping: 'Kapatılıyor...',
        };
        this._statusBarItem.text = `${icons[this._state]} ${labels[this._state]}`;
        this._statusBarItem.backgroundColor = this._state === 'running'
            ? new vscode.ThemeColor('statusBarItem.warningBackground')
            : undefined;
    }

    dispose(): void {
        if (this._serverProcess) {
            this._serverProcess.kill();
        }
        this._outputChannel.dispose();
        this._statusBarItem.dispose();
        this._onStateChange.dispose();
        this._onConsoleLine.dispose();
    }
}

export type ServerState = 'stopped' | 'starting' | 'running' | 'stopping';
