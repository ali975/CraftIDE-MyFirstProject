import { LLMProvider } from '../llm/LLMProvider';
import { DesignCard, GeneratedFiles, GeneratedFile } from '../types';

/**
 * Agent-B: Kodlayıcı (Coder Agent)
 * 
 * Agent-A'nın DesignCard çıktısını alır ve
 * hedef platforma uygun, derlenebilir/çalıştırılabilir
 * kaynak kod dosyaları üretir.
 */
export class CoderAgent {
    constructor(private readonly llm: LLMProvider) { }

    /**
     * DesignCard'dan tam proje kodu üret
     */
    async generateCode(designCard: DesignCard): Promise<GeneratedFiles> {
        const systemPrompt = this._buildSystemPrompt(designCard);
        const userPrompt = this._buildUserPrompt(designCard);

        const response = await this.llm.generate(userPrompt, systemPrompt, {
            temperature: 0.2, // Kod üretimi için çok düşük — deterministik
            maxTokens: 8192,
        });

        return this._parseGeneratedFiles(response, designCard);
    }

    /**
     * Streaming kod üretimi
     */
    async *generateCodeStream(designCard: DesignCard): AsyncIterable<string> {
        const systemPrompt = this._buildSystemPrompt(designCard);
        const userPrompt = this._buildUserPrompt(designCard);
        yield* this.llm.generateStream(userPrompt, systemPrompt, {
            temperature: 0.2,
            maxTokens: 8192,
        });
    }

    /**
     * Doğrulama hatasından sonra kod düzeltme
     */
    async fixCode(
        designCard: DesignCard,
        currentFiles: GeneratedFiles,
        errors: string[]
    ): Promise<GeneratedFiles> {
        const systemPrompt = `Sen CraftIDE'nin Kodlayıcı Ajanısın (Agent-B).
Doğrulayıcı Agent (Agent-C) mevcut kodda hatalar buldu.
Bu hataları düzelt ve tüm dosyaları güncellenmiş haliyle üret.

HATALAR:
${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

MEVCUT DOSYALAR:
${currentFiles.files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n')}

Düzeltilmiş tüm dosyaları aynı JSON formatında döndür.`;

        const response = await this.llm.generate(
            'Yukarıdaki hataları düzelt.',
            systemPrompt,
            { temperature: 0.1, maxTokens: 8192 }
        );

        return this._parseGeneratedFiles(response, designCard);
    }

    private _buildSystemPrompt(card: DesignCard): string {
        return `Sen CraftIDE'nin Kodlayıcı Ajanısın (Agent-B).

## GÖREV
Mimar Ajanın (Agent-A) ürettiği DesignCard spesifikasyonunu alıp TAM, DERLENEBİLİR kod üret.

## KURALLAR
1. Hedef platform: ${card.targetPlatform}
2. Minecraft versiyonu: ${card.minecraftVersion}
3. Her dosya TAM olmalı — kısaltma yapma
4. Best practice'lere uy:
   - Null-check yap
   - Try-catch ekle (özellikle DB işlemlerinde)
   - Async DB çağrıları BukkitScheduler ile yap
   - Config reload desteği ekle  
5. plugin.yml'de TÜM komutları ve izinleri tanımla
6. Türkçe yorum satırları ekle
7. Deprecated metod KULLANMA

## ÇIKTI FORMATI
Yanıtını SADECE aşağıdaki JSON formatında ver:

\`\`\`json
{
  "files": [
    {
      "path": "src/main/java/com/example/MyPlugin.java",
      "content": "package com.example;\\n\\nimport...",
      "language": "java",
      "description": "Ana plugin sınıfı",
      "isNew": true
    }
  ],
  "buildInstructions": {
    "tool": "maven",
    "command": "mvn clean package",
    "outputPath": "target/PluginName-1.0.0.jar"
  }
}
\`\`\``;
    }

    private _buildUserPrompt(card: DesignCard): string {
        return `Aşağıdaki tasarım kartına göre tam proje kodunu üret:

${JSON.stringify(card, null, 2)}

TÜM dosyaları üret: ana sınıf, komut handler'lar, event listener'lar, GUI sınıfları, config, plugin.yml, pom.xml.`;
    }

    private _parseGeneratedFiles(response: string, card: DesignCard): GeneratedFiles {
        // JSON bloğunu bul
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;

        try {
            const parsed = JSON.parse(jsonStr.trim());
            return this._validateFiles(parsed, card);
        } catch {
            // JSON parse hatası — dosyaları manuel ayıkla
            return this._extractFilesFromText(response, card);
        }
    }

    private _validateFiles(data: any, card: DesignCard): GeneratedFiles {
        const files: GeneratedFile[] = (data.files || []).map((f: any) => ({
            path: f.path || 'unknown.java',
            content: f.content || '',
            language: f.language || 'java',
            description: f.description || '',
            isNew: f.isNew !== false,
        }));

        return {
            files,
            buildInstructions: data.buildInstructions || {
                tool: 'maven',
                command: 'mvn clean package',
                outputPath: `target/${card.pluginName}-1.0.0.jar`,
            },
        };
    }

    /**
     * LLM JSON üretemezse, code block'lardan dosya ayıkla
     */
    private _extractFilesFromText(response: string, card: DesignCard): GeneratedFiles {
        const files: GeneratedFile[] = [];
        const codeBlockRegex = /(?:---\s*(.+?)\s*---\s*)?```(\w+)\s*([\s\S]*?)```/g;

        let match;
        while ((match = codeBlockRegex.exec(response)) !== null) {
            const filePath = match[1] || `file_${files.length}.${match[2]}`;
            files.push({
                path: filePath.trim(),
                content: match[3].trim(),
                language: match[2] as any,
                description: '',
                isNew: true,
            });
        }

        return {
            files,
            buildInstructions: {
                tool: 'maven',
                command: 'mvn clean package',
                outputPath: `target/${card.pluginName}-1.0.0.jar`,
            },
        };
    }
}
