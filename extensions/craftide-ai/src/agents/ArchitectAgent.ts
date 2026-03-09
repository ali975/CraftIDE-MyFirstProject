import { LLMProvider } from '../llm/LLMProvider';
import { DesignCard, ProjectContext } from '../types';

/**
 * Agent-A: Mimar (Architect Agent)
 * 
 * Kullanıcının doğal dil girdisini yapılandırılmış
 * bir DesignCard spesifikasyonuna dönüştürür.
 * 
 * ÖNEMLİ: Bu agent KOD ÜRETMEZ, sadece tasarım yapar.
 */
export class ArchitectAgent {
    constructor(private readonly llm: LLMProvider) { }

    /**
     * Kullanıcı mesajını analiz edip DesignCard üret
     */
    async design(
        userMessage: string,
        mcVersion: string,
        platform: string,
        context?: ProjectContext
    ): Promise<DesignCard> {
        const systemPrompt = this._buildSystemPrompt(mcVersion, platform, context);

        const response = await this.llm.generate(userMessage, systemPrompt, {
            temperature: 0.4, // Deterministik tasarım için düşük
            maxTokens: 4096,
        });

        return this._parseDesignCard(response);
    }

    /**
     * Streaming tasarım (UI'da adım adım göstermek için)
     */
    async *designStream(
        userMessage: string,
        mcVersion: string,
        platform: string,
        context?: ProjectContext
    ): AsyncIterable<string> {
        const systemPrompt = this._buildSystemPrompt(mcVersion, platform, context);
        yield* this.llm.generateStream(userMessage, systemPrompt, {
            temperature: 0.4,
            maxTokens: 4096,
        });
    }

    private _buildSystemPrompt(mcVersion: string, platform: string, context?: ProjectContext): string {
        const contextBlock = context ? `
## PROJE BAĞLAMI
- Workspace: ${context.rootPath || 'unknown'}
- Aktif dosya: ${context.activeFile || 'unknown'}
- Bilinen dosyalar: ${(context.existingFiles || []).slice(0, 20).join(', ') || 'none'}
- Bağımlılıklar: ${(context.dependencies || []).join(', ') || 'none'}
- Proje özeti: ${context.projectSummary || 'none'}
- Bilgi paketleri: ${(context.knowledgePacks || []).join(', ') || 'none'}
- API ipuçları:
${(context.apiHighlights || []).map((line) => `  - ${line}`).join('\n') || '  - none'}
` : '';
        return `Sen CraftIDE'nin Mimar Ajanısın (Agent-A).

## GÖREV
Kullanıcının Türkçe veya İngilizce doğal dil girdisini analiz et ve bir Minecraft plugin tasarım kartı (DesignCard) üret.

## KURALLAR
1. KOD YAZMA — sadece mimari tasarım yap
2. Hedef platform: ${platform}
3. Hedef Minecraft versiyonu: ${mcVersion}
4. Tasarımı MUTLAKA aşağıdaki JSON formatında döndür
5. Mimari kararlarının nedenini açıkla (reasoning)
6. Deprecated API'ler kullanma (MC ${mcVersion} için güncel API'leri hedefle)
7. Eksik bilgi varsa mantıklı varsayımlarda bulun
8. Mevcut proje bağlamını kullanarak tasarımı mevcut workspace ile uyumlu düşün

${contextBlock}

## ÇIKTI FORMATI
Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:

\`\`\`json
{
  "pluginName": "PluginAdı",
  "description": "Plugin açıklaması",
  "targetPlatform": "${platform}",
  "minecraftVersion": "${mcVersion}",
  "architecture": {
    "pattern": "event-driven|command-based|scheduled|hybrid",
    "reasoning": "Bu pattern neden seçildi"
  },
  "commands": [
    {
      "name": "komut",
      "usage": "/komut <arg>",
      "permission": "plugin.komut",
      "description": "Komut açıklaması",
      "arguments": [{"name": "arg", "type": "string", "required": false}]
    }
  ],
  "events": [
    {
      "eventClass": "PlayerJoinEvent",
      "description": "Ne zaman tetiklenir",
      "priority": "NORMAL"
    }
  ],
  "guis": [
    {
      "title": "GUI Başlığı",
      "rows": 3,
      "items": [{"slot": 13, "material": "DIAMOND_SWORD", "displayName": "Item Adı", "action": "ne yapar"}]
    }
  ],
  "config": {
    "ayar_adı": {"type": "string", "default": "değer", "description": "Açıklama"}
  },
  "dependencies": [
    {"name": "Vault", "required": true, "reason": "Ekonomi sistemi için"}
  ],
  "storage": {
    "type": "yaml|sqlite|mysql|none",
    "tables": [{"name": "tablo", "columns": ["id", "name"]}]
  },
  "classes": [
    {"name": "SınıfAdı", "type": "main|command|listener|gui|manager|util", "description": "Açıklama", "relationships": ["DiğerSınıf"]}
  ],
  "estimatedComplexity": "simple|medium|complex"
}
\`\`\`

## ÖNEMLİ
- Tüm alanları doldur (boş array [] kullanılabilir)
- permission isimleri lowercase ve noktalı olmalı
- Event sınıf isimleri tam olmalı (örn: org.bukkit.event.player.PlayerJoinEvent)
- MC ${mcVersion}'a uygun API kullan`;
    }

    /**
     * LLM çıktısındaki JSON'ı parse et
     */
    private _parseDesignCard(response: string): DesignCard {
        // JSON bloğunu bul
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;

        try {
            const parsed = JSON.parse(jsonStr.trim());
            return this._validateAndFill(parsed);
        } catch (error) {
            // JSON parse hatası — son çare olarak tüm yanıtı dene
            try {
                const cleanJson = response
                    .replace(/^[^{]*/, '')  // { öncesi metni sil
                    .replace(/[^}]*$/, ''); // } sonrası metni sil
                return this._validateAndFill(JSON.parse(cleanJson));
            } catch {
                throw new Error(`Agent-A tasarım kartı oluşturamadı. LLM yanıtı geçersiz JSON.`);
            }
        }
    }

    /**
     * Eksik alanları varsayılan değerlerle doldur
     */
    private _validateAndFill(card: any): DesignCard {
        return {
            pluginName: card.pluginName || 'UnnamedPlugin',
            description: card.description || '',
            targetPlatform: card.targetPlatform || 'paper',
            minecraftVersion: card.minecraftVersion || '1.20.4',
            architecture: card.architecture || { pattern: 'hybrid', reasoning: '' },
            commands: card.commands || [],
            events: card.events || [],
            guis: card.guis || [],
            config: card.config || {},
            dependencies: card.dependencies || [],
            storage: card.storage || { type: 'none' },
            classes: card.classes || [],
            estimatedComplexity: card.estimatedComplexity || 'medium',
        };
    }
}
