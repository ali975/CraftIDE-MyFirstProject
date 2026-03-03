/**
 * CraftIDE AI — Tip Tanımları
 * 
 * Tüm agent'lar, orkestratör ve hafıza sistemi
 * tarafından paylaşılan veri yapıları.
 */

// ─── Pipeline Durumu ─────────────────────────────────────

export enum PipelineState {
    IDLE = 'idle',
    DESIGNING = 'designing',
    AWAITING_APPROVAL = 'awaiting_approval',
    CODING = 'coding',
    VALIDATING = 'validating',
    FIXING = 'fixing',
    COMPLETE = 'complete',
    ERROR = 'error',
}

// ─── Tasarım Kartı (Agent-A Çıktısı) ────────────────────

export interface DesignCard {
    pluginName: string;
    description: string;
    targetPlatform: 'spigot' | 'paper' | 'fabric' | 'skript' | 'bedrock' | 'velocity' | 'bungeecord';
    minecraftVersion: string;

    architecture: {
        pattern: 'event-driven' | 'command-based' | 'scheduled' | 'hybrid';
        reasoning: string;
    };

    commands: CommandSpec[];
    events: EventSpec[];
    guis: GuiSpec[];
    config: Record<string, ConfigField>;
    dependencies: DependencySpec[];
    storage: StorageSpec;
    classes: ClassSpec[];
    estimatedComplexity: 'simple' | 'medium' | 'complex';
}

export interface CommandSpec {
    name: string;
    usage: string;
    permission: string;
    description: string;
    arguments: Array<{ name: string; type: string; required: boolean }>;
}

export interface EventSpec {
    eventClass: string;
    description: string;
    priority: 'LOWEST' | 'LOW' | 'NORMAL' | 'HIGH' | 'HIGHEST';
}

export interface GuiSpec {
    title: string;
    rows: number;
    items: Array<{ slot: number; material: string; displayName: string; action: string }>;
}

export interface ConfigField {
    type: 'string' | 'number' | 'boolean' | 'list' | 'section';
    default: any;
    description: string;
}

export interface DependencySpec {
    name: string;
    required: boolean;
    reason: string;
}

export interface StorageSpec {
    type: 'yaml' | 'sqlite' | 'mysql' | 'none';
    tables?: Array<{ name: string; columns: string[] }>;
}

export interface ClassSpec {
    name: string;
    type: 'main' | 'command' | 'listener' | 'gui' | 'manager' | 'util';
    description: string;
    relationships: string[];
}

// ─── Kod Üretimi (Agent-B Çıktısı) ──────────────────────

export interface GeneratedFiles {
    files: GeneratedFile[];
    buildInstructions: {
        tool: 'maven' | 'gradle' | 'none';
        command: string;
        outputPath: string;
    };
}

export interface GeneratedFile {
    path: string;
    content: string;
    language: 'java' | 'yaml' | 'xml' | 'json' | 'sk' | 'toml' | 'gradle' | 'properties';
    description: string;
    isNew: boolean;
}

// ─── Doğrulama (Agent-C Çıktısı) ────────────────────────

export interface ValidationReport {
    status: 'pass' | 'warn' | 'fail';
    errors: ValidationError[];
    metrics: {
        filesChecked: number;
        errorsFound: number;
        warningsFound: number;
        codeQualityScore: number;
    };
}

export interface ValidationError {
    severity: 'error' | 'warning' | 'info';
    file: string;
    line?: number;
    code: string;
    message: string;
    suggestion?: string;
    autoFixable: boolean;
}

// ─── Konuşma ve Hafıza ──────────────────────────────────

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    metadata?: {
        agentType?: 'architect' | 'coder' | 'validator';
        designCard?: DesignCard;
        generatedFiles?: GeneratedFiles;
        validationReport?: ValidationReport;
    };
}

export interface ProjectContext {
    name: string;
    platform: string;
    minecraftVersion: string;
    rootPath: string;
    existingFiles: string[];
    dependencies: string[];
}

// ─── LLM Sağlayıcı ─────────────────────────────────────

export type LLMProviderType = 'ollama' | 'openai' | 'anthropic' | 'google' | 'lmstudio';

export interface LLMConfig {
    provider: LLMProviderType;
    model: string;
    endpoint: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface ModelInfo {
    id: string;
    name: string;
    provider: LLMProviderType;
    contextWindow: number;
    supportsStreaming: boolean;
}
