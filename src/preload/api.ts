import type { IpcRenderer } from 'electron';
import type {
  ElectronAPI,
  NavigationCapabilities,
  NavigationHistoryAction,
  NavigationRequest,
  NavigationStateChange,
  WindowState,
} from './types.js';

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export type IpcBridge = Pick<IpcRenderer, 'invoke'> & {
  on?: (channel: string, listener: (...args: unknown[]) => void) => unknown;
  removeListener?: (channel: string, listener: (...args: unknown[]) => void) => unknown;
};

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

export function validateNavigationRequest(request: NavigationRequest): NavigationRequest {
  if (!request || typeof request !== 'object') {
    throw new Error('Navigation request must be an object');
  }
  if (typeof request.tabId !== 'string' || !request.tabId.trim()) {
    throw new Error('Navigation tabId must be a non-empty string');
  }
  if (typeof request.url !== 'string' || !request.url.trim()) {
    throw new Error('Navigation URL must be a non-empty string');
  }
  return request;
}

export function createElectronAPI(ipc: IpcBridge): ElectronAPI {
  const api: ElectronAPI = {
    app: Object.freeze({
      getVersion: () => ipc.invoke('app:getVersion') as Promise<string>,
      getName: () => ipc.invoke('app:getName') as Promise<string>,
    }),
    platform: Object.freeze({
      get: () => ipc.invoke('platform:get') as Promise<string>,
    }),
    shell: Object.freeze({
      openExternal: (url: string) => {
        const validatedUrl = validateExternalUrl(url);
        return ipc.invoke('shell:openExternal', validatedUrl) as Promise<void>;
      },
    }),
    window: Object.freeze({
      minimize: () => ipc.invoke('window:minimize') as Promise<void>,
      maximize: () => ipc.invoke('window:maximize') as Promise<void>,
      unmaximize: () => ipc.invoke('window:unmaximize') as Promise<void>,
      toggleMaximize: () => ipc.invoke('window:toggleMaximize') as Promise<void>,
      close: () => ipc.invoke('window:close') as Promise<void>,
      isMaximized: () => ipc.invoke('window:isMaximized') as Promise<boolean>,
      getState: () => ipc.invoke('window:getState') as Promise<WindowState | null>,
    }),
    navigation: Object.freeze({
      loadUrl: (request: NavigationRequest) => {
        const validated = validateNavigationRequest(request);
        return ipc.invoke('navigation:loadUrl', validated) as Promise<void>;
      },
      getState: (tabId?: string) =>
        ipc.invoke('navigation:getState', tabId) as Promise<NavigationStateChange | null>,
      onStateChange: (callback: (state: NavigationStateChange) => void) => {
        const listener = (_event: unknown, ...args: unknown[]) => {
          callback(args[0] as NavigationStateChange);
        };
        ipc.on?.('navigation:stateChange', listener);
        return () => {
          ipc.removeListener?.('navigation:stateChange', listener);
        };
      },
      goBack: (action?: NavigationHistoryAction) =>
        ipc.invoke('navigation:goBack', action) as Promise<boolean>,
      getCapabilities: (tabId?: string) =>
        ipc.invoke('navigation:getCapabilities', tabId) as Promise<NavigationCapabilities>,
      onCapabilitiesChange: (callback: (capabilities: NavigationCapabilities) => void) => {
        const listener = (_event: unknown, ...args: unknown[]) => {
          callback(args[0] as NavigationCapabilities);
        };
        ipc.on?.('navigation:capabilities', listener);
        return () => {
          ipc.removeListener?.('navigation:capabilities', listener);
        };
      },
    }),
  };

  return Object.freeze(api);
}
