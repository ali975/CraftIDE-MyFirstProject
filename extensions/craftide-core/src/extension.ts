import * as vscode from 'vscode';
import { WelcomeViewProvider } from './welcome/WelcomeViewProvider';
import { ProjectScaffolder } from './scaffolding/ProjectScaffolder';

/**
 * CraftIDE Core Extension — Ana giriş noktası
 * 
 * Bu extension CraftIDE'nin temel işlevlerini sağlar:
 * - Minecraft koyu tema
 * - Hoş geldin paneli (Welcome View)
 * - Proje oluşturma (scaffolding)
 * - CraftIDE activity bar
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('⛏️ CraftIDE Core activated!');

    // Welcome View Provider
    const welcomeProvider = new WelcomeViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'craftide.welcomeView',
            welcomeProvider
        )
    );

    // Proje Scaffolder
    const scaffolder = new ProjectScaffolder();

    // Komutlar
    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.welcome', () => {
            welcomeProvider.show();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('craftide.newProject', async () => {
            await scaffolder.createNewProject();
        })
    );

    // İlk açılışta tema kontrolü
    const config = vscode.workspace.getConfiguration('workbench');
    const currentTheme = config.get<string>('colorTheme');
    if (!currentTheme || !currentTheme.includes('CraftIDE')) {
        // İlk kurulumda CraftIDE temasını öner
        const action = await vscode.window.showInformationMessage(
            '⛏️ CraftIDE Minecraft temasını aktif etmek ister misiniz?',
            'Evet, aktif et',
            'Hayır'
        );
        if (action === 'Evet, aktif et') {
            await config.update('colorTheme', 'CraftIDE Dark — Minecraft', true);
        }
    }

    // Status bar item
    const statusItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    const mcVersion = vscode.workspace
        .getConfiguration('craftide')
        .get<string>('defaultMinecraftVersion', '1.20.4');
    statusItem.text = `⛏️ MC ${mcVersion}`;
    statusItem.tooltip = 'CraftIDE — Minecraft Version';
    statusItem.command = 'craftide.welcome';
    statusItem.show();
    context.subscriptions.push(statusItem);
}

export function deactivate() {
    console.log('⛏️ CraftIDE Core deactivated.');
}
