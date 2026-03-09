import { contextBridge, ipcRenderer } from 'electron';

const api = {
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, listener: (...args: unknown[]) => void) => {
        const wrapped = (_event: unknown, ...args: unknown[]) => listener(...args);
        ipcRenderer.on(channel, wrapped);
        return () => ipcRenderer.removeListener(channel, wrapped);
    },
};

try {
    contextBridge.exposeInMainWorld('CraftIDEBridge', api);
} catch {
    // Context isolation is still disabled for backward compatibility.
    // Mirror the bridge on window so renderer modules can adopt it incrementally.
    (globalThis as typeof globalThis & { CraftIDEBridge?: typeof api }).CraftIDEBridge = api;
}
