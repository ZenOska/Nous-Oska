import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
  },
  platform: {
    get: () => ipcRenderer.invoke('platform:get'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
} as const;

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
