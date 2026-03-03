import { LLMProvider } from '../llm/LLMProvider';
import { GeneratedFiles, ValidationReport, ValidationError, DesignCard } from '../types';

/**
 * Agent-C: Doğrulayıcı (Validator Agent)
 * 
 * Üretilen kodu otomatik kontrol eder.
 * Hibrit yaklaşım: Statik analiz kuralları + LLM doğrulama.
 * 
 * Doğrulama katmanları:
 * 1. Yapısal kontrol (dosya varlığı, plugin.yml ↔ kod uyumu)
 * 2. Syntax kontrol (temel Java/Skript pattern'ları)
 * 3. API uyumluluk kontrolü (deprecated metod tespiti)
 * 4. Best practice kontrolü (LLM destekli)
 */
export class ValidatorAgent {
    constructor(private readonly llm: LLMProvider) { }

    /**
     * Üretilen kodu doğrula
     */
    async validate(
        generatedFiles: GeneratedFiles,
        designCard: DesignCard
    ): Promise<ValidationReport> {
        const errors: ValidationError[] = [];

        // Katman 1: Yapısal kontrol
        errors.push(...this._checkStructure(generatedFiles, designCard));

        // Katman 2: Syntax kontrol
        errors.push(...this._checkSyntax(generatedFiles));

        // Katman 3: API uyumluluk kontrolü
        errors.push(...this._checkApiCompatibility(generatedFiles, designCard.minecraftVersion));

        // Katman 4: LLM ile best practice kontrolü
        const llmErrors = await this._checkBestPractices(generatedFiles, designCard);
        errors.push(...llmErrors);

        // Rapor oluştur
        const errCount = errors.filter(e => e.severity === 'error').length;
        const warnCount = errors.filter(e => e.severity === 'warning').length;
        const qualityScore = Math.max(0, 100 - (errCount * 20) - (warnCount * 5));

        return {
            status: errCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass',
            errors,
            metrics: {
                filesChecked: generatedFiles.files.length,
                errorsFound: errCount,
                warningsFound: warnCount,
                codeQualityScore: qualityScore,
            },
        };
    }

    // ─── Katman 1: Yapısal Kontrol ──────────────────────────

    private _checkStructure(files: GeneratedFiles, card: DesignCard): ValidationError[] {
        const errors: ValidationError[] = [];
        const filePaths = files.files.map(f => f.path);
        const fileContents = new Map(files.files.map(f => [f.path, f.content]));

        // plugin.yml kontrolü (Spigot/Paper)
        if (['spigot', 'paper'].includes(card.targetPlatform)) {
            const pluginYml = files.files.find(
                f => f.path.endsWith('plugin.yml') || f.path.endsWith('paper-plugin.yml')
            );

            if (!pluginYml) {
                errors.push({
                    severity: 'error',
                    file: 'plugin.yml',
                    code: 'MISSING_PLUGIN_YML',
                    message: 'plugin.yml dosyası bulunamadı. Spigot/Paper plugin için zorunludur.',
                    autoFixable: true,
                });
            } else {
                // Komutların plugin.yml'de tanımlı olduğunu kontrol et
                for (const cmd of card.commands) {
                    if (!pluginYml.content.includes(cmd.name)) {
                        errors.push({
                            severity: 'warning',
                            file: pluginYml.path,
                            code: 'MISSING_COMMAND_IN_YML',
                            message: `Komut "${cmd.name}" plugin.yml'de tanımlanmamış.`,
                            suggestion: `plugin.yml'nin commands bölümüne "${cmd.name}" ekleyin.`,
                            autoFixable: true,
                        });
                    }
                }
            }

            // pom.xml veya build.gradle kontrolü
            const hasBuildFile = filePaths.some(
                p => p.endsWith('pom.xml') || p.endsWith('build.gradle') || p.endsWith('build.gradle.kts')
            );
            if (!hasBuildFile) {
                errors.push({
                    severity: 'error',
                    file: 'pom.xml',
                    code: 'MISSING_BUILD_FILE',
                    message: 'Build dosyası (pom.xml veya build.gradle) bulunamadı.',
                    autoFixable: true,
                });
            }

            // Ana sınıf kontrolü
            const mainClass = files.files.find(
                f => f.language === 'java' && f.content.includes('extends JavaPlugin')
            );
            if (!mainClass) {
                errors.push({
                    severity: 'error',
                    file: 'MainClass.java',
                    code: 'MISSING_MAIN_CLASS',
                    message: 'JavaPlugin extends eden ana sınıf bulunamadı.',
                    autoFixable: false,
                });
            }
        }

        // Skript kontrolü
        if (card.targetPlatform === 'skript') {
            const skFile = files.files.find(f => f.path.endsWith('.sk'));
            if (!skFile) {
                errors.push({
                    severity: 'error',
                    file: 'script.sk',
                    code: 'MISSING_SK_FILE',
                    message: '.sk dosyası bulunamadı.',
                    autoFixable: true,
                });
            }
        }

        return errors;
    }

    // ─── Katman 2: Syntax Kontrol ───────────────────────────

    private _checkSyntax(files: GeneratedFiles): ValidationError[] {
        const errors: ValidationError[] = [];

        for (const file of files.files) {
            if (file.language === 'java') {
                errors.push(...this._checkJavaSyntax(file));
            }
        }

        return errors;
    }

    private _checkJavaSyntax(file: { path: string; content: string }): ValidationError[] {
        const errors: ValidationError[] = [];
        const lines = file.content.split('\n');

        // Package kontrolü
        if (!file.content.includes('package ')) {
            errors.push({
                severity: 'warning',
                file: file.path,
                line: 1,
                code: 'MISSING_PACKAGE',
                message: 'Package deklarasyonu bulunamadı.',
                autoFixable: true,
            });
        }

        // Parantez dengesi
        const openBraces = (file.content.match(/{/g) || []).length;
        const closeBraces = (file.content.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            errors.push({
                severity: 'error',
                file: file.path,
                code: 'BRACE_MISMATCH',
                message: `Süslü parantez dengesi bozuk: ${openBraces} açık, ${closeBraces} kapanış.`,
                autoFixable: false,
            });
        }

        // @EventHandler eksikliği
        if (file.content.includes('implements Listener')) {
            const methodPattern = /public void on\w+\(/g;
            let match;
            while ((match = methodPattern.exec(file.content)) !== null) {
                const beforeMethod = file.content.substring(0, match.index);
                const lastNewline = beforeMethod.lastIndexOf('\n');
                const linesBefore = beforeMethod.substring(lastNewline).trim();
                if (!linesBefore.includes('@EventHandler') && !beforeMethod.substring(Math.max(0, lastNewline - 100)).includes('@EventHandler')) {
                    // Basit kontrol — @EventHandler yoksa uyar
                    const lineNum = (beforeMethod.match(/\n/g) || []).length + 1;
                    errors.push({
                        severity: 'warning',
                        file: file.path,
                        line: lineNum,
                        code: 'MISSING_EVENT_HANDLER',
                        message: `Event handler metodunda @EventHandler annotation eksik olabilir.`,
                        suggestion: 'Metodun üzerine @EventHandler ekleyin.',
                        autoFixable: true,
                    });
                }
            }
        }

        return errors;
    }

    // ─── Katman 3: API Uyumluluk Kontrolü ───────────────────

    private _checkApiCompatibility(
        files: GeneratedFiles,
        mcVersion: string
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        // Bilinen deprecated API'ler (versiyon bazlı)
        const deprecatedApis: Array<{
            pattern: string;
            deprecatedSince: string;
            replacement: string;
        }> = [
                { pattern: 'Player.getHealth()', deprecatedSince: '1.6', replacement: 'Damageable.getHealth()' },
                { pattern: 'Enchantment.DAMAGE_ALL', deprecatedSince: '1.20.3', replacement: 'Enchantment.SHARPNESS' },
                { pattern: 'Enchantment.DIG_SPEED', deprecatedSince: '1.20.3', replacement: 'Enchantment.EFFICIENCY' },
                { pattern: 'Enchantment.DURABILITY', deprecatedSince: '1.20.3', replacement: 'Enchantment.UNBREAKING' },
                { pattern: 'Enchantment.PROTECTION_ENVIRONMENTAL', deprecatedSince: '1.20.3', replacement: 'Enchantment.PROTECTION' },
                { pattern: 'Enchantment.ARROW_DAMAGE', deprecatedSince: '1.20.3', replacement: 'Enchantment.POWER' },
                { pattern: 'Material.GRASS', deprecatedSince: '1.20.3', replacement: 'Material.SHORT_GRASS' },
                { pattern: 'Material.SIGN', deprecatedSince: '1.14', replacement: 'Material.OAK_SIGN' },
                { pattern: 'PlayerInteractEvent.getBlockFace()', deprecatedSince: '1.4', replacement: 'Use direct block face check' },
                { pattern: '.setMaxHealth(', deprecatedSince: '1.6', replacement: 'getAttribute(Attribute.GENERIC_MAX_HEALTH)' },
            ];

        for (const file of files.files) {
            if (file.language !== 'java') { continue; }

            for (const api of deprecatedApis) {
                if (file.content.includes(api.pattern.replace('()', '('))) {
                    const lineIdx = file.content.split('\n').findIndex(
                        l => l.includes(api.pattern.replace('()', ''))
                    );
                    errors.push({
                        severity: 'warning',
                        file: file.path,
                        line: lineIdx >= 0 ? lineIdx + 1 : undefined,
                        code: 'DEPRECATED_API',
                        message: `${api.pattern} — MC ${api.deprecatedSince}'den beri deprecated.`,
                        suggestion: `Yerine ${api.replacement} kullanın.`,
                        autoFixable: true,
                    });
                }
            }
        }

        return errors;
    }

    // ─── Katman 4: LLM Best Practice Kontrolü ───────────────

    private async _checkBestPractices(
        files: GeneratedFiles,
        card: DesignCard
    ): Promise<ValidationError[]> {
        const javaFiles = files.files.filter(f => f.language === 'java');
        if (javaFiles.length === 0) { return []; }

        const codeSnippet = javaFiles
            .map(f => `--- ${f.path} ---\n${f.content}`)
            .join('\n\n')
            .slice(0, 6000); // Token limiti için kısalt

        try {
            const response = await this.llm.generate(
                codeSnippet,
                `Sen bir Minecraft plugin kodu gözden geçiricisisin.
Aşağıdaki kodu incele ve SADECE önemli sorunları raporla.
Her sorunu şu JSON formatında ver:
[{"severity":"warning","file":"dosya.java","code":"KOD","message":"açıklama","suggestion":"öneri","autoFixable":false}]

Kontrol et:
- Null pointer riskleri (player null olabilir mi?)
- Thread safety (ana thread'de DB çağrısı var mı?)
- Bellek sızıntısı (listener unregister ediliyor mu?)
- Güvenlik (SQL injection, command injection)
- onDisable()'da temizlik yapılıyor mu?

Sorun yoksa boş array döndür: []
İLGİSİZ veya küçük stil sorunlarını RAPORLAMA.`,
                { temperature: 0.1, maxTokens: 2048 }
            );

            try {
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return parsed.map((e: any) => ({
                        severity: e.severity || 'info',
                        file: e.file || 'unknown',
                        code: e.code || 'LLM_CHECK',
                        message: e.message || '',
                        suggestion: e.suggestion,
                        autoFixable: e.autoFixable || false,
                    }));
                }
            } catch { /* parse error — skip */ }
        } catch { /* LLM error — skip silently */ }

        return [];
    }
}
