/**
 * CraftIDE — Canvas Pixel Art Editor
 * Tamamen offline, harici bağımlılık yok.
 * Minecraft texture'ları için optimize edilmiş.
 */
(function () {
    // ─── State ────────────────────────────────────────────────
    let canvas, ctx;           // Gerçek piksel verisi (offscreen)
    let viewCanvas, viewCtx;   // Görüntü canvas'ı (ölçekli + grid)
    let canvasW = 16, canvasH = 16;
    let zoom = 16;
    let showGrid = true;
    let tool = 'pencil';       // pencil | eraser | fill | eyedrop | rect | line
    let primaryColor = '#000000';
    let secondaryColor = '#ffffff';
    let history = [];
    let historyIndex = -1;
    let currentImagePath = null;
    let isDrawing = false;
    let startX = 0, startY = 0;
    let previewSnap = null;    // rect/line önizleme için snapshot
    let lastPx = -1, lastPy = -1;
    let colorPickerTarget = 'primary';
    let initialized = false;
    let isDirty = false;         // kaydedilmemiş değişiklik var mı?
    let renderPending = false;   // RAF throttle
    let checkerTile = null;      // dama tahtası tile canvas (zoom'a göre cache)
    let checkerTileZoom = -1;
    let panX = 0, panY = 0;     // görünüm kaydırma offseti
    let isPanning = false;       // el aracı ile sürükleme
    let panStartX = 0, panStartY = 0, panStartPanX = 0, panStartPanY = 0;

    // ─── Minecraft paleti ─────────────────────────────────────
    const PALETTE = [
        '#000000', '#1d1d1d', '#474747', '#737373', '#8a8a8a', '#b5b5b5', '#d9d9d9', '#ffffff',
        '#7f0000', '#ff0000', '#ff6a00', '#ffd800', '#b5f700', '#00e400', '#00c8e4', '#0094ff',
        '#4b0082', '#b900ff', '#ff84c8', '#c8a464', '#8b4513', '#5c3317', '#228b22', '#006400',
        '#1a3a1a', '#2d4a6b', '#1a1a4a', '#4a1a4a', '#6b3a1a', '#4a3a1a', '#2a4a3a', '#1a2a4a',
    ];

    // ─── Ana init ─────────────────────────────────────────────
    function init() {
        if (initialized) return;
        initialized = true;

        const container = document.getElementById('image-editor-container');
        if (!container) return;

        container.innerHTML = buildHTML();

        // Offscreen canvas (gerçek piksel verisi)
        canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        ctx = canvas.getContext('2d');
        fillTransparent();

        // Görüntü canvas'ı
        viewCanvas = document.getElementById('ie-view');
        viewCtx = viewCanvas.getContext('2d');

        buildPalette();
        bindEvents();
        setTool('pencil');
        pushHistory();
        render();
        updateStatus();
    }

    // ─── HTML ─────────────────────────────────────────────────
    function buildHTML() {
        return `
<div id="ie-root" style="display:flex;flex-direction:column;height:100%;background:#1e1e1e;color:#ccc;font:12px Inter,sans-serif;user-select:none;">
  <!-- Araç çubuğu -->
  <div id="ie-toolbar" style="display:flex;align-items:center;gap:5px;padding:5px 10px;background:#252526;border-bottom:1px solid #333;flex-shrink:0;flex-wrap:wrap;">

    <!-- Çizim araçları -->
    <div class="ie-group" style="display:flex;gap:2px;">
      <button class="ie-tool" data-tool="pencil"  title="Pencil (P)">✏️</button>
      <button class="ie-tool" data-tool="eraser"  title="Eraser (E)">⬜</button>
      <button class="ie-tool" data-tool="fill"    title="Fill (F)">🪣</button>
      <button class="ie-tool" data-tool="eyedrop" title="Eyedropper (I)">💉</button>
      <button class="ie-tool" data-tool="rect"    title="Rectangle (R)">▭</button>
      <button class="ie-tool" data-tool="line"    title="Line (L)">╱</button>
      <button class="ie-tool" data-tool="hand"    title="Pan (H) — drag or scroll wheel">✋</button>
    </div>

    <div class="ie-sep"></div>

    <!-- Renk seçici -->
    <div style="position:relative;width:36px;height:36px;flex-shrink:0;" title="Left click: Primary color | Right click: Secondary color">
      <div id="ie-sec-color" style="position:absolute;right:0;bottom:0;width:22px;height:22px;background:#ffffff;border:2px solid #555;cursor:pointer;border-radius:2px;"></div>
      <div id="ie-pri-color" style="position:absolute;left:0;top:0;width:22px;height:22px;background:#000000;border:2px solid #aaa;cursor:pointer;border-radius:2px;z-index:2;"></div>
    </div>
    <input type="color" id="ie-color-input" value="#000000" style="width:0;height:0;opacity:0;position:absolute;pointer-events:none;">

    <div class="ie-sep"></div>

    <!-- Palet -->
    <div id="ie-palette" style="display:flex;flex-wrap:wrap;gap:2px;width:138px;"></div>

    <div class="ie-sep"></div>

    <!-- Zoom -->
    <button id="ie-zoom-out" class="ie-btn" title="Zoom out (Ctrl+Scroll down)">−</button>
    <span id="ie-zoom-lbl" style="min-width:30px;text-align:center;">16x</span>
    <button id="ie-zoom-in"  class="ie-btn" title="Zoom in (Ctrl+Scroll up)">+</button>

    <div class="ie-sep"></div>

    <!-- Izgara -->
    <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
      <input type="checkbox" id="ie-grid-chk" checked style="cursor:pointer;accent-color:#569cd6;">
      <span>Grid</span>
    </label>

    <div class="ie-sep"></div>

    <!-- Tuval boyutu -->
    <select id="ie-size-sel" class="ie-select" title="Canvas size">
      <option value="16">16 × 16</option>
      <option value="32">32 × 32</option>
      <option value="64">64 × 64</option>
      <option value="128">128 × 128</option>
    </select>

    <div class="ie-sep"></div>

    <!-- Eylemler -->
    <button id="ie-undo"  class="ie-btn" title="Undo (Ctrl+Z)">↩</button>
    <button id="ie-redo"  class="ie-btn" title="Redo (Ctrl+Y)">↪</button>
    <button id="ie-clear" class="ie-btn ie-btn-warn"    title="Clear Canvas">🗑 Clear</button>
    <button id="ie-new"   class="ie-btn"                title="New Canvas">➕ New</button>
    <button id="ie-save"  class="ie-btn ie-btn-success" title="Save (Ctrl+S)">💾 Save</button>
  </div>

  <!-- Canvas alanı -->
  <div id="ie-wrap" style="flex:1;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#181818;position:relative;">
    <canvas id="ie-view" style="image-rendering:pixelated;display:block;cursor:crosshair;"></canvas>
  </div>

  <!-- Durum çubuğu -->
  <div id="ie-status" style="padding:3px 10px;background:#252526;border-top:1px solid #333;font-size:11px;color:#777;flex-shrink:0;">Ready
  </div>
</div>

<style>
  .ie-btn {
    background:#2a2a2a;color:#ccc;border:1px solid #444;
    padding:3px 8px;border-radius:3px;cursor:pointer;font-size:11px;
  }
  .ie-btn:hover { background:#3a3a3a; border-color:#666; }
  .ie-btn-success { background:#1a4a2a; border-color:#2d7a4a; }
  .ie-btn-success:hover { background:#2a6a3a; }
  .ie-btn-warn { background:#4a2a1a; border-color:#7a4a2a; }
  .ie-btn-warn:hover { background:#6a3a2a; }
  .ie-tool {
    background:#2a2a2a;color:#ccc;border:1px solid #444;
    padding:4px 7px;border-radius:3px;cursor:pointer;font-size:14px;
  }
  .ie-tool:hover { background:#3a3a3a; }
  .ie-tool.active { background:#3c3c3c; border-color:#569cd6; }
  .ie-select {
    background:#2a2a2a;color:#ccc;border:1px solid #444;
    padding:3px 6px;border-radius:3px;cursor:pointer;
  }
  .ie-sep {
    width:1px;height:28px;background:#444;margin:0 3px;flex-shrink:0;
  }
</style>`;
    }

    // ─── Palet oluştur ────────────────────────────────────────
    function buildPalette() {
        const el = document.getElementById('ie-palette');
        PALETTE.forEach(col => {
            const d = document.createElement('div');
            d.style.cssText = `width:14px;height:14px;background:${col};cursor:pointer;border:1px solid #3a3a3a;border-radius:1px;box-sizing:border-box;`;
            d.title = col + '\nLeft click: Primary\nRight click: Secondary';
            d.addEventListener('click', () => setPrimaryColor(col));
            d.addEventListener('contextmenu', e => { e.preventDefault(); setSecondaryColor(col); });
            el.appendChild(d);
        });
    }

    // ─── Event binding ────────────────────────────────────────
    function bindEvents() {
        // Araçlar
        document.querySelectorAll('.ie-tool').forEach(btn =>
            btn.addEventListener('click', () => setTool(btn.dataset.tool))
        );

        // Zoom
        document.getElementById('ie-zoom-in').addEventListener('click', zoomIn);
        document.getElementById('ie-zoom-out').addEventListener('click', zoomOut);

        // Izgara
        document.getElementById('ie-grid-chk').addEventListener('change', e => {
            showGrid = e.target.checked; render();
        });

        // Renk
        document.getElementById('ie-pri-color').addEventListener('click', () => openColorPicker('primary'));
        document.getElementById('ie-sec-color').addEventListener('click', () => openColorPicker('secondary'));
        document.getElementById('ie-color-input').addEventListener('input', e => {
            if (colorPickerTarget === 'primary') setPrimaryColor(e.target.value);
            else setSecondaryColor(e.target.value);
        });

        // Tuval boyutu
        document.getElementById('ie-size-sel').addEventListener('change', e => resizeCanvas(parseInt(e.target.value)));

        // Eylemler
        document.getElementById('ie-save').addEventListener('click', saveImage);
        document.getElementById('ie-new').addEventListener('click', newCanvas);
        document.getElementById('ie-clear').addEventListener('click', clearCanvas);
        document.getElementById('ie-undo').addEventListener('click', undo);
        document.getElementById('ie-redo').addEventListener('click', redo);

        // Canvas fare olayları
        viewCanvas.addEventListener('mousedown', onMouseDown);
        viewCanvas.addEventListener('mousemove', onMouseMove);
        viewCanvas.addEventListener('mouseup', onMouseUp);
        viewCanvas.addEventListener('mouseleave', onMouseUp);
        viewCanvas.addEventListener('wheel', onWheel, { passive: false });
        viewCanvas.addEventListener('contextmenu', e => e.preventDefault());

        // Klavye kısayolları
        document.addEventListener('keydown', onKeyDown);

        // Pencere yeniden boyutlandırma
        window.addEventListener('resize', () => render());
    }

    // ─── Renk yönetimi ───────────────────────────────────────
    function setPrimaryColor(col) {
        primaryColor = col;
        const el = document.getElementById('ie-pri-color');
        if (el) el.style.background = col;
    }
    function setSecondaryColor(col) {
        secondaryColor = col;
        const el = document.getElementById('ie-sec-color');
        if (el) el.style.background = col;
    }
    function openColorPicker(target) {
        colorPickerTarget = target;
        const inp = document.getElementById('ie-color-input');
        if (!inp) return;
        inp.value = target === 'primary' ? primaryColor : secondaryColor;
        inp.click();
    }

    // ─── Araç yönetimi ───────────────────────────────────────
    function setTool(t) {
        tool = t;
        document.querySelectorAll('.ie-tool').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === t);
        });
        if (viewCanvas) viewCanvas.style.cursor =
            t === 'eyedrop' ? 'cell' :
            t === 'hand'    ? 'grab' :
            'crosshair';
    }

    // ─── Canvas operasyonları ─────────────────────────────────
    function fillTransparent() {
        ctx.clearRect(0, 0, canvasW, canvasH);
    }

    function newCanvas() {
        if (!confirm(typeof tr === 'function' ? tr('msg.imageNewCanvas', 'Create a new canvas? Unsaved changes will be lost.') : 'Create new canvas?')) return;
        currentImagePath = null;
        isDirty = false;
        canvasW = 16; canvasH = 16;
        canvas.width = canvasW;
        canvas.height = canvasH;
        fillTransparent();
        history = []; historyIndex = -1;
        pushHistory();
        isDirty = false; // pushHistory isDirty=true yapar, sıfırla
        const sel = document.getElementById('ie-size-sel');
        if (sel) sel.value = '16';
        panX = 0; panY = 0;
        setZoom(16);
        render();
        updateStatus();
    }

    function clearCanvas() {
        fillTransparent();
        pushHistory();
        render();
    }

    function resizeCanvas(size) {
        const snap = ctx.getImageData(0, 0, canvasW, canvasH);
        canvasW = size; canvasH = size;
        canvas.width = canvasW; canvas.height = canvasH;
        fillTransparent();
        ctx.putImageData(snap, 0, 0);
        pushHistory();
        setZoom(Math.max(1, Math.min(32, Math.floor(480 / size))));
        render();
        updateStatus();
    }

    // ─── Zoom ─────────────────────────────────────────────────
    // Zoom seviyeleri: %6 → 64x (2'nin kuvvetleri)
    const ZOOM_STEPS = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64];

    function setZoom(z) {
        zoom = Math.max(0.0625, Math.min(64, z));
        // Tile cache geçersiz kıl
        checkerTile = null;
        checkerTileZoom = -1;
        const lbl = document.getElementById('ie-zoom-lbl');
        if (lbl) lbl.textContent = zoom >= 1 ? zoom + 'x' : Math.round(zoom * 100) + '%';
        render();
    }

    function zoomIn()  { const i = ZOOM_STEPS.findIndex(s => s > zoom);  setZoom(i >= 0 ? ZOOM_STEPS[i] : 64); }
    function zoomOut() { const i = ZOOM_STEPS.slice().reverse().findIndex(s => s < zoom); setZoom(i >= 0 ? ZOOM_STEPS[ZOOM_STEPS.length - 1 - i] : 0.0625); }

    // Büyük resmi pencereye sığacak zoom hesapla
    function calcFitZoom(w, h) {
        const wrap = document.getElementById('ie-wrap');
        const maxW = (wrap ? wrap.clientWidth  : 600) * 0.9;
        const maxH = (wrap ? wrap.clientHeight : 400) * 0.9;
        const raw = Math.min(maxW / w, maxH / h);
        // En yakın 2 kuvvetine yuvarlama
        const snapped = Math.pow(2, Math.round(Math.log2(raw)));
        return Math.max(0.0625, Math.min(64, snapped));
    }

    // ─── Tarihçe ─────────────────────────────────────────────
    function pushHistory() {
        const snap = ctx.getImageData(0, 0, canvasW, canvasH);
        history = history.slice(0, historyIndex + 1);
        history.push(snap);
        if (history.length > 60) history.shift();
        historyIndex = history.length - 1;
        isDirty = true;
    }
    function undo() {
        if (historyIndex <= 0) return;
        historyIndex--;
        ctx.putImageData(history[historyIndex], 0, 0);
        render();
    }
    function redo() {
        if (historyIndex >= history.length - 1) return;
        historyIndex++;
        ctx.putImageData(history[historyIndex], 0, 0);
        render();
    }

    // ─── Koordinat yardımcıları ───────────────────────────────
    function getOffset() {
        const w = viewCanvas.width, h = viewCanvas.height;
        return {
            ox: Math.floor(w / 2 - canvasW * zoom / 2 + panX),
            oy: Math.floor(h / 2 - canvasH * zoom / 2 + panY)
        };
    }

    function mouseToPixel(e) {
        const rect = viewCanvas.getBoundingClientRect();
        const { ox, oy } = getOffset();
        return {
            x: Math.floor((e.clientX - rect.left - ox) / zoom),
            y: Math.floor((e.clientY - rect.top  - oy) / zoom)
        };
    }

    function inBounds(x, y) {
        return x >= 0 && y >= 0 && x < canvasW && y < canvasH;
    }

    // ─── Çizim araçları ──────────────────────────────────────
    function drawPixel(x, y, color) {
        if (!inBounds(x, y)) return;
        if (color === 'transparent') {
            ctx.clearRect(x, y, 1, 1);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // Bresenham çizgisi
    function drawLine(x0, y0, x1, y1, color) {
        let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        while (true) {
            drawPixel(x0, y0, color);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }

    // Dikdörtgen çevresi
    function drawRect(x0, y0, x1, y1, color) {
        const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
        const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
        for (let x = minX; x <= maxX; x++) {
            drawPixel(x, minY, color);
            drawPixel(x, maxY, color);
        }
        for (let y = minY + 1; y < maxY; y++) {
            drawPixel(minX, y, color);
            drawPixel(maxX, y, color);
        }
    }

    // Taşma dolgusu (flood fill)
    function floodFill(x, y, fillColor) {
        if (!inBounds(x, y)) return;
        const img = ctx.getImageData(0, 0, canvasW, canvasH);
        const d = img.data;
        const i0 = (y * canvasW + x) * 4;
        const tr = d[i0], tg = d[i0+1], tb = d[i0+2], ta = d[i0+3];

        let fr, fg, fb;
        if (fillColor === 'transparent') {
            fr = fg = fb = 0;
        } else {
            fr = parseInt(fillColor.slice(1,3), 16);
            fg = parseInt(fillColor.slice(3,5), 16);
            fb = parseInt(fillColor.slice(5,7), 16);
        }

        // Aynı renk ise çık
        if (fillColor !== 'transparent' && tr === fr && tg === fg && tb === fb && ta === 255) return;
        if (fillColor === 'transparent' && ta === 0) return;

        const stack = [[x, y]];
        const vis = new Uint8Array(canvasW * canvasH);
        while (stack.length) {
            const [cx, cy] = stack.pop();
            if (cx < 0 || cy < 0 || cx >= canvasW || cy >= canvasH) continue;
            const vi = cy * canvasW + cx;
            if (vis[vi]) continue;
            const pi = vi * 4;
            if (d[pi] !== tr || d[pi+1] !== tg || d[pi+2] !== tb || d[pi+3] !== ta) continue;
            vis[vi] = 1;
            if (fillColor === 'transparent') {
                d[pi] = 0; d[pi+1] = 0; d[pi+2] = 0; d[pi+3] = 0;
            } else {
                d[pi] = fr; d[pi+1] = fg; d[pi+2] = fb; d[pi+3] = 255;
            }
            stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        }
        ctx.putImageData(img, 0, 0);
    }

    function getPixelHex(x, y) {
        if (!inBounds(x, y)) return '#000000';
        const d = ctx.getImageData(x, y, 1, 1).data;
        return '#' + [d[0],d[1],d[2]].map(v => v.toString(16).padStart(2,'0')).join('');
    }

    // ─── Dama tahtası pattern (zoom değişince yeniden oluşturulur) ────
    function getCheckerPattern() {
        if (checkerTile && checkerTileZoom === zoom) {
            return viewCtx.createPattern(checkerTile, 'repeat');
        }
        const size = Math.max(1, Math.round(zoom));
        checkerTile = document.createElement('canvas');
        checkerTile.width  = size * 2;
        checkerTile.height = size * 2;
        const pctx = checkerTile.getContext('2d');
        pctx.fillStyle = '#404040';
        pctx.fillRect(0, 0, size * 2, size * 2);
        pctx.fillStyle = '#303030';
        pctx.fillRect(0, 0, size, size);
        pctx.fillRect(size, size, size, size);
        checkerTileZoom = zoom;
        return viewCtx.createPattern(checkerTile, 'repeat');
    }

    // ─── Render (RAF throttle) ─────────────────────────────────
    function render() {
        if (renderPending) return;
        renderPending = true;
        requestAnimationFrame(_doRender);
    }

    function _doRender() {
        renderPending = false;
        const wrap = document.getElementById('ie-wrap');
        if (!wrap || !viewCanvas) return;

        const w = wrap.clientWidth  || 600;
        const h = wrap.clientHeight || 400;
        viewCanvas.width  = w;
        viewCanvas.height = h;

        const { ox, oy } = getOffset();
        const pw = canvasW * zoom;
        const ph = canvasH * zoom;

        // Arka plan
        viewCtx.fillStyle = '#181818';
        viewCtx.fillRect(0, 0, w, h);

        // Şeffaflık dama tahtası — createPattern ile O(1), piksel döngüsü yok
        if (zoom >= 1) {
            const pat = getCheckerPattern();
            viewCtx.save();
            viewCtx.translate(ox, oy);
            viewCtx.fillStyle = pat;
            viewCtx.fillRect(0, 0, pw, ph);
            viewCtx.restore();
        } else {
            // Küçük zoom'da solid renk (sub-pixel damalar anlamsız)
            viewCtx.fillStyle = '#383838';
            viewCtx.fillRect(ox, oy, pw, ph);
        }

        // Piksel görüntüsü
        viewCtx.imageSmoothingEnabled = false;
        viewCtx.drawImage(canvas, ox, oy, pw, ph);

        // Izgara (sadece yeterli zoom'da)
        if (showGrid && zoom >= 4) {
            viewCtx.strokeStyle = 'rgba(255,255,255,0.12)';
            viewCtx.lineWidth = 1;
            viewCtx.beginPath();
            for (let cx = 0; cx <= canvasW; cx++) {
                const x = ox + cx * zoom + 0.5;
                viewCtx.moveTo(x, oy);
                viewCtx.lineTo(x, oy + ph);
            }
            for (let cy = 0; cy <= canvasH; cy++) {
                const y = oy + cy * zoom + 0.5;
                viewCtx.moveTo(ox, y);
                viewCtx.lineTo(ox + pw, y);
            }
            viewCtx.stroke();
        }

        // Çerçeve
        viewCtx.strokeStyle = '#555';
        viewCtx.lineWidth = 1;
        viewCtx.strokeRect(ox - 0.5, oy - 0.5, pw + 1, ph + 1);
    }

    // ─── Fare olayları ───────────────────────────────────────
    function onMouseDown(e) {
        e.preventDefault();

        // El aracı: sürükleyerek gezinme
        if (tool === 'hand') {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartPanX = panX;
            panStartPanY = panY;
            viewCanvas.style.cursor = 'grabbing';
            return;
        }

        isDrawing = true;
        const { x, y } = mouseToPixel(e);
        const color = e.button === 2 ? secondaryColor : primaryColor;

        if (tool === 'pencil') {
            drawPixel(x, y, color);
            render();
        } else if (tool === 'eraser') {
            drawPixel(x, y, 'transparent');
            render();
        } else if (tool === 'fill') {
            floodFill(x, y, color);
            pushHistory();
            render();
            isDrawing = false;
            return;
        } else if (tool === 'eyedrop') {
            const col = getPixelHex(x, y);
            if (e.button === 2) setSecondaryColor(col);
            else setPrimaryColor(col);
            isDrawing = false;
            return;
        } else if (tool === 'rect' || tool === 'line') {
            startX = x; startY = y;
            previewSnap = ctx.getImageData(0, 0, canvasW, canvasH);
        }

        lastPx = x; lastPy = y;
        updateStatus(x, y);
    }

    function onMouseMove(e) {
        const { x, y } = mouseToPixel(e);

        // El aracı: sürükleyerek pan
        if (isPanning) {
            panX = panStartPanX + (e.clientX - panStartX);
            panY = panStartPanY + (e.clientY - panStartY);
            render();
            updateStatus(x, y);
            return;
        }

        updateStatus(x, y);
        if (!isDrawing) return;

        const color = (e.buttons & 2) ? secondaryColor : primaryColor;

        if (tool === 'pencil') {
            if (lastPx >= 0) drawLine(lastPx, lastPy, x, y, color);
            else drawPixel(x, y, color);
            render();
        } else if (tool === 'eraser') {
            if (lastPx >= 0) drawLine(lastPx, lastPy, x, y, 'transparent');
            else drawPixel(x, y, 'transparent');
            render();
        } else if (tool === 'rect' && previewSnap) {
            ctx.putImageData(previewSnap, 0, 0);
            drawRect(startX, startY, x, y, color);
            render();
        } else if (tool === 'line' && previewSnap) {
            ctx.putImageData(previewSnap, 0, 0);
            drawLine(startX, startY, x, y, color);
            render();
        }

        lastPx = x; lastPy = y;
    }

    function onMouseUp() {
        if (isPanning) {
            isPanning = false;
            if (tool === 'hand') viewCanvas.style.cursor = 'grab';
            return;
        }
        if (isDrawing && ['pencil','eraser','rect','line'].includes(tool)) {
            pushHistory();
        }
        isDrawing = false;
        lastPx = -1; lastPy = -1;
        previewSnap = null;
    }

    function onWheel(e) {
        e.preventDefault();
        if (e.ctrlKey) {
            // Ctrl+Scroll → imlecin altındaki piksele göre zoom
            const rect = viewCanvas.getBoundingClientRect();
            const cursorX = e.clientX - rect.left;
            const cursorY = e.clientY - rect.top;
            const { ox, oy } = getOffset();
            // Zoom öncesi imleç altındaki görüntü pikseli
            const px = (cursorX - ox) / zoom;
            const py = (cursorY - oy) / zoom;
            // Zoom uygula (setZoom render() kuyruğa alır ama RAF henüz çalışmadı)
            if (e.deltaY < 0) zoomIn(); else zoomOut();
            // Pan'ı imlecin aynı pikselde kalacağı şekilde düzelt
            const w = viewCanvas.width, h = viewCanvas.height;
            panX = cursorX - (w / 2 - canvasW * zoom / 2) - px * zoom;
            panY = cursorY - (h / 2 - canvasH * zoom / 2) - py * zoom;
            render(); // render zaten RAF ile throttled, panX/panY güncellemesini kapsar
        } else {
            // Normal Scroll → görünümü kaydır (yatay + dikey)
            panX -= e.deltaX;
            panY -= e.deltaY;
            render();
        }
    }

    // ─── Klavye kısayolları ───────────────────────────────────
    function onKeyDown(e) {
        const container = document.getElementById('image-editor-container');
        if (!container || container.style.display === 'none') return;
        if (e.defaultPrevented) return;
        // Monaco editörü aktifse işleme
        if (document.activeElement && document.activeElement.closest('.monaco-editor')) return;

        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveImage(); }
        if (!e.ctrlKey && !e.altKey) {
            if (e.key === 'p') setTool('pencil');
            if (e.key === 'e') setTool('eraser');
            if (e.key === 'f') setTool('fill');
            if (e.key === 'i') setTool('eyedrop');
            if (e.key === 'r') setTool('rect');
            if (e.key === 'l') setTool('line');
            if (e.key === 'h') setTool('hand');
            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-') zoomOut();
        }
    }

    // ─── Durum çubuğu ─────────────────────────────────────────
    function updateStatus(x, y) {
        const el = document.getElementById('ie-status');
        if (!el) return;
        const pos = (x !== undefined && inBounds(x, y)) ? `Pixel: ${x},${y}` : '';
        const file = currentImagePath ? currentImagePath.split(/[/\\]/).pop() : 'New file';
        const toolNames = { pencil:'Pencil', eraser:'Eraser', fill:'Fill', eyedrop:'Eyedrop', rect:'Rect', line:'Line', hand:'Pan' };
        el.textContent = `${file}  |  ${canvasW}×${canvasH}  |  ${zoom}x  |  ${toolNames[tool] || tool}  ${pos ? '|  ' + pos : ''}`;
    }

    // ─── Dosya kaydetme ───────────────────────────────────────
    async function saveImage() {
        if (!currentImagePath) {
            if (window.showNotification) window.showNotification(typeof tr === 'function' ? tr('msg.imageNoPath', 'No target file path. Open a PNG from explorer.') : 'No file path', 'info');
            return;
        }
        try {
            const dataURL = canvas.toDataURL('image/png');
            const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64, 'base64');
            const fs = require('fs');
            fs.writeFileSync(currentImagePath, buffer);
            isDirty = false;
            if (window.showNotification) {
                window.showNotification(
                    typeof tr === 'function'
                        ? tr('msg.imageSaved', 'Saved: {name}', { name: currentImagePath.split(/[/\\]/).pop() })
                        : `Saved: ${currentImagePath.split(/[/\\]/).pop()}`,
                    'success'
                );
            }
        } catch (err) {
            console.error('[ImageEditor] Kaydetme hatası:', err);
            if (window.showNotification) window.showNotification(typeof tr === 'function' ? tr('msg.imageSaveError', 'Error: Could not save — ' + err.message, { error: err.message }) : 'Save error: ' + err.message, 'error');
        }
    }

    // ─── Dosya yükleme ────────────────────────────────────────
    window.loadImageToEditor = async function (filePath) {
        currentImagePath = filePath;

        // Henüz init olmadıysa başlat
        if (!initialized || !document.getElementById('ie-root')) {
            init();
            await new Promise(r => setTimeout(r, 50));
        }

        try {
            const fs = require('fs');
            const buffer = fs.readFileSync(filePath);
            if (!buffer || buffer.length === 0) {
                if (window.showNotification)
                    window.showNotification(typeof tr === 'function' ? tr('msg.imageLoadError', 'Error: File is empty or unreadable', { error: 'empty' }) : 'Error: empty file', 'error');
                return;
            }

            const ext = filePath.split('.').pop().toLowerCase();
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';

            // createImageBitmap + Blob — CSP ve URL sorunlarını bypass eder
            const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
            const blob = new Blob([uint8], { type: mime });

            let bitmap;
            try {
                bitmap = await createImageBitmap(blob);
            } catch (bmpErr) {
                console.warn('[ImageEditor] createImageBitmap başarısız, data URL denenecek:', bmpErr);
                // Fallback: data URL + Image element
                const base64 = buffer.toString('base64');
                const url = `data:${mime};base64,${base64}`;
                bitmap = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(new Error('Image decode failed'));
                    img.src = url;
                });
            }

            canvasW = bitmap.width;
            canvasH = bitmap.height;
            canvas.width  = canvasW;
            canvas.height = canvasH;
            ctx.clearRect(0, 0, canvasW, canvasH);
            ctx.drawImage(bitmap, 0, 0);

            // Resmi tam sığacak zoom hesapla, panı sıfırla (ortalanmış başla)
            panX = 0; panY = 0;
            setZoom(calcFitZoom(canvasW, canvasH));

            // Boyut seçiciyi güncelle
            const sel = document.getElementById('ie-size-sel');
            if (sel && [16,32,64,128].includes(canvasW)) sel.value = String(canvasW);

            history = []; historyIndex = -1;
            pushHistory();
            isDirty = false; // yeni yüklenen dosya temiz
            render();
            updateStatus();
                if (window.showNotification) {
                    window.showNotification(
                        typeof tr === 'function'
                            ? tr('msg.imageLoaded', 'Loaded: {name} ({size})', { name: filePath.split(/[/\\]/).pop(), size: `${canvasW}×${canvasH}` })
                            : `Loaded: ${filePath.split(/[/\\]/).pop()} (${canvasW}×${canvasH})`,
                        'success'
                    );
                }
        } catch (err) {
            console.error('[ImageEditor] Yükleme hatası:', err);
            if (window.showNotification)
                window.showNotification(typeof tr === 'function' ? tr('msg.imageLoadError', 'Error: Could not load — ' + err.message, { error: err.message }) : 'Load error: ' + err.message, 'error');
        }
    };

    // ─── Sekme aktivasyonunda init ────────────────────────────
    window.initImageEditor = function () {
        init();
    };

    // ─── app.js için durum API'ları ──────────────────────────
    window.imageEditorIsDirty      = () => isDirty;
    window.imageEditorCurrentPath  = () => currentImagePath;
    window.saveImageEditorFile     = saveImage;

    // DOMContentLoaded'da değil, tab açılınca başlat (app.js tarafından çağrılır)
})();
