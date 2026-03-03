import * as vscode from 'vscode';
import { LLMConfig, LLMProviderType, ModelInfo } from '../types';

/**
 * CraftIDE LLM Provider — Hibrit AI Model Yöneticisi
 * 
 * Desteklenen sağlayıcılar:
 * - Ollama (lokal, ücretsiz)
 * - LM Studio (lokal)
 * - OpenAI (cloud)
 * - Anthropic (cloud)
 * - Google Gemini (cloud)
 */
export class LLMProvider {
    private _config: LLMConfig;

    constructor() {
        this._config = this._loadConfig();
    }

    /**
     * Aktif yapılandırmayı VS Code ayarlarından yükle
     */
    private _loadConfig(): LLMConfig {
        const config = vscode.workspace.getConfiguration('craftide.ai');
        return {
            provider: config.get<LLMProviderType>('provider', 'ollama'),
            model: config.get<string>('model', 'codellama:13b'),
            endpoint: config.get<string>('endpoint', 'http://localhost:11434'),
            apiKey: config.get<string>('apiKey', ''),
            temperature: 0.7,
            maxTokens: 4096,
        };
    }

    /**
     * Yapılandırmayı yeniden yükle
     */
    reload(): void {
        this._config = this._loadConfig();
    }

    /**
     * Mevcut yapılandırmayı döndür
     */
    getConfig(): LLMConfig {
        return { ...this._config };
    }

    /**
     * Metin üretimi (streaming)
     */
    async *generateStream(
        prompt: string,
        systemPrompt: string,
        options?: { temperature?: number; maxTokens?: number }
    ): AsyncIterable<string> {
        const temp = options?.temperature ?? this._config.temperature ?? 0.7;
        const maxTokens = options?.maxTokens ?? this._config.maxTokens ?? 4096;

        switch (this._config.provider) {
            case 'ollama':
            case 'lmstudio':
                yield* this._generateOllama(prompt, systemPrompt, temp, maxTokens);
                break;
            case 'openai':
                yield* this._generateOpenAI(prompt, systemPrompt, temp, maxTokens);
                break;
            case 'anthropic':
                yield* this._generateAnthropic(prompt, systemPrompt, temp, maxTokens);
                break;
            case 'google':
                yield* this._generateGoogle(prompt, systemPrompt, temp, maxTokens);
                break;
            default:
                throw new Error(`Desteklenmeyen LLM sağlayıcı: ${this._config.provider}`);
        }
    }

    /**
     * Tek seferlik metin üretimi (stream'siz)
     */
    async generate(
        prompt: string,
        systemPrompt: string,
        options?: { temperature?: number; maxTokens?: number }
    ): Promise<string> {
        let result = '';
        for await (const chunk of this.generateStream(prompt, systemPrompt, options)) {
            result += chunk;
        }
        return result;
    }

    /**
     * Bağlantı testi
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const response = await this.generate('Say "hello"', 'You are a test agent. Reply with a single word.');
            return {
                success: response.length > 0,
                message: `✅ Bağlantı başarılı: ${this._config.provider}/${this._config.model}`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `❌ Bağlantı hatası: ${error.message}`,
            };
        }
    }

    // ─── Ollama / LM Studio ─────────────────────────────────

    private async *_generateOllama(
        prompt: string, systemPrompt: string, temperature: number, maxTokens: number
    ): AsyncIterable<string> {
        const endpoint = this._config.provider === 'lmstudio'
            ? `${this._config.endpoint}/v1/chat/completions`
            : `${this._config.endpoint}/api/chat`;

        const body = this._config.provider === 'lmstudio'
            ? {
                model: this._config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                temperature,
                max_tokens: maxTokens,
                stream: true,
            }
            : {
                model: this._config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                stream: true,
                options: { temperature, num_predict: maxTokens },
            };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Ollama API hatası: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) { throw new Error('Response body okunamıyor'); }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) { break; }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) { continue; }

                try {
                    const cleanLine = line.startsWith('data: ') ? line.slice(6) : line;
                    if (cleanLine === '[DONE]') { return; }

                    const json = JSON.parse(cleanLine);

                    if (this._config.provider === 'lmstudio') {
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) { yield content; }
                    } else {
                        const content = json.message?.content;
                        if (content) { yield content; }
                    }
                } catch {
                    // JSON parse hatası — satırı atla
                }
            }
        }
    }

    // ─── OpenAI ─────────────────────────────────────────────

    private async *_generateOpenAI(
        prompt: string, systemPrompt: string, temperature: number, maxTokens: number
    ): AsyncIterable<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this._config.apiKey}`,
            },
            body: JSON.stringify({
                model: this._config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                temperature,
                max_tokens: maxTokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API hatası: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) { throw new Error('Response body okunamıyor'); }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) { break; }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data: ') || line === 'data: [DONE]') { continue; }
                try {
                    const json = JSON.parse(line.slice(6));
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) { yield content; }
                } catch { /* skip */ }
            }
        }
    }

    // ─── Anthropic ──────────────────────────────────────────

    private async *_generateAnthropic(
        prompt: string, systemPrompt: string, temperature: number, maxTokens: number
    ): AsyncIterable<string> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this._config.apiKey || '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this._config.model,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: maxTokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API hatası: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) { throw new Error('Response body okunamıyor'); }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) { break; }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) { continue; }
                try {
                    const json = JSON.parse(line.slice(6));
                    if (json.type === 'content_block_delta') {
                        yield json.delta?.text || '';
                    }
                } catch { /* skip */ }
            }
        }
    }

    // ─── Google Gemini ──────────────────────────────────────

    private async *_generateGoogle(
        prompt: string, systemPrompt: string, temperature: number, maxTokens: number
    ): AsyncIterable<string> {
        const model = this._config.model || 'gemini-pro';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this._config.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] },
                ],
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Google API hatası: ${response.status}`);
        }

        const data = await response.json();
        for (const candidate of data.candidates || []) {
            for (const part of candidate.content?.parts || []) {
                if (part.text) {
                    yield part.text;
                }
            }
        }
    }

    /**
     * Mevcut modelleri listele
     */
    async getAvailableModels(): Promise<ModelInfo[]> {
        if (this._config.provider === 'ollama') {
            try {
                const res = await fetch(`${this._config.endpoint}/api/tags`);
                const data = await res.json();
                return (data.models || []).map((m: any) => ({
                    id: m.name,
                    name: m.name,
                    provider: 'ollama' as LLMProviderType,
                    contextWindow: 4096,
                    supportsStreaming: true,
                }));
            } catch {
                return [];
            }
        }
        // Diğer sağlayıcılar için statik liste
        return [];
    }
}
