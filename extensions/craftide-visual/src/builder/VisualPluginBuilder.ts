import * as vscode from 'vscode';
import { BidirectionalCompiler, VisualGraph, VisualNode, VisualEdge, AstNode } from '../ast/BidirectionalCompiler';

/**
 * CraftIDE Görsel Plugin Builder — Node-Based Editor
 * 
 * WebView panelinde çalışan görsel, node-based plugin düzenleyici.
 * Sürükle-bırak ile plugin mantığını tasarlayarak otomatik
 * Java/Skript kodu üretir.
 * 
 * Özellikler:
 * - Drag & drop node ekleme
 * - Node bağlantı (edge) çizimi
 * - Zoom & pan (kaydır/yakınlaştır)
 * - Sağ panelde özellik düzenleme
 * - Alt panelde canlı kod önizleme
 * - Çift yönlü senkronizasyon
 */
export class VisualPluginBuilder {
    private _panel: vscode.WebviewPanel | undefined;
    private _compiler: BidirectionalCompiler;
    private _currentGraph: VisualGraph;

    constructor(private readonly extensionUri: vscode.Uri) {
        this._compiler = new BidirectionalCompiler();
        this._currentGraph = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
    }

    /**
     * Visual Builder panelini aç
     */
    open(existingCode?: string, language?: 'java' | 'skript'): void {
        if (this._panel) {
            this._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            'craftide.visualBuilder',
            '🎨 Visual Plugin Builder',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri],
            }
        );

        // Mevcut kodu parse et
        if (existingCode && language) {
            const ast = language === 'java'
                ? this._compiler.parseJavaToAst(existingCode)
                : this._compiler.parseSkriptToAst(existingCode);
            this._currentGraph = this._compiler.astToVisualGraph(ast);
        }

        this._panel.webview.html = this._getHtml();

        // Mevcut grafiği gönder
        this._panel.webview.postMessage({
            type: 'loadGraph',
            data: this._currentGraph,
        });

        // WebView → Extension mesajları
        this._panel.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'graphUpdated':
                    this._currentGraph = data.graph;
                    break;
                case 'exportJava':
                    await this._exportCode('java');
                    break;
                case 'exportSkript':
                    await this._exportCode('skript');
                    break;
                case 'importCode':
                    await this._importFromEditor();
                    break;
            }
        });

        this._panel.onDidDispose(() => {
            this._panel = undefined;
        });
    }

    private async _exportCode(language: 'java' | 'skript'): Promise<void> {
        // Graph → AST → Code
        // Simplified: build AST from visual nodes
        const ast = this._graphToAst(this._currentGraph);
        const code = language === 'java'
            ? this._compiler.astToJava(ast)
            : this._compiler.astToSkript(ast);

        const doc = await vscode.workspace.openTextDocument({
            content: code,
            language: language,
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }

    private async _importFromEditor(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('⛏️ Aktif bir editör yok.');
            return;
        }

        const code = editor.document.getText();
        const lang = editor.document.languageId;
        const ast = lang === 'java'
            ? this._compiler.parseJavaToAst(code)
            : this._compiler.parseSkriptToAst(code);

        this._currentGraph = this._compiler.astToVisualGraph(ast);
        this._panel?.webview.postMessage({
            type: 'loadGraph',
            data: this._currentGraph,
        });
    }

    private _graphToAst(graph: VisualGraph): AstNode {
        const root: AstNode = {
            id: 'root',
            type: 'plugin',
            label: 'Plugin',
            properties: {},
            children: graph.nodes
                .filter(n => n.type !== 'plugin')
                .map(n => ({
                    id: n.id,
                    type: n.type,
                    label: n.label,
                    properties: n.properties,
                    children: [],
                })),
        };
        return root;
    }

    private _getHtml(): string {
        return /* html */ `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Plugin Builder</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: var(--vscode-font-family);
            background: #0d0d1a;
            color: #dfe6e9;
            height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: #151528;
            border-bottom: 1px solid #252547;
        }

        .toolbar h3 {
            font-size: 13px;
            background: linear-gradient(135deg, #2ecc71, #1abc9c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-right: auto;
        }

        .toolbar button {
            padding: 4px 12px;
            border: 1px solid #3d3d5c;
            border-radius: 6px;
            background: #1a1a2e;
            color: #dfe6e9;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .toolbar button:hover { background: #252547; border-color: #2ecc71; }
        .toolbar button.primary { background: #2ecc71; color: #0d0d1a; border-color: #2ecc71; }
        .toolbar button.primary:hover { background: #27ae60; }

        .main-layout {
            flex: 1;
            display: flex;
            overflow: hidden;
        }

        /* ── Sol Panel: Node Palette ── */
        .palette {
            width: 180px;
            background: #111122;
            border-right: 1px solid #252547;
            padding: 12px;
            overflow-y: auto;
        }

        .palette h4 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #636e72;
            margin-bottom: 8px;
        }

        .palette-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            margin-bottom: 4px;
            border-radius: 6px;
            cursor: grab;
            font-size: 12px;
            transition: background 0.2s;
            border: 1px solid transparent;
        }
        .palette-item:hover { background: #1a1a2e; border-color: #3d3d5c; }
        .palette-item:active { cursor: grabbing; }
        .palette-item .p-icon { font-size: 16px; }
        .palette-item .p-label { font-size: 11px; }

        /* ── Orta: Canvas ── */
        .canvas-container {
            flex: 1;
            position: relative;
            overflow: hidden;
            background:
                radial-gradient(circle at center, #0d0d1a 0%, #080812 100%);
        }

        .canvas {
            position: absolute;
            width: 4000px;
            height: 4000px;
            background-image:
                radial-gradient(circle, #1a1a2e 1px, transparent 1px);
            background-size: 20px 20px;
        }

        /* ── Nodes ── */
        .node {
            position: absolute;
            min-width: 180px;
            background: #1a1a2e;
            border: 2px solid #3d3d5c;
            border-radius: 10px;
            cursor: move;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            transition: box-shadow 0.2s, border-color 0.2s;
            user-select: none;
        }
        .node:hover { border-color: #6c3483; box-shadow: 0 4px 30px rgba(108, 52, 131, 0.3); }
        .node.selected { border-color: #2ecc71; box-shadow: 0 4px 30px rgba(46, 204, 113, 0.3); }

        .node-header {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 8px 8px 0 0;
            font-size: 12px;
            font-weight: 600;
        }

        .node-body {
            padding: 8px 12px;
            font-size: 11px;
            color: #b2bec3;
            border-top: 1px solid rgba(255,255,255,0.05);
        }

        .node-port {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 2px solid #636e72;
            position: absolute;
            cursor: crosshair;
            transition: all 0.2s;
        }
        .node-port:hover { border-color: #2ecc71; transform: scale(1.3); }
        .node-port.in { left: -6px; top: 50%; transform: translateY(-50%); }
        .node-port.out { right: -6px; top: 50%; transform: translateY(-50%); }

        /* ── SVG Edges ── */
        .edges-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .edge {
            fill: none;
            stroke: #3d3d5c;
            stroke-width: 2;
            stroke-linecap: round;
        }
        .edge.active { stroke: #2ecc71; stroke-width: 3; }

        /* ── Sağ Panel: Properties ── */
        .properties {
            width: 220px;
            background: #111122;
            border-left: 1px solid #252547;
            padding: 12px;
            overflow-y: auto;
        }

        .properties h4 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #636e72;
            margin-bottom: 8px;
        }

        .prop-field {
            margin-bottom: 10px;
        }
        .prop-field label {
            display: block;
            font-size: 10px;
            color: #636e72;
            margin-bottom: 4px;
        }
        .prop-field input, .prop-field select {
            width: 100%;
            padding: 6px 8px;
            background: #1a1a2e;
            border: 1px solid #3d3d5c;
            border-radius: 4px;
            color: #dfe6e9;
            font-size: 11px;
            outline: none;
        }
        .prop-field input:focus { border-color: #2ecc71; }

        /* ── Alt: Code Preview ── */
        .code-preview {
            height: 150px;
            background: #0a0a18;
            border-top: 1px solid #252547;
            padding: 8px 16px;
            overflow-y: auto;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 11px;
            color: #b2bec3;
            white-space: pre;
        }

        .zoom-controls {
            position: absolute;
            bottom: 12px;
            right: 12px;
            display: flex;
            gap: 4px;
        }
        .zoom-controls button {
            width: 30px;
            height: 30px;
            border: 1px solid #3d3d5c;
            border-radius: 6px;
            background: #1a1a2e;
            color: #dfe6e9;
            font-size: 14px;
            cursor: pointer;
        }
        .zoom-controls button:hover { background: #252547; }
    </style>
</head>
<body>
    <div class="toolbar">
        <h3>🎨 Visual Plugin Builder</h3>
        <button onclick="importCode()">📥 Koddan İçe Aktar</button>
        <button onclick="exportCode('java')">☕ Java Olarak Dışa Aktar</button>
        <button onclick="exportCode('skript')">📜 Skript Olarak Dışa Aktar</button>
        <button class="primary" onclick="clearCanvas()">🗑️ Temizle</button>
    </div>

    <div class="main-layout">
        <div class="palette">
            <h4>📦 Bloklar</h4>
            <div class="palette-item" draggable="true" data-type="event"     data-label="Event Listener" data-color="#e74c3c"><span class="p-icon">🎯</span><span class="p-label">Event</span></div>
            <div class="palette-item" draggable="true" data-type="command"   data-label="Komut" data-color="#2980b9"><span class="p-icon">⚡</span><span class="p-label">Komut</span></div>
            <div class="palette-item" draggable="true" data-type="condition" data-label="Koşul (If)" data-color="#f39c12"><span class="p-icon">🔀</span><span class="p-label">Koşul</span></div>
            <div class="palette-item" draggable="true" data-type="loop"      data-label="Döngü" data-color="#e67e22"><span class="p-icon">🔄</span><span class="p-label">Döngü</span></div>
            <div class="palette-item" draggable="true" data-type="action"    data-label="Aksiyon" data-color="#2ecc71"><span class="p-icon">▶️</span><span class="p-label">Aksiyon</span></div>
            <div class="palette-item" draggable="true" data-type="gui"       data-label="GUI Menü" data-color="#9b59b6"><span class="p-icon">🎒</span><span class="p-label">GUI</span></div>
            <div class="palette-item" draggable="true" data-type="scheduler" data-label="Zamanlayıcı" data-color="#3498db"><span class="p-icon">⏰</span><span class="p-label">Zamanlayıcı</span></div>
            <div class="palette-item" draggable="true" data-type="variable"  data-label="Değişken" data-color="#1abc9c"><span class="p-icon">📦</span><span class="p-label">Değişken</span></div>
            <div class="palette-item" draggable="true" data-type="config"    data-label="Config" data-color="#95a5a6"><span class="p-icon">🗄️</span><span class="p-label">Config</span></div>
            <div class="palette-item" draggable="true" data-type="function"  data-label="Fonksiyon" data-color="#2c3e50"><span class="p-icon">🔧</span><span class="p-label">Fonksiyon</span></div>
        </div>

        <div class="canvas-container" id="canvasContainer">
            <div class="canvas" id="canvas">
                <svg class="edges-layer" id="edgesLayer"></svg>
            </div>
            <div class="zoom-controls">
                <button onclick="zoomIn()">+</button>
                <button onclick="zoomReset()">⊙</button>
                <button onclick="zoomOut()">−</button>
            </div>
        </div>

        <div class="properties" id="propertiesPanel">
            <h4>📋 Özellikler</h4>
            <p style="font-size:11px; color:#636e72;">Bir düğüm seçin</p>
        </div>
    </div>

    <div class="code-preview" id="codePreview">// Düğümler ekleyin, otomatik kod burada görünecek ⛏️</div>

    <script>
        const vscode = acquireVsCodeApi();
        const canvas = document.getElementById('canvas');
        const canvasContainer = document.getElementById('canvasContainer');
        const edgesLayer = document.getElementById('edgesLayer');
        const propertiesPanel = document.getElementById('propertiesPanel');
        const codePreview = document.getElementById('codePreview');

        let nodes = [];
        let edges = [];
        let selectedNode = null;
        let nodeIdCounter = 0;
        let zoom = 1;
        let panX = 0, panY = 0;
        let isDragging = false;
        let dragNode = null;
        let dragOffsetX = 0, dragOffsetY = 0;

        // ── Palette Drag ──
        document.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', item.dataset.type);
                e.dataTransfer.setData('nodeLabel', item.dataset.label);
                e.dataTransfer.setData('nodeColor', item.dataset.color);
            });
        });

        canvasContainer.addEventListener('dragover', (e) => e.preventDefault());
        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('nodeType');
            const label = e.dataTransfer.getData('nodeLabel');
            const color = e.dataTransfer.getData('nodeColor');
            const rect = canvasContainer.getBoundingClientRect();
            const x = (e.clientX - rect.left - panX) / zoom;
            const y = (e.clientY - rect.top - panY) / zoom;
            addNode(type, label, color, x, y);
        });

        function addNode(type, label, color, x, y) {
            const id = 'node-' + (++nodeIdCounter);
            const node = { id, type, label, color, x, y, properties: {} };
            nodes.push(node);
            renderNodes();
            updateCodePreview();
        }

        function renderNodes() {
            // Clear existing
            canvas.querySelectorAll('.node').forEach(n => n.remove());

            nodes.forEach(node => {
                const el = document.createElement('div');
                el.className = 'node' + (selectedNode === node.id ? ' selected' : '');
                el.style.left = node.x + 'px';
                el.style.top = node.y + 'px';
                el.style.borderColor = node.color;
                el.dataset.id = node.id;

                el.innerHTML =
                    '<div class="node-header" style="background:' + node.color + '20;">' +
                        '<span>' + getIcon(node.type) + '</span>' +
                        '<span>' + node.label + '</span>' +
                    '</div>' +
                    '<div class="node-body">' + getNodeBody(node) + '</div>' +
                    '<div class="node-port in" data-port="in"></div>' +
                    '<div class="node-port out" data-port="out"></div>';

                // Node drag
                el.addEventListener('mousedown', (e) => {
                    if (e.target.classList.contains('node-port')) return;
                    isDragging = true;
                    dragNode = node;
                    dragOffsetX = e.offsetX;
                    dragOffsetY = e.offsetY;
                    selectNode(node.id);
                });

                // Click select
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectNode(node.id);
                });

                canvas.appendChild(el);
            });
        }

        document.addEventListener('mousemove', (e) => {
            if (isDragging && dragNode) {
                const rect = canvasContainer.getBoundingClientRect();
                dragNode.x = (e.clientX - rect.left - panX) / zoom - dragOffsetX;
                dragNode.y = (e.clientY - rect.top - panY) / zoom - dragOffsetY;
                renderNodes();
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            dragNode = null;
        });

        canvasContainer.addEventListener('click', () => {
            selectedNode = null;
            renderNodes();
            propertiesPanel.innerHTML = '<h4>📋 Özellikler</h4><p style="font-size:11px; color:#636e72;">Bir düğüm seçin</p>';
        });

        function selectNode(id) {
            selectedNode = id;
            renderNodes();
            showProperties(id);
        }

        function showProperties(id) {
            const node = nodes.find(n => n.id === id);
            if (!node) return;

            propertiesPanel.innerHTML =
                '<h4>📋 ' + node.label + '</h4>' +
                '<div class="prop-field"><label>Ad</label><input value="' + node.label + '" onchange="updateProp(\\'' + id + '\\', \\'label\\', this.value)"></div>' +
                '<div class="prop-field"><label>Tip</label><input value="' + node.type + '" disabled></div>' +
                '<div class="prop-field"><label>X</label><input type="number" value="' + Math.round(node.x) + '" disabled></div>' +
                '<div class="prop-field"><label>Y</label><input type="number" value="' + Math.round(node.y) + '" disabled></div>' +
                '<button style="width:100%;padding:6px;background:#e74c3c22;color:#e74c3c;border:1px solid #e74c3c44;border-radius:4px;cursor:pointer;font-size:11px;margin-top:8px;" onclick="deleteNode(\\'' + id + '\\')">🗑️ Sil</button>';
        }

        function updateProp(id, prop, value) {
            const node = nodes.find(n => n.id === id);
            if (node) { node[prop] = value; renderNodes(); updateCodePreview(); }
        }

        function deleteNode(id) {
            nodes = nodes.filter(n => n.id !== id);
            edges = edges.filter(e => e.sourceNode !== id && e.targetNode !== id);
            selectedNode = null;
            renderNodes();
            updateCodePreview();
            propertiesPanel.innerHTML = '<h4>📋 Özellikler</h4><p style="font-size:11px; color:#636e72;">Bir düğüm seçin</p>';
        }

        function clearCanvas() {
            nodes = []; edges = []; selectedNode = null; nodeIdCounter = 0;
            renderNodes(); updateCodePreview();
        }

        function getIcon(type) {
            const icons = { event:'🎯', command:'⚡', condition:'🔀', loop:'🔄', action:'▶️', gui:'🎒', scheduler:'⏰', variable:'📦', config:'🗄️', function:'🔧', plugin:'⛏️' };
            return icons[type] || '▶️';
        }

        function getNodeBody(node) {
            const bodies = {
                event: 'Tetiklendiğinde çalışır',
                command: '/komut çalıştığında',
                condition: 'Koşul kontrolü',
                loop: 'Elemanları döngüle',
                action: 'Bir eylem gerçekleştir',
                gui: 'Envanter menüsü aç',
                scheduler: 'Zamanlanmış görev',
                variable: 'Veri sakla/oku',
                config: 'Config oku/yaz',
                function: 'Yeniden kullanılabilir blok',
            };
            return bodies[node.type] || '';
        }

        function updateCodePreview() {
            if (nodes.length === 0) {
                codePreview.textContent = '// Düğümler ekleyin ⛏️';
                return;
            }
            let code = '# CraftIDE Visual Builder\\n\\n';
            nodes.forEach(n => {
                if (n.type === 'event') code += 'on ' + n.label + ':\\n\\tsend "Event!" to player\\n\\n';
                else if (n.type === 'command') code += 'command /' + n.label.toLowerCase().replace(/\\s+/g,'') + ':\\n\\ttrigger:\\n\\t\\tsend "Komut!" to player\\n\\n';
                else if (n.type === 'scheduler') code += 'every 5 seconds:\\n\\tbroadcast "Zamanlayıcı!"\\n\\n';
                else code += '# ' + n.type + ': ' + n.label + '\\n';
            });
            codePreview.textContent = code;
        }

        function zoomIn()    { zoom = Math.min(2, zoom + 0.1); canvas.style.transform = 'scale('+zoom+')'; }
        function zoomOut()   { zoom = Math.max(0.3, zoom - 0.1); canvas.style.transform = 'scale('+zoom+')'; }
        function zoomReset() { zoom = 1; canvas.style.transform = 'scale(1)'; }

        function exportCode(lang) { vscode.postMessage({ type: lang === 'java' ? 'exportJava' : 'exportSkript' }); }
        function importCode() { vscode.postMessage({ type: 'importCode' }); }

        // Extension'dan gelen mesajları dinle
        window.addEventListener('message', (event) => {
            const { type, data } = event.data;
            if (type === 'loadGraph' && data) {
                nodes = data.nodes || [];
                edges = data.edges || [];
                renderNodes();
                updateCodePreview();
            }
        });
    </script>
</body>
</html>`;
    }
}
