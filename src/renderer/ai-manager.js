/**
 * CraftIDE — Core AI Manager (The Brain)
 * 
 * Bu sınıf tüm IDE'nin durumunu (context) tutar ve LLM Provider ile
 * IDE bileşenleri (Visual Builder, Editor, Terminal) arasında köprü görevi görür.
 */

class CraftAIManager {
    constructor() {
        this.llm = window.llmProvider;
        if (!this.llm) {
            console.error("LLM Provider bulunamadı! ai-manager.js, llm-provider.js'den sonra yüklenmeli.");
        }
        this.chatHistory = [];
        this.isProcessing = false;

        // Arayüz elemanları
        this.chatMessagesContainer = document.getElementById('ai-messages');
        this.chatInput = document.getElementById('ai-input');
        this.sendBtn = document.getElementById('btn-ai-send');

        this._bindEvents();
    }

    _bindEvents() {
        if (this.sendBtn && this.chatInput) {
            this.sendBtn.addEventListener('click', () => this.handleChatInput());
            this.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleChatInput();
                }
            });
        }
    }

    /**
     * IDE'nin o anki genel durumunu toplar
     */
    getIdeContext() {
        // currentFilePath and activePanel from app.js (globals)
        const activeFile = typeof currentFilePath !== 'undefined' ? currentFilePath : null;
        const panel = typeof activePanel !== 'undefined' ? activePanel : null;

        let context = {
            activeFile: activeFile,
            activePanel: panel,
            isVisualBuilderOpen: activeFile && activeFile.startsWith('visual-builder://'),
            visualBuilderMode: typeof vbCurrentMode !== 'undefined' ? vbCurrentMode : null,
            visualBuilderNodesCount: typeof vbNodes !== 'undefined' ? vbNodes.length : 0,
        };

        // Eğer Visual Builder açıksa, tuvaldeki yapıyı özetle
        if (context.isVisualBuilderOpen && typeof vbNodes !== 'undefined') {
            context.vbSummary = vbNodes.map(n => ({
                id: n.id,
                blockId: n.blockId,
                params: n.params
            }));
            context.vbConnections = typeof vbConnections !== 'undefined' ? vbConnections : [];
        }

        // Eğer kod editörü açıksa, kodun bir kısmını al
        if (!context.isVisualBuilderOpen && activeFile && window.monacoEditor) {
            const code = window.monacoEditor.getValue();
            context.codeSnippet = code.substring(0, 1000); // İlk 1000 karakter
        }

        return context;
    }

    appendMessage(role, text, isHtml = false) {
        if (!this.chatMessagesContainer) return null;

        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ai-${role}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'ai-avatar';
        avatarDiv.textContent = role === 'user' ? '👤' : (role === 'system' ? '⚠️' : '🤖');

        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-content';

        if (isHtml) {
            contentDiv.innerHTML = text;
        } else {
            const p = document.createElement('p');
            p.textContent = text;
            contentDiv.appendChild(p);
        }

        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(contentDiv);

        this.chatMessagesContainer.appendChild(msgDiv);
        this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;

        return contentDiv; // Streaming sırasında güncellemek için döndürüyoruz
    }

    async handleChatInput() {
        if (this.isProcessing) return;
        const text = this.chatInput.value.trim();
        if (!text) return;

        this.chatInput.value = '';
        this.appendMessage('user', text);
        this.chatHistory.push({ role: 'user', content: text });

        this.isProcessing = true;
        this.sendBtn.disabled = true;

        const context = this.getIdeContext();

        // Asistan mesajı konteyneri oluştur
        const responseContentDiv = this.appendMessage('assistant', 'Düşünüyor...', true);

        try {
            if (context.isVisualBuilderOpen) {
                // TEXT-TO-NODE MODE
                await this.processTextToNode(text, context, responseContentDiv);
            } else {
                // GENERAL CHAT MODE
                await this.processGeneralChat(text, context, responseContentDiv);
            }
        } catch (error) {
            console.error(error);
            responseContentDiv.innerHTML = `<p style="color:#e74c3c;">Hata: ${error.message}</p>`;
        } finally {
            this.isProcessing = false;
            this.sendBtn.disabled = false;
        }
    }

    async processGeneralChat(userText, context, responseContentDiv) {
        const systemPrompt = `Sen CraftIDE'nin merkez yapay zeka asistanısın. 
Şu an kullanıcının açık olan dosyası: ${context.activeFile || 'Yok'}
Açık olan panel: ${context.activePanel}
${context.codeSnippet ? '\nMevcut Kod:\n' + context.codeSnippet : ''}

Kullanıcıya Minecraft eklenti, mod veya Skript geliştirmesinde yardımcı ol.`;

        let fullResponse = '';
        await this.llm.generateStream(userText, systemPrompt, (chunk) => {
            fullResponse += chunk;
            responseContentDiv.innerHTML = `<p>${this._escapeHtml(fullResponse).replace(/\\n/g, '<br>')}</p>`;
        });

        this.chatHistory.push({ role: 'assistant', content: fullResponse });
    }

    async processTextToNode(userText, context, responseContentDiv) {
        responseContentDiv.innerHTML = `<p>Sizin için blokları hazırlıyorum... <span class="ai-loading"></span></p>`;

        const mode = context.visualBuilderMode || 'plugin';

        // Hangi blokların uygun olduğunu bularak şemayı sadece o moda göre LLM'e vereceğiz
        const availableBlocks = Object.keys(ALL_BLOCK_DEFS).reduce((acc, key) => {
            if (key.startsWith(mode === 'fabric' ? 'Fabric' : (mode === 'forge' ? 'Forge' : (mode === 'skript' ? 'Sk' : '')))) {
                // Plugin modunda özel ön ek yok
                if (mode !== 'plugin' || (!key.startsWith('Fabric') && !key.startsWith('Forge') && !key.startsWith('Sk'))) {
                    acc[key] = ALL_BLOCK_DEFS[key].label;
                }
            }
            return acc;
        }, {});

        // Plugin modu fallback için (yukarıdaki filtreleme tam çalışmazsa diye basit bir check)
        let blockDefsStr = '';
        if (typeof ALL_BLOCK_DEFS !== 'undefined' && ALL_BLOCK_DEFS[mode]) {
            blockDefsStr = Object.entries(ALL_BLOCK_DEFS[mode]).map(([id, def]) => {
                let params = (def.params || []).map(p => p.n).join(', ');
                return `- ${id} (${def.label}) [Params: ${params}]`;
            }).join('\n');
        }

        const systemPrompt = `Sen CraftIDE Visual Builder Asistanısın. Görevin kullanıcının isteğini node (blok) tabanlı bir plugin blueprint'ine çevirmektir.
Şu anki mod: ${mode}

KULLANILABİLECEK BLOKLAR (ID ve Parametreleri):
${blockDefsStr}

Kullanıcının isteğini analiz et ve SADECE VEYA SADECE GEÇERLİ BİR JSON çıktısı ver. Başka hiçbir açıklama yazma.
JSON formatı şöyle olmalıdır:
{
    "message": "Kullanıcıya gösterilecek kısa açıklayıcı mesaj.",
    "nodes": [
        { "blockId": "PlayerJoin", "x": 100, "y": 100, "params": {} },
        { "blockId": "SendMessage", "x": 400, "y": 100, "params": { "mesaj": "Merhaba!" } }
    ],
    "connections": [
        { "fromIndex": 0, "toIndex": 1 }
    ]
}

Not: fromIndex ve toIndex "nodes" dizisindeki sıraya (0'dan başlayarak) işaret eder.`;

        let rawResponse = '';
        await this.llm.generateStream(userText, systemPrompt, (chunk) => {
            rawResponse += chunk;
        });

        // JSON bloğunu ayıkla
        try {
            const jsonMatch = rawResponse.match(/\\{.*\\}/s);
            let jsonString = rawResponse;
            if (jsonMatch) jsonString = jsonMatch[0];

            // Eğer markdown json bloğu içine alındıysa
            jsonString = jsonString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const resultJSON = JSON.parse(jsonString);

            // UI Güncelle
            responseContentDiv.innerHTML = `<p>${resultJSON.message}</p>
            <div style="margin-top: 8px; padding: 8px; background: rgba(46, 204, 113, 0.1); border-left: 3px solid #2ecc71; border-radius: 4px; font-size: 12px;">
                ✓ ${resultJSON.nodes.length} blok ve ${resultJSON.connections.length} bağlantı oluşturuldu.
            </div>`;

            // Canvas'ı temizle
            document.getElementById('btn-vb-clear').click();

            // API üzerinden Visual Builder'a json'u aktar
            this.renderAIBlueprint(resultJSON);

            this.chatHistory.push({ role: 'assistant', content: resultJSON.message });

        } catch (e) {
            console.error("JSON Parse Error:", e, rawResponse);
            responseContentDiv.innerHTML = `<p style="color:#e74c3c;">Üzgünüm, blok şemasını oluştururken bir hata oluştu. Lütfen komutunu biraz daha netleştirip tekrar dene.</p>
            <details style="font-size:10px; margin-top:5px; opacity:0.7"><summary>Hata Detayı</summary>${e.message}<br>${rawResponse}</details>`;
        }
    }

    renderAIBlueprint(blueprint) {
        if (!blueprint || !blueprint.nodes) return;

        const idMap = {};

        // Nodları render et
        blueprint.nodes.forEach((n, i) => {
            // function createNode(blockId, x, y) in visual-builder.js
            const node = createNode(n.blockId, n.x, n.y);
            if (node) {
                if (n.params) Object.assign(node.params, n.params);
                // HTML inputları güncelle
                if (typeof refreshNodeInputs === 'function') {
                    refreshNodeInputs(node);
                }
                idMap[i] = node.id;
            }
        });

        // Bağlantıları kur
        if (blueprint.connections && typeof vbConnections !== 'undefined') {
            blueprint.connections.forEach(c => {
                const fromId = idMap[c.fromIndex];
                const toId = idMap[c.toIndex];
                if (fromId && toId) {
                    vbConnections.push({ from: fromId, to: toId });
                }
            });
            // Canvas'ı tekrar çiz
            if (typeof drawConnections === 'function') drawConnections();
        }
    }

    async processServerError(errorMsg) {
        if (this.isProcessing) return;

        // Asistana bildirimi sessizce düşür ya da panel açıksa göster
        const context = this.getIdeContext();

        // Yeni bir sohbet balonu aç
        document.querySelector('.activity-btn[data-panel="ai"]')?.click();

        const responseContentDiv = this.appendMessage('assistant', 'Bir sunucu hatası tespit ettim, inceliyorum...', true);
        this.isProcessing = true;
        this.sendBtn.disabled = true;

        const systemPrompt = `Sen CraftIDE Auto-Healing Asistanısın. 
Test sunucusunda bir Java/Plugin hatası meydana geldi.
İşte hata logu:
${errorMsg}

Bu hatanın sebebini açıkla ve kullanıcının anlayabileceği dilde ÇÖZÜM ÖNERİSİ sun.
Eğer tuvaldeki/kodtaki birşeyi düzeltebilecek isen, bunu da JSON objesi olarak \`\`\`json bloğu ile gönder.
Tuval özeti: ${JSON.stringify(context.vbSummary || {})}
`;

        let rawResponse = '';
        try {
            await this.llm.generateStream('Lütfen bu hatayı analiz et ve nasıl çözeceğimi söyle.', systemPrompt, (chunk) => {
                rawResponse += chunk;
                responseContentDiv.innerHTML = `<p>${this._escapeHtml(rawResponse).replace(/\\n/g, '<br>')}</p>`;
            });
            this.chatHistory.push({ role: 'assistant', content: rawResponse });
        } catch (e) {
            responseContentDiv.innerHTML = `<p style="color:#e74c3c;">Hata incelenirken bir sorun oluştu.</p>`;
        } finally {
            this.isProcessing = false;
            this.sendBtn.disabled = false;
        }
    }

    async checkGameBalance() {
        if (this.isProcessing) return;
        const context = this.getIdeContext();
        if (!context.isVisualBuilderOpen || context.visualBuilderNodesCount === 0) return;

        // Çok sık çalışmaması için basit bir check.
        const summaryStr = JSON.stringify(context.vbSummary);
        if (this._lastBalanceCheck === summaryStr) return;
        this._lastBalanceCheck = summaryStr;

        const systemPrompt = `Sen CraftIDE Oyun Tasarımı ve Denge (Balance) Asistanısın.
Kullanıcının Visual Builder'da tasarladığı eklenti mantığını incele.
Amacın eklentide aşırı güçlü (OP), sunucu ekonomisini veya oynanışı bozabilecek (örneğin oyuncu girince kılıç veya 64 elmas vermek gibi) durumlar olup olmadığını kontrol etmek.
Eğer HERHANGİ BİR dengesizlik yoksa veya normal bir sistemse sadece SESSİZ KAL ve "OK" yaz. 
Eğer dengesizlik/OP durumu varsa, nedenini açıklayıp "Denge Uyarısı: ..." şeklinde kısa ve nazik bir uyarı yap. Uyarın 2 cümleyi geçmesin.

Mevcut Sistem Özeti:
${summaryStr}`;

        try {
            // Arka planda sessiz sorgu - UI kilitleme
            const response = await this.llm.invoke(systemPrompt); // chat modelinde stream yerine full invoke varsayalım
            // Ama llmProvider'da invoke yok. Sadece generateStream var normalde. 
            // Kendimiz ufak bir buffering yapalım.
            let fullText = '';
            await this.llm.generateStream('Denge kontrolü.', systemPrompt, (c) => fullText += c);

            if (fullText.trim() !== 'OK' && fullText.length > 5 && !fullText.includes('"OK"')) {
                document.querySelector('.activity-btn[data-panel="ai"]')?.click();
                this.appendMessage('assistant', `⚖️ **Denge Uyarısı:** ${this._escapeHtml(fullText)}`, true);
                this.chatHistory.push({ role: 'assistant', content: fullText });
            }
        } catch (e) {
            console.error("Balance check failed", e);
        }
    }

    triggerBalanceCheck() {
        if (this._balanceTimer) clearTimeout(this._balanceTimer);
        this._balanceTimer = setTimeout(() => {
            this.checkGameBalance();
        }, 3000); // 3 seconds debounce
    }

    _escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    // Biraz gecikmeli başlatalım ki llmProvider, vbCurrentMode tam oturmuş olsun
    setTimeout(() => {
        window.aiManager = new CraftAIManager();
        console.log('🧠 CraftAIManager initialized.');
    }, 500);
});
