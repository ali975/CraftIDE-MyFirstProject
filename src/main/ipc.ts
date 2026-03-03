import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectScaffolder } from './scaffolder';

/**
 * CraftIDE IPC Handlers
 * Renderer ↔ Main iletişim kanalları
 */
export function registerIpcHandlers(): void {
    const scaffolder = new ProjectScaffolder();

    // ─── Dosya Sistemi ─────────────────────────────────────

    ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            return entries.map((e) => ({
                name: e.name,
                isDirectory: e.isDirectory(),
                path: path.join(dirPath, e.name),
                ext: path.extname(e.name).toLowerCase(),
            }));
        } catch (err) {
            return [];
        }
    });

    ipcMain.handle('fs:readFile', async (_, filePath: string) => {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            return null;
        }
    });

    ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        } catch (err) {
            return false;
        }
    });

    ipcMain.handle('fs:exists', async (_, filePath: string) => {
        return fs.existsSync(filePath);
    });

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
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            if (fs.existsSync(filePath)) {
                return { success: false, error: 'Dosya zaten mevcut' };
            }
            fs.writeFileSync(filePath, content || '', 'utf-8');
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
        try {
            if (fs.existsSync(newPath)) {
                return { success: false, error: 'Bu isimde dosya/klasör zaten mevcut' };
            }
            fs.renameSync(oldPath, newPath);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('fs:delete', async (_, targetPath: string) => {
        try {
            const stat = fs.statSync(targetPath);
            if (stat.isDirectory()) {
                fs.rmSync(targetPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(targetPath);
            }
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('fs:copyPath', async (_, filePath: string) => {
        const { clipboard } = require('electron');
        clipboard.writeText(filePath);
        return true;
    });

    ipcMain.handle('fs:openInExplorer', async (_, filePath: string) => {
        const { shell } = require('electron');
        shell.showItemInFolder(filePath);
        return true;
    });

    // ─── Diyaloglar ────────────────────────────────────────

    ipcMain.handle('dialog:openFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Proje Klasörü Seç',
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    });

    ipcMain.handle('dialog:openFile', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            title: 'Dosya Aç',
            filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Java', extensions: ['java'] },
                { name: 'Skript', extensions: ['sk'] },
                { name: 'YAML', extensions: ['yml', 'yaml'] },
                { name: 'JSON', extensions: ['json'] },
                { name: 'XML', extensions: ['xml'] },
            ],
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    });

    ipcMain.handle('dialog:saveFile', async (_, defaultPath?: string) => {
        const result = await dialog.showSaveDialog({
            title: 'Farklı Kaydet',
            defaultPath: defaultPath,
        });
        return result.canceled ? null : result.filePath;
    });

    ipcMain.handle('dialog:showMessage', async (_, options: Electron.MessageBoxOptions) => {
        const result = await dialog.showMessageBox(options);
        return result.response;
    });

    // ─── Proje Oluşturma ───────────────────────────────────

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
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

    // ─── Build Sistemi ─────────────────────────────────────

    ipcMain.handle('build:run', async (_, projectPath: string) => {
        const { exec } = require('child_process');
        return new Promise((resolve) => {
            // pom.xml veya build.gradle kontrol et
            const hasMaven = fs.existsSync(path.join(projectPath, 'pom.xml'));
            const hasGradle = fs.existsSync(path.join(projectPath, 'build.gradle'));

            let command = '';
            if (hasMaven) {
                command = 'mvn clean package -q';
            } else if (hasGradle) {
                command = process.platform === 'win32' ? 'gradlew.bat build' : './gradlew build';
            } else {
                resolve({ success: false, error: 'No build file found (pom.xml or build.gradle)' });
                return;
            }

            exec(command, { cwd: projectPath }, (error: any, stdout: string, stderr: string) => {
                if (error) {
                    resolve({ success: false, error: stderr || error.message, output: stdout });
                } else {
                    resolve({ success: true, output: stdout });
                }
            });
        });
    });

    // ─── Dosya Arama ───────────────────────────────────────

    ipcMain.handle('search:files', async (_, searchPath: string, query: string) => {
        const results: { file: string; line: number; preview: string }[] = [];
        if (!query || query.length < 2 || !searchPath) return results;

        const ignoreDirs = new Set(['.git', 'node_modules', 'target', 'out', 'dist', 'release', '.idea', 'build']);
        const textExts = new Set(['.java', '.sk', '.yml', '.yaml', '.json', '.xml', '.properties', '.md', '.txt', '.gradle', '.js', '.ts', '.css', '.html', '.py', '.sh', '.bat', '.ps1', '.toml', '.cfg', '.conf']);

        function searchDir(dir: string) {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (results.length >= 100) return; // limit
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (!ignoreDirs.has(entry.name) && !entry.name.startsWith('.')) {
                            searchDir(fullPath);
                        }
                    } else {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (textExts.has(ext)) {
                            try {
                                const content = fs.readFileSync(fullPath, 'utf-8');
                                const lines = content.split('\n');
                                const lowerQuery = query.toLowerCase();
                                for (let i = 0; i < lines.length; i++) {
                                    if (lines[i].toLowerCase().includes(lowerQuery)) {
                                        results.push({
                                            file: fullPath,
                                            line: i + 1,
                                            preview: lines[i].trim().substring(0, 200),
                                        });
                                        if (results.length >= 100) return;
                                    }
                                }
                            } catch { /* skip unreadable */ }
                        }
                    }
                }
            } catch { /* skip */ }
        }

        searchDir(searchPath);
        return results;
    });

    // ─── Uygulama Bilgisi ──────────────────────────────────

    ipcMain.handle('app:getVersion', () => {
        return '0.1.0';
    });

    ipcMain.handle('app:getPlatform', () => {
        return process.platform;
    });
}
