import * as vscode from 'vscode';

/**
 * CraftIDE Skript Autocomplete Provider
 * 
 * .sk dosyaları için akıllı otomatik tamamlama sağlar.
 * 
 * Tamamlama kategorileri:
 * - Event'ler (on join, on break, on death...)
 * - Effect'ler (send, broadcast, teleport, give...)
 * - Condition'lar (if player has permission, is op...)
 * - Expression'lar (player's health, location of player...)
 * - Type'lar (player, entity, block, item...)
 * - Addon syntax'ları (skript-gui, SkBee...)
 */
export class SkriptCompletionProvider implements vscode.CompletionItemProvider {

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.CompletionItem[] {
        const lineText = document.lineAt(position.line).text;
        const linePrefix = lineText.substring(0, position.character).trim();

        const items: vscode.CompletionItem[] = [];

        // root level — top-level keyword'ler
        if (position.character <= 2 || linePrefix === '') {
            items.push(...this._getTopLevelCompletions());
        }

        // "on " ile başlarsa — event'ler
        if (linePrefix.startsWith('on ') || linePrefix === 'on') {
            items.push(...this._getEventCompletions());
        }

        // trigger altında — effect'ler
        if (this._isInTriggerBlock(document, position)) {
            items.push(...this._getEffectCompletions());
            items.push(...this._getConditionCompletions());
            items.push(...this._getExpressionCompletions());
        }

        // command tanımı altında — property'ler
        if (this._isInCommandBlock(document, position)) {
            items.push(...this._getCommandPropertyCompletions());
        }

        return items;
    }

    // ─── Top-Level ──────────────────────────────────────────

    private _getTopLevelCompletions(): vscode.CompletionItem[] {
        return [
            this._createItem('command', 'Yeni bir komut tanımla', 'command /${1:komut} <${2:text}>:\n\tpermission: ${3:perm}\n\ttrigger:\n\t\t${4:send "Merhaba!" to player}', vscode.CompletionItemKind.Module),
            this._createItem('on', 'Yeni bir event dinleyici', 'on ${1:join}:\n\t${2:send "Hoş geldin!" to player}', vscode.CompletionItemKind.Event),
            this._createItem('every', 'Zamanlayıcı (scheduler)', 'every ${1:5 seconds}:\n\t${2:broadcast "Zamanlayıcı!"}', vscode.CompletionItemKind.Event),
            this._createItem('function', 'Yeni bir fonksiyon tanımla', 'function ${1:fonksiyon}(${2:p: player}) :: ${3:text}:\n\t${4:return "sonuç"}', vscode.CompletionItemKind.Function),
            this._createItem('options', 'Sabit değişkenler bloğu', 'options:\n\tprefix: ${1:&a[Plugin]&r}', vscode.CompletionItemKind.Module),
            this._createItem('variables', 'Değişken başlangıç değerleri', 'variables:\n\t{${1:değişken}} = ${2:0}', vscode.CompletionItemKind.Module),
            this._createItem('import', 'Java sınıfı import (skript-reflect)', 'import:\n\t${1:java.util.HashMap}', vscode.CompletionItemKind.Module),
        ];
    }

    // ─── Event'ler ──────────────────────────────────────────

    private _getEventCompletions(): vscode.CompletionItem[] {
        const events = [
            { label: 'join', detail: 'Oyuncu sunucuya katıldığında', full: 'on join:' },
            { label: 'quit', detail: 'Oyuncu sunucudan ayrıldığında', full: 'on quit:' },
            { label: 'death', detail: 'Oyuncu/entity öldüğünde', full: 'on death of player:' },
            { label: 'respawn', detail: 'Oyuncu yeniden doğduğunda', full: 'on respawn:' },
            { label: 'break', detail: 'Blok kırıldığında', full: 'on break:' },
            { label: 'place', detail: 'Blok yerleştirildiğinde', full: 'on place:' },
            { label: 'right click', detail: 'Sağ tık', full: 'on right click:' },
            { label: 'left click', detail: 'Sol tık', full: 'on left click:' },
            { label: 'chat', detail: 'Oyuncu mesaj yazdığında', full: 'on chat:' },
            { label: 'damage', detail: 'Entity hasar aldığında', full: 'on damage:' },
            { label: 'inventory click', detail: 'Envanterde tıklama', full: 'on inventory click:' },
            { label: 'inventory close', detail: 'Envanter kapatıldığında', full: 'on inventory close:' },
            { label: 'command', detail: 'Komut çalıştırıldığında', full: 'on command:' },
            { label: 'world load', detail: 'Dünya yüklendiğinde', full: 'on world load:' },
            { label: 'spawn', detail: 'Entity doğduğunda', full: 'on spawn of creeper:' },
            { label: 'projectile hit', detail: 'Mermi çarptığında', full: 'on projectile hit:' },
            { label: 'sneak toggle', detail: 'Eğilme değiştiğinde', full: 'on sneak toggle:' },
            { label: 'consume', detail: 'Eşya tüketildiğinde', full: 'on consume:' },
            { label: 'craft', detail: 'Eşya üretildiğinde', full: 'on craft:' },
            { label: 'drop', detail: 'Eşya düşürüldüğünde', full: 'on drop:' },
            { label: 'pickup', detail: 'Eşya toplandığında', full: 'on pickup:' },
            { label: 'bed enter', detail: 'Yatağa girildiğinde', full: 'on bed enter:' },
            { label: 'fishing', detail: 'Balık tutulduğunda', full: 'on fishing:' },
            { label: 'enchant', detail: 'Eşya büyülendiğinde', full: 'on enchant:' },
            { label: 'level change', detail: 'Seviye değiştiğinde', full: 'on level change:' },
        ];

        return events.map(e => {
            const item = new vscode.CompletionItem(e.label, vscode.CompletionItemKind.Event);
            item.detail = `🎯 ${e.detail}`;
            item.insertText = new vscode.SnippetString(`${e.label}:\n\t$0`);
            item.documentation = new vscode.MarkdownString(`\`${e.full}\`\n\n${e.detail}`);
            return item;
        });
    }

    // ─── Effect'ler ─────────────────────────────────────────

    private _getEffectCompletions(): vscode.CompletionItem[] {
        return [
            this._createItem('send', 'Oyuncuya mesaj gönder', 'send "${1:Merhaba!}" to ${2:player}', vscode.CompletionItemKind.Method),
            this._createItem('broadcast', 'Tüm oyunculara mesaj gönder', 'broadcast "${1:Duyuru!}"', vscode.CompletionItemKind.Method),
            this._createItem('teleport', 'Oyuncuyu ışınla', 'teleport ${1:player} to ${2:location}', vscode.CompletionItemKind.Method),
            this._createItem('give', 'Eşya ver', 'give ${1:1} ${2:diamond} to ${3:player}', vscode.CompletionItemKind.Method),
            this._createItem('remove', 'Eşya kaldır', 'remove ${1:1} ${2:diamond} from ${3:player}', vscode.CompletionItemKind.Method),
            this._createItem('set', 'Değer ayarla', 'set ${1:{variable}} to ${2:value}', vscode.CompletionItemKind.Method),
            this._createItem('add', 'Değer ekle', 'add ${1:1} to ${2:{variable}}', vscode.CompletionItemKind.Method),
            this._createItem('kill', 'Entity öldür', 'kill ${1:player}', vscode.CompletionItemKind.Method),
            this._createItem('cancel event', 'Event\'i iptal et', 'cancel event', vscode.CompletionItemKind.Method),
            this._createItem('wait', 'Bekle', 'wait ${1:1 second}', vscode.CompletionItemKind.Method),
            this._createItem('execute console command', 'Konsol komutu çalıştır', 'execute console command "${1:say Merhaba}"', vscode.CompletionItemKind.Method),
            this._createItem('play sound', 'Ses çal', 'play sound "${1:ENTITY_EXPERIENCE_ORB_PICKUP}" with volume ${2:1} and pitch ${3:1} at ${4:player}', vscode.CompletionItemKind.Method),
            this._createItem('open chest', 'Envanter aç', 'open chest inventory with ${1:3} rows named "${2:Menü}" to ${3:player}', vscode.CompletionItemKind.Method),
            this._createItem('set slot', 'Envanter slot ayarla', 'set slot ${1:0} of ${2:player}\'s current inventory to ${3:diamond} named "${4:Eşya}"', vscode.CompletionItemKind.Method),
            this._createItem('spawn', 'Entity spawn', 'spawn ${1:zombie} at ${2:player}', vscode.CompletionItemKind.Method),
            this._createItem('apply', 'Efekt uygula', 'apply ${1:speed} ${2:1} to ${3:player} for ${4:10 seconds}', vscode.CompletionItemKind.Method),
            this._createItem('strike lightning', 'Yıldırım düşür', 'strike lightning at ${1:player}', vscode.CompletionItemKind.Method),
            this._createItem('set block', 'Blok ayarla', 'set block at ${1:location} to ${2:stone}', vscode.CompletionItemKind.Method),
            this._createItem('heal', 'İyileştir', 'heal ${1:player}', vscode.CompletionItemKind.Method),
            this._createItem('feed', 'Doyur', 'feed ${1:player}', vscode.CompletionItemKind.Method),
        ];
    }

    // ─── Condition'lar ──────────────────────────────────────

    private _getConditionCompletions(): vscode.CompletionItem[] {
        return [
            this._createItem('if', 'Koşul bloğu', 'if ${1:player has permission "${2:perm}"}:\n\t${3:send "OK" to player}', vscode.CompletionItemKind.Keyword),
            this._createItem('else if', 'Alternatif koşul', 'else if ${1:condition}:\n\t${2:effect}', vscode.CompletionItemKind.Keyword),
            this._createItem('else', 'Aksi durumda', 'else:\n\t${1:effect}', vscode.CompletionItemKind.Keyword),
            this._createItem('loop', 'Döngü', 'loop ${1:all players}:\n\t${2:send "Merhaba!" to loop-player}', vscode.CompletionItemKind.Keyword),
            this._createItem('while', 'While döngüsü', 'while ${1:{count} < 10}:\n\tadd 1 to {count}\n\twait 1 tick', vscode.CompletionItemKind.Keyword),
            this._createItem('stop', 'Trigger\'ı durdur', 'stop', vscode.CompletionItemKind.Keyword),
        ];
    }

    // ─── Expression'lar ─────────────────────────────────────

    private _getExpressionCompletions(): vscode.CompletionItem[] {
        return [
            this._createItem("player's health", 'Oyuncunun canı', "player's health", vscode.CompletionItemKind.Property),
            this._createItem("player's food level", 'Oyuncunun açlık seviyesi', "player's food level", vscode.CompletionItemKind.Property),
            this._createItem("player's gamemode", 'Oyun modu', "player's gamemode", vscode.CompletionItemKind.Property),
            this._createItem("player's location", 'Oyuncunun konumu', "player's location", vscode.CompletionItemKind.Property),
            this._createItem("player's inventory", 'Oyuncunun envanteri', "player's inventory", vscode.CompletionItemKind.Property),
            this._createItem("player's level", 'XP seviyesi', "player's level", vscode.CompletionItemKind.Property),
            this._createItem("player's name", 'Oyuncu adı', "player's name", vscode.CompletionItemKind.Property),
            this._createItem("player's uuid", 'Benzersiz kimlik', "player's uuid", vscode.CompletionItemKind.Property),
            this._createItem('number of all players', 'Çevrimiçi oyuncu sayısı', 'number of all players', vscode.CompletionItemKind.Property),
            this._createItem('event-block', 'Event\'teki blok', 'event-block', vscode.CompletionItemKind.Property),
            this._createItem('event-entity', 'Event\'teki entity', 'event-entity', vscode.CompletionItemKind.Property),
        ];
    }

    // ─── Command Property'leri ──────────────────────────────

    private _getCommandPropertyCompletions(): vscode.CompletionItem[] {
        return [
            this._createItem('trigger', 'Komut çalıştırıldığında ne olur', 'trigger:\n\t${1:send "Çalıştı!" to player}', vscode.CompletionItemKind.Property),
            this._createItem('permission', 'İzin gereksinimi', 'permission: ${1:plugin.komut}', vscode.CompletionItemKind.Property),
            this._createItem('description', 'Komut açıklaması', 'description: ${1:Komut açıklaması}', vscode.CompletionItemKind.Property),
            this._createItem('usage', 'Kullanım şekli', 'usage: ${1:/<command> <args>}', vscode.CompletionItemKind.Property),
            this._createItem('aliases', 'Komut kısayolları', 'aliases: ${1:/kısayol}', vscode.CompletionItemKind.Property),
            this._createItem('cooldown', 'Bekleme süresi', 'cooldown: ${1:30 seconds}', vscode.CompletionItemKind.Property),
            this._createItem('cooldown message', 'Bekleme mesajı', 'cooldown message: ${1:Bekleyin: %remaining time%}', vscode.CompletionItemKind.Property),
            this._createItem('permission message', 'İzin hata mesajı', 'permission message: ${1:Bu komutu kullanamazsın!}', vscode.CompletionItemKind.Property),
        ];
    }

    // ─── Yardımcılar ────────────────────────────────────────

    private _createItem(
        label: string,
        detail: string,
        snippet: string,
        kind: vscode.CompletionItemKind
    ): vscode.CompletionItem {
        const item = new vscode.CompletionItem(label, kind);
        item.detail = `⛏️ ${detail}`;
        item.insertText = new vscode.SnippetString(snippet);
        item.documentation = new vscode.MarkdownString(`\`${label}\`\n\n${detail}`);
        return item;
    }

    private _isInTriggerBlock(document: vscode.TextDocument, position: vscode.Position): boolean {
        for (let i = position.line - 1; i >= 0; i--) {
            const line = document.lineAt(i).text.trim();
            if (line === 'trigger:' || line.startsWith('on ') || line.startsWith('every ')) {
                return true;
            }
            if (line.startsWith('command ') || line.startsWith('function ') || line === 'options:') {
                return false;
            }
        }
        return false;
    }

    private _isInCommandBlock(document: vscode.TextDocument, position: vscode.Position): boolean {
        for (let i = position.line - 1; i >= 0; i--) {
            const line = document.lineAt(i).text.trim();
            if (line.startsWith('command ')) { return true; }
            if (line.startsWith('on ') || line.startsWith('function ') || line === '') { return false; }
        }
        return false;
    }
}
