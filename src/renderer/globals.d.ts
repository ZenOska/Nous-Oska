export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  isVisible: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
  };
  platform: {
    get: () => Promise<string>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    unmaximize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    getState: () => Promise<WindowState | null>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    close?: () => void;
  }
}

export {};
