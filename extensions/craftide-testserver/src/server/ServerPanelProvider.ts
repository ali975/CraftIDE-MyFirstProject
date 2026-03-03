import * as vscode from 'vscode';
import { TestServerManager, ServerState } from './TestServerManager';

/**
 * Sunucu Kontrol Paneli — WebView
 * 
 * Activity bar'da gösterilen sunucu yönetim paneli.
 * Başlat/durdur/yeniden başlat butonları, canlı konsol,
 * komut gönderme ve sunucu durumu gösterimi.
 */
export class ServerPanelProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _consoleLines: string[] = [];

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly serverManager: TestServerManager,
    ) {
        // Sunucu durumu değiştiğinde UI güncelle
        serverManager.onStateChange((state) => {
            this._view?.webview.postMessage({ type: 'stateChange', state });
        });

        // Konsol çıktısı geldiğinde
        serverManager.onConsoleLine((line) => {
            this._consoleLines.push(line);
            if (this._consoleLines.length > 500) { this._consoleLines.shift(); }
            this._view?.webview.postMessage({ type: 'consoleLine', line });
        });
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this._getHtml();

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'start': await this.serverManager.start(); break;
                case 'stop': await this.serverManager.stop(); break;
                case 'restart': await this.serverManager.restart(); break;
                case 'command': this.serverManager.sendCommand(data.command); break;
                case 'getState':
                    webviewView.webview.postMessage({
                        type: 'stateChange',
                        state: this.serverManager.state,
                    });
                    break;
            }
        });
    }

    private _getHtml(): string {
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--vscode-font-family);background:var(--vscode-sideBar-background);color:var(--vscode-foreground);padding:12px;font-size:12px}
h3{font-size:13px;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.status{display:flex;align-items:center;gap:8px;padding:8px;background:var(--vscode-editor-background);border-radius:6px;margin-bottom:12px}
.dot{width:8px;height:8px;border-radius:50%;background:#636e72}
.dot.running{background:#2ecc71;box-shadow:0 0 8px #2ecc7188}
.dot.starting,.dot.stopping{background:#f39c12;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.btn-row{display:flex;gap:6px;margin-bottom:12px}
.btn{flex:1;padding:6px;border:1px solid var(--vscode-button-border,#3d3d5c);border-radius:4px;background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);font-size:11px;cursor:pointer;text-align:center;transition:opacity .2s}
.btn:hover{opacity:.8}
.btn.start{background:#2ecc71;color:#fff}
.btn.stop{background:#e74c3c;color:#fff}
.console{background:#0a0a15;border:1px solid #252547;border-radius:6px;padding:8px;height:250px;overflow-y:auto;font-family:'Consolas',monospace;font-size:10px;color:#b2bec3;margin-bottom:8px}
.console .line{margin-bottom:2px;word-break:break-all}
.console .err{color:#e74c3c}
.console .info{color:#3498db}
.console .warn{color:#f39c12}
.cmd-input{display:flex;gap:4px}
.cmd-input input{flex:1;padding:6px;background:var(--vscode-input-background);border:1px solid var(--vscode-input-border);border-radius:4px;color:var(--vscode-input-foreground);font-size:11px;outline:none}
.cmd-input button{padding:6px 12px;background:#3498db;border:none;border-radius:4px;color:#fff;font-size:11px;cursor:pointer}
.quick-cmds{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.qcmd{padding:3px 8px;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);border:none;border-radius:10px;font-size:9px;cursor:pointer}
.qcmd:hover{opacity:.8}
</style></head><body>
<h3>⛏️ Test Sunucusu</h3>
<div class="status"><div class="dot" id="dot"></div><span id="stateLabel">Kapalı</span></div>
<div class="btn-row">
<button class="btn start" onclick="send('start')">▶ Başlat</button>
<button class="btn stop" onclick="send('stop')">⬛ Durdur</button>
<button class="btn" onclick="send('restart')">🔄 Yenile</button>
</div>
<div class="console" id="console"></div>
<div class="cmd-input">
<input id="cmdIn" placeholder="Sunucu komutu girin..." onkeydown="if(event.key==='Enter')sendCmd()">
<button onclick="sendCmd()">Gönder</button>
</div>
<div class="quick-cmds">
<button class="qcmd" onclick="cmd('list')">👥 list</button>
<button class="qcmd" onclick="cmd('tps')">📊 tps</button>
<button class="qcmd" onclick="cmd('gc')">🧹 gc</button>
<button class="qcmd" onclick="cmd('plugins')">📦 plugins</button>
<button class="qcmd" onclick="cmd('reload confirm')">🔄 reload</button>
<button class="qcmd" onclick="cmd('timings on')">⏱ timings</button>
</div>
<script>
const vscode=acquireVsCodeApi();
const con=document.getElementById('console');
const dot=document.getElementById('dot');
const stateLabel=document.getElementById('stateLabel');
const labels={stopped:'Kapalı',starting:'Başlatılıyor...',running:'Çalışıyor',stopping:'Kapatılıyor...'};
function send(t){vscode.postMessage({type:t})}
function sendCmd(){const i=document.getElementById('cmdIn');if(i.value){vscode.postMessage({type:'command',command:i.value});addLine('> '+i.value);i.value=''}}
function cmd(c){vscode.postMessage({type:'command',command:c});addLine('> '+c)}
function addLine(l){const d=document.createElement('div');d.className='line';if(l.includes('ERROR')||l.includes('HATA'))d.className+=' err';else if(l.includes('INFO'))d.className+=' info';else if(l.includes('WARN'))d.className+=' warn';d.textContent=l;con.appendChild(d);con.scrollTop=con.scrollHeight}
window.addEventListener('message',e=>{const{type,state,line}=e.data;if(type==='stateChange'){dot.className='dot '+(state||'');stateLabel.textContent=labels[state]||state}if(type==='consoleLine'&&line)addLine(line)});
vscode.postMessage({type:'getState'});
</script></body></html>`;
    }
}
