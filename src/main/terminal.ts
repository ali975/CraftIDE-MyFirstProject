import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { BrowserWindow, ipcMain } from 'electron';

/**
 * CraftIDE Terminal Manager
 * child_process ile gerçek shell (PowerShell/cmd/bash) entegrasyonu
 */

interface TerminalInstance {
    id: number;
    process: ChildProcess;
    cwd: string;
}

let nextTerminalId = 1;
const terminals = new Map<number, TerminalInstance>();

export function registerTerminalHandlers(mainWindow: BrowserWindow): void {
    // Yeni terminal oluştur
    ipcMain.handle('terminal:create', (_event, cwd?: string) => {
        const id = nextTerminalId++;
        const workingDir = cwd || os.homedir();

        // Platform'a göre shell seç
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'powershell.exe' : (process.env.SHELL || '/bin/bash');
        const shellArgs = isWindows ? ['-NoLogo', '-NoProfile'] : [];

        const proc = spawn(shell, shellArgs, {
            cwd: workingDir,
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
        });

        const terminal: TerminalInstance = { id, process: proc, cwd: workingDir };
        terminals.set(id, terminal);

        // stdout → renderer
        proc.stdout?.on('data', (data: Buffer) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('terminal:output', id, data.toString('utf-8'));
            }
        });

        // stderr → renderer
        proc.stderr?.on('data', (data: Buffer) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('terminal:output', id, data.toString('utf-8'));
            }
        });

        // Process kapandığında
        proc.on('close', (code: number | null) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('terminal:exit', id, code);
            }
            terminals.delete(id);
        });

        proc.on('error', (err: Error) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('terminal:output', id, `\r\n[HATA] ${err.message}\r\n`);
            }
        });

        return { id, cwd: workingDir, shell };
    });

    // Terminal'e komut gönder
    ipcMain.handle('terminal:write', (_event, id: number, data: string) => {
        const terminal = terminals.get(id);
        if (terminal && terminal.process.stdin) {
            terminal.process.stdin.write(data);
            return true;
        }
        return false;
    });

    // Terminal'i kapat
    ipcMain.handle('terminal:kill', (_event, id: number) => {
        const terminal = terminals.get(id);
        if (terminal) {
            terminal.process.kill();
            terminals.delete(id);
            return true;
        }
        return false;
    });

    // Tüm terminalleri kapat (app kapanırken)
    ipcMain.handle('terminal:killAll', () => {
        terminals.forEach((t) => {
            try { t.process.kill(); } catch (e) { /* ignore */ }
        });
        terminals.clear();
        return true;
    });
}

// App kapanırken cleanup
export function cleanupTerminals(): void {
    terminals.forEach((t) => {
        try { t.process.kill(); } catch (e) { /* ignore */ }
    });
    terminals.clear();
}
