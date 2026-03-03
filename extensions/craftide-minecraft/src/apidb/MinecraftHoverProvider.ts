import * as vscode from 'vscode';
import { MinecraftApiDatabase } from './MinecraftApiDatabase';

/**
 * Minecraft API Hover Provider
 * 
 * Java dosyalarında Minecraft API sınıfları, metodları ve event'leri
 * üzerine gelindiğinde bilgi baloncuğu gösterir.
 * 
 * Özellikler:
 * - Sınıf açıklaması ve hiyerarşi
 * - Metod açıklaması, parametreler, dönüş tipi
 * - Deprecated uyarısı + alternatif önerisi
 * - Versiyon bilgisi (hangi MC versiyonunda eklendi)
 */
export class MinecraftHoverProvider implements vscode.HoverProvider {
    constructor(private readonly apiDb: MinecraftApiDatabase) { }

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position, /[a-zA-Z_]\w*/);
        if (!range) { return null; }

        const word = document.getText(range);

        // 1. Sınıf hover
        const cls = this.apiDb.getClass(word);
        if (cls) {
            const md = new vscode.MarkdownString();
            md.isTrusted = true;
            md.supportHtml = true;

            md.appendMarkdown(`### 📦 ${cls.simpleName}\n\n`);
            md.appendCodeblock(`${cls.fullName}`, 'java');
            if (cls.description) {
                md.appendMarkdown(`\n${cls.description}\n\n`);
            }
            if (cls.parentClass) {
                md.appendMarkdown(`↗️ **extends** \`${cls.parentClass}\`\n\n`);
            }
            if (cls.deprecatedSince) {
                md.appendMarkdown(`⚠️ **Deprecated** since MC ${cls.deprecatedSince}\n\n`);
            }

            // İlk 5 metodu göster
            const methods = cls.methods.slice(0, 5);
            if (methods.length > 0) {
                md.appendMarkdown(`---\n**Metodlar** (${cls.methods.length} toplam):\n\n`);
                for (const m of methods) {
                    const depIcon = m.deprecatedSince ? '~~' : '';
                    md.appendMarkdown(`- ${depIcon}\`${m.returnType}\` **${m.name}**(${m.parameters})${depIcon}`);
                    if (m.deprecatedSince) {
                        md.appendMarkdown(` ⚠️ _deprecated_`);
                    }
                    md.appendMarkdown(`\n`);
                }
                if (cls.methods.length > 5) {
                    md.appendMarkdown(`\n_...ve ${cls.methods.length - 5} daha_\n`);
                }
            }

            return new vscode.Hover(md, range);
        }

        // 2. Event hover
        const event = this.apiDb.getEvent(word);
        if (event) {
            const md = new vscode.MarkdownString();
            md.isTrusted = true;

            md.appendMarkdown(`### 🎯 ${event.name}\n\n`);
            md.appendCodeblock(`${event.package}.${event.name}`, 'java');
            if (event.description) {
                md.appendMarkdown(`\n${event.description}\n\n`);
            }
            md.appendMarkdown(event.cancellable
                ? `✅ **İptal edilebilir** — \`event.setCancelled(true)\`\n\n`
                : `❌ **İptal edilemez**\n\n`);
            if (event.deprecatedSince) {
                md.appendMarkdown(`⚠️ **Deprecated** since MC ${event.deprecatedSince}\n`);
                if (event.replacement) {
                    md.appendMarkdown(`💡 Alternatif: \`${event.replacement}\`\n`);
                }
            }

            return new vscode.Hover(md, range);
        }

        // 3. Metod hover — satırda sınıf.metod() pattern'ını bul
        const line = document.lineAt(position.line).text;
        const methodPattern = /(\w+)\.(\w+)\s*\(/g;
        let match;
        while ((match = methodPattern.exec(line)) !== null) {
            const methodName = match[2];
            if (methodName === word) {
                const className = match[1];
                const method = this.apiDb.getMethod(className, methodName);
                if (method) {
                    const md = new vscode.MarkdownString();
                    md.isTrusted = true;

                    md.appendMarkdown(`### ⚡ ${className}.${method.name}\n\n`);
                    md.appendCodeblock(
                        `${method.returnType} ${method.name}(${method.parameters})`,
                        'java'
                    );
                    md.appendMarkdown(`\n${method.description}\n\n`);

                    if (method.sinceVersion) {
                        md.appendMarkdown(`📅 MC ${method.sinceVersion}'den beri mevcut\n\n`);
                    }
                    if (method.deprecatedSince) {
                        md.appendMarkdown(`⚠️ **Deprecated** since MC ${method.deprecatedSince}\n\n`);
                        if (method.replacement) {
                            md.appendMarkdown(`💡 **Alternatif:** \`${method.replacement}\`\n`);
                        }
                    }

                    return new vscode.Hover(md, range);
                }
            }
        }

        // 4. Material hover
        const materials = this.apiDb.getAllMaterials();
        if (materials.includes(word)) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`### 🧱 Material.${word}\n\n`);
            md.appendMarkdown(`Minecraft blok/eşya türü.\n\n`);
            md.appendCodeblock(`Material.${word}`, 'java');
            return new vscode.Hover(md, range);
        }

        return null;
    }
}
