/**
 * CraftIDE Çift Yönlü AST Derleyici
 * 
 * Java/Skript kaynak kodunu Abstract Syntax Tree (AST)'ye
 * çevirir ve AST'yi görsel node grafiğine dönüştürür.
 * Çift yönlü senkronizasyon sağlar.
 * 
 * Akış:
 * Görsel Node Graph ↔ AST (orta temsil) ↔ Kaynak Kod
 */

// ─── AST Düğüm Tipleri ─────────────────────────────────────

export type AstNodeType =
    | 'plugin'        // Ana plugin sınıfı
    | 'command'       // Komut handler
    | 'event'         // Event listener
    | 'condition'     // If/else
    | 'loop'          // For/while
    | 'action'        // Metod çağrısı (send, teleport, give...)
    | 'variable'      // Değişken tanımı
    | 'gui'           // GUI oluşturma
    | 'scheduler'     // BukkitScheduler
    | 'config'        // Config okuma/yazma
    | 'function'      // Fonksiyon tanımı
    | 'expression'    // İfade (string, number, player...)
    ;

export interface AstNode {
    id: string;
    type: AstNodeType;
    label: string;
    properties: Record<string, any>;
    children: AstNode[];
    position?: { line: number; column: number };
    metadata?: {
        javaClass?: string;
        skriptSyntax?: string;
        description?: string;
    };
}

// ─── Görsel Node (UI temsili) ───────────────────────────────

export interface VisualNode {
    id: string;
    type: AstNodeType;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    icon: string;
    inputs: VisualPort[];
    outputs: VisualPort[];
    properties: Record<string, any>;
    collapsed: boolean;
}

export interface VisualPort {
    id: string;
    name: string;
    type: 'flow' | 'data';
    connected: boolean;
}

export interface VisualEdge {
    id: string;
    sourceNode: string;
    sourcePort: string;
    targetNode: string;
    targetPort: string;
}

export interface VisualGraph {
    nodes: VisualNode[];
    edges: VisualEdge[];
    viewport: { x: number; y: number; zoom: number };
}

// ─── Derleyici ──────────────────────────────────────────────

export class BidirectionalCompiler {
    private _nodeCounter = 0;

    /**
     * Java kodunu AST'ye parse et
     */
    parseJavaToAst(code: string): AstNode {
        const root: AstNode = {
            id: this._nextId(),
            type: 'plugin',
            label: 'Plugin',
            properties: {},
            children: [],
        };

        const lines = code.split('\n');
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();

            // Sınıf adı tespiti
            const classMatch = line.match(/public\s+class\s+(\w+)\s+extends\s+JavaPlugin/);
            if (classMatch) {
                root.label = classMatch[1];
                root.properties.className = classMatch[1];
            }

            // @EventHandler — event listener tespiti
            if (line === '@EventHandler') {
                const methodLine = lines[i + 1]?.trim() || '';
                const eventMatch = methodLine.match(/public\s+void\s+\w+\s*\((\w+)\s+\w+\)/);
                if (eventMatch) {
                    const eventNode = this._parseEventBlock(lines, i + 1, eventMatch[1]);
                    root.children.push(eventNode);
                    i = this._findBlockEnd(lines, i + 1);
                    continue;
                }
            }

            // Command executor tespiti
            if (line.includes('onCommand') && line.includes('CommandSender')) {
                const cmdNode = this._parseCommandBlock(lines, i);
                root.children.push(cmdNode);
                i = this._findBlockEnd(lines, i);
                continue;
            }

            // Scheduler tespiti
            if (line.includes('runTaskLater') || line.includes('runTaskTimer') || line.includes('runTaskAsynchronously')) {
                const schedNode: AstNode = {
                    id: this._nextId(),
                    type: 'scheduler',
                    label: 'Zamanlayıcı',
                    properties: { async: line.includes('Async') },
                    children: [],
                    position: { line: i, column: 0 },
                };
                root.children.push(schedNode);
            }

            i++;
        }

        return root;
    }

    /**
     * Skript kodunu AST'ye parse et
     */
    parseSkriptToAst(code: string): AstNode {
        const root: AstNode = {
            id: this._nextId(),
            type: 'plugin',
            label: 'Script',
            properties: {},
            children: [],
        };

        const lines = code.split('\n');
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();

            // Command
            const cmdMatch = line.match(/^command\s+\/(\S+)/);
            if (cmdMatch) {
                const cmdNode: AstNode = {
                    id: this._nextId(),
                    type: 'command',
                    label: `/${cmdMatch[1]}`,
                    properties: { name: cmdMatch[1] },
                    children: [],
                    position: { line: i, column: 0 },
                };
                // trigger bloğunu parse et
                const triggerStart = this._findLine(lines, i, 'trigger:');
                if (triggerStart > 0) {
                    cmdNode.children = this._parseSkriptBlock(lines, triggerStart + 1);
                }
                root.children.push(cmdNode);
                i = this._findNextTopLevel(lines, i + 1);
                continue;
            }

            // Event
            const evtMatch = line.match(/^on\s+(.+):/);
            if (evtMatch) {
                const evtNode: AstNode = {
                    id: this._nextId(),
                    type: 'event',
                    label: `on ${evtMatch[1]}`,
                    properties: { event: evtMatch[1] },
                    children: this._parseSkriptBlock(lines, i + 1),
                    position: { line: i, column: 0 },
                };
                root.children.push(evtNode);
                i = this._findNextTopLevel(lines, i + 1);
                continue;
            }

            // Function
            const funcMatch = line.match(/^function\s+(\w+)\((.*)\)/);
            if (funcMatch) {
                const funcNode: AstNode = {
                    id: this._nextId(),
                    type: 'function',
                    label: funcMatch[1],
                    properties: { name: funcMatch[1], params: funcMatch[2] },
                    children: this._parseSkriptBlock(lines, i + 1),
                    position: { line: i, column: 0 },
                };
                root.children.push(funcNode);
                i = this._findNextTopLevel(lines, i + 1);
                continue;
            }

            // Every (scheduler)
            const everyMatch = line.match(/^every\s+(.+):/);
            if (everyMatch) {
                const schedNode: AstNode = {
                    id: this._nextId(),
                    type: 'scheduler',
                    label: `every ${everyMatch[1]}`,
                    properties: { interval: everyMatch[1] },
                    children: this._parseSkriptBlock(lines, i + 1),
                    position: { line: i, column: 0 },
                };
                root.children.push(schedNode);
                i = this._findNextTopLevel(lines, i + 1);
                continue;
            }

            i++;
        }

        return root;
    }

    /**
     * AST'yi görsel node grafiğine dönüştür
     */
    astToVisualGraph(ast: AstNode): VisualGraph {
        const nodes: VisualNode[] = [];
        const edges: VisualEdge[] = [];

        // Root node
        const rootVisual = this._astNodeToVisual(ast, 400, 50);
        nodes.push(rootVisual);

        // Children
        let yOffset = 180;
        for (let i = 0; i < ast.children.length; i++) {
            const child = ast.children[i];
            const xOffset = 150 + i * 280;
            const childVisual = this._astNodeToVisual(child, xOffset, yOffset);
            nodes.push(childVisual);

            // Edge: root → child
            edges.push({
                id: `e-${rootVisual.id}-${childVisual.id}`,
                sourceNode: rootVisual.id,
                sourcePort: 'out-flow',
                targetNode: childVisual.id,
                targetPort: 'in-flow',
            });

            // Sub-children
            let subY = yOffset + 140;
            for (const subChild of child.children) {
                const subVisual = this._astNodeToVisual(subChild, xOffset, subY);
                nodes.push(subVisual);
                edges.push({
                    id: `e-${childVisual.id}-${subVisual.id}`,
                    sourceNode: childVisual.id,
                    sourcePort: 'out-flow',
                    targetNode: subVisual.id,
                    targetPort: 'in-flow',
                });
                subY += 100;
            }
        }

        return { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } };
    }

    /**
     * AST'den Java kodu üret
     */
    astToJava(ast: AstNode, packageName: string = 'com.example'): string {
        const className = ast.properties.className || ast.label || 'MyPlugin';
        let imports = new Set<string>();
        imports.add('org.bukkit.plugin.java.JavaPlugin');

        let eventMethods = '';
        let commandMethods = '';
        let registerEvents = '';
        let registerCommands = '';

        for (const child of ast.children) {
            if (child.type === 'event') {
                imports.add('org.bukkit.event.EventHandler');
                imports.add('org.bukkit.event.Listener');
                const eventClass = child.properties.eventClass || child.properties.event || 'PlayerJoinEvent';
                imports.add(`org.bukkit.event.player.${eventClass}`);

                eventMethods += `\n    @EventHandler\n    public void on${child.label.replace(/\s+/g, '')}(${eventClass} event) {\n`;
                for (const action of child.children) {
                    eventMethods += `        ${this._actionToJava(action, imports)};\n`;
                }
                eventMethods += `    }\n`;
                registerEvents += `        getServer().getPluginManager().registerEvents(this, this);\n`;
            }

            if (child.type === 'command') {
                const cmdName = child.properties.name || 'example';
                commandMethods += `\n    // /${cmdName} komutu\n`;
                registerCommands += `        getCommand("${cmdName}").setExecutor((sender, cmd, label, args) -> {\n`;
                for (const action of child.children) {
                    registerCommands += `            ${this._actionToJava(action, imports)};\n`;
                }
                registerCommands += `            return true;\n        });\n`;
            }
        }

        const importLines = Array.from(imports).sort().map(i => `import ${i};`).join('\n');

        return `package ${packageName};

${importLines}

public class ${className} extends JavaPlugin${eventMethods ? ' implements Listener' : ''} {

    @Override
    public void onEnable() {
        saveDefaultConfig();
${registerEvents}${registerCommands}        getLogger().info("${className} aktif! ⛏️");
    }

    @Override
    public void onDisable() {
        getLogger().info("${className} deaktif.");
    }
${eventMethods}${commandMethods}}
`;
    }

    /**
     * AST'den Skript kodu üret
     */
    astToSkript(ast: AstNode): string {
        let code = `# ${ast.label}\n# CraftIDE Visual Builder ile oluşturuldu ⛏️\n\n`;

        for (const child of ast.children) {
            if (child.type === 'event') {
                code += `on ${child.properties.event || child.label}:\n`;
                for (const action of child.children) {
                    code += `\t${this._actionToSkript(action)}\n`;
                }
                code += '\n';
            }

            if (child.type === 'command') {
                const cmdName = child.properties.name || 'example';
                code += `command /${cmdName}:\n`;
                if (child.properties.permission) {
                    code += `\tpermission: ${child.properties.permission}\n`;
                }
                if (child.properties.description) {
                    code += `\tdescription: ${child.properties.description}\n`;
                }
                code += `\ttrigger:\n`;
                for (const action of child.children) {
                    code += `\t\t${this._actionToSkript(action)}\n`;
                }
                code += '\n';
            }

            if (child.type === 'scheduler') {
                code += `every ${child.properties.interval || '5 seconds'}:\n`;
                for (const action of child.children) {
                    code += `\t${this._actionToSkript(action)}\n`;
                }
                code += '\n';
            }

            if (child.type === 'function') {
                code += `function ${child.properties.name}(${child.properties.params || ''}):\n`;
                for (const action of child.children) {
                    code += `\t${this._actionToSkript(action)}\n`;
                }
                code += '\n';
            }
        }

        return code;
    }

    // ─── Yardımcılar ────────────────────────────────────────

    private _astNodeToVisual(node: AstNode, x: number, y: number): VisualNode {
        const config = NODE_VISUAL_CONFIG[node.type] || NODE_VISUAL_CONFIG.action;
        return {
            id: node.id,
            type: node.type,
            label: node.label,
            x, y,
            width: 200,
            height: 80,
            color: config.color,
            icon: config.icon,
            inputs: [{ id: 'in-flow', name: 'Giriş', type: 'flow', connected: false }],
            outputs: [{ id: 'out-flow', name: 'Çıkış', type: 'flow', connected: false }],
            properties: node.properties,
            collapsed: false,
        };
    }

    private _parseEventBlock(lines: string[], start: number, eventClass: string): AstNode {
        const node: AstNode = {
            id: this._nextId(),
            type: 'event',
            label: eventClass.replace('Event', ''),
            properties: { eventClass },
            children: [],
            position: { line: start, column: 0 },
        };

        const end = this._findBlockEnd(lines, start);
        for (let i = start + 1; i < end; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('//') && !line.startsWith('}')) {
                node.children.push(this._parseAction(line, i));
            }
        }

        return node;
    }

    private _parseCommandBlock(lines: string[], start: number): AstNode {
        return {
            id: this._nextId(),
            type: 'command',
            label: 'Command',
            properties: {},
            children: [],
            position: { line: start, column: 0 },
        };
    }

    private _parseSkriptBlock(lines: string[], start: number): AstNode[] {
        const nodes: AstNode[] = [];
        for (let i = start; i < lines.length; i++) {
            const line = lines[i];
            if (!line.startsWith('\t') && !line.startsWith('    ') && line.trim() !== '') { break; }
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) { continue; }

            if (trimmed.startsWith('if ')) {
                nodes.push({
                    id: this._nextId(),
                    type: 'condition',
                    label: trimmed.replace(/:$/, ''),
                    properties: { condition: trimmed.replace(/^if\s+/, '').replace(/:$/, '') },
                    children: [],
                    position: { line: i, column: 0 },
                });
            } else if (trimmed.startsWith('loop ') || trimmed.startsWith('while ')) {
                nodes.push({
                    id: this._nextId(),
                    type: 'loop',
                    label: trimmed.replace(/:$/, ''),
                    properties: {},
                    children: [],
                    position: { line: i, column: 0 },
                });
            } else {
                nodes.push(this._parseAction(trimmed, i));
            }
        }
        return nodes;
    }

    private _parseAction(line: string, lineNum: number): AstNode {
        let type: AstNodeType = 'action';
        let label = line.replace(/;$/, '').trim();

        if (line.includes('sendMessage') || line.includes('send ')) { label = '💬 Mesaj gönder'; }
        else if (line.includes('teleport')) { label = '🚀 Işınla'; type = 'action'; }
        else if (line.includes('openInventory') || line.includes('open chest')) { label = '🎒 GUI aç'; type = 'gui'; }
        else if (line.includes('broadcast')) { label = '📢 Duyuru'; }
        else if (line.includes('cancel')) { label = '❌ Event iptal'; }
        else if (line.includes('give ')) { label = '🎁 Eşya ver'; }
        else if (line.includes('kill ')) { label = '💀 Öldür'; }

        return {
            id: this._nextId(),
            type,
            label,
            properties: { code: line },
            children: [],
            position: { line: lineNum, column: 0 },
        };
    }

    private _actionToJava(action: AstNode, imports: Set<string>): string {
        const code = action.properties.code;
        if (code) { return code; }
        return `// ${action.label}`;
    }

    private _actionToSkript(action: AstNode): string {
        const code = action.properties.code;
        if (code) { return code; }
        return `# ${action.label}`;
    }

    private _findBlockEnd(lines: string[], start: number): number {
        let braces = 0;
        for (let i = start; i < lines.length; i++) {
            braces += (lines[i].match(/{/g) || []).length;
            braces -= (lines[i].match(/}/g) || []).length;
            if (braces <= 0 && i > start) { return i; }
        }
        return lines.length;
    }

    private _findLine(lines: string[], start: number, search: string): number {
        for (let i = start; i < lines.length; i++) {
            if (lines[i].trim().startsWith(search)) { return i; }
        }
        return -1;
    }

    private _findNextTopLevel(lines: string[], start: number): number {
        for (let i = start; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() && !line.startsWith('\t') && !line.startsWith('    ') && !line.startsWith('#')) {
                return i;
            }
        }
        return lines.length;
    }

    private _nextId(): string {
        return `node-${++this._nodeCounter}`;
    }
}

// ─── Node Görsel Yapılandırma ───────────────────────────────

const NODE_VISUAL_CONFIG: Record<string, { color: string; icon: string }> = {
    plugin: { color: '#6c3483', icon: '⛏️' },
    command: { color: '#2980b9', icon: '⚡' },
    event: { color: '#e74c3c', icon: '🎯' },
    condition: { color: '#f39c12', icon: '🔀' },
    loop: { color: '#e67e22', icon: '🔄' },
    action: { color: '#2ecc71', icon: '▶️' },
    variable: { color: '#1abc9c', icon: '📦' },
    gui: { color: '#9b59b6', icon: '🎒' },
    scheduler: { color: '#3498db', icon: '⏰' },
    config: { color: '#95a5a6', icon: '🗄️' },
    function: { color: '#2c3e50', icon: '🔧' },
    expression: { color: '#bdc3c7', icon: '📝' },
};
