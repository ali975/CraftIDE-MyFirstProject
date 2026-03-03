import * as vscode from 'vscode';

/**
 * CraftIDE Template Market
 * 
 * Hazır plugin/skript şablonları sunar:
 * - Dahili şablon kütüphanesi
 * - Topluluk şablonları (gelecek: uzak repo)
 * - Kategori filtresi (ekonomi, PvP, mini-game, utility)
 * - Tek tıkla yeni proje oluşturma
 */
export class TemplateMarket {
    private _panel: vscode.WebviewPanel | undefined;

    constructor(private readonly extensionUri: vscode.Uri) { }

    open(): void {
        if (this._panel) { this._panel.reveal(vscode.ViewColumn.One); return; }

        this._panel = vscode.window.createWebviewPanel(
            'craftide.templateMarket',
            '📦 Template Market',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        this._panel.webview.html = this._getHtml();

        this._panel.webview.onDidReceiveMessage(async (data) => {
            if (data.type === 'useTemplate') {
                await this._applyTemplate(data.templateId);
            }
        });

        this._panel.onDidDispose(() => { this._panel = undefined; });
    }

    private async _applyTemplate(templateId: string): Promise<void> {
        const template = BUILTIN_TEMPLATES.find(t => t.id === templateId);
        if (!template) { return; }

        const folder = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Proje Klasörü Seç',
        });
        if (!folder?.[0]) { return; }

        const rootUri = folder[0];

        for (const file of template.files) {
            const fileUri = vscode.Uri.joinPath(rootUri, file.path);
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(rootUri, file.path.substring(0, file.path.lastIndexOf('/')))
            );
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(file.content, 'utf-8'));
        }

        await vscode.commands.executeCommand('vscode.openFolder', rootUri);
        vscode.window.showInformationMessage(`⛏️ "${template.name}" şablonu uygulandı!`);
    }

    private _getHtml(): string {
        const cards = BUILTIN_TEMPLATES.map(t => `
            <div class="card" onclick="use('${t.id}')">
                <div class="card-icon">${t.icon}</div>
                <div class="card-info">
                    <h4>${t.name}</h4>
                    <p>${t.description}</p>
                    <div class="card-tags">${t.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
                </div>
                <div class="card-meta">
                    <span>${t.platform}</span>
                    <span>${t.files.length} dosya</span>
                </div>
            </div>`).join('');

        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--vscode-font-family);background:#0d0d1a;color:#dfe6e9;padding:24px}
h2{font-size:18px;margin-bottom:4px;background:linear-gradient(135deg,#2ecc71,#3498db);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{font-size:12px;color:#636e72;margin-bottom:20px}
.search{width:100%;padding:10px 16px;background:#1a1a2e;border:1px solid #3d3d5c;border-radius:8px;color:#dfe6e9;font-size:13px;margin-bottom:20px;outline:none}
.search:focus{border-color:#2ecc71}
.cats{display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap}
.cat{padding:6px 14px;background:#1a1a2e;border:1px solid #3d3d5c;border-radius:16px;font-size:11px;cursor:pointer;transition:all .2s}
.cat:hover,.cat.active{background:#2ecc71;color:#0d0d1a;border-color:#2ecc71}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.card{background:#1a1a2e;border:1px solid #252547;border-radius:10px;padding:16px;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;gap:8px}
.card:hover{border-color:#2ecc71;transform:translateY(-2px);box-shadow:0 8px 24px rgba(46,204,113,.15)}
.card-icon{font-size:28px}
.card-info h4{font-size:13px;margin-bottom:4px}
.card-info p{font-size:11px;color:#b2bec3;line-height:1.5}
.card-tags{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
.tag{padding:2px 8px;background:#252547;border-radius:10px;font-size:9px;color:#b2bec3}
.card-meta{display:flex;justify-content:space-between;font-size:10px;color:#636e72;margin-top:auto;padding-top:8px;border-top:1px solid #252547}
</style></head><body>
<h2>📦 CraftIDE Template Market</h2>
<p class="subtitle">Hazır şablonlarla hızlıca plugin geliştirmeye başla!</p>
<input class="search" placeholder="🔍 Şablon ara..." oninput="filter(this.value)">
<div class="cats">
<div class="cat active" onclick="filterCat('all')">Tümü</div>
<div class="cat" onclick="filterCat('ekonomi')">💰 Ekonomi</div>
<div class="cat" onclick="filterCat('pvp')">⚔️ PvP</div>
<div class="cat" onclick="filterCat('utility')">🔧 Utility</div>
<div class="cat" onclick="filterCat('minigame')">🎮 Mini-Game</div>
<div class="cat" onclick="filterCat('skript')">📜 Skript</div>
</div>
<div class="grid" id="grid">${cards}</div>
<script>
const vscode=acquireVsCodeApi();
function use(id){vscode.postMessage({type:'useTemplate',templateId:id})}
function filter(q){document.querySelectorAll('.card').forEach(c=>{c.style.display=c.textContent.toLowerCase().includes(q.toLowerCase())?'flex':'none'})}
function filterCat(cat){document.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));event.target.classList.add('active');document.querySelectorAll('.card').forEach(c=>{c.style.display=cat==='all'||c.textContent.toLowerCase().includes(cat)?'flex':'none'})}
</script></body></html>`;
    }
}

// ─── Dahili Şablonlar ───────────────────────────────────────

interface TemplateDefinition {
    id: string;
    name: string;
    icon: string;
    description: string;
    platform: string;
    tags: string[];
    files: Array<{ path: string; content: string }>;
}

const BUILTIN_TEMPLATES: TemplateDefinition[] = [
    {
        id: 'economy-shop',
        name: 'Ekonomi Shop Plugin',
        icon: '💰',
        description: 'Vault entegreli GUI tabanlı shop sistemi. Özel fiyatlar, kategoriler ve admin yönetimi.',
        platform: 'Paper/Spigot',
        tags: ['ekonomi', 'vault', 'gui', 'utility'],
        files: [
            { path: 'src/main/java/com/example/shop/ShopPlugin.java', content: 'package com.example.shop;\n\nimport org.bukkit.plugin.java.JavaPlugin;\n\npublic class ShopPlugin extends JavaPlugin {\n    @Override\n    public void onEnable() {\n        saveDefaultConfig();\n        getLogger().info("ShopPlugin aktif!");\n    }\n}' },
            { path: 'src/main/resources/plugin.yml', content: 'name: ShopPlugin\nmain: com.example.shop.ShopPlugin\nversion: 1.0.0\napi-version: 1.20\ndepend: [Vault]\ncommands:\n  shop:\n    description: Shop menüsünü aç\n    usage: /shop' },
            { path: 'pom.xml', content: '<project>\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.example</groupId>\n  <artifactId>ShopPlugin</artifactId>\n  <version>1.0.0</version>\n</project>' },
        ],
    },
    {
        id: 'pvp-arena',
        name: 'PvP Arena Sistemi',
        icon: '⚔️',
        description: '1v1 ve takım PvP arena sistemi. Kuyruk, ödül ve istatistik desteği.',
        platform: 'Paper/Spigot',
        tags: ['pvp', 'arena', 'minigame'],
        files: [
            { path: 'src/main/java/com/example/arena/ArenaPlugin.java', content: 'package com.example.arena;\n\nimport org.bukkit.plugin.java.JavaPlugin;\n\npublic class ArenaPlugin extends JavaPlugin {\n    @Override\n    public void onEnable() {\n        saveDefaultConfig();\n        getLogger().info("ArenaPlugin aktif!");\n    }\n}' },
            { path: 'src/main/resources/plugin.yml', content: 'name: ArenaPlugin\nmain: com.example.arena.ArenaPlugin\nversion: 1.0.0\napi-version: 1.20\ncommands:\n  arena:\n    description: Arena komutları\n    usage: /arena <join|leave|list>' },
        ],
    },
    {
        id: 'skript-lobby',
        name: 'Lobi Sistemi (Skript)',
        icon: '🏠',
        description: 'Spawn koruma, hoş geldin mesajı, lobi eşyaları ve sunucu seçici.',
        platform: 'Skript',
        tags: ['skript', 'lobi', 'utility'],
        files: [
            { path: 'lobby.sk', content: 'options:\n\tprefix: &a[Lobi]&r\n\ncommand /spawn:\n\tpermission: lobby.spawn\n\ttrigger:\n\t\tteleport player to {spawn}\n\t\tsend "{@prefix} Spawn\'a ışınlandın!" to player\n\non join:\n\tteleport player to {spawn}\n\tsend "{@prefix} Hoş geldin %player%!" to player\n\tgive compass named "&bSunucu Seçici" to player\n\tgive clock named "&eLobi Ayarları" to player' },
        ],
    },
    {
        id: 'custom-enchant',
        name: 'Özel Büyü Sistemi',
        icon: '✨',
        description: 'Kendi büyülerini oluştur. GUI büyü seçici ve seviye sistemi.',
        platform: 'Paper/Spigot',
        tags: ['utility', 'büyü', 'gui'],
        files: [
            { path: 'src/main/java/com/example/enchant/EnchantPlugin.java', content: 'package com.example.enchant;\n\nimport org.bukkit.plugin.java.JavaPlugin;\n\npublic class EnchantPlugin extends JavaPlugin {\n    @Override\n    public void onEnable() {\n        saveDefaultConfig();\n        getLogger().info("EnchantPlugin aktif!");\n    }\n}' },
            { path: 'src/main/resources/plugin.yml', content: 'name: EnchantPlugin\nmain: com.example.enchant.EnchantPlugin\nversion: 1.0.0\napi-version: 1.20\ncommands:\n  enchant:\n    description: Büyü menüsünü aç' },
        ],
    },
    {
        id: 'skript-crates',
        name: 'Kasa Sistemi (Skript)',
        icon: '🎁',
        description: 'Açılabilir kasa sistemi. Animasyonlu açılış, ödül listesi, anahtar yönetimi.',
        platform: 'Skript',
        tags: ['skript', 'kasa', 'eğlence'],
        files: [
            { path: 'crates.sk', content: 'options:\n\tprefix: &6[Kasalar]&r\n\nccommand /kasa <text>:\n\tpermission: crates.open\n\ttrigger:\n\t\tif arg-1 is "aç":\n\t\t\tif {keys::%player%} > 0:\n\t\t\t\tremove 1 from {keys::%player%}\n\t\t\t\tset {_reward} to random element of {rewards::*}\n\t\t\t\tgive {_reward} to player\n\t\t\t\tsend "{@prefix} &a%{_reward}% kazandın!" to player\n\t\t\telse:\n\t\t\t\tsend "{@prefix} &cYeterli anahtarın yok!" to player' },
        ],
    },
    {
        id: 'minigame-spleef',
        name: 'Spleef Mini-Game',
        icon: '🎮',
        description: 'Kar topu atarak rakibin zeminini kır! Kuyruk, skor ve ödül sistemi.',
        platform: 'Paper/Spigot',
        tags: ['minigame', 'pvp', 'eğlence'],
        files: [
            { path: 'src/main/java/com/example/spleef/SpleefPlugin.java', content: 'package com.example.spleef;\n\nimport org.bukkit.plugin.java.JavaPlugin;\n\npublic class SpleefPlugin extends JavaPlugin {\n    @Override\n    public void onEnable() {\n        saveDefaultConfig();\n        getLogger().info("SpleefPlugin aktif!");\n    }\n}' },
            { path: 'src/main/resources/plugin.yml', content: 'name: SpleefPlugin\nmain: com.example.spleef.SpleefPlugin\nversion: 1.0.0\napi-version: 1.20\ncommands:\n  spleef:\n    description: Spleef komutları\n    usage: /spleef <join|leave>' },
        ],
    },
];
