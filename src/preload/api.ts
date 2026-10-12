import type { IpcRenderer } from 'electron';
import type { ElectronAPI } from './types.js';

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export function validateExternalUrl(url: string): string {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('External URL must be a non-empty string');
  }

  const trimmed = url.trim();
  const parsed = new URL(trimmed);

  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Disallowed protocol for external navigation: ${parsed.protocol}`);
  }

  return parsed.href;
}

export function createElectronAPI(ipc: Pick<IpcRenderer, 'invoke'>): ElectronAPI {
  const api: ElectronAPI = {
    app: Object.freeze({
      getVersion: () => ipc.invoke('app:getVersion'),
      getName: () => ipc.invoke('app:getName'),
    }),
    platform: Object.freeze({
      get: () => ipc.invoke('platform:get'),
    }),
    shell: Object.freeze({
      openExternal: (url: string) => {
        const validatedUrl = validateExternalUrl(url);
        return ipc.invoke('shell:openExternal', validatedUrl);
      },
    }),
    window: Object.freeze({
      minimize: () => ipc.invoke('window:minimize'),
      maximize: () => ipc.invoke('window:maximize'),
      unmaximize: () => ipc.invoke('window:unmaximize'),
      toggleMaximize: () => ipc.invoke('window:toggleMaximize'),
      close: () => ipc.invoke('window:close'),
      isMaximized: () => ipc.invoke('window:isMaximized'),
      getState: () => ipc.invoke('window:getState'),
    }),
  };

  return Object.freeze(api);
}
