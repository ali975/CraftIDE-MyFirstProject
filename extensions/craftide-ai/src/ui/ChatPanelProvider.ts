import * as vscode from 'vscode';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator';
import { PipelineState, ConversationMessage } from '../types';

/**
 * CraftIDE AI Sohbet Paneli — WebView UI
 * 
 * Markdown destekli sohbet arayüzü.
 * Tasarım kartı onay/düzenleme widget'ları,
 * dosya oluşturma bildirimleri, ve doğrulama
 * raporlarını inline gösterir.
 */
export class ChatPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'craftide.chatView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _orchestrator: AgentOrchestrator
    ) { }

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

        webviewView.webview.html = this._getHtml();

        // WebView → Extension mesaj dinleme
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this._handleUserMessage(data.message);
                    break;
                case 'approveDesign':
                    await this._orchestrator.approveDesign();
                    break;
                case 'cancelPipeline':
                    this._orchestrator.cancel();
                    break;
            }
        });

        // Agent olaylarını dinle → WebView'e ilet
        this._orchestrator.onMessage((msg) => {
            this._postToWebview('addMessage', msg);
        });

        this._orchestrator.onStateChange((state) => {
            this._postToWebview('stateChange', { state });
        });

        this._orchestrator.onDesignReady((design) => {
            this._postToWebview('designReady', design);
        });

        this._orchestrator.onValidationResult((report) => {
            this._postToWebview('validationResult', report);
        });
    }

    public show() {
        if (this._view) {
            this._view.show(true);
        }
    }

    private async _handleUserMessage(message: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('craftide');
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const files = await vscode.workspace.findFiles('**/*.{java,yml,yaml,gradle,properties,sk,json,toml}', '**/{node_modules,.git,release,dist,build,target}/**', 40);
        const existingFiles = files.map((file) => vscode.workspace.asRelativePath(file));
        const dependencies = existingFiles.filter((file) =>
            /plugin\.yml|paper-plugin\.yml|pom\.xml|build\.gradle|build\.gradle\.kts/i.test(file)
        );
        await this._orchestrator.processUserMessage(message, {
            name: 'Plugin',
            platform: config.get('defaultPlatform', 'paper'),
            minecraftVersion: config.get('defaultMinecraftVersion', '1.20.4'),
            rootPath: workspaceRoot,
            existingFiles,
            dependencies,
            projectSummary: `Workspace root: ${workspaceRoot || 'none'} | Indexed files: ${existingFiles.slice(0, 12).join(', ') || 'none'}`,
            knowledgePacks: ['vault', 'placeholderapi', 'worldguard', 'citizens', 'protocollib', 'folia'],
            apiHighlights: [
                'Prefer non-deprecated APIs for the selected Minecraft version.',
                'Command flows should define permissions and usage.',
                'Region, NPC, economy, and GUI requests may need ecosystem plugins.',
            ],
        });
    }

    private _postToWebview(type: string, data: any): void {
        this._view?.webview.postMessage({ type, data });
    }

    private _getHtml(): string {
        return /* html */ `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CraftIDE AI Chat</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: transparent;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .chat-header {
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chat-header h2 {
            font-size: 13px;
            font-weight: 600;
            background: linear-gradient(135deg, #2ecc71, #1abc9c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .status-badge {
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 10px;
            background: rgba(46, 204, 113, 0.15);
            color: #2ecc71;
        }

        .status-badge.designing { background: rgba(52, 152, 219, 0.15); color: #3498db; }
        .status-badge.coding { background: rgba(243, 156, 18, 0.15); color: #f39c12; }
        .status-badge.validating { background: rgba(155, 89, 182, 0.15); color: #9b59b6; }
        .status-badge.error { background: rgba(231, 76, 60, 0.15); color: #e74c3c; }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }

        .message {
            margin-bottom: 12px;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 12px;
            line-height: 1.6;
            animation: fadeIn 0.2s ease;
        }

        .message.user {
            background: rgba(46, 204, 113, 0.1);
            border: 1px solid rgba(46, 204, 113, 0.2);
            margin-left: 20px;
        }

        .message.assistant {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border, transparent);
            margin-right: 20px;
        }

        .message.system {
            background: rgba(108, 52, 131, 0.1);
            border: 1px solid rgba(108, 52, 131, 0.2);
            text-align: center;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .message .role {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .message.user .role { color: #2ecc71; }
        .message.assistant .role { color: #3498db; }

        .message pre {
            background: rgba(0,0,0,0.2);
            padding: 8px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 6px 0;
            font-size: 11px;
        }

        .design-card {
            background: rgba(52, 152, 219, 0.08);
            border: 1px solid rgba(52, 152, 219, 0.3);
            border-radius: 10px;
            padding: 14px;
            margin: 8px 0;
        }

        .design-card h3 {
            font-size: 13px;
            color: #3498db;
            margin-bottom: 8px;
        }

        .design-card .actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }

        .btn {
            padding: 6px 16px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-approve {
            background: #2ecc71;
            color: #1a1a2e;
        }
        .btn-approve:hover { background: #27ae60; }

        .btn-cancel {
            background: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
        }
        .btn-cancel:hover { background: rgba(231, 76, 60, 0.3); }

        .chat-input {
            padding: 12px;
            border-top: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
        }

        .chat-input textarea {
            width: 100%;
            background: var(--vscode-input-background);
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-input-border, transparent);
            border-radius: 8px;
            padding: 10px;
            font-family: var(--vscode-font-family);
            font-size: 12px;
            resize: none;
            outline: none;
            min-height: 50px;
        }

        .chat-input textarea:focus {
            border-color: #2ecc71;
        }

        .chat-input .input-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 8px;
        }

        .btn-send {
            background: #2ecc71;
            color: #1a1a2e;
            padding: 6px 20px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-send:hover { background: #27ae60; }
        .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .typing-indicator {
            display: none;
            padding: 8px 14px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .typing-indicator.active { display: block; }

        .typing-indicator span {
            animation: blink 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
            0%, 20% { opacity: 0.2; }
            50% { opacity: 1; }
            80%, 100% { opacity: 0.2; }
        }
    </style>
</head>
<body>
    <div class="chat-header">
        <h2>🧠 CraftIDE AI</h2>
        <span class="status-badge" id="statusBadge">Hazır</span>
    </div>

    <div class="chat-messages" id="chatMessages">
        <div class="message system">
            ⛏️ CraftIDE AI'a hoş geldin!<br>
            Nasıl bir plugin istediğini yaz, sana tasarlayıp kodlayalım.
        </div>
    </div>

    <div class="typing-indicator" id="typingIndicator">
        🧠 AI düşünüyor<span>.</span><span>.</span><span>.</span>
    </div>

    <div class="chat-input">
        <textarea id="chatInput" placeholder="Plugin fikrini yaz..." rows="2"></textarea>
        <div class="input-actions">
            <button class="btn-send" id="sendBtn" onclick="sendMessage()">⚡ Gönder</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatMessages = document.getElementById('chatMessages');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const statusBadge = document.getElementById('statusBadge');
        const typingIndicator = document.getElementById('typingIndicator');

        let currentState = 'idle';

        function sendMessage() {
            const message = chatInput.value.trim();
            if (!message || currentState === 'designing' || currentState === 'coding') return;
            
            vscode.postMessage({ type: 'sendMessage', message });
            chatInput.value = '';
        }

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        window.addEventListener('message', (event) => {
            const { type, data } = event.data;

            switch (type) {
                case 'addMessage':
                    addMessageToChat(data);
                    break;
                case 'stateChange':
                    updateState(data.state);
                    break;
                case 'designReady':
                    showDesignCard(data);
                    break;
                case 'validationResult':
                    // Validation handled via addMessage
                    break;
            }
        });

        function addMessageToChat(msg) {
            const div = document.createElement('div');
            div.className = 'message ' + msg.role;
            
            let content = '';
            if (msg.role !== 'system') {
                content += '<div class="role">' + 
                    (msg.role === 'user' ? '👤 Sen' : '🧠 CraftIDE AI') + 
                    '</div>';
            }
            
            // Format code blocks
            let text = msg.content;
            text = text.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>');
            text = text.replace(/\\n/g, '<br>');
            
            content += text;
            div.innerHTML = content;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function updateState(state) {
            currentState = state;
            const labels = {
                idle: 'Hazır',
                designing: 'Tasarlanıyor...',
                awaiting_approval: 'Onay Bekleniyor',
                coding: 'Kodlanıyor...',
                validating: 'Doğrulanıyor...',
                fixing: 'Düzeltiliyor...',
                complete: 'Tamamlandı ✅',
                error: 'Hata ❌',
            };
            statusBadge.textContent = labels[state] || state;
            statusBadge.className = 'status-badge ' + state;
            
            const isWorking = ['designing', 'coding', 'validating', 'fixing'].includes(state);
            typingIndicator.classList.toggle('active', isWorking);
            sendBtn.disabled = isWorking;
        }

        function showDesignCard(design) {
            const div = document.createElement('div');
            div.className = 'design-card';
            div.innerHTML = 
                '<h3>📋 Tasarım Kartı: ' + design.pluginName + '</h3>' +
                '<p>' + design.description + '</p>' +
                '<p><strong>Platform:</strong> ' + design.targetPlatform + ' | ' +
                '<strong>MC:</strong> ' + design.minecraftVersion + ' | ' +
                '<strong>Karmaşıklık:</strong> ' + design.estimatedComplexity + '</p>' +
                (design.commands.length ? '<p><strong>Komutlar:</strong> ' + 
                    design.commands.map(c => '/' + c.name).join(', ') + '</p>' : '') +
                (design.dependencies.length ? '<p><strong>Bağımlılıklar:</strong> ' + 
                    design.dependencies.map(d => d.name).join(', ') + '</p>' : '') +
                '<div class="actions">' +
                    '<button class="btn btn-approve" onclick="approveDesign()">✅ Onayla & Kodla</button>' +
                    '<button class="btn btn-cancel" onclick="cancelPipeline()">❌ İptal</button>' +
                '</div>';
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function approveDesign() {
            vscode.postMessage({ type: 'approveDesign' });
        }

        function cancelPipeline() {
            vscode.postMessage({ type: 'cancelPipeline' });
        }
    </script>
</body>
</html>`;
    }
}
