import * as vscode from 'vscode';
import * as path from 'path';
import { TestServerManager } from './server/TestServerManager';
import { ServerPanelProvider } from './server/ServerPanelProvider';

/**
 * CraftIDE Test Server Extension — Ana giriş noktası
 * 
 * Bileşenler:
 * - TestServerManager: Paper sunucusu lifecycle yönetimi
 * - ServerPanelProvider: Activity bar sunucu kontrol paneli
 * - Plugin/Skript deploy: Otomatik dosya kopyalama
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🖥️ CraftIDE Test Server activated!');

    const serverManager = new TestServerManager(context.globalStorageUri);

    // Activity bar paneli
    const panelProvider = new ServerPanelProvider(context.extensionUri, serverManager);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('craftide.serverPanel', panelProvider)
    );

    // Başlat
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.server.start', () => serverManager.start())
    );

    // Durdur
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.server.stop', () => serverManager.stop())
    );

    // Yeniden başlat
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.server.restart', () => serverManager.restart())
    );

    // Konsol aç
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.server.openConsole', () => {
            vscode.commands.executeCommand('craftide.serverPanel.focus');
        })
    );

    // Komut gönder
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.server.sendCommand', async () => {
            const command = await vscode.window.showInputBox({
                prompt: 'Sunucuya göndermek istediğiniz komutu girin',
                placeHolder: 'Örn: say Merhaba!, gamemode creative, tp @a 0 100 0',
            });
            if (command) {
                serverManager.sendCommand(command);
            }
        })
    );

    // Plugin deploy
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.server.deployPlugin', async (jarUri?: vscode.Uri) => {
            let jarPath: string;

            if (jarUri) {
                jarPath = jarUri.fsPath;
            } else {
                // JAR dosyasını ara veya seç
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (workspaceRoot) {
                    // target/ veya build/libs/ içinde JAR ara
                    const possiblePaths = [
                        path.join(workspaceRoot, 'target'),
                        path.join(workspaceRoot, 'build', 'libs'),
                    ];

                    for (const dir of possiblePaths) {
                        try {
                            const dirUri = vscode.Uri.file(dir);
                            const files = await vscode.workspace.fs.readDirectory(dirUri);
                            const jars = files.filter(([name]) =>
                                name.endsWith('.jar') &&
                                !name.endsWith('-sources.jar') &&
                                !name.endsWith('-javadoc.jar')
                            );
                            if (jars.length > 0) {
                                jarPath = path.join(dir, jars[0][0]);
                                break;
                            }
                        } catch { /* dizin yok */ }
                    }
                }

                // Bulunamadıysa dosya seçici aç
                if (!jarPath!) {
                    const selected = await vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: { 'JAR Files': ['jar'] },
                        title: 'Deploy edilecek plugin JAR dosyasını seçin',
                    });
                    if (selected?.[0]) {
                        jarPath = selected[0].fsPath;
                    } else {
                        return;
                    }
                }
            }

            await serverManager.deployPlugin(jarPath!);
        })
    );

    // craftide.copyToServer komutu (BuildRunner tarafından kullanılır)
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.copyToServer', async (jarPath: string) => {
            await serverManager.deployPlugin(jarPath);
        })
    );

    // Auto-deploy: Dosya kaydedildiğinde .sk uzantılıysa otomatik deploy
    const autoDeploy = vscode.workspace
        .getConfiguration('craftide.server')
        .get<boolean>('autoDeploy', true);

    if (autoDeploy) {
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(async (doc) => {
                if (doc.languageId === 'skript' && serverManager.state === 'running') {
                    await serverManager.deploySkript(doc.uri.fsPath);
                }
            })
        );
    }

    // Temizlik
    context.subscriptions.push({ dispose: () => serverManager.dispose() });
}

export function deactivate() {
    console.log('🖥️ CraftIDE Test Server deactivated.');
}
