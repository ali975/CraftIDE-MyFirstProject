import * as vscode from 'vscode';
import { MinecraftApiDatabase } from './apidb/MinecraftApiDatabase';
import { MinecraftHoverProvider } from './apidb/MinecraftHoverProvider';
import { SkriptCompletionProvider } from './skript/SkriptCompletionProvider';
import { BuildRunner } from './build/BuildRunner';

/**
 * CraftIDE Minecraft Tools Extension — Ana giriş noktası
 * 
 * Bileşenler:
 * - Minecraft API Referans Veritabanı + Hover Provider
 * - Skript dil desteği (syntax, autocomplete)
 * - Build sistemi (Maven/Gradle auto-detect)
 * - Bukkit & Skript code snippets
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🧱 CraftIDE Minecraft Tools activated!');

    // ── API Veritabanı ──
    const apiDb = new MinecraftApiDatabase();

    // ── Hover Provider — Java dosyalarında MC API bilgisi ──
    const hoverProvider = new MinecraftHoverProvider(apiDb);
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('java', hoverProvider)
    );

    // ── Skript Autocomplete ──
    const skriptCompletion = new SkriptCompletionProvider();
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'skript',
            skriptCompletion,
            ' ', '.', ':'  // trigger characters
        )
    );

    // ── Build Runner ──
    const buildRunner = new BuildRunner();
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.mc.buildPlugin', () => {
            buildRunner.buildProject();
        })
    );

    // ── API Lookup komutu ──
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.mc.apiLookup', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Minecraft API aramak istediğiniz sınıf veya metod adını yazın',
                placeHolder: 'Örn: Player, PlayerJoinEvent, ItemStack',
            });
            if (!query) { return; }

            const mcVersion = vscode.workspace
                .getConfiguration('craftide')
                .get<string>('defaultMinecraftVersion', '1.20.4');

            const hover = apiDb.generateHoverInfo(query, mcVersion);
            if (hover) {
                // QuickPick ile göster
                const panel = vscode.window.createWebviewPanel(
                    'craftide.apiLookup',
                    `📚 MC API: ${query}`,
                    vscode.ViewColumn.Beside,
                    {}
                );
                panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
            padding: 20px;
            color: var(--vscode-foreground, #ddd);
            background: var(--vscode-editor-background, #1e1e1e);
        }
        code { 
            background: rgba(255,255,255,0.1); 
            padding: 2px 6px;
            border-radius: 4px;
        }
        pre { 
            background: rgba(0,0,0,0.3);
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
        }
        h3 { color: #3498db; }
    </style>
</head>
<body>${markdownToHtml(hover)}</body>
</html>`;
            } else {
                vscode.window.showWarningMessage(`⛏️ "${query}" API veritabanında bulunamadı.`);
            }
        })
    );

    // ── MC Versiyon Değiştirme ──
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.mc.switchVersion', async () => {
            const versions = ['1.21.4', '1.21.3', '1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.19.4', '1.18.2', '1.16.5'];
            const selected = await vscode.window.showQuickPick(versions, {
                placeHolder: 'Hedef Minecraft versiyonunu seçin',
                title: '⛏️ Minecraft Versiyon Değiştir',
            });
            if (selected) {
                await vscode.workspace.getConfiguration('craftide').update(
                    'defaultMinecraftVersion', selected, true
                );
                vscode.window.showInformationMessage(`⛏️ Minecraft versiyonu ${selected} olarak ayarlandı.`);
            }
        })
    );

    // ── Java deprecated API diagnostics ──
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('craftide-mc');
    context.subscriptions.push(diagnosticCollection);

    const showDeprecation = vscode.workspace
        .getConfiguration('craftide.mc')
        .get<boolean>('showDeprecationWarnings', true);

    if (showDeprecation) {
        // Aktif editor değiştiğinde deprecated kontrol
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor && editor.document.languageId === 'java') {
                    updateDeprecationDiagnostics(editor.document, apiDb, diagnosticCollection);
                }
            })
        );

        // Dosya kaydedildiğinde
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument((doc) => {
                if (doc.languageId === 'java') {
                    updateDeprecationDiagnostics(doc, apiDb, diagnosticCollection);
                }
            })
        );

        // Mevcut editörü hemen kontrol et
        if (vscode.window.activeTextEditor?.document.languageId === 'java') {
            updateDeprecationDiagnostics(
                vscode.window.activeTextEditor.document,
                apiDb,
                diagnosticCollection
            );
        }
    }

    // Temizlik
    context.subscriptions.push({ dispose: () => buildRunner.dispose() });
}

/**
 * Java dosyasındaki deprecated API kullanımlarını tespit et
 */
function updateDeprecationDiagnostics(
    document: vscode.TextDocument,
    apiDb: MinecraftApiDatabase,
    collection: vscode.DiagnosticCollection
): void {
    const mcVersion = vscode.workspace
        .getConfiguration('craftide')
        .get<string>('defaultMinecraftVersion', '1.20.4');

    const deprecatedMethods = apiDb.getDeprecatedMethods(mcVersion);
    const diagnostics: vscode.Diagnostic[] = [];

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text;

        for (const method of deprecatedMethods) {
            const idx = line.indexOf(method.name);
            if (idx >= 0) {
                const range = new vscode.Range(i, idx, i, idx + method.name.length);
                const diag = new vscode.Diagnostic(
                    range,
                    `⚠️ ${method.name}() — MC ${method.deprecatedSince}'den beri deprecated.${method.replacement ? ` Alternatif: ${method.replacement}` : ''}`,
                    vscode.DiagnosticSeverity.Warning
                );
                diag.source = 'CraftIDE';
                diag.code = 'MC_DEPRECATED';
                diagnostics.push(diag);
            }
        }
    }

    collection.set(document.uri, diagnostics);
}

/**
 * Basit Markdown → HTML dönüştürücü
 */
function markdownToHtml(md: string): string {
    return md
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

export function deactivate() {
    console.log('🧱 CraftIDE Minecraft Tools deactivated.');
}
