/**
 * CraftIDE — Skript Language Definition for Monaco Editor
 * Syntax highlighting, autocomplete, and snippets for Skript (.sk files)
 */

(function () {
    // Wait for Monaco to be available
    function registerSkriptLanguage() {
        if (!window.monaco) {
            setTimeout(registerSkriptLanguage, 500);
            return;
        }

        const monaco = window.monaco;

        // Register language
        monaco.languages.register({ id: 'skript', extensions: ['.sk'] });

        // Tokenizer (Monarch syntax highlighting)
        monaco.languages.setMonarchTokensProvider('skript', {
            keywords: [
                'if', 'else', 'else if', 'loop', 'while', 'return', 'stop', 'exit',
                'set', 'add', 'remove', 'delete', 'clear', 'reset',
                'send', 'broadcast', 'message', 'log',
                'cancel', 'uncancel', 'wait', 'make',
                'give', 'take', 'drop', 'spawn', 'kill', 'teleport',
                'true', 'false', 'is', 'are', 'was', 'were', 'not',
                'and', 'or', 'to', 'from', 'in', 'at', 'of', 'with', 'without',
                'every', 'all', 'any', 'none', 'no',
                'trigger', 'permission', 'usage', 'aliases', 'description',
                'cooldown', 'executable by',
            ],
            events: [
                'on join', 'on quit', 'on leave', 'on death', 'on respawn',
                'on break', 'on place', 'on click', 'on right click', 'on left click',
                'on chat', 'on command', 'on damage', 'on heal',
                'on pickup', 'on drop', 'on craft', 'on consume',
                'on move', 'on fly', 'on sneak', 'on sprint',
                'on interact', 'on inventory click', 'on inventory close',
                'on projectile hit', 'on entity damage',
                'on world load', 'on world unload',
                'on bed enter', 'on bed leave',
                'on portal', 'on teleport',
                'on explosion', 'on lightning',
                'on grow', 'on form', 'on spread',
                'on server start', 'on server stop', 'on script load', 'on script unload',
            ],
            types: [
                'player', 'entity', 'block', 'item', 'location', 'world',
                'number', 'integer', 'text', 'string', 'boolean',
                'inventory', 'slot', 'enchantment', 'potion effect',
                'command sender', 'console', 'server',
            ],
            tokenizer: {
                root: [
                    // Comments
                    [/#.*$/, 'comment'],
                    // Options block
                    [/^options:/, 'keyword'],
                    [/^variables:/, 'keyword'],
                    [/^aliases:/, 'keyword'],
                    // Command definition
                    [/^command\s+\/\w+/, 'keyword'],
                    // Function definition
                    [/^function\s+\w+/, 'keyword'],
                    // Event handlers
                    [/^on\s+[\w\s]+:/, 'type'],
                    [/^every\s+[\w\s]+:/, 'type'],
                    // Option reference
                    [/\{@[\w.]+\}/, 'variable'],
                    // Variable
                    [/\{[\w._%-]+\}/, 'variable'],
                    // Placeholder
                    [/%[\w\s]+%/, 'string.escape'],
                    // Color codes
                    [/&[0-9a-fk-or]/, 'string.escape'],
                    // Strings
                    [/"/, 'string', '@string'],
                    // Numbers
                    [/\b\d+(\.\d+)?\b/, 'number'],
                    // Keywords
                    [/\b(if|else|loop|while|return|stop|exit|set|add|remove|delete|clear|send|broadcast|cancel|wait|give|take|drop|spawn|kill|teleport|make|trigger|permission|usage|cooldown)\b/i, 'keyword'],
                    [/\b(true|false|is|are|was|were|not|and|or|to|from|in|at|of|with|without|every|all|any|none|no)\b/i, 'keyword.flow'],
                    // Types
                    [/\b(player|entity|block|item|location|world|number|integer|text|string|boolean|inventory|console|server)\b/i, 'type'],
                ],
                string: [
                    [/[^"&%]+/, 'string'],
                    [/&[0-9a-fk-or]/, 'string.escape'],
                    [/%[\w\s]+%/, 'string.escape'],
                    [/"/, 'string', '@pop'],
                ],
            },
        });

        // Skript completions
        monaco.languages.registerCompletionItemProvider('skript', {
            provideCompletionItems: function (model, position) {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                const suggestions = [
                    // Event templates
                    { label: 'on join', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on join:\n\t', detail: 'Oyuncu sunucuya girdiğinde', range },
                    { label: 'on quit', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on quit:\n\t', detail: 'Oyuncu sunucudan çıktığında', range },
                    { label: 'on death', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on death:\n\t', detail: 'Oyuncu öldüğünde', range },
                    { label: 'on break', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on break:\n\t', detail: 'Blok kırıldığında', range },
                    { label: 'on place', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on place:\n\t', detail: 'Blok yerleştirildiğinde', range },
                    { label: 'on chat', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on chat:\n\t', detail: 'Oyuncu mesaj yazdığında', range },
                    { label: 'on click', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on click:\n\t', detail: 'Tıklama olayı', range },
                    { label: 'on damage', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on damage:\n\t', detail: 'Hasar olayı', range },
                    { label: 'on respawn', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on respawn:\n\t', detail: 'Oyuncu yeniden doğduğunda', range },
                    { label: 'on inventory click', kind: monaco.languages.CompletionItemKind.Event, insertText: 'on inventory click:\n\t', detail: 'Envanter tıklama', range },
                    // Command template
                    { label: 'command', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'command /${1:komut}:\n\tpermission: ${2:plugin.command}\n\ttrigger:\n\t\tsend "${3:Merhaba!}" to player\n', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Yeni komut tanımla', range },
                    // Function template
                    { label: 'function', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'function ${1:myFunction}(${2:p: player}):\n\t${3:send "Hello" to {_p}}\n', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Yeni fonksiyon tanımla', range },
                    // Common effects
                    { label: 'send', kind: monaco.languages.CompletionItemKind.Function, insertText: 'send "${1:mesaj}" to player', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Oyuncuya mesaj gönder', range },
                    { label: 'broadcast', kind: monaco.languages.CompletionItemKind.Function, insertText: 'broadcast "${1:mesaj}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Tüm sunucuya mesaj', range },
                    { label: 'teleport', kind: monaco.languages.CompletionItemKind.Function, insertText: 'teleport player to ${1:location}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Oyuncuyu ışınla', range },
                    { label: 'give', kind: monaco.languages.CompletionItemKind.Function, insertText: 'give player ${1:1} ${2:diamond}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Oyuncuya eşya ver', range },
                    { label: 'cancel event', kind: monaco.languages.CompletionItemKind.Function, insertText: 'cancel event', detail: 'Olayı iptal et', range },
                    { label: 'wait', kind: monaco.languages.CompletionItemKind.Function, insertText: 'wait ${1:1} second', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Bekle', range },
                    { label: 'set', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'set ${1:variable} to ${2:value}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Değişken ata', range },
                    // Options template
                    { label: 'options', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'options:\n\tprefix: &a[${1:Plugin}]&r\n', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Options bloğu', range },
                ];

                return { suggestions };
            }
        });

        console.log('⛏️ Skript language registered for Monaco!');
    }

    registerSkriptLanguage();
})();
