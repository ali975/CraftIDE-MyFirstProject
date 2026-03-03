import * as vscode from 'vscode';
import * as path from 'path';

/**
 * CraftIDE Build Runner
 * 
 * Maven ve Gradle projelerini otomatik algılayıp
 * tek tuşla build eder.
 * 
 * Desteklenen build araçları:
 * - Maven (pom.xml)
 * - Gradle (build.gradle / build.gradle.kts)
 */
export class BuildRunner {
    private _outputChannel: vscode.OutputChannel;

    constructor() {
        this._outputChannel = vscode.window.createOutputChannel('CraftIDE Build');
    }

    /**
     * Aktif workspace'deki projeyi build et
     */
    async buildProject(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('⛏️ Açık bir proje bulunamadı.');
            return;
        }

        const rootPath = workspaceFolder.uri.fsPath;
        const buildTool = await this._detectBuildTool(rootPath);

        if (!buildTool) {
            vscode.window.showErrorMessage(
                '⛏️ Build dosyası bulunamadı (pom.xml veya build.gradle).'
            );
            return;
        }

        // Java kontrolü
        const javaHome = await this._getJavaHome();

        this._outputChannel.show(true);
        this._outputChannel.clear();
        this._outputChannel.appendLine(`⛏️ CraftIDE Build — ${buildTool.type}`);
        this._outputChannel.appendLine(`📂 ${rootPath}`);
        this._outputChannel.appendLine(`☕ Java: ${javaHome || 'sistem varsayılanı'}`);
        this._outputChannel.appendLine('─'.repeat(50));
        this._outputChannel.appendLine('');

        const command = buildTool.type === 'maven'
            ? this._getMavenCommand(rootPath)
            : this._getGradleCommand(rootPath);

        const terminal = vscode.window.createTerminal({
            name: `⛏️ Build: ${buildTool.type}`,
            cwd: rootPath,
            env: javaHome ? { JAVA_HOME: javaHome } : undefined,
        });

        terminal.show();
        terminal.sendText(command);

        // Build tamamlanma bildirimi
        this._outputChannel.appendLine(`▶ ${command}`);
        this._outputChannel.appendLine('');
        this._outputChannel.appendLine('Build başlatıldı. Terminal çıktısını takip edin.');

        // Build sonrası JAR dosyasını bul
        const postBuildHandler = vscode.window.onDidCloseTerminal(async (t) => {
            if (t === terminal) {
                postBuildHandler.dispose();
                await this._findOutputJar(rootPath, buildTool.type);
            }
        });
    }

    /**
     * Build aracını algıla
     */
    private async _detectBuildTool(rootPath: string): Promise<{ type: 'maven' | 'gradle'; path: string } | null> {
        // pom.xml kontrol
        try {
            const pomUri = vscode.Uri.file(path.join(rootPath, 'pom.xml'));
            await vscode.workspace.fs.stat(pomUri);
            return { type: 'maven', path: pomUri.fsPath };
        } catch { /* pom.xml yok */ }

        // build.gradle kontrol
        try {
            const gradleUri = vscode.Uri.file(path.join(rootPath, 'build.gradle'));
            await vscode.workspace.fs.stat(gradleUri);
            return { type: 'gradle', path: gradleUri.fsPath };
        } catch { /* build.gradle yok */ }

        // build.gradle.kts kontrol
        try {
            const gradleKtsUri = vscode.Uri.file(path.join(rootPath, 'build.gradle.kts'));
            await vscode.workspace.fs.stat(gradleKtsUri);
            return { type: 'gradle', path: gradleKtsUri.fsPath };
        } catch { /* build.gradle.kts yok */ }

        return null;
    }

    /**
     * Java JDK yolunu bul
     */
    private async _getJavaHome(): Promise<string | undefined> {
        const configured = vscode.workspace
            .getConfiguration('craftide.mc')
            .get<string>('javaHome');
        if (configured && configured.trim()) {
            return configured;
        }

        // JAVA_HOME ortam değişkenini kullan
        return process.env.JAVA_HOME;
    }

    /**
     * Maven build komutu — platforma göre
     */
    private _getMavenCommand(rootPath: string): string {
        const isWindows = process.platform === 'win32';
        // mvnw (wrapper) varsa onu kullan
        const wrapperExists = this._fileExistsSync(
            path.join(rootPath, isWindows ? 'mvnw.cmd' : 'mvnw')
        );

        const mvn = wrapperExists
            ? (isWindows ? '.\\mvnw.cmd' : './mvnw')
            : 'mvn';

        return `${mvn} clean package -DskipTests`;
    }

    /**
     * Gradle build komutu — platforma göre
     */
    private _getGradleCommand(rootPath: string): string {
        const isWindows = process.platform === 'win32';
        const wrapperExists = this._fileExistsSync(
            path.join(rootPath, isWindows ? 'gradlew.bat' : 'gradlew')
        );

        const gradle = wrapperExists
            ? (isWindows ? '.\\gradlew.bat' : './gradlew')
            : 'gradle';

        return `${gradle} build -x test`;
    }

    /**
     * Build sonrası JAR dosyasını bul ve bildir
     */
    private async _findOutputJar(rootPath: string, buildType: 'maven' | 'gradle'): Promise<void> {
        const outputDir = buildType === 'maven' ? 'target' : 'build/libs';
        const searchPath = path.join(rootPath, outputDir);

        try {
            const dirUri = vscode.Uri.file(searchPath);
            const files = await vscode.workspace.fs.readDirectory(dirUri);
            const jars = files
                .filter(([name, type]) => name.endsWith('.jar') && type === vscode.FileType.File)
                .filter(([name]) => !name.endsWith('-sources.jar') && !name.endsWith('-javadoc.jar'));

            if (jars.length > 0) {
                const jarName = jars[0][0];
                const jarPath = path.join(searchPath, jarName);

                const action = await vscode.window.showInformationMessage(
                    `⛏️ Build tamamlandı: ${jarName}`,
                    'JAR Dosyasını Göster',
                    'Sunucuya Kopyala'
                );

                if (action === 'JAR Dosyasını Göster') {
                    await vscode.commands.executeCommand(
                        'revealInExplorer',
                        vscode.Uri.file(jarPath)
                    );
                } else if (action === 'Sunucuya Kopyala') {
                    // Test sunucusu plugins klasörüne kopyala
                    await vscode.commands.executeCommand('craftide.copyToServer', jarPath);
                }
            }
        } catch {
            // Output dizini bulunamadı — build başarısız olmuş olabilir
        }
    }

    private _fileExistsSync(filePath: string): boolean {
        try {
            const fs = require('fs');
            return fs.existsSync(filePath);
        } catch {
            return false;
        }
    }

    dispose(): void {
        this._outputChannel.dispose();
    }
}
