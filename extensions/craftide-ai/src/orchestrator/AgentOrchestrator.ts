import * as vscode from 'vscode';
import { LLMProvider } from '../llm/LLMProvider';
import { ArchitectAgent } from '../agents/ArchitectAgent';
import { CoderAgent } from '../agents/CoderAgent';
import { ValidatorAgent } from '../agents/ValidatorAgent';
import {
    PipelineState,
    DesignCard,
    GeneratedFiles,
    ValidationReport,
    ConversationMessage,
    ProjectContext,
} from '../types';

/**
 * CraftIDE Agent Orkestratörü
 * 
 * Triple-Layer AI Pipeline'ı yönetir:
 * Agent-A (Mimar) → Agent-B (Kodlayıcı) → Agent-C (Doğrulayıcı)
 * 
 * Hata döngüsü: Agent-C hata bulursa → Agent-B düzeltir → Agent-C tekrar kontrol eder
 * Maksimum retry sayısı yapılandırılabilir.
 */
export class AgentOrchestrator {
    private _state: PipelineState = PipelineState.IDLE;
    private _currentDesign: DesignCard | null = null;
    private _currentFiles: GeneratedFiles | null = null;
    private _currentValidation: ValidationReport | null = null;
    private _conversationHistory: ConversationMessage[] = [];
    private _maxRetries: number;

    // Event emitters
    private readonly _onStateChange = new vscode.EventEmitter<PipelineState>();
    private readonly _onDesignReady = new vscode.EventEmitter<DesignCard>();
    private readonly _onCodeGenerated = new vscode.EventEmitter<GeneratedFiles>();
    private readonly _onValidationResult = new vscode.EventEmitter<ValidationReport>();
    private readonly _onMessage = new vscode.EventEmitter<ConversationMessage>();
    private readonly _onError = new vscode.EventEmitter<Error>();

    public readonly onStateChange = this._onStateChange.event;
    public readonly onDesignReady = this._onDesignReady.event;
    public readonly onCodeGenerated = this._onCodeGenerated.event;
    public readonly onValidationResult = this._onValidationResult.event;
    public readonly onMessage = this._onMessage.event;
    public readonly onError = this._onError.event;

    private readonly architect: ArchitectAgent;
    private readonly coder: CoderAgent;
    private readonly validator: ValidatorAgent;

    constructor(private readonly llm: LLMProvider) {
        this.architect = new ArchitectAgent(llm);
        this.coder = new CoderAgent(llm);
        this.validator = new ValidatorAgent(llm);
        this._maxRetries = vscode.workspace
            .getConfiguration('craftide.ai')
            .get<number>('maxRetries', 3);
    }

    // ─── Pipeline Kontrolü ──────────────────────────────────

    get state(): PipelineState {
        return this._state;
    }

    get currentDesign(): DesignCard | null {
        return this._currentDesign;
    }

    get currentFiles(): GeneratedFiles | null {
        return this._currentFiles;
    }

    get conversationHistory(): ConversationMessage[] {
        return [...this._conversationHistory];
    }

    /**
     * Kullanıcı mesajını işle — Pipeline'ı başlat
     */
    async processUserMessage(
        message: string,
        context: ProjectContext
    ): Promise<void> {
        // Kullanıcı mesajını kaydet
        this._addMessage('user', message);

        try {
            // ─── ADIM 1: Agent-A — Tasarım ─────────────
            this._setState(PipelineState.DESIGNING);
            this._addMessage('system', '🧠 Agent-A tasarım oluşturuyor...');

            this._currentDesign = await this.architect.design(
                message,
                context.minecraftVersion,
                context.platform
            );

            // Tasarımı konuşma geçmişine ekle
            this._addMessage('assistant', JSON.stringify(this._currentDesign, null, 2), {
                agentType: 'architect',
                designCard: this._currentDesign,
            });

            // Kullanıcı onayı bekle
            this._setState(PipelineState.AWAITING_APPROVAL);
            this._onDesignReady.fire(this._currentDesign);

        } catch (error: any) {
            this._handleError(error);
        }
    }

    /**
     * Tasarım kartını onayla — Kod üretimine geç
     */
    async approveDesign(designCard?: DesignCard): Promise<void> {
        const design = designCard || this._currentDesign;
        if (!design) {
            this._handleError(new Error('Onaylanacak tasarım kartı yok.'));
            return;
        }

        this._currentDesign = design;

        try {
            // ─── ADIM 2: Agent-B — Kod Üretimi ─────────
            this._setState(PipelineState.CODING);
            this._addMessage('system', '⚡ Agent-B kod üretiyor...');

            this._currentFiles = await this.coder.generateCode(design);

            this._addMessage('assistant', `${this._currentFiles.files.length} dosya üretildi.`, {
                agentType: 'coder',
                generatedFiles: this._currentFiles,
            });

            this._onCodeGenerated.fire(this._currentFiles);

            // ─── ADIM 3: Agent-C — Doğrulama ───────────
            await this._runValidation(design, this._currentFiles, 0);

        } catch (error: any) {
            this._handleError(error);
        }
    }

    /**
     * Doğrulama + düzeltme döngüsü
     */
    private async _runValidation(
        design: DesignCard,
        files: GeneratedFiles,
        retryCount: number
    ): Promise<void> {
        this._setState(PipelineState.VALIDATING);
        this._addMessage('system', `✅ Agent-C doğrulama yapıyor... (deneme ${retryCount + 1}/${this._maxRetries + 1})`);

        this._currentValidation = await this.validator.validate(files, design);

        this._addMessage('assistant', this._formatValidationReport(this._currentValidation), {
            agentType: 'validator',
            validationReport: this._currentValidation,
        });

        this._onValidationResult.fire(this._currentValidation);

        if (this._currentValidation.status === 'fail' && retryCount < this._maxRetries) {
            // Hata var, düzeltme döngüsü
            this._setState(PipelineState.FIXING);
            this._addMessage('system', `🔧 Agent-B hataları düzeltiyor... (retry ${retryCount + 1})`);

            const errorMessages = this._currentValidation.errors
                .filter(e => e.severity === 'error')
                .map(e => `${e.file}: ${e.message}${e.suggestion ? ` (Öneri: ${e.suggestion})` : ''}`);

            this._currentFiles = await this.coder.fixCode(design, files, errorMessages);
            this._onCodeGenerated.fire(this._currentFiles);

            // Tekrar doğrula
            await this._runValidation(design, this._currentFiles, retryCount + 1);

        } else {
            // Başarılı veya max retry'a ulaşıldı
            this._setState(PipelineState.COMPLETE);

            if (this._currentValidation.status === 'fail') {
                this._addMessage('system',
                    `⚠️ Doğrulama ${this._maxRetries} denemeden sonra hâlâ başarısız. Kodu incelemeniz önerilir.`
                );
            } else {
                this._addMessage('system',
                    `✅ Plugin başarıyla oluşturuldu! (Kalite: ${this._currentValidation.metrics.codeQualityScore}/100)`
                );
            }
        }
    }

    /**
     * Pipeline'ı iptal et
     */
    cancel(): void {
        this._setState(PipelineState.IDLE);
        this._addMessage('system', '❌ Pipeline iptal edildi.');
    }

    /**
     * Pipeline'ı sıfırla
     */
    reset(): void {
        this._state = PipelineState.IDLE;
        this._currentDesign = null;
        this._currentFiles = null;
        this._currentValidation = null;
        this._conversationHistory = [];
    }

    // ─── Yardımcı Metodlar ──────────────────────────────────

    private _setState(state: PipelineState): void {
        this._state = state;
        this._onStateChange.fire(state);
    }

    private _addMessage(
        role: 'user' | 'assistant' | 'system',
        content: string,
        metadata?: ConversationMessage['metadata']
    ): void {
        const msg: ConversationMessage = {
            role,
            content,
            timestamp: Date.now(),
            metadata,
        };
        this._conversationHistory.push(msg);
        this._onMessage.fire(msg);
    }

    private _handleError(error: Error): void {
        this._setState(PipelineState.ERROR);
        this._addMessage('system', `❌ Hata: ${error.message}`);
        this._onError.fire(error);
    }

    private _formatValidationReport(report: ValidationReport): string {
        const icon = report.status === 'pass' ? '✅' : report.status === 'warn' ? '⚠️' : '❌';
        let text = `${icon} Doğrulama: ${report.status.toUpperCase()}\n`;
        text += `📊 Kalite Puanı: ${report.metrics.codeQualityScore}/100\n`;
        text += `📁 ${report.metrics.filesChecked} dosya kontrol edildi\n`;

        if (report.errors.length > 0) {
            text += '\n';
            for (const err of report.errors) {
                const icon = err.severity === 'error' ? '❌' : err.severity === 'warning' ? '⚠️' : 'ℹ️';
                text += `${icon} [${err.code}] ${err.file}${err.line ? `:${err.line}` : ''}\n`;
                text += `   ${err.message}\n`;
                if (err.suggestion) {
                    text += `   💡 ${err.suggestion}\n`;
                }
            }
        }

        return text;
    }

    dispose(): void {
        this._onStateChange.dispose();
        this._onDesignReady.dispose();
        this._onCodeGenerated.dispose();
        this._onValidationResult.dispose();
        this._onMessage.dispose();
        this._onError.dispose();
    }
}
