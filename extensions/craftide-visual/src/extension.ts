import * as vscode from 'vscode';
import { VisualPluginBuilder } from './builder/VisualPluginBuilder';
import { GeometryEngine } from './engine/GeometryEngine';

/**
 * CraftIDE Visual Tools Extension — Ana giriş noktası
 * 
 * Bileşenler:
 * - Çift Yönlü AST Derleyici (kod ↔ görsel)
 * - Görsel Plugin Builder (node-based drag & drop)
 * - 3D Geometri Motoru (parçacık, vektör, yapı)
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🎨 CraftIDE Visual Tools activated!');

    const builder = new VisualPluginBuilder(context.extensionUri);
    const engine = new GeometryEngine(context.extensionUri);

    // Görsel Builder
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.visual.openBuilder', () => {
            const editor = vscode.window.activeTextEditor;
            const code = editor?.document.getText();
            const lang = editor?.document.languageId as 'java' | 'skript' | undefined;
            builder.open(code, lang === 'java' || lang === 'skript' ? lang : undefined);
        })
    );

    // 3D Motor
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.visual.open3DEngine', () => {
            engine.open();
        })
    );

    // Sync komutları
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.visual.syncCodeToVisual', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const lang = editor.document.languageId as 'java' | 'skript';
                builder.open(editor.document.getText(), lang);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.visual.syncVisualToCode', () => {
            vscode.window.showInformationMessage(
                '⛏️ Visual → Code senkronizasyonu: Builder\'da "Dışa Aktar" butonunu kullanın.'
            );
        })
    );
}

export function deactivate() {
    console.log('🎨 CraftIDE Visual Tools deactivated.');
}
