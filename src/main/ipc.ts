import { ipcMain, dialog, MessageBoxOptions, OpenDialogOptions, SaveDialogOptions, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import * as https from 'https';
import { exec } from 'child_process';
import { ProjectScaffolder } from './scaffolder';
import {
    checkForAppUpdates,
    getUpdaterCapability,
    getUpdaterState,
    type LocalizedParams,
    type UpdaterCapability,
    type UpdaterState,
} from './updater';

type BuildRunResult = {
    success: boolean;
    output: string;
    error: string;
    command?: string;
};

type NlNode = {
    id: number;
    blockId: string;
    x: number;
    y: number;
    params: Record<string, string>;
};

type NlConnection = {
    from: number;
    to: number;
};

type ValidationEntry = {
    code: string;
    message: string;
};

type RendererOpenDialogRequest = {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: OpenDialogOptions['properties'];
};

type RendererSaveDialogRequest = {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
};

type GitHubReleaseAsset = {
    name: string;
    browser_download_url: string;
    size: number;
};

type GitHubRelease = {
    tag_name: string;
    html_url: string;
    published_at: string;
    body?: string;
    assets: GitHubReleaseAsset[];
};

type BuildVerificationResult = {
    channelLocked: boolean;
    owner: string;
    repo: string;
    appVersion: string;
    packaged: boolean;
    localAsarPath: string | null;
    localAsarSha256: string | null;
    status: 'development' | 'verified' | 'unverified' | 'unknown' | 'error';
    reason: string;
    reasonKey: string;
    reasonFallback: string;
    reasonParams: LocalizedParams;
    officialTag?: string;
    officialReleaseUrl?: string;
    checksumsAsset?: string;
};

type OfficialAssetKind = 'setup' | 'portable' | 'checksums' | 'blockmap' | 'latest-yml' | 'notes' | 'other';

type OfficialReleaseAssetInfo = {
    name: string;
    url: string;
    size: number;
    kind: OfficialAssetKind;
};

type UpdateAssetPreference = 'auto' | 'setup' | 'portable';

type OfficialUpdateStatus = {
    channelLocked: boolean;
    owner: string;
    repo: string;
    currentVersion: string;
    latestTag: string | null;
    latestVersion: string | null;
    updateAvailable: boolean;
    publishedAt: string | null;
    releaseUrl: string | null;
    assets: OfficialReleaseAssetInfo[];
    preferredAssetKind: 'setup' | 'portable';
    updaterCapability: UpdaterCapability;
    updaterState: UpdaterState;
    checkedAt: string;
    releaseCheckSucceeded: boolean;
    releaseErrorKey: string | null;
    releaseErrorFallback: string | null;
    releaseErrorParams: LocalizedParams;
};

const OFFICIAL_OWNER = 'ali975';
const OFFICIAL_REPO = 'CraftIDE-MyFirstProject';
const OFFICIAL_GITHUB_API = `https://api.github.com/repos/${OFFICIAL_OWNER}/${OFFICIAL_REPO}`;

function localized(key: string, fallback: string, params: LocalizedParams = {}): { key: string; fallback: string; params: LocalizedParams } {
    return { key, fallback, params };
}

function compareVersions(aRaw: string, bRaw: string): number {
    const a = String(aRaw || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
    const b = String(bRaw || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const av = a[i] || 0;
        const bv = b[i] || 0;
        if (av > bv) return 1;
        if (av < bv) return -1;
    }
    return 0;
}

async function fetchGitHubReleaseByTag(version: string): Promise<GitHubRelease | null> {
    const tagsToTry = [`v${version}`, version];
    for (const tag of tagsToTry) {
        const url = `${OFFICIAL_GITHUB_API}/releases/tags/${encodeURIComponent(tag)}`;
        const res = await httpGet(url, 'application/vnd.github+json');
        if (res.status >= 200 && res.status < 300) {
            return JSON.parse(res.body) as GitHubRelease;
        }
        if (res.status !== 404) {
            throw new Error(`GitHub release lookup failed (${res.status})`);
        }
    }
    return null;
}

async function fetchLatestOfficialRelease(): Promise<GitHubRelease> {
    const res = await httpGet(`${OFFICIAL_GITHUB_API}/releases/latest`, 'application/vnd.github+json');
    if (res.status < 200 || res.status >= 300) throw new Error(`GitHub latest release lookup failed (${res.status})`);
    return JSON.parse(res.body) as GitHubRelease;
}

function parseSha256Sums(text: string): Map<string, string> {
    const map = new Map<string, string>();
    for (const rawLine of String(text || '').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const m = line.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/);
        if (!m) continue;
        const hash = m[1].toLowerCase();
        const name = m[2].trim();
        map.set(name, hash);
        map.set(path.basename(name), hash);
    }
    return map;
}

function getLocalAsarPath(): string | null {
    if (!app.isPackaged) return null;
    const candidate = path.join(process.resourcesPath, 'app.asar');
    return fs.existsSync(candidate) ? candidate : null;
}

function isPortablePackagedBuild(): boolean {
    return app.isPackaged && Boolean(process.env.PORTABLE_EXECUTABLE_DIR);
}

async function httpGet(url: string, accept: string): Promise<{ status: number; body: string }> {
    return await new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                Accept: accept,
                'User-Agent': `CraftIDE/${app.getVersion()}`,
            },
        }, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            res.on('end', () => {
                resolve({
                    status: res.statusCode || 0,
                    body: Buffer.concat(chunks).toString('utf-8'),
                });
            });
        });
        req.on('error', (err) => reject(err));
    });
}

function classifyOfficialAsset(nameRaw: string): OfficialAssetKind {
    const name = String(nameRaw || '');
    if (/setup-.*\.exe$/i.test(name)) return 'setup';
    if (/^craftide-.*\.exe$/i.test(name)) return 'portable';
    if (/sha256sums/i.test(name) && /\.txt$/i.test(name)) return 'checksums';
    if (/latest\.yml$/i.test(name)) return 'latest-yml';
    if (/\.blockmap$/i.test(name)) return 'blockmap';
    if (/release.?notes/i.test(name) || /\.md$/i.test(name) || /\.txt$/i.test(name)) return 'notes';
    return 'other';
}

function resolvePreferredAssetKind(preferenceRaw: string, capability: UpdaterCapability): 'setup' | 'portable' {
    const preference = String(preferenceRaw || 'auto').toLowerCase();
    if (preference === 'setup' || preference === 'portable') return preference;
    return capability.isPortable ? 'portable' : 'setup';
}

function createVerificationResult(
    base: BuildVerificationResult,
    patch: Partial<BuildVerificationResult>,
    reasonInfo: { key: string; fallback: string; params?: LocalizedParams },
): BuildVerificationResult {
    const params = reasonInfo.params || {};
    let reasonText = reasonInfo.fallback;
    for (const [name, value] of Object.entries(params)) {
        reasonText = reasonText.replaceAll(`{${name}}`, String(value));
    }
    return {
        ...base,
        ...patch,
        reason: reasonText,
        reasonKey: reasonInfo.key,
        reasonFallback: reasonInfo.fallback,
        reasonParams: params,
    };
}

async function verifyOfficialBuild(): Promise<BuildVerificationResult> {
    const appVersion = app.getVersion();
    const packaged = app.isPackaged;
    const base: BuildVerificationResult = {
        channelLocked: true,
        owner: OFFICIAL_OWNER,
        repo: OFFICIAL_REPO,
        appVersion,
        packaged,
        localAsarPath: null,
        localAsarSha256: null,
        status: 'unknown',
        reason: 'Verification not executed.',
        reasonKey: 'ui.official.verifyNotRun',
        reasonFallback: 'Verification not executed.',
        reasonParams: {},
    };

    if (!packaged) {
        return createVerificationResult(base, {
            ...base,
            status: 'development',
        }, localized('ui.official.verifyDevelopment', 'Running in development mode.'));
    }

    if (isPortablePackagedBuild()) {
        return createVerificationResult(base, {
            ...base,
            status: 'unknown',
        }, localized('ui.official.verifyPortableBlocked', 'Portable builds are not eligible for integrity verification. Use the installer build.'));
    }

    const localAsarPath = getLocalAsarPath();
    if (!localAsarPath) {
        return createVerificationResult(base, {
            ...base,
            status: 'unknown',
        }, localized('ui.official.verifyLocalAsarMissing', 'Local app.asar is not available for this build.'));
    }
    let localAsarSha256: string;
    try {
        localAsarSha256 = hashFileSha256(localAsarPath);
    } catch (error) {
        return createVerificationResult(base, {
            ...base,
            localAsarPath,
            status: 'unknown',
        }, localized(
            'ui.official.verifyLocalAsarReadError',
            'Local app.asar could not be read: {error}',
            { error: (error as Error).message || String(error) },
        ));
    }
    const release = await fetchGitHubReleaseByTag(appVersion);
    if (!release) {
        return createVerificationResult(base, {
            ...base,
            localAsarPath,
            localAsarSha256,
            status: 'unknown',
        }, localized('ui.official.verifyReleaseMissing', 'No official GitHub release found for this version.'));
    }

    const checksumsAsset = release.assets.find((a) => /sha256sums/i.test(a.name) && /\.txt$/i.test(a.name));
    if (!checksumsAsset) {
        return createVerificationResult(base, {
            ...base,
            localAsarPath,
            localAsarSha256,
            officialTag: release.tag_name,
            officialReleaseUrl: release.html_url,
            status: 'unknown',
        }, localized('ui.official.verifyChecksumsMissing', 'Release checksum asset missing.'));
    }

    const checksumResponse = await httpGet(checksumsAsset.browser_download_url, 'text/plain');
    if (checksumResponse.status < 200 || checksumResponse.status >= 300) {
        return createVerificationResult(base, {
            ...base,
            localAsarPath,
            localAsarSha256,
            officialTag: release.tag_name,
            officialReleaseUrl: release.html_url,
            checksumsAsset: checksumsAsset.name,
            status: 'unknown',
        }, localized(
            'ui.official.verifyChecksumsFetchError',
            'Checksum file fetch failed ({status}).',
            { status: checksumResponse.status },
        ));
    }

    const checksumText = checksumResponse.body;
    const checksums = parseSha256Sums(checksumText);
    const expectedAsar = checksums.get('app.asar');
    if (!expectedAsar) {
        return createVerificationResult(base, {
            ...base,
            localAsarPath,
            localAsarSha256,
            officialTag: release.tag_name,
            officialReleaseUrl: release.html_url,
            checksumsAsset: checksumsAsset.name,
            status: 'unknown',
        }, localized('ui.official.verifyChecksumsAsarMissing', 'app.asar hash not found in checksum file.'));
    }

    const verified = expectedAsar === localAsarSha256;
    return createVerificationResult(base, {
        ...base,
        localAsarPath,
        localAsarSha256,
        officialTag: release.tag_name,
        officialReleaseUrl: release.html_url,
        checksumsAsset: checksumsAsset.name,
        status: verified ? 'verified' : 'unverified',
    }, verified
        ? localized('ui.official.verifyMatched', 'Local app.asar hash matches official release checksums.')
        : localized('ui.official.verifyMismatch', 'Local app.asar hash does not match official release checksums.'));
}

async function getOfficialUpdateStatus(
    preferenceRaw: string = 'auto',
    opts: { triggerInAppCheck?: boolean } = {},
): Promise<OfficialUpdateStatus> {
    const currentVersion = app.getVersion();
    const updaterCapability = getUpdaterCapability();
    let updaterState = getUpdaterState();

    if (opts.triggerInAppCheck && updaterCapability.supportsInApp) {
        try {
            updaterState = await checkForAppUpdates(true);
        } catch {
            updaterState = getUpdaterState();
        }
    }

    const preferredAssetKind = resolvePreferredAssetKind(preferenceRaw, updaterCapability);
    const base: OfficialUpdateStatus = {
        channelLocked: true,
        owner: OFFICIAL_OWNER,
        repo: OFFICIAL_REPO,
        currentVersion,
        latestTag: null,
        latestVersion: null,
        updateAvailable: false,
        publishedAt: null,
        releaseUrl: null,
        assets: [],
        preferredAssetKind,
        updaterCapability,
        updaterState,
        checkedAt: new Date().toISOString(),
        releaseCheckSucceeded: false,
        releaseErrorKey: null,
        releaseErrorFallback: null,
        releaseErrorParams: {},
    };

    try {
        const latest = await fetchLatestOfficialRelease();
        const latestVersion = String(latest.tag_name || '').replace(/^v/i, '') || null;
        const assets = (latest.assets || []).map((asset) => ({
            name: asset.name,
            url: asset.browser_download_url,
            size: asset.size,
            kind: classifyOfficialAsset(asset.name),
        }));

        return {
            ...base,
            latestTag: latest.tag_name || null,
            latestVersion,
            updateAvailable: latestVersion ? compareVersions(latestVersion, currentVersion) > 0 : false,
            publishedAt: latest.published_at || null,
            releaseUrl: latest.html_url || null,
            assets,
            checkedAt: new Date().toISOString(),
            releaseCheckSucceeded: true,
        };
    } catch (error) {
        return {
            ...base,
            checkedAt: new Date().toISOString(),
            releaseErrorKey: 'ui.official.releaseCheckError',
            releaseErrorFallback: 'Official release check failed: {error}',
            releaseErrorParams: {
                error: (error as Error).message || String(error),
            },
        };
    }
}

function normalizeMode(rawMode: string): 'plugin' | 'fabric' | 'forge' | 'skript' {
    const mode = String(rawMode || '').toLowerCase();
    if (mode === 'paper' || mode === 'spigot' || mode === 'bukkit' || mode === 'plugin') return 'plugin';
    if (mode === 'fabric') return 'fabric';
    if (mode === 'forge') return 'forge';
    return 'skript';
}

function extractCompileErrors(text: string): string[] {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const picked: string[] = [];
    for (const line of lines) {
        if (/\[ERROR\]/i.test(line) || /\berror:/i.test(line) || /cannot find symbol/i.test(line) || /exception/i.test(line)) {
            picked.push(line);
        }
    }
    return picked.slice(0, 50);
}

async function runBuild(projectPath: string): Promise<BuildRunResult> {
    const hasMaven = fs.existsSync(path.join(projectPath, 'pom.xml'));
    const hasGradle = fs.existsSync(path.join(projectPath, 'build.gradle'));

    let command = '';
    if (hasMaven) {
        command = 'mvn clean package -q';
    } else if (hasGradle) {
        command = process.platform === 'win32' ? 'gradlew.bat build' : './gradlew build';
    } else {
        return { success: false, output: '', error: 'No build file found (pom.xml or build.gradle)' };
    }

    return new Promise((resolve) => {
        exec(command, { cwd: projectPath }, (error: Error | null, stdout: string, stderr: string) => {
            if (error) {
                resolve({
                    success: false,
                    output: stdout || '',
                    error: stderr || error.message || 'Unknown build error',
                    command,
                });
                return;
            }
            resolve({ success: true, output: stdout || '', error: '', command });
        });
    });
}

function localNlGraph(textRaw: string, platformRaw: string): { nodes: NlNode[]; connections: NlConnection[]; warnings: string[] } {
    const platform = normalizeMode(platformRaw);
    const text = String(textRaw || '').toLowerCase();
    const warnings: string[] = [];

    let eventBlock = '';
    if (platform === 'plugin') {
        if (text.includes('command') || text.includes('/') || text.includes('komut')) eventBlock = 'PlayerCommand';
        else if (text.includes('break') || text.includes('kır')) eventBlock = 'BlockBreak';
        else eventBlock = 'PlayerJoin';
    } else if (platform === 'fabric') {
        eventBlock = text.includes('break') || text.includes('kır') ? 'FabricBlockBreak' : 'FabricPlayerJoin';
    } else if (platform === 'forge') {
        eventBlock = text.includes('break') || text.includes('kır') ? 'ForgeBreak' : 'ForgePlayerLogin';
    } else {
        eventBlock = text.includes('command') || text.includes('/') || text.includes('komut') ? 'SkCommand' : 'SkJoin';
    }

    const nodes: NlNode[] = [];
    nodes.push({
        id: 1,
        blockId: eventBlock,
        x: 100,
        y: 120,
        params: platform === 'plugin' && eventBlock === 'PlayerCommand'
            ? { command: text.match(/\/[a-z0-9_:-]+/i)?.[0] || '/command' }
            : platform === 'skript' && eventBlock === 'SkCommand'
                ? { komut: text.match(/\/[a-z0-9_:-]+/i)?.[0] || '/command' }
                : {},
    });

    let nextId = 2;
    const action = (blockId: string, params: Record<string, string>, y: number): NlNode => ({
        id: nextId++,
        blockId,
        x: 360 + (nextId - 3) * 230,
        y,
        params,
    });

    if (platform === 'plugin') {
        if (text.includes('/spawn') || text.includes('spawn') || text.includes('teleport') || text.includes('ışınla')) {
            if (eventBlock !== 'PlayerCommand') {
                warnings.push('Teleport flow usually works better with a command event.');
            }
            nodes.push(action('CommandEquals', { cmd: '/spawn' }, 80));
            nodes.push(action('Teleport', { x: '0', y: '80', z: '0' }, 80));
            nodes.push(action('SendMessage', { mesaj: '&aTeleported to spawn.' }, 200));
        } else if (text.includes('reward') || text.includes('ödül') || text.includes('diamond') || text.includes('elmas')) {
            nodes.push(action('GiveItem', { material: 'DIAMOND', adet: '1' }, 80));
            nodes.push(action('SendMessage', { mesaj: '&aReward granted.' }, 200));
        } else if (text.includes('broadcast') || text.includes('duyuru')) {
            nodes.push(action('Broadcast', { mesaj: '&eAnnouncement' }, 120));
        } else {
            nodes.push(action('SendMessage', { mesaj: '&aAction completed.' }, 120));
        }
    } else if (platform === 'fabric') {
        if (text.includes('teleport') || text.includes('spawn')) nodes.push(action('FabricTeleport', { x: '0', y: '100', z: '0' }, 80));
        if (text.includes('reward') || text.includes('ödül') || text.includes('diamond')) nodes.push(action('FabricGiveItem', { item: 'minecraft:diamond', adet: '1' }, 200));
        nodes.push(action('FabricSendMsg', { mesaj: 'Action completed.' }, 120));
    } else if (platform === 'forge') {
        if (text.includes('teleport') || text.includes('spawn')) nodes.push(action('ForgeTeleport', { x: '0', y: '100', z: '0' }, 80));
        if (text.includes('cancel') || text.includes('iptal')) nodes.push(action('ForgeCancelEvent', {}, 200));
        nodes.push(action('ForgeSendMsg', { mesaj: 'Action completed.' }, 120));
    } else {
        if (text.includes('teleport') || text.includes('spawn')) nodes.push(action('SkTeleport', { x: '0', y: '80', z: '0' }, 80));
        nodes.push(action('SkSendMsg', { mesaj: '&aAction completed.' }, 120));
    }

    const connections: NlConnection[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({ from: nodes[i].id, to: nodes[i + 1].id });
    }

    return { nodes, connections, warnings };
}

function validateGraphShape(graph: { mode?: string; nodes?: NlNode[]; connections?: NlConnection[] }): { errors: ValidationEntry[]; warnings: ValidationEntry[]; autoFixes: Array<{ nodeId: number; field: string; value: string }> } {
    const errors: ValidationEntry[] = [];
    const warnings: ValidationEntry[] = [];
    const autoFixes: Array<{ nodeId: number; field: string; value: string }> = [];

    const mode = normalizeMode(graph.mode || 'plugin');
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const connections = Array.isArray(graph.connections) ? graph.connections : [];
    const byId = new Set(nodes.map((n) => n.id));

    if (!nodes.length) {
        errors.push({ code: 'EMPTY_GRAPH', message: 'No blocks on canvas.' });
        return { errors, warnings, autoFixes };
    }

    const hasEvent = nodes.some((n) => /^(Player|Block|Entity|Inventory|Server|GUI|Fabric|Forge|Sk)/.test(String(n.blockId || '')));
    if (!hasEvent) errors.push({ code: 'MISSING_EVENT', message: 'Add at least one event block.' });

    for (const c of connections) {
        if (!byId.has(c.from) || !byId.has(c.to)) errors.push({ code: 'BROKEN_CONNECTION', message: `Broken connection ${c.from} -> ${c.to}` });
        if (c.from === c.to) errors.push({ code: 'SELF_CONNECTION', message: `Self connection on node ${c.from}` });
    }

    for (const n of nodes) {
        if (n.blockId === 'PlayerCommand') {
            const cmd = String(n.params?.command || '').trim();
            if (!cmd) {
                errors.push({ code: 'MISSING_COMMAND', message: 'PlayerCommand requires a command value.' });
                autoFixes.push({ nodeId: n.id, field: 'command', value: '/command' });
            } else if (!cmd.startsWith('/')) {
                warnings.push({ code: 'COMMAND_PREFIX', message: 'PlayerCommand should start with /' });
                autoFixes.push({ nodeId: n.id, field: 'command', value: '/' + cmd });
            }
        }
        if (n.blockId === 'SkCommand') {
            const cmd = String(n.params?.komut || '').trim();
            if (!cmd) {
                errors.push({ code: 'MISSING_COMMAND', message: 'SkCommand requires a command value.' });
                autoFixes.push({ nodeId: n.id, field: 'komut', value: '/command' });
            } else if (!cmd.startsWith('/')) {
                warnings.push({ code: 'COMMAND_PREFIX', message: 'SkCommand should start with /' });
                autoFixes.push({ nodeId: n.id, field: 'komut', value: '/' + cmd });
            }
        }
        if (/Teleport$/.test(String(n.blockId || ''))) {
            const x = Number(n.params?.x);
            const y = Number(n.params?.y);
            const z = Number(n.params?.z);
            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
                errors.push({ code: 'INVALID_COORDS', message: `${n.blockId} requires numeric x/y/z values.` });
                autoFixes.push({ nodeId: n.id, field: 'x', value: '0' });
                autoFixes.push({ nodeId: n.id, field: 'y', value: mode === 'plugin' || mode === 'skript' ? '80' : '100' });
                autoFixes.push({ nodeId: n.id, field: 'z', value: '0' });
            }
        }
        if (n.blockId === 'GiveItem') {
            const mat = String(n.params?.material || '');
            if (mat && !/^[A-Z0-9_]+$/.test(mat)) warnings.push({ code: 'MATERIAL_CASE', message: 'GiveItem material should be uppercase enum (e.g. DIAMOND).' });
        }
        if (n.blockId === 'FabricGiveItem' || n.blockId === 'ForgeGiveItem') {
            const item = String(n.params?.item || '');
            if (item && !item.includes(':')) warnings.push({ code: 'ITEM_NAMESPACE', message: `${n.blockId} item should include namespace (minecraft:diamond).` });
        }
    }

    return { errors, warnings, autoFixes };
}

function findJarArtifact(projectPath: string): string | null {
    const mavenDir = path.join(projectPath, 'target');
    const gradleDir = path.join(projectPath, 'build', 'libs');
    const dir = fs.existsSync(mavenDir) ? mavenDir : fs.existsSync(gradleDir) ? gradleDir : '';
    if (!dir) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.jar') && !e.name.includes('-sources') && !e.name.includes('-original'))
        .map((e) => path.join(dir, e.name));
    if (!entries.length) return null;
    entries.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    return entries[0];
}

function findSkriptArtifact(projectPath: string): string | null {
    const entries = fs.readdirSync(projectPath, { withFileTypes: true });
    const skripts = entries.filter((e) => e.isFile() && e.name.endsWith('.sk')).map((e) => path.join(projectPath, e.name));
    return skripts.length ? skripts[0] : null;
}

function hashFileSha256(filePath: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

async function zipFiles(files: string[], destinationZip: string): Promise<{ success: boolean; warning?: string }> {
    if (!files.length) return { success: false, warning: 'No files to zip.' };

    if (process.platform === 'win32') {
        const paths = files.map((f) => `'${f.replace(/'/g, "''")}'`).join(',');
        const script = `Compress-Archive -Path ${paths} -DestinationPath '${destinationZip.replace(/'/g, "''")}' -Force`;
        return new Promise((resolve) => {
            exec(`powershell -NoProfile -Command "${script}"`, (err) => {
                if (err) resolve({ success: false, warning: 'Compress-Archive failed. Returning raw files instead.' });
                else resolve({ success: true });
            });
        });
    }

    return new Promise((resolve) => {
        const args = files.map((f) => `"${f}"`).join(' ');
        exec(`zip -j "${destinationZip}" ${args}`, (err) => {
            if (err) resolve({ success: false, warning: 'zip command failed. Returning raw files instead.' });
            else resolve({ success: true });
        });
    });
}

/**
 * CraftIDE IPC Handlers
 * Renderer <-> Main communication channels
 */
export function registerIpcHandlers(): void {
    const scaffolder = new ProjectScaffolder();
    const defaultOpenFileFilters = [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Java', extensions: ['java'] },
        { name: 'Skript', extensions: ['sk'] },
        { name: 'YAML', extensions: ['yml', 'yaml'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'XML', extensions: ['xml'] },
    ];

    ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            return entries.map((e) => ({
                name: e.name,
                isDirectory: e.isDirectory(),
                path: path.join(dirPath, e.name),
                ext: path.extname(e.name).toLowerCase(),
            }));
        } catch {
            return [];
        }
    });

    ipcMain.handle('fs:readFile', async (_, filePath: string) => {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch {
            return null;
        }
    });

    ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        } catch {
            return false;
        }
    });

    ipcMain.handle('fs:exists', async (_, filePath: string) => fs.existsSync(filePath));

    ipcMain.handle('fs:stat', async (_, filePath: string) => {
        try {
            const stat = fs.statSync(filePath);
            return {
                isDirectory: stat.isDirectory(),
                isFile: stat.isFile(),
                size: stat.size,
                modified: stat.mtime.toISOString(),
            };
        } catch {
            return null;
        }
    });

    ipcMain.handle('fs:createDir', async (_, dirPath: string) => {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            return true;
        } catch {
            return false;
        }
    });

    ipcMain.handle('fs:createFile', async (_, filePath: string, content?: string) => {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            if (fs.existsSync(filePath)) return { success: false, error: 'File already exists' };
            fs.writeFileSync(filePath, content || '', 'utf-8');
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    });

    ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
        try {
            if (fs.existsSync(newPath)) return { success: false, error: 'Target already exists' };
            fs.renameSync(oldPath, newPath);
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    });

    ipcMain.handle('fs:delete', async (_, targetPath: string) => {
        try {
            const stat = fs.statSync(targetPath);
            if (stat.isDirectory()) fs.rmSync(targetPath, { recursive: true, force: true });
            else fs.unlinkSync(targetPath);
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    });

    ipcMain.handle('fs:copyPath', async (_, filePath: string) => {
        const { clipboard } = require('electron') as { clipboard: { writeText: (value: string) => void } };
        clipboard.writeText(filePath);
        return true;
    });

    ipcMain.handle('fs:openInExplorer', async (_, filePath: string) => {
        const { shell } = require('electron') as { shell: { showItemInFolder: (value: string) => void } };
        shell.showItemInFolder(filePath);
        return true;
    });

    ipcMain.handle('dialog:openFolder', async (_, request?: RendererOpenDialogRequest) => {
        const result = await dialog.showOpenDialog({
            properties: request?.properties?.length ? request.properties : ['openDirectory'],
            title: request?.title || 'Select Project Folder',
            defaultPath: request?.defaultPath,
        });
        return !result.canceled && result.filePaths.length > 0 ? result.filePaths[0] : null;
    });

    ipcMain.handle('dialog:openFile', async (_, request?: RendererOpenDialogRequest) => {
        const options: OpenDialogOptions = {
            properties: request?.properties?.length ? request.properties : ['openFile'],
            title: request?.title || 'Open File',
            defaultPath: request?.defaultPath,
            filters: request?.filters?.length ? request.filters : defaultOpenFileFilters,
        };
        const result = await dialog.showOpenDialog(options);
        return !result.canceled && result.filePaths.length > 0 ? result.filePaths[0] : null;
    });

    ipcMain.handle('dialog:saveFile', async (_, request?: string | RendererSaveDialogRequest) => {
        const options: SaveDialogOptions = typeof request === 'string'
            ? {
                title: 'Save As',
                defaultPath: request,
            }
            : {
                title: request?.title || 'Save As',
                defaultPath: request?.defaultPath,
                filters: request?.filters,
            };
        const result = await dialog.showSaveDialog(options);
        return result.canceled ? null : result.filePath;
    });

    ipcMain.handle('dialog:showMessage', async (_, options: MessageBoxOptions) => {
        const result = await dialog.showMessageBox(options);
        return result.response;
    });

    ipcMain.handle('project:scaffold', async (_, config: {
        platform: string;
        mcVersion: string;
        name: string;
        packageName: string;
        targetDir: string;
        dependencies: string[];
    }) => {
        try {
            await scaffolder.createProject(config);
            return { success: true, path: path.join(config.targetDir, config.name) };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    });

    ipcMain.handle('build:run', async (_, projectPath: string) => runBuild(projectPath));

    ipcMain.handle('build:guaranteed', async (_, request: { projectPath: string; platform?: string; attempt?: number }) => {
        const attempt = Number(request?.attempt || 1);
        const build = await runBuild(request.projectPath);
        const mergedLog = [build.output || '', build.error || ''].join('\n');
        return {
            attempt,
            success: build.success,
            status: build.success ? 'success' : 'failed',
            output: build.output,
            error: build.error,
            compileErrors: extractCompileErrors(mergedLog),
            done: build.success,
        };
    });

    ipcMain.handle('intent:generatePlan', async (_, request: { prompt: string; platformTargets?: string[]; locale?: string }) => {
        const prompt = String(request?.prompt || '');
        const mode = normalizeMode(request?.platformTargets?.[0] || 'plugin');
        const lower = prompt.toLowerCase();
        const cards: Array<{ title: string; detail: string }> = [];
        cards.push({ title: 'Mode', detail: `Target platform: ${mode}` });
        if (lower.includes('spawn') || lower.includes('/spawn') || lower.includes('warp')) cards.push({ title: 'Command Flow', detail: 'Build command-triggered teleport flow.' });
        if (lower.includes('reward') || lower.includes('ödül') || lower.includes('diamond') || lower.includes('elmas')) cards.push({ title: 'Reward Flow', detail: 'Add item/economy reward action blocks.' });
        if (lower.includes('join') || lower.includes('giriş') || lower.includes('welcome')) cards.push({ title: 'Event Flow', detail: 'Use join event as trigger.' });
        if (cards.length === 1) cards.push({ title: 'Default Flow', detail: 'Create one event + one action graph from the prompt.' });
        return {
            planCards: cards,
            requiredInputs: [],
            riskHints: ['Check command permissions and server version compatibility.'],
        };
    });

    ipcMain.handle('vb:nl2graph', async (_, request: { text: string; platform?: string; strictMode?: boolean }) => {
        const mode = normalizeMode(request?.platform || 'plugin');
        const graph = localNlGraph(String(request?.text || ''), mode);
        return {
            mode,
            nodes: graph.nodes,
            connections: graph.connections,
            warnings: graph.warnings,
            strictMode: !!request?.strictMode,
        };
    });

    ipcMain.handle('validate:graph', async (_, request: { graph?: { mode?: string; nodes?: NlNode[]; connections?: NlConnection[] }; platform?: string; mcVersion?: string }) => {
        const graph = request?.graph || { mode: normalizeMode(request?.platform || 'plugin'), nodes: [], connections: [] };
        const validation = validateGraphShape(graph);
        return {
            mode: normalizeMode(graph.mode || request?.platform || 'plugin'),
            mcVersion: request?.mcVersion || '1.21.4',
            errors: validation.errors,
            warnings: validation.warnings,
            autoFixes: validation.autoFixes,
        };
    });

    ipcMain.handle('scenario:run', async (_, request: { scenarios?: Array<{ name?: string; command?: string; expect?: string; timeoutMs?: number }> }) => {
        const scenarios = Array.isArray(request?.scenarios) ? request.scenarios : [];
        const normalized = scenarios
            .filter((s) => !!s && typeof s === 'object')
            .map((s) => ({
                name: String(s.name || 'Unnamed Scenario'),
                command: String(s.command || ''),
                expect: String(s.expect || ''),
                timeoutMs: Number(s.timeoutMs || 8000),
            }))
            .filter((s) => s.command.length > 0 && s.expect.length > 0);
        return {
            success: true,
            queued: normalized.length,
            scenarios: normalized,
        };
    });

    ipcMain.handle('release:oneClick', async (_, request: { projectPath: string; targetType?: 'jar' | 'sk' | 'zip'; includeDocs?: boolean }) => {
        try {
            const projectPath = request.projectPath;
            const targetType = (request.targetType || 'jar').toLowerCase();
            const includeDocs = !!request.includeDocs;
            const outputFiles: string[] = [];
            const checksums: Array<{ file: string; sha256: string }> = [];
            let warning = '';

            if (!projectPath || !fs.existsSync(projectPath)) {
                return { success: false, error: 'Project path does not exist.' };
            }

            const hasBuild = fs.existsSync(path.join(projectPath, 'pom.xml')) || fs.existsSync(path.join(projectPath, 'build.gradle'));
            if ((targetType === 'jar' || targetType === 'zip') && hasBuild) {
                const build = await runBuild(projectPath);
                if (!build.success) {
                    return { success: false, error: build.error || 'Build failed before release packaging.' };
                }
            }

            const releaseDir = path.join(projectPath, 'release');
            fs.mkdirSync(releaseDir, { recursive: true });
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const projectName = path.basename(projectPath);
            const baseName = `${projectName}-${stamp}`;

            let artifactPath: string | null = null;
            if (targetType === 'sk') artifactPath = findSkriptArtifact(projectPath);
            else artifactPath = findJarArtifact(projectPath);
            if (!artifactPath && targetType === 'zip') artifactPath = findJarArtifact(projectPath) || findSkriptArtifact(projectPath);
            if (!artifactPath) return { success: false, error: 'No release artifact found (.jar or .sk).' };

            const artifactExt = path.extname(artifactPath) || '.bin';
            const copiedArtifact = path.join(releaseDir, `${baseName}${artifactExt}`);
            fs.copyFileSync(artifactPath, copiedArtifact);
            outputFiles.push(copiedArtifact);

            if (includeDocs) {
                const notesPath = path.join(releaseDir, `${baseName}-notes.txt`);
                const notes = [
                    `Project: ${projectName}`,
                    `Generated: ${new Date().toISOString()}`,
                    `Artifact: ${path.basename(copiedArtifact)}`,
                    `Target: ${targetType}`,
                    '',
                    'Auto-generated by CraftIDE release:oneClick',
                ].join('\n');
                fs.writeFileSync(notesPath, notes, 'utf-8');
                outputFiles.push(notesPath);
            }

            if (targetType === 'zip') {
                const zipPath = path.join(releaseDir, `${baseName}.zip`);
                const zipResult = await zipFiles(outputFiles, zipPath);
                if (zipResult.success) {
                    outputFiles.length = 0;
                    outputFiles.push(zipPath);
                } else if (zipResult.warning) {
                    warning = zipResult.warning;
                }
            }

            for (const f of outputFiles) {
                checksums.push({ file: f, sha256: hashFileSha256(f) });
            }

            return {
                success: true,
                outputFiles,
                checksum: checksums,
                warning,
            };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    });

    ipcMain.handle('search:files', async (_, searchPath: string, query: string) => {
        const results: Array<{ file: string; line: number; preview: string }> = [];
        if (!query || query.length < 2 || !searchPath) return results;

        const ignoreDirs = new Set(['.git', 'node_modules', 'target', 'out', 'dist', 'release', '.idea', 'build']);
        const textExts = new Set(['.java', '.sk', '.yml', '.yaml', '.json', '.xml', '.properties', '.md', '.txt', '.gradle', '.js', '.ts', '.css', '.html', '.py', '.sh', '.bat', '.ps1', '.toml', '.cfg', '.conf']);

        function searchDir(dir: string): void {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (results.length >= 100) return;
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (!ignoreDirs.has(entry.name) && !entry.name.startsWith('.')) searchDir(fullPath);
                    } else {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (textExts.has(ext)) {
                            try {
                                const content = fs.readFileSync(fullPath, 'utf-8');
                                const lines = content.split('\n');
                                const lowerQuery = query.toLowerCase();
                                for (let i = 0; i < lines.length; i++) {
                                    if (lines[i].toLowerCase().includes(lowerQuery)) {
                                        results.push({ file: fullPath, line: i + 1, preview: lines[i].trim().substring(0, 200) });
                                        if (results.length >= 100) return;
                                    }
                                }
                            } catch {
                                /* ignore unreadable files */
                            }
                        }
                    }
                }
            } catch {
                /* ignore unreadable folders */
            }
        }

        searchDir(searchPath);
        return results;
    });

    ipcMain.handle('app:getVersion', () => app.getVersion());
    ipcMain.handle('app:getPlatform', () => process.platform);
    ipcMain.handle('official:verifyBuild', async () => {
        try {
            return await verifyOfficialBuild();
        } catch (err) {
            return {
                channelLocked: true,
                owner: OFFICIAL_OWNER,
                repo: OFFICIAL_REPO,
                appVersion: app.getVersion(),
                packaged: app.isPackaged,
                localAsarPath: getLocalAsarPath(),
                localAsarSha256: null,
                status: 'error',
                reason: (err as Error).message || 'Verification failed.',
                reasonKey: 'ui.official.verifyFailed',
                reasonFallback: 'Verification failed: {error}',
                reasonParams: {
                    error: (err as Error).message || String(err),
                },
            } as BuildVerificationResult;
        }
    });
    ipcMain.handle('official:checkUpdates', async (_, preference?: UpdateAssetPreference) => (
        await getOfficialUpdateStatus(preference, { triggerInAppCheck: true })
    ));
    ipcMain.handle('official:getUpdateStatus', async (_, preference?: UpdateAssetPreference) => (
        await getOfficialUpdateStatus(preference, { triggerInAppCheck: false })
    ));

    ipcMain.handle('marketplace:getList', async () => {
        const dir = path.join(os.homedir(), '.craftide');
        const file = path.join(dir, 'marketplace.json');
        try {
            if (!fs.existsSync(file)) return [];
            const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as { blueprints?: unknown[] };
            return Array.isArray(raw.blueprints) ? raw.blueprints : [];
        } catch {
            return [];
        }
    });

    ipcMain.handle('marketplace:publish', async (_, blueprint: Record<string, unknown>) => {
        try {
            const dir = path.join(os.homedir(), '.craftide');
            const file = path.join(dir, 'marketplace.json');
            fs.mkdirSync(dir, { recursive: true });
            let existing: { version: number; blueprints: Array<Record<string, unknown>> } = { version: 1, blueprints: [] };
            if (fs.existsSync(file)) {
                try {
                    existing = JSON.parse(fs.readFileSync(file, 'utf-8')) as { version: number; blueprints: Array<Record<string, unknown>> };
                } catch {
                    /* ignore parse errors */
                }
                if (!Array.isArray(existing.blueprints)) existing.blueprints = [];
            }
            blueprint.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            blueprint.created = new Date().toISOString().split('T')[0];
            existing.blueprints.push(blueprint);
            fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf-8');
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    });
}
