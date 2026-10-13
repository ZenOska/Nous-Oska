import { contextBridge, ipcRenderer } from 'electron';
import { createElectronAPI } from './api.js';
import type { ElectronAPI } from './types.js';

export * from './types.js';
export * from './api.js';

export const electronAPI = createElectronAPI(ipcRenderer);

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} catch {
  // Graceful fallback when executed in non-Electron test or script environments
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
