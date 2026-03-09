import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';

export type BuildRunResult = {
    success: boolean;
    output: string;
    error: string;
    command?: string;
};

export function extractCompileErrors(text: string): string[] {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const picked: string[] = [];
    for (const line of lines) {
        if (/\[ERROR\]/i.test(line) || /\berror:/i.test(line) || /cannot find symbol/i.test(line) || /exception/i.test(line)) {
            picked.push(line);
        }
    }
    return picked.slice(0, 50);
}

export async function runBuild(projectPath: string): Promise<BuildRunResult> {
    const hasMaven = fs.existsSync(path.join(projectPath, 'pom.xml'));
    const hasGradle = fs.existsSync(path.join(projectPath, 'build.gradle'));

    let command = '';
    if (hasMaven) command = 'mvn clean package -q';
    else if (hasGradle) command = process.platform === 'win32' ? 'gradlew.bat build' : './gradlew build';
    else return { success: false, output: '', error: 'No build file found (pom.xml or build.gradle)' };

    return new Promise((resolve) => {
        exec(command, { cwd: projectPath, encoding: 'utf8' }, (error: Error | null, stdout: string, stderr: string) => {
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

export function findJarArtifact(projectPath: string): string | null {
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

export function findSkriptArtifact(projectPath: string): string | null {
    const entries = fs.readdirSync(projectPath, { withFileTypes: true });
    const skripts = entries.filter((e) => e.isFile() && e.name.endsWith('.sk')).map((e) => path.join(projectPath, e.name));
    return skripts.length ? skripts[0] : null;
}

export function hashFileSha256(filePath: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

export async function zipFiles(files: string[], destinationZip: string): Promise<{ success: boolean; warning?: string }> {
    if (!files.length) return { success: false, warning: 'No files to zip.' };

    if (process.platform === 'win32') {
        const paths = files.map((f) => `'${f.replace(/'/g, "''")}'`).join(',');
        const script = `Compress-Archive -Path ${paths} -DestinationPath '${destinationZip.replace(/'/g, "''")}' -Force`;
        return new Promise((resolve) => {
            exec(`powershell -NoProfile -Command "${script}"`, { encoding: 'utf8' }, (err) => {
                if (err) resolve({ success: false, warning: 'Compress-Archive failed. Returning raw files instead.' });
                else resolve({ success: true });
            });
        });
    }

    return new Promise((resolve) => {
        const args = files.map((f) => `"${f}"`).join(' ');
        exec(`zip -j "${destinationZip}" ${args}`, { encoding: 'utf8' }, (err) => {
            if (err) resolve({ success: false, warning: 'zip command failed. Returning raw files instead.' });
            else resolve({ success: true });
        });
    });
}

export async function createReleasePackage(request: { projectPath: string; targetType?: 'jar' | 'sk' | 'zip'; includeDocs?: boolean }) {
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
        if (!build.success) return { success: false, error: build.error || 'Build failed before release packaging.' };
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

    for (const f of outputFiles) checksums.push({ file: f, sha256: hashFileSha256(f) });

    return {
        success: true,
        outputFiles,
        checksum: checksums,
        warning,
    };
}
