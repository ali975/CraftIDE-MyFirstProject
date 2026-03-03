import * as vscode from 'vscode';

/**
 * CraftIDE Welcome View — WebView tabanlı hoş geldin paneli
 * 
 * Activity bar'dan erişilen ana panel.
 * Yeni proje oluşturma, son projeler, AI sohbet başlatma
 * ve eğitim kaynaklarına erişim sağlar.
 */
export class WelcomeViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'craftide.welcomeView';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // WebView'den gelen mesajları dinle
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'newProject':
                    await vscode.commands.executeCommand('craftide.newProject');
                    break;
                case 'openProject':
                    await vscode.commands.executeCommand('vscode.openFolder');
                    break;
                case 'openAIChat':
                    await vscode.commands.executeCommand('craftide.openChat');
                    break;
                case 'openTutorial':
                    const tutorialUrl = data.url || 'https://craftide.dev/docs';
                    await vscode.env.openExternal(vscode.Uri.parse(tutorialUrl));
                    break;
            }
        });
    }

    public show() {
        if (this._view) {
            this._view.show(true);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const lang = vscode.workspace
            .getConfiguration('craftide')
            .get<string>('language', 'tr');

        const i18n = lang === 'tr' ? TR_STRINGS : EN_STRINGS;

        return /* html */ `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CraftIDE</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family), 'Segoe UI', sans-serif;
            color: var(--vscode-foreground);
            background: transparent;
            padding: 16px;
        }

        .logo-section {
            text-align: center;
            padding: 20px 0;
            margin-bottom: 16px;
        }

        .logo-section h1 {
            font-size: 22px;
            font-weight: 700;
            background: linear-gradient(135deg, #2ecc71, #1abc9c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 4px;
        }

        .logo-section .subtitle {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .action-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 20px;
        }

        .action-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px 8px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border, transparent);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
        }

        .action-card:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: #2ecc71;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(46, 204, 113, 0.15);
        }

        .action-card .icon {
            font-size: 28px;
            margin-bottom: 8px;
        }

        .action-card .label {
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .action-card .desc {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        .action-card.primary {
            grid-column: span 2;
            background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(26, 188, 156, 0.1));
            border-color: rgba(46, 204, 113, 0.3);
        }

        .action-card.primary:hover {
            background: linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(26, 188, 156, 0.2));
            border-color: #2ecc71;
        }

        .section-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
        }

        .section {
            margin-bottom: 20px;
        }

        .tutorial-list {
            list-style: none;
        }

        .tutorial-list li {
            padding: 8px 12px;
            margin-bottom: 4px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s ease;
        }

        .tutorial-list li:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .tutorial-list li .emoji {
            font-size: 16px;
        }

        .version-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            background: rgba(108, 52, 131, 0.3);
            color: #9b59b6;
            margin-top: 8px;
        }

        .ai-prompt {
            padding: 12px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border, transparent);
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .ai-prompt textarea {
            width: 100%;
            background: transparent;
            border: none;
            outline: none;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: 12px;
            resize: none;
            min-height: 60px;
        }

        .ai-prompt textarea::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }

        .ai-prompt .send-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            padding: 8px;
            margin-top: 8px;
            background: #2ecc71;
            color: #1a1a2e;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .ai-prompt .send-btn:hover {
            background: #27ae60;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
            animation: fadeIn 0.3s ease forwards;
        }

        .fade-in:nth-child(1) { animation-delay: 0s; }
        .fade-in:nth-child(2) { animation-delay: 0.05s; }
        .fade-in:nth-child(3) { animation-delay: 0.1s; }
        .fade-in:nth-child(4) { animation-delay: 0.15s; }
    </style>
</head>
<body>
    <div class="logo-section fade-in">
        <h1>⛏️ CraftIDE</h1>
        <div class="subtitle">${i18n.subtitle}</div>
        <div class="version-badge">v0.1.0 — Alpha</div>
    </div>

    <div class="action-grid">
        <div class="action-card primary fade-in" onclick="action('newProject')">
            <span class="icon">🚀</span>
            <span class="label">${i18n.newProject}</span>
            <span class="desc">${i18n.newProjectDesc}</span>
        </div>
        <div class="action-card fade-in" onclick="action('openProject')">
            <span class="icon">📂</span>
            <span class="label">${i18n.openProject}</span>
        </div>
        <div class="action-card fade-in" onclick="action('openAIChat')">
            <span class="icon">🧠</span>
            <span class="label">${i18n.aiChat}</span>
        </div>
    </div>

    <div class="section fade-in">
        <div class="section-title">💬 ${i18n.aiPromptTitle}</div>
        <div class="ai-prompt">
            <textarea id="aiInput" placeholder="${i18n.aiPlaceholder}" rows="3"></textarea>
            <button class="send-btn" onclick="sendAIMessage()">
                ⚡ ${i18n.aiSend}
            </button>
        </div>
    </div>

    <div class="section fade-in">
        <div class="section-title">🎓 ${i18n.tutorials}</div>
        <ul class="tutorial-list">
            <li onclick="tutorial('first-plugin')">
                <span class="emoji">⚡</span>
                ${i18n.tutorial1}
            </li>
            <li onclick="tutorial('skript-quick-start')">
                <span class="emoji">📜</span>
                ${i18n.tutorial2}
            </li>
            <li onclick="tutorial('ai-plugin-dev')">
                <span class="emoji">🧠</span>
                ${i18n.tutorial3}
            </li>
            <li onclick="tutorial('visual-builder')">
                <span class="emoji">🎨</span>
                ${i18n.tutorial4}
            </li>
        </ul>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function action(type) {
            vscode.postMessage({ type });
        }

        function tutorial(id) {
            vscode.postMessage({ 
                type: 'openTutorial', 
                url: 'https://craftide.dev/docs/' + id 
            });
        }

        function sendAIMessage() {
            const input = document.getElementById('aiInput');
            const message = input.value.trim();
            if (message) {
                vscode.postMessage({ 
                    type: 'openAIChat', 
                    message 
                });
                input.value = '';
            }
        }

        // Enter tuşuyla gönderme (Shift+Enter yeni satır)
        document.getElementById('aiInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
            }
        });
    </script>
</body>
</html>`;
    }
}

// ─── Lokalizasyon ──────────────────────────────────────────

const TR_STRINGS = {
    subtitle: 'Minecraft Geliştirme Stüdyosu',
    newProject: 'Yeni Plugin Oluştur',
    newProjectDesc: 'Spigot, Paper, Fabric, Skript',
    openProject: 'Proje Aç',
    aiChat: 'AI Asistan',
    aiPromptTitle: 'AI ile Plugin Oluştur',
    aiPlaceholder: 'Nasıl bir plugin istediğini yaz...\nÖrnek: "Oyuncular /shop yazınca bir mağaza menüsü açılsın"',
    aiSend: 'AI ile Oluştur',
    tutorials: 'Eğitimler',
    tutorial1: 'İlk Plugin\'ini 5 Dakikada Yap',
    tutorial2: 'Skript ile Hızlı Başlangıç',
    tutorial3: 'AI ile Plugin Geliştirme',
    tutorial4: 'Görsel Plugin Builder Kullanımı',
};

const EN_STRINGS = {
    subtitle: 'Minecraft Development Studio',
    newProject: 'New Plugin Project',
    newProjectDesc: 'Spigot, Paper, Fabric, Skript',
    openProject: 'Open Project',
    aiChat: 'AI Assistant',
    aiPromptTitle: 'Create Plugin with AI',
    aiPlaceholder: 'Describe the plugin you want...\nExample: "Create a shop GUI that opens when players type /shop"',
    aiSend: 'Generate with AI',
    tutorials: 'Tutorials',
    tutorial1: 'Make Your First Plugin in 5 Minutes',
    tutorial2: 'Quick Start with Skript',
    tutorial3: 'Plugin Development with AI',
    tutorial4: 'Using the Visual Plugin Builder',
};
