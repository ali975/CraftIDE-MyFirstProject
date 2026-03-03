/**
 * CraftIDE LLM Provider — Hibrit AI Model Yöneticisi
 * 
 * Desteklenen sağlayıcılar:
 * - Ollama (lokal, ücretsiz)
 * - LM Studio (lokal, OpenAI uyumlu)
 * - OpenAI (cloud)
 * - Anthropic (cloud)
 * - Google Gemini (cloud)
 */

class LLMProvider {
    constructor() {
        this.config = this._loadConfig();
    }

    _loadConfig() {
        const fromLS = (lsKey, fallback) => {
            const d = document.getElementById(lsKey)?.value;
            if (d && d.trim()) return d.trim();
            return localStorage.getItem(lsKey) || fallback;
        };
        return {
            provider: fromLS('setting-ai-provider', 'ollama'),
            model:    fromLS('setting-ai-model', 'codellama:13b'),
            endpoint: fromLS('setting-ai-endpoint', 'http://localhost:11434'),
            apiKey:   fromLS('setting-ai-key', ''),
        };
    }

    reload() {
        this.config = this._loadConfig();
    }

    /**
     * Streaming metin üretimi
     * @param {string} prompt 
     * @param {string} systemPrompt 
     * @param {function} onChunk — Her chunk geldiğinde çağrılır
     * @returns {Promise<string>} — Tam yanıt
     */
    async generateStream(prompt, systemPrompt, onChunk) {
        this.reload();
        const c = this.config;

        switch (c.provider) {
            case 'ollama':
            case 'lmstudio':
                return this._streamOllama(prompt, systemPrompt, onChunk, c);
            case 'openai':
                return this._streamOpenAI(prompt, systemPrompt, onChunk, c);
            case 'anthropic':
                return this._streamAnthropic(prompt, systemPrompt, onChunk, c);
            case 'google':
                return this._streamGoogle(prompt, systemPrompt, onChunk, c);
            default:
                throw new Error('Bilinmeyen AI sağlayıcı: ' + c.provider);
        }
    }

    /**
     * Tek seferlik üretim (stream'siz)
     */
    async generate(prompt, systemPrompt) {
        let full = '';
        await this.generateStream(prompt, systemPrompt, (chunk) => { full += chunk; });
        return full;
    }

    /**
     * Bağlantı testi
     */
    async testConnection() {
        this.reload();
        try {
            if (this.config.provider === 'ollama' || this.config.provider === 'lmstudio') {
                const resp = await fetch(this.config.endpoint + '/api/tags');
                if (resp.ok) {
                    const data = await resp.json();
                    const models = (data.models || []).map(m => m.name);
                    return { success: true, message: 'Bağlantı başarılı! Modeller: ' + models.join(', ') };
                }
                return { success: false, message: 'Sunucu yanıt verdi ama hata döndü.' };
            } else {
                return { success: true, message: this.config.provider + ' API key ayarlandı.' };
            }
        } catch (e) {
            return { success: false, message: 'Bağlantı hatası: ' + e.message };
        }
    }

    // ─── Ollama / LM Studio ──────────────────────────────────

    async _streamOllama(prompt, systemPrompt, onChunk, c) {
        const baseUrl = c.provider === 'lmstudio'
            ? (c.endpoint || 'http://localhost:1234')
            : (c.endpoint || 'http://localhost:11434');

        const resp = await fetch(baseUrl + '/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: c.model,
                prompt: prompt,
                system: systemPrompt,
                stream: true,
                options: { temperature: 0.7, num_predict: 4096 }
            }),
        });

        if (!resp.ok) throw new Error('Ollama hatası: ' + resp.status);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        full += json.response;
                        onChunk(json.response);
                    }
                } catch (e) { /* skip malformed */ }
            }
        }

        return full;
    }

    // ─── OpenAI ──────────────────────────────────────────────

    async _streamOpenAI(prompt, systemPrompt, onChunk, c) {
        const endpoint = c.endpoint || 'https://api.openai.com';
        const resp = await fetch(endpoint + '/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + c.apiKey,
            },
            body: JSON.stringify({
                model: c.model || 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                stream: true,
                temperature: 0.7,
                max_tokens: 4096,
            }),
        });

        if (!resp.ok) throw new Error('OpenAI hatası: ' + resp.status);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n').filter(l => l.startsWith('data: '));

            for (const line of lines) {
                const data = line.substring(6).trim();
                if (data === '[DONE]') break;
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content || '';
                    if (content) {
                        full += content;
                        onChunk(content);
                    }
                } catch (e) { /* skip */ }
            }
        }

        return full;
    }

    // ─── Anthropic ───────────────────────────────────────────

    async _streamAnthropic(prompt, systemPrompt, onChunk, c) {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': c.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model: c.model || 'claude-3-sonnet-20240229',
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }],
                stream: true,
            }),
        });

        if (!resp.ok) throw new Error('Anthropic hatası: ' + resp.status);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n').filter(l => l.startsWith('data: '));

            for (const line of lines) {
                try {
                    const json = JSON.parse(line.substring(6));
                    if (json.type === 'content_block_delta' && json.delta?.text) {
                        full += json.delta.text;
                        onChunk(json.delta.text);
                    }
                } catch (e) { /* skip */ }
            }
        }

        return full;
    }

    // ─── Google Gemini ───────────────────────────────────────

    async _streamGoogle(prompt, systemPrompt, onChunk, c) {
        const model = c.model || 'gemini-pro';
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':streamGenerateContent?alt=sse&key=' + c.apiKey;

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] },
                ],
                generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
            }),
        });

        if (!resp.ok) throw new Error('Google AI hatası: ' + resp.status);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n').filter(l => l.startsWith('data: '));

            for (const line of lines) {
                try {
                    const json = JSON.parse(line.substring(6));
                    const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (content) {
                        full += content;
                        onChunk(content);
                    }
                } catch (e) { /* skip */ }
            }
        }

        return full;
    }
}

// ═══════════════════════════════════════════════════════════
// Minecraft Plugin AI System Prompts
// ═══════════════════════════════════════════════════════════

const MC_SYSTEM_PROMPT = `Sen CraftIDE AI Asistanısın. Minecraft plugin geliştirme konusunda uzmansın.

Desteklediğin platformlar:
- Paper/Spigot (Bukkit API) — Java pluginler
- Fabric — Java modlar
- Skript — Script tabanlı pluginler
- Velocity/BungeeCord — Proxy pluginler

Kurallar:
1. Kod üretirken TAM ve ÇALIŞIR kod yaz, snippet değil.
2. Türkçe açıklamalar kullan.
3. Modern Java pratiklerini takip et (Java 17+).
4. Paper API'sinin güncel versiyonlarını kullan (1.21.11).
5. Güvenlik ve performans best practice'lerini uygula.
6. Kodun başına package ve import'ları ekle.
7. Yanıtlarını Markdown formatında yaz.
8. Kod bloklarını \`\`\`java veya \`\`\`yaml ile işaretle.`;

// Global erişim
window.llmProvider = new LLMProvider();
window.MC_SYSTEM_PROMPT = MC_SYSTEM_PROMPT;
