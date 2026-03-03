import * as vscode from 'vscode';
import { LLMProvider } from './llm/LLMProvider';
import { AgentOrchestrator } from './orchestrator/AgentOrchestrator';
import { ChatPanelProvider } from './ui/ChatPanelProvider';

/**
 * CraftIDE AI Extension — Ana giriş noktası
 * 
 * Triple-Layer AI Agent sistemi:
 * - Agent-A: Mimar (doğal dil → tasarım kartı)
 * - Agent-B: Kodlayıcı (tasarım kartı → kaynak kod)
 * - Agent-C: Doğrulayıcı (kod kontrolü + hata döngüsü)
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🧠 CraftIDE AI activated!');

    // LLM sağlayıcısını başlat
    const llm = new LLMProvider();

    // Agent orkestratörünü başlat
    const orchestrator = new AgentOrchestrator(llm);

    // Chat Panel sağlayıcısını başlat
    const chatProvider = new ChatPanelProvider(context.extensionUri, orchestrator);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'craftide.chatView',
            chatProvider
        )
    );

    // Komutlar
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.openChat', () => {
            chatProvider.show();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.generatePlugin', async () => {
            const message = await vscode.window.showInputBox({
                prompt: 'Nasıl bir plugin istiyorsunuz?',
                placeHolder: 'Örnek: Oyuncular /shop yazınca bir mağaza menüsü açılsın',
            });
            if (message) {
                const config = vscode.workspace.getConfiguration('craftide');
                await orchestrator.processUserMessage(message, {
                    name: 'NewPlugin',
                    platform: config.get('defaultPlatform', 'paper'),
                    minecraftVersion: config.get('defaultMinecraftVersion', '1.20.4'),
                    rootPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                    existingFiles: [],
                    dependencies: [],
                });
            }
        })
    );

    // Agent olaylarını dinle
    context.subscriptions.push(
        orchestrator.onCodeGenerated(async (files) => {
            // Üretilen dosyaları workspace'e yaz
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) { return; }

            for (const file of files.files) {
                const filePath = vscode.Uri.joinPath(workspaceFolder.uri, file.path);
                const dir = vscode.Uri.joinPath(filePath, '..');
                await vscode.workspace.fs.createDirectory(dir);
                await vscode.workspace.fs.writeFile(
                    filePath,
                    Buffer.from(file.content, 'utf-8')
                );
            }

            vscode.window.showInformationMessage(
                `⛏️ ${files.files.length} dosya oluşturuldu!`
            );
        })
    );

    // LLM ayarları değiştiğinde yeniden yükle
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('craftide.ai')) {
                llm.reload();
            }
        })
    );

    // Temizlik
    context.subscriptions.push({
        dispose: () => orchestrator.dispose(),
    });
}

export function deactivate() {
    console.log('🧠 CraftIDE AI deactivated.');
}
